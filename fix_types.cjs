const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');

if (!content.includes('highlightedImageSrc')) {
    content = content.replace(/  subImages\?: SubImage\[\];/g, '  highlightedImageSrc?: string;\n  subImages?: SubImage[];');
    fs.writeFileSync('src/types.ts', content);
    console.log("Fixed types.ts");
}
