const https = require('https');
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Verified extraction keys for LunarX vermillion cipher
const DEFAULT_AXIS = 'LqVVXhKGmruGmMDZyIWW5ZTkKz3IMChM6BzpJI2w02E9u8ivKdxYxxPgqMpPAVvUhjkk3WFYDirMyxLTDvbuq97FeotHEaHk';
const DEFAULT_PITCH = 'HPt5vdm6L9e2IWeEXYbfP62Skug3nwvYiXUEey4OuGHy0nxV4GbXErmQNhQaF4N5KzKxwhqvutvkSFfh';
const KEYS_CACHE_FILE = path.join(__dirname, '..', 'data', 'lunarx_keys.json');

class LunarXService {
  constructor() {
    this.apiHost = 'api.lunarx.to';
    this.axis = DEFAULT_AXIS;
    this.pitch = DEFAULT_PITCH;
    this.globalKeys = null;
    this.cache = new Map();
    this.cacheTTL = 15 * 60 * 1000; // 15 minutes TTL for metadata
    this.loadCachedKeysFromDisk();
  }

  loadCachedKeysFromDisk() {
    try {
      if (fs.existsSync(KEYS_CACHE_FILE)) {
        const raw = fs.readFileSync(KEYS_CACHE_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.axis && parsed.pitch) {
          this.axis = parsed.axis;
          this.pitch = parsed.pitch;
          this.globalKeys = {
            axis: parsed.axis,
            pitch: parsed.pitch,
            timestamp: parsed.updatedAt || Date.now()
          };
          console.log('[LunarX] Loaded cipher keys from disk cache');
          return true;
        }
      }
    } catch (e) {
      console.warn('[LunarX] Failed to read keys from disk:', e.message);
    }
    return false;
  }

  saveKeysToDisk(axis, pitch) {
    try {
      const dir = path.dirname(KEYS_CACHE_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(KEYS_CACHE_FILE, JSON.stringify({
        axis,
        pitch,
        updatedAt: Date.now()
      }, null, 2), 'utf8');
      console.log('[LunarX] Saved live cipher keys to disk cache');
    } catch (e) {
      console.warn('[LunarX] Failed to save keys to disk:', e.message);
    }
  }

  // Blend algorithm matching LunarX bundle 817263 / 148453
  blend(e, t) {
    if (!e || !t) return [];
    const hash = crypto.createHash('sha256').update(e + '\x01' + t).digest();
    const len = Math.max(e.length, t.length);
    const a = new Array(len);
    for (let n = 0; n < len; n++) {
      a[n] = (e.charCodeAt(n % e.length) ^ t.charCodeAt(n % t.length) ^ hash[n % 32] ^ (83 * n + 29 & 255)) & 255;
    }
    return a;
  }

  // Decrypt base64-xor obfuscated stream URLs
  decryptM3u8(encryptedUrl, customAxis, customPitch) {
    if (!encryptedUrl) return null;
    if (encryptedUrl.startsWith('http://') || encryptedUrl.startsWith('https://')) {
      return encryptedUrl;
    }
    const ax = customAxis || this.axis;
    const pi = customPitch || this.pitch;
    try {
      const n = this.blend(ax, pi);
      const b64 = encryptedUrl.replace(/-/g, '+').replace(/_/g, '/');
      const bin = Buffer.from(b64, 'base64').toString('binary');
      const chars = Array.from(bin).map((c, idx) => c.charCodeAt(0) ^ n[idx % n.length]);
      const decrypted = String.fromCharCode(...chars);
      if (decrypted.startsWith('http://') || decrypted.startsWith('https://')) {
        return decrypted;
      }
      return null;
    } catch (err) {
      console.error('[LunarX] Failed to decrypt m3u8:', err.message);
      return null;
    }
  }

  // Sanitize AniList descriptions (strip raw HTML tags like <br>, <i>, <p> while preserving spacing)
  cleanDescription(desc) {
    if (!desc) return '';
    return String(desc)
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&#039;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }


  // Universal GET JSON helper with LunarX headers
  async get(path) {
    const isStreamSource = path.includes('/vermillion/sources') || path.includes('/3rdprovider');
    const effectiveTTL = isStreamSource ? 60 * 1000 : this.cacheTTL;

    const cacheKey = `GET:${path}`;
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < effectiveTTL)) {
      return cached.data;
    }

    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.apiHost,
        path: path,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Referer': 'https://lunarx.to/',
          'Origin': 'https://lunarx.to'
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsed = JSON.parse(body);
              this.cache.set(cacheKey, { data: parsed, timestamp: Date.now() });
              resolve(parsed);
            } catch (e) {
              reject(new Error(`Failed to parse JSON from ${path}: ${e.message}`));
            }
          } else {
            reject(new Error(`LunarX API request to ${path} failed with status ${res.statusCode}`));
          }
        });
      });

      req.on('error', (err) => reject(err));
      req.setTimeout(12000, () => {
        req.destroy();
        reject(new Error(`LunarX API request to ${path} timed out`));
      });
      req.end();
    });
  }

  // Get seasonal trending anime
  async getTrending() {
    try {
      const res = await this.get('/api/animes/trending');
      const data = res.data || {};

      const formatMedia = (item) => {
        if (!item) return null;
        return {
          anilistId: item.id,
          title: item.title?.english || item.title?.romaji || 'Untitled Anime',
          romajiTitle: item.title?.romaji,
          englishTitle: item.title?.english,
          poster: item.coverImage?.large || item.coverImage?.extraLarge || null,
          banner: item.bannerImage || null,
          popularity: item.popularity || 0,
          trending: item.trending || 0,
          isLunar: true
        };
      };

      return {
        popularThisSeason: (data.popularThisSeason?.media || []).map(formatMedia).filter(Boolean),
        trendingNow: (data.trendingNow?.media || []).map(formatMedia).filter(Boolean),
        upcomingNextSeason: (data.upcomingNextSeason?.media || []).map(formatMedia).filter(Boolean)
      };
    } catch (err) {
      console.error('[LunarX] getTrending error:', err.message);
      return { popularThisSeason: [], trendingNow: [], upcomingNextSeason: [] };
    }
  }

  // Search anime catalog via AniList GraphQL
  async search(queryText, limit = 12) {
    if (!queryText || !queryText.trim()) return [];

    const gqlQuery = `
      query ($search: String, $perPage: Int) {
        Page(page: 1, perPage: $perPage) {
          media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
            id
            title {
              english
              romaji
              userPreferred
            }
            coverImage {
              large
              extraLarge
            }
            bannerImage
            episodes
            averageScore
            genres
            description(asHtml: false)
            seasonYear
            status
          }
        }
      }
    `;

    return new Promise((resolve) => {
      const postData = JSON.stringify({ query: gqlQuery, variables: { search: queryText.trim(), perPage: limit } });
      const req = https.request('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }, res => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
          try {
            const json = JSON.parse(body);
            const mediaList = json.data?.Page?.media || [];
            const results = mediaList.map(m => ({
              anilistId: m.id,
              title: m.title?.english || m.title?.romaji || m.title?.userPreferred || 'Untitled Anime',
              romajiTitle: m.title?.romaji,
              englishTitle: m.title?.english,
              poster: m.coverImage?.extraLarge || m.coverImage?.large,
              banner: m.bannerImage,
              episodes: m.episodes || 0,
              rating: m.averageScore ? (m.averageScore / 10).toFixed(1) : '8.5',
              genres: m.genres || [],
              year: m.seasonYear || null,
              description: this.cleanDescription(m.description),
              isLunar: true
            }));
            resolve(results);
          } catch (e) {
            resolve([]);
          }
        });
      });

      req.on('error', () => resolve([]));
      req.setTimeout(8000, () => {
        req.destroy();
        resolve([]);
      });
      req.write(postData);
      req.end();
    });
  }

  // Advanced Browse Anime catalog with filters (search, genre, format, season, year, status, sort, page, perPage)
  async browse({ search, genre, format, season, year, status, sort = 'TRENDING_DESC', page = 1, perPage = 20 } = {}) {
    const cacheKey = `browse:${JSON.stringify({ search, genre, format, season, year, status, sort, page, perPage })}`;
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < this.cacheTTL)) {
      return cached.data;
    }

    const gqlQuery = `
      query ($page: Int, $perPage: Int, $search: String, $genre: String, $format: MediaFormat, $season: MediaSeason, $seasonYear: Int, $status: MediaStatus, $sort: [MediaSort]) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            total
            perPage
            currentPage
            lastPage
            hasNextPage
          }
          media(search: $search, genre: $genre, format: $format, season: $season, seasonYear: $seasonYear, status: $status, sort: $sort, type: ANIME) {
            id
            title {
              english
              romaji
              userPreferred
            }
            coverImage {
              large
              extraLarge
            }
            bannerImage
            format
            episodes
            averageScore
            genres
            seasonYear
            season
            status
            description(asHtml: false)
          }
        }
      }
    `;

    const variables = {
      page: parseInt(page, 10) || 1,
      perPage: parseInt(perPage, 10) || 20,
      sort: Array.isArray(sort) ? sort : [sort]
    };
    if (search && search.trim()) variables.search = search.trim();
    if (genre && genre !== 'all' && genre !== 'All') variables.genre = genre;
    if (format && format !== 'all' && format !== 'All') variables.format = format;
    if (season && season !== 'all' && season !== 'All') variables.season = season.toUpperCase();
    if (year && parseInt(year, 10)) variables.seasonYear = parseInt(year, 10);
    if (status && status !== 'all' && status !== 'All') variables.status = status.toUpperCase();

    return new Promise((resolve) => {
      const postData = JSON.stringify({ query: gqlQuery, variables });
      const req = https.request('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }, res => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
          try {
            const json = JSON.parse(body);
            const pageData = json.data?.Page;
            const mediaList = pageData?.media || [];
            const results = {
              pageInfo: pageData?.pageInfo || { currentPage: page, hasNextPage: false },
              media: mediaList.map(m => ({
                id: `lunar-${m.id}`,
                anilistId: m.id,
                title: m.title?.english || m.title?.romaji || m.title?.userPreferred || 'Untitled Anime',
                romajiTitle: m.title?.romaji,
                englishTitle: m.title?.english,
                poster: m.coverImage?.extraLarge || m.coverImage?.large,
                banner: m.bannerImage,
                format: m.format,
                episodes: m.episodes || 0,
                rating: m.averageScore ? (m.averageScore / 10).toFixed(1) : '8.5',
                genres: m.genres || [],
                year: m.seasonYear || null,
                season: m.season,
                status: m.status,
                description: this.cleanDescription(m.description),
                isLunar: true
              }))
            };
            this.cache.set(cacheKey, { data: results, timestamp: Date.now() });
            resolve(results);
          } catch (e) {
            resolve({ pageInfo: { currentPage: page, hasNextPage: false }, media: [] });
          }
        });
      });

      req.on('error', () => resolve({ pageInfo: { currentPage: page, hasNextPage: false }, media: [] }));
      req.setTimeout(10000, () => {
        req.destroy();
        resolve({ pageInfo: { currentPage: page, hasNextPage: false }, media: [] });
      });
      req.write(postData);
      req.end();
    });
  }

  // AniList GraphQL media fallback helper
  async getAniListMedia(id) {
    const gqlQuery = `query ($id: Int) {
      Media(id: $id) {
        id
        title { english romaji userPreferred }
        coverImage { extraLarge large }
        bannerImage
        episodes
        averageScore
        genres
        description(asHtml: false)
        seasonYear
        season
        status
        relations {
          edges {
            relationType
            node {
              id
              title { english romaji userPreferred }
              format
              status
              seasonYear
              episodes
              coverImage { extraLarge large }
              bannerImage
            }
          }
        }
      }
    }`;
    return new Promise((resolve) => {
      const postData = JSON.stringify({ query: gqlQuery, variables: { id } });
      const req = https.request('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }, res => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
          try {
            const json = JSON.parse(body);
            const m = json.data?.Media;
            if (!m) return resolve(null);
            const title = m.title?.english || m.title?.romaji || m.title?.userPreferred || 'Untitled Anime';
            const poster = m.coverImage?.extraLarge || m.coverImage?.large || null;
            const banner = m.bannerImage || poster;

            const edges = m.relations?.edges || [];
            const relatedSeasons = edges
              .filter(e => ['PREQUEL', 'SEQUEL', 'PARENT', 'SIDE_STORY'].includes(e.relationType) && e.node)
              .map((e, idx) => {
                const node = e.node;
                const p = node.coverImage?.extraLarge || node.coverImage?.large || null;
                const b = node.bannerImage || p;
                return {
                  id: `lunar-${node.id}`,
                  anilistId: node.id,
                  title: node.title?.english || node.title?.romaji || node.title?.userPreferred || `Season ${idx + 1}`,
                  englishTitle: node.title?.english,
                  romajiTitle: node.title?.romaji,
                  seasonNumber: idx + 1,
                  type: node.format || 'TV',
                  relation: e.relationType,
                  year: node.seasonYear || null,
                  episodes: node.episodes || 0,
                  poster: p,
                  banner: b,
                  isCurrent: node.id === id,
                  isLunar: true
                };
              });

            if (!relatedSeasons.some(s => s.anilistId === id)) {
              relatedSeasons.push({
                id: `lunar-${id}`,
                anilistId: id,
                title: title,
                englishTitle: m.title?.english,
                romajiTitle: m.title?.romaji,
                seasonNumber: relatedSeasons.length + 1,
                type: 'TV',
                relation: 'Current',
                year: m.seasonYear || null,
                episodes: m.episodes || 0,
                poster: poster,
                banner: banner,
                isCurrent: true,
                isLunar: true
              });
            }

            resolve({
              anilistId: m.id,
              title: title,
              englishTitle: m.title?.english,
              romajiTitle: m.title?.romaji,
              description: this.cleanDescription(m.description || ''),
              rating: m.averageScore ? (m.averageScore / 10).toFixed(1) : '8.5',
              year: m.seasonYear || null,
              season: m.season,
              genres: m.genres || [],
              studios: [],
              status: m.status,
              episodeCount: m.episodes || 0,
              poster: poster,
              banner: banner,
              artworks: {
                posters: poster ? [poster] : [],
                banners: banner ? [banner] : [],
                fanarts: [],
                logos: []
              },
              seasons: relatedSeasons,
              relations: edges.map(e => ({
                id: `lunar-${e.node.id}`,
                anilistId: e.node.id,
                relationType: e.relationType,
                title: e.node.title?.english || e.node.title?.romaji || e.node.title?.userPreferred,
                poster: e.node.coverImage?.large,
                isLunar: true
              })),
              isLunar: true
            });
          } catch (e) {
            resolve(null);
          }
        });
      });
      req.on('error', () => resolve(null));
      req.setTimeout(8000, () => { req.destroy(); resolve(null); });
      req.write(postData);
      req.end();
    });
  }

  // Get full show metadata, artworks (posters, banners, fanarts, logos)
  async getInfo(anilistId) {
    const id = parseInt(anilistId, 10);
    if (!id) throw new Error('Invalid anilistId');

    let res = null;
    try {
      res = await this.get(`/api/anidb/info?anilistId=${id}`);
    } catch (e) {
      // Fallback to AniList GraphQL below
    }

    if (res && (res.englishTitle || res.romajiTitle)) {
      const artworks = res.artworks || [];
      const posters = artworks.filter(a => a.type === 'Poster').map(a => a.url);
      const banners = artworks.filter(a => a.type === 'Banner').map(a => a.url);
      const fanarts = artworks.filter(a => a.type === 'Fanart').map(a => a.url);
      const logos = artworks.filter(a => a.type === 'Clearlogo').map(a => a.url);

      const primaryPoster = posters[0] || res.coverImage || (res.coverImages && res.coverImages[0]) || null;
      const primaryBanner = banners[0] || fanarts[0] || res.bannerUrl || res.bannerImage || res.backdropUrl || primaryPoster;

      // Parse all seasons and franchise entries
      const rawSeasons = Array.isArray(res.seasons) ? res.seasons : [];
      let seasons = rawSeasons.map((s, idx) => {
        const sid = s.anilistId || s.id;
        const posterUrl = s.coverImage?.extraLarge || s.coverImage?.large || s.image || s.poster || null;
        const bannerUrl = s.bannerImage || s.backdropUrl || null;
        return {
          id: `lunar-${sid}`,
          anilistId: sid,
          title: s.titleEnglish || s.title || s.titleRomaji || `Season ${idx + 1}`,
          englishTitle: s.titleEnglish || s.title,
          romajiTitle: s.titleRomaji || s.title,
          seasonNumber: idx + 1,
          type: s.type || 'TV',
          relation: s.relation || null,
          year: s.year || s.seasonYear || null,
          rating: s.rating || (s.averageScore ? (s.averageScore / 10).toFixed(1) : null),
          episodes: s.episodes || s.episodeCount || 0,
          poster: posterUrl,
          banner: bannerUrl,
          isCurrent: sid === id,
          isLunar: true
        };
      });

      // If no seasons array but relations exist, extract prequels & sequels
      if (seasons.length === 0 && Array.isArray(res.relations) && res.relations.length > 0) {
        const relatedMedia = res.relations.filter(r => ['PREQUEL', 'SEQUEL', 'PARENT', 'SIDE_STORY', 'Prequel', 'Sequel'].includes(r.relationType || r.relation));
        seasons = relatedMedia.map((r, idx) => ({
          id: `lunar-${r.anilistId || r.id}`,
          anilistId: r.anilistId || r.id,
          title: r.titleEnglish || r.title || r.titleRomaji,
          englishTitle: r.titleEnglish || r.title,
          romajiTitle: r.titleRomaji || r.title,
          seasonNumber: idx + 1,
          type: r.type || 'TV',
          relation: r.relationType || r.relation,
          year: r.year || null,
          rating: r.rating || (r.averageScore ? (r.averageScore / 10).toFixed(1) : null),
          episodes: r.episodes || 0,
          poster: r.coverImage?.large || r.image || null,
          banner: r.bannerImage || r.backdropUrl || null,
          isCurrent: (r.anilistId || r.id) === id,
          isLunar: true
        }));
      }

      // If current show is not in seasons list, include it
      if (seasons.length > 0 && !seasons.some(s => s.anilistId === id)) {
        seasons.push({
          id: `lunar-${id}`,
          anilistId: id,
          title: res.englishTitle || res.romajiTitle || 'Current Season',
          englishTitle: res.englishTitle,
          romajiTitle: res.romajiTitle,
          seasonNumber: seasons.length + 1,
          type: 'TV',
          relation: 'Current',
          year: res.seasonYear || res.year || null,
          rating: res.averageScore ? (res.averageScore / 10).toFixed(1) : '8.8',
          episodes: res.totalEpisodes || res.episodeCount || 0,
          poster: primaryPoster,
          banner: primaryBanner,
          isCurrent: true,
          isLunar: true
        });
      }

      return {
        anilistId: id,
        title: res.englishTitle || res.romajiTitle || 'Untitled Anime',
        englishTitle: res.englishTitle,
        romajiTitle: res.romajiTitle,
        description: this.cleanDescription(res.synopsis || res.description || ''),
        rating: res.averageScore ? (res.averageScore / 10).toFixed(1) : (res.rating || '8.8'),
        year: res.seasonYear || res.year || null,
        season: res.season,
        genres: res.genres || [],
        studios: res.studios || res.altStudios || [],
        status: res.status,
        episodeCount: res.totalEpisodes || res.episodeCount || (Array.isArray(res.episodes) ? res.episodes.length : 0),
        poster: primaryPoster,
        banner: primaryBanner,
        artworks: { posters, banners, fanarts, logos },
        seasons: seasons,
        relations: res.relations || [],
        trailerId: res.trailerId || null,
        thetvdbId: res.thetvdbId || null,
        malId: res.malId || null,
        imdbId: res.imdbId || null,
        isLunar: true
      };
    }

    // Resilient fallback to AniList GraphQL
    try {
      const gqlRes = await this.getAniListMedia(id);
      if (gqlRes) return gqlRes;
    } catch (e) { }

    return {
      anilistId: id,
      title: 'Anime Show',
      description: '',
      rating: '8.5',
      year: null,
      genres: [],
      poster: null,
      banner: null,
      artworks: { posters: [], banners: [], fanarts: [], logos: [] },
      isLunar: true
    };
  }

  // Get episode catalog with thumbnails, titles, synopsis
  async getEpisodes(anilistId) {
    const id = parseInt(anilistId, 10);
    if (!id) throw new Error('Invalid anilistId');

    try {
      const res = await this.get(`/api/animes/v2/vermillion/episodes?id=${id}`);
      const rawEpisodes = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
      if (rawEpisodes.length > 0) {
        return rawEpisodes.map((ep, idx) => ({
          id: `lunar-${id}-${ep.number || (idx + 1)}`,
          anilistId: id,
          number: ep.number || (idx + 1),
          title: ep.title || `Episode ${ep.number || (idx + 1)}`,
          description: this.cleanDescription(ep.description || ''),
          airDate: ep.airDate || ep.airDateUtc || null,
          thumbnail: ep.thumbnail || ep.img || null,
          hasSub: ep.hasSub !== false,
          hasDub: !!ep.hasDub,
          subProviders: (Array.isArray(ep.subProviders) ? ep.subProviders.map(p => typeof p === 'object' ? p.id : p) : ['zuna', '3rdprovider']),
          dubProviders: (Array.isArray(ep.dubProviders) ? ep.dubProviders.map(p => typeof p === 'object' ? p.id : p) : ['3rdprovider']),
          runtime: ep.runtime || ep.length || 24,
          isFiller: !!ep.isFiller,
          isLunar: true
        }));
      }
    } catch (err) {
      console.warn(`[LunarX] Episode list fetch failed for ${id}, using fallback:`, err.message);
    }

    // Check if the anime has not released yet
    try {
      const showInfo = await this.getInfo(id);
      if (showInfo && (showInfo.status === 'NOT_YET_RELEASED' || showInfo.episodeCount === 0)) {
        return [];
      }
    } catch (e) { }

    // Fallback: Generate basic episodes list so player can load and request stream
    return [
      {
        id: `lunar-${id}-1`,
        anilistId: id,
        number: 1,
        title: 'Episode 1',
        description: '',
        airDate: null,
        thumbnail: null,
        hasSub: true,
        hasDub: false,
        subProviders: ['zuna', '3rdprovider'],
        dubProviders: [],
        runtime: 24,
        isFiller: false,
        isLunar: true
      }
    ];
  }

  // Decode keys using LunarX module 817263 algorithm
  decodeKeys(e) {
    if (!e || typeof e !== 'object') return null;
    for (let t of Object.keys(e)) {
      let r = (function (e, t) {
        let r;
        try {
          r = atob(t.split('').reverse().join(''));
        } catch {
          return null;
        }
        let l = (function (e) {
          let t = 0;
          for (let r = 0; r < e.length; r++) t = 31 * t + e.charCodeAt(r) & 255;
          return t;
        })(e);
        let n = '';
        for (let e = 0; e < r.length; e++) n += String.fromCharCode((r.charCodeAt(e) ^ l + 37 * e & 255) & 255);
        let o = n.split('|');
        if (6 !== o.length || '3' !== o[0]) return null;
        let i = parseInt(o[1], 16), a = parseInt(o[2], 16), f = parseInt(o[3], 16);
        if (isNaN(i) || isNaN(a) || isNaN(f)) return null;
        let u = o[4];
        if (u.length % 3 !== 0 || 0 === u.length) return null;
        let c = [];
        for (let e = 0; e < u.length; e += 3) {
          let t = parseInt(u[e], 16), r = parseInt(u.slice(e + 1, e + 3), 16);
          if (isNaN(t) || isNaN(r) || t > 7) return null;
          c.push([t, r]);
        }
        let h = o[5].split('.').filter(Boolean);
        return h.length ? { seed: i, a, b: f, prog: c, names: h } : null;
      })(t, e[t]);

      if (!r) continue;

      let l = (function (e, t) {
        let r = e.names.map(e => t[e] || '').join('');
        if (r.length < 2 || r.length % 2 !== 0) return null;
        let l = [], n = 255 & e.seed, o = 0;
        for (let t = 0; t < r.length; t += 2) {
          let i = parseInt(r.slice(t, t + 2), 16);
          if (isNaN(i)) return null;
          n = n * e.a + e.b & 255;
          l.push((function (e, t, r, l) {
            let n = 255 & e;
            for (let e = l.length - 1; e >= 0; e--) {
              let a = l[e][0], f = l[e][1];
              if (0 === a) n ^= f;
              else if (1 === a) n -= f;
              else if (2 === a) {
                var o, i;
                n = ((o = 255 & n) >>> (i = 7 & f || 1) | o << 8 - i) & 255;
              } else if (3 === a) n = (15 & n) << 4 | (255 & n) >>> 4;
              else if (4 === a) n ^= r;
              else if (5 === a) n ^= (t * (1 | f) + f & 255);
              else if (6 === a) n = ~n;
              else n = f - n;
              n &= 255;
            }
            return n;
          })(i ^ o, t / 2, n, e.prog));
          o = i;
        }
        return l;
      })(r, e);

      if (!l || l.length < 7) continue;
      if (167 !== l[0] || 62 !== l[1] || 145 !== l[2]) continue;
      let n = l[3] << 8 | l[4], o = l[5] << 8 | l[6];
      if (n <= 0 || o <= 0 || 7 + n + o > l.length) continue;
      let i = '', a = '';
      for (let e = 0; e < n; e++) i += String.fromCharCode(l[7 + e]);
      for (let e = 0; e < o; e++) a += String.fromCharCode(l[7 + n + e]);
      return [i, a];
    }
    return null;
  }

  slugify(text) {
    if (!text) return '';
    return text.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  // Extract keys dynamically from watch page HTML using multiple resilient strategies
  extractKeysFromHtml(html) {
    if (!html) return null;
    const unescaped = html.replace(/\\"/g, '"').replace(/\\\\/g, '\\');

    // Strategy 1: Match Next.js RSC component arrays with object payload: ["$","$Lxx","id",{...}]
    const rscRegex = /\["\$","\$L[a-zA-Z0-9]+","\d+",(\{.*?\})\]/g;
    let match;
    while ((match = rscRegex.exec(unescaped)) !== null) {
      try {
        const payload = JSON.parse(match[1]);
        const k = this.decodeKeys(payload);
        if (k && k[0] && k[1]) return k;
      } catch (e) { }
    }

    // Strategy 2: Match Next.js null-key component arrays: ["$","$Lxx",null,{...}]
    const rscNullRegex = /\["\$","\$L[a-zA-Z0-9]+",null,(\{.*?\})\]/g;
    while ((match = rscNullRegex.exec(unescaped)) !== null) {
      try {
        const payload = JSON.parse(match[1]);
        const k = this.decodeKeys(payload);
        if (k && k[0] && k[1]) return k;
      } catch (e) { }
    }

    // Strategy 3: Scan any JSON objects in unescaped script payloads
    const jsonRegex = /\{("[a-zA-Z0-9_-]+":\s*(?:"[^"]*"|\d+|true|false|null)(?:,\s*"[a-zA-Z0-9_-]+":\s*(?:"[^"]*"|\d+|true|false|null))*)\}/g;
    while ((match = jsonRegex.exec(unescaped)) !== null) {
      try {
        const obj = JSON.parse(match[0]);
        const k = this.decodeKeys(obj);
        if (k && k[0] && k[1]) return k;
      } catch (e) { }
    }

    // Strategy 4: Larger JSON objects scan (objects with 100+ characters)
    const anyObjRegex = /\{([^{}]{100,5000})\}/g;
    while ((match = anyObjRegex.exec(unescaped)) !== null) {
      try {
        const obj = JSON.parse(match[0]);
        const k = this.decodeKeys(obj);
        if (k && k[0] && k[1]) return k;
      } catch (e) { }
    }

    return null;
  }

  // Universal HTML fetcher with cross-platform fallback for dynamic key extraction
  async fetchHtml(targetUrl) {
    // 1. Try native https.get first (fast, cross-platform, works on Linux EC2 without external dependencies)
    try {
      const html = await new Promise((resolve, reject) => {
        const client = targetUrl.startsWith('https://') ? https : http;
        const headers = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        };
        const req = client.get(targetUrl, { headers }, res => {
          if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
            const redirect = res.headers.location.startsWith('http')
              ? res.headers.location
              : new URL(res.headers.location, targetUrl).href;
            res.resume();
            return resolve(this.fetchHtml(redirect));
          }
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.setTimeout(8000, () => {
          req.destroy();
          reject(new Error('HTML request timeout'));
        });
      });
      if (html && (html.includes('$L') || html.includes('self.__next_f'))) {
        return html;
      }
    } catch (e) { }

    // 2. Cross-platform curl fallback (curl on Linux/EC2, curl.exe on Windows)
    try {
      const curlBin = process.platform === 'win32' ? 'curl.exe' : 'curl';
      const cmd = `${curlBin} -s -L -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" -H "Accept: text/html" "${targetUrl}"`;
      const html = execSync(cmd, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024, timeout: 8000 });
      return html;
    } catch (e) {
      return '';
    }
  }

  // Obtain live decryption keys with automatic multi-slug fallback and disk persistence
  async getDecryptionKeys(anilistId, forceRefresh = false) {
    // 1. Check cached session keys (valid for 24 hours unless forceRefresh requested)
    if (!forceRefresh && this.globalKeys && (Date.now() - this.globalKeys.timestamp < 24 * 60 * 60 * 1000)) {
      return [this.globalKeys.axis, this.globalKeys.pitch];
    }

    const candidateSlugs = [];
    if (anilistId) {
      try {
        const info = await this.getInfo(anilistId);
        if (info?.romajiTitle) candidateSlugs.push(this.slugify(info.romajiTitle));
        if (info?.englishTitle) candidateSlugs.push(this.slugify(info.englishTitle));
        if (info?.title) candidateSlugs.push(this.slugify(info.title));
      } catch (err) { }
    }

    // Known stable high-traffic slugs that always have full player hydration on LunarX
    const stableSlugs = [
      'jujutsu-kaisen',
      'solo-leveling',
      'naruto',
      'one-piece',
      'attack-on-titan',
      'demon-slayer',
      'bleach',
      'chainsaw-man'
    ];

    const allSlugs = [...new Set([...candidateSlugs, ...stableSlugs].filter(Boolean))];

    for (const slug of allSlugs) {
      const url = `https://lunarx.to/anime/${slug}/1/1`;
      try {
        const html = await this.fetchHtml(url);
        if (html && (html.includes('$L') || html.includes('self.__next_f'))) {
          const keys = this.extractKeysFromHtml(html);
          if (keys && keys[0] && keys[1]) {
            console.log(`[LunarX] Extracted live cipher keys via slug "${slug}"`);
            this.globalKeys = { axis: keys[0], pitch: keys[1], timestamp: Date.now() };
            this.axis = keys[0];
            this.pitch = keys[1];
            this.saveKeysToDisk(keys[0], keys[1]);
            return keys;
          }
        }
      } catch (slugErr) {
        // Continue to next slug
      }
    }

    // Try home page if watch pages fail
    try {
      const homeHtml = await this.fetchHtml('https://lunarx.to/');
      if (homeHtml) {
        const keys = this.extractKeysFromHtml(homeHtml);
        if (keys && keys[0] && keys[1]) {
          console.log('[LunarX] Extracted live cipher keys via home page');
          this.globalKeys = { axis: keys[0], pitch: keys[1], timestamp: Date.now() };
          this.axis = keys[0];
          this.pitch = keys[1];
          this.saveKeysToDisk(keys[0], keys[1]);
          return keys;
        }
      }
    } catch (e) { }

    // Fallback to loaded or default keys
    return [this.axis, this.pitch];
  }

  // Verify stream manifest playability
  verifyM3u8(url, referer, origin) {
    if (!url) return Promise.resolve(false);
    // Disallow hosts known to serve obfuscated/encrypted fake-PNG segments (flixcloud, fallencdn, matrixcdn)
    // Standard native Android ExoPlayer cannot find sync byte (0x47) on fake PNGs and fails with ParserException
    if (/flixcloud|fallencdn|matrixcdn/i.test(url)) {
      console.warn('[LunarX] Skipping obfuscated stream provider (flixcloud/fallencdn):', url);
      return Promise.resolve(false);
    }
    const checkOnce = (ref, orig) => new Promise(resolve => {
      try {
        const client = url.startsWith('https://') ? https : http;
        const headers = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          ...(ref ? { 'Referer': ref } : {}),
          ...(orig ? { 'Origin': orig } : {})
        };
        const req = client.get(url, { headers }, res => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            let chunk = '';
            res.on('data', c => {
              chunk += c;
              if (chunk.length > 50) {
                req.destroy();
                resolve({ ok: chunk.includes('#EXTM3U') || chunk.includes('EXTINF'), status: res.statusCode });
              }
            });
            res.on('end', () => {
              resolve({ ok: chunk.includes('#EXTM3U') || chunk.includes('EXTINF'), status: res.statusCode });
            });
          } else {
            resolve({ ok: false, status: res.statusCode });
          }
        });
        req.on('error', () => resolve({ ok: false, status: 0 }));
        req.setTimeout(8000, () => {
          req.destroy();
          resolve({ ok: false, status: 0 });
        });
      } catch (e) {
        resolve({ ok: false, status: 0 });
      }
    });

    return checkOnce(referer, origin).then(res => {
      if (!res.ok && res.status === 403 && referer !== 'https://megaplay.buzz/') {
        return checkOnce('https://megaplay.buzz/', 'https://megaplay.buzz').then(r => r.ok);
      }
      return res.ok;
    });
  }

  // Helper to resolve and decrypt 3rdprovider stream (Flixcloud / Zen)
  async resolve3rdProvider(id, ep, liveAxis, livePitch, fallbackSubtitles = [], type = 'sub') {
    const aParam = type === 'dub' ? '1' : '0';
    try {
      const res3rd = await this.get(`/api/3rdprovider?anilist=${id}&episode=${ep}&m3u8=true&a=${aParam}&audio=${type}`);
      if (res3rd && res3rd.stream_data && res3rd.stream_data.m3u8_url) {
        let decrypted3rd = this.decryptM3u8(res3rd.stream_data.m3u8_url, liveAxis, livePitch);

        // If decryption failed with current keys, try refreshing keys
        if (!decrypted3rd) {
          console.log('[LunarX] 3rdprovider decryption failed, refreshing live keys...');
          const [refreshedAxis, refreshedPitch] = await this.getDecryptionKeys(id, true);
          decrypted3rd = this.decryptM3u8(res3rd.stream_data.m3u8_url, refreshedAxis, refreshedPitch);
        }

        if (decrypted3rd && (decrypted3rd.startsWith('http://') || decrypted3rd.startsWith('https://'))) {
          // Determine upstream referer for 3rdprovider target
          let upRef = 'https://lunarx.to/';
          let upOrig = 'https://lunarx.to';
          if (
            decrypted3rd.includes('nexabloom') || 
            decrypted3rd.includes('voyage') || 
            decrypted3rd.includes('megaplay') || 
            decrypted3rd.includes('horizon') || 
            decrypted3rd.includes('broforgotsave') ||
            decrypted3rd.includes('playercdn') ||
            /\/anime\/[a-f0-9]{32}\//i.test(decrypted3rd)
          ) {
            upRef = 'https://megaplay.buzz/';
            upOrig = 'https://megaplay.buzz';
          }

          // Verify stream is alive with upstream headers
          const isAlive = await this.verifyM3u8(decrypted3rd, upRef, upOrig);
          if (!isAlive) {
            console.warn('[LunarX] 3rdprovider stream manifest returned unplayable status');
            return null;
          }

          const rawSubs = Array.isArray(res3rd.stream_data?.subtitles)
            ? res3rd.stream_data.subtitles
            : (Array.isArray(res3rd.subtitles) ? res3rd.subtitles : []);

          const subs = rawSubs
            .filter(s => s && s.url && !String(s.language || s.lang || '').toLowerCase().includes('thumb'))
            .map((s, idx) => ({
              id: `sub-3rd-${idx}`,
              label: s.title || s.language_name || s.label || s.language || s.lang || `Subtitle ${idx + 1}`,
              lang: s.language || s.lang || 'en',
              url: s.url ? `/api/lunarx/proxy/subtitle?url=${encodeURIComponent(s.url)}` : '',
              rawUrl: s.url,
              default: !!s.is_default || idx === 0
            }));

          // Parse intro / outro from chapters if available
          let intro = null;
          let outro = null;
          if (Array.isArray(res3rd.stream_data?.chapters)) {
            for (const ch of res3rd.stream_data.chapters) {
              const title = String(ch.title || '').toLowerCase();
              if ((title.includes('opening') || title.includes('intro')) && typeof ch.start_time === 'number') {
                intro = { start: ch.start_time, end: ch.end_time || (ch.start_time + 90) };
              } else if ((title.includes('ending') || title.includes('outro')) && typeof ch.start_time === 'number') {
                outro = { start: ch.start_time, end: ch.end_time || (ch.start_time + 90) };
              }
            }
          }

          const qParams = `&ref=${encodeURIComponent(upRef)}&orig=${encodeURIComponent(upOrig)}&type=${type}`;
          const finalStreamUrl = `/api/lunarx/proxy/playlist.m3u8?url=${encodeURIComponent(decrypted3rd)}${qParams}`;

          return {
            success: true,
            anilistId: id,
            episodeNumber: ep,
            host: '3rdprovider',
            type: type,
            streamUrl: finalStreamUrl,
            rawStreamUrl: decrypted3rd,
            quality: 'auto',
            isM3U8: true,
            intro: intro,
            outro: outro,
            subtitles: subs.length > 0 ? subs : fallbackSubtitles,
            availableHosts: ['zuna', 'yuki', 'sora', 'loli', '3rdprovider']
          };
        }
      }
    } catch (e) {
      console.warn('[LunarX] 3rdprovider resolve error:', e.message);
    }
    return null;
  }

  // Fetch video streams, subtitles, and intro/outro timestamps with auto-fallback
  async getStream(anilistId, epNum, requestedHost = 'zuna', type = 'sub') {
    const id = parseInt(anilistId, 10);
    const ep = parseInt(epNum, 10) || 1;
    if (!id) throw new Error('Invalid anilistId');

    // Obtain live cipher keys
    let [liveAxis, livePitch] = await this.getDecryptionKeys(id);

    // Determine host order based on audio type (sub vs dub)
    // Providers with verified clean MPEG-TS streams for ExoPlayer:
    // 1. zuna (Megaplay / Nexabloom - clean 1080p TS)
    // 2. loli (Echovideo - clean 1080p/720p TS)
    // 3. sora (Krussdomi - clean TS)
    // Obfuscated / fallback providers: yuki, 3rdprovider
    let hostsToTry = [];
    if (type === 'dub') {
      const preferredHost = (requestedHost && requestedHost !== 'zuna') ? requestedHost : 'yuki';
      hostsToTry = [preferredHost, 'yuki', 'sora', 'loli', '3rdprovider'].filter(
        (h, idx, self) => self.indexOf(h) === idx && h !== 'zuna'
      );
    } else {
      hostsToTry = [requestedHost, 'zuna', 'yuki', 'sora', 'loli', '3rdprovider'].filter(
        (h, idx, self) => self.indexOf(h) === idx
      );
    }

    let lastError = null;
    let fallbackSubtitles = [];

    for (const host of hostsToTry) {
      try {
        // If 3rdprovider is in the list, resolve via 3rdprovider handler
        if (host === '3rdprovider') {
          const direct3rd = await this.resolve3rdProvider(id, ep, liveAxis, livePitch, fallbackSubtitles, type);
          if (direct3rd) return direct3rd;
          continue;
        }

        const path = `/api/animes/vermillion/sources?id=${id}&host=${host}&epNum=${ep}&type=${type}`;
        const res = await this.get(path);

        if (res.success && res.data) {
          const rawSource = Array.isArray(res.data.sources) && res.data.sources[0];
          let candidateStreamUrl = null;

          if (Array.isArray(res.data.subtitles) && res.data.subtitles.length > 0 && fallbackSubtitles.length === 0) {
            fallbackSubtitles = res.data.subtitles.map((sub, i) => ({
              id: sub.id || `sub-${i}`,
              label: sub.label || sub.lang || `Subtitle ${i + 1}`,
              lang: sub.lang || 'en',
              url: sub.url ? `/api/lunarx/proxy/subtitle?url=${encodeURIComponent(sub.url)}` : '',
              rawUrl: sub.url,
              default: !!sub.default
            }));
          }

          // 1. Direct plain URL
          if (rawSource && rawSource.url && (rawSource.url.startsWith('http://') || rawSource.url.startsWith('https://'))) {
            candidateStreamUrl = rawSource.url;
          }

          // 2. Cipher decrypt using live keys
          if (!candidateStreamUrl && rawSource && rawSource.url) {
            let dec = this.decryptM3u8(rawSource.url, liveAxis, livePitch);
            // If decryption failed, try force-refreshing keys and re-decrypt
            if (!dec) {
              console.log(`[LunarX] Decryption failed for host "${host}", refreshing live keys...`);
              const refreshed = await this.getDecryptionKeys(id, true);
              liveAxis = refreshed[0];
              livePitch = refreshed[1];
              dec = this.decryptM3u8(rawSource.url, liveAxis, livePitch);
            }
            if (dec && (dec.startsWith('http://') || dec.startsWith('https://'))) {
              candidateStreamUrl = dec;
            }
          }

          // 3. Dramahot subtitle master derivation (for sub only)
          if (!candidateStreamUrl && type !== 'dub' && Array.isArray(res.data.subtitles)) {
            const dramahotSub = res.data.subtitles.find(s => s.url && s.url.includes('dramahot.top'));
            if (dramahotSub) {
              candidateStreamUrl = dramahotSub.url.replace('/v/', '/p/').replace(/\/subs\/.*$/, '/master.m3u8');
            }
          }

          // Determine upstream referer and origin for stream verification and proxy routing
          let reqReferer = res.data?.headers?.Referer;
          let reqOrigin = res.data?.headers?.Origin;
          if (candidateStreamUrl) {
            if (candidateStreamUrl.includes('dramahot') || candidateStreamUrl.includes('drama1.cfd') || candidateStreamUrl.includes('zokoanime')) {
              reqReferer = 'https://zokoanime.video/';
              reqOrigin = 'https://zokoanime.video';
            } else if (
              host === 'yuki' ||
              host === 'zuna' ||
              type === 'dub' ||
              candidateStreamUrl.includes('nexabloom') || 
              candidateStreamUrl.includes('voyage') || 
              candidateStreamUrl.includes('megaplay') || 
              candidateStreamUrl.includes('horizon') || 
              candidateStreamUrl.includes('broforgotsave') ||
              candidateStreamUrl.includes('playercdn') ||
              /\/anime\/[a-f0-9]{32}\//i.test(candidateStreamUrl) ||
              /seg-\d+/i.test(candidateStreamUrl) ||
              /-v\d+-a\d+/i.test(candidateStreamUrl) ||
              /index-f\d+/i.test(candidateStreamUrl)
            ) {
              reqReferer = 'https://megaplay.buzz/';
              reqOrigin = 'https://megaplay.buzz';
            } else if (candidateStreamUrl.includes('krussdomi') || candidateStreamUrl.includes('kaa.lt')) {
              reqReferer = 'https://kaa.lt/';
              reqOrigin = 'https://kaa.lt';
            } else if (candidateStreamUrl.includes('echovideo')) {
              reqReferer = (reqReferer && reqReferer.includes('echovideo')) ? reqReferer : 'https://play.echovideo.ru/';
              reqOrigin = 'https://play.echovideo.ru';
            } else if (candidateStreamUrl.includes('flixcloud') || candidateStreamUrl.includes('matrixcdn')) {
              reqReferer = 'https://lunarx.to/';
              reqOrigin = 'https://lunarx.to';
            } else if (!reqReferer) {
              reqReferer = 'https://lunarx.to/';
              reqOrigin = 'https://lunarx.to';
            }
          }

          // Verify playability of candidate stream before accepting
          if (candidateStreamUrl) {
            const isAlive = await this.verifyM3u8(candidateStreamUrl, reqReferer, reqOrigin);
            if (!isAlive) {
              console.warn(`[LunarX] Host "${host}" stream is unplayable/forbidden, trying next host...`);
              candidateStreamUrl = null;
            }
          }

          if (candidateStreamUrl) {
            const subtitles = (res.data.subtitles || []).map((sub, i) => ({
              id: sub.id || `sub-${i}`,
              label: sub.label || sub.lang || `Subtitle ${i + 1}`,
              lang: sub.lang || 'en',
              url: sub.url ? `/api/lunarx/proxy/subtitle?url=${encodeURIComponent(sub.url)}` : '',
              rawUrl: sub.url,
              default: !!sub.default
            }));

            // All streams are securely routed through our backend proxy with exact Referer, Origin, and type parameters
            const queryParams = `&ref=${encodeURIComponent(reqReferer)}${reqOrigin ? `&orig=${encodeURIComponent(reqOrigin)}` : ''}&type=${type}`;
            const finalStreamUrl = `/api/lunarx/proxy/playlist.m3u8?url=${encodeURIComponent(candidateStreamUrl)}${queryParams}`;

            return {
              success: true,
              anilistId: id,
              episodeNumber: ep,
              host: host,
              type: type,
              streamUrl: finalStreamUrl,
              rawStreamUrl: candidateStreamUrl,
              quality: rawSource?.quality || 'auto',
              isM3U8: true,
              intro: res.data.intro || null,
              outro: res.data.outro || null,
              subtitles: subtitles.length > 0 ? subtitles : fallbackSubtitles,
              availableHosts: ['zuna', 'yuki', 'sora', 'loli', '3rdprovider']
            };
          }
        }
      } catch (err) {
        lastError = err;
      }
    }

    // Safety net: Try 3rdprovider directly if not tried yet
    if (!hostsToTry.includes('3rdprovider')) {
      const direct3rd = await this.resolve3rdProvider(id, ep, liveAxis, livePitch, fallbackSubtitles, type);
      if (direct3rd) return direct3rd;
    }

    // If dub was requested but no playable dub stream exists, gracefully fall back to clear Japanese sub stream
    if (type === 'dub') {
      console.log(`[LunarX] Dub unavailable for Anime #${id} Ep #${ep}, falling back to clear sub stream...`);
      const fallbackResult = await this.getStream(id, ep, 'zuna', 'sub');
      return {
        ...fallbackResult,
        isFallbackSub: true
      };
    }

    // Safety net 2: If no sources found for this specific ID (common for upcoming seasonal / franchise stubs),
    // check relations or franchise prequels/search to stream the available franchise entry
    try {
      console.log(`[LunarX] No direct sources for Anime #${id}, checking franchise relations/prequels...`);
      const media = await this.getAniListMedia(id);
      if (media && Array.isArray(media.seasons) && media.seasons.length > 0) {
        const candidateSeason = media.seasons.find(s => s.anilistId !== id && (s.episodes > 0 || s.episodeCount > 0));
        if (candidateSeason) {
          console.log(`[LunarX] Falling back to franchise season #${candidateSeason.anilistId} (${candidateSeason.title}) for Anime #${id}...`);
          const franchiseResult = await this.getStream(candidateSeason.anilistId, 1, requestedHost, type);
          if (franchiseResult && franchiseResult.streamUrl) {
            return {
              ...franchiseResult,
              isFranchiseFallback: true,
              originalAnilistId: id,
              fallbackTitle: candidateSeason.title,
            };
          }
        }
      }

      if (media && media.title) {
        const cleanTitle = media.title.split(':')[0].replace(/Season \d+|Part \d+/i, '').trim();
        if (cleanTitle.length >= 3) {
          const searchResults = await this.search(cleanTitle, 5);
          const match = (searchResults || []).find(r => r.anilistId !== id && (r.episodes > 0 || r.episodeCount > 0));
          if (match) {
            console.log(`[LunarX] Falling back to searched franchise title #${match.anilistId} (${match.title}) for Anime #${id}...`);
            const searchFallbackResult = await this.getStream(match.anilistId, 1, requestedHost, type);
            if (searchFallbackResult && searchFallbackResult.streamUrl) {
              return {
                ...searchFallbackResult,
                isFranchiseFallback: true,
                originalAnilistId: id,
                fallbackTitle: match.title,
              };
            }
          }
        }
      }
    } catch (fallbackErr) {
      console.warn(`[LunarX] Franchise fallback error for #${id}:`, fallbackErr.message);
    }

    throw new Error(`Failed to retrieve playable stream for Anime #${id} Episode #${ep}: ${lastError ? lastError.message : 'No active sources'}`);
  }
}

module.exports = new LunarXService();

