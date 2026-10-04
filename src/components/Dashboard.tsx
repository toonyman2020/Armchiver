import React, { useState } from 'react';
import { ArchiveItem, Character } from '../types';
import { UploadCloud, PieChart } from 'lucide-react';
import { MediaView } from './MediaView';
import { safeCopyToClipboard } from '../lib/utils';

const safeGetStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
};

const safeSetStorage = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    // Ignore storage errors in restricted iframe contexts
  }
};

export function getCharacterCategory(c: Character): 'Male' | 'Female' | 'Objects' | 'Others' {
  const genderLower = (c.gender || '').toLowerCase();
  const entityTypeLower = (c.entityType || '').toLowerCase();
  const nameLower = (c.name || '').toLowerCase();
  const speciesLower = (c.species || '').toLowerCase();
  const descLower = (c.description || '').toLowerCase();

  const isRobot = nameLower.includes('robot') || speciesLower.includes('robot') || descLower.includes('robot') ||
                   nameLower.includes('droid') || speciesLower.includes('droid') || descLower.includes('droid') ||
                   nameLower.includes('mecha') || speciesLower.includes('mecha');

  const isTreeOrNonChar = nameLower.includes('tree') || speciesLower.includes('tree') || descLower.includes('tree') ||
                          nameLower.includes('plant') || speciesLower.includes('plant') || descLower.includes('plant') ||
                          nameLower.includes('flower') || speciesLower.includes('flower') ||
                          nameLower.includes('prop') || speciesLower.includes('prop') ||
                          nameLower.includes('furniture') || speciesLower.includes('furniture') ||
                          nameLower.includes('weapon') || speciesLower.includes('weapon') ||
                          nameLower.includes('sword') || speciesLower.includes('sword') ||
                          nameLower.includes('shield') || speciesLower.includes('shield') ||
                          entityTypeLower === 'object' || entityTypeLower === 'material';

  // - "Robots or things that do not have a gender should go in 'others.'"
  const hasNoGender = !genderLower || genderLower === 'none' || genderLower === 'unspecified' || genderLower === 'unknown' || genderLower === 'others' || genderLower === 'mixed';
  if ((isRobot || isTreeOrNonChar) && hasNoGender) {
    return 'Others';
  }

  // - "Images of robots are classified as objects."
  if (isRobot) {
    return 'Objects';
  }

  // - "Trees or other non-character-based items can be classified as objects."
  if (isTreeOrNonChar) {
    return 'Objects';
  }

  // - "Humans or items that are not characters with a gender should go in 'others.'"
  const isNotCharacter = entityTypeLower !== 'character';
  const hasGender = genderLower.includes('male') || genderLower.includes('female');
  if (isNotCharacter && hasGender) {
    return 'Others';
  }

  // If gender is other/mixed/none/unknown
  if (hasNoGender) {
    return 'Others';
  }

  // Male/Female
  if (genderLower.split(/[\/\s,&]+/).includes('male')) {
    return 'Male';
  }
  if (genderLower.split(/[\/\s,&]+/).includes('female')) {
    return 'Female';
  }

  return 'Others';
}

export function Dashboard({ 
  items, 
  characters, 
  onProcessFiles, 
  onSelectCategory, 
  isGroup, 
  groupName, 
  setIsGroup, 
  setGroupName, 
  setCharacters, 
  setItems, 
  onUpload,
  isOverviewSectionHidden = true,
  setIsOverviewSectionHidden
}: { 
  items: ArchiveItem[], 
  characters: Character[], 
  onProcessFiles: (files: File[], isGroup: boolean, groupName: string) => void, 
  onSelectCategory?: (category: string) => void, 
  isGroup: boolean, 
  groupName: string,
  setIsGroup?: React.Dispatch<React.SetStateAction<boolean>>,
  setGroupName?: React.Dispatch<React.SetStateAction<string>>,
  setCharacters: React.Dispatch<React.SetStateAction<Character[]>>,
  setItems: React.Dispatch<React.SetStateAction<ArchiveItem[]>>,
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void,
  isOverviewSectionHidden?: boolean,
  setIsOverviewSectionHidden?: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [filter, setFilter] = useState('All');
  const [gridSize, setGridSize] = useState<'small' | 'medium' | 'large' | 'two'>(() => {
    const saved = safeGetStorage("overview_grid_size");
    return (saved as 'small' | 'medium' | 'large' | 'two') || 'two';
  });

  const [hiddenCategories, setHiddenCategories] = useState<string[]>(() => {
    const saved = safeGetStorage("hidden_overview_categories");
    return saved ? JSON.parse(saved) : [];
  });

  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    const saved = safeGetStorage("app_custom_categories");
    return saved ? JSON.parse(saved) : ["Main Cast", "Villains", "Side Characters"];
  });

  const [newCatInput, setNewCatInput] = useState("");
  const [selectedLetter, setSelectedLetter] = useState<string>("All");
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<string>("All");

  const handleAddCustomCategory = (categoryName?: string) => {
    const targetName = (categoryName || newCatInput).trim();
    if (!targetName) return;
    if (!customCategories.includes(targetName)) {
      const updated = [...customCategories, targetName];
      setCustomCategories(updated);
      safeSetStorage("app_custom_categories", JSON.stringify(updated));
    }
    setNewCatInput("");
  };

  const handleRemoveCustomCategory = (catToRemove: string) => {
    const updated = customCategories.filter(c => c !== catToRemove);
    setCustomCategories(updated);
    safeSetStorage("app_custom_categories", JSON.stringify(updated));
  };

  const getCategoryCharacterCount = (catName: string) => {
    const catLower = catName.toLowerCase().trim();
    return characters.filter(c => {
      if (c.categories && c.categories.some(tag => tag.toLowerCase().trim() === catLower)) {
        return true;
      }
      if (catLower.startsWith("letter ")) {
        const letter = catName.charAt(7).toUpperCase();
        const matchesLetter = c.name.trim().toUpperCase().startsWith(letter);
        if (!matchesLetter) return false;
        if (catLower.includes("female")) return c.gender === "Female";
        if (catLower.includes("male") && !catLower.includes("female")) return c.gender === "Male";
        if (catLower.includes("others")) return c.gender === "Others";
        return true;
      }
      return false;
    }).length;
  };

  const inspectedCharacters = characters.filter(c => {
    const matchesLetter = selectedLetter === "All" || c.name.trim().toUpperCase().startsWith(selectedLetter);
    const matchesGender = selectedGenderFilter === "All" || c.gender === selectedGenderFilter;
    return matchesLetter && matchesGender;
  });

  const toggleCategoryVisibility = (category: string) => {
    setHiddenCategories(prev => {
      const next = prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category];
      safeSetStorage("hidden_overview_categories", JSON.stringify(next));
      return next;
    });
  };

  const images = items.filter(i => i.type === 'image');
  const texts = items.filter(i => i.type === 'text');

  const totalChars = items.reduce((sum, item) => sum + item.charactersCount, 0);
  const totalSizeBytes = items.reduce((sum, item) => sum + (item.fileSize || 0), 0);
  const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(2);

  const getCountByCondition = (condition: (c: Character) => boolean) => {
    return items.reduce((sum, item) => {
      const itemChars = characters.filter(c => c.sourceId === item.id);
      const match = itemChars.some(condition);
      return match ? sum + item.charactersCount : sum;
    }, 0);
  };

  const males = getCountByCondition(c => getCharacterCategory(c) === 'Male');
  const females = getCountByCondition(c => getCharacterCategory(c) === 'Female');
  const objects = getCountByCondition(c => getCharacterCategory(c) === 'Objects');
  const others = getCountByCondition(c => getCharacterCategory(c) === 'Others');

  const duplicates = characters.filter(c => c.status === 'Duplicate').length;
  const unsorted = characters.filter(c => c.status === 'Unsorted').length;
  const sketches = characters.filter(c => c.isSketch).length;
  const noCharImages = images.filter(i => i.charactersCount === 0).length;
  
  // No characters, No categories, No sketches, Unsorted -> Unknown
  const unknownItems = items.filter(i => {
    const itemChars = characters.filter(c => c.sourceId === i.id);
    const hasNoCharacters = i.charactersCount === 0 || itemChars.length === 0;
    const isUnsorted = itemChars.some(c => c.status === 'Unsorted');
    const isUnknown = itemChars.some(c => c.entityType === 'Unknown');
    const hasNoSketches = !i.isSketch && itemChars.every(c => !c.isSketch);
    const hasNoCategories = itemChars.every(c => !c.species || c.species === 'Unknown');
    
    return hasNoCharacters || isUnsorted || isUnknown || hasNoSketches || hasNoCategories;
  }).length;
  
  const groups = items.filter(i => i.isGroup).length;

  const speciesMap = characters.reduce((acc, char) => {
    const parts = char.species.split(/[\/\s,&]+/);
    parts.forEach(p => {
      if (p) {
        acc[p] = (acc[p] || 0) + 1; // Or + item.charactersCount? Let's just use + 1 for simplicity of grouped tags
      }
    });
    return acc;
  }, {} as Record<string, number>);

  const speciesEntries = Object.entries(speciesMap).sort((a, b) => b[1] - a[1]);

  const getCategoryImages = (categoryKey: string): string[] => {
    const keyLower = categoryKey.toLowerCase();
    const imageItems = items.filter(i => i.type === 'image');
    let matchedItems: ArchiveItem[] = [];
    
    if (keyLower === 'total characters' || keyLower === 'total chars' || keyLower === 'all files' || keyLower === 'total files') {
      matchedItems = imageItems;
    } else if (keyLower === 'groups') {
      matchedItems = imageItems.filter(i => i.isGroup);
    } else if (keyLower === 'unknown') {
      matchedItems = imageItems.filter(i => {
        const itemChars = characters.filter(c => c.sourceId === i.id);
        const hasNoCharacters = i.charactersCount === 0 || itemChars.length === 0;
        const isUnsorted = itemChars.some(c => c.status === 'Unsorted');
        const isUnknown = itemChars.some(c => c.entityType === 'Unknown');
        const hasNoSketches = !i.isSketch && itemChars.every(c => !c.isSketch);
        const hasNoCategories = itemChars.every(c => !c.species || c.species === 'Unknown');
        return hasNoCharacters || isUnsorted || isUnknown || hasNoSketches || hasNoCategories;
      });
    } else if (keyLower === 'unsorted') {
      matchedItems = imageItems.filter(i => {
        const itemChars = characters.filter(c => c.sourceId === i.id);
        return itemChars.some(c => c.status === 'Unsorted');
      });
    } else if (keyLower === 'duplicates') {
      matchedItems = imageItems.filter(i => {
        const itemChars = characters.filter(c => c.sourceId === i.id);
        return itemChars.some(c => c.status === 'Duplicate');
      });
    } else if (keyLower === 'no characters' || keyLower === 'no chars') {
      matchedItems = imageItems.filter(i => i.charactersCount === 0);
    } else if (keyLower === 'sketches') {
      matchedItems = imageItems.filter(i => {
        const itemChars = characters.filter(c => c.sourceId === i.id);
        return itemChars.some(c => c.isSketch);
      });
    } else {
      matchedItems = imageItems.filter(i => {
        const itemChars = characters.filter(c => c.sourceId === i.id);
        return itemChars.some(c => {
          if (keyLower === 'male') {
            return getCharacterCategory(c) === 'Male';
          }
          if (keyLower === 'female') {
            return getCharacterCategory(c) === 'Female';
          }
          if (keyLower === 'objects') {
            return getCharacterCategory(c) === 'Objects';
          }
          if (keyLower === 'others') {
            return getCharacterCategory(c) === 'Others';
          }
          return false;
        });
      });
    }
    
    return matchedItems
      .slice(0, 3)
      .map(i => i.thumbnailContent || i.content);
  };

  const [dragItemCount, setDragItemCount] = useState(0);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    if (e.dataTransfer.items) {
      setDragItemCount(e.dataTransfer.items.length);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragItemCount(0);
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragItemCount(0);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      let files: File[] = Array.from(e.dataTransfer.files) as File[];
      if (files.length > 200) {
        alert('You can only upload a maximum of 200 files at once.');
        files = files.slice(0, 200);
      }
      onProcessFiles(files, isGroup, groupName);
    }
  };

  const handleCopyReport = () => {
    let report = "--- Character Archive Status ---\n\n";
    report += `Total Items: ${items.length}\n`;
    report += `Total Characters/Entities: ${totalChars}\n`;
    report += `Males: ${males}, Females: ${females}, Others: ${others}, Objects: ${objects}\n`;
    report += `\n- Categories/Filters:\n`;
    speciesEntries.forEach(([sp, count]) => {
      report += `  ${sp}: ${count}\n`;
    });
    report += `\n- Detailed Items:\n`;
    items.forEach(item => {
      report += `\nFile: ${item.originalName}\n`;
      const itemChars = characters.filter(c => c.sourceId === item.id);
      itemChars.forEach(c => {
        report += `  -> Name: ${c.name}\n`;
        report += `     Gender: ${c.gender}\n`;
        report += `     Species/Material: ${c.species}\n`;
        report += `     Entity Type: ${c.entityType || 'Character'}\n`;
        if (c.completionRating) report += `     Completion: ${c.completionRating}\n`;
        if (c.colorPalette?.length) report += `     Colors: ${c.colorPalette.join(', ')}\n`;
      });
    });
    safeCopyToClipboard(report);
    alert('Copied to clipboard!');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <input 
        type="file" 
        multiple 
        className="hidden" 
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files) {
            let files: File[] = Array.from(e.target.files) as File[];
            if (files.length > 200) {
              alert('You can only upload a maximum of 200 files at once.');
              files = files.slice(0, 200);
            }
            onProcessFiles(files, isGroup, groupName);
          }
        }} 
      />

      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Media</h2>
        <MediaView 
            hideHeader={true}
            type="image" 
            items={items.filter(i => i.type === 'image')} 
            characters={characters} 
            onUpload={onUpload} 
            setCharacters={setCharacters} 
            setItems={setItems} 
            filter={filter} 
            setFilter={setFilter} 
        />
      </div>

      {isOverviewSectionHidden ? (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => setIsOverviewSectionHidden?.(false)}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl border font-bold flex items-center gap-2 transition-all cursor-pointer hover:bg-primary/90 shadow-md hover:scale-102 active:scale-98"
          >
            <PieChart className="w-4 h-4" />
            <span>Show Overview & Statistics</span>
          </button>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Overview</h1>
              <p className="text-muted-foreground">Comprehensive statistics for all uploaded characters and files.</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleCopyReport}
                className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80 text-sm font-medium transition-colors"
              >
                Copy Status Report
              </button>
              <button 
                onClick={() => setIsOverviewSectionHidden?.(true)}
                className="bg-secondary hover:bg-secondary/80 text-muted-foreground px-4 py-2 rounded-md hover:text-foreground text-sm font-medium transition-colors border cursor-pointer"
              >
                Hide Overview
              </button>
            </div>
          </div>

          {/* Grid Layout Controller */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-secondary/30 p-2.5 rounded-xl border border-border/40 gap-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1.5 flex items-center gap-2">
              <span>Grid Sizing</span>
              <span className="text-[10px] lowercase text-muted-foreground/60 font-normal">(scrollable up to 4 rows)</span>
            </div>
            <div className="flex bg-secondary/80 p-0.5 rounded-lg text-[11px] gap-1 w-full sm:w-auto">
              <button
                onClick={() => {
                  setGridSize('small');
                  safeSetStorage("overview_grid_size", "small");
                }}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md font-semibold transition-all ${gridSize === 'small' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Small (5/row)
              </button>
              <button
                onClick={() => {
                  setGridSize('medium');
                  safeSetStorage("overview_grid_size", "medium");
                }}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md font-semibold transition-all ${gridSize === 'medium' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Medium (4/row)
              </button>
              <button
                onClick={() => {
                  setGridSize('large');
                  safeSetStorage("overview_grid_size", "large");
                }}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md font-semibold transition-all ${gridSize === 'large' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Large (3/row)
              </button>
              <button
                onClick={() => {
                  setGridSize('two');
                  safeSetStorage("overview_grid_size", "two");
                }}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md font-semibold transition-all ${gridSize === 'two' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Wide (2/row)
              </button>
            </div>
          </div>

          {/* Category & Alphabetical Inspector Tool */}
          <div className="bg-card border rounded-2xl p-4 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-3">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span>Category & Alphabetical Inspector</span>
                  <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full border border-primary/20">Tool</span>
                </h3>
                <p className="text-xs text-muted-foreground">Create custom categories linked to character profiles, or count characters by name letters and gender.</p>
              </div>

              {/* Add Category Form */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input 
                  type="text" 
                  value={newCatInput}
                  onChange={(e) => setNewCatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddCustomCategory();
                  }}
                  placeholder="e.g. Main Cast, Sci-Fi..."
                  className="px-3 py-1.5 bg-background border rounded-lg text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full sm:w-48 font-medium"
                />
                <button
                  onClick={() => handleAddCustomCategory()}
                  className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 transition-all shrink-0 cursor-pointer shadow-sm"
                >
                  + Add Category
                </button>
              </div>
            </div>

            {/* Custom Category Badges / Counters */}
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Active Categories & Character Counts</span>
              <div className="flex flex-wrap gap-2">
                {customCategories.map(cat => {
                  const count = getCategoryCharacterCount(cat);
                  return (
                    <div 
                      key={cat}
                      className="group flex items-center gap-2 bg-secondary/60 hover:bg-secondary text-foreground border border-border px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs"
                    >
                      <button 
                        onClick={() => onSelectCategory?.(cat)}
                        className="flex items-center gap-2 cursor-pointer"
                        title={`View characters in "${cat}"`}
                      >
                        <span>{cat}</span>
                        <span className="bg-primary/15 text-primary px-2 py-0.5 rounded-full text-[10px] font-black">
                          {count}
                        </span>
                      </button>
                      <button
                        onClick={() => handleRemoveCustomCategory(cat)}
                        className="text-muted-foreground/60 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer ml-1"
                        title="Remove category"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Alphabetical & Gender Inspector Bar */}
            <div className="bg-secondary/30 p-3 rounded-xl border border-border/40 space-y-2.5">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <span className="text-xs font-bold text-foreground">Alphabetical & Gender Query</span>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground font-medium">Gender filter:</span>
                  {(['All', 'Male', 'Female', 'Others'] as const).map(g => (
                    <button
                      key={g}
                      onClick={() => setSelectedGenderFilter(g)}
                      className={`px-2.5 py-0.5 rounded-md font-bold transition-all cursor-pointer text-[11px] ${
                        selectedGenderFilter === g ? 'bg-primary text-primary-foreground shadow-xs' : 'bg-background hover:bg-secondary text-muted-foreground'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* A-Z Letter Buttons */}
              <div className="flex flex-wrap gap-1">
                {['All', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'].map(letter => {
                  const letterCount = characters.filter(c => {
                    const matchL = letter === 'All' || c.name.trim().toUpperCase().startsWith(letter);
                    const matchG = selectedGenderFilter === 'All' || c.gender === selectedGenderFilter;
                    return matchL && matchG;
                  }).length;

                  return (
                    <button
                      key={letter}
                      onClick={() => setSelectedLetter(letter)}
                      className={`px-2 py-1 rounded-md text-xs font-bold transition-all cursor-pointer relative ${
                        selectedLetter === letter
                          ? 'bg-primary text-primary-foreground shadow-sm scale-105'
                          : letterCount > 0
                            ? 'bg-background hover:bg-secondary text-foreground border border-border'
                            : 'bg-background/40 text-muted-foreground/40 border border-border/20'
                      }`}
                    >
                      <span>{letter}</span>
                      {letterCount > 0 && (
                        <span className={`ml-1 text-[9px] font-extrabold px-1 py-0.2 rounded-full ${
                          selectedLetter === letter ? 'bg-primary-foreground text-primary' : 'bg-primary/20 text-primary'
                        }`}>
                          {letterCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Realtime Inspector Summary Box */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-background/80 p-2.5 rounded-lg border border-border/50 gap-2">
                <div className="text-xs">
                  <span className="font-medium text-muted-foreground">Active Filter Result: </span>
                  <span className="font-bold text-foreground">
                    {selectedLetter === 'All' ? 'All Characters' : `Starting with "${selectedLetter}"`}
                    {selectedGenderFilter !== 'All' ? ` (${selectedGenderFilter})` : ''}:
                  </span>
                  <span className="ml-1.5 px-2 py-0.5 bg-primary/10 text-primary font-black rounded-md">
                    {inspectedCharacters.length} {inspectedCharacters.length === 1 ? 'character' : 'characters'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {selectedLetter !== 'All' && (
                    <button
                      onClick={() => {
                        const catName = `Letter ${selectedLetter}${selectedGenderFilter !== 'All' ? ` (${selectedGenderFilter})` : ''}`;
                        handleAddCustomCategory(catName);
                      }}
                      className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[11px] font-bold rounded-md transition-all cursor-pointer"
                    >
                      + Save as Category
                    </button>
                  )}
                  {inspectedCharacters.length > 0 && (
                    <button
                      onClick={() => onSelectCategory?.(selectedLetter === 'All' ? 'Total Characters' : `Letter ${selectedLetter}`)}
                      className="px-2.5 py-1 bg-secondary hover:bg-secondary/80 text-foreground text-[11px] font-bold rounded-md border transition-all cursor-pointer"
                    >
                      View Matches ({inspectedCharacters.length})
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="max-h-[380px] overflow-y-auto pr-1 scrollbar-thin border border-transparent rounded-lg">
            <div className={`grid ${
              gridSize === 'small' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5' :
              gridSize === 'medium' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' :
              gridSize === 'large' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
              'grid-cols-1 sm:grid-cols-2'
            } gap-4 pb-2`}>
              {/* Main 4 Cards */}
              <StatCard size={gridSize} title="Total Chars" value={totalChars} subtitle={`${images.length} images, ${texts.length} texts`} previewImages={getCategoryImages('Total Characters')} onClick={() => onSelectCategory?.('Total Characters')} />
              
              {gridSize !== 'two' && (
                <StatCard size={gridSize} title="Groups" value={groups} subtitle={`${groups} folders`} color="bg-orange-500" previewImages={getCategoryImages('Groups')} onClick={() => onSelectCategory?.('Groups')} />
              )}

              <StatCard size={gridSize} title="Male" value={males} subtitle={`${totalChars ? Math.round((males/totalChars)*100) : 0}% share`} color="bg-blue-500" previewImages={getCategoryImages('Male')} onClick={() => onSelectCategory?.('Male')} />
              <StatCard size={gridSize} title="Female" value={females} subtitle={`${totalChars ? Math.round((females/totalChars)*100) : 0}% share`} color="bg-pink-500" previewImages={getCategoryImages('Female')} onClick={() => onSelectCategory?.('Female')} />
              <StatCard size={gridSize} title="Others" value={others} subtitle={`${totalChars ? Math.round((others/totalChars)*100) : 0}% share`} color="bg-purple-500" previewImages={getCategoryImages('Others')} onClick={() => onSelectCategory?.('Others')} />

              {/* Additional Cards shown only when NOT in Wide (2/row) view */}
              {gridSize !== 'two' && (
                <>
                  <StatCard size={gridSize} title="Objects" value={objects} subtitle={`${totalChars ? Math.round((objects/totalChars)*100) : 0}% share`} color="bg-amber-500" previewImages={getCategoryImages('Objects')} onClick={() => onSelectCategory?.('Objects')} />

                  <StatCard size={gridSize} title="Unknown" value={unknownItems} subtitle={`${items.length > 0 ? Math.round((unknownItems/items.length)*100) : 0}% files`} color="bg-gray-500" previewImages={getCategoryImages('Unknown')} onClick={() => onSelectCategory?.('Unknown')} />
                  
                  {!hiddenCategories.includes("Unsorted") && (
                    <StatCard size={gridSize} title="Unsorted" value={unsorted} subtitle={`${unsorted} characters`} color="bg-yellow-500" previewImages={getCategoryImages('Unsorted')} onClick={() => onSelectCategory?.('Unsorted')} onClose={() => toggleCategoryVisibility('Unsorted')} />
                  )}
                  
                  <StatCard size={gridSize} title="Duplicates" value={duplicates} subtitle={`${duplicates} items duplicate`} color="bg-red-500" previewImages={getCategoryImages('Duplicates')} onClick={() => onSelectCategory?.('Duplicates')} />
                  
                  {!hiddenCategories.includes("No Chars") && (
                    <StatCard size={gridSize} title="No Chars" value={noCharImages} subtitle={`${noCharImages} blank files`} color="bg-teal-500" previewImages={getCategoryImages('No Characters')} onClick={() => onSelectCategory?.('No Characters')} onClose={() => toggleCategoryVisibility('No Chars')} />
                  )}
                  
                  {!hiddenCategories.includes("Sketches") && (
                    <StatCard size={gridSize} title="Sketches" value={sketches} subtitle={`${sketches} is hand-drawn`} color="bg-indigo-500" previewImages={getCategoryImages('Sketches')} onClick={() => onSelectCategory?.('Sketches')} onClose={() => toggleCategoryVisibility('Sketches')} />
                  )}
                  
                  <StatCard size={gridSize} title="Total Files" value={items.length} subtitle={`${items.filter(i => i.isGroup).length} group collections`} color="bg-emerald-500" previewImages={getCategoryImages('All Files')} onClick={() => onSelectCategory?.('Total Characters')} />
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-card border rounded-lg p-6 space-y-4">
              <h2 className="text-xl font-semibold">Species Breakdown</h2>
              {speciesEntries.length === 0 ? (
                <p className="text-muted-foreground text-sm">No data available.</p>
              ) : (
                <div className="space-y-3">
                  {speciesEntries.map(([species, count]) => (
                    <div key={species} onClick={() => onSelectCategory?.(species)} className="cursor-pointer group">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize group-hover:text-primary transition-colors">{species}</span>
                        <span className="font-medium group-hover:text-primary transition-colors">{count}</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary rounded-full h-2 group-hover:bg-primary/80 transition-colors" 
                          style={{ width: `${(count / totalChars) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-card border rounded-lg p-6 space-y-4">
              <h2 className="text-xl font-semibold">Archive Status</h2>
              <div className="space-y-3">
                <StatusRow label="Unsorted" count={unsorted} total={totalChars} onClick={() => onSelectCategory?.('Unsorted')} />
                <StatusRow label="Duplicate" count={duplicates} total={totalChars} onClick={() => onSelectCategory?.('Duplicate')} />
                <div className="flex justify-between text-sm py-2 border-t mt-4">
                  <span className="text-muted-foreground">Images with No Characters</span>
                  <span className="font-medium">{noCharImages}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function FolderShufflePile({ images, size = 'small' }: { images: string[], size?: 'small' | 'medium' | 'large' | 'two' }) {
  if (!images || images.length === 0) {
    let noneStyles = "w-10 h-10 text-[9px]";
    if (size === 'medium') noneStyles = "w-14 h-14 text-[11px]";
    if (size === 'large') noneStyles = "w-18 h-18 text-xs";
    if (size === 'two') noneStyles = "w-24 h-24 text-sm";

    return (
      <div className={`${noneStyles} rounded-lg bg-secondary/30 flex items-center justify-center border border-dashed border-muted-foreground/30 text-muted-foreground select-none`}>
        None
      </div>
    );
  }

  let containerStyles = "w-10 h-10";
  let cardStyles = "w-8 h-8 rounded-md";
  let translateHover = "group-hover:translate-y-[-2px]";

  if (size === 'medium') {
    containerStyles = "w-14 h-14";
    cardStyles = "w-12 h-12 rounded-lg";
    translateHover = "group-hover:translate-y-[-4px]";
  } else if (size === 'large') {
    containerStyles = "w-18 h-18";
    cardStyles = "w-16 h-16 rounded-xl border-2";
    translateHover = "group-hover:translate-y-[-6px]";
  } else if (size === 'two') {
    containerStyles = "w-24 h-24";
    cardStyles = "w-22 h-22 rounded-2xl border-2 shadow-md";
    translateHover = "group-hover:translate-y-[-8px]";
  }

  return (
    <div className={`relative ${containerStyles} flex items-center justify-center select-none`}>
      {images.map((src, idx) => {
        const zIndex = images.length - idx;
        const rotateDeg = idx === 0 ? '-6deg' : idx === 1 ? '6deg' : '0deg';
        
        let offsetLeft = "0px";
        let offsetTop = "0px";
        if (size === 'small') {
          offsetLeft = idx === 0 ? '-2px' : idx === 1 ? '2px' : '0px';
          offsetTop = idx === 0 ? '-1px' : idx === 1 ? '1px' : '-2px';
        } else if (size === 'medium') {
          offsetLeft = idx === 0 ? '-4px' : idx === 1 ? '4px' : '0px';
          offsetTop = idx === 0 ? '-2px' : idx === 1 ? '2px' : '-4px';
        } else if (size === 'large') {
          offsetLeft = idx === 0 ? '-6px' : idx === 1 ? '6px' : '0px';
          offsetTop = idx === 0 ? '-3px' : idx === 1 ? '3px' : '-6px';
        } else if (size === 'two') {
          offsetLeft = idx === 0 ? '-8px' : idx === 1 ? '8px' : '0px';
          offsetTop = idx === 0 ? '-4px' : idx === 1 ? '4px' : '-8px';
        }

        const scale = idx === 0 ? 'scale-100' : idx === 1 ? 'scale-[0.92]' : 'scale-[0.85]';
        
        return (
          <div
            key={idx}
            style={{
              zIndex,
              transform: `rotate(${rotateDeg}) translate(${offsetLeft}, ${offsetTop})`,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            className={`absolute ${cardStyles} overflow-hidden border border-border/80 bg-card shadow-sm flex-shrink-0 ${scale} ${translateHover} group-hover:rotate-0`}
          >
            <img
              src={src}
              alt={`Category Preview ${idx}`}
              className="w-full h-full object-cover select-none pointer-events-none"
            />
          </div>
        );
      })}
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  subtitle, 
  color = "bg-primary", 
  onClick,
  previewImages = [],
  size = 'small',
  onClose
}: { 
  title: string, 
  value: number | string, 
  subtitle: string, 
  color?: string, 
  onClick?: () => void,
  previewImages?: string[],
  size?: 'small' | 'medium' | 'large' | 'two',
  onClose?: () => void
}) {
  let paddingClass = "p-3 gap-2.5";
  let titleClass = "text-[9px] mb-0.5";
  let valueClass = "text-lg";
  let subtitleClass = "text-[9px]";

  if (size === 'medium') {
    paddingClass = "p-4 gap-3";
    titleClass = "text-[10px] mb-1";
    valueClass = "text-xl";
    subtitleClass = "text-[10px]";
  } else if (size === 'large') {
    paddingClass = "p-5 gap-4";
    titleClass = "text-xs mb-1 font-semibold";
    valueClass = "text-2xl";
    subtitleClass = "text-xs";
  } else if (size === 'two') {
    paddingClass = "p-6 gap-5";
    titleClass = "text-xs mb-1.5 font-bold";
    valueClass = "text-3xl";
    subtitleClass = "text-xs font-medium";
  }

  return (
    <div 
      onClick={onClick} 
      className={`bg-card border rounded-lg ${paddingClass} flex items-center justify-between group relative ${onClick ? 'cursor-pointer hover:border-primary hover:shadow-md transition-all duration-300' : ''}`}
    >
      {onClose && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-secondary hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-all z-10 select-none cursor-pointer border border-border"
          title={`Hide ${title}`}
        >
          ×
        </button>
      )}

      <div className="flex-1 min-w-0">
        <h3 className={`text-muted-foreground font-medium uppercase tracking-wider truncate ${titleClass}`} title={title}>{title}</h3>
        <div className={`font-bold mb-0.5 flex items-center gap-1.5 ${valueClass}`}>
          {value}
          <div className={`w-1.5 h-1.5 rounded-full ${color}`}></div>
        </div>
        <p className={`text-muted-foreground truncate ${subtitleClass}`} title={subtitle}>{subtitle}</p>
      </div>
      
      <div className="flex-shrink-0">
        <FolderShufflePile images={previewImages} size={size} />
      </div>
    </div>
  );
}

function StatusRow({ label, count, total, onClick }: { label: string, count: number, total: number, onClick?: () => void }) {
  return (
    <div className={`flex justify-between items-center text-sm ${onClick ? 'cursor-pointer hover:text-primary transition-colors' : ''}`} onClick={onClick}>
      <span className={onClick ? '' : 'text-muted-foreground'}>{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-medium">{count}</span>
        <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
          {total ? Math.round((count/total)*100) : 0}%
        </span>
      </div>
    </div>
  );
}
