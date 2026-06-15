import fs from 'fs';

async function main() {
    const html = fs.readFileSync('rk_model_page.html', 'utf8');
    
    // Look for application/json or similar next.js static data, or window.__DATA__
    const scriptBlocks: string[] = [];
    const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = scriptRegex.exec(html)) !== null) {
        scriptBlocks.push(match[1]);
    }
    
    console.log(`Found ${scriptBlocks.length} script blocks.`);
    
    // Find script blocks containing interesting words
    for (let i = 0; i < scriptBlocks.length; i++) {
        const block = scriptBlocks[i];
        if (block.includes('payton-preslee') || block.includes('Payton Preslee') || block.includes('scenes') || block.includes('releases')) {
            console.log(`Script Block ${i} (length ${block.length}) has matches!`);
            // Print first 500 chars and last 500 chars of the block
            console.log("START:", block.substring(0, 500));
            console.log("\n...\n");
            console.log("END:", block.substring(block.length - 500));
            console.log("-----------------------------------------");
            
            // Let's write this script block directly to a file to examine
            fs.writeFileSync(`script_block_${i}.json`, block);
        }
    }
    
    // Let's also check if there is any mention of another ID or model reference
    // like "modelId", "actorId", "performerId", "profile"
    const idRegexes = [
        /"modelId"\s*:\s*(\d+)/i,
        /"actorId"\s*:\s*(\d+)/i,
        /"performerId"\s*:\s*(\d+)/i,
        /"id"\s*:\s*(\d+)/i,
        /model_id\s*=\s*(\d+)/i,
        /performer_id\s*=\s*(\d+)/i
    ];
    
    for (const regex of idRegexes) {
        const m = html.match(regex);
        if (m) {
            console.log(`Matched ID regex ${regex}:`, m[0]);
        }
    }
}

main();
