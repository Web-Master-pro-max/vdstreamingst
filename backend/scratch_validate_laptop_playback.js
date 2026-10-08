const testUrl = 'http://13.202.95.5:8000/uploads/videos/show_60/ep_593/master.m3u8';
const PRESET_SERVERS = [
  { url: 'http://13.202.95.5:8000' },
  { url: 'https://skirt-guided-dressing-fantastic.trycloudflare.com' }
];

async function testHls() {
  const candidateUrls = [testUrl];
  const uploadsIdx = testUrl.indexOf('/uploads/');
  if (uploadsIdx !== -1) {
    const relPath = testUrl.substring(uploadsIdx);
    PRESET_SERVERS.forEach((srv) => {
      const candidate = `${srv.url}${relPath}`;
      if (!candidateUrls.includes(candidate)) {
        candidateUrls.push(candidate);
      }
    });
  }

  console.log('Testing candidates:', candidateUrls);

  let workingUrl = testUrl;
  let rawText = null;

  for (const cand of candidateUrls) {
    try {
      const res = await fetch(cand);
      if (res.ok) {
        const text = await res.text();
        if (text.includes('#EXTM3U')) {
          workingUrl = cand;
          rawText = text.trim();
          console.log('✅ Found working stream source at:', cand);
          break;
        }
      } else {
        console.log('Candidate returned status ' + res.status + ':', cand);
      }
    } catch (e) {
      console.log('Candidate fetch error for:', cand, e.message);
    }
  }

  const lastSlashIndex = workingUrl.lastIndexOf('/');
  const baseUrl = lastSlashIndex !== -1 ? workingUrl.substring(0, lastSlashIndex + 1) : workingUrl;

  const audioTracks = [];
  const lines = rawText.split('\n');
  let audioCounter = 0;
  lines.forEach((line) => {
    const l = line.trim();
    if (l.startsWith('#EXT-X-MEDIA:TYPE=AUDIO')) {
      const nameMatch = l.match(/NAME="([^"]*)"/);
      const langMatch = l.match(/LANGUAGE="([^"]*)"/);
      const uriMatch = l.match(/URI="([^"]*)"/);
      if (uriMatch && uriMatch[1]) {
        const lang = langMatch ? langMatch[1] : '';
        let name = nameMatch && nameMatch[1].trim() ? nameMatch[1].trim() : '';
        if (!name || name === 'und') {
          name = (lang === 'hin' ? 'Hindi' : lang === 'eng' ? 'English' : `Audio ${audioCounter + 1}`);
        }
        audioTracks.push({ name, lang, uri: baseUrl + uriMatch[1] });
        audioCounter++;
      }
    }
  });

  console.log('Parsed Audio Tracks:', audioTracks);

  let audioIdx = 0;
  const cleanLines = ['#EXTM3U'];
  lines.forEach((line) => {
    const l = line.trim();
    if (!l || l.startsWith('#EXTM3U')) return;
    if (l.startsWith('#EXT-X-MEDIA:TYPE=SUBTITLES')) return;
    if (l.startsWith('#EXT-X-MEDIA:TYPE=AUDIO')) {
      const isSelected = audioIdx === 0;
      const curTrack = audioTracks[audioIdx];
      audioIdx++;
      const safeName = curTrack.name;
      let modified = l;
      if (/NAME="[^"]*"/.test(modified)) {
        modified = modified.replace(/NAME="[^"]*"/, `NAME="${safeName}"`);
      }
      modified = modified
        .replace(/DEFAULT=(YES|NO)/, `DEFAULT=${isSelected ? 'YES' : 'NO'}`)
        .replace(/AUTOSELECT=(YES|NO)/, `AUTOSELECT=${isSelected ? 'YES' : 'NO'}`)
        .replace(/URI="([^"]+)"/, (m, p1) => `URI="${baseUrl}${p1}"`);
      cleanLines.push(modified);
      return;
    }
    if (l.startsWith('#EXT-X-STREAM-INF:')) {
      cleanLines.push(l.replace(/,SUBTITLES="[^"]+"/, ''));
      return;
    }
    if (!l.startsWith('#')) {
      cleanLines.push(baseUrl + l);
      return;
    }
    cleanLines.push(l);
  });

  console.log('\n--- OUTPUT SANITIZED PLAYLIST FOR EXOPLAYER ---');
  console.log(cleanLines.join('\n'));
}

testHls();
