import axios from 'axios';

async function tryEndpoint(url: string) {
    try {
        const res = await axios.get(url, {
             headers: {
                 'User-Agent': 'Mozilla/5.0'
             }
        });
        console.log(`Endpoint ${url} success: ${res.status}`);
        if(res.data && res.data.scenes) console.log("Has scenes structure");
        return res.data;
    } catch(e) {
        console.log(`Endpoint ${url} failed: ${e.response?.status}`);
    }
}

async function main() {
   await tryEndpoint('https://www.realitykings.com/api/v1/scenes?models=64432');
   await tryEndpoint('https://www.realitykings.com/api/v2/scenes?models=64432');
   await tryEndpoint('https://www.realitykings.com/api/scenes?models=64432');
   await tryEndpoint('https://api.realitykings.com/scenes?models=64432');
}

main();
