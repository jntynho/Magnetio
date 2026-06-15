import fs from 'fs';

function main() {
    const block = fs.readFileSync('script_block_0.json', 'utf8');
    
    // Find all occurrences of "payton" case-insensitive
    let pos = -1;
    const term = 'payton';
    console.log("Searching for:", term);
    
    let matchCount = 0;
    while ((pos = block.toLowerCase().indexOf(term, pos + 1)) !== -1) {
        matchCount++;
        console.log(`\nMatch ${matchCount} at character index ${pos}:`);
        const context = block.substring(Math.max(0, pos - 500), Math.min(block.length, pos + 500));
        console.log("CONTEXT:");
        console.log(context);
        console.log("------------------------------------------------------------");
    }
    
    console.log(`Total matches for '${term}': ${matchCount}`);
}

main();
