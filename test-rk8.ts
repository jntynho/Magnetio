import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('rk_html.html', 'utf-8');
const $ = cheerio.load(html);

console.log('Script count:', $('script').length);
$('script').each((i, el) => {
   const text = $(el).html();
   if (text && text.includes('scenes?models=')) {
        console.log(`Script ${i} has models URL in it`);
   }
   if (text && text.includes('videoList')) {
       console.log(`Script ${i} has videoList`);
   }
});

fs.writeFileSync('rk_html_dump.txt', html);
