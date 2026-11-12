const { execSync } = require('child_process');
const fs = require('fs');

const content = execSync('git show HEAD:frontend/index.html', { encoding: 'utf8' });
const lines = content.split('\n');

console.log('Total lines:', lines.length);

lines.forEach((l, i) => {
    const lower = l.toLowerCase();
    if (lower.includes('<section') || lower.includes('hero') || lower.includes('banner') || lower.includes('chat') || lower.includes('top 10') || lower.includes('masterpiece')) {
        console.log(`${i}: ${l.trim().slice(0, 120)}`);
    }
});
