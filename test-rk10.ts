import fs from 'fs';

let scriptText = fs.readFileSync('juan_dump.json', 'utf-8');
const dump = JSON.parse(scriptText);

console.log('rawInstance props:', Object.keys(dump.rawInstance || {}));
const instanceConfigs = dump.rawInstance?.instanceConfigs;
console.log('instanceConfigs:', instanceConfigs?.map(c => c.name));

console.log('initialState.client keys:', Object.keys(dump.initialState.client || {}));
