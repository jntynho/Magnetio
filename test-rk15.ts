import fs from 'fs';

const juan = JSON.parse(fs.readFileSync('juan_dump.json', 'utf-8'));
const titles = new Set();
function findTitles(obj: any) {
    if (typeof obj === 'object' && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
            if (key === 'title' && typeof value === 'string') {
                titles.add(value);
            }
            findTitles(value);
        }
    }
}
findTitles(juan);
console.log('Unique titles:', Array.from(titles).join(', '));
