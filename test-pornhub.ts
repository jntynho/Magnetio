import axios from 'axios';
import * as cheerio from 'cheerio';

async function searchPornhub() {
  try {
    const r = await axios.get('https://www.pornhub.com/pornstar/search?search=Payton+Preslee');
    const $ = cheerio.load(r.data);
    
    console.log("Title:", $('title').text());
    
    const stars = [];
    $('.title, .name, .pornStarName, .performerCardName, .porn-star, a').each((_, el) => {
      const cls = $(el).attr('class') || '';
      if (cls.toLowerCase().includes('name') || cls.toLowerCase().includes('title') || $(el).attr('href')?.includes('/pornstar/')) {
        const text = $(el).text().trim();
        if (text) stars.push(text);
      }
    });
    console.log("Pornhub search:", stars.slice(0, 20));
  } catch (e) {
    console.error(e.message);
  }
}

searchPornhub();
