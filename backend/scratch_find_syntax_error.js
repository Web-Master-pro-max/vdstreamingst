const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('d:/Dev/frontend/index.html', 'utf8');
const scriptStartLine = html.substring(0, html.indexOf('<script>')).split('\n').length;
const code = html.split('<script>')[1].split('</script>')[0];

const lines = code.split('\n');
for (let i = 1; i <= lines.length; i++) {
    const chunk = lines.slice(0, i).join('\n');
    try {
        new vm.Script(chunk);
    } catch (err) {
        if (!err.message.includes('Unexpected end of input') && !err.message.includes('Unterminated')) {
            console.log(`Syntax Error near relative line ${i} (file line ${scriptStartLine + i}):`, err.message);
            console.log(`Code around line ${i}:`);
            console.log(lines.slice(Math.max(0, i - 5), i + 2).map((l, idx) => `${Math.max(1, i - 4) + idx}: ${l}`).join('\n'));
            break;
        }
    }
}
