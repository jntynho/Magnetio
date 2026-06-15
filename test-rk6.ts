import fs from 'fs';

const dump = JSON.parse(fs.readFileSync('juan_dump.json', 'utf-8'));

console.log('rawInstance Keys:', Object.keys(dump.rawInstance || {}));
if (dump.rawInstance) {
    const widgets = dump.rawInstance.items || dump.rawInstance.widgets || [];
    console.log('rawInstance items/widgets:', widgets.length || dump.rawInstance.length);
    
    // Save rawInstance to see its structure
    fs.writeFileSync('juan_instance_dump.json', JSON.stringify(dump.rawInstance, null, 2));
}

console.log('initialState Keys:', Object.keys(dump.initialState || {}));
if (dump.initialState) {
    fs.writeFileSync('juan_initialState.json', JSON.stringify(dump.initialState, null, 2));
}

