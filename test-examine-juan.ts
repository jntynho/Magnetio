import fs from 'fs';

function main() {
    const block = fs.readFileSync('script_block_0.json', 'utf8');
    
    // Let's find what properties are assigned to window.__JUAN
    const assignments = [
        'window.__JUAN.config',
        'window.__JUAN.state',
        'window.__JUAN.translations',
        'window.__JUAN.routes',
        'window.__JUAN.page',
        'window.__JUAN.app',
        'window.__JUAN.props'
    ];
    
    for (const assignment of assignments) {
        const idx = block.indexOf(assignment + ' = ');
        if (idx !== -1) {
            console.log(`Found assignment to: ${assignment} at index ${idx}`);
            // Let's extract until the trailing semicolon and newline
            // We can match using a simple balanced brace or just slice a chunk
            const slice = block.substring(idx + assignment.length + 3, idx + assignment.length + 20000);
            // Let's find the closing semicolon that is followed by a newline or another assignment or function end
            // Usually it ends with `;` or `;\n`
            let endIdx = slice.indexOf(';\n');
            if (endIdx === -1) endIdx = slice.indexOf(';');
            const valueStr = endIdx !== -1 ? slice.substring(0, endIdx) : slice;
            console.log(`Length of ${assignment} value: ${valueStr.length}`);
            
            // Try to parse as JSON
            try {
                const parsed = JSON.parse(valueStr);
                console.log(`Parsed ${assignment} successfully! Keys:`, Object.keys(parsed));
                if (assignment === 'window.__JUAN.state') {
                    fs.writeFileSync('juan_state.json', JSON.stringify(parsed, null, 2));
                    console.log("Wrote juan_state.json");
                }
            } catch (e: any) {
                console.log(`Could not parse ${assignment} as direct JSON:`, e.message);
                // Let's write the first 500 characters to see why
                console.log("Snippet:", valueStr.substring(0, 500));
            }
        }
    }
}

main();
