import fs from 'fs';

let scriptText = fs.readFileSync('rk_script_0.js', 'utf-8');

// The script looks like an IIFE. Let's execute it in a dummy context or parse it.

const code = `
    const window = {};
    ${scriptText}
    return window.__JUAN;
`;

try {
    const fn = new Function(code);
    const __JUAN = fn();
    // console.log(Object.keys(__JUAN));
    // Save the entire JUAN object to a file for easier inspection
    fs.writeFileSync('juan_dump.json', JSON.stringify(__JUAN, null, 2));
    console.log('Saved to juan_dump.json. Keys are:', Object.keys(__JUAN));
} catch(e) {
    console.error('Error executing script', e);
}
