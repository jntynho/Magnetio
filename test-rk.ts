import axios from 'axios';
import * as cheerio from 'cheerio';

async function fetchRK() {
  try {
    const url = 'https://www.realitykings.com/scenes?models=64432';
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
      });
      console.log('Status code:', response.status);
      const html = response.data;
      const $ = cheerio.load(html);
      
      const title = $('title').text();
      console.log('Title:', title);
      
      const scenes = [];
      $('.card-wrapper').each((i, el) => {
        scenes.push($(el).html()?.substring(0, 100));
      });
      console.log('Cards:', scenes.length);
      
      // try to print some basic html from the body
      console.log('Full html length:', html.length);
      
      const fs = require('fs');
      fs.writeFileSync('rk_html.html', html);
      console.log('Saved to rk_html.html');
      
  } catch (e) {
    console.error(e.message);
  }
}
fetchRK();
