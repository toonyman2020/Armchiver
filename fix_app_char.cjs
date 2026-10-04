const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `            const subImages: SubImage[] = [];
            if (isImage && c.featuresOfInterest && Array.isArray(c.featuresOfInterest)) {
              for (const feat of c.featuresOfInterest) {
                if (feat.boundingBox && feat.boundingBox.length === 4) {
                  try {
                    const croppedSrc = await generateFeatureCrop(file, feat.boundingBox);
                    subImages.push({`;

const replaceStr = `            let highlightedImageSrc: string | undefined = undefined;
            if (isImage && c.boundingBox && c.boundingBox.length === 4 && imageSplitMode === 'highlight') {
                try {
                    highlightedImageSrc = await generateHighlightedFeatureImage(file, c.boundingBox);
                } catch(e) { console.warn(e); }
            }

            const subImages: SubImage[] = [];
            if (isImage && c.featuresOfInterest && Array.isArray(c.featuresOfInterest)) {
              for (const feat of c.featuresOfInterest) {
                if (feat.boundingBox && feat.boundingBox.length === 4) {
                  try {
                    const croppedSrc = imageSplitMode === 'crop' 
                        ? await generateFeatureCrop(file, feat.boundingBox)
                        : await generateHighlightedFeatureImage(file, feat.boundingBox);
                    subImages.push({`;

content = content.replace(targetStr, replaceStr);

content = content.replace(/              isUniqueName: suggestedIsUnique && !isNameGeneric\(nameVal\),/, `              isUniqueName: suggestedIsUnique && !isNameGeneric(nameVal),\n              highlightedImageSrc: highlightedImageSrc,`);

fs.writeFileSync('src/App.tsx', content);
