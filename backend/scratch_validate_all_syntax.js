const fs = require('fs');
const vm = require('vm');

['d:/Dev/frontend/index.html', 'd:/Dev/frontend/view.html', 'd:/Dev/frontend/admin.html'].forEach(filePath => {
    const html = fs.readFileSync(filePath, 'utf8');
    const scriptMatches = html.split(/<script(?:\s+[^>]*)?>/gi);

    console.log(`=== ${filePath} ===`);
    scriptMatches.slice(1).forEach((block, idx) => {
        const code = block.split('</script>')[0];
        // skip external script links without body
        if (code.trim().length === 0) return;
        try {
            new vm.Script(code);
            console.log(`Script #${idx + 1}: Syntax OK! (${code.length} chars)`);
        } catch (err) {
            console.error(`Script #${idx + 1} Syntax ERROR:`, err.message);
        }
    });
});
