import React, { useState } from 'react';
import { Character, ArchiveItem } from '../types';
import { Heart, Palette, Code, Copy, Check, Download, Trash2, ArrowLeft, LayoutGrid, List, Sparkles } from 'lucide-react';
import { CharacterEditor } from './CharacterEditor';
import { ItemProfile } from './ItemProfile';
import { safeCopyToClipboard } from '../lib/utils';
import { RenderFavoriteIcon } from './FavoriteIconRenderer';
import { FavoriteIconSelectorModal } from './FavoriteIconSelectorModal';

interface FavoritesViewProps {
  characters: Character[];
  setCharacters: React.Dispatch<React.SetStateAction<Character[]>>;
  items: ArchiveItem[];
  setItems: React.Dispatch<React.SetStateAction<ArchiveItem[]>>;
}

type CodeFormat = 'tailwind' | 'css' | 'json';

export function FavoritesView({ characters, setCharacters, items, setItems }: FavoritesViewProps) {
  const favoriteChars = characters.filter(c => c.isFavorite);
  const favoriteItems = items.filter(i => i.isFavorite);
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ArchiveItem | null>(null);
  const [copiedFormatId, setCopiedFormatId] = useState<string | null>(null); // formatKey-charId
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [cardSize, setCardSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [cardTitlePlacement] = useState<'top' | 'bottom' | 'both'>(() => {
    return (localStorage.getItem("card_title_placement") as 'top' | 'bottom' | 'both') || 'top';
  });
  const [favoriteModalTargetChar, setFavoriteModalTargetChar] = useState<Character | null>(null);
  const [favoriteModalTargetItem, setFavoriteModalTargetItem] = useState<ArchiveItem | null>(null);
  const [isFavIconModalOpen, setIsFavIconModalOpen] = useState(false);

  const handleCopyCode = (char: Character, format: CodeFormat) => {
    const palette = char.colorPalette || [];
    let codeStr = '';

    if (format === 'tailwind') {
      const colorsObj = palette.reduce((acc, hex, idx) => {
        acc[`color_${idx + 1}`] = hex;
        return acc;
      }, {} as Record<string, string>);
      
      codeStr = `// Tailwind CSS Config Extension\ncolors: {\n  '${char.name.toLowerCase().replace(/\s+/g, '-') || 'character'}': ${JSON.stringify(colorsObj, null, 4)}\n}`;
    } else if (format === 'css') {
      const prefix = `--${char.name.toLowerCase().replace(/\s+/g, '-') || 'character'}`;
      codeStr = `/* CSS Custom Properties */\n:root {\n${palette.map((hex, idx) => `  ${prefix}-color-${idx + 1}: ${hex};`).join('\n')}\n}`;
    } else {
      codeStr = JSON.stringify(palette, null, 2);
    }

    safeCopyToClipboard(codeStr);
    const key = `${format}-${char.id}`;
    setCopiedFormatId(key);
    setTimeout(() => setCopiedFormatId(null), 2000);
  };

  const handleExportFavorites = () => {
    if (favoriteChars.length === 0) return;

    let markdown = `# Favorite Characters Palette Code Export\n`;
    markdown += `Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n\n`;

    favoriteChars.forEach((char, idx) => {
      const palette = char.colorPalette || [];
      const originalPalette = char.originalColorPalette || [];
      
      markdown += `## ${idx + 1}. ${char.name}\n`;
      markdown += `- **Gender/Category**: ${char.gender}\n`;
      markdown += `- **Species/Material**: ${char.species || 'Unknown'}\n`;
      markdown += `- **Entity Type**: ${char.entityType || 'Character'}\n`;
      if (char.description) {
        markdown += `- **Description**: ${char.description}\n`;
      }
      markdown += `\n### Color Palette\n`;
      markdown += `| Code | Preview | Status |\n`;
      markdown += `| --- | --- | --- |\n`;
      palette.forEach(hex => {
        const isOriginal = originalPalette.includes(hex);
        markdown += `| \`${hex}\` | ![#${hex.replace('#', '')}](https://via.placeholder.com/15/${hex.replace('#', '')}/000000?text=+) | ${isOriginal ? 'Original' : 'Custom'} |\n`;
      });

      // Include CSS Variables code
      const cssPrefix = `--${char.name.toLowerCase().replace(/\s+/g, '-') || 'character'}`;
      markdown += `\n#### CSS Custom Variables\n\`\`\`css\n`;
      palette.forEach((hex, i) => {
        markdown += `${cssPrefix}-color-${i + 1}: ${hex};\n`;
      });
      markdown += `\`\`\`\n`;

      // Include Tailwind Config colors
      markdown += `\n#### Tailwind Configuration Snippet\n\`\`\`javascript\n`;
      markdown += `colors: {\n  '${char.name.toLowerCase().replace(/\s+/g, '-') || 'character'}': {\n`;
      palette.forEach((hex, i) => {
        markdown += `    color_${i + 1}: '${hex}',\n`;
      });
      markdown += `  }\n}\n\`\`\`\n`;

      markdown += `\n---\n\n`;
    });

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `favorite-characters-palette.md`;
    link.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-500 fill-red-500 animate-pulse" />
            Favorite Character Sheets
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse your favorited models, copy color codes, and export production-ready palettes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode controls */}
          <div className="flex bg-secondary rounded-md p-1 gap-1">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-sm ${viewMode === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-sm ${viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Card Size controls */}
          <div className="flex bg-secondary rounded-md p-1 gap-1 items-center">
            <span className="text-xs text-muted-foreground px-1.5 font-medium">Size:</span>
            <button onClick={() => setCardSize('sm')} className={`px-2 py-0.5 text-xs rounded-sm ${cardSize === 'sm' ? 'bg-background shadow-sm text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>S</button>
            <button onClick={() => setCardSize('md')} className={`px-2 py-0.5 text-xs rounded-sm ${cardSize === 'md' ? 'bg-background shadow-sm text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>M</button>
            <button onClick={() => setCardSize('lg')} className={`px-2 py-0.5 text-xs rounded-sm ${cardSize === 'lg' ? 'bg-background shadow-sm text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>L</button>
          </div>

          <button
            onClick={() => {
              setFavoriteModalTargetChar(null);
              setFavoriteModalTargetItem(null);
              setIsFavIconModalOpen(true);
            }}
            className="flex items-center gap-1.5 bg-secondary hover:bg-secondary/80 border text-foreground px-3 py-1.5 rounded-lg transition-all text-xs font-semibold shadow-xs cursor-pointer"
            title="Customize default favorite icon style for all or specific gender groups"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>Customize Favorite Icons</span>
          </button>

          {favoriteChars.length > 0 && (
            <button
              onClick={handleExportFavorites}
              className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg transition-all text-sm font-semibold shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export All (Palette Code)
            </button>
          )}
        </div>
      </div>

      {favoriteChars.length === 0 && favoriteItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-card border rounded-2xl text-center max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-4 animate-bounce">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold">No Favorites Yet</h3>
          <p className="text-sm text-muted-foreground max-w-md mt-2">
            Go to the Dashboard, click on any category detail, and select a character profile or comic. Click "Edit", and tap the Heart icon to save it here.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {favoriteChars.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-4">Characters</h3>
              <div className={
                viewMode === 'list' 
                  ? "space-y-3" 
                  : cardSize === 'sm'
                    ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
                    : cardSize === 'lg'
                      ? "grid grid-cols-1 md:grid-cols-2 gap-8"
                      : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              }>
                {favoriteChars.map(char => {
                  const fileItem = items.find(item => item.id === char.sourceId);
                  return (
                    <div 
                      key={char.id} 
                      className={`bg-card border rounded-xl overflow-hidden hover:shadow-md transition-all flex group ${
                        viewMode === 'list' ? 'flex-row items-center gap-4 p-3' : 'flex-col'
                      }`}
                    >
                      {/* Top Title Header above thumbnail */}
                      {(cardTitlePlacement === 'top' || cardTitlePlacement === 'both') && viewMode === 'grid' && (
                        <div 
                          className="px-3.5 py-2 bg-secondary/50 border-b flex items-center justify-between gap-2 shrink-0 w-full hover:bg-secondary/80 transition-colors cursor-pointer"
                          onClick={() => setSelectedCharId(char.id)}
                        >
                          <h4 className="font-extrabold text-sm truncate text-foreground group-hover:text-primary transition-colors">{char.name}</h4>
                          <span className="text-[10px] text-muted-foreground font-bold uppercase shrink-0">{char.gender}</span>
                        </div>
                      )}

                      {/* Header Preview image */}
                      {fileItem && fileItem.type === 'image' && (
                        <div className={`relative bg-secondary/20 overflow-hidden border-b shrink-0 ${
                          viewMode === 'list' 
                            ? 'w-16 h-16 rounded-lg border' 
                            : cardSize === 'sm' 
                              ? 'h-24 w-full' 
                              : cardSize === 'lg' 
                                ? 'h-56 w-full' 
                                : 'h-40 w-full'
                        }`}>
                          <img 
                            src={fileItem.content} 
                            alt={char.name} 
                            className="w-full h-full object-contain hover:scale-105 transition-transform duration-300 cursor-zoom-in" 
                            onClick={(e) => {
                              e.stopPropagation();
                              window.dispatchEvent(new CustomEvent('expand-image', { detail: { src: fileItem.content } }));
                            }}
                            title="Click to expand"
                          />
                          <div className="absolute top-2 right-2">
                            <button
                              onClick={() => {
                                setCharacters(prev => prev.map(c => c.id === char.id ? { ...c, isFavorite: false } : c));
                              }}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setFavoriteModalTargetChar(char);
                                setFavoriteModalTargetItem(null);
                                setIsFavIconModalOpen(true);
                              }}
                              className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 hover:scale-110 transition-transform cursor-pointer flex items-center justify-center shadow-md"
                              title="Remove from favorites (Right-click to change icon)"
                            >
                              <RenderFavoriteIcon 
                                iconId={char.favoriteIcon} 
                                customColor={char.favoriteColor} 
                                isFavorite={true} 
                                size="xs" 
                              />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Body Details */}
                      <div className={`p-4 flex-1 flex ${viewMode === 'list' ? 'flex-row items-center justify-between gap-4' : 'flex-col justify-between'}`}>
                        <div className={viewMode === 'list' ? 'flex-1 min-w-0' : ''}>
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              {(cardTitlePlacement === 'bottom' || cardTitlePlacement === 'both' || viewMode === 'list') && (
                                <h4 className={`font-bold group-hover:text-primary transition-colors ${
                                  cardSize === 'sm' ? 'text-sm' : cardSize === 'lg' ? 'text-lg' : 'text-base'
                                }`}>{char.name}</h4>
                              )}
                              <span className="text-xs text-muted-foreground">{char.gender} &bull; {char.species || 'Unknown'}</span>
                            </div>
                            <button
                              onClick={() => setSelectedCharId(char.id)}
                              className="text-xs bg-secondary hover:bg-secondary/80 px-2 py-1 rounded border font-medium transition-colors cursor-pointer shrink-0"
                            >
                              Edit
                            </button>
                          </div>

                          {char.description && cardSize !== 'sm' && (
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2 italic">
                              "{char.description}"
                            </p>
                          )}

                          {/* Palette Render */}
                          {cardSize !== 'sm' && (
                            <div className="mt-4 space-y-1">
                              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                <Palette className="w-3 h-3" /> Color Palette:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {(char.colorPalette || []).map(hex => (
                                  <div 
                                    key={hex} 
                                    className="w-6 h-6 rounded-full border shadow-sm cursor-pointer hover:scale-110 transition-transform flex items-center justify-center text-[9px]" 
                                    style={{ backgroundColor: hex }} 
                                    title={`Click to copy: ${hex}`}
                                    onClick={() => {
                                      safeCopyToClipboard(hex);
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Copy Code Buttons */}
                        {cardSize !== 'sm' && (
                          <div className={`mt-4 pt-4 border-t space-y-2 shrink-0 ${viewMode === 'list' ? 'border-t-0 pt-0 mt-0 w-48' : ''}`}>
                            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                              <Code className="w-3 h-3" /> Copy Palette Code:
                            </span>
                            <div className="grid grid-cols-3 gap-1.5">
                              {(['css', 'tailwind', 'json'] as CodeFormat[]).map(format => {
                                const isCopied = copiedFormatId === `${format}-${char.id}`;
                                return (
                                  <button
                                    key={format}
                                    onClick={() => handleCopyCode(char, format)}
                                    className="flex items-center justify-center gap-1 bg-secondary hover:bg-secondary/80 text-[10px] font-semibold py-1 px-1.5 rounded transition-all cursor-pointer"
                                    title={`Copy ${format.toUpperCase()} palette code`}
                                  >
                                    {isCopied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                                    <span className="uppercase">{format}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {favoriteItems.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-4">Comics / Items</h3>
              <div className={
                viewMode === 'list' 
                  ? "space-y-2" 
                  : cardSize === 'sm'
                    ? "grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2"
                    : cardSize === 'lg'
                      ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
                      : "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4"
              }>
                {favoriteItems.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => setSelectedItem(item)}
                    className={`bg-card border rounded-lg overflow-hidden group cursor-pointer hover:border-primary transition-colors flex ${
                      viewMode === 'list' ? 'flex-row items-center gap-4 p-2' : 'flex-col'
                    }`}
                  >
                    <div className={`relative ${
                      viewMode === 'list' 
                        ? 'w-16 h-16 shrink-0' 
                        : cardSize === 'sm' 
                          ? 'h-24 w-full' 
                          : cardSize === 'lg' 
                            ? 'h-56 w-full' 
                            : 'aspect-square w-full'
                    }`}>
                      <button 
                        className="absolute top-2 left-2 z-10 p-1 bg-background/60 backdrop-blur rounded-full hover:bg-background flex items-center justify-center cursor-pointer shadow-xs"
                        onClick={(e) => {
                            e.stopPropagation();
                            setItems && setItems(prev => prev.map(i => i.id === item.id ? {...i, isFavorite: !i.isFavorite} : i));
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
                          isFavorite={true} 
                          size="xs" 
                        />
                      </button>
                      {item.type === 'image' ? (
                        <img 
                          src={item.content} 
                          alt={item.originalName} 
                          className="w-full h-full object-cover cursor-zoom-in hover:opacity-90 transition-opacity" 
                          onClick={(e) => {
                            e.stopPropagation();
                            window.dispatchEvent(new CustomEvent('expand-image', { detail: { src: item.content } }));
                          }}
                          title="Click to expand"
                        />
                      ) : (
                        <div className="w-full h-full bg-secondary flex items-center justify-center">
                          <span className="text-sm text-muted-foreground">TXT</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate" title={item.originalName}>{item.originalName}</h4>
                      {viewMode === 'list' && item.artStyle && (
                        <p className="text-xs text-muted-foreground">Style: {item.artStyle}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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

      {selectedItem && (
        <ItemProfile 
          item={selectedItem}
          items={items}
          onSelectItem={setSelectedItem}
          characters={characters.filter(c => c.sourceId === selectedItem.id)}
          onBack={() => setSelectedItem(null)}
          onUpdateItem={() => {}} 
          setCharacters={setCharacters}
          setItems={setItems}
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
