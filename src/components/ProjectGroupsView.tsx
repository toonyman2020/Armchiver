import React, { useState, useMemo } from 'react';
import { ArchiveItem, Character, ProjectRelation } from '../types';
import { 
  FolderKanban, Users, ImageIcon, FileText, Download, Plus, 
  Search, Edit3, Trash2, ChevronRight, Layers, Tag, Check, 
  Sparkles, ExternalLink, ArrowLeft, Shield, Package, LayoutGrid, List
} from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { ItemProfile } from './ItemProfile';

interface ProjectGroupsViewProps {
  items: ArchiveItem[];
  characters: Character[];
  setItems: React.Dispatch<React.SetStateAction<ArchiveItem[]>>;
  setCharacters: React.Dispatch<React.SetStateAction<Character[]>>;
  onSelectCategory?: (category: string) => void;
  onProcessFiles?: (files: File[], isGroup: boolean, groupName: string) => void;
}

export interface GroupSummary {
  name: string;
  itemCount: number;
  characterCount: number;
  items: ArchiveItem[];
  characters: Character[];
  primaryCharacter?: Character;
  artStyles: string[];
  entityTypes: Record<string, number>;
  description: string;
  dateAdded?: number;
}

export function ProjectGroupsView({
  items,
  characters,
  setItems,
  setCharacters,
  onSelectCategory,
  onProcessFiles
}: ProjectGroupsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupName, setSelectedGroupName] = useState<string | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isEditingGroupName, setIsEditingGroupName] = useState<string | null>(null);
  const [newGroupNameInput, setNewGroupNameInput] = useState('');
  const [editingDescriptionGroup, setEditingDescriptionGroup] = useState<string | null>(null);
  const [groupDescriptionInput, setGroupDescriptionInput] = useState('');
  
  // Custom project group descriptions saved in local storage
  const [customDescriptions, setCustomDescriptions] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('project_group_descriptions');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Calculate project groups from items and characters
  const groupSummaries = useMemo<GroupSummary[]>(() => {
    const groupsMap = new Map<string, GroupSummary>();

    // Collect from items
    items.forEach(item => {
      if (item.isGroup && item.groupName) {
        const gName = item.groupName.trim();
        if (!groupsMap.has(gName)) {
          groupsMap.set(gName, {
            name: gName,
            itemCount: 0,
            characterCount: 0,
            items: [],
            characters: [],
            artStyles: [],
            entityTypes: {},
            description: customDescriptions[gName] || '',
            dateAdded: item.fileDate || item.createdAt
          });
        }
        const group = groupsMap.get(gName)!;
        group.items.push(item);
        group.itemCount++;
        if (item.artStyle && !group.artStyles.includes(item.artStyle)) {
          group.artStyles.push(item.artStyle);
        }
      }
    });

    // Also collect from characters
    characters.forEach(char => {
      // Find source item
      const sourceItem = items.find(i => i.id === char.sourceId);
      const possibleGroupNames = new Set<string>();

      if (sourceItem?.isGroup && sourceItem.groupName) {
        possibleGroupNames.add(sourceItem.groupName.trim());
      }
      
      if (char.categories && Array.isArray(char.categories)) {
        char.categories.forEach(cat => {
          if (cat && cat !== 'Male' && cat !== 'Female' && cat !== 'Others' && cat !== 'Objects' && cat !== 'Unsorted') {
            possibleGroupNames.add(cat.trim());
          }
        });
      }

      if (char.projects && Array.isArray(char.projects)) {
        char.projects.forEach(p => {
          if (p.projectName) possibleGroupNames.add(p.projectName.trim());
        });
      }

      possibleGroupNames.forEach(gName => {
        if (!groupsMap.has(gName)) {
          groupsMap.set(gName, {
            name: gName,
            itemCount: 0,
            characterCount: 0,
            items: [],
            characters: [],
            artStyles: [],
            entityTypes: {},
            description: customDescriptions[gName] || '',
            dateAdded: char.dateCreated ? new Date(char.dateCreated).getTime() : undefined
          });
        }
        const group = groupsMap.get(gName)!;
        if (!group.characters.some(c => c.id === char.id)) {
          group.characters.push(char);
          group.characterCount++;
          const eType = char.entityType || 'Character';
          group.entityTypes[eType] = (group.entityTypes[eType] || 0) + 1;
        }
      });
    });

    // Synthesize auto-descriptions for groups that don't have custom ones
    const result: GroupSummary[] = [];
    groupsMap.forEach(group => {
      if (!group.description) {
        const topChars = group.characters.slice(0, 3).map(c => c.name).join(', ');
        const entityBreakdown = Object.entries(group.entityTypes)
          .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`)
          .join(', ');

        group.description = `Project collection with ${group.itemCount} files and ${group.characterCount} entities${topChars ? ` (${topChars})` : ''}.${entityBreakdown ? ` Breakdown: ${entityBreakdown}.` : ''}`;
      }

      // Pick primary character
      if (group.characters.length > 0) {
        group.primaryCharacter = group.characters.find(c => c.entityType === 'Character') || group.characters[0];
      }

      result.push(group);
    });

    return result.sort((a, b) => b.characterCount + b.itemCount - (a.characterCount + a.itemCount));
  }, [items, characters, customDescriptions]);

  // Filter groups by search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groupSummaries;
    const q = searchQuery.toLowerCase();
    return groupSummaries.filter(g => 
      g.name.toLowerCase().includes(q) ||
      g.description.toLowerCase().includes(q) ||
      g.characters.some(c => c.name.toLowerCase().includes(q) || (c.species && c.species.toLowerCase().includes(q)))
    );
  }, [groupSummaries, searchQuery]);

  // Save custom description
  const handleSaveDescription = (gName: string, desc: string) => {
    const updated = { ...customDescriptions, [gName]: desc };
    setCustomDescriptions(updated);
    localStorage.setItem('project_group_descriptions', JSON.stringify(updated));
    setEditingDescriptionGroup(null);
  };

  // Rename a project group across all items and characters
  const handleRenameGroup = (oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName) {
      setIsEditingGroupName(null);
      return;
    }

    const trimmedNew = newName.trim();

    // Update items
    setItems(prev => prev.map(item => {
      if (item.groupName === oldName) {
        return { ...item, groupName: trimmedNew };
      }
      return item;
    }));

    // Update characters
    setCharacters(prev => prev.map(char => {
      let updatedCategories = char.categories;
      if (char.categories) {
        updatedCategories = char.categories.map(cat => cat === oldName ? trimmedNew : cat);
      }

      let updatedProjects = char.projects;
      if (char.projects) {
        updatedProjects = char.projects.map(p => p.projectName === oldName ? { ...p, projectName: trimmedNew } : p);
      }

      return {
        ...char,
        categories: updatedCategories,
        projects: updatedProjects
      };
    }));

    // Update custom descriptions
    if (customDescriptions[oldName]) {
      const updatedDesc = { ...customDescriptions, [trimmedNew]: customDescriptions[oldName] };
      delete updatedDesc[oldName];
      setCustomDescriptions(updatedDesc);
      localStorage.setItem('project_group_descriptions', JSON.stringify(updatedDesc));
    }

    setIsEditingGroupName(null);
    if (selectedGroupName === oldName) {
      setSelectedGroupName(trimmedNew);
    }
  };

  // Delete/dissolve a project group (removes group assignment, preserves files)
  const handleDeleteGroup = (gName: string) => {
    if (!confirm(`Are you sure you want to dissolve project group "${gName}"? (Files and characters will remain saved, but their group link will be removed).`)) {
      return;
    }

    // Update items
    setItems(prev => prev.map(item => {
      if (item.groupName === gName) {
        return { ...item, isGroup: false, groupName: undefined };
      }
      return item;
    }));

    // Update characters
    setCharacters(prev => prev.map(char => {
      const updatedCat = char.categories?.filter(c => c !== gName);
      const updatedProj = char.projects?.filter(p => p.projectName !== gName);
      return {
        ...char,
        categories: updatedCat?.length ? updatedCat : undefined,
        projects: updatedProj?.length ? updatedProj : undefined
      };
    }));

    if (selectedGroupName === gName) {
      setSelectedGroupName(null);
    }
  };

  // Export entire project group as a structured ZIP file
  const handleExportGroupZip = async (group: GroupSummary) => {
    try {
      const zip = new JSZip();
      const folder = zip.folder(group.name.replace(/[/\\?%*:|"<>]/g, '_')) || zip;

      // Add project metadata JSON
      const metadata = {
        projectName: group.name,
        description: group.description,
        totalItems: group.itemCount,
        totalCharacters: group.characterCount,
        exportedAt: new Date().toISOString(),
        characters: group.characters.map(c => ({
          name: c.name,
          gender: c.gender,
          species: c.species,
          entityType: c.entityType,
          description: c.description,
          role: c.projects?.find(p => p.projectName === group.name)?.roleOrRelation || 'Asset'
        }))
      };

      folder.file('project-manifest.json', JSON.stringify(metadata, null, 2));

      // Add items
      for (let i = 0; i < group.items.length; i++) {
        const item = group.items[i];
        if (item.type === 'text') {
          folder.file(`${i + 1}_${item.originalName}.txt`, item.content);
        } else if (item.type === 'image' && item.content.startsWith('data:image')) {
          const base64Data = item.content.split(',')[1];
          if (base64Data) {
            folder.file(`${i + 1}_${item.originalName}.png`, base64Data, { base64: true });
          }
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${group.name.replace(/[/\\?%*:|"<>]/g, '_')}_ProjectGroup.zip`);
    } catch (e) {
      console.error('Failed to export project ZIP:', e);
      alert('Failed to generate project ZIP export.');
    }
  };

  // Selected group object
  const activeGroup = useMemo(() => {
    if (!selectedGroupName) return null;
    return groupSummaries.find(g => g.name === selectedGroupName) || null;
  }, [groupSummaries, selectedGroupName]);

  if (selectedCharacter) {
    const parentItem = items.find(i => i.id === selectedCharacter.sourceId) || items[0];
    if (parentItem) {
      return (
        <ItemProfile
          item={parentItem}
          items={items}
          characters={characters}
          onBack={() => setSelectedCharacter(null)}
          setCharacters={setCharacters}
          setItems={setItems}
        />
      );
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card border rounded-2xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground tracking-tight">Project & Group Collections</h1>
              <p className="text-sm text-muted-foreground">
                Manage multi-file character packages, model sheet turnarounds, and unified project assets.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search project groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <button
            onClick={() => {
              const name = prompt('Enter a name for the new Project Group:');
              if (name && name.trim()) {
                setSelectedGroupName(name.trim());
              }
            }}
            className="px-3 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:bg-primary/90 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Group</span>
          </button>
        </div>
      </div>

      {/* Detail Modal/View for a Selected Group */}
      {activeGroup ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          <button
            onClick={() => setSelectedGroupName(null)}
            className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Project Groups</span>
          </button>

          {/* Group Detail Card Header */}
          <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                    Project Group
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">
                    {activeGroup.itemCount} files &bull; {activeGroup.characterCount} entities
                  </span>
                </div>

                {isEditingGroupName === activeGroup.name ? (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={newGroupNameInput}
                      onChange={(e) => setNewGroupNameInput(e.target.value)}
                      className="text-xl font-bold px-2 py-1 rounded border bg-background text-foreground"
                      autoFocus
                    />
                    <button
                      onClick={() => handleRenameGroup(activeGroup.name, newGroupNameInput)}
                      className="p-1.5 bg-primary text-primary-foreground rounded-lg"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-black text-foreground">{activeGroup.name}</h2>
                    <button
                      onClick={() => {
                        setIsEditingGroupName(activeGroup.name);
                        setNewGroupNameInput(activeGroup.name);
                      }}
                      className="p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors"
                      title="Rename Group"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportGroupZip(activeGroup)}
                  className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 text-primary" />
                  <span>Export ZIP</span>
                </button>

                <button
                  onClick={() => handleDeleteGroup(activeGroup.name)}
                  className="px-3 py-1.5 bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-bold rounded-xl border border-destructive/20 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Dissolve Group</span>
                </button>
              </div>
            </div>

            {/* Description & AI Summary */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Project Description & Overview
                </span>
                {editingDescriptionGroup !== activeGroup.name && (
                  <button
                    onClick={() => {
                      setEditingDescriptionGroup(activeGroup.name);
                      setGroupDescriptionInput(activeGroup.description);
                    }}
                    className="text-primary hover:underline text-[11px] normal-case"
                  >
                    Edit Description
                  </button>
                )}
              </div>

              {editingDescriptionGroup === activeGroup.name ? (
                <div className="space-y-2">
                  <textarea
                    value={groupDescriptionInput}
                    onChange={(e) => setGroupDescriptionInput(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border bg-background text-foreground h-24 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingDescriptionGroup(null)}
                      className="px-3 py-1 text-xs rounded-lg border bg-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveDescription(activeGroup.name, groupDescriptionInput)}
                      className="px-3 py-1 text-xs rounded-lg bg-primary text-primary-foreground font-bold"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-foreground/90 bg-secondary/30 p-3 rounded-xl border border-border/50 leading-relaxed">
                  {activeGroup.description}
                </p>
              )}
            </div>

            {/* Entity Types Breakdown */}
            {Object.keys(activeGroup.entityTypes).length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {Object.entries(activeGroup.entityTypes).map(([type, count]) => (
                  <span key={type} className="text-xs px-2.5 py-1 rounded-lg bg-secondary text-secondary-foreground font-semibold border border-border">
                    {type}: <span className="font-extrabold text-foreground">{count}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Group Characters & Entities Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span>Project Characters & Entities ({activeGroup.characters.length})</span>
              </h3>
            </div>

            {activeGroup.characters.length === 0 ? (
              <div className="bg-card border rounded-2xl p-8 text-center text-muted-foreground text-sm">
                No detected characters associated with this group yet.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {activeGroup.characters.map((char) => {
                  const sourceItem = items.find(i => i.id === char.sourceId);
                  const charRole = char.projects?.find(p => p.projectName === activeGroup.name)?.roleOrRelation || char.entityType || 'Asset';

                  return (
                    <div
                      key={char.id}
                      onClick={() => setSelectedCharacter(char)}
                      className="group bg-card border rounded-2xl p-3 hover:border-primary transition-all shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        {/* Role Badge */}
                        <div className="flex justify-between items-center gap-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/15 text-primary uppercase tracking-wider truncate max-w-[120px]">
                            {charRole}
                          </span>
                          <span className={`w-2 h-2 rounded-full shrink-0 ${char.gender === 'Male' ? 'bg-blue-500' : char.gender === 'Female' ? 'bg-pink-500' : char.gender === 'Objects' ? 'bg-amber-500' : 'bg-purple-500'}`} />
                        </div>

                        {/* Thumbnail */}
                        <div className="aspect-square rounded-xl bg-secondary/30 overflow-hidden relative border border-border/50">
                          {char.defaultThumbnailSrc || char.highlightedImageSrc || sourceItem?.thumbnailContent || (sourceItem?.type === 'image' ? sourceItem.content : null) ? (
                            <img
                              src={char.defaultThumbnailSrc || char.highlightedImageSrc || sourceItem?.thumbnailContent || sourceItem?.content}
                              alt={char.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <Users className="w-8 h-8 opacity-40" />
                            </div>
                          )}
                        </div>

                        <div>
                          <h4 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors" title={char.name}>
                            {char.name}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {char.species || 'Unknown Species'}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 mt-2 border-t flex justify-between items-center text-[11px] text-muted-foreground">
                        <span>{char.gender}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Group Files & Media Section */}
          <div className="space-y-3 pt-4">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" />
              <span>Project Media & Source Files ({activeGroup.items.length})</span>
            </h3>

            {activeGroup.items.length === 0 ? (
              <div className="bg-card border rounded-2xl p-8 text-center text-muted-foreground text-sm">
                No media files explicitly tagged under this group.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {activeGroup.items.map((item) => (
                  <div key={item.id} className="bg-card border rounded-2xl p-3 space-y-2 flex flex-col justify-between">
                    <div className="aspect-video bg-secondary/30 rounded-xl overflow-hidden relative border">
                      {item.type === 'image' ? (
                        <img src={item.thumbnailContent || item.content} alt={item.originalName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="w-8 h-8 text-muted-foreground opacity-50" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-foreground truncate" title={item.originalName}>
                        {item.originalName}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {item.type === 'image' ? 'Image Sheet' : 'Text Document'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Main Groups List View */
        <div className="space-y-4">
          {filteredGroups.length === 0 ? (
            <div className="bg-card border rounded-2xl p-12 text-center space-y-4 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <FolderKanban className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground">No Project Groups Found</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload multiple files using the "Group files" checkbox, or create a custom project group to organize your character assets.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredGroups.map((group) => {
                const primaryChar = group.primaryCharacter;
                const sourceItem = primaryChar ? items.find(i => i.id === primaryChar.sourceId) : group.items[0];

                return (
                  <div
                    key={group.name}
                    className="bg-card border rounded-2xl p-5 hover:border-primary/60 transition-all shadow-xs hover:shadow-md space-y-4 flex flex-col justify-between group cursor-pointer"
                    onClick={() => setSelectedGroupName(group.name)}
                  >
                    <div className="space-y-3">
                      {/* Header Badge */}
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-[11px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                          Project Group
                        </span>
                        <span className="text-xs text-muted-foreground font-semibold">
                          {group.characterCount} entities &bull; {group.itemCount} files
                        </span>
                      </div>

                      {/* Group Title & Description */}
                      <div>
                        <h3 className="text-lg font-black text-foreground group-hover:text-primary transition-colors truncate" title={group.name}>
                          {group.name}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                          {group.description}
                        </p>
                      </div>

                      {/* Thumbnail Strip */}
                      <div className="grid grid-cols-4 gap-1.5 pt-1">
                        {group.characters.slice(0, 4).map((c, idx) => {
                          const cItem = items.find(i => i.id === c.sourceId);
                          const imgSrc = c.defaultThumbnailSrc || c.highlightedImageSrc || cItem?.thumbnailContent || (cItem?.type === 'image' ? cItem.content : null);
                          return (
                            <div key={c.id || idx} className="aspect-square bg-secondary/40 rounded-lg overflow-hidden border border-border/50 relative">
                              {imgSrc ? (
                                <img src={imgSrc} alt={c.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground font-bold">
                                  {c.name.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {group.characters.length < 4 && group.items.slice(0, 4 - group.characters.length).map((it, idx) => (
                          <div key={it.id || idx} className="aspect-square bg-secondary/40 rounded-lg overflow-hidden border border-border/50 relative">
                            {it.type === 'image' ? (
                              <img src={it.thumbnailContent || it.content} alt={it.originalName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                <FileText className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-muted-foreground font-medium">
                        <Users className="w-3.5 h-3.5 text-primary" />
                        <span>{group.characters.slice(0, 2).map(c => c.name).join(', ') || 'No character tags'}</span>
                      </div>

                      <div className="flex items-center gap-1 font-bold text-primary group-hover:translate-x-0.5 transition-all">
                        <span>Inspect Group</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
