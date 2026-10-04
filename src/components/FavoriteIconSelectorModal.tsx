import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Palette, 
  Smile, 
  Upload, 
  Check, 
  RotateCcw, 
  Users, 
  Layers, 
  Search,
  Sliders
} from 'lucide-react';
import { Character, ArchiveItem } from '../types';
import { 
  FAVORITE_ICON_OPTIONS, 
  PRESET_FAVORITE_COLORS, 
  RenderFavoriteIcon, 
  FavoriteIconOption 
} from './FavoriteIconRenderer';

interface FavoriteIconSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Currently target entity (either specific character or batch selection)
  targetCharacter?: Character | null;
  targetItem?: ArchiveItem | null;
  characters?: Character[];
  setCharacters?: React.Dispatch<React.SetStateAction<Character[]>>;
  items?: ArchiveItem[];
  setItems?: React.Dispatch<React.SetStateAction<ArchiveItem[]>>;
  onSaveSelection?: (iconId: string, color: string) => void;
}

export function FavoriteIconSelectorModal({
  isOpen,
  onClose,
  targetCharacter,
  targetItem,
  characters = [],
  setCharacters,
  items = [],
  setItems,
  onSaveSelection
}: FavoriteIconSelectorModalProps) {
  if (!isOpen) return null;

  const initialIcon = targetCharacter?.favoriteIcon || targetItem?.favoriteIcon || 'heart';
  const initialColor = targetCharacter?.favoriteColor || targetItem?.favoriteColor || '#ef4444';

  const [selectedIconId, setSelectedIconId] = useState<string>(initialIcon);
  const [selectedColor, setSelectedColor] = useState<string>(initialColor);
  const [customEmojiInput, setCustomEmojiInput] = useState<string>('');
  const [customImageUrl, setCustomImageUrl] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'shapes' | 'emojis' | 'objects' | 'multicom' | 'custom' | 'batch'>('all');
  const [batchScope, setBatchScope] = useState<'single' | 'all' | 'male' | 'female' | 'objects' | 'currentCategory'>('single');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Quick Emoji Ideas suggested by the user: 😴😏😍✌❤👍💕
  const quickUserEmojis = ['😴', '😏', '😍', '✌️', '❤️', '👍', '💕', '🔥', '⭐', '✨', '👑', '💎', '🚚', '🤖', '🦸', '🐱'];

  // Collect available images from characters and archive items to allow using multicom images as favorite icons
  const availableImages: { id: string; name: string; src: string; source: string }[] = [];
  
  characters.forEach(c => {
    const src = c.defaultThumbnailSrc || c.highlightedImageSrc || (c.subImages && c.subImages[0]?.src);
    if (src) {
      availableImages.push({
        id: `img-char-${c.id}`,
        name: c.name,
        src: src,
        source: `${c.name} (${c.gender || 'Character'})`
      });
    }
  });

  items.filter(i => i.type === 'image' && i.content).forEach(i => {
    if (!availableImages.some(img => img.src === i.content)) {
      availableImages.push({
        id: `img-item-${i.id}`,
        name: i.originalName || 'Library Image',
        src: i.content,
        source: 'Library Upload'
      });
    }
  });

  const handleApply = () => {
    let finalIcon = selectedIconId;
    if (selectedTab === 'custom' && customEmojiInput.trim()) {
      finalIcon = customEmojiInput.trim();
    } else if (selectedTab === 'custom' && customImageUrl.trim()) {
      finalIcon = customImageUrl.trim();
    }

    if (onSaveSelection) {
      onSaveSelection(finalIcon, selectedColor);
    }

    // Apply batch updates if user selected a multi-scope
    if (batchScope !== 'single' && setCharacters) {
      setCharacters(prev => prev.map(c => {
        let shouldUpdate = false;
        if (batchScope === 'all') shouldUpdate = true;
        if (batchScope === 'male' && (c.gender === 'Male' || c.gender?.toLowerCase() === 'male')) shouldUpdate = true;
        if (batchScope === 'female' && (c.gender === 'Female' || c.gender?.toLowerCase() === 'female')) shouldUpdate = true;
        if (batchScope === 'objects' && (c.gender === 'Objects' || c.gender?.toLowerCase() === 'objects')) shouldUpdate = true;
        if (batchScope === 'currentCategory' && targetCharacter && c.categories?.some(cat => targetCharacter.categories?.includes(cat))) shouldUpdate = true;

        if (shouldUpdate) {
          return {
            ...c,
            favoriteIcon: finalIcon,
            favoriteColor: selectedColor,
            isFavorite: true // automatically mark as favorited when applying custom icon
          };
        }
        return c;
      }));
    } else if (targetCharacter && setCharacters) {
      setCharacters(prev => prev.map(c => c.id === targetCharacter.id ? {
        ...c,
        favoriteIcon: finalIcon,
        favoriteColor: selectedColor,
        isFavorite: true
      } : c));
    } else if (targetItem && setItems) {
      setItems(prev => prev.map(i => i.id === targetItem.id ? {
        ...i,
        favoriteIcon: finalIcon,
        favoriteColor: selectedColor,
        isFavorite: true
      } : i));
    }

    setFeedbackMsg('Favorite icon updated successfully!');
    setTimeout(() => {
      setFeedbackMsg(null);
      onClose();
    }, 600);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setSelectedIconId(result);
          setCustomImageUrl(result);
          setSelectedTab('custom');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredIcons = FAVORITE_ICON_OPTIONS.filter(opt => {
    if (selectedTab === 'shapes' && opt.category !== 'shapes') return false;
    if (selectedTab === 'emojis' && opt.category !== 'emojis') return false;
    if (selectedTab === 'objects' && opt.category !== 'objects') return false;
    if (searchQuery) {
      return opt.name.toLowerCase().includes(searchQuery.toLowerCase()) || opt.id.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-card border border-border text-foreground rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-secondary/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500 shadow-xs">
              <RenderFavoriteIcon 
                iconId={selectedIconId} 
                customColor={selectedColor} 
                isFavorite={true} 
                size="lg" 
              />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-foreground flex items-center gap-2">
                <span>Customize Favorite Icon & Multi-Icon Style</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold">
                  Pro Customizer
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                {targetCharacter 
                  ? `Customizing for "${targetCharacter.name}" (or batch apply to all / gender groups)` 
                  : 'Choose custom favorite icons, emojis, color tints, or multicom character images'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-sm">

          {/* Live Preview Box */}
          <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-background border border-border shadow-inner flex items-center justify-center min-w-[44px] min-h-[44px]">
                <RenderFavoriteIcon 
                  iconId={selectedIconId} 
                  customColor={selectedColor} 
                  isFavorite={true} 
                  size="xl" 
                />
              </div>
              <div>
                <span className="text-xs font-bold text-foreground block">Active Favorite Icon Preview</span>
                <span className="text-[11px] text-muted-foreground">
                  Icon ID: <span className="font-mono text-primary font-bold">{selectedIconId}</span> &bull; Color: <span className="font-mono">{selectedColor}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedIconId('heart');
                  setSelectedColor('#ef4444');
                }}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-border bg-background hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1"
                title="Reset to default red heart"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to Default Heart</span>
              </button>
            </div>
          </div>

          {/* Quick Idea Emojis Banner (Requested by user: 😴😏😍✌❤👍💕) */}
          <div>
            <span className="text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Quick Emoji Favorites (😴😏😍✌️❤️👍💕 and more):</span>
            </span>
            <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-background border border-border/70">
              {quickUserEmojis.map((emoji, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedIconId(emoji)}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all cursor-pointer select-none ${
                    selectedIconId === emoji 
                      ? 'bg-primary/20 border-2 border-primary scale-110 shadow-sm' 
                      : 'hover:bg-secondary/70 border border-transparent'
                  }`}
                  title={`Select ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Color Palette Tint Selector */}
          <div>
            <span className="text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-primary" />
              <span>Icon Color Tint (for vector icons & hearts):</span>
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_FAVORITE_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer shadow-xs flex items-center justify-center ${
                    selectedColor.toLowerCase() === color.toLowerCase() 
                      ? 'ring-2 ring-primary scale-115 border-white' 
                      : 'border-background hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  title={`Color: ${color}`}
                >
                  {selectedColor.toLowerCase() === color.toLowerCase() && (
                    <Check className="w-3.5 h-3.5 text-black drop-shadow-sm font-bold" />
                  )}
                </button>
              ))}

              {/* Custom Hex Color Picker */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-border">
                <input 
                  type="color" 
                  value={selectedColor} 
                  onChange={e => setSelectedColor(e.target.value)}
                  className="w-7 h-7 rounded-lg border border-border cursor-pointer bg-transparent"
                  title="Choose custom color hex"
                />
                <span className="text-xs font-mono text-muted-foreground">{selectedColor}</span>
              </div>
            </div>
          </div>

          {/* Tabs Filter */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2 pt-1">
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setSelectedTab('all')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  selectedTab === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary/60 hover:bg-secondary text-muted-foreground'
                }`}
              >
                All Icons
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab('shapes')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  selectedTab === 'shapes' ? 'bg-primary text-primary-foreground' : 'bg-secondary/60 hover:bg-secondary text-muted-foreground'
                }`}
              >
                Hearts & Vectors
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab('emojis')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  selectedTab === 'emojis' ? 'bg-primary text-primary-foreground' : 'bg-secondary/60 hover:bg-secondary text-muted-foreground'
                }`}
              >
                Emojis
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab('multicom')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  selectedTab === 'multicom' ? 'bg-primary text-primary-foreground' : 'bg-secondary/60 hover:bg-secondary text-muted-foreground'
                }`}
              >
                <span>Multicom Images</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-background/50">{availableImages.length}</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab('custom')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  selectedTab === 'custom' ? 'bg-primary text-primary-foreground' : 'bg-secondary/60 hover:bg-secondary text-muted-foreground'
                }`}
              >
                Custom Input / Upload
              </button>
            </div>

            {selectedTab !== 'custom' && selectedTab !== 'multicom' && (
              <div className="relative max-w-[180px]">
                <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search icons..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-7 pr-2 py-1 text-xs bg-background border border-border rounded-lg outline-none focus:border-primary"
                />
              </div>
            )}
          </div>

          {/* Tab Content: Standard Icons Grid */}
          {(selectedTab === 'all' || selectedTab === 'shapes' || selectedTab === 'emojis') && (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-2 max-h-52 overflow-y-auto p-1">
              {filteredIcons.map(opt => {
                const isSelected = selectedIconId === opt.id || (opt.emoji && selectedIconId === opt.emoji);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSelectedIconId(opt.emoji || opt.id);
                      if (opt.defaultColor && selectedColor === '#ef4444') {
                        setSelectedColor(opt.defaultColor);
                      }
                    }}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary/10 ring-2 ring-primary shadow-sm scale-105'
                        : 'border-border bg-background hover:bg-secondary/50 hover:border-border/80'
                    }`}
                    title={opt.name}
                  >
                    <RenderFavoriteIcon 
                      iconId={opt.id} 
                      customColor={opt.defaultColor || selectedColor} 
                      isFavorite={true} 
                      size="md" 
                    />
                    <span className="text-[10px] font-medium text-muted-foreground truncate w-full text-center">
                      {opt.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Tab Content: Multicom Character & Library Images */}
          {selectedTab === 'multicom' && (
            <div>
              <div className="text-xs text-muted-foreground mb-2">
                Choose any character thumbnail or artwork uploaded in the application to use as your favorite avatar badge:
              </div>
              {availableImages.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground bg-background rounded-xl border border-dashed border-border">
                  No images uploaded yet. Upload characters or media to use their portraits as favorite icons!
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 max-h-56 overflow-y-auto p-1">
                  {availableImages.map(img => {
                    const isSelected = selectedIconId === img.src;
                    return (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => setSelectedIconId(img.src)}
                        className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-primary bg-primary/10 ring-2 ring-primary shadow-sm scale-105'
                            : 'border-border bg-background hover:bg-secondary/50'
                        }`}
                        title={img.name}
                      >
                        <img 
                          src={img.src} 
                          alt={img.name} 
                          className="w-10 h-10 rounded-full object-cover border border-border shadow-xs" 
                        />
                        <span className="text-[10px] font-bold text-foreground truncate w-full text-center">
                          {img.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab Content: Custom Input or Local File Upload */}
          {selectedTab === 'custom' && (
            <div className="space-y-3 p-3 bg-background rounded-xl border border-border">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Enter Any Custom Emoji or Character:
                </label>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    placeholder="Type or paste any emoji (e.g. 😴, 🚚, ✌️, 🏎️)..." 
                    value={customEmojiInput}
                    onChange={e => {
                      setCustomEmojiInput(e.target.value);
                      if (e.target.value.trim()) setSelectedIconId(e.target.value.trim());
                    }}
                    className="flex-1 px-3 py-1.5 text-sm bg-card border border-border rounded-lg outline-none focus:border-primary"
                  />
                  {customEmojiInput && (
                    <div className="text-2xl p-1 bg-secondary rounded-lg">
                      {customEmojiInput}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-border/60">
                <label className="text-xs font-bold text-foreground block mb-1">
                  Upload Custom Mini Icon / Badge from Computer:
                </label>
                <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-border hover:border-primary rounded-xl cursor-pointer bg-card hover:bg-secondary/30 transition-colors">
                  <Upload className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-foreground">Choose custom icon / image file</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileUpload} 
                    className="hidden" 
                  />
                </label>
              </div>

              <div className="pt-2 border-t border-border/60">
                <label className="text-xs font-bold text-foreground block mb-1">
                  Or Paste External Image URL:
                </label>
                <input 
                  type="text" 
                  placeholder="https://example.com/icon.png" 
                  value={customImageUrl}
                  onChange={e => {
                    setCustomImageUrl(e.target.value);
                    if (e.target.value.trim()) setSelectedIconId(e.target.value.trim());
                  }}
                  className="w-full px-3 py-1.5 text-xs bg-card border border-border rounded-lg outline-none focus:border-primary font-mono"
                />
              </div>
            </div>
          )}

          {/* Batch Assignment Scope (As requested: e.g. "Perhaps you want all of the male characters to have hearts, or different color hearts, or a different multicom image") */}
          <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <Users className="w-4 h-4 text-primary" />
              <span>Apply Icon Scope:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <label className={`p-2 rounded-lg border cursor-pointer flex items-center gap-2 transition-colors ${
                batchScope === 'single' ? 'bg-primary/15 border-primary font-bold text-primary' : 'bg-background border-border text-foreground hover:bg-secondary/50'
              }`}>
                <input 
                  type="radio" 
                  name="batchScope" 
                  checked={batchScope === 'single'} 
                  onChange={() => setBatchScope('single')}
                  className="hidden"
                />
                <span>This Character Only</span>
              </label>

              <label className={`p-2 rounded-lg border cursor-pointer flex items-center gap-2 transition-colors ${
                batchScope === 'male' ? 'bg-primary/15 border-primary font-bold text-primary' : 'bg-background border-border text-foreground hover:bg-secondary/50'
              }`}>
                <input 
                  type="radio" 
                  name="batchScope" 
                  checked={batchScope === 'male'} 
                  onChange={() => setBatchScope('male')}
                  className="hidden"
                />
                <span>All Male Characters</span>
              </label>

              <label className={`p-2 rounded-lg border cursor-pointer flex items-center gap-2 transition-colors ${
                batchScope === 'female' ? 'bg-primary/15 border-primary font-bold text-primary' : 'bg-background border-border text-foreground hover:bg-secondary/50'
              }`}>
                <input 
                  type="radio" 
                  name="batchScope" 
                  checked={batchScope === 'female'} 
                  onChange={() => setBatchScope('female')}
                  className="hidden"
                />
                <span>All Female Characters</span>
              </label>

              <label className={`p-2 rounded-lg border cursor-pointer flex items-center gap-2 transition-colors ${
                batchScope === 'objects' ? 'bg-primary/15 border-primary font-bold text-primary' : 'bg-background border-border text-foreground hover:bg-secondary/50'
              }`}>
                <input 
                  type="radio" 
                  name="batchScope" 
                  checked={batchScope === 'objects'} 
                  onChange={() => setBatchScope('objects')}
                  className="hidden"
                />
                <span>All Objects / Vehicles</span>
              </label>

              <label className={`p-2 rounded-lg border cursor-pointer flex items-center gap-2 transition-colors ${
                batchScope === 'all' ? 'bg-primary/15 border-primary font-bold text-primary' : 'bg-background border-border text-foreground hover:bg-secondary/50'
              }`}>
                <input 
                  type="radio" 
                  name="batchScope" 
                  checked={batchScope === 'all'} 
                  onChange={() => setBatchScope('all')}
                  className="hidden"
                />
                <span>All Characters (Global)</span>
              </label>

              {targetCharacter?.categories && targetCharacter.categories.length > 0 && (
                <label className={`p-2 rounded-lg border cursor-pointer flex items-center gap-2 transition-colors ${
                  batchScope === 'currentCategory' ? 'bg-primary/15 border-primary font-bold text-primary' : 'bg-background border-border text-foreground hover:bg-secondary/50'
                }`}>
                  <input 
                    type="radio" 
                    name="batchScope" 
                    checked={batchScope === 'currentCategory'} 
                    onChange={() => setBatchScope('currentCategory')}
                    className="hidden"
                  />
                  <span>Matching Categories</span>
                </label>
              )}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between bg-secondary/10">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            {feedbackMsg ? (
              <span className="text-emerald-500 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                {feedbackMsg}
              </span>
            ) : (
              <span>Default is classic heart if uncustomized</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-border bg-background hover:bg-secondary text-foreground cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 text-xs font-black rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Apply Favorite Icon</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
