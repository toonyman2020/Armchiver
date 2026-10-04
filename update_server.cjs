const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// Add to schema instructions
content = content.replace(/   - "isUniqueName": boolean/g, '   - "dateWrittenOnMedia": string (If a specific creation date is visually written on the image or explicitly stated in the text, extract it here. e.g., "01/08/2026"). Leave empty if no date is found.\n   - "isUniqueName": boolean');

// Add to JSON output schema
content = content.replace(/      "colorPalette": \[string\],\n      "isUniqueName": boolean/g, '      "colorPalette": [string],\n      "dateWrittenOnMedia": string,\n      "isUniqueName": boolean');
content = content.replace(/      "colorPalette": \[string\],\n      "originalColorPalette": \[string\],\n      "isUniqueName": boolean/g, '      "colorPalette": [string],\n      "originalColorPalette": [string],\n      "dateWrittenOnMedia": string,\n      "isUniqueName": boolean');


fs.writeFileSync('server.ts', content);
console.log("server updated");
