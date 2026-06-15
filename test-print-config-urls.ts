import fs from 'fs';

function main() {
    const rawInst = JSON.parse(fs.readFileSync('rawInstance.json', 'utf8'));
    
    // config of JUAN is in script_block_0.json
    // Let's parse config directly from script_block_0.json or extract it properly
    const block = fs.readFileSync('script_block_0.json', 'utf8');
    const idx = block.indexOf('window.__JUAN.config = ');
    if (idx !== -1) {
        const slice = block.substring(idx + 'window.__JUAN.config = '.length, idx + 10000);
        let endIdx = slice.indexOf(';\n');
        if (endIdx === -1) endIdx = slice.indexOf(';');
        const configStr = slice.substring(0, endIdx);
        const config = JSON.parse(configStr);
        console.log("dataApiUrl:", config.dataApiUrl);
        console.log("authApiUrl:", config.authApiUrl);
        console.log("rteApiUrl:", config.rteApiUrl);
        console.log("gatewayAppUrl:", config.gatewayAppUrl);
        console.log("Full config keys & values of interests:");
        for (const k of Object.keys(config)) {
            if (k.toLowerCase().includes('url') || k.toLowerCase().includes('api')) {
                console.log(`  - ${k}: ${config[k]}`);
            }
        }
    }
}

main();
