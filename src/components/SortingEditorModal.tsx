import React, { useState, useMemo } from 'react';
import { 
  X, Layers, FolderPlus, Tag, Check, Search, Filter, MoveRight, 
  Sparkles, User, Database, ArrowUpDown, ChevronRight, Eye, 
  Download, Copy, CheckCircle2, RefreshCw, Grid, List, Folder
} from 'lucide-react';
import { Character, ArchiveItem } from '../types';
import { safeCopyToClipboard } from '../lib/utils';
import { playNotificationSound } from '../lib/audio';

interface SortingEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  characters: Character[];
  items?: ArchiveItem[];
  onUpdateCharacter?: (character: Character) => void;
  onSelectCharacter?: (character: Character) => void;
}

type GroupingMode = 'species' | 'project' | 'gender' | 'status' | 'world' | 'customGroup';

export function SortingEditorModal({
  isOpen,
  onClose,
  characters,
  items = [],
  onUpdateCharacter,
  onSelectCharacter,
}: SortingEditorModalProps) {
  const [groupingMode, setGroupingMode] = useState<GroupingMode>('species');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCharIds, setSelectedCharIds] = useState<Set<string>>(new Set());
  const [newGroupName, setNewGroupName] = useState('');
  const [customGroups, setCustomGroups] = useState<string[]>([
    'Core Protagonists',
    'Secondary Cast',
    'Villains & Antagonists',
    'Tech Support & AI Units',
    'Unassigned / Unclassified',
  ]);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    try { playNotificationSound(); } catch (e) {}
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Group characters according to the selected mode
  const groupedData = useMemo(() => {
    const groups: Record<string, Character[]> = {};

    characters.forEach((char) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = char.name.toLowerCase().includes(q);
        const matchesSpecies = (char.species || '').toLowerCase().includes(q);
        const matchesWorld = (char.worldName || '').toLowerCase().includes(q);
        const matchesDesc = (char.description || '').toLowerCase().includes(q);
        if (!matchesName && !matchesSpecies && !matchesWorld && !matchesDesc) {
          return;
        }
      }

      let key = 'Unassigned';

      if (groupingMode === 'species') {
        key = char.species?.trim() || 'Undefined Species';
      } else if (groupingMode === 'project') {
        if (char.projects && char.projects.length > 0) {
          key = char.projects[0].projectName || 'Primary Project';
        } else {
          key = 'No Project Assigned';
        }
      } else if (groupingMode === 'gender') {
        key = char.gender?.trim() || 'Undefined Gender';
      } else if (groupingMode === 'status') {
        key = char.status || 'Active';
      } else if (groupingMode === 'world') {
        key = char.worldName?.trim() || 'Unknown Realm / World';
      } else if (groupingMode === 'customGroup') {
        key = char.tags?.[0] || 'Unassigned / Unclassified';
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(char);
    });

    return groups;
  }, [characters, groupingMode, searchQuery]);

  if (!isOpen) return null;

  const toggleSelectChar = (id: string) => {
    const next = new Set(selectedCharIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedCharIds(next);
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    const name = newGroupName.trim();
    if (!customGroups.includes(name)) {
      setCustomGroups([...customGroups, name]);
      triggerToast(`Created group category: "${name}"`);
    }
    setNewGroupName('');
  };

  const handleAssignSelectedToGroup = (groupName: string) => {
    if (selectedCharIds.size === 0) {
      triggerToast('Please select one or more characters first.');
      return;
    }

    if (!onUpdateCharacter) {
      triggerToast('Character update handler not available.');
      return;
    }

    let updatedCount = 0;
    characters.forEach((char) => {
      if (selectedCharIds.has(char.id)) {
        let updatedChar = { ...char };
        if (groupingMode === 'species') {
          updatedChar.species = groupName;
        } else if (groupingMode === 'world') {
          updatedChar.worldName = groupName;
        } else if (groupingMode === 'status') {
          updatedChar.status = groupName as any;
        } else if (groupingMode === 'gender') {
          updatedChar.gender = groupName as any;
        } else {
          const currentTags = char.tags || [];
          updatedChar.tags = [groupName, ...currentTags.filter((t) => t !== groupName)];
        }
        onUpdateCharacter(updatedChar);
        updatedCount++;
      }
    });

    triggerToast(`Assigned ${updatedCount} character(s) to "${groupName}"`);
    setSelectedCharIds(new Set());
  };

  const handleExportGroupedReport = () => {
    const lines = [
      `=============================================================`,
      `CHARACTER SORTING & GROUPING MANIFEST`,
      `Grouping Mode: ${groupingMode.toUpperCase()}`,
      `Generated: ${new Date().toLocaleString()}`,
      `Total Characters: ${characters.length}`,
      `Total Groups: ${Object.keys(groupedData).length}`,
      `=============================================================\n`,
    ];

    Object.entries(groupedData).forEach(([group, list]) => {
      lines.push(`## [GROUP: ${group.toUpperCase()}] (${list.length} characters)`);
      list.forEach((c, idx) => {
        lines.push(`  ${idx + 1}. ${c.name} | Gender: ${c.gender || 'Undefined'} | Species: ${c.species || 'N/A'} | Status: ${c.status || 'Active'}`);
        if (c.projects && c.projects.length > 0) {
          lines.push(`     Projects: ${c.projects.map(p => p.projectName).join(', ')}`);
        }
      });
      lines.push('');
    });

    const content = lines.join('\n');
    safeCopyToClipboard(content);
    triggerToast('Copied full grouped manifest to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-60 bg-emerald-600 text-white font-medium px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 border border-emerald-400/40 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="bg-slate-950/90 border-b border-slate-800 px-5 py-4 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Character Sorting & Grouping Studio</h2>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  Unique Profile Registry
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Organize, categorize, and group characters by species, project franchise, gender, world, or custom tag rosters.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportGroupedReport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs"
              title="Copy grouped manifest"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Manifest</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700 cursor-pointer"
              title="Close Editor"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar & Filter Options */}
        <div className="bg-slate-900/90 border-b border-slate-800 px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          {/* Grouping Mode Selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">Group By:</span>
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
              {[
                { id: 'species', label: 'Species / Race' },
                { id: 'project', label: 'Project / Game' },
                { id: 'gender', label: 'Gender Type' },
                { id: 'world', label: 'World / Realm' },
                { id: 'status', label: 'Status' },
                { id: 'customGroup', label: 'Custom Tags' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setGroupingMode(m.id as GroupingMode)}
                  className={`px-2.5 py-1 rounded-lg font-medium text-xs transition-all cursor-pointer ${
                    groupingMode === m.id
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search characters or groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg cursor-pointer transition-all ${
                viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg cursor-pointer transition-all ${
                viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Batch Action Bar if characters selected */}
        {selectedCharIds.size > 0 && (
          <div className="bg-indigo-950/70 border-b border-indigo-500/30 px-5 py-2.5 flex items-center justify-between gap-4 text-xs animate-in slide-in-from-top-2 duration-150 shrink-0">
            <div className="flex items-center gap-2 text-indigo-200 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
              <span>{selectedCharIds.size} character(s) selected</span>
              <button
                onClick={() => setSelectedCharIds(new Set())}
                className="text-[11px] text-indigo-300 underline hover:text-white cursor-pointer ml-2"
              >
                Clear selection
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-300">Move selected to:</span>
              <select
                onChange={(e) => {
                  if (e.target.value) handleAssignSelectedToGroup(e.target.value);
                }}
                defaultValue=""
                className="bg-slate-900 border border-indigo-500/40 text-white rounded-lg px-2.5 py-1 text-xs focus:outline-hidden cursor-pointer"
              >
                <option value="" disabled>Choose target group...</option>
                {Object.keys(groupedData).map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
                {customGroups.map((cg) => (
                  <option key={cg} value={cg}>Custom: {cg}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Main Group Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {Object.keys(groupedData).length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Layers className="w-12 h-12 mx-auto mb-3 opacity-30 text-indigo-400" />
              <p className="text-sm font-medium">No characters match the filter criteria.</p>
            </div>
          ) : (
            Object.entries(groupedData).map(([groupName, charList]) => (
              <div key={groupName} className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4.5 space-y-3.5 shadow-sm">
                {/* Group Header */}
                <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <Folder className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-bold text-white tracking-tight">{groupName}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px] font-bold">
                      {charList.length} {charList.length === 1 ? 'Character' : 'Characters'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const next = new Set(selectedCharIds);
                        charList.forEach((c) => next.add(c.id));
                        setSelectedCharIds(next);
                      }}
                      className="text-[11px] text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer"
                    >
                      Select all in group
                    </button>
                  </div>
                </div>

                {/* Characters in Group */}
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {charList.map((char) => {
                      const isSelected = selectedCharIds.has(char.id);
                      const img = char.defaultThumbnailSrc || char.highlightedImageSrc || char.image || (char.subImages && char.subImages[0]?.src);
                      return (
                        <div
                          key={char.id}
                          onClick={() => toggleSelectChar(char.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex gap-3 relative group ${
                            isSelected
                              ? 'bg-indigo-950/60 border-indigo-500 shadow-md shadow-indigo-950/50'
                              : 'bg-slate-900 hover:bg-slate-850 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {/* Selection Checkbox */}
                          <div className="absolute top-2.5 right-2.5 z-10">
                            <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                              isSelected ? 'bg-indigo-600 border-indigo-400 text-white' : 'border-slate-700 bg-slate-950 group-hover:border-slate-500'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </div>

                          {/* Character Avatar */}
                          <div className="w-13 h-13 min-w-13 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center shadow-inner">
                            {img ? (
                              <img src={img} alt={char.name} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-6 h-6 text-slate-600" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0 pr-5">
                            <h4 className="text-xs font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
                              {char.name}
                            </h4>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5 truncate">
                              <span className={`font-semibold ${
                                char.gender?.toLowerCase() === 'male' ? 'text-blue-400' :
                                char.gender?.toLowerCase() === 'female' ? 'text-pink-400' :
                                char.gender?.toLowerCase() === 'others' ? 'text-amber-400' : 'text-slate-400'
                              }`}>
                                {char.gender || 'Undefined'}
                              </span>
                              <span>•</span>
                              <span className="truncate">{char.species || 'Spec N/A'}</span>
                            </div>

                            {/* Tags & Quick action */}
                            <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-800/60">
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                                {char.status || 'Active'}
                              </span>

                              {onSelectCharacter && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectCharacter(char);
                                    onClose();
                                  }}
                                  className="text-[10px] text-indigo-400 hover:text-indigo-200 font-semibold flex items-center gap-0.5 cursor-pointer"
                                >
                                  <span>Profile</span>
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                          <th className="py-2 px-3 w-8">#</th>
                          <th className="py-2 px-3">Character</th>
                          <th className="py-2 px-3">Gender</th>
                          <th className="py-2 px-3">Species</th>
                          <th className="py-2 px-3">World / Realm</th>
                          <th className="py-2 px-3">Status</th>
                          <th className="py-2 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {charList.map((char, cIdx) => {
                          const isSelected = selectedCharIds.has(char.id);
                          return (
                            <tr
                              key={char.id}
                              onClick={() => toggleSelectChar(char.id)}
                              className={`cursor-pointer transition-colors ${
                                isSelected ? 'bg-indigo-950/40 text-white' : 'hover:bg-slate-900/60 text-slate-300'
                              }`}
                            >
                              <td className="py-2 px-3">
                                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                                  isSelected ? 'bg-indigo-600 border-indigo-400 text-white' : 'border-slate-700 bg-slate-950'
                                }`}>
                                  {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </div>
                              </td>
                              <td className="py-2 px-3 font-semibold text-white flex items-center gap-2">
                                <span>{char.name}</span>
                              </td>
                              <td className="py-2 px-3">
                                <span className={`font-semibold ${
                                  char.gender?.toLowerCase() === 'male' ? 'text-blue-400' :
                                  char.gender?.toLowerCase() === 'female' ? 'text-pink-400' :
                                  char.gender?.toLowerCase() === 'others' ? 'text-amber-400' : 'text-slate-400'
                                }`}>
                                  {char.gender || 'Undefined'}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-slate-400">{char.species || 'N/A'}</td>
                              <td className="py-2 px-3 text-slate-400">{char.worldName || 'N/A'}</td>
                              <td className="py-2 px-3">
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                                  {char.status || 'Active'}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right">
                                {onSelectCharacter && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onSelectCharacter(char);
                                      onClose();
                                    }}
                                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                                  >
                                    Open Profile
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950/90 border-t border-slate-800 px-5 py-3 flex items-center justify-between gap-3 text-xs shrink-0">
          <div className="text-slate-400">
            Total Indexed Characters: <strong className="text-white">{characters.length}</strong> | Total Active Groups: <strong className="text-indigo-400">{Object.keys(groupedData).length}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-semibold transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
