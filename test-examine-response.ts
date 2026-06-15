import fs from 'fs';

function main() {
    const data = JSON.parse(fs.readFileSync('rk_api_response.json', 'utf8'));
    const results = data.result || [];
    
    console.log(`Analyzing ${results.length} results from API...`);
    results.forEach((scene: any, index: number) => {
        console.log(`\n--- Scene #${index + 1}: "${scene.title}" ---`);
        console.log(`Brand: ${scene.brand} (shortName: ${scene.brandMeta?.shortName}, displayName: ${scene.brandMeta?.displayName})`);
        console.log(`Brand Meta ID: ${scene.brandMeta?.id}`);
        const actors = scene.actors || [];
        console.log("Actors:");
        actors.forEach((actor: any) => {
            console.log(`  - NAME: "${actor.name}" (ID: ${actor.id})`);
        });
    });
}

main();
