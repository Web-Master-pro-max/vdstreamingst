const fs = require('fs');

async function test() {
  const url = 'https://skirt-guided-dressing-fantastic.trycloudflare.com/uploads/videos/show_60/ep_593/master.m3u8';
  const res = await fetch(url);
  const text = await res.text();
  const lines = text.trim().split('\n');
  const lastSlashIndex = url.lastIndexOf('/');
  const baseUrl = lastSlashIndex !== -1 ? url.substring(0, lastSlashIndex + 1) : url;

  let audioIdx = 0;
  const cleanLines = ['#EXTM3U'];
  lines.forEach((line) => {
    const l = line.trim();
    if (!l || l.startsWith('#EXTM3U')) return;
    if (l.startsWith('#EXT-X-MEDIA:TYPE=SUBTITLES')) return;
    if (l.startsWith('#EXT-X-MEDIA:TYPE=AUDIO')) {
      const isSelected = audioIdx === 0;
      audioIdx++;
      let modified = l
        .replace(/DEFAULT=(YES|NO)/, `DEFAULT=${isSelected ? 'YES' : 'NO'}`)
        .replace(/AUTOSELECT=(YES|NO)/, `AUTOSELECT=${isSelected ? 'YES' : 'NO'}`)
        .replace(/URI="([^"]+)"/, (m, p1) => {
          const full = p1.startsWith('http') ? p1 : baseUrl + p1;
          return `URI="${full}"`;
        });
      cleanLines.push(modified);
      return;
    }
    if (l.startsWith('#EXT-X-STREAM-INF:')) {
      const modified = l.replace(/,SUBTITLES="[^"]+"/, '');
      cleanLines.push(modified);
      return;
    }
    if (!l.startsWith('#')) {
      const full = l.startsWith('http') ? l : baseUrl + l;
      cleanLines.push(full);
      return;
    }
    cleanLines.push(l);
  });
  console.log(cleanLines.join('\n'));
}

test().catch(console.error);
