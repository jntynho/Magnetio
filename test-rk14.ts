import fs from 'fs';

const html = fs.readFileSync('rk_html.html', 'utf-8');

// The scenes must be in the HTML. Maybe we missed them? 
// The juan_dump.json has them! We didn't look at it fully. 
// Let's search inside juan_dump.json for "DevilKhloe" or some known RK model name, 
// wait, the URL was models=64432. What if I search for "64432" in juan_dump.json?

const juan = JSON.parse(fs.readFileSync('juan_dump.json', 'utf-8'));
let foundPaths = [];
function findId(obj: any, path: string = '') {
    if (typeof obj === 'object' && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
            if (String(value).includes('64432')) {
                foundPaths.push(path + '.' + key);
            }
            if (key === 'collections' || key === 'videos' || key === 'scenes' || key === 'list' || key === 'initialState') {
               // ...
            }
            findId(value, path + '.' + key);
        }
    }
}
findId(juan);
console.log('Paths with 64432:', foundPaths);

