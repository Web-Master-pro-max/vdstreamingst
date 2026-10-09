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

// Helper to fetch with redirect handling
function fetchWithRedirects(targetUrl, headers, maxRedirects = 3) {
  return new Promise((resolve, reject) => {
    function doRequest(currentUrl, redirectsLeft) {
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
  } else if (targetUrl.includes('nexabloom') || targetUrl.includes('silentvoyage') || targetUrl.includes('megaplay') || targetUrl.includes('oakhorizon')) {
    referer = 'https://megaplay.buzz/';
    origin = 'https://megaplay.buzz';
  } else if (targetUrl.includes('krussdomi') || targetUrl.includes('kaa.lt')) {
    referer = 'https://kaa.lt/';
    origin = 'https://kaa.lt';
  } else if (targetUrl.includes('echovideo')) {
    referer = (reqReferer && reqReferer.includes('echovideo')) ? reqReferer : 'https://play.echovideo.ru/';
    origin = 'https://play.echovideo.ru';
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
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    }
  };
}

// 7. HLS M3U8 Playlist Stream Proxy (attaches required Referer header and rewrites playlist URLs)
router.get('/proxy/m3u8', async (req, res) => {
  try {
    const targetUrl = req.query.url;
    if (!targetUrl) {
      return res.status(400).send('Missing url parameter');
    }

    const { referer, origin, headers } = getUpstreamHeaders(targetUrl, req.query.ref, req.query.orig);

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
      const rewritten = lines.map(line => {
        const trimmed = line.trim();
        if (!trimmed) return line;

        // Handle URI="..." tags (e.g. #EXT-X-KEY, #EXT-X-MEDIA)
        if (trimmed.startsWith('#')) {
          if (trimmed.includes('URI="')) {
            return trimmed.replace(/URI="([^"]+)"/g, (m, uri) => {
              const fullUri = uri.startsWith('http') ? uri : (baseUrl + uri);
              const up = getUpstreamHeaders(fullUri, referer, origin);
              const qParams = `&ref=${encodeURIComponent(up.referer)}${up.origin ? `&orig=${encodeURIComponent(up.origin)}` : ''}`;
              if (fullUri.includes('.m3u8') || fullUri.includes('manifest') || fullUri.includes('playlist')) {
                return `URI="/api/lunarx/proxy/m3u8?url=${encodeURIComponent(fullUri)}${qParams}"`;
              }
              return `URI="/api/lunarx/proxy/segment?url=${encodeURIComponent(fullUri)}${qParams}"`;
            });
          }
          return line;
        }

        // Line is a URI: sub-playlist or segment
        const fullUrl = trimmed.startsWith('http') ? trimmed : (baseUrl + trimmed);
        const up = getUpstreamHeaders(fullUrl, referer, origin);
        const qParams = `&ref=${encodeURIComponent(up.referer)}${up.origin ? `&orig=${encodeURIComponent(up.origin)}` : ''}`;
        if (fullUrl.includes('.m3u8') || fullUrl.includes('manifest') || fullUrl.includes('playlist')) {
          return `/api/lunarx/proxy/m3u8?url=${encodeURIComponent(fullUrl)}${qParams}`;
        }
        return `/api/lunarx/proxy/segment?url=${encodeURIComponent(fullUrl)}${qParams}`;
      }).join('\n');

      res.send(rewritten);
    });
  } catch (err) {
    console.error('M3U8 proxy error:', err.message);
    if (!res.headersSent) res.status(502).send('Failed to fetch M3U8 stream');
  }
});

// 8. HLS Video Segment Proxy (streams chunks with Referer and CORS so browser never gets 403)
router.get('/proxy/segment', async (req, res) => {
  try {
    const targetUrl = req.query.url;
    if (!targetUrl) {
      return res.status(400).send('Missing url parameter');
    }

    const { referer, origin, headers } = getUpstreamHeaders(targetUrl, req.query.ref, req.query.orig);
    if (req.headers.range) {
      headers['Range'] = req.headers.range;
    }

    const { res: upstreamRes } = await fetchWithRedirects(targetUrl, headers);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');

    res.status(upstreamRes.statusCode);

    if (upstreamRes.headers['content-type']) res.setHeader('Content-Type', upstreamRes.headers['content-type']);
    if (upstreamRes.headers['content-length']) res.setHeader('Content-Length', upstreamRes.headers['content-length']);
    if (upstreamRes.headers['content-range']) res.setHeader('Content-Range', upstreamRes.headers['content-range']);
    if (upstreamRes.headers['accept-ranges']) res.setHeader('Accept-Ranges', upstreamRes.headers['accept-ranges']);

    upstreamRes.pipe(res);
  } catch (err) {
    console.error('Segment proxy error:', err.message);
    if (!res.headersSent) res.status(502).send('Segment fetch error');
  }
});

router.options('/proxy/*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.status(204).end();
});

module.exports = router;

