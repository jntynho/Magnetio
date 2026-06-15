import axios from 'axios';

async function main() {
    const urls = [
        'https://www.realitykings.com/api/v1/scenes?models=64432',
        'https://www.realitykings.com/api/scenes?models=64432'
    ];
    for (const url of urls) {
        try {
            console.log(`Fetching: ${url}`);
            const res = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                }
            });
            console.log("Status:", res.status);
            console.log("Response Type:", typeof res.data);
            const bodyStr = typeof res.data === 'object' ? JSON.stringify(res.data) : String(res.data);
            console.log("Beginning of response:", bodyStr.substring(0, 300));
        } catch (e: any) {
            console.log(`Failed for ${url}: ${e.message}`);
        }
    }
}

main();
