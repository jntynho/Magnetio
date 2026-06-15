import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

async function fetchRK() {
  try {
    const url = 'https://www.realitykings.com/scenes?models=64432';
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
      });
      const html = response.data;
      fs.writeFileSync('rk_html.html', html);
      console.log('Saved to rk_html.html');
      
  } catch (e) {
    console.error(e.message);
  }
}
fetchRK();
