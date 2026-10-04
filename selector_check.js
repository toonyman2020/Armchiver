const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const html = fs.readFileSync('dist/index.html', 'utf8');
const dom = new JSDOM(html);
// We can't really query the React rendered DOM from index.html because it's empty
