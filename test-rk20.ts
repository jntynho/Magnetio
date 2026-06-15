import axios from 'axios';
import fs from 'fs';

const juan = JSON.parse(fs.readFileSync('juan_dump.json', 'utf-8'));
const jwt = juan.rawInstance?.jwt;

async function run() {
    const hw = {
        'instance': jwt,
        'User-Agent': 'Mozilla/5.0'
    };

    const res = await axios.get('https://site-api.project1service.com/v2/releases?models=64432', { headers: hw });
    fs.writeFileSync('rk_api_response.json', JSON.stringify(res.data, null, 2));
    console.log("Saved rk_api_response.json");
}
run();
