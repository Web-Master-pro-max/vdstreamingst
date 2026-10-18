const express = require('express');
const https = require('https');
const http = require('http');
const router = express.Router();
const lunarx = require('../services/lunarx');

// 1. Get Trending & Seasonal Anime (Posters, Banners, Media Info)
router.get('/trending', async (req, res) => {
  try {
    const data = await lunarx.getTrending();
    res.json(data);
  } catch (err) {
    console.error('LunarX /trending error:', err);
    res.status(500).json({ error: 'Failed to fetch trending anime from LunarX' });
  }
});

// 2. Search Anime Shows
router.get('/search', async (req, res) => {
  try {
    const q = req.query.q || req.query.search || '';
    const limit = parseInt(req.query.limit, 10) || 12;
    if (!q.trim()) {
      return res.json([]);
    }
    const results = await lunarx.search(q, limit);
    res.json(results);
  } catch (err) {
    console.error('Anime /search error:', err);
    res.status(500).json({ error: 'Failed to search anime' });
  }
});

// 2b. Advanced Anime Browse & Filter
router.get('/browse', async (req, res) => {
  try {
    const { search, genre, format, season, year, status, sort, page, limit } = req.query;
    const results = await lunarx.browse({
      search,
      genre,
      format,
      season,
      year,
      status,
      sort: sort || 'TRENDING_DESC',
      page: parseInt(page, 10) || 1,
      perPage: parseInt(limit, 10) || 20
    });
    res.json(results);
  } catch (err) {
    console.error('Anime /browse error:', err);
    res.status(500).json({ error: 'Failed to browse anime catalog' });
  }
});


// 3. Get Full Show Info, Banners, Posters, Fanarts, and Logos
router.get('/info/:anilistId', async (req, res) => {
  try {
    const anilistId = req.params.anilistId;
    const info = await lunarx.getInfo(anilistId);
    res.json(info);
  } catch (err) {
    console.error(`LunarX /info/${req.params.anilistId} error:`, err);
    res.status(500).json({ error: err.message || 'Failed to fetch anime info' });
  }
});

// 4. Get Episode Catalog (Thumbnails, Titles, Summaries, Air Dates)
router.get('/episodes/:anilistId', async (req, res) => {
  try {
    const anilistId = req.params.anilistId;
    const episodes = await lunarx.getEpisodes(anilistId);
    res.json(episodes);
  } catch (err) {
    console.error(`LunarX /episodes/${req.params.anilistId} error:`, err);
    res.status(500).json({ error: err.message || 'Failed to fetch anime episodes' });
  }
});

// 5. Get Combined Info + Episodes (Ultra-fast single request)
router.get('/all/:anilistId', async (req, res) => {
  try {
    const anilistId = req.params.anilistId;
    const [info, episodes] = await Promise.all([
      lunarx.getInfo(anilistId),
      lunarx.getEpisodes(anilistId).catch(() => [])
    ]);
    res.json({
      ...info,
      episodes: episodes
    });
  } catch (err) {
    console.error(`LunarX /all/${req.params.anilistId} error:`, err);
    res.status(500).json({ error: err.message || 'Failed to fetch complete anime data' });
  }
});

// 5.1 Get Seasons & Franchise entries for an anime
router.get('/seasons/:anilistId', async (req, res) => {
  try {
    const anilistId = req.params.anilistId;
    const info = await lunarx.getInfo(anilistId);
    res.json(info.seasons || []);
  } catch (err) {
    console.error(`LunarX /seasons/${req.params.anilistId} error:`, err);
    res.status(500).json({ error: err.message || 'Failed to fetch anime seasons' });
  }
});


// 6. Get Decrypted Video Stream with Timestamps & Subtitles
router.get('/stream/:anilistId/:epNum', async (req, res) => {
  try {
    const { anilistId, epNum } = req.params;
    const host = req.query.host || 'zuna';
    const type = req.query.type || 'sub';

    const stream = await lunarx.getStream(anilistId, epNum, host, type);
    res.json(stream);
  } catch (err) {
    console.error(`LunarX /stream/${req.params.anilistId}/${req.params.epNum} error:`, err);
    res.status(500).json({ error: err.message || 'Failed to fetch playable stream' });
  }
});

// SSRF Protection: Validate that upstream URLs target legitimate public hosts and not internal/cloud metadata networks
function isSafeUpstreamUrl(urlStr) {
  try {
    if (!urlStr || typeof urlStr !== 'string') return false;
    const parsed = new URL(urlStr);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '169.254.169.254' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
      hostname.startsWith('169.254.') ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local')
    ) {
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

// Helper to fetch with redirect handling and SSRF safeguards
function fetchWithRedirects(targetUrl, headers, maxRedirects = 3) {
  return new Promise((resolve, reject) => {
    function doRequest(currentUrl, redirectsLeft) {
      if (!isSafeUpstreamUrl(currentUrl)) {
        return reject(new Error('Blocked request to prohibited host or internal network'));
      }
      const client = currentUrl.startsWith('https://') ? https : http;
      const req = client.get(currentUrl, { headers }, res => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && redirectsLeft > 0) {
          const redirectUrl = res.headers.location.startsWith('http')
            ? res.headers.location
            : new URL(res.headers.location, currentUrl).href;
          res.resume(); // Discard data
          return doRequest(redirectUrl, redirectsLeft - 1);
        }
        resolve({ res, finalUrl: currentUrl });
      });
      req.on('error', reject);
      req.setTimeout(15000, () => {
        req.destroy();
        reject(new Error('Proxy request timed out'));
      });
    }
    doRequest(targetUrl, maxRedirects);
  });
}

function getUpstreamHeaders(targetUrl, reqReferer, reqOrigin) {
  let referer = reqReferer;
  let origin = reqOrigin;

  if (targetUrl.includes('dramahot') || targetUrl.includes('drama1.cfd') || targetUrl.includes('zokoanime')) {
    referer = 'https://zokoanime.video/';
    origin = 'https://zokoanime.video';
  } else if (targetUrl.includes('nexabloom') || targetUrl.includes('silentvoyage') || targetUrl.includes('megaplay') || targetUrl.includes('oakhorizon') || targetUrl.includes('broforgotsave')) {
    referer = 'https://megaplay.buzz/';
    origin = 'https://megaplay.buzz';
  } else if (targetUrl.includes('krussdomi') || targetUrl.includes('kaa.lt')) {
    referer = 'https://kaa.lt/';
    origin = 'https://kaa.lt';
  } else if (targetUrl.includes('echovideo')) {
    referer = (reqReferer && reqReferer.includes('echovideo')) ? reqReferer : 'https://play.echovideo.ru/';
    origin = 'https://play.echovideo.ru';
  } else if (targetUrl.includes('flixcloud') || targetUrl.includes('matrixcdn')) {
    referer = 'https://lunarx.to/';
    origin = 'https://lunarx.to';
  } else if (!referer) {
    referer = 'https://lunarx.to/';
    origin = 'https://lunarx.to';
  }

  return {
    referer,
    origin,
    headers: {
      ...(referer ? { 'Referer': referer } : {}),
      ...(origin ? { 'Origin': origin } : {}),
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    }
  };
}

// Helper to recursively decode query params if they were double/triple-encoded
function safelyDecode(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') return urlStr;
  let decoded = urlStr.trim();
  let count = 0;
  while (!decoded.startsWith('http://') && !decoded.startsWith('https://') && decoded.includes('%') && count < 5) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
      count++;
    } catch (e) {
      break;
    }
  }
  return decoded;
}

// Helper to properly resolve relative and root-relative URLs in M3U8 playlists
function resolvePlaylistUrl(relativeOrAbsolute, baseFullUrl, baseDirectoryUrl) {
  if (!relativeOrAbsolute) return '';
  const trimmed = relativeOrAbsolute.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('//')) return 'https:' + trimmed;
  try {
    return new URL(trimmed, baseFullUrl).href;
  } catch (e) {
    return (baseDirectoryUrl || '') + trimmed;
  }
}

// 7. HLS M3U8 Playlist Stream Proxy (attaches required Referer header and rewrites playlist URLs)
router.get(['/proxy/m3u8', '/proxy/playlist.m3u8'], async (req, res) => {
  try {
    let targetUrl = req.query.url;
    if (!targetUrl) {
      return res.status(400).send('Missing url parameter');
    }
    targetUrl = safelyDecode(targetUrl);
    if (!isSafeUpstreamUrl(targetUrl)) {
      return res.status(403).send('Forbidden: Prohibited upstream target');
    }
    const reqRef = req.query.ref ? safelyDecode(req.query.ref) : null;
    const reqOrig = req.query.orig ? safelyDecode(req.query.orig) : null;

    const isDub = req.query.type === 'dub';
    const { referer, origin, headers } = getUpstreamHeaders(targetUrl, reqRef, reqOrig);

    const { res: upstreamRes, finalUrl } = await fetchWithRedirects(targetUrl, headers);

    if (upstreamRes.statusCode !== 200) {
      return res.status(upstreamRes.statusCode).send(`Stream upstream returned ${upstreamRes.statusCode}`);
    }

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Cache-Control', 'public, max-age=60');

    let body = '';
    upstreamRes.on('data', chunk => body += chunk);
    upstreamRes.on('end', () => {
      const baseUrl = finalUrl.substring(0, finalUrl.lastIndexOf('/') + 1);
      const lines = body.split('\n');
      const targetQuality = req.query.quality ? req.query.quality.toLowerCase() : null;
      const forwardedProto = req.headers['x-forwarded-proto'];
      const referer = req.headers['referer'] || '';
      const isHttpsClient = forwardedProto === 'https' || referer.startsWith('https://');
      const forwardedHost = req.headers['x-forwarded-host'];
      const hostHeader = forwardedHost || req.get('host');
      const protocol = isHttpsClient ? 'https' : (forwardedProto || req.protocol || 'http');
      const proxyBase = isHttpsClient ? (forwardedHost ? `https://${forwardedHost}` : '') : (hostHeader ? `${protocol}://${hostHeader}` : '');

      // Handle Master Playlists (#EXT-X-STREAM-INF)
      if (body.includes('#EXT-X-STREAM-INF')) {
        const headerLines = [];
        const variantPairs = [];
        let curInf = null;

        for (let i = 0; i < lines.length; i++) {
          let trimmed = lines[i].trim();
          if (!trimmed) continue;

          // If English Dub is requested, ensure English audio track is marked DEFAULT=YES
          if (isDub && trimmed.startsWith('#EXT-X-MEDIA:TYPE=AUDIO')) {
            const isEng = trimmed.includes('LANGUAGE="eng"') || trimmed.includes('NAME="English"') || trimmed.includes('NAME="Dub"');
            const isJpn = trimmed.includes('LANGUAGE="jpn"') || trimmed.includes('NAME="Japanese"') || trimmed.includes('NAME="Native"');
            if (isEng) {
              trimmed = trimmed.replace(/DEFAULT=(?:YES|NO)/g, 'DEFAULT=YES').replace(/AUTOSELECT=(?:YES|NO)/g, 'AUTOSELECT=YES');
              if (!trimmed.includes('DEFAULT=')) trimmed += ',DEFAULT=YES,AUTOSELECT=YES';
            } else if (isJpn) {
              trimmed = trimmed.replace(/DEFAULT=(?:YES|NO)/g, 'DEFAULT=NO');
            }
          }

          if (trimmed.startsWith('#EXT-X-STREAM-INF:')) {
            curInf = trimmed;
          } else if (curInf && !trimmed.startsWith('#')) {
            const fullUri = resolvePlaylistUrl(trimmed, finalUrl, baseUrl);
            variantPairs.push({ inf: curInf, uri: fullUri });
            curInf = null;
          } else {
            // Rewrite URI="..." in non-variant header lines (e.g. #EXT-X-MEDIA:TYPE=AUDIO)
            if (trimmed.includes('URI="')) {
              trimmed = trimmed.replace(/URI="([^"]+)"/g, (m, uri) => {
                const fullUri = resolvePlaylistUrl(uri, finalUrl, baseUrl);
                const up = getUpstreamHeaders(fullUri, referer, origin);
                const qParams = `&ref=${encodeURIComponent(up.referer)}${up.origin ? `&orig=${encodeURIComponent(up.origin)}` : ''}${isDub ? '&type=dub' : ''}`;
                if (fullUri.includes('.m3u8') || fullUri.includes('manifest') || fullUri.includes('playlist')) {
                  return `URI="${proxyBase}/api/lunarx/proxy/playlist.m3u8?url=${encodeURIComponent(fullUri)}${qParams}"`;
                }
                return `URI="${proxyBase}/api/lunarx/proxy/segment?url=${encodeURIComponent(fullUri)}${qParams}"`;
              });
            }
            headerLines.push(trimmed);
          }
        }

        const getDimensions = (item) => {
          const resMatch = item.inf.match(/RESOLUTION=(\d+)x(\d+)/i);
          let w = resMatch ? parseInt(resMatch[1], 10) : 0;
          let h = resMatch ? parseInt(resMatch[2], 10) : 0;
          if (!h) {
            const nameMatch = item.inf.match(/NAME="?(\d+)p?"?/i);
            if (nameMatch) h = parseInt(nameMatch[1], 10);
          }
          if (item.uri.includes('f1') && !h) h = 1080;
          if (item.uri.includes('f2') && !h) h = 720;
          if (item.uri.includes('f3') && !h) h = 480;
          return { w, h };
        };

        // Determine if variant causes hardware decoder chroma pitch corruption
        // 854 is NOT 16-aligned (854/2=427 is odd, causing horizontal/diagonal green static)
        const isCorruptVariant = (item) => {
          const { w } = getDimensions(item);
          if (w === 854 || item.uri.includes('index-f3') || item.inf.includes('854x480')) return true;
          if (w > 0 && (w % 16 !== 0 || (w / 2) % 2 !== 0)) return true;
          return false;
        };

        let selectedVariants = variantPairs;
        if (targetQuality && targetQuality !== 'auto') {
          const matched = variantPairs.filter(v => {
            const { h } = getDimensions(v);
            return `${h}p` === targetQuality || v.inf.toLowerCase().includes(targetQuality);
          });
          if (matched.length > 0) selectedVariants = matched;
        } else {
          const hasCleanHd = variantPairs.some(v => {
            const { w, h } = getDimensions(v);
            return (h >= 720 || w >= 1280) && !isCorruptVariant(v);
          });

          if (hasCleanHd) {
            // Omit unaligned variants (e.g. index-f3 854x480) so ExoPlayer only adapts between 1080p and 720p
            selectedVariants = variantPairs.filter(v => !isCorruptVariant(v));
          } else {
            selectedVariants = variantPairs.map(v => {
              if (v.inf.includes('854x480')) {
                return { ...v, inf: v.inf.replace(/854x480/g, '640x480') };
              }
              return v;
            });
          }
        }

        // Sort descending so initial stream selection starts at highest quality
        selectedVariants.sort((a, b) => {
          const dimA = getDimensions(a);
          const dimB = getDimensions(b);
          return (dimB.h || 0) - (dimA.h || 0);
        });

        // CRITICAL DECODER HARDWARE STRIDE FIX:
        // Multi-variant HLS manifests cause ExoPlayer on Android to switch resolutions mid-stream.
        // In Android TextureView / MediaCodec, dynamic resolution shifts corrupt the surface stride
        // buffer, causing bright green scan lines and horizontal video tearing.
        // Locking to the single optimal rendition guarantees constant buffer dimensions and pristine playback.
        const finalVariants = selectedVariants.length > 0 ? [selectedVariants[0]] : [];

        const outputLines = [...headerLines];
        for (const v of finalVariants) {
          const up = getUpstreamHeaders(v.uri, referer, origin);
          const qParams = `&ref=${encodeURIComponent(up.referer)}${up.origin ? `&orig=${encodeURIComponent(up.origin)}` : ''}${isDub ? '&type=dub' : ''}`;
          outputLines.push(v.inf);
          outputLines.push(`${proxyBase}/api/lunarx/proxy/playlist.m3u8?url=${encodeURIComponent(v.uri)}${qParams}`);
        }

        return res.send(outputLines.join('\n'));
      }

      // Handle Media Playlists (segments)
      const rewritten = lines.map(line => {
        let trimmed = line.trim();
        if (!trimmed) return line;

        // If English Dub is requested, ensure English audio track is marked DEFAULT=YES
        if (isDub && trimmed.startsWith('#EXT-X-MEDIA:TYPE=AUDIO')) {
          const isEng = trimmed.includes('LANGUAGE="eng"') || trimmed.includes('NAME="English"') || trimmed.includes('NAME="Dub"');
          const isJpn = trimmed.includes('LANGUAGE="jpn"') || trimmed.includes('NAME="Japanese"') || trimmed.includes('NAME="Native"');
          if (isEng) {
            trimmed = trimmed.replace(/DEFAULT=(?:YES|NO)/g, 'DEFAULT=YES').replace(/AUTOSELECT=(?:YES|NO)/g, 'AUTOSELECT=YES');
            if (!trimmed.includes('DEFAULT=')) trimmed += ',DEFAULT=YES,AUTOSELECT=YES';
          } else if (isJpn) {
            trimmed = trimmed.replace(/DEFAULT=(?:YES|NO)/g, 'DEFAULT=NO');
          }
        }

        // Handle URI="..." tags (e.g. #EXT-X-KEY, #EXT-X-MEDIA)
        if (trimmed.startsWith('#')) {
          if (trimmed.includes('URI="')) {
            return trimmed.replace(/URI="([^"]+)"/g, (m, uri) => {
              const fullUri = resolvePlaylistUrl(uri, finalUrl, baseUrl);
              const up = getUpstreamHeaders(fullUri, referer, origin);
              const qParams = `&ref=${encodeURIComponent(up.referer)}${up.origin ? `&orig=${encodeURIComponent(up.origin)}` : ''}${isDub ? '&type=dub' : ''}`;
              if (fullUri.includes('.m3u8') || fullUri.includes('manifest') || fullUri.includes('playlist')) {
                return `URI="${proxyBase}/api/lunarx/proxy/playlist.m3u8?url=${encodeURIComponent(fullUri)}${qParams}"`;
              }
              return `URI="${proxyBase}/api/lunarx/proxy/segment?url=${encodeURIComponent(fullUri)}${qParams}"`;
            });
          }
          return trimmed;
        }

        // Line is a URI: sub-playlist or segment
        const fullUrl = resolvePlaylistUrl(trimmed, finalUrl, baseUrl);
        const up = getUpstreamHeaders(fullUrl, referer, origin);
        const qParams = `&ref=${encodeURIComponent(up.referer)}${up.origin ? `&orig=${encodeURIComponent(up.origin)}` : ''}${isDub ? '&type=dub' : ''}`;
        if (fullUrl.includes('.m3u8') || fullUrl.includes('manifest') || fullUrl.includes('playlist')) {
          return `${proxyBase}/api/lunarx/proxy/playlist.m3u8?url=${encodeURIComponent(fullUrl)}${qParams}`;
        }
        return `${proxyBase}/api/lunarx/proxy/segment?url=${encodeURIComponent(fullUrl)}${qParams}`;
      }).join('\n');

      res.send(rewritten);
    });
  } catch (err) {
    console.error('M3U8 proxy error:', err.message);
    if (!res.headersSent) res.status(502).send('Failed to fetch M3U8 stream');
  }
});

// 8. HLS Video Segment Proxy (streams chunks with Referer and CORS so browser and ExoPlayer never get 403 or MIME errors)
router.get('/proxy/segment', async (req, res) => {
  try {
    let targetUrl = req.query.url;
    if (!targetUrl) {
      return res.status(400).send('Missing url parameter');
    }
    targetUrl = safelyDecode(targetUrl);
    if (!isSafeUpstreamUrl(targetUrl)) {
      return res.status(403).send('Forbidden: Prohibited upstream target');
    }
    const reqRef = req.query.ref ? safelyDecode(req.query.ref) : null;
    const reqOrig = req.query.orig ? safelyDecode(req.query.orig) : null;

    const { referer, origin, headers } = getUpstreamHeaders(targetUrl, reqRef, reqOrig);
    if (req.headers.range) {
      headers['Range'] = req.headers.range;
    }

    const { res: upstreamRes } = await fetchWithRedirects(targetUrl, headers);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');

    res.status(upstreamRes.statusCode);

    let contentType = upstreamRes.headers['content-type'] || 'video/mp2t';
    // If upstream labeled TS segment with image MIME types (.png, .jpg, .webp) or generic octet-stream, enforce video/mp2t for ExoPlayer
    if (contentType.includes('image/') || contentType.includes('application/octet-stream') || !contentType) {
      contentType = 'video/mp2t';
    }
    res.setHeader('Content-Type', contentType);
    if (upstreamRes.headers['content-length']) res.setHeader('Content-Length', upstreamRes.headers['content-length']);
    if (upstreamRes.headers['content-range']) res.setHeader('Content-Range', upstreamRes.headers['content-range']);
    if (upstreamRes.headers['accept-ranges']) res.setHeader('Accept-Ranges', upstreamRes.headers['accept-ranges']);

    upstreamRes.pipe(res);
  } catch (err) {
    console.error('Segment proxy error:', err.message);
    if (!res.headersSent) res.status(502).send('Segment fetch error');
  }
});

// 9. Subtitle VTT Proxy (ensures VTT files are served with proper Referer, UTF-8, and CORS)
router.get('/proxy/subtitle', async (req, res) => {
  try {
    let targetUrl = req.query.url;
    if (!targetUrl) {
      return res.status(400).send('Missing url parameter');
    }
    targetUrl = safelyDecode(targetUrl);
    if (!isSafeUpstreamUrl(targetUrl)) {
      return res.status(403).send('Forbidden: Prohibited upstream target');
    }
    const reqRef = req.query.ref ? safelyDecode(req.query.ref) : null;
    const reqOrig = req.query.orig ? safelyDecode(req.query.orig) : null;

    const { headers } = getUpstreamHeaders(targetUrl, reqRef, reqOrig);
    const { res: upstreamRes } = await fetchWithRedirects(targetUrl, headers);

    res.setHeader('Content-Type', 'text/vtt; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Cache-Control', 'public, max-age=86400');

    res.status(upstreamRes.statusCode);
    upstreamRes.pipe(res);
  } catch (err) {
    console.error('Subtitle proxy error:', err.message);
    if (!res.headersSent) res.status(502).send('Subtitle fetch error');
  }
});

router.options('/proxy/*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.status(204).end();
});

module.exports = router;

