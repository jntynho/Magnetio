import axios from 'axios';

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
        console.log("Found JWT successfully:", jwt.substring(0, 30) + "...");
        
        const apiUrl = `https://site-api.project1service.com/v2/releases?models=64432&limit=10`;
        const apiRes = await axios.get(apiUrl, {
            headers: {
                'instance': jwt,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });
        
        const results = apiRes.data.result || [];
        console.log("Total API results fetched:", results.length);
        if (results.length > 0) {
            console.log("First entry title:", results[0].title);
            console.log("First entry brandMeta:", results[0].brandMeta);
            console.log("First entry actors:", results[0].actors);
        }
    } catch (e: any) {
        console.error("Error:", e.message);
        if (e.response) {
            console.error("Response data:", e.response.data);
        }
    }
}

main();
