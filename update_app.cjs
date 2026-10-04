const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `            newChars.push({
              id: uuidv4(),
              name: nameVal,`;

const replaceStr = `            let dateCreated = undefined;
            let dateCreatedSource = undefined;
            if (c.dateWrittenOnMedia) {
              dateCreated = c.dateWrittenOnMedia;
              dateCreatedSource = isImage ? 'From Image' : 'From Text';
            } else if (file.lastModified) {
              dateCreated = new Date(file.lastModified).toLocaleDateString();
              dateCreatedSource = 'From File Property';
            }

            newChars.push({
              id: uuidv4(),
              name: nameVal,
              dateCreated,
              dateCreatedSource,`;

content = content.replace(targetStr, replaceStr);

fs.writeFileSync('src/App.tsx', content);
console.log("App.tsx updated");
