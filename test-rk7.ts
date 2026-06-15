import fs from 'fs';

const initialState = JSON.parse(fs.readFileSync('juan_initialState.json', 'utf-8'));

function findScenes(obj: any, path: string = '') {
    if (typeof obj === 'object' && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
            if (key === 'collections' || key === 'videos' || key === 'scenes') {
                console.log(`Found ${key} at ${path}`);
            }
            if (key === 'items' && Array.isArray(value) && value.length > 0) {
                 console.log(`Found items at ${path} with length ${value.length}`);
                 if (value[0].title) console.log(`Sample item title: ${value[0].title}`);
            }
            findScenes(value, path + '.' + key);
        }
    }
}

findScenes(initialState);
