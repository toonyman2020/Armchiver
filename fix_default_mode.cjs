const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/\(safeGetStorage\("scanMode"\) as "basic" \| "advanced"\) \|\| "advanced"/g, '(safeGetStorage("scanMode") as "basic" | "advanced") || "basic"');

fs.writeFileSync('src/App.tsx', content);
console.log("default scan mode updated");
