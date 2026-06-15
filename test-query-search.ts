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
        
        const testEndpoints = [
            'v2/actors?q=Payton',
            'v2/actors?search=Payton',
            'v2/actors?name=Payton',
            'v2/releases?q=Payton',
            'v2/releases?search=Payton',
            'v2/performers?q=Payton',
            'v2/performers?search=Payton'
        ];
        
        for (const endpoint of testEndpoints) {
            console.log(`\n=== Testing endpoint: ${endpoint} ===`);
            const url = `https://site-api.project1service.com/${endpoint}`;
            try {
                const res = await axios.get(url, {
                    headers: {
                        'instance': jwt,
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                    }
                });
                console.log(`Success! Status: ${res.status}`);
                const data = res.data;
                const resultCount = data.result ? data.result.length : (Array.isArray(data) ? data.length : 'unknown');
                console.log(`Result Count: ${resultCount}`);
                
                if (data.result && data.result.length > 0) {
                    console.log("Sample result (first entry):", JSON.stringify(data.result[0], null, 2).substring(0, 500));
                } else if (Array.isArray(data) && data.length > 0) {
                    console.log("Sample array result (first entry):", JSON.stringify(data[0], null, 2).substring(0, 500));
                } else {
                    console.log("Full data structure keys:", Object.keys(data));
                }
            } catch (err: any) {
                console.log(`Error: ${err.message}`);
                if (err.response) {
                    console.log("Response status:", err.response.status);
                }
            }
        }
    } catch (e: any) {
        console.error("Main error:", e.message);
    }
}

main();
