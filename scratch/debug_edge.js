const http = require('http');
const { spawn } = require('child_process');

const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
  '--headless',
  '--remote-debugging-port=9222',
  '--disable-gpu',
  '--window-size=390,844',
  'http://localhost:8000/scratch/test_slider_dom.html'
]);

setTimeout(() => {
  http.get('http://localhost:9222/json', res => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', async () => {
      const tabs = JSON.parse(data);
      console.log('Tabs:', tabs.map(t => t.url));
      
      const wsUrl = tabs[0]?.webSocketDebuggerUrl;
      if (wsUrl) {
        // connect via WebSocket
        const WebSocket = require('ws'); // might not be installed, check
      }
      edge.kill();
    });
  }).on('error', e => {
    console.error('HTTP error:', e.message);
    edge.kill();
  });
}, 1500);
