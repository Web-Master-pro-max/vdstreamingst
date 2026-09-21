const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('d:/Dev/frontend/index.html', 'utf8');
const scriptMatches = html.split(/<script>/gi);

console.log(`Found ${scriptMatches.length - 1} inline script blocks`);
scriptMatches.slice(1).forEach((block, idx) => {
    const code = block.split('</script>')[0];
    try {
        new vm.Script(code);
        console.log(`Inline script block #${idx + 1}: Syntax OK! (${code.length} chars)`);
    } catch (err) {
        console.error(`Inline script block #${idx + 1} Syntax ERROR:`, err.message);
    }
});
