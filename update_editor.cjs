const fs = require('fs');
let content = fs.readFileSync('src/components/CharacterEditor.tsx', 'utf8');

// Update activeTab type
content = content.replace(/useState<'images' \| 'details' \| 'technical'>\('images'\);/g, "useState<'images' | 'details' | 'technical' | 'bible'>('images');");

// Add Bible tab button
const tabButtons = `<button 
              className={\`px-4 py-2 text-sm font-bold border-b-2 \${activeTab === 'bible' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}\`}
              onClick={() => setActiveTab('bible')}
            >
              Bible
            </button>`;
content = content.replace(/            <button \n              className={`px-4 py-2 text-sm font-bold border-b-2 \${activeTab === 'technical' \? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}\n              onClick={\(\) => setActiveTab\('technical'\)}\n            >\n              Technical\n            <\/button>/g, `            <button \n              className={\`px-4 py-2 text-sm font-bold border-b-2 \${activeTab === 'technical' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}\`}\n              onClick={() => setActiveTab('technical')}\n            >\n              Technical\n            </button>\n${tabButtons}`);

// Add Creation Date to Technical tab
const dateCreatedFields = `<div className="space-y-4 p-4 bg-card border rounded-xl shadow-sm mt-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1">Creation Info</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-bold">Date Created</label>
                      <input type="text" value={formData.dateCreated || ''} onChange={e => setFormData({...formData, dateCreated: e.target.value})} className="w-full bg-background border rounded-md px-3 py-2 text-sm" placeholder="e.g. 01/08/2026" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-bold">Source</label>
                      <select value={formData.dateCreatedSource || 'Unknown'} onChange={e => setFormData({...formData, dateCreatedSource: e.target.value as any})} className="w-full bg-background border rounded-md px-3 py-2 text-sm">
                        <option value="From Image">From Image</option>
                        <option value="From Text">From Text</option>
                        <option value="From File Property">From File Property</option>
                        <option value="Added Manually">Added Manually</option>
                        <option value="Unknown">Unknown</option>
                      </select>
                    </div>
                  </div>
                </div>`;

content = content.replace(/<\/div>\n            \)}/g, `</div>\n                ${dateCreatedFields}\n              </div>\n            )}`);
// Fix that replace regex to target only the end of the technical tab
