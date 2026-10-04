const fs = require('fs');
let content = fs.readFileSync('src/components/MediaView.tsx', 'utf8');

// The line is: src={imageDisplayMode === 'crop' ? (sourceItem.thumbnailContent || sourceItem.content) : sourceItem.content}
content = content.replace(/<img \n                        src={imageDisplayMode === 'crop' \? \(sourceItem\.thumbnailContent \|\| sourceItem\.content\) : sourceItem\.content}/g, `<img \n                        src={char.highlightedImageSrc || (imageDisplayMode === 'crop' ? (sourceItem.thumbnailContent || sourceItem.content) : sourceItem.content)}`);

fs.writeFileSync('src/components/MediaView.tsx', content);
