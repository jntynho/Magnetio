import fs from 'fs';

function main() {
    const rawInst = JSON.parse(fs.readFileSync('rawInstance.json', 'utf8'));
    
    // Check structures
    const structures = rawInst.structures || [];
    console.log(`Found ${structures.length} structures.`);
    
    for (const struct of structures) {
        console.log(`- Structure: name="${struct.name}" (ID: ${struct.id}, type: "${struct.type}")`);
        if (struct.blocks && struct.blocks.length > 0) {
            console.log(`  Blocks:`, struct.blocks.map((b: any) => b.type || b.name));
            // Let's see if any block has configurations or api endpoints
            struct.blocks.forEach((b: any, index: number) => {
                const bStr = JSON.stringify(b);
                if (bStr.includes('api') || bStr.includes('release') || bStr.includes('scene') || bStr.includes('url')) {
                    console.log(`    Block #${index} matches terms! Keys:`, Object.keys(b));
                    if (b.configs) {
                        console.log(`      Configs:`, b.configs);
                    }
                }
            });
        }
    }
}

main();
