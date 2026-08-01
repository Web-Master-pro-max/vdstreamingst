const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/admin.html');
const content = fs.readFileSync(filePath, 'utf8');
const scriptMatches = [...content.matchAll(/<script>([\s\S]*?)<\/script>/g)];

console.log(`Found ${scriptMatches.length} script tags.`);
scriptMatches.forEach((m, idx) => {
  try {
    new Function(m[1]);
    console.log(`Script tag #${idx + 1}: Valid syntax!`);
  } catch (err) {
    console.error(`Script tag #${idx + 1}: SyntaxError ->`, err.message);
  }
});
