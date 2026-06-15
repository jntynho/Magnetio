import fs from 'fs';

function main() {
    const raw = JSON.parse(fs.readFileSync('rawInstance.json', 'utf8'));
    
    console.log("rawInstance.site:", JSON.stringify(raw.site, null, 2));
    console.log("rawInstance.domain:", raw.domain);
    console.log("rawInstance.id (Instance ID):", raw.id);
    console.log("rawInstance.siteId:", raw.siteId);
    console.log("rawInstance.networkId:", raw.networkId);
    console.log("rawInstance.structures keys/sample:", Object.keys(raw.structures || {}).length, "structures");
    
    // Check structures content
    if (Array.isArray(raw.structures)) {
        console.log("First structure fields:", Object.keys(raw.structures[0]));
        console.log("First structure structureKey:", raw.structures[0].structureKey);
    }
}

main();
