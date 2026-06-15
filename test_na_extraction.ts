import * as cheerio from 'cheerio';

async function run() {
  const url = 'https://www.naughtyamerica.com/pornstar/payton-preslee';
  try {
      const match = url.match(/\/pornstars?\/(?:[0-9]+\/)?([^/]+)/i);
      let modelName = 'Unknown';
      if (match) {
        modelName = match[1].replace(/-/g, ' ').split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      }
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        }
      });
      console.log('Status code:', response.status);
      const html = await response.text();
      const $ = cheerio.load(html);
      const scenes: any[] = [];
      const processedLinks = new Set<string>();

      $('.scene-item').each((i, el) => {
        const card = $(el);
        let link = card.find('a.contain-img').attr('href') || '';
        if (link && !link.startsWith('http')) link = `https://www.naughtyamerica.com${link}`;
        if (!link || processedLinks.has(link)) return;
        processedLinks.add(link);

        let title = '';
        const parts = link.split('/');
        const lastPart = parts.pop() || '';
        const titlePart = lastPart.replace(/-\d+$/, '').replace(/-/g, ' ');
        if (titlePart) title = titlePart.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

        let coverUrl = '';
        const mainImg = card.find('img.main-scene-img');
        if (mainImg.length > 0) coverUrl = mainImg.attr('data-srcset') || mainImg.attr('src') || mainImg.attr('data-src') || '';
        if (coverUrl.includes(' ')) coverUrl = coverUrl.trim().split(' ')[0];
        if (!coverUrl) {
          const source = card.find('picture source').first();
          if (source.length > 0) coverUrl = source.attr('data-srcset') || source.attr('srcset') || '';
          if (coverUrl.includes(' ')) coverUrl = coverUrl.trim().split(' ')[0];
        }
        if (coverUrl.startsWith('//')) coverUrl = 'https:' + coverUrl;

        const actorsList: string[] = [];
        card.find('.contain-actors a').each((_, modelEl) => {
          const actorText = $(modelEl).text().trim();
          if (actorText && !actorsList.includes(actorText)) actorsList.push(actorText);
        });
        
        if (modelName !== 'Unknown' && !actorsList.map(a => a.toLowerCase()).includes(modelName.toLowerCase())) {
          actorsList.unshift(modelName);
        }

        let matchedDate = '';
        const dateText = card.find('.entry-date').text().replace(/\s+/g, ' ').trim();
        const dateMatch = dateText.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2}, \d{4}/);
        if (dateMatch) matchedDate = dateMatch[0];

        let dateStr = '';
        let releaseDate = Date.now();
        if (matchedDate) {
          const d = new Date(matchedDate);
          dateStr = isNaN(d.getTime()) ? matchedDate : d.toISOString().split('T')[0];
          releaseDate = isNaN(d.getTime()) ? Date.now() : d.getTime();
        }

        const siteTitle = card.find('.site-title').text().trim() || 'Naughty America';

        scenes.push({ title, actors: actorsList, coverUrl, dateStr, releaseDate, siteTitle, link });
      });
      const scenesUrl = $('#performer-scenes-list').attr('data-scenes-url');
      console.log('Scenes Data UR:', scenesUrl);
      
      if (scenesUrl) {
         const resp2 = await fetch(scenesUrl + "?page=1", {
           headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', 'Accept': 'application/json, text/javascript, */*; q=0.01', "X-Requested-With": "XMLHttpRequest" }
         });
         console.log("Scenes URL Page 1 Status:", resp2.status);
         const res2Text = await resp2.text();
         console.log("Resp 1 length:", res2Text.length, "Preview:", res2Text.substring(0, 100));
         
         const resp3 = await fetch(scenesUrl + "?page=2", {
           headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', 'Accept': 'application/json, text/javascript, */*; q=0.01', "X-Requested-With": "XMLHttpRequest" }
         });
         console.log("Scenes URL Page 2 Status:", resp3.status);
         const res3Text = await resp3.text();
         console.log("Resp 2 length:", res3Text.length, "Preview:", res3Text.substring(0, 100));
      }
  } catch(e: any) {
    console.log(e.message);
  }
}
run();
