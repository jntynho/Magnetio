import fs from 'fs';

const html = fs.readFileSync('rk_html.html', 'utf-8');

const urls = html.match(/(https?:\/\/[^\s"'`]+)/g);
const uniqueUrls = Array.from(new Set(urls)).filter(u => u.includes('api') || u.includes('graphql') || u.includes('realitykings'));
console.log('unique URLs containing api/graphql/realitykings:');
console.log(uniqueUrls.join('\n'));

