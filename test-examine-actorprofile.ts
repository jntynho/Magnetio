import fs from 'fs';

function main() {
    const rawInst = JSON.parse(fs.readFileSync('rawInstance.json', 'utf8'));
    const structures = rawInst.structures || [];
    
    // Find ActorProfile structure
    const actorProfile = structures.find((s: any) => s.name === 'ActorProfile');
    if (!actorProfile) {
        console.log("Could not find ActorProfile structure!");
        return;
    }
    
    console.log("ActorProfile structure keys:", Object.keys(actorProfile));
    console.log("Blocks:", JSON.stringify(actorProfile.blocks, null, 2));
    
    // Also log structureConfigs
    console.log("Structure configs:", JSON.stringify(actorProfile.structureConfigs, null, 2));
}

main();
