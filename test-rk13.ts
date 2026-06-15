import axios from 'axios';

async function tryEndpoint(url: string) {
    try {
        const res = await axios.get(url, {
             headers: {
                 'User-Agent': 'Mozilla/5.0'
             }
        });
        console.log(`Endpoint ${url} success: ${res.status}`);
        const text = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
        console.log(`Data (first 200 chars): ${text.substring(0, 200)}`);
    } catch(e) {
        console.log(`Endpoint ${url} failed: ${e.response?.status}`);
    }
}

async function main() {
   await tryEndpoint('https://www.realitykings.com/api/v1/scenes?models=64432');
   await tryEndpoint('https://www.realitykings.com/api/v2/scenes?models=64432');
}

main();
