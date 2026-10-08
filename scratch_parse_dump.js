const fs = require('fs');
if (!fs.existsSync('dump_modal.xml')) {
  console.log('dump_modal.xml does not exist');
  process.exit(1);
}
const xml = fs.readFileSync('dump_modal.xml', 'utf8');
const regex = /<node[^>]*text="([^"]*)"[^>]*bounds="([^"]+)"/g;
let m;
while ((m = regex.exec(xml)) !== null) {
  if (m[1]) console.log(`Text: "${m[1]}", Bounds: ${m[2]}`);
}
