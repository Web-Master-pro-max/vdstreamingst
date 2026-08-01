const fs = require('fs');
const path = require('path');

const files = ['frontend/vercel.json', 'vercel.json'];

files.forEach(f => {
  try {
    const filePath = path.join(__dirname, '..', f);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      JSON.parse(content);
      console.log(`✅ ${f}: Valid JSON!`);
    } else {
      console.log(`File not found: ${filePath}`);
    }
  } catch (err) {
    console.error(`❌ ${f}: JSON Error ->`, err.message);
  }
});
