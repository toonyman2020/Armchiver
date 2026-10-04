import React, { useState, useEffect } from 'react';
import { ArchiveItem, Character, Status } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { 
  Upload, X, Edit2, Search, ChevronLeft, ChevronRight, Shuffle, Heart, 
  Trash2, Copy, Layers, Crop, LayoutGrid, List, Image as ImageIcon, Music, Video as VideoIcon, Check, Download
} from 'lucide-react';
import { CharacterEditor } from './CharacterEditor';
import { safeCopyToClipboard } from '../lib/utils';
import { exportCharacterBooklet } from '../lib/exportBooklet';
import { RenderFavoriteIcon } from './FavoriteIconRenderer';
import { FavoriteIconSelectorModal } from './FavoriteIconSelectorModal';

interface MediaViewProps {
  type: 'image' | 'text' | 'audio' | 'video';
  items: ArchiveItem[];
  characters: Character[];
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setCharacters: React.Dispatch<React.SetStateAction<Character[]>>;
  setItems: React.Dispatch<React.SetStateAction<ArchiveItem[]>>;
  filter: string;
  setFilter: (f: string) => void;
  filteredItems?: ArchiveItem[];
  filteredCharacters?: Character[];
  hideHeader?: boolean;
  lastAddedItemId?: string | null;
  isGroup?: boolean;
  groupName?: string;
  setIsGroup?: React.Dispatch<React.SetStateAction<boolean>>;
  setGroupName?: React.Dispatch<React.SetStateAction<string>>;
}

type FilterTab = 'All' | 'Male' | 'Female' | 'Others' | 'Objects' | 'Unsorted' | 'No Characters' | 'Duplicates';

export function MediaView({ type, items, characters, onUpload, setCharacters, setItems, filter, setFilter, filteredItems, filteredCharacters, hideHeader, lastAddedItemId, isGroup, groupName, setIsGroup, setGroupName }: MediaViewProps) {
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [cardSize, setCardSize] = useState<'sm' | 'md' | 'lg'>(() => {
    return (localStorage.getItem("media_card_size") as 'sm' | 'md' | 'lg') || 'md';
  });
  const [imageDisplayMode, setImageDisplayMode] = useState<'crop' | 'medium' | 'full'>(() => {
    return (localStorage.getItem("media_image_display_mode") as 'crop' | 'medium' | 'full') || 'medium';
  });
  const [sortBy, setSortBy] = useState<'name' | 'characters' | 'gender' | 'group'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeExportCharId, setActiveExportCharId] = useState<string | null>(null);
  const [favoriteModalTargetChar, setFavoriteModalTargetChar] = useState<Character | null>(null);
  const [favoriteModalTargetItem, setFavoriteModalTargetItem] = useState<ArchiveItem | null>(null);
  const [isFavIconModalOpen, setIsFavIconModalOpen] = useState(false);

  // Aspect ratio states
  const [globalAspectRatio, setGlobalAspectRatio] = useState<string>(() => {
    return localStorage.getItem("media_global_aspect_ratio") || "3:4";
  });
  const [individualRatios, setIndividualRatios] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem("media_individual_aspect_ratios");
    return saved ? JSON.parse(saved) : {};
  });
  const [imageFitMode, setImageFitMode] = useState<'cover' | 'contain'>(() => {
    return (localStorage.getItem("media_image_fit_mode") as 'cover' | 'contain') || 'cover';
  });
  const [cardTitlePlacement, setCardTitlePlacement] = useState<'top' | 'bottom' | 'both'>(() => {
    return (localStorage.getItem("card_title_placement") as 'top' | 'bottom' | 'both') || 'top';
  });

  const handleCardSizeChange = (size: 'sm' | 'md' | 'lg') => {
    setCardSize(size);
    localStorage.setItem("media_card_size", size);
  };

  const handleImageDisplayModeChange = (mode: 'crop' | 'medium' | 'full') => {
    setImageDisplayMode(mode);
    localStorage.setItem("media_image_display_mode", mode);
  };

  const handleGlobalRatioChange = (ratio: string) => {
    setGlobalAspectRatio(ratio);
    localStorage.setItem("media_global_aspect_ratio", ratio);
  };

  const handleIndividualRatioChange = (charId: string, ratio: string) => {
    const updated = { ...individualRatios, [charId]: ratio };
    setIndividualRatios(updated);
    localStorage.setItem("media_individual_aspect_ratios", JSON.stringify(updated));
  };

  const handleImageFitChange = (mode: 'cover' | 'contain') => {
    setImageFitMode(mode);
    localStorage.setItem("media_image_fit_mode", mode);
  };

  const getAspectRatioStyle = (charId: string) => {
    const ratio = individualRatios[charId] || globalAspectRatio;
    switch (ratio) {
      case '1:1': return '1 / 1';
      case '9:16': return '9 / 16';
      case '16:9': return '16 / 9';
      case '3:4': return '3 / 4';
      case '4:3': return '4 / 3';
      default: return '3 / 4';
    }
  };

  // Renaming files state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editTitleInput, setEditTitleInput] = useState('');

  useEffect(() => {
    if (lastAddedItemId) {
      const element = document.getElementById(lastAddedItemId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [lastAddedItemId]);

  const displayItems = (filteredItems || items).filter(i => i.type === type);
  const displayCharacters = filteredCharacters || characters;

  const searchFilteredItems = displayItems.filter(item => 
    item.originalName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (item.groupName && item.groupName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const searchFilteredCharacters = displayCharacters.filter(char => 
    char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (char.description && char.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getSortValue = (item: any, isChar: boolean) => {
    if (sortBy === 'name') return isChar ? item.name : item.originalName;
    if (sortBy === 'characters') return isChar ? 0 : item.charactersCount;
    if (sortBy === 'gender') return isChar ? item.gender : 'Unknown';
    if (sortBy === 'group') return isChar ? '' : item.groupName || '';
    return '';
  };

  const sortedItems = [...searchFilteredItems].sort((a, b) => {
    const valA = getSortValue(a, false);
    const valB = getSortValue(b, false);
    const direction = sortDir === 'asc' ? 1 : -1;
    return valA > valB ? direction : valA < valB ? -direction : 0;
  });

  const sortedCharacters = [...searchFilteredCharacters].sort((a, b) => {
    const valA = getSortValue(a, true);
    const valB = getSortValue(b, true);
    const direction = sortDir === 'asc' ? 1 : -1;
    return valA > valB ? direction : valA < valB ? -direction : 0;
  });

  const filteredCharactersResult = filteredCharacters || sortedCharacters.filter(c => {
    const item = items.find(i => i.id === c.sourceId);
    if (item?.isHidden) return false;

    if (filter === 'All') return true;
    if (filter === 'Unsorted') return c.status === 'Unsorted';
    if (filter === 'Duplicates') return c.status === 'Duplicate';
    if (filter === 'No Characters') return false; // Handled separately
    return c.gender === filter;
  });

  const noCharItems = filteredItems || sortedItems.filter(i => i.charactersCount === 0 && !i.isHidden);

  const isAudioOrVideo = type === 'audio' || type === 'video';

  const getAcceptAttribute = () => {
    if (type === 'image') return "image/*";
    if (type === 'audio') return "audio/*";
    if (type === 'video') return "video/*,image/gif";
    return ".txt,text/plain";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {!hideHeader && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight capitalize">
              {type === 'image' ? 'Images Only' : type === 'audio' ? 'Audios' : type === 'video' ? 'Videos' : 'Texts'}
            </h1>
            <p className="text-muted-foreground">Upload, organize, and inspect your character-level {type} sheets.</p>
          </div>
          
          <div className="w-full md:w-auto flex flex-col gap-2">
            <label className="border-2 border-dashed border-muted-foreground/20 p-6 rounded-xl cursor-pointer hover:border-primary transition-colors flex flex-col items-center justify-center font-semibold text-muted-foreground hover:text-primary">
              <div className="flex items-center gap-2">
                <Upload className="w-6 h-6" />
                <span className="text-lg">Upload {type === 'image' ? 'Images' : type === 'audio' ? 'Audios' : type === 'video' ? 'Videos' : 'Texts'}</span>
              </div>
              <span className="text-sm font-normal opacity-85 mt-2">Drag and drop files here (Max 200 - 500MB)</span>
              <input 
                type="file" 
                accept={getAcceptAttribute()} 
                multiple 
                className="hidden" 
                onChange={onUpload}
              />
            </label>

            {setIsGroup && (
              <div className="flex items-center justify-center gap-3 bg-secondary/60 px-3 py-1.5 rounded-lg border text-xs font-semibold">
                <label className="flex items-center gap-1 cursor-pointer select-none">
                  <input
                    type="radio"
                    name={`mediaGroupMode_${type}`}
                    checked={!isGroup}
                    onChange={() => setIsGroup(false)}
                    className="w-3.5 h-3.5 accent-primary cursor-pointer"
                  />
                  <span className={!isGroup ? "font-bold text-foreground" : "text-muted-foreground"}>
                    Individual files
                  </span>
                </label>

                <label className="flex items-center gap-1 cursor-pointer select-none">
                  <input
                    type="radio"
                    name={`mediaGroupMode_${type}`}
                    checked={isGroup}
                    onChange={() => setIsGroup(true)}
                    className="w-3.5 h-3.5 accent-primary cursor-pointer"
                  />
                  <span className={isGroup ? "font-bold text-primary" : "text-muted-foreground"}>
                    Group files
                  </span>
                </label>

                {isGroup && (
                  <input
                    type="text"
                    placeholder="Project / Group Name..."
                    value={groupName || ''}
                    onChange={(e) => setGroupName?.(e.target.value)}
                    className="text-xs px-2 py-0.5 rounded border border-primary/40 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-32 sm:w-40 font-semibold"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* View Mode & Sizing controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-secondary/10 p-3 rounded-xl border">
        <div className="text-sm font-semibold text-muted-foreground">
          Showing {isAudioOrVideo ? sortedItems.length : (filter === 'No Characters' ? noCharItems.length : filteredCharactersResult.length)} entries
        </div>
        
        <div className="flex items-center gap-2 flex-wrap flex-1 justify-end">
          {/* Search control */}
          <div className="relative group mr-auto max-w-[200px] w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-secondary/50 border-border/50 rounded-md outline-none focus:ring-1 focus:ring-primary focus:bg-background transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Sorting controls */}
          <div className="flex bg-secondary rounded-md p-1 gap-1 items-center">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="bg-background text-xs rounded-sm p-1">
              <option value="name">Name</option>
              <option value="characters">Chars</option>
              <option value="gender">Gender</option>
              <option value="group">Group</option>
            </select>
            <button 
              onClick={() => setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')} 
              className="text-xs font-bold px-1.5 py-0.5 hover:bg-background rounded"
            >
              {sortDir === 'asc' ? '↑' : '↓'}
            </button>
          </div>

          {/* Card sizing controls */}
          <div className="flex bg-secondary rounded-md p-1 gap-0.5 items-center">
            <button onClick={() => handleCardSizeChange('sm')} className={`px-2 py-0.5 text-xs rounded-sm font-semibold transition-all ${cardSize === 'sm' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>SM</button>
            <button onClick={() => handleCardSizeChange('md')} className={`px-2 py-0.5 text-xs rounded-sm font-semibold transition-all ${cardSize === 'md' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>MD</button>
            <button onClick={() => handleCardSizeChange('lg')} className={`px-2 py-0.5 text-xs rounded-sm font-semibold transition-all ${cardSize === 'lg' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>LG</button>
          </div>

          {/* Layout Mode (Grid vs List) */}
          <div className="flex bg-secondary rounded-md p-1 gap-1 items-center">
            <button onClick={() => setViewMode('grid')} className={`p-1 rounded-sm transition-all ${viewMode === 'grid' ? 'bg-background text-foreground' : 'text-muted-foreground hover:text-foreground'}`}><LayoutGrid className="w-3.5 h-3.5" /></button>
            <button onClick={() => setViewMode('list')} className={`p-1 rounded-sm transition-all ${viewMode === 'list' ? 'bg-background text-foreground' : 'text-muted-foreground hover:text-foreground'}`}><List className="w-3.5 h-3.5" /></button>
          </div>

          {/* Card Title Placement Selector (Top / Bottom / Both) */}
          <div className="flex bg-secondary rounded-md p-1 gap-1 items-center" title="Card Title Placement">
            <span className="text-[10px] text-muted-foreground px-1 font-semibold uppercase tracking-wider hidden sm:inline">Title:</span>
            <button 
              onClick={() => {
                setCardTitlePlacement('top');
                localStorage.setItem('card_title_placement', 'top');
              }}
              className={`px-2 py-0.5 text-xs rounded-sm transition-all cursor-pointer ${cardTitlePlacement === 'top' ? 'bg-background shadow-sm text-foreground font-bold border border-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
              title="Header Title above Image (Default)"
            >
              Top
            </button>
            <button 
              onClick={() => {
                setCardTitlePlacement('bottom');
                localStorage.setItem('card_title_placement', 'bottom');
              }}
              className={`px-2 py-0.5 text-xs rounded-sm transition-all cursor-pointer ${cardTitlePlacement === 'bottom' ? 'bg-background shadow-sm text-foreground font-bold border border-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
              title="Title in Bottom area"
            >
              Bottom
            </button>
            <button 
              onClick={() => {
                setCardTitlePlacement('both');
                localStorage.setItem('card_title_placement', 'both');
              }}
              className={`px-2 py-0.5 text-xs rounded-sm transition-all cursor-pointer ${cardTitlePlacement === 'both' ? 'bg-background shadow-sm text-foreground font-bold border border-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
              title="Title at both Top and Bottom"
            >
              Both
            </button>
          </div>
                  {/* Image Display Mode controls (Crop, Medium, Full) */}
          {type === 'image' && (
            <div className="flex bg-secondary rounded-md p-1 gap-1 items-center" title="Image display mode">
              <span className="text-[10px] text-muted-foreground px-1 font-semibold uppercase tracking-wider hidden sm:inline">View:</span>
              <button onClick={() => handleImageDisplayModeChange('crop')} className={`px-2 py-0.5 text-xs rounded-sm transition-all flex items-center gap-1 ${imageDisplayMode === 'crop' ? 'bg-background shadow-sm text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}><Crop className="w-3 h-3" /><span>Crop</span></button>
              <button onClick={() => handleImageDisplayModeChange('medium')} className={`px-2 py-0.5 text-xs rounded-sm transition-all flex items-center gap-1 ${imageDisplayMode === 'medium' ? 'bg-background shadow-sm text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}><ImageIcon className="w-3 h-3" /><span>Medium</span></button>
              <button onClick={() => handleImageDisplayModeChange('full')} className={`px-2 py-0.5 text-xs rounded-sm transition-all flex items-center gap-1 ${imageDisplayMode === 'full' ? 'bg-background shadow-sm text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}><span>Full</span></button>
            </div>
          )}

          {/* Aspect Ratio & Fit Controls */}
          {type === 'image' && (
            <div className="flex bg-secondary rounded-md p-1 gap-1 items-center animate-fade-in" title="Thumbnail aspect ratio">
              <span className="text-[10px] text-muted-foreground px-1 font-semibold uppercase tracking-wider hidden sm:inline">Ratio:</span>
              <select 
                value={globalAspectRatio} 
                onChange={(e) => handleGlobalRatioChange(e.target.value)}
                className="bg-background text-xs rounded-sm p-1 font-semibold outline-none focus:ring-1 focus:ring-primary border-none cursor-pointer"
              >
                <option value="3:4">3:4 Portrait</option>
                <option value="9:16">9:16 Tall</option>
                <option value="1:1">1:1 Square</option>
                <option value="4:3">4:3 Standard</option>
                <option value="16:9">16:9 Wide</option>
              </select>
              <span className="text-[10px] text-muted-foreground px-1 font-semibold uppercase tracking-wider hidden lg:inline">Fit:</span>
              <button 
                onClick={() => handleImageFitChange('cover')} 
                className={`px-2 py-0.5 text-xs rounded-sm transition-all ${imageFitMode === 'cover' ? 'bg-background shadow-sm text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
                title="Fill card container (covers excess)"
              >
                Cover
              </button>
              <button 
                onClick={() => handleImageFitChange('contain')} 
                className={`px-2 py-0.5 text-xs rounded-sm transition-all ${imageFitMode === 'contain' ? 'bg-background shadow-sm text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
                title="Fit entirely inside container (no cropping)"
              >
                Contain
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 space-y-6">
        {isAudioOrVideo ? (
          /* SPECIALIZED AUDIO AND VIDEO LIBRARIES */
          <div className={viewMode === 'list' ? "space-y-3" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"}>
            {sortedItems.length === 0 && (
              <p className="text-muted-foreground col-span-full py-8 text-center italic">No uploaded {type} files found.</p>
            )}
            {sortedItems.map(item => (
              <div key={item.id} className="bg-card border rounded-xl overflow-hidden group relative flex flex-col p-4 gap-3 shadow-sm hover:border-primary transition-all">
                
                {/* Delete and copy buttons */}
                <div className="absolute top-2 right-2 z-10 flex gap-1 bg-background/60 backdrop-blur rounded-full p-0.5">
                  <button className="p-1 hover:bg-secondary rounded-full" onClick={(e) => { e.stopPropagation(); safeCopyToClipboard(item.originalName); }} title="Copy Title">
                    <Copy className="w-3.5 h-3.5 text-foreground" />
                  </button>
                  <button className="p-1 hover:bg-secondary rounded-full text-destructive" onClick={(e) => { e.stopPropagation(); setItems(prev => prev.filter(i => i.id !== item.id)); }} title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Media preview element */}
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2.5 rounded-lg border border-primary/20 shrink-0">
                    {type === 'audio' ? <Music className="w-5 h-5 text-primary" /> : <VideoIcon className="w-5 h-5 text-primary" />}
                  </div>
                  
                  <div className="flex-1 min-w-0 pr-12">
                    {editingItemId === item.id ? (
                      <div className="flex items-center gap-1">
                        <input 
                          type="text" 
                          value={editTitleInput} 
                          onChange={e => setEditTitleInput(e.target.value)}
                          className="w-full bg-background border rounded px-1.5 py-0.5 text-xs font-semibold"
                          autoFocus
                        />
                        <button 
                          onClick={() => {
                            setItems(prev => prev.map(i => i.id === item.id ? { ...i, originalName: editTitleInput } : i));
                            setEditingItemId(null);
                          }}
                          className="p-1 text-green-600 hover:bg-secondary rounded"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <h3 className="font-semibold text-sm truncate" title={item.originalName}>{item.originalName}</h3>
                        <button 
                          onClick={() => {
                            setEditingItemId(item.id);
                            setEditTitleInput(item.originalName);
                          }}
                          className="p-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground rounded"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground">{(item.fileSize / (1024 * 1024)).toFixed(2)} MB • {new Date(item.fileDate).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Main player controls */}
                <div className="pt-2 border-t mt-auto">
                  {type === 'audio' ? (
                    <audio src={item.content} controls className="h-9 w-full" />
                  ) : (
                    <video src={item.content} controls muted loop className="w-full h-36 object-cover rounded-md bg-black" />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : filter === 'No Characters' ? (
          /* STANDARD ARCHIVE ITEMS WITH NO CHARACTERS */
          <div className={
            viewMode === 'list' 
              ? "space-y-3" 
              : cardSize === 'sm'
                ? "grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2"
                : cardSize === 'lg'
                  ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
                  : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          }>
            {noCharItems.length === 0 && <p className="text-muted-foreground col-span-full">No items found.</p>}
            {noCharItems.map(item => (
              <div 
                key={item.id} 
                id={item.id}
                className={`bg-card border rounded-lg overflow-hidden group relative flex ${
                  viewMode === 'list' ? 'flex-row items-center gap-4 p-3' : 'flex-col'
                }`}
              >
                {/* Header above image (Top Title placement) */}
                {(cardTitlePlacement === 'top' || cardTitlePlacement === 'both') && viewMode === 'grid' && (
                  <div 
                    className="px-3 py-2 bg-secondary/50 border-b flex items-center justify-between gap-2 shrink-0 z-10 w-full hover:bg-secondary/80 transition-colors cursor-pointer"
                  >
                    <p className="font-extrabold text-sm truncate text-foreground group-hover:text-primary transition-colors" title={item.originalName.replace(/\.[^/.]+$/, "")}>
                      {item.originalName.replace(/\.[^/.]+$/, "")}
                    </p>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase shrink-0">Item</span>
                  </div>
                )}

                <div className={`absolute ${ (cardTitlePlacement === 'top' || cardTitlePlacement === 'both') && viewMode === 'grid' ? 'top-11' : 'top-2' } right-2 z-10 flex gap-1`}>
                  <button className="p-1 bg-background/50 backdrop-blur rounded-full hover:bg-background" onClick={(e) => { e.stopPropagation(); setItems(prev => prev.filter(i => i.id !== item.id)); }}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                  <button className="p-1 bg-background/50 backdrop-blur rounded-full hover:bg-background" onClick={(e) => { e.stopPropagation(); safeCopyToClipboard(item.originalName); }}>
                    <Copy className="w-4 h-4" />
                  </button>
                  <button className="p-1 bg-background/50 backdrop-blur rounded-full hover:bg-background" onClick={(e) => { e.stopPropagation(); setItems(prev => [...prev, {...item, id: uuidv4(), originalName: `${item.originalName} (Copy)`}]); }}>
                    <Layers className="w-4 h-4" />
                  </button>
                  {type === 'image' && (
                    <button className="p-1 bg-background/50 backdrop-blur rounded-full hover:bg-background" onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('crop-archive-image', { detail: { itemId: item.id, src: item.content } })); }}>
                      <Crop className="w-4 h-4 text-primary" />
                    </button>
                  )}
                </div>
                <button 
                  className={`absolute ${ (cardTitlePlacement === 'top' || cardTitlePlacement === 'both') && viewMode === 'grid' ? 'top-11' : 'top-2' } left-2 z-10 p-1 bg-background/60 backdrop-blur rounded-full hover:bg-background flex items-center justify-center transition-all cursor-pointer`}
                  onClick={(e) => {
                      e.stopPropagation();
                      setItems(prev => prev.map(i => i.id === item.id ? {...i, isFavorite: !i.isFavorite} : i));
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setFavoriteModalTargetItem(item);
                    setFavoriteModalTargetChar(null);
                    setIsFavIconModalOpen(true);
                  }}
                  title={item.isFavorite ? 'Remove from favorites (Right-click to change icon)' : 'Add to favorites (Right-click to customize icon)'}
                >
                  <RenderFavoriteIcon 
                    iconId={item.favoriteIcon} 
                    customColor={item.favoriteColor} 
                    isFavorite={!!item.isFavorite} 
                    size="sm" 
                  />
                </button>
                <div 
                  className={`relative overflow-hidden shrink-0 ${
                    viewMode === 'list' 
                      ? cardSize === 'sm' ? 'w-16 h-16 rounded-md' : cardSize === 'lg' ? 'w-32 h-32 rounded-lg' : 'w-24 h-24 rounded-lg'
                      : cardSize === 'sm' ? 'h-24 w-full' : 'w-full'
                  } bg-secondary/30`}
                  style={viewMode === 'grid' && cardSize !== 'sm' ? { aspectRatio: getAspectRatioStyle("") } : undefined}
                >
                  {type === 'image' ? (
                    <img 
                      src={imageDisplayMode === 'crop' ? (item.thumbnailContent || item.content) : item.content} 
                      alt={item.originalName} 
                      className="w-full h-full cursor-zoom-in hover:opacity-90 transition-opacity"
                      style={{ objectFit: imageFitMode }}
                      onClick={(e) => {
                        e.stopPropagation();
                        window.dispatchEvent(new CustomEvent('expand-image', { detail: { src: item.content } }));
                      }}
                      title="Click to expand image"
                    />
                  ) : (
                    <div className="w-full h-full p-4 overflow-hidden text-xs text-muted-foreground bg-secondary/30">
                      {item.content.substring(0, 500)}...
                    </div>
                  )}
                </div>
                <div className="p-3 flex-1 min-w-0">
                  {(cardTitlePlacement === 'bottom' || cardTitlePlacement === 'both' || viewMode === 'list') && (
                    <p className="font-medium truncate text-sm">{item.originalName.replace(/\.[^/.]+$/, "")}</p>
                  )}
                  <p className="text-xs text-muted-foreground">No characters detected</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* STANDARD ARCHIVE CHARACTERS */
          <div className={
            viewMode === 'list' 
              ? "space-y-3" 
              : cardSize === 'sm'
                ? "grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2"
                : cardSize === 'lg'
                  ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
                  : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          }>
            {filteredCharactersResult.length === 0 && <p className="text-muted-foreground col-span-full">No characters found.</p>}
            {filteredCharactersResult.map(char => {
              const sourceItem = items.find(i => i.id === char.sourceId);
              return (
                <div 
                  key={char.id} 
                  className={`bg-card border rounded-lg overflow-hidden cursor-pointer hover:border-primary transition-colors group relative flex ${
                    viewMode === 'list' ? 'flex-row items-center gap-4 p-3' : 'flex-col'
                  }`}
                  onClick={() => setSelectedCharId(char.id)}
                >
                  {/* Dedicated Header Bar ABOVE Thumbnail (Top Title) */}
                  {(cardTitlePlacement === 'top' || cardTitlePlacement === 'both') && viewMode === 'grid' && (
                    <div 
                      className="px-3 py-2 bg-secondary/50 border-b flex items-center justify-between gap-2 shrink-0 z-10 w-full hover:bg-secondary/80 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h3 className="font-extrabold text-sm truncate text-foreground group-hover:text-primary transition-colors" title={char.name}>
                          {char.name}
                        </h3>
                        <div className={`w-2 h-2 rounded-full shrink-0 ${char.gender === 'Male' ? 'bg-blue-500' : char.gender === 'Female' ? 'bg-pink-500' : char.gender === 'Objects' ? 'bg-amber-500' : 'bg-purple-500'}`} />
                      </div>
                      {char.species && cardSize !== 'sm' && (
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate shrink-0">
                          {char.species}
                        </span>
                      )}
                    </div>
                  )}

                  <button 
                    className={`absolute ${ (cardTitlePlacement === 'top' || cardTitlePlacement === 'both') && viewMode === 'grid' ? 'top-11' : 'top-2' } left-2 z-10 p-1 bg-background/60 backdrop-blur rounded-full hover:bg-background flex items-center justify-center transition-all cursor-pointer`}
                    onClick={(e) => {
                        e.stopPropagation();
                        setCharacters(prev => prev.map(c => c.id === char.id ? {...c, isFavorite: !c.isFavorite} : c));
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setFavoriteModalTargetChar(char);
                      setFavoriteModalTargetItem(null);
                      setIsFavIconModalOpen(true);
                    }}
                    title={char.isFavorite ? 'Remove from favorites (Right-click to customize icon)' : 'Add to favorites (Right-click to customize icon)'}
                  >
                    <RenderFavoriteIcon 
                      iconId={char.favoriteIcon} 
                      customColor={char.favoriteColor} 
                      isFavorite={!!char.isFavorite} 
                      size="sm" 
                    />
                  </button>
                  {type === 'image' && sourceItem && (
                    <div className={`absolute ${ (cardTitlePlacement === 'top' || cardTitlePlacement === 'both') && viewMode === 'grid' ? 'top-11' : 'top-2' } right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
                      {viewMode === 'grid' && (
                        <button 
                          className="p-1 bg-background/80 backdrop-blur rounded-full hover:bg-background border shadow-sm flex items-center justify-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            const ratios = ['3:4', '9:16', '1:1', '4:3', '16:9'];
                            const current = individualRatios[char.id] || globalAspectRatio;
                            const nextIdx = (ratios.indexOf(current) + 1) % ratios.length;
                            handleIndividualRatioChange(char.id, ratios[nextIdx]);
                          }}
                          title={`Cycle Aspect Ratio (Current: ${individualRatios[char.id] || globalAspectRatio})`}
                        >
                          <span className="text-[9px] font-extrabold px-1 text-primary">
                            {individualRatios[char.id] || globalAspectRatio}
                          </span>
                        </button>
                      )}
                      <button 
                        className="p-1 bg-background/80 backdrop-blur rounded-full hover:bg-background border shadow-sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            window.dispatchEvent(new CustomEvent('crop-archive-image', { detail: { itemId: sourceItem.id, src: sourceItem.content } }));
                        }}
                        title="Crop Source Thumbnail"
                      >
                        <Crop className="w-3.5 h-3.5 text-primary" />
                      </button>
                    </div>
                  )}
                  {type === 'image' && sourceItem && (
                    <div 
                      className={`relative overflow-hidden shrink-0 ${
                        viewMode === 'list' 
                          ? cardSize === 'sm' ? 'w-16 h-16 rounded-md' : cardSize === 'lg' ? 'w-32 h-32 rounded-lg' : 'w-24 h-24 rounded-lg'
                          : cardSize === 'sm' ? 'h-24 w-full' : 'w-full'
                      } bg-secondary/30`}
                      style={viewMode === 'grid' && cardSize !== 'sm' ? { aspectRatio: getAspectRatioStyle(char.id) } : undefined}
                    >
                      <img 
                        src={char.defaultThumbnailSrc || char.highlightedImageSrc || (imageDisplayMode === 'crop' ? (sourceItem.thumbnailContent || sourceItem.content) : sourceItem.content)} 
                        alt="Source" 
                        className="w-full h-full group-hover:scale-105 transition-all duration-500 cursor-zoom-in"
                        style={{ objectFit: imageFitMode }}
                        onClick={(e) => {
                          e.stopPropagation();
                          window.dispatchEvent(new CustomEvent('expand-image', { detail: { src: sourceItem.content } }));
                        }}
                        title="Click to expand source image"
                      />
                      {char.isSketch && cardSize !== 'sm' && (
                        <span className="absolute bottom-2 left-2 bg-background/80 backdrop-blur text-[10px] px-1.5 py-0.5 rounded-md border font-semibold">Sketch</span>
                      )}
                    </div>
                  )}
                  <div className="p-4 flex-1 flex flex-col min-w-0">
                    {(cardTitlePlacement === 'bottom' || cardTitlePlacement === 'both' || viewMode === 'list') && (
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold truncate" title={char.name}>{char.name}</h3>
                        <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${char.gender === 'Male' ? 'bg-blue-500' : char.gender === 'Female' ? 'bg-pink-500' : char.gender === 'Objects' ? 'bg-amber-500' : 'bg-purple-500'}`}></div>
                      </div>
                    )}
                    {cardSize !== 'sm' && (cardTitlePlacement === 'bottom' || cardTitlePlacement === 'both' || viewMode === 'list') && (
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{char.species}</p>
                    )}
                    {cardSize !== 'sm' && <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{char.description}</p>}
                    
                    <div className="mt-4 pt-3 border-t flex justify-between items-center text-xs">
                      {cardSize !== 'sm' && (
                        <span className={`px-2 py-1 rounded-md font-medium ${
                          char.status === 'Sorted' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          char.status === 'Unsorted' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {char.status}
                        </span>
                      )}
                      <div className="flex gap-1 ml-auto">
                        <div className="relative">
                          <button 
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-secondary rounded cursor-pointer" 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setActiveExportCharId(prev => prev === char.id ? null : char.id); 
                            }}
                            title="Export Booklet"
                          >
                            <Download className="w-4 h-4 text-primary" />
                          </button>
                          {activeExportCharId === char.id && (
                            <div 
                              className="absolute bottom-full right-0 mb-1 bg-card text-card-foreground border shadow-xl rounded-lg p-1 z-50 flex flex-col min-w-[130px] text-xs animate-in fade-in zoom-in-95"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button 
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  setActiveExportCharId(null);
                                  try {
                                    await exportCharacterBooklet({ character: char, format: 'pdf' });
                                  } catch (err: any) {
                                    alert(`PDF Export failed: ${err.message || err}`);
                                  }
                                }}
                                className="px-2.5 py-1.5 hover:bg-secondary text-left font-bold rounded flex items-center gap-1.5 cursor-pointer"
                              >
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                <span>PDF Booklet</span>
                              </button>
                              <button 
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  setActiveExportCharId(null);
                                  try {
                                    await exportCharacterBooklet({ character: char, format: 'word' });
                                  } catch (err: any) {
                                    alert(`Word Export failed: ${err.message || err}`);
                                  }
                                }}
                                className="px-2.5 py-1.5 hover:bg-secondary text-left font-bold rounded flex items-center gap-1.5 cursor-pointer"
                              >
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                <span>Word Doc</span>
                              </button>
                              <button 
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  setActiveExportCharId(null);
                                  try {
                                    await exportCharacterBooklet({ character: char, format: 'gdocs' });
                                  } catch (err: any) {
                                    alert(`Google Docs Export failed: ${err.message || err}`);
                                  }
                                }}
                                className="px-2.5 py-1.5 hover:bg-secondary text-left font-bold rounded flex items-center gap-1.5 cursor-pointer"
                              >
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                <span>Google Docs</span>
                              </button>
                            </div>
                          )}
                        </div>
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-secondary rounded cursor-pointer" onClick={(e) => { e.stopPropagation(); setCharacters(prev => prev.filter(c => c.id !== char.id)); }}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-secondary rounded cursor-pointer" onClick={(e) => { e.stopPropagation(); safeCopyToClipboard(char.description); }}>
                          <Copy className="w-4 h-4" />
                        </button>
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-secondary rounded cursor-pointer" onClick={(e) => { e.stopPropagation(); setCharacters(prev => [...prev, {...char, id: uuidv4(), name: `${char.name} (Copy)`}]); }}>
                          <Layers className="w-4 h-4" />
                        </button>
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-secondary rounded cursor-pointer">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedCharId && (
        <CharacterEditor 
          charId={selectedCharId} 
          characters={characters}
          setCharacters={setCharacters}
          setItems={setItems}
          onClose={() => setSelectedCharId(null)}
          items={items}
        />
      )}

      {/* Favorite Icon Customizer Modal */}
      {isFavIconModalOpen && (
        <FavoriteIconSelectorModal
          isOpen={isFavIconModalOpen}
          onClose={() => {
            setIsFavIconModalOpen(false);
            setFavoriteModalTargetChar(null);
            setFavoriteModalTargetItem(null);
          }}
          targetCharacter={favoriteModalTargetChar}
          targetItem={favoriteModalTargetItem}
          characters={characters}
          setCharacters={setCharacters}
          items={items}
          setItems={setItems}
        />
      )}
    </div>
  );
}