const https = require('https');
const http = require('http');
const crypto = require('crypto');
const { execSync } = require('child_process');

// Default extraction keys for LunarX vermillion cipher
const DEFAULT_AXIS = 'VBzPcykBjCy2WCirxgAnvKvPauq7gx5dDmwAz20t5USInX02rF7MKuC';
const DEFAULT_PITCH = 'He3tzyfi5FC1frV0XwxjfiZcM3Oy7ZAwdadUwPmprtAlc9l5guwzruL';

class LunarXService {
  constructor() {
    this.apiHost = 'api.lunarx.to';
    this.axis = DEFAULT_AXIS;
    this.pitch = DEFAULT_PITCH;
    this.globalKeys = null;
    this.cache = new Map();
    this.cacheTTL = 15 * 60 * 1000; // 15 minutes TTL for metadata
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

  // Universal GET JSON helper with LunarX headers
  async get(path) {
    const cacheKey = `GET:${path}`;
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < this.cacheTTL)) {
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
              description: m.description,
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
                description: m.description,
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
              description: m.description || '',
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
        description: res.synopsis || res.description || '',
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
          description: ep.description || '',
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
    } catch (e) {}

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
      let r = (function(e, t) {
        let r;
        try {
          r = atob(t.split('').reverse().join(''));
        } catch {
          return null;
        }
        let l = (function(e) {
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

      let l = (function(e, t) {
        let r = e.names.map(e => t[e] || '').join('');
        if (r.length < 2 || r.length % 2 !== 0) return null;
        let l = [], n = 255 & e.seed, o = 0;
        for (let t = 0; t < r.length; t += 2) {
          let i = parseInt(r.slice(t, t + 2), 16);
          if (isNaN(i)) return null;
          n = n * e.a + e.b & 255;
          l.push((function(e, t, r, l) {
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

  // Extract keys dynamically from watch page HTML
  extractKeysFromHtml(html) {
    if (!html) return null;
    const unescaped = html.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    const regex = /\["\$","\$L2d","\d+",(\{.*?\})\]/g;
    let match;
    while ((match = regex.exec(unescaped)) !== null) {
      try {
        const payload = JSON.parse(match[1]);
        const k = this.decodeKeys(payload);
        if (k && k[0] && k[1]) return k;
      } catch (e) {}
    }
    return null;
  }

  // Obtain live decryption keys for an anime show
  async getDecryptionKeys(anilistId) {
    // 1. Check cached session keys (valid for 60 minutes)
    if (this.globalKeys && (Date.now() - this.globalKeys.timestamp < 60 * 60 * 1000)) {
      return [this.globalKeys.axis, this.globalKeys.pitch];
    }

    try {
      const info = await this.getInfo(anilistId);
      const candidates = [];
      if (info?.romajiTitle) candidates.push(this.slugify(info.romajiTitle));
      if (info?.englishTitle) candidates.push(this.slugify(info.englishTitle));
      if (info?.title) candidates.push(this.slugify(info.title));

      const uniqueSlugs = [...new Set(candidates.filter(Boolean))];

      for (const slug of uniqueSlugs) {
        const url = `https://lunarx.to/anime/${slug}/1/1`;
        try {
          const cmd = `curl.exe -s -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" -H "Accept: text/html" "${url}"`;
          const html = execSync(cmd, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024, timeout: 8000 });
          if (html.includes('$L2d')) {
            const keys = this.extractKeysFromHtml(html);
            if (keys && keys[0] && keys[1]) {
              console.log(`[LunarX] Extracted live cipher keys via slug "${slug}"`);
              this.globalKeys = { axis: keys[0], pitch: keys[1], timestamp: Date.now() };
              this.axis = keys[0];
              this.pitch = keys[1];
              return keys;
            }
          }
        } catch (slugErr) {
          // Continue to next slug candidate
        }
      }
    } catch (err) {
      console.warn('[LunarX] Dynamic key extraction error:', err.message);
    }

    // Fallback to current axis / pitch
    return [this.axis, this.pitch];
  }

  // Verify stream manifest playability
  verifyM3u8(url, referer, origin) {
    if (!url) return Promise.resolve(false);
    return new Promise(resolve => {
      const client = url.startsWith('https://') ? https : http;
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        ...(referer ? { 'Referer': referer } : {}),
        ...(origin ? { 'Origin': origin } : {})
      };
      const req = client.get(url, { headers }, res => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          let chunk = '';
          res.on('data', c => {
            chunk += c;
            if (chunk.length > 50) {
              req.destroy();
              resolve(chunk.includes('#EXTM3U') || chunk.includes('EXTINF'));
            }
          });
          res.on('end', () => {
            resolve(chunk.includes('#EXTM3U') || chunk.includes('EXTINF'));
          });
        } else {
          resolve(false);
        }
      });
      req.on('error', () => resolve(false));
      req.setTimeout(10000, () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  // Helper to resolve and decrypt 3rdprovider stream (Flixcloud)
  async resolve3rdProvider(id, ep, liveAxis, livePitch, fallbackSubtitles = [], type = 'sub') {
    try {
      const res3rd = await this.get(`/api/3rdprovider?anilist=${id}&episode=${ep}&m3u8=true`);
      if (res3rd && res3rd.stream_data && res3rd.stream_data.m3u8_url) {
        const decrypted3rd = this.decryptM3u8(res3rd.stream_data.m3u8_url, liveAxis, livePitch);
        if (decrypted3rd && (decrypted3rd.startsWith('http://') || decrypted3rd.startsWith('https://'))) {
          const subs = (res3rd.subtitles || []).map((s, idx) => ({
            id: `sub-3rd-${idx}`,
            label: s.lang || s.language || `Subtitle ${idx + 1}`,
            lang: s.lang || 'en',
            url: s.url,
            default: idx === 0
          }));

          const finalStreamUrl = `/api/lunarx/proxy/m3u8?url=${encodeURIComponent(decrypted3rd)}`;

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
            intro: null,
            outro: null,
            subtitles: fallbackSubtitles.length > 0 ? fallbackSubtitles : subs,
            availableHosts: ['zuna', 'yuki', 'sora']
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
    const [liveAxis, livePitch] = await this.getDecryptionKeys(id);

    // If 3rdprovider was specifically requested for SUB, resolve 3rdprovider
    if (requestedHost === '3rdprovider' && type !== 'dub') {
      const direct3rd = await this.resolve3rdProvider(id, ep, liveAxis, livePitch, [], type);
      if (direct3rd) return direct3rd;
    }

    // Determine host order based on audio type (sub vs dub)
    // For DUB: prioritize verified high-quality English Dub providers (yuki = Megaplay/Nexabloom 1080p stereo AAC, sora = Krussdomi)
    // For SUB: prioritize zuna (Dramahot 1080p stereo AAC)
    let hostsToTry = [];
    if (type === 'dub') {
      hostsToTry = ['yuki', 'loli', 'sora', requestedHost].filter(
        (h, idx, self) => self.indexOf(h) === idx && h !== 'zuna' && h !== '3rdprovider'
      );
    } else {
      hostsToTry = [requestedHost, 'zuna', 'sora', 'yuki', 'loli'].filter(
        (h, idx, self) => self.indexOf(h) === idx && h !== '3rdprovider'
      );
    }

    let lastError = null;
    let fallbackSubtitles = [];

    for (const host of hostsToTry) {
      try {
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
              url: sub.url,
              default: !!sub.default
            }));
          }

          // 1. Direct plain URL
          if (rawSource && rawSource.url && (rawSource.url.startsWith('http://') || rawSource.url.startsWith('https://'))) {
            candidateStreamUrl = rawSource.url;
          }

          // 2. Cipher decrypt using live keys
          if (!candidateStreamUrl && rawSource && rawSource.url) {
            const dec = this.decryptM3u8(rawSource.url, liveAxis, livePitch);
            if (dec && (dec.startsWith('http://') || dec.startsWith('https://'))) {
              candidateStreamUrl = dec;
            }
          }

          // 3. Dramahot subtitle master derivation
          if (!candidateStreamUrl && Array.isArray(res.data.subtitles)) {
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
            } else if (candidateStreamUrl.includes('nexabloom') || candidateStreamUrl.includes('silentvoyage') || candidateStreamUrl.includes('megaplay') || candidateStreamUrl.includes('oakhorizon')) {
              reqReferer = 'https://megaplay.buzz/';
              reqOrigin = 'https://megaplay.buzz';
            } else if (candidateStreamUrl.includes('krussdomi') || candidateStreamUrl.includes('kaa.lt')) {
              reqReferer = 'https://kaa.lt/';
              reqOrigin = 'https://kaa.lt';
            } else if (candidateStreamUrl.includes('echovideo')) {
              reqReferer = (reqReferer && reqReferer.includes('echovideo')) ? reqReferer : 'https://play.echovideo.ru/';
              reqOrigin = 'https://play.echovideo.ru';
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
              url: sub.url,
              default: !!sub.default
            }));

            // All streams are securely routed through our backend proxy with exact Referer and Origin parameters
            const queryParams = `&ref=${encodeURIComponent(reqReferer)}${reqOrigin ? `&orig=${encodeURIComponent(reqOrigin)}` : ''}`;
            const finalStreamUrl = `/api/lunarx/proxy/m3u8?url=${encodeURIComponent(candidateStreamUrl)}${queryParams}`;

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
              availableHosts: ['zuna', 'yuki', 'sora']
            };
          }
        }
      } catch (err) {
        lastError = err;
      }
    }

    // For sub, attempt 3rdprovider as fallback
    if (type !== 'dub') {
      const res3rd = await this.resolve3rdProvider(id, ep, liveAxis, livePitch, fallbackSubtitles, type);
      if (res3rd) return res3rd;
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

    throw new Error(`Failed to retrieve playable stream for Anime #${id} Episode #${ep}: ${lastError ? lastError.message : 'No active sources'}`);
  }
}

module.exports = new LunarXService();

