import puppeteer from 'puppeteer';

async function run() {
  console.log('Launching puppeteer...');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  console.log('Navigating to NaughtyAmerica...');
  const response = await page.goto('https://www.naughtyamerica.com/pornstar/payton-preslee', { waitUntil: 'networkidle2' });
  
  console.log('Status code:', response?.status());
  
  const html = await page.content();
  console.log("Length of HTML:", html.length);
  
  if (html.includes('scene-item')) {
    console.log("SUCCESS: Found scene-item elements!");
    const title = await page.title();
    console.log('Page Title:', title);
  } else {
    console.log("FAILED to find scene elements.");
    const title = await page.title();
    console.log('Page Title:', title);
  }
  
  await browser.close();
}

run();
