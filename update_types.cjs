const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');

content = content.replace(/  characterBible\?\: string;\n  firstAppearanceType\?/g, "  characterBible?: string;\n  biblePages?: { id: string; title: string; content: string }[];\n  firstAppearanceType?");

fs.writeFileSync('src/types.ts', content);
console.log("types updated");
