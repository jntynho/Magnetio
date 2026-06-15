import fs from 'fs';

function main() {
    console.log("Analyzing initialState.json and rawInstance.json...");
    
    const initial = JSON.parse(fs.readFileSync('initialState.json', 'utf8'));
    const rawInst = JSON.parse(fs.readFileSync('rawInstance.json', 'utf8'));
    
    console.log("initialState.client keys:", Object.keys(initial.client || {}));
    if (initial.client && initial.client.model) {
        console.log("initialState.client.model keys:", Object.keys(initial.client.model));
        console.log("initialState.client.model metadata:", JSON.stringify(initial.client.model, null, 2).substring(0, 500));
    }
    
    // Check key structures in initial.client
    for (const key of Object.keys(initial.client || {})) {
        console.log(`initialState.client.${key} keys:`, Object.keys(initial.client[key] || {}));
    }
    
    // Check structures in rawInstance
    console.log("rawInstance.structures keys:", Object.keys(rawInst.structures || {}));
    
    // Search the files for 'Payton' or '64432'
    const initialStr = JSON.stringify(initial);
    const rawInstStr = JSON.stringify(rawInst);
    
    console.log("Does initialState contain 'Payton'?", initialStr.includes('Payton'));
    console.log("Does rawInstance contain 'Payton'?", rawInstStr.includes('Payton'));
    console.log("Does initialState contain '64432'?", initialStr.includes('64432'));
    console.log("Does rawInstance contain '64432'?", rawInstStr.includes('64432'));
    
    // Let's search for "releases" or "scenes" keys in initialState or rawInstance
    const listKeys = (obj: any, path = ''): string[] => {
        let results: string[] = [];
        if (typeof obj === 'object' && obj !== null) {
            for (const k of Object.keys(obj)) {
                const currentPath = path ? `${path}.${k}` : k;
                if (k.toLowerCase().includes('release') || k.toLowerCase().includes('scene') || k.toLowerCase().includes('model')) {
                    results.push(currentPath);
                }
                if (typeof obj[k] === 'object' && obj[k] !== null && results.length < 50) {
                    results = results.concat(listKeys(obj[k], currentPath));
                }
            }
        }
        return results;
    };
    
    console.log("Keys matching releases/scenes/models in initialState:", listKeys(initial).slice(0, 20));
}

main();
