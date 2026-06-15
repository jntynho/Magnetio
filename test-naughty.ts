import * as cheerio from 'cheerio';

async function run() {
  const targetUrl = "https://www.naughtyamerica.com/pornstar/payton-preslee";
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
  
  try {
    console.log("Fetching via AllOrigins Proxy...");
    const res = await fetch(proxyUrl);
    const data = await res.json();
    
    console.log("Response status:", res.status);
    if (data.contents) {
      const html = data.contents;
      const $ = cheerio.load(html);
      const title = $('title').text().trim();
      console.log("Bypassed! Page Title from Proxy:", title);
      
      if (!title.includes('Human Verification')) {
        console.log("SUCCESSFULLY LOADED PAGE CONTENT!");
        // Let's analyze the scene elements
        const sceneItems = $('.scene-item, .video-box, .playable-scene, div[class*="scene"], div[class*="video"]');
        console.log("Found raw scene-like containers count:", sceneItems.length);
        
        // Let's search inside the HTML for the text "Payton Preslee" or scene titles
        const links: string[] = [];
        $('a').each((i, el) => {
          const href = $(el).attr('href') || '';
          if (href.includes('/scene/') && !links.includes(href)) {
             links.push(href);
          }
        });
        console.log("Found unique /scene/ links:", links.length);
        console.log("Sample links:", links.slice(0, 5));
      } else {
        console.log("Failure: Still blocked by Human Verification even via proxy.");
      }
    } else {
      console.log("No contents returned from proxy.");
    }
  } catch (err: any) {
    console.log("Error:", err.message);
  }
}
run();
