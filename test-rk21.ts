import axios from 'axios';

async function scrapeRK(url: string) {
    const pageResponse = await axios.get(url, {
         headers: {
             'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
         }
    });
    
    const html = pageResponse.data;
    
    // Extact JWT
    const jwtMatch = html.match(/"jwt"\s*:\s*"([^"]+)"/);
    if (!jwtMatch) throw new Error("No JWT found in RealityKings page");
    const jwt = jwtMatch[1];
    
    // Extract Model ID
    // either models=64432 or /model/64432/khloe-kapri
    const modelIdMatch = url.match(/models=(\d+)/i) || url.match(/\/model\/(\d+)/i);
    if (!modelIdMatch) throw new Error("Could not extract model ID from URL");
    const modelId = modelIdMatch[1];
    
    // Call the API
    const apiUrl = `https://site-api.project1service.com/v2/releases?models=${modelId}&limit=100`;
    const apiRes = await axios.get(apiUrl, {
        headers: {
            'instance': jwt,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
    });
    
    const results = apiRes.data.result || [];
    const scenes = results.map((scene: any) => {
         const timestamp = new Date(scene.dateReleased).getTime();
         let coverUrl = '';
         if (scene.images && scene.images.poster) {
             const keys = Object.keys(scene.images.poster);
             if (keys.length > 0) {
                 const posterData = scene.images.poster[keys[0]];
                 if (posterData.lg) coverUrl = posterData.lg.urls?.webp || posterData.lg.urls?.default || posterData.lg.url;
                 else if (posterData.md) coverUrl = posterData.md.urls?.webp || posterData.md.urls?.default || posterData.md.url;
                 else if (posterData.sm) coverUrl = posterData.sm.urls?.webp || posterData.sm.urls?.default || posterData.sm.url;
             }
         }
         
         const actors = (scene.actors || []).map((a: any) => a.name);
         
         return {
             title: scene.title,
             date: scene.dateReleased ? scene.dateReleased.split('T')[0] : '',
             releaseDate: isNaN(timestamp) ? Date.now() : timestamp,
             coverUrl,
             actors,
             tag: scene.brandMeta?.displayName || 'RealityKings'
         };
    });
    
    console.log(scenes.slice(0, 5));
    console.log(`Extracted ${scenes.length} scenes.`);
}

scrapeRK('https://www.realitykings.com/scenes?models=64432').catch(console.error);
