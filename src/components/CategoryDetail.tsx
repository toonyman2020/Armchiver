import React, { useState } from 'react';
import { ArchiveItem, Character } from '../types';
import { ArrowLeft, Download, LayoutGrid, List, Copy, ChevronLeft, ChevronRight, Shuffle, Heart } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { ItemProfile } from './ItemProfile';
import { playNotificationSound } from '../lib/audio';
import { MediaView } from './MediaView';
import { getCharacterCategory } from './Dashboard';

export function CategoryDetail({ category, customCategories, items, characters, onBack, setCharacters, setItems, onSelectCategory }: { category: string, customCategories?: {id: string, name: string}[], items: ArchiveItem[], characters: Character[], onBack: () => void, setCharacters?: React.Dispatch<React.SetStateAction<Character[]>>, setItems?: React.Dispatch<React.SetStateAction<ArchiveItem[]>>, onSelectCategory: (cat: string) => void }) {
  const [selectedItem, setSelectedItem] = useState<ArchiveItem | null>(null);
  
  // Find resolved category object
  const currentCat = customCategories?.find(c => c.id === category);
  const catName = currentCat ? currentCat.name : category;
  const catId = currentCat ? currentCat.id : category.toLowerCase();

  const categories = ['Male', 'Female', 'Others', 'Objects', 'Unsorted', 'Duplicates', 'No Characters'];
  
  const handlePrev = () => {
    const idx = categories.indexOf(catName);
    if (idx !== -1) {
      onSelectCategory(categories[(idx - 1 + categories.length) % categories.length]);
    }
  };
  
  const handleNext = () => {
    const idx = categories.indexOf(catName);
    if (idx !== -1) {
      onSelectCategory(categories[(idx + 1) % categories.length]);
    }
  };
  
  const handleRandom = () => {
    onSelectCategory(categories[Math.floor(Math.random() * categories.length)]);
  };
  
  // Find characters and items that match the category
  const lowerCat = catName.toLowerCase();

  const isUnknownItem = (item: ArchiveItem) => {
    const itemChars = characters.filter(c => c.sourceId === item.id);
    const hasNoCharacters = item.charactersCount === 0 || itemChars.length === 0;
    const isUnsorted = itemChars.some(c => c.status === 'Unsorted');
    const isUnknown = itemChars.some(c => c.entityType === 'Unknown');
    const hasNoSketches = !item.isSketch && itemChars.every(c => !c.isSketch);
    const hasNoCategories = itemChars.every(c => !c.species || c.species === 'Unknown');
    return hasNoCharacters || isUnsorted || isUnknown || hasNoSketches || hasNoCategories;
  };
  
  const filteredChars = characters.filter(c => {
    if (catId === 'total' || lowerCat === 'total characters') return true;
    if (catId === 'groups' || lowerCat === 'groups') {
      const parentItem = items.find(i => i.id === c.sourceId);
      return parentItem?.isGroup === true;
    }
    if (catId === 'male' || lowerCat === 'male') {
      return getCharacterCategory(c) === 'Male';
    }
    if (catId === 'female' || lowerCat === 'female') {
      return getCharacterCategory(c) === 'Female';
    }
    if (catId === 'objects' || lowerCat === 'objects') {
      return getCharacterCategory(c) === 'Objects';
    }
    if (catId === 'others' || lowerCat === 'others') {
      return getCharacterCategory(c) === 'Others';
    }
    if (catId === 'unsorted' || lowerCat === 'unsorted') {
      return c.status === 'Unsorted';
    }
    if (catId === 'duplicates' || lowerCat === 'duplicates') {
      return c.status === 'Duplicate';
    }
    if (catId === 'no characters' || lowerCat === 'no characters') {
      return false;
    }
    if (catId === 'unknown' || lowerCat === 'unknown') {
      const parentItem = items.find(i => i.id === c.sourceId);
      return (parentItem ? isUnknownItem(parentItem) : false) || c.status === 'Unsorted' || c.entityType === 'Unknown' || !c.species || c.species === 'Unknown';
    }
    return c.name === catName || c.status === catName;
  });
  
  const filteredItems = items.filter(item => {
    if (catId === 'total' || lowerCat === 'total characters') return true;
    if (catId === 'groups' || lowerCat === 'groups') return item.isGroup === true;
    if (catId === 'no characters' || lowerCat === 'no characters') {
      return item.charactersCount === 0;
    }
    if (catId === 'unknown' || lowerCat === 'unknown') {
      return isUnknownItem(item);
    }
    return filteredChars.some(c => c.sourceId === item.id) ||
           item.artStyle === catName || 
           item.medium === catName;
  });

  if (selectedItem) {
    return (
      <ItemProfile 
        item={selectedItem}
        items={filteredItems}
        onSelectItem={setSelectedItem}
        characters={characters.filter(c => c.sourceId === selectedItem.id)}
        onBack={() => setSelectedItem(null)}
        onUpdateItem={() => {}} // stub for now
        setCharacters={setCharacters}
        setItems={setItems}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-secondary rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <button onClick={handlePrev} className="p-1 hover:bg-secondary rounded" title="Previous default category"><ChevronLeft className="w-5 h-5"/></button>
            <button onClick={handleRandom} className="p-1 hover:bg-secondary rounded" title="Random default category"><Shuffle className="w-4 h-4"/></button>
            <button onClick={handleNext} className="p-1 hover:bg-secondary rounded" title="Next default category"><ChevronRight className="w-5 h-5"/></button>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight capitalize">{catName}</h1>
            <p className="text-muted-foreground">{filteredItems.length} items, {filteredItems.reduce((sum, item) => sum + (item.charactersCount || 0), 0)} characters</p>
          </div>
        </div>
      </div>
      
      <MediaView 
        type="image" 
        items={items} 
        characters={characters} 
        onUpload={() => {}} // CategoryDetail is not for uploading
        setCharacters={setCharacters || (() => {})} 
        setItems={setItems || (() => {})} 
        filter={catId === 'no characters' || lowerCat === 'no characters' ? 'No Characters' : 'All'} 
        setFilter={() => {}} 
        filteredItems={filteredItems}
        filteredCharacters={filteredChars}
      />
    </div>
  );
}
