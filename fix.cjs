const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// Fix 1: removing duplicate bounding box from featuresOfInterest
content = content.replace(/"description": string,\n      "boundingBox": \[number, number, number, number\],\n          "boundingBox": \[number, number, number, number\]/g, '"description": string,\n          "boundingBox": [number, number, number, number]');

// Fix 2: remove bounding box from text characters schema
content = content.replace(/      "description": string,\n      "boundingBox": \[number, number, number, number\],\n      "completionRating": string,/g, '      "description": string,\n      "completionRating": string,');

fs.writeFileSync('server.ts', content);
