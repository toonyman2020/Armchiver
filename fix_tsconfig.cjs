const fs = require('fs');
let content = fs.readFileSync('tsconfig.json', 'utf8');
const obj = JSON.parse(content);
if (!obj.exclude) {
    obj.exclude = ["dist", "node_modules"];
} else {
    if (!obj.exclude.includes("dist")) obj.exclude.push("dist");
    if (!obj.exclude.includes("node_modules")) obj.exclude.push("node_modules");
}
fs.writeFileSync('tsconfig.json', JSON.stringify(obj, null, 2));
console.log("tsconfig updated");
