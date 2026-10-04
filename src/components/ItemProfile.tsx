import React, { useState, useRef, useEffect } from 'react';
import { ArchiveItem, Character, Gender, Status, SubImage } from '../types';
import { 
  ArrowLeft, Download, CloudUpload, Edit, Save, ExternalLink, FileText, 
  FileCode, FileJson, Image, ChevronDown, Crop, ChevronLeft, ChevronRight, 
  Shuffle, Heart, Calendar, PlusCircle, Volume2, Video, Trash2, Sliders, Plus, X,
  Sparkles, Mic, Upload, AlertTriangle, BookOpen, Layers
} from 'lucide-react';
import { CharacterEditor } from './CharacterEditor';
import { UnifiedMediaPlayer } from './UnifiedMediaPlayer';
import { TTSReader } from './TTSReader';
import { PDFBookReader } from './PDFBookReader';
import { AlignmentToolModal } from './AlignmentToolModal';
import { scanAndFlagDuplicates } from '../lib/duplicateScanner';
import { SpreadsheetView } from './SpreadsheetView';
import { getAccessToken } from '../lib/auth';
import jsPDF from 'jspdf';
import { playNotificationSound } from '../lib/audio';
import { safeCopyToClipboard } from '../lib/utils';
import { RenderFavoriteIcon } from './FavoriteIconRenderer';
import { FavoriteIconSelectorModal } from './FavoriteIconSelectorModal';

function ColorCircle({ hex }: { hex: string, key?: any }) {
  const [copiedType, setCopiedType] = useState<'none' | 'hex' | 'rgb'>('none');
  const [showTooltip, setShowTooltip] = useState(false);

  const getRgb = (hexStr: string) => {
    try {
      const h = hexStr.replace('#', '');
      const r = parseInt(h.substring(0, 2), 16);
      const g = parseInt(h.substring(2, 4), 16);
      const b = parseInt(h.substring(4, 6), 16);
      return `rgb(${r}, ${g}, ${b})`;
    } catch {
      return '';
    }
  };

  const rgb = getRgb(hex);

  const copy = (text: string, type: 'hex' | 'rgb') => {
    safeCopyToClipboard(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType('none'), 2000);
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setShowTooltip(!showTooltip)}
        onMouseLeave={() => setTimeout(() => setShowTooltip(false), 3000)}
        className="w-5 h-5 rounded-full border border-border shadow-sm hover:scale-110 transition-transform focus:outline-none cursor-pointer"
        style={{ backgroundColor: hex }}
        title={`Click to view Hex and RGB for ${hex}`}
      />
      
      {showTooltip && (
        <div className="absolute bottom-7 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] rounded-lg p-2 shadow-xl border border-border z-30 min-w-[150px] space-y-1 animate-in fade-in slide-in-from-bottom-1 duration-200">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[9px] font-semibold">{hex}</span>
            <button 
              onClick={(e) => { e.stopPropagation(); copy(hex, 'hex'); }}
              className="px-1.5 py-0.5 bg-secondary hover:bg-secondary/80 rounded text-[9px] font-medium text-foreground"
            >
              {copiedType === 'hex' ? 'Copied!' : 'Copy Hex'}
            </button>
          </div>
          {rgb && (
            <div className="flex items-center justify-between gap-2 border-t pt-1 border-border/50">
              <span className="font-mono text-[9px] font-semibold truncate max-w-[80px]">{rgb}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); copy(rgb, 'rgb'); }}
                className="px-1.5 py-0.5 bg-secondary hover:bg-secondary/80 rounded text-[9px] font-medium text-foreground"
              >
                {copiedType === 'rgb' ? 'Copied!' : 'Copy RGB'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ItemProfile({ item, items, characters, onBack, onUpdateItem, setCharacters, setItems, onSelectItem }: { item: ArchiveItem, items: ArchiveItem[], characters: Character[], onBack: () => void, onUpdateItem?: (item: ArchiveItem) => void, setCharacters?: React.Dispatch<React.SetStateAction<Character[]>>, setItems?: React.Dispatch<React.SetStateAction<ArchiveItem[]>>, onSelectItem?: (item: ArchiveItem) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingCloud, setIsExportingCloud] = useState(false);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  
  // Character bottom workspace states
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [activeOuterTab, setActiveOuterTab] = useState<'biography' | 'bible' | 'media' | 'spreadsheet' | 'technical'>('biography');
  const [activeBibleSubTab, setActiveBibleSubTab] = useState<string>('executive-concepts');
  const [activeMediaSubTab, setActiveMediaSubTab] = useState<'images' | 'audios' | 'videos'>('images');
  const [isFavIconModalOpen, setIsFavIconModalOpen] = useState(false);
  const [favoriteModalTargetChar, setFavoriteModalTargetChar] = useState<Character | null>(null);
  
  // Alignment tool & PDF Book reader states
  const [showAlignmentTool, setShowAlignmentTool] = useState(false);
  const [activeBookFile, setActiveBookFile] = useState<{ title: string; content: string; url?: string } | null>(null);

  // Overview customizable panels and reorderable media cards
  const [customPanels, setCustomPanels] = useState<{ id: string; title: string; content: string }[]>([]);
  const [mediaCardsOrder, setMediaCardsOrder] = useState<('audioDebut' | 'audioTrack' | 'featureVideo' | 'featurePoster')[]>([
    'audioDebut', 'audioTrack', 'featureVideo', 'featurePoster'
  ]);
  
  // Inline editing states for character
  const [isEditingChar, setIsEditingChar] = useState(false);
  const [editedCharData, setEditedCharData] = useState<Character | null>(null);

  // AI & Voice Command states
  const [isListening, setIsListening] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [isProcessingAi, setIsProcessingAi] = useState(false);
  const [aiCommandInput, setAiCommandInput] = useState('');
  const [showAiConsole, setShowAiConsole] = useState(false);

  // Custom aspect ratio & fit states for character portrait
  const [portraitRatio, setPortraitRatio] = useState<string>(() => {
    return localStorage.getItem("char_portrait_ratio") || '3:4';
  });
  const [portraitFit, setPortraitFit] = useState<'cover' | 'contain'>(() => {
    return (localStorage.getItem("char_portrait_fit") as 'cover' | 'contain') || 'cover';
  });

  // Track collapsed bible pages tree state
  const [collapsedPages, setCollapsedPages] = useState<Record<string, boolean>>({});

  // Form states for adding media
  const [newAudioTitle, setNewAudioTitle] = useState('');
  const [newAudioSrc, setNewAudioSrc] = useState('');
  const [newAudioDesc, setNewAudioDesc] = useState('');
  
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoSrc, setNewVideoSrc] = useState('');
  const [newVideoDesc, setNewVideoDesc] = useState('');

  // Auto-select the first character for this item if none is selected
  useEffect(() => {
    if (characters.length > 0 && !selectedCharId) {
      setSelectedCharId(characters[0].id);
    } else if (characters.length === 0) {
      setSelectedCharId(null);
    }
  }, [characters, selectedCharId]);

  // Sync editedCharData when selecting a different character
  useEffect(() => {
    if (selectedCharId) {
      const char = characters.find(c => c.id === selectedCharId);
      if (char) {
        setEditedCharData(char);
      }
    } else {
      setEditedCharData(null);
    }
    setIsEditingChar(false);
  }, [selectedCharId, characters]);

  const removeColor = (color: string) => {
    if (!editedCharData) return;
    const palette = (editedCharData.colorPalette || []).filter(c => c !== color);
    setEditedCharData({ ...editedCharData, colorPalette: palette });
  };

  const addColor = (color: string) => {
    if (!editedCharData) return;
    const palette = [...(editedCharData.colorPalette || [])];
    if (!palette.includes(color)) {
      palette.push(color);
    }
    setEditedCharData({ ...editedCharData, colorPalette: palette });
  };

  const handleUpdateBiblePage = (content: string) => {
    if (!editedCharData) return;
    const pages = editedCharData.biblePages ? [...editedCharData.biblePages] : [
      { id: 'executive-concepts', title: 'Executive Concepts', content: '' },
      { id: 'core-premise', title: 'Core Premise', content: '' },
      { id: 'height-build', title: 'Height & Build', content: '' },
      { id: 'personality-speech', title: 'Personality & Speech', content: '' }
    ];
    const index = pages.findIndex(p => p.id === activeBibleSubTab);
    if (index !== -1) {
      pages[index] = { ...pages[index], content };
    } else {
      pages.push({ id: activeBibleSubTab, title: activeBibleSubTab.replace('-', ' '), content });
    }
    setEditedCharData({ ...editedCharData, biblePages: pages });
  };

  const handleAddBiblePage = (title: string, parentId?: string) => {
    if (!editedCharData) return;
    const pages = editedCharData.biblePages ? [...editedCharData.biblePages] : [
      { id: 'executive-concepts', title: 'Executive Concepts', content: '' },
      { id: 'core-premise', title: 'Core Premise', content: '' },
      { id: 'height-build', title: 'Height & Build', content: '' },
      { id: 'personality-speech', title: 'Personality & Speech', content: '' }
    ];
    const newId = `page-${Date.now()}`;
    pages.push({ id: newId, title, content: '', parentId });
    setEditedCharData({ ...editedCharData, biblePages: pages });
    setActiveBibleSubTab(newId);
  };

  const handleDeleteBiblePage = (id: string) => {
    if (!editedCharData) return;
    const pages = editedCharData.biblePages ? [...editedCharData.biblePages] : [];
    const filtered = pages.filter(p => p.id !== id && p.parentId !== id);
    setEditedCharData({ ...editedCharData, biblePages: filtered });
    if (activeBibleSubTab === id) {
      setActiveBibleSubTab(filtered[0]?.id || 'executive-concepts');
    }
  };

  const handleRenameBiblePage = (id: string, newTitle: string) => {
    if (!editedCharData) return;
    const pages = (editedCharData.biblePages || []).map(p => 
      p.id === id ? { ...p, title: newTitle } : p
    );
    setEditedCharData({ ...editedCharData, biblePages: pages });
  };

  const handleVoiceCommand = async (commandText: string) => {
    if (!commandText.trim()) return;
    setIsProcessingAi(true);
    try {
      const activeChar = characters.find(c => c.id === selectedCharId) || characters[0];
      const res = await fetch('/api/process-character-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ character: isEditingChar ? editedCharData : activeChar, command: commandText })
      });
      if (!res.ok) throw new Error('Failed to process command');
      const data = await res.json();
      if (data.updatedFields) {
        if (isEditingChar && editedCharData) {
          setEditedCharData({ ...editedCharData, ...data.updatedFields });
        } else if (setCharacters) {
          setCharacters(prev => prev.map(c => c.id === activeChar.id ? { ...c, ...data.updatedFields } : c));
        }
        alert(`AI Update: ${data.explanationOfChanges}`);
      }
    } catch (e: any) {
      console.error(e);
      alert(`AI error: ${e.message}`);
    } finally {
      setIsProcessingAi(false);
    }
  };

  const handleAutoGenerateProfile = async (focusPrompt?: string) => {
    setIsProcessingAi(true);
    try {
      const activeChar = characters.find(c => c.id === selectedCharId) || characters[0];
      const res = await fetch('/api/generate-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ character: isEditingChar ? editedCharData : activeChar, prompt: focusPrompt })
      });
      if (!res.ok) throw new Error('Failed to generate profile');
      const data = await res.json();
      
      if (isEditingChar && editedCharData) {
        setEditedCharData({ ...editedCharData, ...data });
      } else if (setCharacters) {
        setCharacters(prev => prev.map(c => c.id === activeChar.id ? { ...c, ...data } : c));
      }
      alert(`Character Profile Auto-Generated successfully!`);
    } catch (e: any) {
      console.error(e);
      alert(`AI Generation error: ${e.message}`);
    } finally {
      setIsProcessingAi(false);
    }
  };

  const startSpeechRecognition = () => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support Web Speech Recognition. Try typing your command into the AI box instead!");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setSpeechTranscript('');
    };

    recognition.onerror = (e: any) => {
      console.error("Speech recognition error", e);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSpeechTranscript(transcript);
      if (transcript.trim()) {
        await handleVoiceCommand(transcript);
      }
    };

    recognition.start();
  };

  const handleSaveCharChanges = () => {
    if (!editedCharData || !setCharacters) return;
    setCharacters(prev => prev.map(c => c.id === editedCharData.id ? editedCharData : c));
    setIsEditingChar(false);
    playNotificationSound();
  };

  const handleAddCharacter = () => {
    if (!setCharacters) return;
    const newCharId = `char-${Date.now()}`;
    const newChar: Character = {
      id: newCharId,
      name: 'New Character',
      gender: 'Others',
      species: 'Unknown',
      description: 'Enter biography here...',
      status: 'Unsorted',
      sourceId: item.id,
      sourceType: item.type === 'image' ? 'image' : 'text',
      entityType: 'Character',
      dateCreated: new Date().toISOString().split('T')[0],
      dateUploaded: new Date().toISOString().split('T')[0],
      dateCreatedSource: 'Added Manually',
      biblePages: [
        { id: 'executive-concepts', title: 'Executive Concepts', content: 'Detailed concept descriptions...' },
        { id: 'core-premise', title: 'Core Premise', content: 'Main core premise...' },
        { id: 'height-build', title: 'Height & Build', content: 'Physical statistics...' },
        { id: 'personality-speech', title: 'Personality & Speech', content: 'Behavior and linguistics...' }
      ],
      audios: [],
      videos: [],
      subImages: []
    };
    setCharacters(prev => [...prev, newChar]);
    setSelectedCharId(newCharId);
    setIsEditingChar(true); // Open in edit mode so they can type immediately!
  };

  const handleAddAudio = () => {
    if (!editedCharData || !newAudioTitle || !newAudioSrc) return;
    const audios = [...(editedCharData.audios || [])];
    audios.push({
      id: `audio-${Date.now()}`,
      title: newAudioTitle,
      src: newAudioSrc,
      description: newAudioDesc
    });
    setEditedCharData({ ...editedCharData, audios });
    setNewAudioTitle('');
    setNewAudioSrc('');
    setNewAudioDesc('');
    playNotificationSound();
  };

  const handleAddVideo = () => {
    if (!editedCharData || !newVideoTitle || !newVideoSrc) return;
    const videos = [...(editedCharData.videos || [])];
    videos.push({
      id: `video-${Date.now()}`,
      title: newVideoTitle,
      src: newVideoSrc,
      description: newVideoDesc
    });
    setEditedCharData({ ...editedCharData, videos });
    setNewVideoTitle('');
    setNewVideoSrc('');
    setNewVideoDesc('');
    playNotificationSound();
  };

  const handleDeleteAudio = (audioId: string) => {
    if (!editedCharData) return;
    const audios = (editedCharData.audios || []).filter(a => a.id !== audioId);
    setEditedCharData({ ...editedCharData, audios });
  };

  const handleDeleteVideo = (videoId: string) => {
    if (!editedCharData) return;
    const videos = (editedCharData.videos || []).filter(v => v.id !== videoId);
    setEditedCharData({ ...editedCharData, videos });
  };
  
  const contentRef = useRef<HTMLDivElement>(null);

  const currentIndex = items.findIndex(i => i.id === item.id);

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      onSelectItem?.(items[currentIndex + 1]);
    } else {
      onSelectItem?.(items[0]);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      onSelectItem?.(items[currentIndex - 1]);
    } else {
      onSelectItem?.(items[items.length - 1]);
    }
  };

  const handleRandom = () => {
    const randomIndex = Math.floor(Math.random() * items.length);
    onSelectItem?.(items[randomIndex]);
  };

  const getBase64Image = async (url: string): Promise<string | null> => {
    if (!url) return null;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.error('Error loading image base64:', e);
      return null;
    }
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      // Create PDF using A4 dimensions (595.28 x 841.89 points)
      const pdf = new jsPDF('p', 'pt', 'a4');
      const pageHeight = 841.89;
      const pageWidth = 595.28;
      const margin = 40;
      let y = margin;

      // Helper function to handle page overflow
      const checkPageOverflow = (neededHeight: number) => {
        if (y + neededHeight > pageHeight - margin) {
          pdf.addPage();
          drawPageBorderAndFooter();
          y = margin + 20;
        }
      };

      const drawPageBorderAndFooter = () => {
        // Draw thin page border
        pdf.setDrawColor(226, 232, 240); // slate-200
        pdf.setLineWidth(1);
        pdf.rect(margin - 10, margin - 10, pageWidth - 2 * margin + 20, pageHeight - 2 * margin + 20);

        // Draw page footer
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184); // slate-400
        pdf.text('Generated by Character Archive Studio', margin, pageHeight - 25);
        
        const pageCount = pdf.getNumberOfPages();
        pdf.text(`Page ${pageCount}`, pageWidth - margin - 30, pageHeight - 25);
      };

      // Draw initial page border and footer
      drawPageBorderAndFooter();

      // TITLE BANNER
      pdf.setFillColor(15, 23, 42); // slate-900 (dark accent banner)
      pdf.rect(margin, y, pageWidth - 2 * margin, 60, 'F');
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(255, 255, 255);
      pdf.text('CHARACTER ARCHIVE STATUS SHEET', margin + 15, y + 36);

      y += 80;

      // GENERAL DETAILS SECTION
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(15, 23, 42); // slate-900
      pdf.text('Archive Item Summary', margin, y);
      y += 15;

      // Draw horizontal separator
      pdf.setDrawColor(15, 23, 42);
      pdf.setLineWidth(1.5);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 15;

      // Item attributes
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(71, 85, 105); // slate-600
      pdf.text('Original Name:', margin, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(15, 23, 42);
      pdf.text(item.originalName || 'N/A', margin + 90, y);
      y += 18;

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(71, 85, 105);
      pdf.text('Type:', margin, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(15, 23, 42);
      pdf.text(item.type === 'image' ? 'Image File' : 'Text Document', margin + 90, y);
      y += 18;

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(71, 85, 105);
      pdf.text('Art Style:', margin, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(15, 23, 42);
      pdf.text(item.artStyle || 'N/A', margin + 90, y);
      y += 18;

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(71, 85, 105);
      pdf.text('Medium:', margin, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(15, 23, 42);
      pdf.text(item.medium || 'N/A', margin + 90, y);
      y += 18;

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(71, 85, 105);
      pdf.text('Drawing Rating:', margin, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(15, 23, 42);
      pdf.text(item.rating ? `${item.rating}/10 (${item.rating * 10}% Complete)` : 'N/A', margin + 90, y);
      y += 18;

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(71, 85, 105);
      pdf.text('Description:', margin, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(15, 23, 42);
      
      const descLines = pdf.splitTextToSize(item.description || 'No description provided.', pageWidth - 2 * margin - 90);
      pdf.text(descLines, margin + 90, y);
      y += (descLines.length * 12) + 15;

      // ATTACH THE IMAGE IF TYPE IS IMAGE
      if (item.type === 'image') {
        checkPageOverflow(180);
        
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(15, 23, 42);
        pdf.text('Visual Preview', margin, y);
        y += 10;
        
        // Draw light box outline for image
        pdf.setDrawColor(226, 232, 240);
        pdf.rect(margin, y, 180, 130);

        try {
          const base64Img = await getBase64Image(item.content);
          if (base64Img) {
            const format = base64Img.includes('image/png') ? 'PNG' : 'JPEG';
            pdf.addImage(base64Img, format, margin + 5, y + 5, 170, 120);
          } else {
            pdf.setFont('helvetica', 'italic');
            pdf.setFontSize(9);
            pdf.setTextColor(148, 163, 184);
            pdf.text('Image preview skipped (Blob/CORS limitations)', margin + 15, y + 65);
          }
        } catch (imgErr) {
          console.error('Failed to embed image in PDF:', imgErr);
          pdf.setFont('helvetica', 'italic');
          pdf.setFontSize(9);
          pdf.setTextColor(148, 163, 184);
          pdf.text('Image preview skipped', margin + 15, y + 65);
        }

        y += 145;
      }

      // CHARACTERS SECTION
      checkPageOverflow(80);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(15, 23, 42);
      pdf.text('Character & Subject Breakdown', margin, y);
      y += 15;

      pdf.setDrawColor(15, 23, 42);
      pdf.setLineWidth(1.5);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 20;

      if (characters.length === 0) {
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(10);
        pdf.setTextColor(100, 116, 139);
        pdf.text('No character records found in this archive sheet.', margin, y);
        y += 20;
      } else {
        for (const char of characters) {
          const charDescLines = pdf.splitTextToSize(char.description || 'No description.', pageWidth - 2 * margin - 30);
          const neededHeight = 110 + (charDescLines.length * 12);
          
          checkPageOverflow(neededHeight);

          // Draw Card background box
          pdf.setFillColor(248, 250, 252); // slate-50
          pdf.setDrawColor(226, 232, 240); // slate-200
          pdf.setLineWidth(1);
          pdf.rect(margin, y, pageWidth - 2 * margin, neededHeight - 15, 'FD');

          let cardY = y + 20;

          // Character title
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(11);
          pdf.setTextColor(15, 23, 42);
          pdf.text(char.name || 'Unnamed Character', margin + 15, cardY);

          // Draw status tag
          const statusText = char.status || 'Unsorted';
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8);
          pdf.setTextColor(255, 255, 255);
          
          let tagColor = [100, 116, 139]; // grey
          if (statusText === 'Sorted') tagColor = [16, 185, 129]; // emerald
          if (statusText === 'Duplicate') tagColor = [239, 68, 68]; // red
          
          pdf.setFillColor(tagColor[0], tagColor[1], tagColor[2]);
          
          const tagWidth = pdf.getTextWidth(statusText) + 12;
          pdf.rect(pageWidth - margin - tagWidth - 15, cardY - 10, tagWidth, 14, 'F');
          pdf.text(statusText, pageWidth - margin - tagWidth - 9, cardY);

          cardY += 20;

          // Attributes line
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(9);
          pdf.setTextColor(71, 85, 105);
          pdf.text('Gender:', margin + 15, cardY);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(15, 23, 42);
          pdf.text(char.gender || 'N/A', margin + 60, cardY);

          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(71, 85, 105);
          pdf.text('Species:', margin + 150, cardY);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(15, 23, 42);
          pdf.text(char.species || 'N/A', margin + 200, cardY);

          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(71, 85, 105);
          pdf.text('Entity:', margin + 320, cardY);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(15, 23, 42);
          pdf.text(char.entityType || 'Character', margin + 360, cardY);

          cardY += 15;

          // Completion rating
          if (char.completionRating) {
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(71, 85, 105);
            pdf.text('Completion:', margin + 15, cardY);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(16, 185, 129);
            pdf.text(char.completionRating, margin + 80, cardY);
            cardY += 15;
          }

          // Palette drawing (squares!)
          if (char.colorPalette && char.colorPalette.length > 0) {
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(71, 85, 105);
            pdf.text('Palette:', margin + 15, cardY + 5);

            let paletteX = margin + 65;
            char.colorPalette.forEach(hex => {
              try {
                const cleanHex = hex.replace('#', '');
                const r = parseInt(cleanHex.substring(0, 2), 16);
                const g = parseInt(cleanHex.substring(2, 4), 16);
                const b = parseInt(cleanHex.substring(4, 6), 16);
                
                if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
                  pdf.setFillColor(r, g, b);
                  pdf.setDrawColor(203, 213, 225);
                  pdf.rect(paletteX, cardY - 3, 12, 12, 'FD');
                  paletteX += 18;
                }
              } catch (palErr) {
                console.error('Invalid hex color for PDF:', hex);
              }
            });
            cardY += 18;
          }

          // Separator inside card
          pdf.setDrawColor(226, 232, 240);
          pdf.line(margin + 15, cardY, pageWidth - margin - 15, cardY);
          cardY += 15;

          // Description
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          pdf.setTextColor(71, 85, 105);
          pdf.text(charDescLines, margin + 15, cardY);

          y += neededHeight;
        }
      }

      pdf.save(`CharArchive_${item.originalName.replace(/[^a-z0-9_-]/gi, '_')}.pdf`);
      playNotificationSound();
    } catch (err) {
      console.error('Error generating native PDF:', err);
      alert('Error generating PDF: ' + (err as Error).message);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportJSON = () => {
    try {
      const dataStr = JSON.stringify({ item, characters }, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `CharArchive_${item.originalName.replace(/[^a-z0-9_-]/gi, '_')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      playNotificationSound();
    } catch (err) {
      alert('Failed to export JSON: ' + (err as Error).message);
    }
  };

  const handleExportMarkdown = () => {
    try {
      let md = `# Character Archive Status Sheet: ${item.originalName}\n\n`;
      md += `**Description**: ${item.description || 'N/A'}\n\n`;
      md += `## Metadata\n`;
      md += `- **Art Style**: ${item.artStyle || 'N/A'}\n`;
      md += `- **Medium**: ${item.medium || 'N/A'}\n`;
      md += `- **Drawing Rating**: ${item.rating ? `${item.rating}/10 (${item.rating * 10}% Complete)` : 'N/A'}\n`;
      md += `- **Detected Characters**: ${item.charactersCount || 0}\n\n`;

      md += `## Character Breakdown\n\n`;
      if (characters.length === 0) {
        md += `*No character records found.*\n`;
      } else {
        characters.forEach((char, index) => {
          md += `### ${index + 1}. ${char.name}\n`;
          md += `- **Status**: ${char.status || 'Unsorted'}\n`;
          md += `- **Gender**: ${char.gender || 'N/A'}\n`;
          md += `- **Species/Material**: ${char.species || 'N/A'}\n`;
          md += `- **Entity Type**: ${char.entityType || 'Character'}\n`;
          if (char.completionRating) {
            md += `- **Completion**: ${char.completionRating}\n`;
          }
          if (char.colorPalette && char.colorPalette.length > 0) {
            md += `- **Color Palette**: ${char.colorPalette.map(c => `\`${c}\``).join(', ')}\n`;
          }
          md += `\n**Description**:\n${char.description || 'No description provided.'}\n\n`;
          md += `---\n\n`;
        });
      }

      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `CharArchive_${item.originalName.replace(/[^a-z0-9_-]/gi, '_')}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      playNotificationSound();
    } catch (err) {
      alert('Failed to export Markdown: ' + (err as Error).message);
    }
  };

  const handleDownloadOriginal = () => {
    try {
      const link = document.createElement('a');
      link.href = item.content;
      link.download = item.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      playNotificationSound();
    } catch (err) {
      alert('Failed to download original file: ' + (err as Error).message);
    }
  };

  const handleCloudExport = async () => {
    setIsExportingCloud(true);
    setDocUrl(null);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        alert('You must sign in with Google first to save to Workspace.');
        return;
      }

      let textContent = `Character Archive - ${item.originalName}\n\n`;
      textContent += `Description: ${item.description || 'N/A'}\n`;
      textContent += `Art Style: ${item.artStyle || 'N/A'}\n`;
      textContent += `Medium: ${item.medium || 'N/A'}\n`;
      textContent += `Rating: ${item.rating ? item.rating + '/10' : 'N/A'}\n`;
      textContent += `Characters Detected: ${item.charactersCount || 0}\n\n`;

      if (characters.length > 0) {
        textContent += `--- Character Breakdown ---\n\n`;
        characters.forEach((c, i) => {
          textContent += `Character ${i + 1}: ${c.name}\n`;
          textContent += `Status: ${c.status}\n`;
          textContent += `Gender: ${c.gender}\n`;
          textContent += `Species: ${c.species}\n`;
          textContent += `Description: ${c.description}\n\n`;
        });
      }

      const res = await fetch('/api/export-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: item.originalName,
          text: textContent,
          accessToken
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (data.url) {
        setDocUrl(data.url);
        playNotificationSound();
      }
    } catch(err) {
      console.error(err);
      alert('Error exporting to Google Docs: ' + (err as Error).message);
    } finally {
      setIsExportingCloud(false);
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-4">
        <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to Profile
        </button>
        <CharacterEditor 
          item={item}
          characters={characters}
          setCharacters={setCharacters}
          setItems={setItems}
          onClose={() => setIsEditing(false)}
          onSave={(updatedChars) => {
            setIsEditing(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto print:max-w-none print:bg-white print:text-black">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-2 hover:bg-secondary rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1 bg-secondary/50 rounded-full p-1">
            <button onClick={handlePrev} className="p-1.5 hover:bg-background rounded-full transition-colors" title="Previous">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={handleRandom} className="p-1.5 hover:bg-background rounded-full transition-colors" title="Random">
              <Shuffle className="w-4 h-4" />
            </button>
            <button onClick={handleNext} className="p-1.5 hover:bg-background rounded-full transition-colors" title="Next">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {item.createdAt && (
            <span className="text-xs text-muted-foreground mr-2">Uploaded: {new Date(item.createdAt).toLocaleDateString()}</span>
          )}
          {docUrl && (
            <a href={docUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline mr-2">
              <ExternalLink className="w-4 h-4" /> Open in Docs
            </a>
          )}
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-opacity-80 transition-opacity text-sm font-medium cursor-pointer"
          >
            <Edit className="w-4 h-4" />
            Edit Characters
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-opacity-90 transition-opacity text-sm font-medium cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download & Export
              <ChevronDown className="w-4 h-4 opacity-70" />
            </button>
            {showDownloadMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowDownloadMenu(false)} 
                />
                <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-card border border-border ring-1 ring-black ring-opacity-5 divide-y divide-border z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowDownloadMenu(false);
                        handleExportPDF();
                      }}
                      disabled={isExportingPDF}
                      className="group flex items-center w-full px-4 py-2.5 text-sm text-foreground hover:bg-secondary/60 transition-colors gap-3 cursor-pointer text-left disabled:opacity-50"
                    >
                      <FileText className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                      <div className="text-left">
                        <p className="font-medium text-xs">Export PDF Document</p>
                        <p className="text-[9px] text-muted-foreground">Crisp print-ready vector layout</p>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setShowDownloadMenu(false);
                        handleExportMarkdown();
                      }}
                      className="group flex items-center w-full px-4 py-2.5 text-sm text-foreground hover:bg-secondary/60 transition-colors gap-3 cursor-pointer text-left"
                    >
                      <FileCode className="w-4 h-4 text-green-500 group-hover:scale-110 transition-transform" />
                      <div className="text-left">
                        <p className="font-medium text-xs">Export Markdown (.md)</p>
                        <p className="text-[9px] text-muted-foreground">Perfect for Obsidian & Notion</p>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setShowDownloadMenu(false);
                        handleExportJSON();
                      }}
                      className="group flex items-center w-full px-4 py-2.5 text-sm text-foreground hover:bg-secondary/60 transition-colors gap-3 cursor-pointer text-left"
                    >
                      <FileJson className="w-4 h-4 text-purple-500 group-hover:scale-110 transition-transform" />
                      <div className="text-left">
                        <p className="font-medium text-xs">Export JSON Metadata</p>
                        <p className="text-[9px] text-muted-foreground">Raw character sheets dataset</p>
                      </div>
                    </button>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowDownloadMenu(false);
                        handleDownloadOriginal();
                      }}
                      className="group flex items-center w-full px-4 py-2.5 text-sm text-foreground hover:bg-secondary/60 transition-colors gap-3 cursor-pointer text-left"
                    >
                      <Image className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                      <div className="text-left">
                        <p className="font-medium text-xs">Download Source File</p>
                        <p className="text-[9px] text-muted-foreground">Saves the original uploaded item</p>
                      </div>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <button 
            onClick={handleCloudExport}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-opacity text-sm font-medium disabled:opacity-50 cursor-pointer"
            disabled={isExportingCloud}
          >
            <CloudUpload className="w-4 h-4" />
            {isExportingCloud ? 'Saving...' : 'Save to Workspace'}
          </button>
        </div>
      </div>
      
      <div ref={contentRef} className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4 bg-background text-foreground rounded-lg">
        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm relative group">
          {item.type === 'image' ? (
            <>
              <button
                className="absolute top-2 right-2 z-10 p-2 bg-background/80 backdrop-blur rounded-full hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  window.dispatchEvent(new CustomEvent('crop-archive-image', { detail: { itemId: item.id, src: item.content } }));
                }}
                title="Crop Thumbnail"
              >
                <Crop className="w-5 h-5 text-primary" />
              </button>
              <img 
                src={item.thumbnailContent || item.content} 
                alt={item.originalName} 
                className="w-full h-auto max-h-[60vh] object-contain bg-secondary/50 cursor-zoom-in hover:opacity-95 transition-opacity" 
                onClick={() => window.dispatchEvent(new CustomEvent('expand-image', { detail: { src: item.content } }))}
                title="Click to expand full original image"
              />
            </>
          ) : (
            <div className="w-full h-64 bg-secondary flex items-center justify-center overflow-auto p-4">
              <pre className="text-xs whitespace-pre-wrap">{item.content}</pre>
            </div>
          )}
        </div>
        
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-2">{item.originalName}</h1>
            <p className="text-muted-foreground text-sm">{item.description}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-secondary/50 p-3 rounded-lg">
              <span className="block text-xs text-muted-foreground uppercase tracking-wider mb-1">Art Style</span>
              <span className="font-medium">{item.artStyle || 'N/A'}</span>
            </div>
            <div className="bg-secondary/50 p-3 rounded-lg">
              <span className="block text-xs text-muted-foreground uppercase tracking-wider mb-1">Medium</span>
              <span className="font-medium">{item.medium || 'N/A'}</span>
            </div>
            <div className="bg-secondary/50 p-3 rounded-lg">
              <span className="block text-xs text-muted-foreground uppercase tracking-wider mb-1">Drawing Completion Rating</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {item.rating ? `${item.rating}/10 (${item.rating * 10}% Complete)` : 'N/A'}
              </span>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">Based on render outline & shading detail.</p>
            </div>
            <div className="bg-secondary/50 p-3 rounded-lg">
              <span className="block text-xs text-muted-foreground uppercase tracking-wider mb-1">Characters Detected</span>
              <span className="font-medium">{item.charactersCount || 0}</span>
            </div>
          </div>
          
          {/* BOTTOM DETAILED WORKSPACE SECTION WITH TABS AND PAGES */}
          <div className="border-t pt-6 mt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-3 mb-4">
              <div>
                <h3 className="text-xl font-bold tracking-tight">Character Details Workspace</h3>
                <p className="text-xs text-muted-foreground">Manage profile, subtabs, custom media files, and technical logs for each character.</p>
              </div>
              
              <div className="flex items-center gap-2">
                {characters.length > 0 && (
                  <div className="flex bg-secondary p-1 rounded-lg border gap-1 overflow-x-auto max-w-[200px] sm:max-w-md">
                    {characters.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCharId(c.id)}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                          selectedCharId === c.id 
                            ? 'bg-background shadow-sm text-foreground border border-border/60' 
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
                
                <button
                  onClick={handleAddCharacter}
                  className="px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-md hover:opacity-90 flex items-center gap-1 shadow-sm shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Character</span>
                </button>
              </div>
            </div>

            {characters.length === 0 ? (
              <div className="border-2 border-dashed border-muted-foreground/20 p-8 rounded-xl flex flex-col items-center justify-center text-center gap-3">
                <span className="text-sm font-semibold text-muted-foreground">No characters found for this archive item yet.</span>
                <p className="text-xs text-muted-foreground max-w-sm">Create a dedicated character workspace to organize bio sheets, media files, design sketches, and archival dates.</p>
                <button
                  onClick={handleAddCharacter}
                  className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:opacity-90 flex items-center gap-1 shadow"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Character Sheet</span>
                </button>
              </div>
            ) : (() => {
              const activeChar = characters.find(c => c.id === selectedCharId) || characters[0];
              const charToRender = isEditingChar && editedCharData ? editedCharData : activeChar;
              
              if (!charToRender) return null;

              // Default dates to today if blank
              const displayCreatedDate = charToRender.dateCreated || new Date().toISOString().split('T')[0];
              const displayUploadedDate = charToRender.dateUploaded || new Date().toISOString().split('T')[0];
              const displayCreatedSource = charToRender.dateCreatedSource || 'Added Manually';

              return (
                <div className="bg-card border rounded-xl overflow-hidden shadow-sm animate-fade-in flex flex-col">
                  {/* CHARACTER BANNER HEADER */}
                  {!charToRender.hideBanner ? (
                    <div 
                      className="relative w-full bg-slate-900 overflow-hidden group/banner"
                      style={{ height: charToRender.bannerHeight ? `${charToRender.bannerHeight}px` : '176px' }}
                    >
                      {charToRender.bannerImageSrc ? (
                        <img 
                          src={charToRender.bannerImageSrc} 
                          alt={`${charToRender.name} Banner`} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover/banner:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-slate-950 via-primary/20 to-slate-900 flex flex-col items-center justify-center relative p-4">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06)_0,transparent_100%)] pointer-events-none" />
                          <span className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest mb-1">
                            Character Header Banner
                          </span>
                          <p className="text-[11px] text-muted-foreground/50 max-w-md text-center">
                            Upload a banner image to customize this character's profile section.
                          </p>
                        </div>
                      )}

                      {/* Gradient Overlay for Text Contrast */}
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent pointer-events-none" />

                      {/* Banner Content & Overlay Controls */}
                      <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3 pointer-events-auto">
                        <div className="flex items-center gap-3">
                          {!charToRender.hideIcon && (
                            <div 
                              className="rounded-xl overflow-hidden border-2 border-background shadow-2xl bg-secondary shrink-0"
                              style={{ 
                                width: charToRender.iconSize ? `${charToRender.iconSize}px` : '64px',
                                height: charToRender.iconSize ? `${charToRender.iconSize}px` : '64px'
                              }}
                            >
                              <img 
                                src={charToRender.defaultThumbnailSrc || charToRender.highlightedImageSrc || item.thumbnailContent || item.content} 
                                alt={charToRender.name}
                                className="w-full h-full object-cover" 
                              />
                            </div>
                          )}
                          <div>
                            <h2 className="text-lg sm:text-2xl font-black text-foreground drop-shadow-md flex items-center gap-2">
                              {charToRender.name}
                            </h2>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 uppercase tracking-wider backdrop-blur-md">
                                {charToRender.gender}
                              </span>
                              {charToRender.species && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary/80 text-foreground border border-border uppercase tracking-wider backdrop-blur-md">
                                  {charToRender.species}
                                </span>
                              )}
                              {charToRender.categories?.map(cat => (
                                <span key={cat} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase tracking-wider backdrop-blur-md">
                                  {cat}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Banner Image Buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setShowAlignmentTool(true)}
                            className="px-2.5 py-1 bg-background/90 hover:bg-background text-foreground text-xs font-bold rounded-lg border shadow-md backdrop-blur-md flex items-center gap-1 transition-all cursor-pointer"
                            title="Fine-tune Alignment, Crop & Position"
                          >
                            <Sliders className="w-3 h-3 text-primary" />
                            <span>Align & Crop</span>
                          </button>

                          <button
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/*';
                              input.onchange = (e: any) => {
                                const file = e.target.files[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (readerEvent: any) => {
                                    const src = readerEvent.target.result;
                                    if (isEditingChar && editedCharData) {
                                      setEditedCharData({ ...editedCharData, bannerImageSrc: src });
                                    } else if (setCharacters) {
                                      setCharacters(prev => prev.map(c => c.id === charToRender.id ? { ...c, bannerImageSrc: src } : c));
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              };
                              input.click();
                            }}
                            className="px-2.5 py-1 bg-background/90 hover:bg-background text-foreground text-xs font-bold rounded-lg border shadow-md backdrop-blur-md flex items-center gap-1 transition-all cursor-pointer"
                            title="Upload or Change Banner Image"
                          >
                            <Upload className="w-3 h-3 text-primary" />
                            <span>{charToRender.bannerImageSrc ? 'Change Banner' : 'Upload Banner'}</span>
                          </button>

                          {charToRender.bannerImageSrc && (
                            <button
                              onClick={() => {
                                if (isEditingChar && editedCharData) {
                                  setEditedCharData({ ...editedCharData, bannerImageSrc: undefined });
                                } else if (setCharacters) {
                                  setCharacters(prev => prev.map(c => c.id === charToRender.id ? { ...c, bannerImageSrc: undefined } : c));
                                }
                              }}
                              className="p-1 bg-background/80 hover:bg-destructive hover:text-white text-muted-foreground rounded-lg border shadow-md backdrop-blur-md transition-all cursor-pointer"
                              title="Remove Banner"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-end justify-between gap-3 p-4 bg-background border-b pointer-events-auto">
                      <div className="flex items-center gap-3">
                        {!charToRender.hideIcon && (
                          <div 
                            className="rounded-xl overflow-hidden border border-border shadow-md bg-secondary shrink-0"
                            style={{ 
                              width: charToRender.iconSize ? `${charToRender.iconSize}px` : '64px',
                              height: charToRender.iconSize ? `${charToRender.iconSize}px` : '64px'
                            }}
                          >
                            <img 
                              src={charToRender.defaultThumbnailSrc || charToRender.highlightedImageSrc || item.thumbnailContent || item.content} 
                              alt={charToRender.name}
                              className="w-full h-full object-cover" 
                            />
                          </div>
                        )}
                        <div>
                          <h2 className="text-xl sm:text-2xl font-black text-foreground drop-shadow-sm flex items-center gap-2">
                            {charToRender.name}
                          </h2>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
                              {charToRender.gender}
                            </span>
                            {charToRender.species && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary/80 text-foreground border border-border uppercase tracking-wider">
                                {charToRender.species}
                              </span>
                            )}
                            {charToRender.categories?.map(cat => (
                              <span key={cat} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                                {cat}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* UNIFIED NAVIGATION & ACTIONS BAR */}
                  <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center bg-secondary/30 p-2.5 border-b gap-2.5">
                    {/* Navigation Tabs */}
                    <div className="flex bg-background/80 p-1 rounded-lg border gap-0.5 overflow-x-auto">
                      <button
                        onClick={() => setActiveOuterTab('biography')}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer ${
                          activeOuterTab === 'biography' ? 'bg-primary text-primary-foreground shadow-xs font-bold' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Profile Section
                      </button>
                      <button
                        onClick={() => setActiveOuterTab('bible')}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer ${
                          activeOuterTab === 'bible' ? 'bg-primary text-primary-foreground shadow-xs font-bold' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Character Details
                      </button>
                      <button
                        onClick={() => setActiveOuterTab('media')}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer ${
                          activeOuterTab === 'media' ? 'bg-primary text-primary-foreground shadow-xs font-bold' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Media Assets
                      </button>
                      <button
                        onClick={() => setActiveOuterTab('spreadsheet')}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer ${
                          activeOuterTab === 'spreadsheet' ? 'bg-primary text-primary-foreground shadow-xs font-bold' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Data Sheet
                      </button>
                      <button
                        onClick={() => setActiveOuterTab('technical')}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer ${
                          activeOuterTab === 'technical' ? 'bg-primary text-primary-foreground shadow-xs font-bold' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Technical Specs
                      </button>
                    </div>

                    {/* Integrated AI Assistant & Actions */}
                    <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
                      {/* Compact AI Prompt Input */}
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          value={aiCommandInput}
                          onChange={(e) => setAiCommandInput(e.target.value)}
                          placeholder={isListening ? "Listening..." : "AI prompt..."}
                          className="w-36 sm:w-48 pl-7 pr-10 py-1 bg-background text-xs rounded-lg border outline-none focus:border-primary focus:ring-1 focus:ring-primary font-medium"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleVoiceCommand(aiCommandInput);
                              setAiCommandInput('');
                            }
                          }}
                          disabled={isProcessingAi}
                        />
                        <Sparkles className="absolute left-2 w-3.5 h-3.5 text-primary" />
                        {aiCommandInput && (
                          <button 
                            onClick={() => { handleVoiceCommand(aiCommandInput); setAiCommandInput(''); }} 
                            className="absolute right-1 text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-bold cursor-pointer"
                          >
                            Run
                          </button>
                        )}
                      </div>

                      {/* Microphone voice button */}
                      <button
                        onClick={startSpeechRecognition}
                        className={`p-1 rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
                          isListening 
                            ? 'bg-red-500 text-white animate-bounce' 
                            : 'bg-background hover:bg-secondary text-foreground'
                        }`}
                        title="Voice command"
                        disabled={isProcessingAi}
                      >
                        <Mic className={`w-3.5 h-3.5 ${isListening ? 'animate-pulse' : ''}`} />
                      </button>

                      {/* Auto-Generate button */}
                      <button
                        onClick={() => handleAutoGenerateProfile()}
                        disabled={isProcessingAi}
                        className="px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-xs font-bold rounded-lg flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer"
                        title="Auto-generate profile details"
                      >
                        {isProcessingAi ? (
                          <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        <span>{isProcessingAi ? 'Generating...' : 'Auto-Gen'}</span>
                      </button>

                      {/* Profile Edit Actions */}
                      {isEditingChar ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={handleSaveCharChanges}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Save</span>
                          </button>
                          <button
                            onClick={() => setIsEditingChar(false)}
                            className="px-2.5 py-1 bg-background hover:bg-secondary text-foreground text-xs font-semibold rounded-lg border flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditedCharData({ ...activeChar });
                              setIsEditingChar(true);
                            }}
                            className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit Profile</span>
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete "${activeChar.name}"?`)) {
                                if (setCharacters) {
                                  setCharacters(prev => prev.filter(c => c.id !== activeChar.id));
                                  setSelectedCharId(null);
                                }
                              }
                            }}
                            className="px-2.5 py-1 bg-destructive/10 hover:bg-destructive text-destructive hover:text-white text-xs font-semibold rounded-lg border border-destructive/20 flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ACTIVE TAB VIEW CONTENT */}
                  <div className="p-5 flex-1">
                    
                    {/* BIOGRAPHY TAB */}
                    {activeOuterTab === 'biography' && (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                        {/* Avatar Column */}
                        <div className="md:col-span-4 flex flex-col items-center gap-3 bg-secondary/10 p-4 rounded-xl border border-dashed shadow-inner">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Portrait Thumbnail</span>
                          <div 
                            className="rounded-lg overflow-hidden bg-secondary relative group/portrait border shadow-sm flex items-center justify-center"
                            style={{ 
                              aspectRatio: portraitRatio === '3:4' ? '3/4' : portraitRatio === '1:1' ? '1/1' : portraitRatio === '16:9' ? '16/9' : portraitRatio === '9:16' ? '9/16' : '4/3',
                              width: '160px',
                              height: portraitRatio === '9:16' ? '240px' : portraitRatio === '3:4' ? '213px' : '160px'
                            }}
                          >
                            <img 
                              src={charToRender.defaultThumbnailSrc || charToRender.highlightedImageSrc || item.thumbnailContent || item.content} 
                              alt="Portrait Thumbnail" 
                              className="w-full h-full transition-transform duration-300"
                              style={{ objectFit: portraitFit }}
                            />
                            
                            {/* Actions overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/portrait:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button 
                                className="p-1.5 bg-background hover:bg-secondary rounded-lg border shadow-sm text-foreground text-xs font-semibold flex items-center gap-1 cursor-pointer"
                                onClick={() => {
                                  const input = document.createElement('input');
                                  input.type = 'file';
                                  input.accept = 'image/*';
                                  input.onchange = (e: any) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = (readerEvent: any) => {
                                        const src = readerEvent.target.result;
                                        if (isEditingChar && editedCharData) {
                                          setEditedCharData({ ...editedCharData, highlightedImageSrc: src });
                                        } else if (setCharacters) {
                                          setCharacters(prev => prev.map(c => c.id === charToRender.id ? { ...c, highlightedImageSrc: src } : c));
                                        }
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  };
                                  input.click();
                                }}
                                title="Upload Custom Portrait Image"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>Upload</span>
                              </button>
                              
                              <button 
                                className="p-1.5 bg-background hover:bg-secondary rounded-lg border shadow-sm text-foreground text-xs font-semibold flex items-center gap-1 cursor-pointer"
                                onClick={() => {
                                  window.dispatchEvent(new CustomEvent('crop-character-image', { 
                                    detail: { 
                                      charId: charToRender.id, 
                                      src: charToRender.defaultThumbnailSrc || charToRender.highlightedImageSrc || item.content, 
                                      slotName: "highlightedImageSrc" 
                                    } 
                                  }));
                                }}
                                title="Crop This Portrait Image"
                              >
                                <Crop className="w-3.5 h-3.5" />
                                <span>Crop</span>
                              </button>
                            </div>
                          </div>
                          
                          {/* PORTRAIT DISPLAY CONTROLS */}
                          <div className="w-full space-y-2 border-t pt-3 mt-1">
                            <div>
                              <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">Aspect Ratio</label>
                              <div className="grid grid-cols-5 gap-1">
                                {['1:1', '3:4', '4:3', '16:9', '9:16'].map(ratio => (
                                  <button
                                    key={ratio}
                                    onClick={() => {
                                      setPortraitRatio(ratio);
                                      localStorage.setItem("char_portrait_ratio", ratio);
                                    }}
                                    className={`px-1 py-0.5 text-[9px] font-bold rounded border transition-all cursor-pointer ${
                                      portraitRatio === ratio
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-background hover:bg-secondary text-muted-foreground'
                                    }`}
                                  >
                                    {ratio}
                                  </button>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">Fit Type</label>
                              <div className="grid grid-cols-2 gap-2">
                                {(['cover', 'contain'] as const).map(fit => (
                                  <button
                                    key={fit}
                                    onClick={() => {
                                      setPortraitFit(fit);
                                      localStorage.setItem("char_portrait_fit", fit);
                                    }}
                                    className={`px-2 py-1 text-xs font-semibold rounded border transition-all capitalize cursor-pointer ${
                                      portraitFit === fit
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-background hover:bg-secondary text-muted-foreground'
                                    }`}
                                  >
                                    {fit}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] text-muted-foreground text-center">Interactive presets prevent stretching or squishing</span>
                        </div>

                        {/* Text Fields Column */}
                        <div className="md:col-span-8 space-y-4">
                          {isEditingChar ? (
                            <div className="space-y-3">
                              <div>
                                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Character Name</label>
                                <input
                                  type="text"
                                  value={editedCharData?.name || ''}
                                  onChange={(e) => setEditedCharData({ ...editedCharData!, name: e.target.value })}
                                  className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary font-bold"
                                />
                              </div>
                              
                              <div>
                                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Brief Backstory Summary</label>
                                <textarea
                                  value={editedCharData?.description || ''}
                                  onChange={(e) => setEditedCharData({ ...editedCharData!, description: e.target.value })}
                                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm h-24 resize-none outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                                />
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div>
                                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Gender</label>
                                  <select
                                    value={editedCharData?.gender || 'Others'}
                                    onChange={(e) => setEditedCharData({ ...editedCharData!, gender: e.target.value as Gender })}
                                    className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                                  >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Others">Others</option>
                                    <option value="Objects">Objects</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Species</label>
                                  <input
                                    type="text"
                                    value={editedCharData?.species || ''}
                                    onChange={(e) => setEditedCharData({ ...editedCharData!, species: e.target.value })}
                                    className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                                  />
                                </div>

                                <div>
                                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Entity Type</label>
                                  <input
                                    type="text"
                                    value={editedCharData?.entityType || ''}
                                    onChange={(e) => setEditedCharData({ ...editedCharData!, entityType: e.target.value })}
                                    className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                                    placeholder="e.g. Hero, Animal"
                                  />
                                </div>

                                <div>
                                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Status</label>
                                  <select
                                    value={editedCharData?.status || 'Unsorted'}
                                    onChange={(e) => setEditedCharData({ ...editedCharData!, status: e.target.value as Status })}
                                    className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                                  >
                                    <option value="Sorted">Sorted</option>
                                    <option value="Unsorted">Unsorted</option>
                                    <option value="Duplicate">Duplicate</option>
                                  </select>
                                </div>
                              </div>

                              {/* Palette & Categories Edit Section */}
                              <div className="border-t pt-3 mt-3 space-y-3">
                                <div>
                                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1.5">Assigned Custom Categories</label>
                                  <div className="flex flex-wrap gap-1.5">
                                    {(() => {
                                      let savedCats: string[] = ["Main Cast", "Villains", "Side Characters"];
                                      try {
                                        const raw = localStorage.getItem("app_custom_categories");
                                        if (raw) savedCats = JSON.parse(raw);
                                      } catch {}

                                      const selected = editedCharData?.categories || [];
                                      const allAvailable = Array.from(new Set([...savedCats, ...selected]));

                                      return allAvailable.map((cat: string) => {
                                        const isChecked = selected.includes(cat);
                                        return (
                                          <button
                                            key={cat}
                                            type="button"
                                            onClick={() => {
                                              const updated = isChecked
                                                ? selected.filter(c => c !== cat)
                                                : [...selected, cat];
                                              setEditedCharData({ ...editedCharData!, categories: updated });
                                            }}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 cursor-pointer ${
                                              isChecked
                                                ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40 shadow-xs"
                                                : "bg-background hover:bg-secondary text-muted-foreground border-border"
                                            }`}
                                          >
                                            <span>{isChecked ? "✓" : "＋"}</span>
                                            <span>{cat}</span>
                                          </button>
                                        );
                                      });
                                    })()}
                                  </div>
                                </div>

                                <div>
                                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-2">Color Palette</label>
                                  <div className="flex flex-wrap items-center gap-2">
                                    {editedCharData?.colorPalette?.map((color, i) => (
                                      <div key={i} className="group relative w-6 h-6 rounded-md border border-border shadow-sm shrink-0" style={{ backgroundColor: color }}>
                                        <button 
                                          type="button"
                                          onClick={() => removeColor(color)}
                                          className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity border"
                                        >
                                          <X className="w-1.5 h-1.5" />
                                        </button>
                                      </div>
                                    ))}
                                    
                                    <input 
                                      type="color" 
                                      onChange={(e) => addColor(e.target.value)}
                                      className="w-7 h-7 rounded-md cursor-pointer border p-0.5 bg-background shadow-sm"
                                      title="Add color to palette"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-xl font-bold flex items-center gap-2">
                                  <span>{charToRender.name}</span>
                                  <button
                                    onClick={() => {
                                      if (setCharacters) {
                                        setCharacters(prev => prev.map(c => c.id === charToRender.id ? { ...c, isFavorite: !c.isFavorite } : c));
                                      }
                                    }}
                                    onContextMenu={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setFavoriteModalTargetChar(charToRender);
                                      setIsFavIconModalOpen(true);
                                    }}
                                    className="p-1 hover:bg-secondary rounded-full cursor-pointer flex items-center justify-center"
                                    title={charToRender.isFavorite ? 'Remove from favorites (Right-click to change icon)' : 'Add to favorites (Right-click to customize icon)'}
                                  >
                                    <RenderFavoriteIcon 
                                      iconId={charToRender.favoriteIcon} 
                                      customColor={charToRender.favoriteColor} 
                                      isFavorite={!!charToRender.isFavorite} 
                                      size="sm" 
                                    />
                                  </button>
                                </h4>
                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                  <span className="text-xs bg-primary/10 text-primary font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">{charToRender.status}</span>
                                  {charToRender.categories?.map(cat => (
                                    <span key={cat} className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                      {cat}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="relative bg-secondary/5 p-3 rounded-lg border border-border/40">
                                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{charToRender.description || 'No biography written yet.'}</p>
                                <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/30 flex-wrap gap-2">
                                  <TTSReader text={charToRender.description || charToRender.name} label="Listen to Backstory" size="sm" />
                                  <button
                                    onClick={() => setActiveOuterTab('bible')}
                                    className="px-2.5 py-1 text-xs font-bold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-md transition-all flex items-center gap-1 cursor-pointer"
                                  >
                                    <span>More Information on {charToRender.name}</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                                <div className="bg-secondary/40 p-2.5 rounded-lg border">
                                  <span className="block text-[10px] text-muted-foreground uppercase font-semibold">Gender</span>
                                  <span className="text-sm font-bold">{charToRender.gender}</span>
                                </div>
                                <div className="bg-secondary/40 p-2.5 rounded-lg border">
                                  <span className="block text-[10px] text-muted-foreground uppercase font-semibold">Species</span>
                                  <span className="text-sm font-bold">{charToRender.species || 'N/A'}</span>
                                </div>
                                <div className="bg-secondary/40 p-2.5 rounded-lg border">
                                  <span className="block text-[10px] text-muted-foreground uppercase font-semibold">Entity Type</span>
                                  <span className="text-sm font-bold">{charToRender.entityType || 'Character'}</span>
                                </div>
                                <div className="bg-secondary/40 p-2.5 rounded-lg border">
                                  <span className="block text-[10px] text-muted-foreground uppercase font-semibold">Completion</span>
                                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{charToRender.completionRating || 'N/A'}</span>
                                </div>
                              </div>

                              {charToRender.colorPalette && charToRender.colorPalette.length > 0 && (
                                <div className="pt-2">
                                  <span className="block text-[10px] text-muted-foreground uppercase font-semibold mb-2">Color Palette</span>
                                  <div className="flex gap-2">
                                    {charToRender.colorPalette.map(hex => (
                                      <ColorCircle key={hex} hex={hex} />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* CHARACTER BIBLE TAB (PAGED DETAILS SECTION) */}
                    {activeOuterTab === 'bible' && (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Subtabs/Pages navigation list */}
                        <div className="md:col-span-1 flex flex-col gap-2 border-r pr-4">
                          <div className="flex items-center justify-between border-b pb-2">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Bible Hierarchy</span>
                            {isEditingChar && (
                              <button
                                onClick={() => {
                                  const title = prompt("Enter parent page title:");
                                  if (title) handleAddBiblePage(title);
                                }}
                                className="p-1 hover:bg-secondary rounded text-primary cursor-pointer"
                                title="Add New Main Page"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          
                          <div className="space-y-1.5 overflow-y-auto max-h-[400px]">
                            {(() => {
                              const allBiblePages = charToRender.biblePages || [
                                { id: 'executive-concepts', title: 'Executive Concepts', content: '' },
                                { id: 'core-premise', title: 'Core Premise', content: '' },
                                { id: 'height-build', title: 'Height & Build', content: '' },
                                { id: 'personality-speech', title: 'Personality & Speech', content: '' }
                              ];
                              const parentPages = allBiblePages.filter(p => !p.parentId);

                              return parentPages.map(parent => {
                                const children = allBiblePages.filter(p => p.parentId === parent.id);
                                const isCollapsed = collapsedPages[parent.id];
                                const isActive = activeBibleSubTab === parent.id;
                                
                                return (
                                  <div key={parent.id} className="space-y-1">
                                    <div className="group flex items-center justify-between rounded-lg hover:bg-secondary/40 pr-1.5">
                                      <button
                                        onClick={() => setActiveBibleSubTab(parent.id)}
                                        className={`flex-1 text-left px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                                          isActive 
                                            ? 'bg-primary/10 text-primary font-bold' 
                                            : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                      >
                                        {children.length > 0 && (
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setCollapsedPages(prev => ({ ...prev, [parent.id]: !prev[parent.id] }));
                                            }}
                                            className="p-0.5 hover:bg-secondary rounded text-muted-foreground cursor-pointer"
                                          >
                                            <ChevronDown className={`w-3 h-3 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                                          </button>
                                        )}
                                        <span className="truncate">{parent.title}</span>
                                      </button>
                                      
                                      {isEditingChar && (
                                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                                          <button
                                            onClick={() => {
                                              const title = prompt("Enter subpage title:");
                                              if (title) handleAddBiblePage(title, parent.id);
                                            }}
                                            className="p-1 hover:bg-secondary rounded text-sky-600 cursor-pointer"
                                            title="Add Subpage"
                                          >
                                            <Plus className="w-3 h-3" />
                                          </button>
                                          <button
                                            onClick={() => {
                                              const newTitle = prompt("Rename page:", parent.title);
                                              if (newTitle) handleRenameBiblePage(parent.id, newTitle);
                                            }}
                                            className="p-1 hover:bg-secondary rounded text-amber-600 cursor-pointer"
                                            title="Rename Page"
                                          >
                                            <Edit className="w-3 h-3" />
                                          </button>
                                          {!['executive-concepts', 'core-premise', 'height-build', 'personality-speech'].includes(parent.id) && (
                                            <button
                                              onClick={() => {
                                                if (confirm("Are you sure you want to delete this page and all its subpages?")) {
                                                  handleDeleteBiblePage(parent.id);
                                                }
                                              }}
                                              className="p-1 hover:bg-secondary rounded text-red-500 cursor-pointer"
                                              title="Delete Page"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Subpages children */}
                                    {!isCollapsed && children.length > 0 && (
                                      <div className="pl-4 border-l ml-3.5 space-y-1 mt-0.5">
                                        {children.map(child => {
                                          const isChildActive = activeBibleSubTab === child.id;
                                          return (
                                            <div key={child.id} className="group flex items-center justify-between rounded-lg hover:bg-secondary/40 pr-1.5">
                                              <button
                                                onClick={() => setActiveBibleSubTab(child.id)}
                                                className={`flex-1 text-left px-2.5 py-1 text-[11px] font-medium rounded transition-all truncate cursor-pointer ${
                                                  isChildActive 
                                                    ? 'bg-primary/5 text-primary font-bold' 
                                                    : 'text-muted-foreground hover:text-foreground'
                                                }`}
                                              >
                                                └ {child.title}
                                              </button>
                                              
                                              {isEditingChar && (
                                                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                                                  <button
                                                    onClick={() => {
                                                      const newTitle = prompt("Rename subpage:", child.title);
                                                      if (newTitle) handleRenameBiblePage(child.id, newTitle);
                                                    }}
                                                    className="p-1 hover:bg-secondary rounded text-amber-600 cursor-pointer"
                                                    title="Rename Subpage"
                                                  >
                                                    <Edit className="w-3 h-3" />
                                                  </button>
                                                  <button
                                                    onClick={() => {
                                                      if (confirm("Are you sure you want to delete this subpage?")) {
                                                        handleDeleteBiblePage(child.id);
                                                      }
                                                    }}
                                                    className="p-1 hover:bg-secondary rounded text-red-500 cursor-pointer"
                                                    title="Delete Subpage"
                                                  >
                                                    <Trash2 className="w-3 h-3" />
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>

                        {/* Page content display block */}
                        <div className="md:col-span-3 min-h-[220px]">
                          {(() => {
                            const allPages = charToRender.biblePages || [];
                            const activePage = allPages.find(p => p.id === activeBibleSubTab) || { id: activeBibleSubTab, title: activeBibleSubTab, content: '' };

                            return (
                              <div className="space-y-4">
                                <div className="flex items-center justify-between border-b pb-1.5 flex-wrap gap-2">
                                  <h4 className="text-md font-bold text-foreground uppercase tracking-wide">
                                    {activePage.title}
                                  </h4>
                                  {!isEditingChar && activePage.content && (
                                    <div className="flex items-center gap-2">
                                      <TTSReader text={activePage.content} label="Read Page Aloud" size="sm" />
                                      <button
                                        onClick={() => setActiveBookFile({ title: activePage.title, content: activePage.content })}
                                        className="px-2 py-1 text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground rounded-md border flex items-center gap-1 cursor-pointer"
                                        title="Open in PDF Book Reader mode"
                                      >
                                        <BookOpen className="w-3.5 h-3.5 text-primary" />
                                        <span>Read as Book</span>
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {isEditingChar ? (
                                  <textarea
                                    value={activePage.content}
                                    onChange={(e) => handleUpdateBiblePage(e.target.value)}
                                    className="w-full bg-background border border-border rounded-lg p-3 text-sm h-48 outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                                    placeholder={`Write character guidelines or details about ${activePage.title}...`}
                                  />
                                ) : (
                                  <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap bg-secondary/5 p-4 rounded-xl border border-dashed">
                                    {activePage.content || `No details or pages have been recorded for ${activePage.title} yet. Open Edit Profile to record notes here.`}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {/* MEDIA ASSETS TAB */}
                    {activeOuterTab === 'media' && (
                      <div className="space-y-6">
                        {/* Sub-nav for media types */}
                        <div className="flex bg-secondary p-1 rounded-lg border gap-0.5 w-max">
                          <button
                            onClick={() => setActiveMediaSubTab('images')}
                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                              activeMediaSubTab === 'images' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            <Image className="w-3.5 h-3.5" />
                            <span>Cropped Images ({charToRender.subImages?.length || 0})</span>
                          </button>
                          <button
                            onClick={() => setActiveMediaSubTab('audios')}
                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                              activeMediaSubTab === 'audios' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Voice Files ({charToRender.audios?.length || 0})</span>
                          </button>
                          <button
                            onClick={() => setActiveMediaSubTab('videos')}
                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                              activeMediaSubTab === 'videos' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Videos & GIFs ({charToRender.videos?.length || 0})</span>
                          </button>
                        </div>

                        {/* SubImages View */}
                        {activeMediaSubTab === 'images' && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                              {(charToRender.subImages || []).map((subImg) => (
                                <div key={subImg.id} className="group/subimg relative bg-secondary/15 border rounded-lg overflow-hidden flex flex-col">
                                  <div className="aspect-square relative overflow-hidden bg-black flex items-center justify-center">
                                    <img src={subImg.src} alt={subImg.title} className="w-full h-full object-cover group-hover/subimg:scale-105 transition-transform" referrerPolicy="no-referrer" />
                                  </div>
                                  <div className="p-2 flex-1 flex flex-col">
                                    <span className="font-bold text-xs truncate block">{subImg.title}</span>
                                    <span className="text-[10px] text-muted-foreground truncate">{subImg.description}</span>
                                  </div>
                                  {isEditingChar && (
                                    <button
                                      onClick={() => {
                                        const subImages = (editedCharData?.subImages || []).filter(si => si.id !== subImg.id);
                                        setEditedCharData({ ...editedCharData!, subImages });
                                      }}
                                      className="absolute top-2 right-2 p-1 bg-background/80 hover:bg-destructive text-muted-foreground hover:text-white rounded-full border shadow"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              ))}
                              {(charToRender.subImages || []).length === 0 && (
                                <div className="col-span-full border border-dashed rounded-lg p-6 text-center text-xs text-muted-foreground italic">
                                  No cropped expression sheets or sub-images added. Crop characters from the main thumbnail!
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Audio Files View */}
                        {activeMediaSubTab === 'audios' && (
                          <div className="space-y-4">
                            <UnifiedMediaPlayer 
                              character={charToRender} 
                              onUpdateCharacter={(updated) => {
                                if (setCharacters) {
                                  setCharacters(prev => prev.map(c => c.id === updated.id ? updated : c));
                                }
                              }} 
                              initialType="audio"
                            />

                            {/* Add audio asset form */}
                            {isEditingChar && (
                              <div className="bg-secondary/10 p-4 rounded-xl border border-dashed space-y-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                  <PlusCircle className="w-4 h-4 text-primary" /> Add Voice/Audio Track
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <input
                                    type="text"
                                    placeholder="Track Title (e.g., Happy Cry)"
                                    value={newAudioTitle}
                                    onChange={(e) => setNewAudioTitle(e.target.value)}
                                    className="bg-background border px-3 py-1.5 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Audio Source URL (mp3/ogg/wav)"
                                    value={newAudioSrc}
                                    onChange={(e) => setNewAudioSrc(e.target.value)}
                                    className="bg-background border px-3 py-1.5 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary"
                                  />
                                </div>
                                <input
                                  type="text"
                                  placeholder="Brief Description / Track context"
                                  value={newAudioDesc}
                                  onChange={(e) => setNewAudioDesc(e.target.value)}
                                  className="w-full bg-background border px-3 py-1.5 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary"
                                />
                                <button
                                  type="button"
                                  onClick={handleAddAudio}
                                  className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
                                >
                                  Add Track
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Video Files View */}
                        {activeMediaSubTab === 'videos' && (
                          <div className="space-y-4">
                            <UnifiedMediaPlayer 
                              character={charToRender} 
                              onUpdateCharacter={(updated) => {
                                if (setCharacters) {
                                  setCharacters(prev => prev.map(c => c.id === updated.id ? updated : c));
                                }
                              }} 
                              initialType="video"
                            />

                            {/* Add video asset form */}
                            {isEditingChar && (
                              <div className="bg-secondary/10 p-4 rounded-xl border border-dashed space-y-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                  <PlusCircle className="w-4 h-4 text-primary" /> Add Expression Video / Animated GIF
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <input
                                    type="text"
                                    placeholder="Video Title (e.g. Idle Animation)"
                                    value={newVideoTitle}
                                    onChange={(e) => setNewVideoTitle(e.target.value)}
                                    className="bg-background border px-3 py-1.5 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Video Source URL (mp4/webm/gif)"
                                    value={newVideoSrc}
                                    onChange={(e) => setNewVideoSrc(e.target.value)}
                                    className="bg-background border px-3 py-1.5 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary"
                                  />
                                </div>
                                <input
                                  type="text"
                                  placeholder="Brief Description / Video context"
                                  value={newVideoDesc}
                                  onChange={(e) => setNewVideoDesc(e.target.value)}
                                  className="w-full bg-background border px-3 py-1.5 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary"
                                />
                                <button
                                  type="button"
                                  onClick={handleAddVideo}
                                  className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
                                >
                                  Add Video
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* TECHNICAL LOGS AND SPECS TAB */}
                    {activeOuterTab === 'technical' && (
                      <div className="space-y-6 animate-fade-in">
                        {isEditingChar ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">First Appearance Type</label>
                              <select
                                value={editedCharData?.firstAppearanceType || 'comic'}
                                onChange={(e) => setEditedCharData({ ...editedCharData!, firstAppearanceType: e.target.value as any })}
                                className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                              >
                                <option value="comic">📖 comic book</option>
                                <option value="animation">🎬 animation / anime</option>
                                <option value="video game">🎮 video game</option>
                                <option value="show">📺 tv show / series</option>
                                <option value="music">🎵 music track</option>
                                <option value="other">❓ other / misc</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">First Appearance Title</label>
                              <input
                                type="text"
                                value={editedCharData?.firstAppearance || ''}
                                onChange={(e) => setEditedCharData({ ...editedCharData!, firstAppearance: e.target.value })}
                                className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                                placeholder="e.g. Issue #1"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">First Publication Details</label>
                              <input
                                type="text"
                                value={editedCharData?.firstPublication || ''}
                                onChange={(e) => setEditedCharData({ ...editedCharData!, firstPublication: e.target.value })}
                                className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                                placeholder="e.g. Marvel Comics (1963)"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Date Creation Source</label>
                              <select
                                value={editedCharData?.dateCreatedSource || 'Added Manually'}
                                onChange={(e) => setEditedCharData({ ...editedCharData!, dateCreatedSource: e.target.value as any })}
                                className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                              >
                                <option value="Added Manually">✍️ Added Manually</option>
                                <option value="From File Properties">📁 From File Properties</option>
                                <option value="From Image Scanning">🔍 From Image Scanning</option>
                                <option value="From Text File">📄 From Text File</option>
                                <option value="Unknown">❓ Unknown</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Date of Creation (Calendar Pop-up)</label>
                              <div className="relative">
                                <input
                                  type="date"
                                  value={editedCharData?.dateCreated || ''}
                                  onChange={(e) => setEditedCharData({ ...editedCharData!, dateCreated: e.target.value })}
                                  className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Date Put in Database (Calendar Pop-up)</label>
                              <div className="relative">
                                <input
                                  type="date"
                                  value={editedCharData?.dateUploaded || ''}
                                  onChange={(e) => setEditedCharData({ ...editedCharData!, dateUploaded: e.target.value })}
                                  className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-secondary/40 p-3 rounded-lg border flex flex-col justify-between">
                              <span className="block text-[10px] text-muted-foreground uppercase tracking-wider mb-1">First Appearance / Publication</span>
                              <span className="font-bold text-sm">
                                {charToRender.firstAppearance ? `${charToRender.firstAppearance} (${charToRender.firstAppearanceType || 'other'})` : 'N/A'}
                              </span>
                              {charToRender.firstPublication && <span className="text-xs text-muted-foreground mt-0.5">{charToRender.firstPublication}</span>}
                            </div>

                            <div className="bg-secondary/40 p-3 rounded-lg border flex flex-col justify-between">
                              <span className="block text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Creation Date Source</span>
                              <span className="font-bold text-sm flex items-center gap-1.5">
                                <span>{displayCreatedSource === 'Added Manually' ? '✍️' : displayCreatedSource === 'From File Properties' ? '📁' : displayCreatedSource === 'From Image Scanning' ? '🔍' : '📄'}</span>
                                <span>{displayCreatedSource}</span>
                              </span>
                              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">Explains how creation date timestamp was derived.</p>
                            </div>

                            <div className="bg-secondary/40 p-3 rounded-lg border flex flex-col justify-between">
                              <span className="block text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Date of Creation</span>
                              <span className="font-bold text-sm flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-primary" />
                                <span>{displayCreatedDate}</span>
                              </span>
                            </div>

                            <div className="bg-secondary/40 p-3 rounded-lg border flex flex-col justify-between">
                              <span className="block text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Date Put in Database</span>
                              <span className="font-bold text-sm flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-primary" />
                                <span>{displayUploadedDate}</span>
                              </span>
                            </div>

                            <div className="col-span-2 bg-secondary/15 p-3 rounded-lg border text-xs text-muted-foreground font-mono flex flex-col gap-1">
                              <span>Character unique ID: {charToRender.id}</span>
                              <span>Source Item unique ID: {charToRender.sourceId}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Character Library Spreadsheet View */}
                    {activeOuterTab === 'spreadsheet' && (
                      <div className="p-2 sm:p-4">
                        <SpreadsheetView
                          mode="profile"
                          character={charToRender}
                          item={item}
                          characters={characters}
                          setCharacters={setCharacters}
                          creatorProfileName={charToRender.creator}
                          onUpdateCharacter={(updated) => {
                            if (setCharacters) {
                              setCharacters(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ALIGNMENT & CROPPING TOOL MODAL */}
      {showAlignmentTool && (() => {
        const activeChar = characters.find(c => c.id === selectedCharId) || characters[0];
        if (!activeChar) return null;
        return (
          <AlignmentToolModal 
            imageSrc={activeChar.bannerImageSrc || activeChar.defaultThumbnailSrc || activeChar.highlightedImageSrc || item.thumbnailContent || item.content} 
            title={`Align & Crop - ${activeChar.name}`}
            onClose={() => setShowAlignmentTool(false)}
            onSave={(updatedSrc) => {
              if (setCharacters) {
                setCharacters(prev => prev.map(c => c.id === activeChar.id ? { ...c, bannerImageSrc: updatedSrc } : c));
              }
              setShowAlignmentTool(false);
            }}
          />
        );
      })()}

      {/* PDF BOOK READER MODAL */}
      {activeBookFile && (
        <PDFBookReader 
          fileTitle={activeBookFile.title}
          fileContent={activeBookFile.content}
          fileUrl={activeBookFile.url}
          onClose={() => setActiveBookFile(null)}
        />
      )}

      {/* Favorite Icon Customizer Modal */}
      {isFavIconModalOpen && favoriteModalTargetChar && (
        <FavoriteIconSelectorModal
          isOpen={isFavIconModalOpen}
          onClose={() => {
            setIsFavIconModalOpen(false);
            setFavoriteModalTargetChar(null);
          }}
          targetCharacter={favoriteModalTargetChar}
          characters={characters}
          setCharacters={setCharacters}
          items={items}
          setItems={setItems}
        />
      )}
    </div>
  );
}
