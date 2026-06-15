import cheerio from 'cheerio';

async function run() {
  const url = 'https://www.naughtyamerica.com/pornstar/payton-preslee?page=2';
  try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      console.log('Status code:', response.status);
      const html = await response.text();
      console.log('Length:', html.length);
      console.log('Includes scene-item:', html.includes('scene-item'));
  } catch(e: any) {
    console.log(e.message);
  }
}
run();
