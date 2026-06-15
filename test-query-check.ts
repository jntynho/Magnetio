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
        
        console.log("JWT extracted:", jwt.substring(0, 30) + "...");
        
        const urls = [
            'https://site-api.project1service.com/v2/releases?q=asdfghjkl&limit=5',
            'https://site-api.project1service.com/v2/releases?limit=5'
        ];
        
        for (const url of urls) {
            console.log(`\nQuerying URL: ${url}`);
            const res = await axios.get(url, {
                headers: {
                    'instance': jwt,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                }
            });
            console.log("Success! Result count:", res.data.result ? res.data.result.length : 'none');
            if (res.data.result && res.data.result.length > 0) {
                console.log("First item title:", res.data.result[0].title);
                console.log("First item brand:", res.data.result[0].brand);
            }
        }
    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

main();
