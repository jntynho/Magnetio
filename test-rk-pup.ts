import puppeteer from 'puppeteer';
import fs from 'fs';

async function run() {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    const apiCalls: string[] = [];
    page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('api') || url.includes('graphql') || url.includes('search')) {
            console.log('Intercepted response:', url);
            try {
                if (response.status() === 200) {
                     const text = await response.text();
                     if (text.length > 100) {
                        fs.writeFileSync(`req_${url.replace(/[^a-zA-Z0-9]/g, '_')}.txt`, text.substring(0, 500) + '... (truncated)');
                     }
                }
            } catch (e) {
                // ignore
            }
        }
    });

    console.log('Navigating...');
    await page.goto('https://www.realitykings.com/scenes?models=64432', { waitUntil: 'networkidle2' });
    console.log('Done mapping.');
    await browser.close();
}

run().catch(console.error);
