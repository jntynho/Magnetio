import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('rk_html.html', 'utf-8');
const $ = cheerio.load(html);

// log all unique tag names
const uniqueTags = new Set();
$('*').each((i, el) => {
    uniqueTags.add(el.tagName);
});
console.log('Tags:', Array.from(uniqueTags));
