const fs = require('fs');

const code = `import React, { useState, useEffect, useRef } from 'react';
import { Character, ArchiveItem, Gender, Status, SubImage } from '../types';
import { X, Check, Trash2, Link, Heart, Palette, Pipette, Plus, Minus, Copy, Maximize2, Crop, Edit2, Layers, Layout, Sliders, Image as ImageIcon, ChevronLeft, ChevronRight, Eye, EyeOff, FileText, Upload } from 'lucide-react';

interface Props {
  charId?: string;
  characters: Character[];
  setCharacters?: React.Dispatch<React.SetStateAction<Character[]>>;
  onClose?: () => void;
  items?: ArchiveItem[];
  setItems?: React.Dispatch<React.SetStateAction<ArchiveItem[]>>;
  item?: ArchiveItem;
  onSave?: (updatedChars: any) => void;
}

export function CharacterEditor({ charId, characters, setCharacters, onClose, items, setItems, item, onSave }: Props) {
  const character = charId 
    ? characters.find(c => c.id === charId)
    : item 
      ? characters.find(c => c.sourceId === item.id) || characters[0]
      : characters[0];
      
  const sourceItem = items 
    ? items.find(i => i.id === character?.sourceId)
    : item;

  const [formData, setFormData] = useState<Partial<Character>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
  const [parentCharsCount, setParentCharsCount] = useState<number>(0);
  const [colorInput, setColorInput] = useState('#4f46e5');
  const [isEyeDropperSupported, setIsEyeDropperSupported] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'profile' | 'details' | 'technical'>('profile');
  const [detailActiveTab, setDetailActiveTab] = useState<string>('images');

  // Sub-images management states
  const [editingSubImageId, setEditingSubImageId] = useState<string | null>(null);
  const [subImageTitle, setSubImageTitle] = useState("");
  const [subImageDesc, setSubImageDesc] = useState("");

  // Gallery states
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const [galleryShowOverlay, setGalleryShowOverlay] = useState<boolean>(true);
  const [isGalleryIdle, setIsGalleryIdle] = useState<boolean>(false);
  const galleryIdleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<number | null>(null);

  useEffect(() => {
    if (character) {
      setFormData(character);
      if (items && character.sourceId) {
        const count = characters.filter(c => c.sourceId === character.sourceId).length;
        setParentCharsCount(count);
      }
    }
  }, [character, characters, items]);

  useEffect(() => {
    if ('EyeDropper' in window) {
      setIsEyeDropperSupported(true);
    }
  }, []);

  const handleSave = () => {
    if (setCharacters) {
      setCharacters(prev => prev.map(c => c.id === character?.id ? { ...c, ...formData } as Character : c));
    }
    if (onSave) {
      onSave(formData);
    }
    if (onClose) onClose();
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    if (setCharacters) {
      setCharacters(prev => prev.filter(c => c.id !== character?.id));
    }
    if (onClose) onClose();
  };

  const handleClose = () => {
    const isDirty = JSON.stringify(character) !== JSON.stringify({ ...character, ...formData });
    if (isDirty) {
      setShowUnsavedConfirm(true);
    } else {
      if (onClose) onClose();
    }
  };

  const handleEyeDropper = async () => {
    if (!isEyeDropperSupported) return;
    try {
      // @ts-ignore
      const eyeDropper = new EyeDropper();
      const result = await eyeDropper.open();
      const newColor = result.sRGBHex;
      if (!formData.colorPalette?.includes(newColor)) {
         setFormData({...formData, colorPalette: [...(formData.colorPalette || []), newColor]});
      }
    } catch (e) {
      console.log('Eye dropper cancelled');
    }
  };

  const addColor = () => {
    if (!formData.colorPalette?.includes(colorInput)) {
      setFormData({...formData, colorPalette: [...(formData.colorPalette || []), colorInput]});
    }
  };

  const removeColor = (color: string) => {
    setFormData({...formData, colorPalette: formData.colorPalette?.filter(c => c !== color)});
  };

  const handleSubImageDelete = (id: string) => {
    setFormData({
      ...formData,
      subImages: formData.subImages?.filter(s => s.id !== id)
    });
  };
  
  const handleSetMainImage = (src: string) => {
    setFormData({
      ...formData,
      highlightedImageSrc: src
    });
  };

  // Gallery interactions
  const handleTouchStartGallery = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };
  const handleTouchEndGallery = (e: React.TouchEvent) => {
    if (touchStartRef.current === null || galleryIndex === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartRef.current - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        setGalleryIndex((galleryIndex + 1) % galleryImages.length);
      } else {
        setGalleryIndex((galleryIndex - 1 + galleryImages.length) % galleryImages.length);
      }
    }
    touchStartRef.current = null;
  };

  useEffect(() => {
    const handleMouseMove = () => {
      setIsGalleryIdle(false);
      if (galleryIdleTimerRef.current) clearTimeout(galleryIdleTimerRef.current);
      galleryIdleTimerRef.current = setTimeout(() => setIsGalleryIdle(true), 3000);
    };
    if (galleryIndex !== null) {
      window.addEventListener('mousemove', handleMouseMove);
      galleryIdleTimerRef.current = setTimeout(() => setIsGalleryIdle(true), 3000);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (galleryIdleTimerRef.current) clearTimeout(galleryIdleTimerRef.current);
    };
  }, [galleryIndex]);
  
  const handleBibleTextDrop = (e: React.DragEvent) => {
     e.preventDefault();
     const file = e.dataTransfer.files[0];
     if (file && file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (event) => {
           const text = event.target?.result as string;
           updateActiveBiblePageContent(text);
        };
        reader.readAsText(file);
     } else if (e.dataTransfer.getData('text')) {
         updateActiveBiblePageContent(e.dataTransfer.getData('text'));
     }
  };
  
  const handleBibleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
           const text = event.target?.result as string;
           updateActiveBiblePageContent(text);
        };
        reader.readAsText(file);
     }
  };
  
  const updateActiveBiblePageContent = (text: string) => {
     if (detailActiveTab.startsWith('page-')) {
         const pages = formData.biblePages ? [...formData.biblePages] : [];
         const index = pages.findIndex(p => p.id === detailActiveTab);
         if (index !== -1) {
             pages[index].content = text;
             setFormData({...formData, biblePages: pages});
         }
     }
  };
  
  const addBiblePage = () => {
     const newId = \`page-\${Date.now()}\`;
     const pages = formData.biblePages ? [...formData.biblePages] : [];
     pages.push({ id: newId, title: \`Page \${pages.length + 1}\`, content: '' });
     setFormData({...formData, biblePages: pages});
     setDetailActiveTab(newId);
  };
  
  const deleteBiblePage = (id: string, e: React.MouseEvent) => {
     e.stopPropagation();
     const pages = formData.biblePages ? formData.biblePages.filter(p => p.id !== id) : [];
     setFormData({...formData, biblePages: pages});
     if (detailActiveTab === id) {
         setDetailActiveTab('images');
     }
  };

  const galleryImages: { id: string, src: string, title: string, description: string }[] = [];
  if (sourceItem && sourceItem.type === 'image') {
    galleryImages.push({
      id: 'main',
      src: sourceItem.content,
      title: formData.name || 'Original Image',
      description: 'Original full view.'
    });
  }
  if (formData.subImages && formData.subImages.length > 0) {
    formData.subImages.forEach((sub, i) => {
      galleryImages.push({
        id: sub.id,
        src: sub.src,
        title: sub.title || \`Emblem #\${i + 1}\`,
        description: sub.description || ''
      });
    });
  }

  if (!character) return null;

  const mainImageSrc = formData.highlightedImageSrc || (sourceItem?.type === 'image' ? sourceItem.content : undefined);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-background flex flex-col rounded-xl w-full max-w-5xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b bg-card">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-primary" />
              Editing Character: {formData.name || 'Unnamed'}
            </h2>
          </div>
          <button onClick={handleClose} className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-0 flex flex-col">
          <div className="flex border-b px-6 pt-4 bg-card/50">
            <button 
              className={\`px-4 py-2 text-sm font-bold border-b-2 \${activeTab === 'profile' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}\`}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </button>
            <button 
              className={\`px-4 py-2 text-sm font-bold border-b-2 \${activeTab === 'details' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}\`}
              onClick={() => setActiveTab('details')}
            >
              Details
            </button>
            <button 
              className={\`px-4 py-2 text-sm font-bold border-b-2 \${activeTab === 'technical' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}\`}
              onClick={() => setActiveTab('technical')}
            >
              Technical
            </button>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'profile' && (
              <div className="flex flex-col md:flex-row gap-6 h-full">
                {/* Left Panel: Images */}
                <div className="w-full md:w-5/12 space-y-4">
                  <div className="bg-secondary/10 border rounded-xl p-2 relative group overflow-hidden flex flex-col items-center justify-center min-h-[300px]">
                    {mainImageSrc ? (
                      <img src={mainImageSrc} alt="Main" className="w-full h-auto max-h-[400px] object-contain rounded-lg" />
                    ) : (
                      <div className="text-muted-foreground text-sm flex flex-col items-center">
                         <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                         No image available
                      </div>
                    )}
                  </div>
                  
                  {/* Select other images as main */}
                  {galleryImages.length > 0 && (
                    <div className="space-y-2">
                       <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Main Thumbnail</h3>
                       <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                          {galleryImages.map(img => (
                             <div 
                               key={img.id}
                               onClick={() => handleSetMainImage(img.src)}
                               className={\`w-16 h-16 rounded-md border-2 shrink-0 cursor-pointer overflow-hidden \${mainImageSrc === img.src ? 'border-primary' : 'border-transparent'}\`}
                             >
                                <img src={img.src} alt={img.title} className="w-full h-full object-cover" />
                             </div>
                          ))}
                       </div>
                    </div>
                  )}
                </div>
                
                {/* Right Panel: Basic Details */}
                <div className="w-full md:w-7/12 space-y-6">
                  <div className="space-y-4 p-4 bg-card border rounded-xl shadow-sm">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1">Basic Information</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-bold block mb-1">Character Name</label>
                        <input type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-background border rounded-md px-3 py-2" />
                      </div>
                      
                      <div>
                        <label className="text-sm font-bold block mb-1">Description</label>
                        <textarea value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-background border rounded-md px-3 py-2 h-24 resize-none" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-bold block mb-1">Gender</label>
                          <select value={formData.gender || 'Others'} onChange={e => setFormData({...formData, gender: e.target.value as Gender})} className="w-full bg-background border rounded-md px-3 py-2">
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Others">Others</option>
                            <option value="Objects">Object</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-bold block mb-1">Species</label>
                          <input type="text" value={formData.species || ''} onChange={e => setFormData({...formData, species: e.target.value})} className="w-full bg-background border rounded-md px-3 py-2" />
                        </div>
                        <div>
                          <label className="text-sm font-bold block mb-1">Status</label>
                          <select value={formData.status || 'Unsorted'} onChange={e => setFormData({...formData, status: e.target.value as Status})} className="w-full bg-background border rounded-md px-3 py-2">
                            <option value="Sorted">Sorted</option>
                            <option value="Unsorted">Unsorted</option>
                            <option value="Duplicate">Duplicate</option>
                          </select>
                        </div>
                        <div>
                           <label className="text-sm font-bold block mb-1">Rating / Completion</label>
                           <input type="text" value={formData.completionRating || ''} onChange={e => setFormData({...formData, completionRating: e.target.value})} className="w-full bg-background border rounded-md px-3 py-2" placeholder="e.g. 100% Finished" />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                        <input type="checkbox" id="favorite" checked={formData.isFavorite || false} onChange={e => setFormData({...formData, isFavorite: e.target.checked})} className="w-4 h-4 rounded text-primary" />
                        <label htmlFor="favorite" className="text-sm font-medium flex items-center gap-1 cursor-pointer">
                          <Heart className={\`w-4 h-4 \${formData.isFavorite ? 'fill-red-500 text-red-500' : ''}\`} /> Mark as Favorite
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'details' && (
              <div className="flex flex-col md:flex-row gap-6 h-full min-h-[500px]">
                {/* Left Panel: Tabs */}
                <div className="w-full md:w-1/4 border-r pr-4 space-y-2 flex flex-col">
                   <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Sections</h3>
                   
                   <button 
                     onClick={() => setDetailActiveTab('images')}
                     className={\`flex items-center w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors \${detailActiveTab === 'images' ? 'bg-primary/10 text-primary' : 'hover:bg-secondary'}\`}
                   >
                     <ImageIcon className="w-4 h-4 mr-2" />
                     Images & Model Sheets
                   </button>
                   
                   <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-4 mb-2 flex items-center justify-between">
                     Character Bible
                     <button onClick={addBiblePage} className="p-1 hover:bg-secondary rounded text-primary"><Plus className="w-3 h-3" /></button>
                   </h3>
                   
                   <div className="space-y-1 flex-1 overflow-y-auto">
                     {formData.biblePages?.map((page, i) => (
                       <div key={page.id} className={\`group flex items-center justify-between w-full px-3 py-2 rounded-md text-sm font-medium transition-colors \${detailActiveTab === page.id ? 'bg-primary/10 text-primary' : 'hover:bg-secondary'}\`}>
                         <button onClick={() => setDetailActiveTab(page.id)} className="flex items-center flex-1 text-left truncate">
                           <FileText className="w-4 h-4 mr-2 shrink-0" />
                           <span className="truncate">{page.title}</span>
                         </button>
                         <button onClick={(e) => deleteBiblePage(page.id, e)} className="p-1 opacity-0 group-hover:opacity-100 hover:text-destructive shrink-0">
                           <X className="w-3 h-3" />
                         </button>
                       </div>
                     ))}
                     {(!formData.biblePages || formData.biblePages.length === 0) && (
                        <p className="text-xs text-muted-foreground px-3">No pages created.</p>
                     )}
                   </div>
                </div>
                
                {/* Right Panel: Content */}
                <div className="w-full md:w-3/4 flex flex-col">
                  {detailActiveTab === 'images' && (
                    <div className="space-y-4 h-full flex flex-col">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-lg">Image Gallery</h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto pb-4 pr-2">
                        {galleryImages.map((img, i) => (
                          <div key={img.id} className="border rounded-lg bg-secondary/10 p-3 flex flex-col gap-2">
                            <div className="relative group cursor-pointer" onClick={() => setGalleryIndex(i)}>
                               <img src={img.src} alt={img.title} className="w-full h-32 object-cover rounded-md border" />
                               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                                  <Maximize2 className="w-6 h-6 text-white" />
                               </div>
                            </div>
                            <h4 className="font-bold text-sm truncate" title={img.title}>{img.title}</h4>
                            {img.description && <p className="text-xs text-muted-foreground line-clamp-2">{img.description}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {detailActiveTab.startsWith('page-') && (
                     <div 
                       className="flex flex-col h-full space-y-4"
                       onDragOver={(e) => e.preventDefault()}
                       onDrop={handleBibleTextDrop}
                     >
                       <div className="flex justify-between items-center border-b pb-2">
                         <input 
                           type="text" 
                           value={formData.biblePages?.find(p => p.id === detailActiveTab)?.title || ''}
                           onChange={(e) => {
                              const pages = formData.biblePages ? [...formData.biblePages] : [];
                              const index = pages.findIndex(p => p.id === detailActiveTab);
                              if (index !== -1) {
                                  pages[index].title = e.target.value;
                                  setFormData({...formData, biblePages: pages});
                              }
                           }}
                           className="font-bold text-lg bg-transparent border-none outline-none focus:ring-1 focus:ring-primary rounded px-2 w-1/2"
                         />
                         
                         <div className="flex gap-2">
                           <label className="cursor-pointer bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 py-1.5 rounded text-sm flex items-center gap-1 font-medium transition-colors border">
                             <Upload className="w-4 h-4" />
                             Import .txt
                             <input type="file" accept=".txt" className="hidden" onChange={handleBibleFileUpload} />
                           </label>
                           
                           <button 
                             onClick={() => {
                                 const template = \`MASTER CHARACTER BIBLE & BOOKLET TEMPLATE\\nComprehensive Character Specification & Universe Development Guide\\nProject / Series: [Insert Project Name]\\nCharacter Name: \${formData.name || '[Insert Character Full Name]'}\\nCreator / Author: [Insert Creator Name]\\nVersion / Date: [e.g., Version 1.0 - October 2026]\\n\\n1. QUICK REFERENCE & HIGH-LEVEL PROFILE\\nThis section provides an immediate snapshot of the character for quick scanning during writing, design, or production passes.\\nAttribute\\nDetail / Specification\\n \\nFull Name\\n\${formData.name || '[Insert Full Name]'}\\nAliases / Code Names\\n[Insert Nicknames, Titles, Monikers]\\nPrimary Role / Archetype\\n[Protagonist / Antagonist / Deuteragonist / Mentor / Mascot]\\nAge & Birthdate\\n[Age, Apparent Age, Date of Birth, Astrological Alignment]\\nSpecies / Origin\\n\${formData.species || '[Human, Cybernetic, Alien, Magical Entity, Fantasy Race, Creature]'}\\nCurrent Status\\n[Active / Deceased / Missing / Sealed / Evolving]\\nPrimary Ecosystem / Domain\\n[Faction, Location, Media Channel, Guild, Affiliation]\\n\\n2. EXECUTIVE CONCEPT & CORE PREMISE\\n2.1 Elevator Pitch & Tagline\\nTagline: "[Insert a punchy, iconic line describing the character's journey or motto]"\\nElevator Pitch: [Summarize the character in 2–3 sentences highlighting who they are, what they want, and what stands in their way.]\\n2.2 Core Theme & Narrative Purpose\\nCentral Theme: [e.g., Redemption, Finding Identity, Power vs. Responsibility, Nature vs. Machine]\\nNarrative Function: [How does this character push the overall story forward or embody the world's thematic conflict?]\\nSymbolism & Motifs: [Key visual or conceptual symbols linked to the character, e.g., sparks, gears, shadows, specific colors]\\n3. PHYSICAL APPEARANCE & VISUAL DESIGN\\nDetailed breakdown of visual characteristics for artists, animators, modelers, and costume designers.\\nVisual Feature\\nDetailed Description\\n \\nHeight & Build\\n[Height, Weight, Body Type, Silhouette, Posture]\\nFacial Features\\n[Eye color/shape, Hair style/color, Skin tone, Facial structure]\\nDistinguishing Marks\\n[Scars, Tattoos, Birthmarks, Cybernetic Mods, Glow effects]\\nPrimary Attire\\n[Signature clothing, materials, accessories, badges, armor]\\nAlternative Outfits\\n[Battle gear, casual wear, historical/flashback variations]\\nColor Palette\\n\${formData.colorPalette?.join(', ') || '[Primary Hex/RGB codes, Secondary colors, Accent lighting]'}\\n\\n3.2 Expressions, Posture & Movement Style\\nDefault Stance & Posture: [How they stand when relaxed, alert, or threatened]\\nGait & Movement: [e.g., Heavy and deliberate, fluid and acrobatic, erratic, buoyant]\\nExpressive Range: [Key facial expressions, eyebrow movements, eye widening, subtle tell signs]\\n4. PSYCHOLOGY, PERSONALITY & SPEECH\\n4.1 Core Personality Profile\\n[Write a paragraph describing the character's temperament, emotional default, and worldview.]\\nCategory\\nTraits / Descriptors\\n \\nDominant Traits\\n[e.g., Resilient, Cynical, Fiercely Loyal, Methodical, Mischievous]\\nCore Motivation (Want)\\n[What the character consciously strives to achieve]\\nUnderlying Need (Need)\\n[What the character emotionally or spiritually needs to learn]\\nFatal Flaw / Vulnerability\\n[Insecurity, Hubris, Blind loyalty, Impulsiveness]\\nDeepest Fear\\n[Abandonment, Failure, Loss of Control, Being Forgotten]\\n\\n4.2 Dialogue & Voice Specification\\nVocal Pitch & Tone: [e.g., Deep baritone, energetic mid-range, raspy whisper, melodic]\\nSpeech Cadence: [Rapid-fire, slow and calculated, punctuated with pauses]\\nVocabulary & Dialect: [Formal/Academic, Slang-heavy, Technical/Jargon, Archaic]\\nCatchphrases or Verbal Quirks: [Repeated sayings, nervous hums, distinct laugh]\\n5. BACKSTORY & HISTORY\\n5.1 Early Life & Origins\\n[Describe where the character was raised, cultural/family background, and initial living conditions.]\\n5.2 Key Defining Events\\nFormative Event 1: [Description of early pivot point, loss, or discovery]\\nFormative Event 2: [Description of major conflict or catalyst]\\nFormative Event 3: [The event directly leading to the beginning of the current story]\\n5.3 Secrets & Unresolved Mysteries\\n[List secrets the character hides from others, or mysteries about their own past they have yet to discover.]\\n6. RELATIONSHIPS & FACTION DYNAMICS\\nMapping how the character interacts with the rest of the cast and universe.\\nRelated Character\\nRelationship Type\\nDynamic & Key Conflicts\\n \\n[Character A]\\nAlly / Best Friend\\n[Describe dynamic, mutual trust, points of friction]\\n[Character B]\\nRival / Antagonist\\n[Describe cause of conflict, competition, ideological opposition]\\n[Character C]\\nMentor / Authority\\n[Describe balance of respect, guidance, independence]\\n\\n7. SKILLS, ABILITIES & EQUIPMENT\\n7.1 Combat & Utility Capabilities\\nSkill / Ability\\nProficiency Level\\nOperational Details / Mechanics\\n \\n[Signature Ability / Magic]\\nMaster / Advanced\\n[How it functions, stamina cost, visual effect]\\n[Technical / Utility Skill]\\nIntermediate\\n[e.g., Hacking, Crafting, Piloting, Musical Performance]\\n\\n7.2 Signature Gear, Tools & Weapons\\nPrimary Equipment / Weapon: [Name, appearance, specs, origin]\\nSecondary Gear / Gadgets: [Utility items, inventory carried routinely]\\nWeaknesses & Operational Limitations: [What neutralizes or counters their power?]\\n8. CHARACTER DEVELOPMENT & STORY ARC\\n8.1 Three-Act Narrative Arc\\nAct I (Beginning Status Quo): [Initial mindset, comfort zone, world before change]\\nAct II (Testing & Transformation): [Midpoint shift, breaking point, trial by fire]\\nAct III (Climax & Resolution): [Final lesson applied, evolution achieved or tragic downfall]\\n9. MULTIMEDIA & PRODUCTION SPECIFICATIONS\\nGuidelines for adapting this character across different media formats (Animation, Comics, Games, Audio, Puppetry/Physical Collectibles).\\nMedium / Format\\nProduction Considerations & Rules\\n \\nAnimation / Storyboarding\\nKey frames, turnaround highlights, squash-and-stretch guidelines, FX timing.\\nComics / Manga\\nPanel framing rules, line-art density, high-contrast shading cues, sound effect tags.\\nInteractive / Game Mechanics\\nHitboxes, idle animation loops, state transitions, audio feedback triggers.\\nAudio / Music Themes\\nLeitmotif instrumentation, musical tempo, character album alignment.\\nPhysical Crafts & Collectibles\\n3D print tolerances, fabric specs for puppets/costumes, shell/packaging specs.\\n\\n10. BOOKLET PRINTING & PAGE LAYOUT INSTRUCTIONS\\nTo convert this Character Bible into a physical or digital booklet / zine format, follow these layout configuration guidelines in Google Docs:\\nPage Setup & Orientation: Navigate to File > Page Setup. Set orientation to Landscape if creating a side-by-side spread, or keep Portrait for a standard vertical booklet.\\nMargins: Set margins to 0.5 inches (1.27 cm) on all sides to maximize print surface area and fit clean side-by-side columns.\\nTwo-Column Booklet Spread: Go to Format > Columns and select 2 Columns. This immediately converts sections into a classic booklet/zine fold layout.\\nPage Breaks: Insert Page Breaks (Insert > Break > Page break) between major numbered sections so each core chapter begins at the top of a new booklet page.\\nExporting for Print: Go to File > Download > PDF Document (.pdf). Use your printer's Booklet Printing mode (or Adobe Acrobat settings) to automatically double-side match pages for folding and stapling.\`;
                                 updateActiveBiblePageContent(template);
                             }}
                             className="bg-primary text-primary-foreground px-3 py-1.5 rounded text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
                           >
                             Load Template
                           </button>
                         </div>
                       </div>
                       
                       <div className="flex-1 relative">
                          <textarea 
                            value={formData.biblePages?.find(p => p.id === detailActiveTab)?.content || ''}
                            onChange={e => updateActiveBiblePageContent(e.target.value)}
                            className="w-full h-full bg-secondary/10 border rounded-md p-4 font-mono text-sm resize-none focus:ring-2 focus:ring-primary/20 outline-none placeholder:text-muted-foreground/60 transition-colors"
                            placeholder="Drag & drop a .txt file here, upload one, or paste your character details..."
                          />
                          {(!formData.biblePages?.find(p => p.id === detailActiveTab)?.content) && (
                             <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center opacity-40">
                                <FileText className="w-16 h-16 mb-4" />
                                <p className="text-lg font-medium">Drop character notes here</p>
                             </div>
                          )}
                       </div>
                     </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'technical' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6">
                   <div className="w-full md:w-1/2 space-y-6">
                     <div className="space-y-4 p-4 bg-card border rounded-xl shadow-sm">
                       <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1 flex items-center gap-2">
                         <Palette className="w-4 h-4" /> Color Palette & Ink
                       </h3>
                       
                       <div className="flex flex-wrap gap-2 mb-4">
                         {formData.colorPalette?.map((color, i) => (
                           <div key={i} className="group relative w-12 h-12 rounded-lg border-2 border-border shadow-sm flex items-center justify-center" style={{ backgroundColor: color }}>
                             <button 
                               onClick={() => removeColor(color)}
                               className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                             >
                               <X className="w-3 h-3" />
                             </button>
                           </div>
                         ))}
                         {(!formData.colorPalette || formData.colorPalette.length === 0) && (
                           <p className="text-sm text-muted-foreground italic w-full">No colors defined.</p>
                         )}
                       </div>
                       
                       <div className="flex items-center gap-2">
                         <div className="relative flex-1 flex items-center">
                            <input 
                              type="color" 
                              value={colorInput} 
                              onChange={e => setColorInput(e.target.value)}
                              className="w-8 h-8 rounded border-none p-0 cursor-pointer absolute left-1"
                            />
                            <input
                              type="text"
                              value={colorInput}
                              onChange={e => setColorInput(e.target.value.toUpperCase())}
                              className="w-full pl-10 pr-3 py-1.5 text-sm bg-background border rounded-md uppercase font-mono"
                            />
                         </div>
                         <button onClick={addColor} className="bg-secondary hover:bg-secondary/80 text-foreground px-3 py-1.5 rounded-md text-sm font-medium transition-colors border">
                           Add Color
                         </button>
                         {isEyeDropperSupported && (
                           <button onClick={handleEyeDropper} className="bg-secondary hover:bg-secondary/80 text-foreground p-1.5 rounded-md transition-colors border" title="Pick color from screen">
                             <Pipette className="w-4 h-4" />
                           </button>
                         )}
                       </div>
                     </div>
                     
                     <div className="space-y-4 p-4 bg-card border rounded-xl shadow-sm">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1">Creation & System Info</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-sm font-bold">Date Created</label>
                            <input type="text" value={formData.dateCreated || ''} onChange={e => setFormData({...formData, dateCreated: e.target.value})} className="w-full bg-background border rounded-md px-3 py-2 text-sm" placeholder="e.g. 01/08/2026" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-sm font-bold">Creation Source</label>
                            <select value={formData.dateCreatedSource || 'Unknown'} onChange={e => setFormData({...formData, dateCreatedSource: e.target.value as any})} className="w-full bg-background border rounded-md px-3 py-2 text-sm">
                              <option value="From Image">From Image</option>
                              <option value="From Text">From Text</option>
                              <option value="From File Property">From File Property</option>
                              <option value="Added Manually">Added Manually</option>
                              <option value="Unknown">Unknown</option>
                            </select>
                          </div>
                        </div>
                      </div>
                   </div>
                   
                   <div className="w-full md:w-1/2 space-y-6">
                     <div className="space-y-4 p-4 bg-card border rounded-xl shadow-sm">
                       <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1">Publication & Medium</h3>
                       
                       <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1">
                           <label className="text-sm font-bold block mb-1">First Publication</label>
                           <input type="text" value={formData.firstPublication || ''} onChange={e => setFormData({...formData, firstPublication: e.target.value})} className="w-full bg-background border rounded-md px-3 py-2 text-sm" placeholder="e.g. Volume 1" />
                         </div>
                         <div className="space-y-1">
                           <label className="text-sm font-bold block mb-1">First Appearance</label>
                           <input type="text" value={formData.firstAppearance || ''} onChange={e => setFormData({...formData, firstAppearance: e.target.value})} className="w-full bg-background border rounded-md px-3 py-2 text-sm" placeholder="e.g. Issue #1" />
                         </div>
                       </div>
                       
                       <div className="space-y-1">
                         <label className="text-sm font-bold block mb-1">Target Medium</label>
                         <select value={formData.firstAppearanceType || 'other'} onChange={e => setFormData({...formData, firstAppearanceType: e.target.value as any})} className="w-full bg-background border rounded-md px-3 py-2 text-sm">
                           <option value="comic">Comic Book</option>
                           <option value="animation">Animation (2D/3D)</option>
                           <option value="video game">Video Game</option>
                           <option value="show">Puppet / Live Action Show</option>
                           <option value="music">Music / Audio</option>
                           <option value="other">Other</option>
                         </select>
                       </div>
                       
                       <div className="bg-primary/5 border border-primary/20 rounded-md p-3">
                          <p className="text-sm text-primary/80 font-medium flex items-start gap-2">
                            <span className="shrink-0 mt-0.5">💡</span>
                            If the target medium is <b>{formData.firstAppearanceType === 'comic' ? 'Comic Book' : formData.firstAppearanceType === 'animation' ? 'Animation' : formData.firstAppearanceType === 'show' ? 'Puppet Show' : 'Video Game'}</b>, make sure to document material requirements (inks, meshes, armatures, fabrics) in a custom Bible Page under Details.
                          </p>
                       </div>
                     </div>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t flex justify-between bg-card z-10 shadow-sm relative">
          <button 
            onClick={handleDelete}
            className="flex items-center gap-2 text-destructive hover:bg-destructive/10 px-3 py-2 rounded-md transition-colors text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Delete Character
          </button>
          
          <div className="flex gap-2">
            <button 
              onClick={handleClose}
              className="px-4 py-2 rounded-md hover:bg-secondary transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors text-sm font-medium shadow-sm"
            >
              <Check className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card text-card-foreground p-6 rounded-xl w-full max-w-sm shadow-2xl border border-border animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold mb-2 text-destructive">Remove Character?</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Are you sure you want to remove this character from the archive?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm font-medium transition-colors shadow-sm"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {showUnsavedConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card text-card-foreground p-6 rounded-xl w-full max-w-sm shadow-2xl border border-border animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold mb-2">Unsaved Changes</h3>
            <p className="text-muted-foreground text-sm mb-6">
              You have unsaved changes. Do you want to save them before exiting?
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  handleSave();
                  setShowUnsavedConfirm(false);
                }}
                className="w-full py-2 rounded-md bg-primary text-primary-foreground hover:bg-opacity-90 text-sm font-medium transition-colors text-center shadow-sm"
              >
                Save and Exit
              </button>
              <button
                onClick={() => {
                  setShowUnsavedConfirm(false);
                  if (onClose) onClose();
                }}
                className="w-full py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-opacity-80 text-sm font-medium transition-colors text-center border"
              >
                Discard Changes
              </button>
              <button
                onClick={() => setShowUnsavedConfirm(false)}
                className="w-full py-2 rounded-md bg-background border hover:bg-secondary text-sm font-medium transition-colors text-center"
              >
                Keep Editing
              </button>
            </div>
          </div>
        </div>
      )}

      {galleryIndex !== null && galleryImages[galleryIndex] && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none overflow-hidden"
          onTouchStart={handleTouchStartGallery}
          onTouchEnd={handleTouchEndGallery}
          onClick={() => setGalleryIndex(null)}
        >
          {/* Top toolbar */}
          <div className={\`absolute top-0 inset-x-0 p-4 flex justify-end gap-3 transition-opacity duration-500 z-50 bg-gradient-to-b from-black/80 to-transparent \${galleryShowOverlay && !isGalleryIdle ? 'opacity-100' : 'opacity-0'}\`} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setGalleryShowOverlay(!galleryShowOverlay)}
              className="p-2.5 rounded-full bg-secondary/80 text-foreground hover:bg-secondary transition-colors cursor-pointer border border-border/40"
              title={galleryShowOverlay ? "Hide Information Overlay" : "Show Information Overlay"}
            >
              {galleryShowOverlay ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setGalleryIndex(null)}
              className="p-2.5 rounded-full bg-secondary/80 text-foreground hover:bg-secondary transition-colors cursor-pointer border border-border/40"
              title="Close Gallery"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Previous Button */}
          <button 
            className={\`absolute left-4 z-40 p-3 rounded-full bg-secondary/50 text-foreground hover:bg-secondary transition-all cursor-pointer border border-border/20 \${!isGalleryIdle ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}\`}
            onClick={(e) => { e.stopPropagation(); setGalleryIndex((galleryIndex - 1 + galleryImages.length) % galleryImages.length); }}
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          {/* Next Button */}
          <button 
            className={\`absolute right-4 z-40 p-3 rounded-full bg-secondary/50 text-foreground hover:bg-secondary transition-all cursor-pointer border border-border/20 \${!isGalleryIdle ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}\`}
            onClick={(e) => { e.stopPropagation(); setGalleryIndex((galleryIndex + 1) % galleryImages.length); }}
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          {/* Main Image View */}
          <img
            src={galleryImages[galleryIndex].src}
            alt={galleryImages[galleryIndex].title}
            className="max-w-full max-h-[100vh] object-contain shadow-2xl animate-in zoom-in-95 duration-200"
          />

          {/* Bottom Information Overlay */}
          <div className={\`absolute bottom-0 inset-x-0 p-8 pt-16 flex flex-col justify-end transition-opacity duration-500 z-30 bg-gradient-to-t from-black via-black/80 to-transparent \${galleryShowOverlay && !isGalleryIdle ? 'opacity-100' : 'opacity-0'}\`}>
            <div className="max-w-4xl mx-auto w-full text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white drop-shadow-md">
                {galleryImages[galleryIndex].title}
              </h2>
              {galleryImages[galleryIndex].description && (
                <p className="text-sm md:text-base text-slate-300 font-medium max-w-2xl mx-auto drop-shadow-md line-clamp-3">
                  {galleryImages[galleryIndex].description}
                </p>
              )}
              <div className="text-[10px] uppercase tracking-widest text-white/50 font-bold mt-4">
                {galleryIndex + 1} of {galleryImages.length}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/components/CharacterEditor.tsx', code);
console.log("Editor completely rewritten.");
