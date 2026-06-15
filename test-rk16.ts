import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

async function fetchRK() {
  try {
    const url = 'https://www.realitykings.com/scenes?models=64432';
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Cookie': 'iAgree=true; age_verified=1; is2255=1'
      }
      });
      const html = response.data;
      fs.writeFileSync('rk_html_logged_in.html', html);
      const $ = cheerio.load(html);
      console.log('Title:', $('title').text());
      console.log('Script count:', $('script').length);
  } catch(e) {
      console.log(e.message);
  }
}
fetchRK();
