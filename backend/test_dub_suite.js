const express = require('express');
const http = require('http');
const lunarx = require('./services/lunarx.js');
const lunarxRouter = require('./routes/lunarx.js');

const app = express();
app.use('/api/stream', lunarxRouter);
app.use('/api/lunarx', lunarxRouter);

const server = http.createServer(app);

const PORT = 8997;

server.listen(PORT, async () => {
  console.log(`[Test Suite] Started local test server on port ${PORT}...`);
  let failed = 0;

  function assert(condition, message) {
    if (!condition) {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    } else {
      console.log(`✅ PASS: ${message}`);
    }
  }

  try {
    // Test 1: Episode list hasDub flag & dubProviders
    console.log('\n--- Test 1: Episode Metadata ---');
    const eps = await lunarx.getEpisodes(21);
    assert(eps.length > 0, 'Found episodes for One Piece');
    assert(eps[0].hasDub === true, 'One Piece Ep 1 hasDub === true');
    assert(eps[0].dubProviders.includes('3rdprovider'), 'dubProviders includes 3rdprovider');

    // Test 2: Dub stream resolution on multiple popular anime
    console.log('\n--- Test 2: Multi-Anime Dub Stream Resolution ---');
    const testAnimeIds = [1735, 1, 21, 113415, 101922];
    for (const anilistId of testAnimeIds) {
      const stream = await lunarx.getStream(anilistId, 1, 'zuna', 'dub');
      assert(stream.success === true, `Anime #${anilistId} dub stream success`);
      assert(stream.type === 'dub', `Anime #${anilistId} stream type is dub`);
      assert(stream.host === '3rdprovider', `Anime #${anilistId} resolved to 3rdprovider`);
      assert(!stream.isFallbackSub, `Anime #${anilistId} has genuine dub (not fallback sub)`);
      assert(typeof stream.streamUrl === 'string' && stream.streamUrl.includes('/api/stream/hls/live.m3u8'), `Anime #${anilistId} valid streamUrl`);
    }

    // Test 3: Master playlist audio tag rewrites for Dub
    console.log('\n--- Test 3: Master Playlist Audio Tags ---');
    const opStream = await lunarx.getStream(1735, 1, 'yuki', 'dub');
    const masterRes = await fetch(`http://localhost:${PORT}${opStream.streamUrl}`);
    assert(masterRes.status === 200, 'Master playlist returned 200 OK');
    const masterText = await masterRes.text();
    const lines = masterText.split('\n');

    const audioLines = lines.filter(l => l.startsWith('#EXT-X-MEDIA:TYPE=AUDIO'));
    assert(audioLines.length >= 2, 'Found at least 2 audio tracks in master playlist');
    assert(audioLines[0].includes('LANGUAGE="eng"'), 'English audio track is strictly INDEX 0 in master playlist');
    assert(audioLines[0].includes('DEFAULT=YES'), 'English audio marked DEFAULT=YES');
    assert(audioLines[0].includes('AUTOSELECT=YES'), 'English audio marked AUTOSELECT=YES');

    const jpnLine = audioLines.find(l => l.includes('LANGUAGE="jpn"'));
    assert(!!jpnLine, 'Found Japanese audio track in master playlist');
    assert(jpnLine.includes('DEFAULT=NO'), 'Japanese audio marked DEFAULT=NO');
    assert(jpnLine.includes('AUTOSELECT=NO'), 'Japanese audio marked AUTOSELECT=NO');

    // Test 4: Audio playlist and segment proxying
    console.log('\n--- Test 4: Audio Playlist & Segment Proxy ---');
    const audioUriMatch = engLine.match(/URI="([^"]+)"/);
    assert(!!audioUriMatch, 'Extracted English Audio URI');
    const audioPlaylistUrl = audioUriMatch[1];
    const audioRes = await fetch(audioPlaylistUrl);
    assert(audioRes.status === 200, 'Audio playlist returned 200 OK');
    const audioText = await audioRes.text();
    assert(audioText.includes('#EXTM3U'), 'Audio playlist contains #EXTM3U');
    assert(audioText.includes('#EXT-X-KEY:METHOD=AES-128'), 'Audio playlist contains AES-128 key');

    // Fetch key
    const keyMatch = audioText.match(/#EXT-X-KEY:METHOD=AES-128,URI="([^"]+)"/);
    assert(!!keyMatch, 'Extracted Audio Key URI');
    const keyRes = await fetch(keyMatch[1]);
    assert(keyRes.status === 200, 'Audio Key returned 200 OK');
    assert(keyRes.headers.get('content-type') === 'application/octet-stream', 'Audio Key Content-Type is application/octet-stream');
    const keyBuf = await keyRes.arrayBuffer();
    assert(keyBuf.byteLength === 16, 'Audio Key is exactly 16 bytes');

    // Fetch first audio segment
    const firstAudioSegUrl = audioText.split('\n').find(l => l.startsWith(`http://localhost:${PORT}`));
    assert(!!firstAudioSegUrl, 'Found first audio segment URL');
    const segRes = await fetch(firstAudioSegUrl);
    assert(segRes.status === 200, 'Audio Segment returned 200 OK');
    const segBuf = await segRes.arrayBuffer();
    assert(segBuf.byteLength > 1000, `Audio Segment has valid size: ${segBuf.byteLength} bytes`);

    // Test 5: Fallback behavior on anime without dub
    console.log('\n--- Test 5: Non-Dubbed Anime Fallback ---');
    const noDubStream = await lunarx.getStream(147864, 1, 'zuna', 'dub');
    assert(noDubStream.success === true, 'No-dub anime returns valid stream');
    assert(noDubStream.isFallbackSub === true, 'isFallbackSub flag is set to true');
    assert(noDubStream.type === 'sub', 'Fell back to Japanese sub stream');

    console.log(`\n================================`);
    if (failed === 0) {
      console.log('🎉 ALL TESTS PASSED! ENGLISH DUB IS ROCK-SOLID!');
    } else {
      console.error(`💥 ${failed} TEST(S) FAILED!`);
    }
    console.log(`================================\n`);
  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  } finally {
    server.close();
    process.exit(failed === 0 ? 0 : 1);
  }
});
