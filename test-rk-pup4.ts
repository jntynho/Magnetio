import puppeteer from 'puppeteer';
import fs from 'fs';

async function run() {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    console.log('Navigating...');
    await page.goto('https://www.realitykings.com/scenes?models=64432', { waitUntil: 'load' });
    
    // Set cookie and reload to bypass age check
    await page.setCookie({ name: 'iAgree', value: '1', domain: '.realitykings.com' });
    await page.goto('https://www.realitykings.com/scenes?models=64432', { waitUntil: 'networkidle2' });

    console.log('Extracting text...');
    const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 5000));
    fs.writeFileSync('rk_text_pup.txt', bodyText);
    
    const html = await page.content();
    fs.writeFileSync('rk_html_pup.html', html);
    
    await browser.close();
    console.log('Done.');
}
run();
