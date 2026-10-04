const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Counting</span>
                <select
                  className="bg-secondary text-secondary-foreground text-sm rounded-md border-none p-1"
                  value={countingMode}
                  onChange={(e) => setCountingMode(e.target.value as any)}
                >
                  <option value="multiple">Multiple Objects</option>
                  <option value="single">Single Object</option>
                </select>
              </div>`;

const replaceStr = targetStr + `\n\n              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Image Extraction</span>
                <select
                  className="bg-secondary text-secondary-foreground text-sm rounded-md border-none p-1"
                  value={imageSplitMode}
                  onChange={(e) => setImageSplitMode(e.target.value as any)}
                >
                  <option value="highlight">Full Highlight (No Split)</option>
                  <option value="crop">Crop Parts (Split)</option>
                </select>
              </div>`;

content = content.replace(targetStr, replaceStr);

fs.writeFileSync('src/App.tsx', content);
