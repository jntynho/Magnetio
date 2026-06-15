import * as cheerio from 'cheerio';

async function fetchPage(url: string) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Accept': 'text/html',
    }
  });
  const html = await response.text();
  const $ = cheerio.load(html);
  const titles: string[] = [];
  $('.scene-item').each((i, el) => {
    titles.push($(el).find('a.contain-img').attr('href') || '');
  });
  
  // Also check if there's any link tag with "next" or a button with ID
  console.log("Next link:", $('link[rel="next"]').attr('href'));
  console.log("Load more button:", $('.load-more').length);
  console.log("Any pagination:", $('.pagination').length);
  console.log("Total scenes count:", $('.scene-item').length);
  return titles;
}

async function run() {
  const p1 = await fetchPage('https://www.naughtyamerica.com/pornstar/payton-preslee?page=1');
  const p2 = await fetchPage('https://www.naughtyamerica.com/pornstar/payton-preslee?page=2');
  console.log("Page 1 length:", p1.length, "First:", p1[0]);
  console.log("Page 2 length:", p2.length, "First:", p2[0]);
  console.log("Are they same?", p1[0] === p2[0]);
}

run();
