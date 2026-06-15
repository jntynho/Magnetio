import puppeteer from 'puppeteer';
import fs from 'fs';

async function run() {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    page.on('request', async (request) => {
        const url = request.url();
        if (url.includes('64432') || url.includes('/v2/') || url.includes('search')) {
            console.log('Intercepted request:', url);
        }
    });

    console.log('Navigating...');
    await page.goto('https://www.realitykings.com/scenes?models=64432', { waitUntil: 'networkidle2' });
    console.log('Done mapping.');
    await browser.close();
}
run();
