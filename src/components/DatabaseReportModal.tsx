import React, { useState } from 'react';
import { 
  X, Printer, Download, Copy, FileText, CheckCircle2, 
  Layers, User, Image as ImageIcon, Volume2, Video, BookOpen, 
  Palette, Database, Check, Award
} from 'lucide-react';
import { Character, ArchiveItem } from '../types';
import { safeCopyToClipboard } from '../lib/utils';
import { playNotificationSound } from '../lib/audio';

interface DatabaseReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  characters: Character[];
  items?: ArchiveItem[];
  creatorProfileName?: string;
}

export function DatabaseReportModal({
  isOpen,
  onClose,
  characters,
  items = [],
  creatorProfileName = 'Alberto Armentero',
}: DatabaseReportModalProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    try { playNotificationSound(); } catch (e) {}
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (!isOpen) return null;

  // Calculate deep multi-metric "Statue" counters across the entire archive
  let totalCharacters = characters.length;
  let maleCount = 0;
  let femaleCount = 0;
  let othersCount = 0;
  let undefinedCount = 0;
  const speciesSet = new Set<string>();
  const worldSet = new Set<string>();
  let totalSubImages = 0;
  let totalAudios = 0;
  let totalVideos = 0;
  let totalBiblePages = 0;
  let totalProjects = 0;
  let totalCodeFiles = 0;
  let totalGenericFiles = 0;
  const allColorSwatches = new Set<string>();
  let totalDevHours = 0;

  characters.forEach((c) => {
    const g = (c.gender || '').toLowerCase();
    if (g === 'male' || g === 'm' || g === 'man') maleCount++;
    else if (g === 'female' || g === 'f' || g === 'woman') femaleCount++;
    else if (g === 'others' || g === 'other' || g === 'non-binary' || g === 'nb') othersCount++;
    else undefinedCount++;

    if (c.species) speciesSet.add(c.species.trim());
    if (c.worldName) worldSet.add(c.worldName.trim());

    totalSubImages += (c.subImages?.length || 0) + (c.image || c.defaultThumbnailSrc ? 1 : 0);
    totalAudios += c.audios?.length || 0;
    totalVideos += c.videos?.length || 0;
    totalBiblePages += c.biblePages?.length || 0;
    totalProjects += c.projects?.length || 0;
    totalCodeFiles += c.codeFiles?.length || 0;
    totalGenericFiles += c.genericFiles?.length || 0;

    (c.colorPalette || []).forEach((hex) => allColorSwatches.add(hex.toUpperCase()));
    (c.devTracker?.logs || []).forEach((l) => totalDevHours += (l.hoursSpent || 0));
  });

  // Include standalone items if any
  items.forEach((itm) => {
    if (itm.type === 'image') totalSubImages++;
    else if (itm.type === 'audio') totalAudios++;
    else if (itm.type === 'video') totalVideos++;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleCopyReport = () => {
    const reportText = `
=============================================================
ARMSTECH MASTER DATABASE & STATUE INVENTORY REPORT
Creator / Principal: ${creatorProfileName}
Generated: ${new Date().toLocaleString()}
=============================================================

1. STATUE & CHARACTER CENSUS:
-------------------------------------------------------------
- Total Registered Character Models / Statues: ${totalCharacters}
  • ♂ Male Entities: ${maleCount} (${totalCharacters ? Math.round((maleCount / totalCharacters) * 100) : 0}%)
  • ♀ Female Entities: ${femaleCount} (${totalCharacters ? Math.round((femaleCount / totalCharacters) * 100) : 0}%)
  • ⚥ Others / Non-Binary / Object Entities: ${othersCount} (${totalCharacters ? Math.round((othersCount / totalCharacters) * 100) : 0}%)
  • ❓ Undefined / Unclassified: ${undefinedCount} (${totalCharacters ? Math.round((undefinedCount / totalCharacters) * 100) : 0}%)

- Distinct Species & Archetypes (${speciesSet.size}):
  ${Array.from(speciesSet).join(', ') || 'None specified'}

- Connected Worlds & Realms (${worldSet.size}):
  ${Array.from(worldSet).join(', ') || 'None specified'}

2. MULTI-MEDIA ASSET REPOSITORY:
-------------------------------------------------------------
- Total Visual Images & Renders: ${totalSubImages}
- Total Audio Tracks, Themes & Voice Lines: ${totalAudios}
- Total Video Production Clips & Pilots: ${totalVideos}
- Total Lore / Bible Document Chapters: ${totalBiblePages}
- Total Active Projects & Games: ${totalProjects}
- Total Source Code Modules & Scripts: ${totalCodeFiles}
- Total Generic File Attachments: ${totalGenericFiles}
- Extracted Color Palette Swatches: ${allColorSwatches.size}
- Total Logged Development Time: ${totalDevHours} Hours

3. COMPLETE CHARACTER ROSTER LEDGER:
-------------------------------------------------------------
${characters.map((c, i) => `[#${i + 1}] ${c.name}
  Gender: ${c.gender || 'Undefined'} | Species: ${c.species || 'N/A'} | Status: ${c.status || 'Active'}
  Rating: ${c.completionRating || 'Not Rated'} | Creator: ${c.creator || creatorProfileName}
  Assets: ${c.subImages?.length || 0} Images, ${c.audios?.length || 0} Audios, ${c.videos?.length || 0} Videos, ${c.projects?.length || 0} Projects
  Palette: ${(c.colorPalette || []).join(', ') || 'None'}
  Description: ${c.description || 'No description recorded.'}
`).join('\n')}

=============================================================
END OF ARMSTECH STATUE & CHARACTER AUDIT REPORT
    `.trim();

    safeCopyToClipboard(reportText);
    triggerToast('Copied full summary report to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200 print:p-0 print:bg-white print:static">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-60 bg-emerald-600 text-white font-medium px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 border border-emerald-400/40 animate-in fade-in slide-in-from-bottom-3 duration-200 print:hidden">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden print:border-none print:shadow-none print:max-h-none print:bg-white print:text-black">
        {/* Header */}
        <div className="bg-slate-950/90 border-b border-slate-800 px-6 py-4 flex items-center justify-between gap-4 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Database & Statue Counter Audit Report</h2>
              <p className="text-xs text-slate-400">
                Official executive summary tallying all characters, gender breakdowns, media items, projects, and color swatches.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyReport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Text</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-emerald-950"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 print:p-8 print:text-black">
          {/* Executive Title Block */}
          <div className="border-b border-slate-800 pb-6 print:border-black">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-bold print:text-emerald-700">
                  ARMSTECH CHARACTER CORP • AUDIT & STATUE METRICS
                </span>
                <h1 className="text-2xl font-black text-white tracking-tight mt-1 print:text-black">
                  Master Archive Statue & Inventory Report
                </h1>
                <p className="text-xs text-slate-400 mt-1 print:text-slate-600">
                  Primary Creator: <strong className="text-slate-200 print:text-black">{creatorProfileName}</strong> • Date Generated: {new Date().toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold px-3 py-1 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 rounded-full print:border-black print:text-black">
                  100% Verified Canon
                </span>
              </div>
            </div>
          </div>

          {/* Section 1: Statue Multi-Metric Counters */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3 print:text-black flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>1. Character & Model Statue Census ({totalCharacters} Unique Profiles)</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 print:border-gray-300 print:bg-gray-50">
                <span className="text-xs text-slate-400">Total Unique Characters</span>
                <div className="text-2xl font-black text-white mt-1 print:text-black">{totalCharacters}</div>
                <span className="text-[10px] text-emerald-400 font-semibold">1 Per Profile Spec</span>
              </div>

              <div className="bg-blue-950/40 p-4 rounded-xl border border-blue-800/50 print:border-blue-300 print:bg-blue-50">
                <span className="text-xs text-blue-300">♂ Male Statues</span>
                <div className="text-2xl font-black text-blue-200 mt-1 print:text-blue-900">{maleCount}</div>
                <span className="text-[10px] text-blue-400 font-semibold">
                  {totalCharacters ? Math.round((maleCount / totalCharacters) * 100) : 0}% of Roster
                </span>
              </div>

              <div className="bg-pink-950/40 p-4 rounded-xl border border-pink-800/50 print:border-pink-300 print:bg-pink-50">
                <span className="text-xs text-pink-300">♀ Female Statues</span>
                <div className="text-2xl font-black text-pink-200 mt-1 print:text-pink-900">{femaleCount}</div>
                <span className="text-[10px] text-pink-400 font-semibold">
                  {totalCharacters ? Math.round((femaleCount / totalCharacters) * 100) : 0}% of Roster
                </span>
              </div>

              <div className="bg-amber-950/40 p-4 rounded-xl border border-amber-800/50 print:border-amber-300 print:bg-amber-50">
                <span className="text-xs text-amber-300">⚥ Others / Undefined</span>
                <div className="text-2xl font-black text-amber-200 mt-1 print:text-amber-900">{othersCount + undefinedCount}</div>
                <span className="text-[10px] text-amber-400 font-semibold">
                  {othersCount} Others • {undefinedCount} Undefined
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Complete Media & Asset Ledger */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3 print:text-black flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>2. Multi-Media & Artifact Inventory Counts</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 print:border-gray-300 print:bg-gray-50">
                <ImageIcon className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
                <div className="text-xl font-bold text-white print:text-black">{totalSubImages}</div>
                <span className="text-[11px] text-slate-400">Images / Renders</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 print:border-gray-300 print:bg-gray-50">
                <Volume2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <div className="text-xl font-bold text-white print:text-black">{totalAudios}</div>
                <span className="text-[11px] text-slate-400">Audio Tracks</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 print:border-gray-300 print:bg-gray-50">
                <Video className="w-5 h-5 text-rose-400 mx-auto mb-1" />
                <div className="text-xl font-bold text-white print:text-black">{totalVideos}</div>
                <span className="text-[11px] text-slate-400">Video Clips & Pilots</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 print:border-gray-300 print:bg-gray-50">
                <BookOpen className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                <div className="text-xl font-bold text-white print:text-black">{totalBiblePages}</div>
                <span className="text-[11px] text-slate-400">Lore / Bible Docs</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 print:border-gray-300 print:bg-gray-50">
                <Layers className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                <div className="text-xl font-bold text-white print:text-black">{totalProjects}</div>
                <span className="text-[11px] text-slate-400">Projects & Games</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 print:border-gray-300 print:bg-gray-50">
                <Palette className="w-5 h-5 text-fuchsia-400 mx-auto mb-1" />
                <div className="text-xl font-bold text-white print:text-black">{allColorSwatches.size}</div>
                <span className="text-[11px] text-slate-400">Color Swatches</span>
              </div>
            </div>
          </div>

          {/* Section 3: Color Palette Breakdown */}
          {allColorSwatches.size > 0 && (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3 print:text-black flex items-center gap-2">
                <Palette className="w-4 h-4 text-emerald-400" />
                <span>3. Global Color Palette Catalog ({allColorSwatches.size} Swatches)</span>
              </h3>

              <div className="flex flex-wrap gap-2">
                {Array.from(allColorSwatches).map((hex) => (
                  <div
                    key={hex}
                    className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono print:border-gray-300 print:bg-white"
                  >
                    <div
                      className="w-4 h-4 rounded-md border border-white/20 shadow-xs"
                      style={{ backgroundColor: hex }}
                    />
                    <span className="text-slate-300 print:text-black">{hex}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Detailed Character Roster */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3 print:text-black flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-400" />
              <span>4. Unique Character Specification Sheets</span>
            </h3>

            <div className="space-y-3">
              {characters.map((char, idx) => {
                const img = char.defaultThumbnailSrc || char.highlightedImageSrc || char.image || (char.subImages && char.subImages[0]?.src);
                return (
                  <div
                    key={char.id}
                    className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col sm:flex-row gap-4 items-start print:border-gray-300 print:bg-white"
                  >
                    <div className="w-16 h-16 min-w-16 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center print:border-gray-300">
                      {img ? (
                        <img src={img} alt={char.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-slate-600" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-500">#{idx + 1}</span>
                          <h4 className="text-base font-bold text-white print:text-black">{char.name}</h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 print:bg-gray-200 print:text-black">
                            {char.gender || 'Undefined'}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-emerald-400 print:text-emerald-700">
                          {char.completionRating || '100% Ready'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-400 mt-2 print:text-slate-700">
                        <div>Species: <strong className="text-slate-200 print:text-black">{char.species || 'N/A'}</strong></div>
                        <div>World: <strong className="text-slate-200 print:text-black">{char.worldName || 'N/A'}</strong></div>
                        <div>Creator: <strong className="text-slate-200 print:text-black">{char.creator || creatorProfileName}</strong></div>
                        <div>Status: <strong className="text-slate-200 print:text-black">{char.status || 'Active'}</strong></div>
                      </div>

                      <p className="text-xs text-slate-300 mt-2 line-clamp-2 print:text-black">
                        {char.description || 'No description entered.'}
                      </p>

                      {char.colorPalette && char.colorPalette.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="text-[10px] text-slate-500 uppercase font-semibold">Palette:</span>
                          {char.colorPalette.map((hex, hIdx) => (
                            <span
                              key={hIdx}
                              className="w-3.5 h-3.5 rounded-full border border-white/20"
                              style={{ backgroundColor: hex }}
                              title={hex}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950/90 border-t border-slate-800 px-6 py-3.5 flex items-center justify-between gap-4 text-xs shrink-0 print:hidden">
          <span className="text-slate-400">
            Armstech Executive Audit Ledger • {characters.length} Statues Listed
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-semibold cursor-pointer"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}
