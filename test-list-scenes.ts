import axios from 'axios';
import fs from 'fs';

async function main() {
    try {
        const pageUrl = 'https://www.realitykings.com/model/64432/payton-preslee';
        const pageResponse = await axios.get(pageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            }
        });
        
        const html = pageResponse.data;
        const jwtMatch = html.match(/"jwt"\s*:\s*"([^"]+)"/);
        if (!jwtMatch) {
            console.error("No JWT found!");
            return;
        }
        const jwt = jwtMatch[1];
        
        const apiUrl = `https://site-api.project1service.com/v2/releases?models=64432` + 
                       `&limit=10`;
                       
        const apiRes = await axios.get(apiUrl, {
            headers: {
                'instance': jwt,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });
        
        console.log("Writing raw API response to rk_api_response.json...");
        fs.writeFileSync('rk_api_response.json', JSON.stringify(apiRes.data, null, 2));
        console.log("Successfully wrote rk_api_response.json! Response count:", apiRes.data.result ? apiRes.data.result.length : 'none');
    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

main();
