import puppeteer from 'puppeteer';

async function run() {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    page.on('response', async (response) => {
        const url = response.url();
        const type = response.request().resourceType();
        if (type === 'fetch' || type === 'xhr') {
            console.log('XHR/Fetch url:', url);
            try {
                const text = await response.text();
                // look for some typical scene data
                if (text.includes('title') && text.includes('models') && text.length > 500) {
                     console.log('Found scene data in this URL!', text.substring(0, 150));
                }
            } catch (e) {
            }
        }
    });

    console.log('Navigating...');
    await page.goto('https://www.realitykings.com/scenes?models=64432', { waitUntil: 'networkidle0' });
    console.log('Done mapping.');
    await browser.close();
}
run();
