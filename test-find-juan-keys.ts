import fs from 'fs';

function main() {
    const block = fs.readFileSync('script_block_0.json', 'utf8');
    
    // Find all occurrences of window.__JUAN or __JUAN
    const regex = /window\.__JUAN\.[a-zA-Z0-9_]+/gi;
    let match;
    const matches = new Set<string>();
    while ((match = regex.exec(block)) !== null) {
        matches.add(match[0]);
    }
    
    console.log("Found matches starting with window.__JUAN:", Array.from(matches));
    
    // Let's also look for any assignments to window variables
    const windowMatches = new Set<string>();
    const windowRegex = /window\.[a-zA-Z0-9_]+/gi;
    while ((match = windowRegex.exec(block)) !== null) {
        windowMatches.add(match[0]);
    }
    console.log("All window variables declared:", Array.from(windowMatches));
}

main();
