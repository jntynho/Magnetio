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
        
        const idToTry = '64432';
        const parameters = [
            'actors',
            'actorId',
            'performers',
            'modelId',
            'performer',
            'models',
            'model'
        ];
        
        for (const param of parameters) {
            console.log(`------ Probing param: ${param}=${idToTry} ------`);
            const apiUrl = `https://site-api.project1service.com/v2/releases?${param}=${idToTry}&limit=5`;
            try {
                const apiRes = await axios.get(apiUrl, {
                    headers: {
                        'instance': jwt,
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                    }
                });
                
                const results = apiRes.data.result || [];
                const total = apiRes.data.meta?.total || 0;
                console.log(`Result: Success! Count: ${results.length}, Total: ${total}`);
                
                if (results.length > 0) {
                    console.log(`First entry title: "${results[0].title}"`);
                    console.log(`First entry brand: "${results[0].brand}"`);
                    const actors = (results[0].actors || []).map((a: any) => `${a.name} (${a.id})`);
                    console.log(`First entry actors:`, actors);
                }
            } catch (err: any) {
                console.log(`Result: Error - ${err.message}`);
            }
        }
    } catch (e: any) {
        console.error("Main error:", e.message);
    }
}

main();
