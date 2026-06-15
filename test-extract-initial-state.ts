import fs from 'fs';

function main() {
    const block = fs.readFileSync('script_block_0.json', 'utf8');
    
    const fields = [
        'window.__JUAN.initialState',
        'window.__JUAN.rawInstance'
    ];
    
    for (const field of fields) {
        const idx = block.indexOf(field + ' = ');
        if (idx !== -1) {
            console.log(`Found field: ${field} at index ${idx}`);
            const slice = block.substring(idx + field.length + 3);
            
            // We want to find the end of the JSON object.
            // Since it's a JS assignment, we can parse it carefully.
            // Let's find where the assignment ends. It ends at `;` followed by newline, or `;` followed by `window.` or `;` followed by `;` or `;` followed by `\n`
            let endIdx = -1;
            // Let's count braces to find the balanced closing brace of the JSON if it starts with `{` or `[`
            let startOfJSON = slice.trim();
            if (startOfJSON.startsWith('{') || startOfJSON.startsWith('[')) {
                let braceCount = 0;
                let inString = false;
                let escape = false;
                let foundEnd = false;
                for (let i = 0; i < slice.length; i++) {
                    const char = slice[i];
                    if (escape) {
                        escape = false;
                        continue;
                    }
                    if (char === '\\') {
                        escape = true;
                        continue;
                    }
                    if (char === '"') {
                        inString = !inString;
                        continue;
                    }
                    if (!inString) {
                        if (char === '{' || char === '[') {
                            braceCount++;
                        } else if (char === '}' || char === ']') {
                            braceCount--;
                            if (braceCount === 0) {
                                endIdx = i + 1;
                                foundEnd = true;
                                break;
                            }
                        }
                    }
                }
            }
            
            if (endIdx === -1) {
                // fallback to finding the semicolon
                console.log("Balanced brace fallback to semicolon...");
                endIdx = slice.indexOf(';\n');
                if (endIdx === -1) endIdx = slice.indexOf(';');
            }
            
            const jsonText = endIdx !== -1 ? slice.substring(0, endIdx) : slice;
            console.log(`Extracted JS block length for ${field}: ${jsonText.length}`);
            
            // Try to parse it! It might have comments or trailing commas, so we might need to eval it or parse cleanly.
            try {
                // Safely evaluate using simple Function constructor (or JSON.parse if it's pure JSON)
                const parsed = new Function(`return ${jsonText};`)();
                console.log(`Evaluated ${field} successfully! Keys:`, Object.keys(parsed));
                
                const filename = field.replace('window.__JUAN.', '') + '.json';
                fs.writeFileSync(filename, JSON.stringify(parsed, null, 2));
                console.log(`Wrote ${filename}`);
            } catch (e: any) {
                console.error(`Faield to evaluate/parse ${field}:`, e.message);
                fs.writeFileSync(field.replace('window.__JUAN.', '') + '_error.txt', jsonText);
            }
        }
    }
}

main();
