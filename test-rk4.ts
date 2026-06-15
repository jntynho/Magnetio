import fs from 'fs';

let scriptText = fs.readFileSync('rk_script_0.js', 'utf-8');
console.log('Start of script:', scriptText.substring(0, 500));
console.log('End of script:', scriptText.substring(scriptText.length - 500));

// find patterns
const windowNext = scriptText.indexOf('__NEXT_DATA__');
console.log('__NEXT_DATA__ index:', windowNext);

const apollo = scriptText.indexOf('APOLLO');
console.log('APOLLO index:', apollo);

const nuxt = scriptText.indexOf('window.__NUXT__');
console.log('NUXT index:', nuxt);

