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
        
        const rawInst = JSON.parse(fs.readFileSync('rawInstance.json', 'utf8'));
        const instanceId = String(rawInst.id || '331061');
        
        const testCases = [
            {
                name: "Case 1: instance=jwt (current server.ts implementation)",
                headers: {
                    'instance': jwt,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                }
            },
            {
                name: "Case 2: instance=jwt AND Authorization=Bearer jwt",
                headers: {
                    'instance': jwt,
                    'Authorization': `Bearer ${jwt}`,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                }
            },
            {
                name: "Case 3: instance=instanceId AND Authorization=Bearer jwt",
                headers: {
                    'instance': instanceId,
                    'Authorization': `Bearer ${jwt}`,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                }
            },
            {
                name: "Case 4: instance=instanceId (No Authorization)",
                headers: {
                    'instance': instanceId,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                }
            },
            {
                name: "Case 5: Authorization=Bearer jwt (No instance header)",
                headers: {
                    'Authorization': `Bearer ${jwt}`,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                }
            }
        ];
        
        for (const tc of testCases) {
            console.log(`\n=== Running: ${tc.name} ===`);
            try {
                const res = await axios.get('https://site-api.project1service.com/v2/releases?models=64432&limit=3', {
                    headers: tc.headers
                });
                
                console.log(`Success! HTTP Status: ${res.status}`);
                const results = res.data.result || [];
                console.log(`Result Count: ${results.length}`);
                if (results.length > 0) {
                    console.log(`First item title: "${results[0].title}"`);
                    console.log(`First item brand: "${results[0].brand}"`);
                }
            } catch (err: any) {
                console.log(`Failed! Status: ${err.response?.status}, Error: ${err.message}`);
            }
        }
    } catch (e: any) {
        console.error("Main error:", e.message);
    }
}

main();
