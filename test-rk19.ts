import axios from 'axios';
import fs from 'fs';

const juan = JSON.parse(fs.readFileSync('juan_dump.json', 'utf-8'));
const jwt = juan.rawInstance?.jwt;

async function tryApi(url: string, headers: any) {
    try {
        console.log(`Trying ${url}`);
        const res = await axios.get(url, { headers });
         console.log(`Success! Status: ${res.status}`);
         console.log(JSON.stringify(res.data).substring(0, 300));
    } catch(e: any) {
         console.log(`Failed! Status: ${e.response?.status}`);
    }
}

async function run() {
    const headers = {
        'instance': juan.rawInstance.gatewayInstanceId,
        'Authorization': `Bearer ${jwt}`,
        'User-Agent': 'Mozilla/5.0'
    };
    
    // Brazzers uses 'instance: <token>' ! Let's try it.
    const hw = {
        'instance': jwt,
        'User-Agent': 'Mozilla/5.0'
    };

    await tryApi('https://site-api.project1service.com/v2/releases?models=64432', headers);
    await tryApi('https://site-api.project1service.com/v2/releases?models=64432', hw);
    
    // Maybe v1?
    await tryApi('https://site-api.project1service.com/v1/releases?models=64432', hw);
}
run();
