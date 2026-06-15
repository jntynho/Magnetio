import puppeteer from 'puppeteer';

async function run() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)');
  
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (request.url().includes('api') || request.url().includes('scenes')) {
      console.log('Intercepted Request:', request.url());
    }
    request.continue();
  });
  
  await page.goto('https://www.naughtyamerica.com/pornstar/payton-preslee');
  
  // Try scrolling down to load more items
  let previousHeight = 0;
  for (let i = 0; i < 5; i++) {
    previousHeight = await page.evaluate('document.body.scrollHeight');
    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    await new Promise(r => setTimeout(r, 2000));
    const newHeight: number = await page.evaluate('document.body.scrollHeight');
    console.log("Scrolled iteration", i, "items:", await page.$$eval('.scene-item', els => els.length));
    if (newHeight === previousHeight) break;
  }
  
  console.log("Found scenes count:", await page.$$eval('.scene-item', els => els.length));
  
  const paginationLinks = await page.$$eval('.pagination a', els => els.map(el => el.getAttribute('href')));
  console.log("Pagination:", paginationLinks);
  
  const loadMore = await page.$$eval('.load-more', els => els.length);
  console.log("Load more button:", loadMore);
  
  await browser.close();
}

run();
