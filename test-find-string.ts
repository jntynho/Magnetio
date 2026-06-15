import fs from 'fs';

function main() {
    const html = fs.readFileSync('rk_model_page.html', 'utf8');
    
    // Find Title tag
    const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
    console.log("Page Title:", titleMatch ? titleMatch[1].trim() : "None");
    
    // Check if Cloudflare or browser verification is mentioned
    console.log("Is cloudflare mentioned?", html.toLowerCase().includes('cloudflare'));
    console.log("Is javascript/cookies required mentioned?", html.toLowerCase().includes('javascript') || html.toLowerCase().includes('cookie'));
    
    // Print first 500 characters
    console.log("First 500 chars:", html.substring(0, 500));
}

main();
