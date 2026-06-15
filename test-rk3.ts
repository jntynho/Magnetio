import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('rk_html.html', 'utf-8');
const $ = cheerio.load(html);

console.log('Title:', $('title').text());
console.log('Body classes:', $('body').attr('class'));

// Common scene selectors
const selectors = ['article', '.scene', '.video-card', '.item', 'li', 'a', '.card', '.thumb'];
selectors.forEach(sel => {
  console.log(`Selector "${sel}" count:`, $(sel).length);
});

// Let's dump all script tags contents lengths
$('script').each((i, el) => {
  const text = $(el).html();
  if (text && text.length > 500) {
    console.log(`Script ${i} length: ${text.length}`);
    if (text.includes('models') || text.includes('scenes')) {
      console.log(`Script ${i} contains models/scenes`);
      fs.writeFileSync(`rk_script_${i}.js`, text);
    }
  }
});

// Let's dump the first few links
const links: any[] = [];
$('a').slice(0, 50).each((i, el) => links.push($(el).attr('href')));
console.log("First links:", links);
