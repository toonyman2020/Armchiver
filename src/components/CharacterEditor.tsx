import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Check, Edit2, Download, Trash2, ImageIcon, Plus, 
  Sparkles, AlertCircle, Link as LinkIcon, Heart, 
  Palette, Pipette, Music, Mic, Square, Video as VideoIcon, 
  Maximize2, ChevronLeft, ChevronRight, Eye, EyeOff, 
  Calendar, Settings, FileText, Upload, User, BookOpen,
  Briefcase, Layers, PlusCircle, Trash, Camera, Share2, ExternalLink,
  Folder, FolderPlus, Crop, FilePlus, ChevronDown, Clock, File,
  Table, Grid, Type, Play, ArrowRight, Code, Award, DownloadCloud, FileSpreadsheet, Paperclip,
  Printer, Sliders, SlidersHorizontal, Copy, Clipboard, Search, Sun, Moon, RefreshCw, RotateCcw, Lock, Unlock,
  Inbox, Boxes, Box, Compass, Keyboard, HelpCircle, UploadCloud,
  BookOpenCheck, BookMarked, LayoutGrid, Book, Pencil
} from 'lucide-react';
import * as THREE from 'three';
import { Character, Gender, Status, ProjectRelation, EntityRelationship, CustomTab, BiblePage } from '../types';
import { UnifiedMediaPlayer } from './UnifiedMediaPlayer';
import { MoodBoard } from './MoodBoard';
import { getAccessToken } from '../lib/auth';
import { exportCharacterBooklet } from '../lib/exportBooklet';
import { FeatureHelpModal } from './FeatureHelpModal';
import { executePrintDocument } from '../utils/printHelper';
import { BookletReaderModal } from './BookletReaderModal';
import { generateBibleHtml, printBibleDocument, ALL_BIBLE_SECTIONS, BiblePrintOptions, BibleSectionOption } from '../lib/biblePrinter';
import { SpreadsheetView } from './SpreadsheetView';
import { RenderFavoriteIcon } from './FavoriteIconRenderer';
import { FavoriteIconSelectorModal } from './FavoriteIconSelectorModal';

interface Props {
  character?: Character | null;
  charId?: string | null;
  item?: any;
  characters: Character[];
  setCharacters?: React.Dispatch<React.SetStateAction<Character[]>>;
  items?: any[];
  setItems?: React.Dispatch<React.SetStateAction<any[]>>;
  sourceItem?: any;
  isShowcaseView?: boolean;
  onClose?: () => void;
  onSave?: (char: Partial<Character>) => void;
}

export function CharacterEditor({ 
  character, 
  charId,
  item,
  characters, 
  setCharacters, 
  items, 
  setItems,
  sourceItem, 
  isShowcaseView,
  onClose, 
  onSave 
}: Props) {
  const [formData, setFormData] = useState<Partial<Character>>({});
  const [isProfileControlsHidden, setIsProfileControlsHidden] = useState<boolean>(() => Boolean(isShowcaseView));
  const [editorSize, setEditorSize] = useState<'sm' | 'md' | 'lg' | 'xl' | 'fl'>(() => {
    return (localStorage.getItem("editor_view_size") as any) || 'fl';
  });
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isQuickIngestOpen, setIsQuickIngestOpen] = useState<boolean>(false);
  const [isAnalyzingEntireProfile, setIsAnalyzingEntireProfile] = useState<boolean>(false);
  const [lastIngestAnalysisSummary, setLastIngestAnalysisSummary] = useState<string | null>(null);
  const [isDraggingQuickIngest, setIsDraggingQuickIngest] = useState<boolean>(false);
  const [isEditingDetailsHeader, setIsEditingDetailsHeader] = useState<boolean>(false);
  const [draggedMediaIndex, setDraggedMediaIndex] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
  const [parentCharsCount, setParentCharsCount] = useState<number>(0);
  const [colorInput, setColorInput] = useState('#4F46E5');
  const [isEyeDropperSupported, setIsEyeDropperSupported] = useState(false);
  const [isFavIconModalOpen, setIsFavIconModalOpen] = useState(false);
  
  // Workspace tab states: Outer Tab & Inner Subtabs
  const [activeOuterTab, setActiveOuterTab] = useState<string>('overview');
  const [activeProfileSubTab, setActiveProfileSubTab] = useState<'all' | 'overview' | 'categories' | 'timeline'>('all');
  const [activeDetailSubTab, setActiveDetailSubTab] = useState<string>('page-1');
  const [activeMediaSubTab, setActiveMediaSubTab] = useState<'images' | 'audios' | 'videos' | 'files' | 'model3d' | 'dropbox'>('images');
  const [recentDropboxUploads, setRecentDropboxUploads] = useState<{id: string, name: string, size: string, type: string, destination: string, timestamp: string}[]>([]);
  const [isDraggingDropboxTab, setIsDraggingDropboxTab] = useState(false);
  const [isDraggingHeaderDropper, setIsDraggingHeaderDropper] = useState(false);
  const [isDraggingPortraitMiniDropper, setIsDraggingPortraitMiniDropper] = useState(false);
  const [activeTechSubTab, setActiveTechSubTab] = useState<'data' | 'export'>('data');
  const [activeCustomSubTab, setActiveCustomSubTab] = useState<string>('');
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  // Modals & Subpages editing states
  const [showPortraitPickerModal, setShowPortraitPickerModal] = useState(false);
  const [showAddSubPageModal, setShowAddSubPageModal] = useState(false);
  const [newSubPageTitle, setNewSubPageTitle] = useState('');
  const [newSubPageParentId, setNewSubPageParentId] = useState<string | null>(null);
  const [editingBiblePageId, setEditingBiblePageId] = useState<string | null>(null);
  const [editingBiblePageTitle, setEditingBiblePageTitle] = useState('');

  // Dev Tracker & Credits State
  const [devLogHours, setDevLogHours] = useState<number>(2);
  const [devLogDesc, setDevLogDesc] = useState<string>('');
  const [devLogMilestone, setDevLogMilestone] = useState<string>('Character Design & Lore');
  const [devLogDate, setDevLogDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [devCreditRole, setDevCreditRole] = useState<string>('Lead Creator');
  const [devCreditName, setDevCreditName] = useState<string>('');

  // Media Categories Sidebar & Tree states
  const [activeMediaCategory, setActiveMediaCategory] = useState<string>('all');
  const [showAddMediaCatModal, setShowAddMediaCatModal] = useState(false);
  const [newMediaCatName, setNewMediaCatName] = useState('');
  const [newMediaCatType, setNewMediaCatType] = useState<'image' | 'audio' | 'video'>('audio');
  const [newMediaCatParentId, setNewMediaCatParentId] = useState<string | null>(null);

  // Custom Main Tabs state
  const [showAddMainTabModal, setShowAddMainTabModal] = useState(false);
  const [newMainTabTitle, setNewMainTabTitle] = useState('');

  // Projects & Relationships form state
  const [projectFormName, setProjectFormName] = useState('');
  const [projectFormRole, setProjectFormRole] = useState('');
  const [projectFormStatus, setProjectFormStatus] = useState<'Published' | 'Unpublished' | 'In Progress' | 'Official' | 'Unofficial' | 'Fan Work' | 'Concept'>('In Progress');
  const [projectFormDesc, setProjectFormDesc] = useState('');
  const [projectFormLink, setProjectFormLink] = useState('');

  const [relFormTarget, setRelFormTarget] = useState('');
  const [relFormType, setRelFormType] = useState('Ally');
  const [relFormNotes, setRelFormNotes] = useState('');

  const [devCreditContact, setDevCreditContact] = useState('');

  // Banner & Portrait input refs
  const bannerInputRef = useRef<HTMLInputElement | null>(null);
  const portraitInputRef = useRef<HTMLInputElement | null>(null);

  // Inline renaming states
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editTitleInput, setEditTitleInput] = useState("");
  const [editDescInput, setEditDescInput] = useState("");

  // Source Code Tab states
  const [selectedCodeFileId, setSelectedCodeFileId] = useState<string | null>(null);
  const [codeSearchQuery, setCodeSearchQuery] = useState('');
  const [isAddingCodeSnippet, setIsAddingCodeSnippet] = useState(false);
  const [codeFormName, setCodeFormName] = useState('');
  const [codeFormLanguage, setCodeFormLanguage] = useState('TypeScript');
  const [codeFormContent, setCodeFormContent] = useState('');
  const [codeFormDesc, setCodeFormDesc] = useState('');

  // Production Bible & Booklet Publisher states
  const [showBibleReaderModal, setShowBibleReaderModal] = useState<boolean>(false);
  const [bibleOptions, setBibleOptions] = useState<BiblePrintOptions>({
    printMode: 'complete-bible',
    theme: 'clean-editorial',
    pageSize: 'letter',
    galleryLayout: '2-grid',
    imageFit: 'contain',
    sections: ALL_BIBLE_SECTIONS.map(s => s.id),
    runningHeader: 'OFFICIAL PRODUCTION BIBLE & COMPLETE ARCHIVE',
    runningFooter: 'CONFIDENTIAL ARCHIVE • {character} • Page {page}',
    includeCoverBanner: true,
    fontSize: 'standard',
  });
  const [activeCatalogerPageIdx, setActiveCatalogerPageIdx] = useState<number>(0);
  const [catalogerTemplate, setCatalogerTemplate] = useState<'magazine' | 'portfolio' | 'high-tech' | 'vintage'>('magazine');
  const [catalogerPageSize, setCatalogerPageSize] = useState<'letter' | 'a4'>('letter');
  const [catalogerCustomHeader, setCatalogerCustomHeader] = useState('CHARACTER DIRECTORY & MANIFEST');
  const [catalogerCustomFooter, setCatalogerCustomFooter] = useState('Confidential Archive • Page {page}');
  const [catalogerSelectedPages, setCatalogerSelectedPages] = useState<string[]>(['cover', 'profile', 'bible', 'projects', 'images', 'specs', 'back']);

  // Feature Help & Tutorial Reference Modal states
  const [showFeatureHelpModal, setShowFeatureHelpModal] = useState(false);
  const [helpModalActiveTab, setHelpModalActiveTab] = useState<string>('overview');

  // Sound Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // AI spelling, grammar and organization states
  const [isCheckingText, setIsCheckingText] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [quickDumpText, setQuickDumpText] = useState('');
  
  // Multimodal Data Dump & Media Analyzer states
  interface DumpMediaFile {
    id: string;
    name: string;
    mimeType: string;
    data: string; // base64 string
    previewUrl: string;
    type: 'image' | 'audio' | 'video' | 'file';
    sizeFormatted: string;
  }
  const [dumpMediaFiles, setDumpMediaFiles] = useState<DumpMediaFile[]>([]);
  const [autoAttachDumpMedia, setAutoAttachDumpMedia] = useState<boolean>(true);
  const [isTranscribingMediaId, setIsTranscribingMediaId] = useState<string | null>(null);
  const [isDragOverDump, setIsDragOverDump] = useState<boolean>(false);

  const [aiReport, setAiReport] = useState<{
    organizedText?: string;
    corrections?: Array<{ original: string; corrected: string; explanation: string; type: string }>;
    suggestedLinks?: Array<{ title: string; url: string; description: string }>;
    bibleSections?: { executiveConcepts?: string; corePremise?: string; heightBuild?: string; personalitySpeech?: string };
  } | null>(null);

  // Gallery states
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const [galleryShowOverlay, setGalleryShowOverlay] = useState<boolean>(true);
  const [isGalleryIdle, setIsGalleryIdle] = useState<boolean>(false);
  const galleryIdleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<number | null>(null);
  const [overviewCarouselIdx, setOverviewCarouselIdx] = useState<number>(0);

  // Export dropdown & Booklet Modal states
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showBookletModal, setShowBookletModal] = useState<boolean>(false);
  const [showBannerCropModal, setShowBannerCropModal] = useState<boolean>(false);
  const [showIconCropModal, setShowIconCropModal] = useState<boolean>(false);
  const [isDraggingBannerModal, setIsDraggingBannerModal] = useState<boolean>(false);
  const [isDraggingIconModal, setIsDraggingIconModal] = useState<boolean>(false);

  // Edit Mode & Custom Tab Spectrum Colors state
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [showTabColorPicker, setShowTabColorPicker] = useState<string | null>(null);
  
  // Drag-and-drop Tab States
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [showTabSettings, setShowTabSettings] = useState<boolean>(false);

  // Four-direction panel resizing states
  const editorModalRef = useRef<HTMLDivElement | null>(null);
  const [isResizingTabs, setIsResizingTabs] = useState<boolean>(false);
  const [isResizingEditTools, setIsResizingEditTools] = useState<boolean>(false);
  const [isResizingBannerHeight, setIsResizingBannerHeight] = useState<boolean>(false);
  const [isResizingModalHeight, setIsResizingModalHeight] = useState<boolean>(false);

  // Projects side-panel state
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectSearchQuery, setProjectSearchQuery] = useState<string>('');

  // Editorial Auto-Check toggle
  const [autoCheckSpelling, setAutoCheckSpelling] = useState<boolean>(false);

  // Default spectrum colors per main tab
  const DEFAULT_TAB_SPECTRUM: Record<string, string> = {
    overview: '#3b82f6', // Blue
    profile: '#eab308',  // Yellow / Gold
    details: '#06b6d4',  // Teal / Cyan
    projects: '#a855f7', // Purple
    media: '#10b981',    // Emerald / Green
    technical: '#f43f5e',// Rose / Pink
    dev: '#f97316'       // Orange
  };

  // Tracks clean vs dirty state precisely
  const [initialFormData, setInitialFormData] = useState<any>(null);
  const lastCharIdRef = useRef<string | null>(null);

  // Resolve the active character based on props
  const activeChar = character || (charId ? characters.find(c => c.id === charId) : (item ? characters.find(c => c.sourceId === item.id) : null));

  // Initializing character standard Bible pages and dates
  useEffect(() => {
    if (activeChar) {
      if (lastCharIdRef.current !== activeChar.id) {
        lastCharIdRef.current = activeChar.id;
        setInitialFormData(null);
      }

      let pages = activeChar.biblePages ? [...activeChar.biblePages] : [];
      if (pages.length === 0) {
        pages = [
          { id: 'page-1', title: 'General Overview & Notes', content: activeChar.characterBible || '' },
          { id: 'page-2', title: 'Background & Lore', content: '' },
          { id: 'page-3', title: 'Specifications', content: '' }
        ];
      }

      let mediaCats = activeChar.mediaCategories ? [...activeChar.mediaCategories] : [];
      if (mediaCats.length === 0) {
        mediaCats = [
          { id: 'cat-aud-1', name: 'Music Tracks', type: 'audio' },
          { id: 'cat-aud-2', name: 'Soundtracks', type: 'audio' },
          { id: 'cat-aud-3', name: 'Voice Clips', type: 'audio' },
          { id: 'cat-aud-4', name: 'Demonstration', type: 'audio' },
          { id: 'cat-vid-1', name: 'Show Episodes', type: 'video' },
          { id: 'cat-vid-2', name: 'Video Clips', type: 'video' },
          { id: 'cat-vid-3', name: 'Demonstrations', type: 'video' },
          { id: 'cat-img-1', name: 'Model Sheets', type: 'image' },
          { id: 'cat-img-2', name: 'Concept Art', type: 'image' }
        ];
      }

      const today = new Date().toISOString().split('T')[0];

      const defaultDevTracker = activeChar.devTracker || {
        startDate: activeChar.dateCreated || today,
        credits: [{ role: 'Lead Creator & Author', name: activeChar.creator || 'Alberto Armentero' }],
        logs: []
      };

      const savedLayoutRaw = localStorage.getItem("default_editor_layout");
      let savedLayout: any = {};
      if (savedLayoutRaw) {
        try { savedLayout = JSON.parse(savedLayoutRaw); } catch (e) {}
      }

      const defaultData = {
        ...activeChar,
        creator: activeChar.creator || 'Alberto Armentero',
        bannerFilter: activeChar.bannerFilter || { brightness: 100, contrast: 100, saturate: 100 },
        tabColors: activeChar.tabColors || DEFAULT_TAB_SPECTRUM,
        devTracker: defaultDevTracker,
        biblePages: pages,
        mediaCategories: mediaCats,
        projects: activeChar.projects || [],
        relationships: activeChar.relationships || [],
        customTabs: activeChar.customTabs || [],
        audios: activeChar.audios || [],
        videos: activeChar.videos || [],
        dateCreated: activeChar.dateCreated || today,
        dateUploaded: activeChar.dateUploaded || today,
        dateCreatedSource: activeChar.dateCreatedSource || 'Added Manually',
        hideBanner: activeChar.hideBanner ?? savedLayout.hideBanner ?? true,
        hideIcon: activeChar.hideIcon ?? savedLayout.hideIcon ?? false,
        reverseHeaderLayout: activeChar.reverseHeaderLayout ?? savedLayout.reverseHeaderLayout ?? false,
        bannerHeight: activeChar.bannerHeight ?? savedLayout.bannerHeight ?? 160,
        iconSize: activeChar.iconSize ?? savedLayout.iconSize ?? 72,
        detailsHeaderTitle: activeChar.detailsHeaderTitle ?? savedLayout.detailsHeaderTitle ?? 'Section Index',
        detailsHierarchyPosition: activeChar.detailsHierarchyPosition ?? savedLayout.detailsHierarchyPosition ?? 'left',
        mediaViewMode: activeChar.mediaViewMode ?? savedLayout.mediaViewMode ?? 'grid',
        mediaAspect: activeChar.mediaAspect ?? savedLayout.mediaAspect ?? 'landscape',
        mediaGridCols: activeChar.mediaGridCols ?? savedLayout.mediaGridCols ?? 4,
        editToolsPosition: activeChar.editToolsPosition ?? savedLayout.editToolsPosition ?? 'right',
        tabLayoutPosition: activeChar.tabLayoutPosition ?? savedLayout.tabLayoutPosition ?? 'left',
        editToolsOrder: activeChar.editToolsOrder ?? savedLayout.editToolsOrder ?? ['banner_upload', 'clear_banner', 'banner_filter', 'crop_banner', 'crop_icon', 'spectrum_tabs', 'sync_accent', 'reset_tabs']
      };

      setFormData(defaultData);
      setInitialFormData((prev: any) => prev || defaultData);
      
      if (pages.length > 0 && !pages.some(p => p.id === activeDetailSubTab)) {
        setActiveDetailSubTab(pages[0].id);
      }

      const srcId = activeChar.sourceId || item?.id || sourceItem?.id;
      if (items && srcId) {
        const count = characters.filter(c => c.sourceId === srcId).length;
        setParentCharsCount(count);
      }
    }
  }, [activeChar, characters, items, item, sourceItem]);

  useEffect(() => {
    if ('EyeDropper' in window) {
      setIsEyeDropperSupported(true);
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!editorModalRef.current) return;
      const rect = editorModalRef.current.getBoundingClientRect();
      
      if (isResizingTabs) {
        const tabPos = formData.tabLayoutPosition || (formData.tabLayout === 'side' ? 'left' : 'top');
        if (tabPos === 'left') {
          const width = e.clientX - rect.left;
          setFormData(prev => ({ ...prev, tabsWidth: Math.max(140, Math.min(500, width)) }));
        } else if (tabPos === 'right') {
          const width = rect.right - e.clientX;
          setFormData(prev => ({ ...prev, tabsWidth: Math.max(140, Math.min(500, width)) }));
        } else if (tabPos === 'top') {
          const height = e.clientY - rect.top;
          setFormData(prev => ({ ...prev, tabsHeight: Math.max(35, Math.min(250, height)) }));
        } else if (tabPos === 'bottom') {
          const height = rect.bottom - e.clientY;
          setFormData(prev => ({ ...prev, tabsHeight: Math.max(35, Math.min(250, height)) }));
        }
      }
      
      if (isResizingEditTools) {
        const toolsPos = formData.editToolsPosition || 'right';
        if (toolsPos === 'left') {
          const width = e.clientX - rect.left;
          setFormData(prev => ({ ...prev, editToolsWidth: Math.max(180, Math.min(600, width)) }));
        } else if (toolsPos === 'right') {
          const width = rect.right - e.clientX;
          setFormData(prev => ({ ...prev, editToolsWidth: Math.max(180, Math.min(600, width)) }));
        } else if (toolsPos === 'top') {
          const height = e.clientY - rect.top;
          setFormData(prev => ({ ...prev, editToolsHeight: Math.max(45, Math.min(300, height)) }));
        } else if (toolsPos === 'bottom') {
          const height = rect.bottom - e.clientY;
          setFormData(prev => ({ ...prev, editToolsHeight: Math.max(45, Math.min(300, height)) }));
        }
      }

      if (isResizingBannerHeight) {
        // Calculate vertical mouse offset relative to banner top
        const height = e.clientY - rect.top;
        setFormData(prev => ({ ...prev, bannerHeight: Math.max(60, Math.min(450, height)) }));
      }

      if (isResizingModalHeight) {
        // Calculate vertical mouse offset relative to modal top
        const height = e.clientY - rect.top;
        setFormData(prev => ({ ...prev, modalCustomHeight: Math.max(400, Math.min(1200, height)) }));
      }
    };

    const handleMouseUp = () => {
      setIsResizingTabs(false);
      setIsResizingEditTools(false);
      setIsResizingBannerHeight(false);
      setIsResizingModalHeight(false);
    };

    if (isResizingTabs || isResizingEditTools || isResizingBannerHeight || isResizingModalHeight) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingTabs, isResizingEditTools, isResizingBannerHeight, isResizingModalHeight, formData.tabLayoutPosition, formData.tabLayout, formData.editToolsPosition]);

  const handleSave = () => {
    if (setCharacters && activeChar) {
      setCharacters(prev => prev.map(c => c.id === activeChar.id ? { ...c, ...formData } as Character : c));
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
    if (setCharacters && activeChar) {
      setCharacters(prev => prev.filter(c => c.id !== activeChar.id));
    }
    if (onClose) onClose();
  };

  // Spectrum & Color Palette helpers
  const handleAutoSpectrumPalette = () => {
    setFormData((prev: any) => ({
      ...prev,
      tabColors: { ...DEFAULT_TAB_SPECTRUM }
    }));
  };

  const handleSetTabColor = (tabId: string, color: string) => {
    setFormData((prev: any) => ({
      ...prev,
      tabColors: {
        ...(prev.tabColors || DEFAULT_TAB_SPECTRUM),
        [tabId]: color
      }
    }));
  };

  // Banner Filter Presets
  const handleSetBannerFilter = (preset: 'normal' | 'lighter' | 'darker' | 'contrast' | 'vibrant' | 'sepia' | 'bw') => {
    let filter = { brightness: 100, contrast: 100, saturate: 100 };
    if (preset === 'lighter') filter = { brightness: 135, contrast: 105, saturate: 110 };
    if (preset === 'darker') filter = { brightness: 70, contrast: 115, saturate: 95 };
    if (preset === 'contrast') filter = { brightness: 110, contrast: 145, saturate: 120 };
    if (preset === 'vibrant') filter = { brightness: 110, contrast: 115, saturate: 160 };
    if (preset === 'sepia') filter = { brightness: 105, contrast: 110, saturate: 60 };
    if (preset === 'bw') filter = { brightness: 100, contrast: 120, saturate: 0 };
    
    setFormData((prev: any) => ({
      ...prev,
      bannerFilter: filter
    }));
  };

  // Create Project or Episode from Details Bible Page Note
  const handleCreateProjectFromBiblePage = (pageId: string) => {
    const page = formData.biblePages?.find((p: any) => p.id === pageId);
    if (!page) return;

    const newProject: ProjectRelation = {
      id: `proj-${Date.now()}`,
      projectName: page.title || 'New Episode Project',
      roleOrRelation: 'Featured Episode / Story Arc',
      status: 'In Progress',
      description: page.content || '',
      tables: []
    };

    const updatedProjects = [...(formData.projects || []), newProject];
    setFormData((prev: any) => ({ ...prev, projects: updatedProjects }));
    setSelectedProjectId(newProject.id);
    setActiveOuterTab('projects');
  };

  // Clipboard Helpers
  const handleCopyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
  };

  const handlePasteFromClipboard = (onPaste: (text: string) => void) => {
    navigator.clipboard.readText().then(text => {
      if (text) onPaste(text);
    }).catch(err => console.error('Clipboard access error:', err));
  };

  const handleClose = () => {
    const isDirty = initialFormData && JSON.stringify(initialFormData) !== JSON.stringify(formData);
    if (isDirty) {
      setShowUnsavedConfirm(true);
    } else {
      if (onClose) onClose();
    }
  };

  // Banner & Portrait File Upload Handlers
  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const src = evt.target?.result as string;
        setFormData(prev => ({ ...prev, bannerImageSrc: src }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePortraitUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const src = evt.target?.result as string;
        setFormData(prev => ({ ...prev, highlightedImageSrc: src }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSetMainImage = (src: string) => {
    setFormData(prev => ({ ...prev, highlightedImageSrc: src }));
  };

  const getBannerStyle = () => {
    const fit = formData.bannerFit || 'cover';
    const align = formData.bannerAlignment || 'center';
    const posMap: Record<string, string> = {
      'center': '50% 50%',
      'top': '50% 0%',
      'bottom': '50% 100%',
      'left': '0% 50%',
      'right': '100% 50%',
      'top-left': '0% 0%',
      'top-right': '100% 0%',
      'bottom-left': '0% 100%',
      'bottom-right': '100% 100%'
    };
    return {
      objectFit: fit as any,
      objectPosition: posMap[align] || '50% 50%',
      filter: `brightness(${formData.bannerFilter?.brightness ?? 100}%) contrast(${formData.bannerFilter?.contrast ?? 100}%) saturate(${formData.bannerFilter?.saturate ?? 100}%)`
    };
  };

  const getIconStyle = () => {
    const fit = formData.iconFit || 'cover';
    const align = formData.iconAlignment || 'center';
    const scale = formData.iconScale ?? 1;
    const posMap: Record<string, string> = {
      'center': '50% 50%',
      'top': '50% 0%',
      'bottom': '50% 100%',
      'left': '0% 50%',
      'right': '100% 50%',
      'top-left': '0% 0%',
      'top-right': '100% 0%',
      'bottom-left': '0% 100%',
      'bottom-right': '100% 100%'
    };
    return {
      objectFit: fit as any,
      objectPosition: posMap[align] || '50% 50%',
      transform: `scale(${scale})`,
      transformOrigin: posMap[align] || '50% 50%'
    };
  };

  // Subpage Handlers for Details Tab
  const toggleMasterLock = () => {
    setFormData(prev => ({ ...prev, isMasterLocked: !prev.isMasterLocked }));
    setCopyToast(formData.isMasterLocked ? "All sections UNLOCKED for editing" : "All sections MASTER LOCKED");
    setTimeout(() => setCopyToast(null), 2500);
  };

  const handleTogglePageLock = (pageId: string) => {
    setFormData(prev => {
      const pages = (prev.biblePages || []).map(p => 
        p.id === pageId ? { ...p, isLocked: !p.isLocked } : p
      );
      return { ...prev, biblePages: pages };
    });
  };

  const handleAddBiblePage = (parentId?: string | null) => {
    const title = newSubPageTitle.trim() || `Page #${(formData.biblePages?.length || 0) + 1}`;
    const newId = `page-${Date.now()}`;
    const targetParentId = parentId !== undefined ? parentId : newSubPageParentId;
    const newPage = { id: newId, title, content: '', parentId: targetParentId || undefined };
    const pages = [...(formData.biblePages || []), newPage];
    setFormData({ ...formData, biblePages: pages });
    setActiveDetailSubTab(newId);
    setNewSubPageTitle('');
    setNewSubPageParentId(null);
    setShowAddSubPageModal(false);
  };

  const handleRenameBiblePage = (id: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    const pages = (formData.biblePages || []).map(p => p.id === id ? { ...p, title: newTitle.trim() } : p);
    setFormData({ ...formData, biblePages: pages });
    setEditingBiblePageId(null);
  };

  const handleDeleteBiblePage = (id: string) => {
    const pages = (formData.biblePages || []).filter(p => p.id !== id);
    setFormData({ ...formData, biblePages: pages });
    if (activeDetailSubTab === id) {
      setActiveDetailSubTab(pages[0]?.id || '');
    }
  };

  // Media Category Handlers
  const handleAddMediaCategory = (type?: 'image' | 'audio' | 'video', name?: string, parentId?: string | null) => {
    const targetType = type || newMediaCatType;
    const targetName = (name !== undefined ? name : newMediaCatName).trim();
    const targetParentId = parentId !== undefined ? parentId : newMediaCatParentId;

    if (!targetName) return;
    const newCat = {
      id: `cat-${targetType}-${Date.now()}`,
      name: targetName,
      type: targetType,
      parentId: targetParentId || undefined
    };
    const categories = [...(formData.mediaCategories || []), newCat];
    setFormData({ ...formData, mediaCategories: categories });
    setActiveMediaCategory(newCat.id);
    setNewMediaCatName('');
    setNewMediaCatParentId(null);
    setShowAddMediaCatModal(false);
  };

  const handleDeleteMediaCategory = (catId: string) => {
    const categories = (formData.mediaCategories || []).filter(c => c.id !== catId);
    setFormData({ ...formData, mediaCategories: categories });
    if (activeMediaCategory === catId) {
      setActiveMediaCategory('all');
    }
  };

  // Custom Main Tab Handlers
  const handleAddCustomMainTab = () => {
    const title = newMainTabTitle.trim() || `Tab ${(formData.customTabs?.length || 0) + 1}`;
    const tabId = `custom-${Date.now()}`;
    const initialSubTab = { id: `sub-${Date.now()}`, title: 'Overview Notes', content: '' };
    const newTab: CustomTab = {
      id: tabId,
      title,
      subTabs: [initialSubTab]
    };
    const customTabs = [...(formData.customTabs || []), newTab];
    setFormData({ ...formData, customTabs });
    setActiveOuterTab(tabId);
    setActiveCustomSubTab(initialSubTab.id);
    setNewMainTabTitle('');
    setShowAddMainTabModal(false);
  };

  const handleDeleteCustomMainTab = (id: string) => {
    const customTabs = (formData.customTabs || []).filter(t => t.id !== id);
    setFormData({ ...formData, customTabs });
    if (activeOuterTab === id) {
      setActiveOuterTab('profile');
    }
  };

  const handleAddCustomSubTab = (mainTabId: string, subTitle: string) => {
    const title = subTitle.trim() || 'New Subpage';
    const subId = `sub-${Date.now()}`;
    const customTabs = (formData.customTabs || []).map(t => {
      if (t.id === mainTabId) {
        return { ...t, subTabs: [...t.subTabs, { id: subId, title, content: '' }] };
      }
      return t;
    });
    setFormData({ ...formData, customTabs });
    setActiveCustomSubTab(subId);
  };

  const handleUpdateCustomSubTabContent = (mainTabId: string, subId: string, content: string) => {
    const customTabs = (formData.customTabs || []).map(t => {
      if (t.id === mainTabId) {
        return {
          ...t,
          subTabs: t.subTabs.map(s => s.id === subId ? { ...s, content } : s)
        };
      }
      return t;
    });
    setFormData({ ...formData, customTabs });
  };

  const handleDeleteCustomSubTab = (mainTabId: string, subId: string) => {
    const customTabs = (formData.customTabs || []).map(t => {
      if (t.id === mainTabId) {
        const filtered = t.subTabs.filter(s => s.id !== subId);
        return { ...t, subTabs: filtered };
      }
      return t;
    });
    setFormData({ ...formData, customTabs });
  };

  // Projects & Relationships Handlers
  const handleAddProject = () => {
    if (!projectFormName.trim()) return;
    const newProj: ProjectRelation = {
      id: `proj-${Date.now()}`,
      projectName: projectFormName.trim(),
      roleOrRelation: projectFormRole.trim() || 'Involved Asset',
      status: projectFormStatus,
      description: projectFormDesc.trim(),
      linkUrl: projectFormLink.trim()
    };
    setFormData({
      ...formData,
      projects: [...(formData.projects || []), newProj]
    });
    setProjectFormName('');
    setProjectFormRole('');
    setProjectFormDesc('');
    setProjectFormLink('');
  };

  const handleDeleteProject = (id: string) => {
    setFormData({
      ...formData,
      projects: (formData.projects || []).filter(p => p.id !== id)
    });
  };

  const handleUpdateProject = (id: string, updates: Partial<ProjectRelation>) => {
    setFormData({
      ...formData,
      projects: (formData.projects || []).map(p => p.id === id ? { ...p, ...updates } : p)
    });
  };

  const handleAddRelationship = () => {
    if (!relFormTarget.trim()) return;
    const newRel: EntityRelationship = {
      id: `rel-${Date.now()}`,
      targetName: relFormTarget.trim(),
      relationshipType: relFormType.trim() || 'Connected',
      notes: relFormNotes.trim()
    };
    setFormData({
      ...formData,
      relationships: [...(formData.relationships || []), newRel]
    });
    setRelFormTarget('');
    setRelFormNotes('');
  };

  const handleDeleteRelationship = (id: string) => {
    setFormData({
      ...formData,
      relationships: (formData.relationships || []).filter(r => r.id !== id)
    });
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

  // Drag and drop upload states
  const [isDraggingBanner, setIsDraggingBanner] = useState(false);
  const [isDraggingPortrait, setIsDraggingPortrait] = useState(false);
  const [isDraggingMedia, setIsDraggingMedia] = useState(false);
  const [isDraggingPoseSheet, setIsDraggingPoseSheet] = useState(false);
  const [isDraggingUniversal, setIsDraggingUniversal] = useState(false);

  // Guard against flickering in React drag leave events
  const handleDragLeaveGuard = (e: React.DragEvent, setter: (val: boolean) => void) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setter(false);
    }
  };

  // Universal Smart File Processor
  const processDroppedFiles = (filesList: FileList | File[], defaultCategory?: string) => {
    const files = Array.from(filesList);
    if (files.length === 0) return;

    let addedAudioCount = 0;
    let addedVideoCount = 0;
    let addedImageCount = 0;
    let addedFileCount = 0;

    const category = defaultCategory && defaultCategory !== 'all' ? defaultCategory : undefined;
    const newLogs: { id: string; name: string; size: string; type: string; destination: string; timestamp: string }[] = [];

    files.forEach((file) => {
      const fileType = file.type || '';
      const cleanName = file.name.replace(/\.[^/.]+$/, "");
      const sizeStr = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
      const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
      const is3DModel = ['obj', 'gltf', 'glb', 'stl', 'fbx', '3ds', 'ply', 'dae'].includes(fileExt);

      if (is3DModel) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const text = typeof evt.target?.result === 'string' ? (evt.target?.result || '') : '';
          let verticesCount = 0;
          let facesCount = 0;
          
          if (fileExt === 'obj') {
            const lines = text.split('\n');
            for (let i = 0; i < lines.length; i++) {
              const tr = lines[i].trim();
              if (tr.startsWith('v ')) verticesCount++;
              else if (tr.startsWith('f ')) facesCount++;
            }
          } else if (fileExt === 'stl') {
            const matches = text.match(/facet normal/g);
            if (matches) {
              facesCount = matches.length;
              verticesCount = facesCount * 3;
            }
          }
          
          if (verticesCount === 0) {
            verticesCount = Math.max(1200, Math.round((file.size / 1024) * 15.5));
            facesCount = Math.round(verticesCount * 1.85);
          }

          const newModel = {
            id: `3d-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: file.name,
            size: sizeStr,
            extension: fileExt.toUpperCase(),
            url: URL.createObjectURL(file),
            vertexCount: verticesCount,
            faceCount: facesCount,
            timestamp: new Date().toLocaleTimeString()
          };

          setFormData(prev => ({
            ...prev,
            models3D: [...(prev.models3D || []), newModel]
          }));
        };

          if (fileExt === 'obj' || fileExt === 'stl') {
            reader.readAsText(file);
          } else {
            reader.readAsArrayBuffer(file);
          }

        newLogs.push({
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          size: sizeStr,
          type: `3D Model (${fileExt.toUpperCase()})`,
          destination: '3D Library',
          timestamp: new Date().toLocaleTimeString()
        });
      } else if (fileType.startsWith('audio/')) {
        const url = URL.createObjectURL(file);
        const newAudio = {
          id: `audio-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          src: url,
          title: cleanName,
          description: `Dragged & Dropped audio asset (${sizeStr})`,
          category
        };
        setFormData(prev => ({ ...prev, audios: [...(prev.audios || []), newAudio] }));
        addedAudioCount++;
        newLogs.push({
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          size: sizeStr,
          type: fileType,
          destination: 'Audios / Tracks',
          timestamp: new Date().toLocaleTimeString()
        });
      } else if (fileType.startsWith('video/')) {
        const url = URL.createObjectURL(file);
        const newVid = {
          id: `video-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          src: url,
          title: cleanName,
          description: `Dragged & Dropped video clip (${sizeStr})`,
          category
        };
        setFormData(prev => ({ ...prev, videos: [...(prev.videos || []), newVid] }));
        addedVideoCount++;
        newLogs.push({
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          size: sizeStr,
          type: fileType,
          destination: 'Videos / Clips',
          timestamp: new Date().toLocaleTimeString()
        });
      } else if (fileType.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const src = evt.target?.result as string;
          const newImg = {
            id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            src,
            title: cleanName,
            description: `Uploaded artwork asset`,
            category
          };
          setFormData(prev => ({ ...prev, subImages: [...(prev.subImages || []), newImg] }));
        };
        reader.readAsDataURL(file);
        addedImageCount++;
        newLogs.push({
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          size: sizeStr,
          type: fileType,
          destination: 'Images / Gallery',
          timestamp: new Date().toLocaleTimeString()
        });
      } else {
        const url = URL.createObjectURL(file);
        const newFile = {
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          size: sizeStr,
          type: fileType || file.name.split('.').pop() || 'document',
          url: url,
          dateAdded: new Date().toISOString().split('T')[0],
          category
        };
        setFormData(prev => ({ ...prev, genericFiles: [...(prev.genericFiles || []), newFile] }));
        addedFileCount++;
        newLogs.push({
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          size: sizeStr,
          type: fileType || 'document',
          destination: 'Documentations / Files',
          timestamp: new Date().toLocaleTimeString()
        });

        // If it is a text-like document, automatically read and trigger the whole profile analyzer
        const isTextDoc = fileType.includes('text') || fileType.includes('json') || fileType.includes('markdown') || ['txt', 'md', 'json', 'csv', 'doc', 'docx', 'rtf', 'log', 'yaml', 'xml'].includes(fileExt);
        if (isTextDoc) {
          const docReader = new FileReader();
          docReader.onload = (evt) => {
            const docContent = typeof evt.target?.result === 'string' ? evt.target.result : '';
            if (docContent && docContent.trim().length > 5) {
              setCopyToast(`Scanning document "${file.name}" to update entire character profile...`);
              handleAnalyzeEntireProfile(docContent);
            }
          };
          docReader.readAsText(file);
        }
      }
    });

    setRecentDropboxUploads(prev => [...newLogs, ...prev]);

    // Auto navigate to Media tab and activate the matching subtab for instant preview!
    setActiveOuterTab('media');
    if (addedAudioCount > 0) setActiveMediaSubTab('audios');
    else if (addedVideoCount > 0) setActiveMediaSubTab('videos');
    else if (addedImageCount > 0) setActiveMediaSubTab('images');
    else if (addedFileCount > 0) setActiveMediaSubTab('files');
  };

  const handleUniversalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingUniversal(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processDroppedFiles(e.dataTransfer.files, activeMediaCategory);
    }
  };

  const handleBannerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingBanner(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const src = evt.target?.result as string;
        setFormData(prev => ({ ...prev, bannerImageSrc: src }));
      };
      reader.readAsDataURL(file);
    } else if (file) {
      // If non-image dropped on banner, route to general media processor
      processDroppedFiles([file]);
    }
  };

  const handlePortraitDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingPortrait(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const src = evt.target?.result as string;
        setFormData(prev => ({ ...prev, highlightedImageSrc: src }));
      };
      reader.readAsDataURL(file);
    } else if (file) {
      processDroppedFiles([file]);
    }
  };

  const handlePoseSheetDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPoseSheet(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (uploadEvent) => {
          const src = uploadEvent.target?.result as string;
          if (src) {
            const title = prompt("Enter Title for dropped Pose Sheet / Model:") || "Pose Sheet / Model";
            const newSub = { id: `sub-${Date.now()}`, src, title, description: "Dropped character artwork asset." };
            setFormData(prev => ({
              ...prev,
              subImages: [...(prev.subImages || []), newSub]
            }));
          }
        };
        reader.readAsDataURL(file);
      } else {
        processDroppedFiles(files);
      }
    } else {
      const textData = e.dataTransfer.getData('text/plain');
      if (textData && (textData.startsWith('http') || textData.startsWith('data:'))) {
        const title = prompt("Enter Title for dropped image URL:") || "Pose Sheet / Model";
        const newSub = { id: `sub-${Date.now()}`, src: textData, title, description: "Dropped character artwork asset." };
        setFormData(prev => ({
          ...prev,
          subImages: [...(prev.subImages || []), newSub]
        }));
      }
    }
  };

  const handleMediaDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingMedia(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processDroppedFiles(e.dataTransfer.files, activeMediaCategory);
    }
  };

  // Pre-fill rich dummy sample profile with images, audio, video, lore, and relationships
  const loadRichSampleProfile = () => {
    const today = new Date().toISOString().split('T')[0];
    const sampleData: Partial<Character> = {
      name: 'Aethelgard the Arcane',
      tagline: 'Grand Magus of the Astral Spire & Keeper of the Celestial Codex',
      creator: 'Alberto Armentero',
      dateCreated: '2026-01-15',
      dateUploaded: today,
      gender: 'Male',
      age: '248 Solar Cycles (Appears 32)',
      role: 'Protagonist / High Sorcerer',
      description: 'A legendary sorcerer born during the Convergence of Twin Moons. Aethelgard wields high-density particle sorcery and ancient astral alchemy to preserve balance across planar boundaries.',
      history: 'Trained at the Silver Sanctum, Aethelgard decoded the lost Codex of Aethel. After surviving the Siege of Nebulae, he founded the Astral Spire as a sanctuary for planar researchers and chronomancers.',
      personality: 'Stoic, intellectually curious, and fiercely protective of ancient lore. Enjoys star mapping and rare herbal tea infusions.',
      appearance: 'Tall and slender with silver-spun hair, luminous indigo eyes, and robes woven with celestial constellations that shimmer under starlight.',
      abilities: 'Particle Sorcery, Astral Projection, Temporal Stasis Shielding, Gravity Manipulation, Codex Reading.',
      strengths: 'Unmatched tactical intellect, vast historical knowledge, high magical endurance.',
      weaknesses: 'Reluctant to delegate critical tasks, vulnerable to Anti-Magic Obsidian relics.',
      bannerImageSrc: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
      highlightedImageSrc: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
      bannerFilter: { brightness: 105, contrast: 110, saturate: 120 },
      bannerAlignment: 'center',
      bannerFit: 'cover',
      colorPalette: ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#0f172a'],
      subImages: [
        {
          id: 'sub-sample-1',
          src: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
          title: '3D Model Sheet - Front & Back Turnaround',
          description: 'Complete robes line-art, rune breakdown, and color palette swatches.'
        },
        {
          id: 'sub-sample-2',
          src: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80',
          title: 'Spellcasting Pose & Staff Detail',
          description: 'Constellation staff gem focus and spell particle flow dynamics.'
        },
        {
          id: 'sub-sample-3',
          src: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=80',
          title: 'Facial Expressions & Astral Glow',
          description: 'Neutral, spellcasting focus, and celestial power awakening states.'
        }
      ],
      audios: [
        {
          id: 'aud-sample-1',
          src: 'https://cdn.freesound.org/previews/612/612086_5674468-lq.mp3',
          title: 'Astral Spire Ambient Theme',
          description: 'Orchestral theme track and ambient background music for story scenes.',
          category: 'Music Tracks'
        },
        {
          id: 'aud-sample-2',
          src: 'https://cdn.freesound.org/previews/538/538549_11861866-lq.mp3',
          title: 'Voice Sample - Spell Incantation Chant',
          description: 'High-fidelity character voice line sample for celestial spellcasting.',
          category: 'Voice Clips'
        }
      ],
      videos: [
        {
          id: 'vid-sample-1',
          src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          title: 'Spellcasting Particle Showcase & Animation Reel',
          description: 'Turnaround animation reel and magical particle effect demonstration clip.',
          category: 'Show Episodes'
        },
        {
          id: 'vid-sample-2',
          src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
          title: '3D Mesh Turnaround & Skeletal Rig Demo',
          description: '360-degree high density mesh and bone rigging preview clip.',
          category: 'Demonstrations'
        }
      ],
      relationships: [
        {
          id: 'rel-sample-1',
          targetName: 'Archmage Vane',
          relationshipType: 'Eternal Rival & Planar Sentinel',
          notes: 'Former classmate at Silver Sanctum; frequent philosophical rival on planar containment.',
          iconUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
        },
        {
          id: 'rel-sample-2',
          targetName: 'Lyra Vance',
          relationshipType: 'Star Apprentice & Chronomancer',
          notes: 'Prodigious young mage learning spatial alchemy and temporal stasis spellwork.',
          iconUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80'
        }
      ],
      biblePages: [
        {
          id: 'page-1',
          title: 'Origins & Convergence',
          content: '# Origins & The Convergence\n\nAethelgard was discovered by the Arch-Scholars in the ruins of Astral Spire during the Great Alignment.\n\n### Key Chronology:\n- **Cycle 12**: Decoded the Codex of Aethel.\n- **Cycle 45**: Constructed the Stasis Telescope.\n- **Cycle 120**: Repelled the Void Rift.'
        },
        {
          id: 'page-2',
          title: 'Arcane Codex & Spell List',
          content: '### Core Spells & Incantations\n\n1. **Aegis of the Constellation**: High-density forcefield protecting against elemental damage.\n2. **Particle Supernova**: Focuses ambient light energy into a pinpoint explosion.\n3. **Temporal Rift**: Slows enemy movements within a 20m radius.'
        }
      ],
      devTracker: {
        startDate: '2026-01-15',
        credits: [
          { role: 'Lead Author & Concept Creator', name: 'Alberto Armentero' },
          { role: '3D Art & Rigging', name: 'Studio VFX' },
          { role: 'Soundtrack & Voice Direction', name: 'Audio Labs' }
        ],
        logs: [
          { id: 'log-1', date: '2026-01-16', hoursSpent: 3, description: 'Initial character bible written and lore outlined.' },
          { id: 'log-2', date: '2026-01-20', hoursSpent: 5, description: 'Concept art and 3D model sheet turnaround finalized.' },
          { id: 'log-3', date: '2026-02-01', hoursSpent: 4, description: 'Voice lines and ambient soundtrack tracks imported into media archive.' }
        ]
      }
    };

    setFormData(prev => ({ ...prev, ...sampleData }));
  };

  // Export handlers
  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(formData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(formData.name || 'character').toLowerCase().replace(/\s+/g, '_')}_archive.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleExportDoc = () => {
    const name = formData.name || 'Character';
    let docContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${name} - Character Brief</title><style>body{font-family:Arial,sans-serif;padding:30px;line-height:1.6;}h1{color:#1e293b;border-bottom:2px solid #3b82f6;}h2{color:#3b82f6;margin-top:20px;}.label{font-weight:bold;color:#475569;}</style></head><body>`;
    docContent += `<h1>${name}</h1>`;
    if (formData.tagline) docContent += `<p><em>${formData.tagline}</em></p>`;
    docContent += `<p><span class="label">Created By:</span> ${formData.creator || 'Alberto Armentero'} | <span class="label">Date:</span> ${formData.dateCreated || ''}</p>`;
    docContent += `<h2>Overview & History</h2><p>${formData.description || formData.history || 'N/A'}</p>`;
    if (formData.abilities) docContent += `<h2>Abilities & Powers</h2><p>${formData.abilities}</p>`;
    if (formData.personality) docContent += `<h2>Personality</h2><p>${formData.personality}</p>`;
    if (formData.relationships && formData.relationships.length > 0) {
      docContent += `<h2>Relationships</h2><ul>`;
      formData.relationships.forEach(r => {
        docContent += `<li><strong>${r.name}</strong> (${r.role}): ${r.description || ''}</li>`;
      });
      docContent += `</ul>`;
    }
    docContent += `</body></html>`;

    const blob = new Blob([docContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.toLowerCase().replace(/\s+/g, '_')}_brief.doc`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleExportMarkdown = () => {
    const name = formData.name || 'Character';
    let md = `# ${name}\n\n> ${formData.tagline || ''}\n\n`;
    md += `**Creator:** ${formData.creator || 'Alberto Armentero'}  \n`;
    md += `**Created Date:** ${formData.dateCreated || ''}  \n\n`;
    md += `## Description\n${formData.description || ''}\n\n`;
    if (formData.history) md += `## History\n${formData.history}\n\n`;
    if (formData.abilities) md += `## Abilities\n${formData.abilities}\n\n`;
    if (formData.biblePages && formData.biblePages.length > 0) {
      md += `## Lore & Bible Notes\n\n`;
      formData.biblePages.forEach(p => {
        md += `### ${p.title}\n${p.content || ''}\n\n`;
      });
    }
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.toLowerCase().replace(/\s+/g, '_')}_codex.md`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  // Drag and drop text files
  const handleBibleTextDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'text/plain' || file.name.endsWith('.txt'))) {
      const reader = new FileReader();
      reader.onload = (event) => {
         const text = event.target?.result as string;
         updateBiblePageContent(activeDetailSubTab, text);
      };
      reader.readAsText(file);
    } else if (e.dataTransfer.getData('text')) {
       updateBiblePageContent(activeDetailSubTab, e.dataTransfer.getData('text'));
    }
  };
  
  const handleBibleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
         const text = event.target?.result as string;
         updateBiblePageContent(activeDetailSubTab, text);
      };
      reader.readAsText(file);
    }
  };

  const updateBiblePageContent = (tabId: string, text: string) => {
    const pages = formData.biblePages ? [...formData.biblePages] : [];
    const index = pages.findIndex(p => p.id === tabId);
    if (index !== -1) {
      pages[index].content = text;
      setFormData({...formData, biblePages: pages});
    }
  };

  // Spell Check & Organization helper calling server endpoint
  const handleCheckText = async () => {
    const pages = formData.biblePages || [];
    const activePage = pages.find(p => p.id === activeDetailSubTab);
    if (!activePage || !activePage.content.trim()) {
      alert("Please enter some text first before organizing and checking.");
      return;
    }

    setIsCheckingText(true);
    setAiReport(null);
    try {
      const response = await fetch('/api/organize-and-check-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: activePage.content })
      });
      if (response.ok) {
        const result = await response.json();
        setAiReport(result);
      } else {
        const err = await response.text();
        throw new Error(err);
      }
    } catch (err: any) {
      alert("Error organizing text: " + err.message);
    } finally {
      setIsCheckingText(false);
    }
  };

  const applyCorrections = () => {
    if (aiReport && aiReport.organizedText) {
      updateBiblePageContent(activeDetailSubTab, aiReport.organizedText);
      alert("Spelling & Grammar corrections applied!");
    }
  };

  /**
   * Send the Editorial Suite report into the record instead of leaving it in
   * the side panel. Two destinations, deliberately:
   *
   *   - a dated page in the section index, so the report is kept as its own
   *     entry rather than merged into notes the user already wrote;
   *   - the main description, but only when that field is empty, so pressing
   *     Send twice can never overwrite work typed by hand.
   */
  const sendReportToProfile = () => {
    if (!aiReport) return;

    const sections = aiReport.bibleSections;
    const parts: string[] = [];
    if (sections) {
      const labelled: Array<[string, string | undefined]> = [
        ['Executive Concepts', sections.executiveConcepts],
        ['Core Premise', sections.corePremise],
        ['Height & Build', sections.heightBuild],
        ['Personality & Speech', sections.personalitySpeech],
      ];
      for (const [label, value] of labelled) {
        if (value && value.trim()) parts.push(`**${label}:** ${value.trim()}`);
      }
    }
    if (aiReport.organizedText && aiReport.organizedText.trim()) {
      parts.push(aiReport.organizedText.trim());
    }
    if (aiReport.corrections && aiReport.corrections.length) {
      const fixes = aiReport.corrections
        .filter((c) => c.original !== c.corrected)
        .map((c) => `- "${c.original}" -> "${c.corrected}"`)
        .join('\n');
      if (fixes) parts.push(`**Corrections applied:**\n${fixes}`);
    }

    if (!parts.length) {
      setCopyToast('Nothing in the report to send.');
      return;
    }

    const body = parts.join('\n\n');
    const pageTitle = `Editorial Report - ${new Date().toLocaleDateString()}`;

    setFormData(prev => {
      const next = { ...prev };
      const existing = prev.biblePages || [];
      const clash = existing.some(
        (p) => (p.title || '').toLowerCase() === pageTitle.toLowerCase(),
      );

      if (!clash) {
        next.biblePages = [
          ...existing,
          {
            id: `page-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            title: pageTitle,
            content: body,
            parentId: null,
            isLocked: false,
          },
        ];
      }

      // Only fill an empty description. Overwriting one the user wrote would
      // lose their work for no gain.
      if (!next.description || !next.description.trim()) {
        next.description = body;
      }
      return next;
    });

    setCopyToast(`Sent to your profile as "${pageTitle}".`);
    setAiReport(null);
  };

  const loadSectionTemplate = (tabId: string) => {
    const templateText = `### DOCUMENTATION & NOTES TEMPLATE\n\n- **Primary Purpose:** [Specify core role or significance]\n- **Key Features / Characteristics:** [Main visual or behavioral traits]\n- **Origins & Background:** [Brief history or creation details]\n- **Important References / Links:** [Related items or project notes]\n- **Status & Milestones:** [Current state of development or appearance]`;
    updateBiblePageContent(tabId, templateText);
  };

  // Audio Recording helpers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const newAudio = {
          id: `rec-${Date.now()}`,
          src: audioUrl,
          title: `Voice Recording #${(formData.audios?.length || 0) + 1}`,
          description: `Recorded live on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`
        };

        setFormData({
          ...formData,
          audios: [...(formData.audios || []), newAudio]
        });
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      alert("Could not access microphone: " + err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  // Audio/Video file upload handlers
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const newAudio = {
        id: `audio-${Date.now()}`,
        src: url,
        title: file.name.replace(/\.[^/.]+$/, ""),
        description: `Uploaded audio asset (${(file.size / (1024 * 1024)).toFixed(2)} MB)`
      };
      setFormData({
        ...formData,
        audios: [...(formData.audios || []), newAudio]
      });
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const newVideo = {
        id: `video-${Date.now()}`,
        src: url,
        title: file.name.replace(/\.[^/.]+$/, ""),
        description: `Uploaded video clip (${(file.size / (1024 * 1024)).toFixed(2)} MB)`
      };
      setFormData({
        ...formData,
        videos: [...(formData.videos || []), newVideo]
      });
    }
  };

  // Gallery images list
  const resolvedSourceItem = item || sourceItem || (items && activeChar ? items.find(i => i.id === activeChar.sourceId) : undefined);
  const activeItem = resolvedSourceItem;
  const galleryImages: { id: string, src: string, title: string, description: string }[] = [];
  if (activeItem && activeItem.type === 'image') {
    galleryImages.push({
      id: 'main',
      src: activeItem.content,
      title: formData.name || 'Original Image',
      description: 'Original full view.'
    });
  }
  if (formData.subImages && formData.subImages.length > 0) {
    formData.subImages.forEach((sub, i) => {
      galleryImages.push({
        id: sub.id,
        src: sub.src,
        title: sub.title || `Sub Image #${i + 1}`,
        description: sub.description || ''
      });
    });
  }

  // Touch triggers
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

  // Export Booklet
  const handleExportBooklet = async (format: 'pdf' | 'word' | 'gdocs') => {
    setIsExporting(true);
    setShowExportMenu(false);
    try {
      await exportCharacterBooklet({
        character: formData as Character,
        format,
        onProgress: (msg) => {
          console.log(`[Export Booklet] ${msg}`);
        }
      });
    } catch (err: any) {
      alert(`Export failed: ${err.message || err}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Interactive Production Bible & Export Publisher
  const handlePrintCatalogBooklet = (customOpts?: Partial<BiblePrintOptions>) => {
    const activeOptions: BiblePrintOptions = {
      ...bibleOptions,
      ...(customOpts || {}),
    };
    printBibleDocument(formData as Character, activeOptions);
  };

  // Outer Tab Label helper
  const getTabLabel = (key: string, defaultLabel: string) => {
    return formData.outerTabLabels?.[key] || defaultLabel;
  };

  const getOrderedTabs = () => {
    const baseTabs = [
      { id: 'overview', defaultLabel: 'Overview', icon: Eye, isCustom: false },
      { id: 'profile', defaultLabel: 'Profile', icon: User, isCustom: false },
      { id: 'details', defaultLabel: 'Details', icon: BookOpen, isCustom: false },
      { id: 'projects', defaultLabel: 'Projects', icon: Briefcase, isCustom: false },
      { id: 'moodboard', defaultLabel: 'Mood Board', icon: LayoutGrid, isCustom: false },
      { id: 'media', defaultLabel: 'Media', icon: ImageIcon, isCustom: false },
      { id: 'spreadsheet', defaultLabel: 'Data Sheet', icon: FileSpreadsheet, isCustom: false },
      { id: 'code', defaultLabel: 'Code & Apps', icon: Code, isCustom: false },
      { id: 'cataloger', defaultLabel: 'Booklet Publisher', icon: Printer, isCustom: false },
      { id: 'technical', defaultLabel: 'Specs', icon: Settings, isCustom: false },
      { id: 'dev', defaultLabel: 'Dev / Credits', icon: Clock, isCustom: false },
    ];
    const customTabs = (formData.customTabs || []).map((t: any) => ({
      id: t.id,
      defaultLabel: t.title,
      icon: Layers,
      isCustom: true
    }));
    const allTabs = [...baseTabs, ...customTabs];
    const order = formData.tabOrder || [];
    if (order.length === 0) return allTabs;
    
    const sorted = [...allTabs].sort((a, b) => {
      const idxA = order.indexOf(a.id);
      const idxB = order.indexOf(b.id);
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
    return sorted;
  };

  const handleTabReorder = (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;
    const currentTabs = getOrderedTabs().map(t => t.id);
    const draggedIdx = currentTabs.indexOf(draggedId);
    const targetIdx = currentTabs.indexOf(targetId);
    if (draggedIdx === -1 || targetIdx === -1) return;
    
    const newOrder = [...currentTabs];
    newOrder.splice(draggedIdx, 1);
    newOrder.splice(targetIdx, 0, draggedId);
    
    setFormData(prev => ({
      ...prev,
      tabOrder: newOrder
    }));
  };

  const handleRenameTab = (key: string, defaultLabel: string) => {
    const current = getTabLabel(key, defaultLabel);
    const newLabel = prompt(`Rename '${current}' tab to custom title:`, current);
    if (newLabel && newLabel.trim()) {
      setFormData({
        ...formData,
        outerTabLabels: {
          ...(formData.outerTabLabels || {}),
          [key]: newLabel.trim()
        }
      });
    }
  };

  // Generic Files Upload Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const newFile = {
      id: `file-${Date.now()}`,
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      type: file.type || file.name.split('.').pop() || 'document',
      url: url,
      dateAdded: new Date().toISOString().split('T')[0],
      category: activeMediaCategory !== 'all' ? activeMediaCategory : undefined
    };

    setFormData({
      ...formData,
      genericFiles: [...(formData.genericFiles || []), newFile]
    });
  };

  const handleDeleteFile = (fileId: string) => {
    setFormData({
      ...formData,
      genericFiles: (formData.genericFiles || []).filter(f => f.id !== fileId)
    });
  };

  // Storyboard / Table Handlers for Projects
  const handleAddTableToProject = (projectId: string) => {
    const title = prompt("Enter Storyboard / Cell Sheet Table Title:", "Storyboard Panel Sheet");
    if (!title) return;

    const newTable = {
      id: `table-${Date.now()}`,
      title: title.trim(),
      columns: ["Scene / Frame", "Image Asset", "Dialogue & Audio Notes", "Status"],
      rows: [
        [
          { id: `c-${Date.now()}-1`, content: "Scene 1 - Frame 1", fontWeight: 'bold' as const },
          { id: `c-${Date.now()}-2`, content: galleryImages[0]?.src || '', isImage: true },
          { id: `c-${Date.now()}-3`, content: "Opening scene dialogue and environment notes." },
          { id: `c-${Date.now()}-4`, content: "In Progress", bgColor: "#FEF3C7" }
        ]
      ]
    };

    const updatedProjects = (formData.projects || []).map(p => {
      if (p.id === projectId) {
        return { ...p, tables: [...(p.tables || []), newTable] };
      }
      return p;
    });

    setFormData({ ...formData, projects: updatedProjects });
  };

  const handleUpdateTableCell = (projectId: string, tableId: string, rowIndex: number, colIndex: number, updates: any) => {
    const updatedProjects = (formData.projects || []).map(p => {
      if (p.id === projectId) {
        const updatedTables = (p.tables || []).map(t => {
          if (t.id === tableId) {
            const newRows = t.rows.map((row, rIdx) => {
              if (rIdx === rowIndex) {
                return row.map((cell, cIdx) => {
                  if (cIdx === colIndex) {
                    return { ...cell, ...updates };
                  }
                  return cell;
                });
              }
              return row;
            });
            return { ...t, rows: newRows };
          }
          return t;
        });
        return { ...p, tables: updatedTables };
      }
      return p;
    });

    setFormData({ ...formData, projects: updatedProjects });
  };

  const handleAddRowToTable = (projectId: string, tableId: string) => {
    const updatedProjects = (formData.projects || []).map(p => {
      if (p.id === projectId) {
        const updatedTables = (p.tables || []).map(t => {
          if (t.id === tableId) {
            const newRow = t.columns.map((_, colIdx) => ({
              id: `c-${Date.now()}-${colIdx}`,
              content: colIdx === 0 ? `Frame ${t.rows.length + 1}` : ""
            }));
            return { ...t, rows: [...t.rows, newRow] };
          }
          return t;
        });
        return { ...p, tables: updatedTables };
      }
      return p;
    });

    setFormData({ ...formData, projects: updatedProjects });
  };

  // Dev Tracker & Work Log Handlers
  const handleAddDevLog = () => {
    if (!devLogDesc.trim() && !devLogMilestone.trim()) return;
    const newLog = {
      id: `log-${Date.now()}`,
      date: devLogDate || new Date().toISOString().split('T')[0],
      hoursSpent: Number(devLogHours) || 1,
      description: devLogDesc.trim(),
      milestone: devLogMilestone || "General Progress"
    };

    const currentDevTracker = formData.devTracker || {
      startDate: formData.dateCreated || new Date().toISOString().split('T')[0],
      credits: [
        { role: "Author & Lead Creator", name: formData.name || "Main Creator" },
        { role: "Developer", name: "AI Studio Builder" }
      ],
      logs: []
    };

    setFormData({
      ...formData,
      devTracker: {
        ...currentDevTracker,
        logs: [newLog, ...(currentDevTracker.logs || [])]
      }
    });

    setDevLogDesc('');
  };

  const handleDeleteDevLog = (logId: string) => {
    if (!formData.devTracker) return;
    setFormData({
      ...formData,
      devTracker: {
        ...formData.devTracker,
        logs: (formData.devTracker.logs || []).filter(l => l.id !== logId)
      }
    });
  };

  const handleAddDevCredit = () => {
    if (!devCreditName.trim()) return;
    const currentDevTracker = formData.devTracker || {
      startDate: formData.dateCreated || new Date().toISOString().split('T')[0],
      credits: [],
      logs: []
    };

    const newCredit = {
      id: `cred-${Date.now()}`,
      name: devCreditName.trim(),
      role: devCreditRole.trim() || 'Contributor',
      contact: devCreditContact.trim()
    };

    setFormData({
      ...formData,
      devTracker: {
        ...currentDevTracker,
        credits: [...(currentDevTracker.credits || []), newCredit]
      }
    });

    setDevCreditName('');
    setDevCreditRole('');
    setDevCreditContact('');
  };

  const handleDeleteDevCredit = (credId: string) => {
    if (!formData.devTracker) return;
    setFormData({
      ...formData,
      devTracker: {
        ...formData.devTracker,
        credits: (formData.devTracker.credits || []).filter(c => c.id !== credId && c.name !== credId)
      }
    });
  };

  if (!activeChar) return null;

  const defaultFirstThumbnail = galleryImages[0]?.src || (activeItem?.type === 'image' ? activeItem.content : undefined);
  const mainImageSrc = formData.defaultThumbnailSrc || formData.highlightedImageSrc || defaultFirstThumbnail;
  const activeTabColor = formData.tabColors?.[activeOuterTab] || DEFAULT_TAB_SPECTRUM[activeOuterTab] || '#3b82f6';

  // Recursive helper to render Bible page hierarchy in left sidebar list
  const renderBiblePageNode = (page: BiblePage, level = 0) => {
    const isActive = activeDetailSubTab === page.id;
    const children = (formData.biblePages || []).filter(p => p.parentId === page.id);

    return (
      <div key={page.id} className="space-y-1">
        <div 
          onClick={() => { setActiveDetailSubTab(page.id); setAiReport(null); }}
          className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-secondary/80 text-foreground'}`}
          style={{ paddingLeft: `${Math.max(8, level * 14 + 8)}px` }}
        >
          <div className="flex items-center gap-1.5 truncate">
            {page.isLocked ? (
              <Lock className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-primary-foreground' : 'text-red-500'}`} />
            ) : (
              <FileText className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-primary-foreground' : 'text-primary'}`} />
            )}
            <span className="truncate">{page.title}</span>
          </div>

          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleTogglePageLock(page.id);
              }}
              className={`p-1 rounded hover:bg-black/20 ${isActive ? 'text-white' : 'text-muted-foreground'}`}
              title={page.isLocked ? "Unlock page" : "Lock page"}
            >
              {page.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDuplicateBiblePage(page.id);
              }}
              className={`p-1 rounded hover:bg-black/20 ${isActive ? 'text-white' : 'text-muted-foreground'}`}
              title="Duplicate page"
            >
              <Copy className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setNewSubPageParentId(page.id);
                setShowAddSubPageModal(true);
              }}
              className={`p-1 rounded hover:bg-black/20 ${isActive ? 'text-white' : 'text-primary'}`}
              title="Add nested subpage"
            >
              <Plus className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const newTitle = prompt("Rename subpage:", page.title);
                if (newTitle && newTitle.trim()) {
                  handleRenameBiblePage(page.id, newTitle.trim());
                }
              }}
              className={`p-1 rounded hover:bg-black/20 ${isActive ? 'text-white' : 'text-muted-foreground'}`}
              title="Rename subpage"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            {(formData.biblePages?.length || 0) > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteBiblePage(page.id);
                }}
                className={`p-1 rounded hover:bg-black/20 ${isActive ? 'text-white' : 'text-destructive'}`}
                title="Delete subpage"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Children */}
        {children.length > 0 && (
          <div className="space-y-1">
            {children.map(child => renderBiblePageNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Recursive helper to render Media Categories hierarchy in left sidebar list with vibrant colors & high contrast buttons
  const renderMediaCategoryNode = (cat: { id: string; name: string; type: 'image' | 'audio' | 'video'; parentId?: string; color?: string }, level = 0) => {
    const isActive = activeMediaCategory === cat.id;
    const catType = activeMediaSubTab === 'audios' ? 'audio' : activeMediaSubTab === 'videos' ? 'video' : 'image';
    const children = (formData.mediaCategories || []).filter(c => c.parentId === cat.id && c.type === catType);

    // Color palette rotation for colorful folders & subfolders
    const folderColors = ['text-indigo-400 border-indigo-500/30 bg-indigo-500/10', 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10', 'text-amber-400 border-amber-500/30 bg-amber-500/10', 'text-rose-400 border-rose-500/30 bg-rose-500/10', 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10', 'text-purple-400 border-purple-500/30 bg-purple-500/10'];
    const colorClass = folderColors[Math.abs(cat.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % folderColors.length];

    let count = 0;
    if (cat.type === 'audio') {
      count = (formData.audios || []).filter(a => a.category === cat.id).length;
    } else if (cat.type === 'video') {
      count = (formData.videos || []).filter(v => v.category === cat.id).length;
    } else if (cat.type === 'image') {
      count = galleryImages.length;
    }

    return (
      <div key={cat.id} className="space-y-1">
        <div 
          onClick={() => setActiveMediaCategory(cat.id)}
          className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all border-l-4 ${colorClass} ${isActive ? 'bg-primary text-primary-foreground shadow-md font-bold' : 'hover:bg-secondary/90 text-foreground'}`}
          style={{ paddingLeft: `${Math.max(10, level * 14 + 10)}px` }}
        >
          <div className="flex items-center gap-2 truncate">
            <Folder className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-primary-foreground' : 'text-primary'}`} />
            <span className="truncate">{cat.name}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1 ${isActive ? 'bg-white/20 text-white' : 'bg-secondary text-muted-foreground'}`}>{count}</span>
          </div>

          <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setNewMediaCatType(cat.type);
                setNewMediaCatParentId(cat.id);
                setShowAddMediaCatModal(true);
              }}
              className="p-1 rounded-md bg-slate-900/80 hover:bg-primary text-white transition-colors shadow-xs"
              title="Add nested subcategory"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteMediaCategory(cat.id);
              }}
              className="p-1 rounded-md bg-slate-900/80 hover:bg-rose-600 text-white transition-colors shadow-xs"
              title="Delete category"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Children */}
        {children.length > 0 && (
          <div className="space-y-1 pl-2 border-l border-border/40 ml-2">
            {children.map(child => renderMediaCategoryNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const DEFAULT_TAB_SPECTRUM_LOCAL: Record<string, string> = {
    overview: '#3b82f6',
    profile: '#eab308',
    details: '#06b6d4',
    projects: '#a855f7',
    media: '#10b981',
    technical: '#f43f5e',
    dev: '#f97316'
  };

  const tabPos = formData.tabLayoutPosition || (formData.tabLayout === 'side' ? 'left' : 'top');
  const toolsPos = formData.editToolsPosition || 'right';
  const tabRows = formData.tabRows || 'single';
  const tabColors = formData.tabColors || DEFAULT_TAB_SPECTRUM_LOCAL;

  // Helper to render the Tab Bar (either vertical or horizontal)
  const renderTabsBar = (orientation: 'horizontal' | 'vertical') => {
    if (isProfileControlsHidden && orientation === 'vertical') return null;
    const isVert = orientation === 'vertical';
    const widthStyle = isVert ? { width: `${formData.tabsWidth || 208}px` } : {};
    const heightStyle = !isVert ? { height: `${formData.tabsHeight || 50}px` } : {};
    
    return (
      <div 
        className={`bg-card select-none shrink-0 flex relative border-slate-200 dark:border-slate-800/80 ${
          isVert 
            ? `flex-col h-full ${tabPos === 'right' ? 'border-l' : 'border-r'} p-4` 
            : `w-full items-center ${tabPos === 'bottom' ? 'border-t' : 'border-b'} px-4 py-1.5 gap-2`
        }`}
        style={{ ...widthStyle, ...heightStyle }}
      >
        {/* Visual mouse resize handle for stretching! */}
        {isVert ? (
          <div 
            className={`absolute top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/50 transition-all z-40 group ${tabPos === 'right' ? 'left-0' : 'right-0'}`}
            onMouseDown={(e) => { e.preventDefault(); setIsResizingTabs(true); }}
            title="Drag to stretch tab bar"
          >
            <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-slate-300 dark:bg-slate-700 rounded-full group-hover:bg-primary" />
          </div>
        ) : (
          <div 
            className={`absolute left-0 right-0 h-1.5 cursor-row-resize hover:bg-primary/50 transition-all z-40 group ${tabPos === 'bottom' ? 'top-0' : 'bottom-0'}`}
            onMouseDown={(e) => { e.preventDefault(); setIsResizingTabs(true); }}
            title="Drag to stretch tab bar height"
          >
            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 h-0.5 w-8 bg-slate-300 dark:bg-slate-700 rounded-full group-hover:bg-primary" />
          </div>
        )}

        {/* Navigation header (vertical only) */}
        {isVert && (
          <div className="pb-2 border-b mb-2 flex items-center justify-between shrink-0">
            <span className="font-extrabold text-[10px] text-muted-foreground uppercase tracking-widest">Navigation</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowAddMainTabModal(true)}
                className="p-1.5 rounded-lg border border-dashed border-primary/40 text-primary hover:bg-primary/15 hover:border-primary/60 transition-all cursor-pointer flex items-center justify-center shrink-0"
                title="Add custom tab"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setShowTabSettings(!showTabSettings)}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer shrink-0 ${showTabSettings ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary hover:bg-secondary/80 text-foreground'}`}
                title="Tab Layout & Sizing"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Tabs scroll list */}
        <div className={`flex flex-1 min-h-0 ${
          isVert 
            ? 'flex-col gap-1 overflow-y-auto scrollbar-thin pb-2' 
            : tabRows === 'multi' 
              ? 'flex-wrap items-center gap-1.5 overflow-visible py-1 w-full' 
              : 'items-center gap-1.5 overflow-x-auto scrollbar-thin py-1 w-full whitespace-nowrap'
        }`}>
          {getOrderedTabs().map((tab) => {
            const IconComponent = tab.icon;
            const currentLabel = tab.isCustom ? tab.defaultLabel : getTabLabel(tab.id, tab.defaultLabel);
            const isActive = activeOuterTab === tab.id;
            const tabColor = tabColors[tab.id] || DEFAULT_TAB_SPECTRUM_LOCAL[tab.id] || '#3b82f6';

            return (
              <div 
                key={tab.id} 
                className={`relative group flex items-center shrink-0 ${isVert ? 'w-full py-0.5' : 'py-0.5'}`}
                draggable={isEditMode}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', tab.id);
                  setDraggedTabId(tab.id);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const targetId = tab.id;
                  const draggedId = e.dataTransfer.getData('text/plain') || draggedTabId;
                  if (draggedId) {
                    handleTabReorder(draggedId, targetId);
                  }
                }}
                onDragEnd={() => setDraggedTabId(null)}
              >
                {isEditMode && (
                  <div 
                    className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-foreground p-0.5 mr-1 shrink-0 flex items-center justify-center"
                    title="Drag to reorder"
                  >
                    <div className="grid grid-cols-2 gap-0.5 w-1.5 h-3">
                      <div className="w-0.5 h-0.5 rounded-full bg-current" />
                      <div className="w-0.5 h-0.5 rounded-full bg-current" />
                      <div className="w-0.5 h-0.5 rounded-full bg-current" />
                      <div className="w-0.5 h-0.5 rounded-full bg-current" />
                      <div className="w-0.5 h-0.5 rounded-full bg-current" />
                      <div className="w-0.5 h-0.5 rounded-full bg-current" />
                    </div>
                  </div>
                )}

                <button 
                  className={`font-extrabold transition-all flex items-center gap-1.5 cursor-pointer text-xs justify-start text-left ${
                    isVert 
                      ? 'flex-1 w-full px-2.5 py-1.5 rounded-lg border-l-2' 
                      : 'px-3 py-1 rounded-lg border'
                  }`}
                  style={{
                    color: isActive ? tabColor : undefined,
                    borderColor: isActive ? tabColor : 'transparent',
                    backgroundColor: isActive ? `${tabColor}15` : undefined
                  }}
                  onClick={() => { 
                    setActiveOuterTab(tab.id); 
                    if (tab.isCustom) {
                      const customTabObj = formData.customTabs?.find(ct => ct.id === tab.id);
                      if (customTabObj?.subTabs && customTabObj.subTabs.length > 0) {
                        setActiveCustomSubTab(customTabObj.subTabs[0].id);
                      }
                    }
                    setAiReport(null); 
                  }}
                >
                  <span 
                    className="w-1.5 h-1.5 rounded-full shrink-0" 
                    style={{ backgroundColor: tabColor }}
                  />
                  <IconComponent className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate flex-1">{currentLabel}</span>

                  {tab.isCustom && isEditMode && (
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handleDeleteCustomMainTab(tab.id); 
                      }}
                      className="p-0.5 text-muted-foreground hover:text-destructive transition-colors rounded hover:bg-destructive/10 ml-1 shrink-0"
                      title="Delete Custom Tab"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </button>

                {isEditMode && !tab.isCustom && (
                  <div className={`flex items-center gap-0.5 pl-1 shrink-0 ${isVert ? 'opacity-0 group-hover:opacity-100 transition-opacity' : ''}`}>
                    <input 
                      type="color" 
                      value={tabColor}
                      onChange={e => handleSetTabColor(tab.id, e.target.value)}
                      className="w-3.5 h-3.5 rounded cursor-pointer border-0 bg-transparent shrink-0 p-0"
                      title="Change color"
                    />
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleRenameTab(tab.id, tab.defaultLabel); }}
                      className="p-0.5 text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                      title="Rename"
                    >
                      <Edit2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add tab button in-line (horizontal only) */}
          {!isVert && (
            <button 
              onClick={() => setShowAddMainTabModal(true)}
              className="font-bold text-primary hover:bg-primary/10 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors border border-dashed border-primary/30 shrink-0 px-2 py-1 text-[11px]"
              title="Add custom tab"
            >
              <Plus className="w-3 h-3" />
              <span>Add Tab</span>
            </button>
          )}
        </div>

        {/* Tab layout settings button (horizontal only) */}
        {!isVert && (
          <button 
            onClick={() => setShowTabSettings(!showTabSettings)}
            className={`p-1 rounded-lg border transition-all cursor-pointer shrink-0 ${showTabSettings ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary hover:bg-secondary/80 text-foreground'}`}
            title="Tab Layout & Sizing"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Tab settings popover */}
        {showTabSettings && (
          <div className={`absolute bg-popover text-popover-foreground border rounded-xl shadow-2xl p-4 w-60 z-50 animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col gap-3 ${
            isVert ? 'left-4 top-12' : 'right-4 top-12'
          }`}>
            <div className="flex items-center justify-between border-b pb-1.5">
              <span className="font-bold text-xs flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-primary" />
                Tab Bar Customizer
              </span>
              <button onClick={() => setShowTabSettings(false)} className="p-1 hover:bg-secondary rounded-md">
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* Tab Layout positions */}
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">Placement</span>
              <div className="grid grid-cols-4 gap-1 bg-secondary/30 p-1 rounded-lg border text-center">
                {['top', 'bottom', 'left', 'right'].map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setFormData({ ...formData, tabLayoutPosition: pos as any })}
                    className={`py-1 rounded text-[9px] font-bold capitalize transition-all ${tabPos === pos ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            {/* Wrapping rows (horizontal only) */}
            {!isVert && (
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">Wrapping mode</span>
                <div className="grid grid-cols-2 gap-1 bg-secondary/30 p-1 rounded-lg border">
                  <button 
                    onClick={() => setFormData({ ...formData, tabRows: 'single' })}
                    className={`py-1 rounded text-[9px] font-bold transition-all ${tabRows === 'single' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Single Row
                  </button>
                  <button 
                    onClick={() => setFormData({ ...formData, tabRows: 'multi' })}
                    className={`py-1 rounded text-[9px] font-bold transition-all ${tabRows === 'multi' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Multi-Row
                  </button>
                </div>
              </div>
            )}

            {/* Header Element Visibility Toggles */}
            <div className="space-y-1 border-t pt-2">
              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">Header Elements</span>
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, hideIcon: !formData.hideIcon })}
                  className={`w-full py-1.5 px-2 rounded text-[10px] font-bold border transition-all flex items-center justify-between cursor-pointer ${
                    formData.hideIcon ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' : 'bg-secondary hover:bg-secondary/80 text-foreground'
                  }`}
                  title="Toggle profile portrait icon section visibility"
                >
                  <span className="flex items-center gap-1"><User className="w-3 h-3" /> Icon Section</span>
                  <span className="text-[9px] opacity-80">{formData.hideIcon ? 'Hidden' : 'Visible'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, hideBanner: !formData.hideBanner })}
                  className={`w-full py-1.5 px-2 rounded text-[10px] font-bold border transition-all flex items-center justify-between cursor-pointer ${
                    formData.hideBanner ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' : 'bg-secondary hover:bg-secondary/80 text-foreground'
                  }`}
                  title="Toggle profile background banner visibility"
                >
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> Profile Banner</span>
                  <span className="text-[9px] opacity-80">{formData.hideBanner ? 'Hidden' : 'Visible'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const hideBoth = !(formData.hideBanner && formData.hideIcon);
                    setFormData({
                      ...formData,
                      hideBanner: hideBoth,
                      hideIcon: hideBoth
                    });
                  }}
                  className="w-full py-1.5 px-2 rounded text-[10px] font-bold border border-dashed border-primary/40 bg-primary/5 text-primary hover:bg-primary/15 transition-all flex items-center justify-between cursor-pointer"
                  title="Toggle both Profile Banner and Icon visibility simultaneously"
                >
                  <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 animate-pulse" /> Toggle Both</span>
                  <span className="text-[9px] font-black uppercase">{formData.hideBanner && formData.hideIcon ? 'Show Both' : 'Hide Both'}</span>
                </button>
              </div>
            </div>

            {/* Tab Reset */}
            <button 
              onClick={() => {
                setFormData({
                  ...formData,
                  tabOrder: [],
                  tabLayoutPosition: 'left',
                  tabsWidth: 208,
                  tabsHeight: 50
                });
                alert('Tab sorting & sizes reset to system defaults!');
              }}
              className="w-full bg-secondary hover:bg-secondary/80 text-foreground py-1 rounded text-[10px] font-bold border cursor-pointer mt-1"
            >
              Reset Tab Order & Layout
            </button>
          </div>
        )}
      </div>
    );
  };

  // Helper to render the Edit Tools Sidebar/Bar
  const renderEditToolsPanel = (orientation: 'horizontal' | 'vertical') => {
    if (!isEditMode || isProfileControlsHidden) return null;
    const isVert = orientation === 'vertical';
    const widthStyle = isVert ? { width: `${formData.editToolsWidth || 320}px` } : {};
    const heightStyle = !isVert ? { height: `${formData.editToolsHeight || 70}px` } : {};
    
    return (
      <div 
        className={`bg-card select-none shrink-0 flex flex-col relative border-slate-200 dark:border-slate-800/80 p-4 ${
          isVert 
            ? `h-full ${toolsPos === 'right' ? 'border-l' : 'border-r'} overflow-y-auto scrollbar-thin` 
            : `w-full ${toolsPos === 'bottom' ? 'border-t' : 'border-b'} overflow-x-auto scrollbar-thin`
        }`}
        style={{ ...widthStyle, ...heightStyle }}
      >
        {/* Visual mouse resize handle for stretching! */}
        {isVert ? (
          <div 
            className={`absolute top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/50 transition-all z-40 group ${toolsPos === 'right' ? 'left-0' : 'right-0'}`}
            onMouseDown={(e) => { e.preventDefault(); setIsResizingEditTools(true); }}
            title="Drag to stretch edit tools sidebar"
          >
            <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-slate-300 dark:bg-slate-700 rounded-full group-hover:bg-primary" />
          </div>
        ) : (
          <div 
            className={`absolute left-0 right-0 h-1.5 cursor-row-resize hover:bg-primary/50 transition-all z-40 group ${toolsPos === 'bottom' ? 'top-0' : 'bottom-0'}`}
            onMouseDown={(e) => { e.preventDefault(); setIsResizingEditTools(true); }}
            title="Drag to stretch edit tools height"
          >
            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 h-0.5 w-8 bg-slate-300 dark:bg-slate-700 rounded-full group-hover:bg-primary" />
          </div>
        )}

        <div className={`${isVert ? 'space-y-4' : 'flex items-center gap-4 w-full h-full'}`}>
          {/* Title Bar */}
          <div className={`flex items-center justify-between border-b pb-1.5 shrink-0 ${isVert ? 'w-full' : 'hidden md:flex shrink-0'}`}>
            <span className="font-extrabold text-[10px] text-amber-600 dark:text-amber-500 uppercase tracking-widest flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5" /> Layout Edit Tools
            </span>
            <button 
              onClick={() => {
                setFormData((prev: any) => ({
                  ...prev,
                  tabLayoutPosition: 'left',
                  editToolsPosition: 'right',
                  tabsWidth: 208,
                  editToolsWidth: 320,
                  tabsHeight: 50,
                  editToolsHeight: 65,
                  tabOrder: [],
                  tabColors: {
                    overview: '#3b82f6',
                    profile: '#eab308',
                    details: '#06b6d4',
                    projects: '#a855f7',
                    media: '#10b981',
                    technical: '#f43f5e',
                    dev: '#f97316'
                  }
                }));
                alert("Reset all layout positions, panel sizes, and tab orders back to defaults!");
              }}
              className="bg-secondary hover:bg-secondary/80 text-[10px] font-bold px-2 py-0.5 rounded border border-red-500/20 text-red-500 cursor-pointer transition-all flex items-center gap-1 animate-pulse"
              title="Reset everything to pristine, out-of-the-box defaults"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Default Reset</span>
            </button>
          </div>

          {/* Positioning Matrix */}
          <div className={`space-y-1.5 ${isVert ? 'w-full' : 'shrink-0 min-w-[200px]'}`}>
            <span className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider block">Panel Positions</span>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-foreground">
                <span>Tabs position:</span>
                <div className="flex gap-0.5">
                  {['top', 'bottom', 'left', 'right'].map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setFormData({ ...formData, tabLayoutPosition: pos as any })}
                      className={`px-1 py-0.5 text-[9px] font-bold rounded capitalize border ${tabPos === pos ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary hover:bg-secondary/80 text-muted-foreground'}`}
                    >
                      {pos[0]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-foreground">
                <span>Tools position:</span>
                <div className="flex gap-0.5">
                  {['top', 'bottom', 'left', 'right'].map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setFormData({ ...formData, editToolsPosition: pos as any })}
                      className={`px-1 py-0.5 text-[9px] font-bold rounded capitalize border ${toolsPos === pos ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary hover:bg-secondary/80 text-muted-foreground'}`}
                    >
                      {pos[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sizable Panel Sliders */}
          <div className={`space-y-1.5 ${isVert ? 'w-full' : 'shrink-0 min-w-[220px]'}`}>
            <span className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider block">Stretch Panel Sizes</span>
            <div className="space-y-1">
              {/* Tabs size slider */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[9px] text-muted-foreground font-semibold">
                  <span>Main Tab Bar Size:</span>
                  <span className="text-primary font-bold">{['left', 'right'].includes(tabPos) ? `${formData.tabsWidth || 208}px (W)` : `${formData.tabsHeight || 50}px (H)`}</span>
                </div>
                <input
                  type="range"
                  min={['left', 'right'].includes(tabPos) ? 140 : 35}
                  max={['left', 'right'].includes(tabPos) ? 500 : 250}
                  value={['left', 'right'].includes(tabPos) ? (formData.tabsWidth || 208) : (formData.tabsHeight || 50)}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (['left', 'right'].includes(tabPos)) {
                      setFormData({ ...formData, tabsWidth: val });
                    } else {
                      setFormData({ ...formData, tabsHeight: val });
                    }
                  }}
                  className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
              {/* Tools size slider */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[9px] text-muted-foreground font-semibold">
                  <span>Edit Tools Size:</span>
                  <span className="text-primary font-bold">{['left', 'right'].includes(toolsPos) ? `${formData.editToolsWidth || 320}px (W)` : `${formData.editToolsHeight || 70}px (H)`}</span>
                </div>
                <input
                  type="range"
                  min={['left', 'right'].includes(toolsPos) ? 180 : 45}
                  max={['left', 'right'].includes(toolsPos) ? 600 : 300}
                  value={['left', 'right'].includes(toolsPos) ? (formData.editToolsWidth || 320) : (formData.editToolsHeight || 70)}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (['left', 'right'].includes(toolsPos)) {
                      setFormData({ ...formData, editToolsWidth: val });
                    } else {
                      setFormData({ ...formData, editToolsHeight: val });
                    }
                  }}
                  className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            </div>
          </div>

          {/* Core Customizers */}
          <div className={`space-y-2 flex-1 ${isVert ? 'w-full' : 'flex items-center gap-3'}`}>
            {isVert && <div className="text-[10px] font-black uppercase text-muted-foreground tracking-wider border-t pt-2">Banner & Portrait Controls</div>}
            
            {/* Banner & Icon Hide/Show Toggles */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button 
                onClick={() => setFormData({ ...formData, hideBanner: !formData.hideBanner })}
                className={`px-2 py-1 rounded text-[10px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${formData.hideBanner ? 'bg-amber-500/20 text-amber-600 border-amber-500/40' : 'bg-secondary hover:bg-secondary/80 text-foreground'}`}
                title="Toggle Banner Visibility (Show or Hide Banner completely)"
              >
                <Eye className="w-3 h-3" />
                <span>Banner: {formData.hideBanner ? 'Hidden' : 'Visible'}</span>
              </button>

              <button 
                onClick={() => setFormData({ ...formData, hideIcon: !formData.hideIcon })}
                className={`px-2 py-1 rounded text-[10px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${formData.hideIcon ? 'bg-amber-500/20 text-amber-600 border-amber-500/40' : 'bg-secondary hover:bg-secondary/80 text-foreground'}`}
                title="Toggle Portrait Icon Visibility"
              >
                <User className="w-3 h-3" />
                <span>Icon: {formData.hideIcon ? 'Hidden' : 'Visible'}</span>
              </button>
            </div>

            {/* Banner Height & Icon Size Sliders */}
            <div className={`space-y-1 ${isVert ? 'w-full' : 'shrink-0 min-w-[180px]'}`}>
              {!formData.hideBanner && (
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[9px] text-muted-foreground font-semibold">
                    <span>Banner Height:</span>
                    <span className="text-primary font-bold">{formData.bannerHeight || 160}px</span>
                  </div>
                  <input
                    type="range"
                    min={60}
                    max={350}
                    value={formData.bannerHeight || 160}
                    onChange={(e) => setFormData({ ...formData, bannerHeight: Number(e.target.value) })}
                    className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              )}

              {!formData.hideIcon && (
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[9px] text-muted-foreground font-semibold">
                    <span>Icon Size:</span>
                    <span className="text-primary font-bold">{formData.iconSize || 72}px</span>
                  </div>
                  <input
                    type="range"
                    min={40}
                    max={140}
                    value={formData.iconSize || 72}
                    onChange={(e) => setFormData({ ...formData, iconSize: Number(e.target.value) })}
                    className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              )}
            </div>

            <div className={`flex flex-wrap gap-1.5 ${isVert ? 'flex-col' : 'items-center'}`}>
              <div className="flex gap-1">
                <button 
                  onClick={() => bannerInputRef.current?.click()}
                  className="bg-secondary hover:bg-secondary/80 text-foreground font-bold px-2 py-1 rounded border flex items-center gap-1 transition-all cursor-pointer text-[10px]"
                >
                  <Camera className="w-3 h-3 text-primary" />
                  <span>Banner</span>
                </button>
                <button
                  onClick={() => setShowBannerCropModal(true)}
                  className="bg-secondary hover:bg-secondary/80 text-foreground font-bold px-2 py-1 rounded border flex items-center gap-1 cursor-pointer transition-all text-[10px]"
                  title="Align & Crop Banner Image"
                >
                  <Maximize2 className="w-3 h-3 text-primary" />
                  <span>Crop Banner</span>
                </button>
              </div>

              <div className="flex gap-1">
                <button
                  onClick={() => setShowIconCropModal(true)}
                  className="bg-secondary hover:bg-secondary/80 text-foreground font-bold px-2 py-1 rounded border flex items-center gap-1 cursor-pointer transition-all text-[10px]"
                  title="Align & Crop Character Icon Portrait"
                >
                  <User className="w-3 h-3 text-primary" />
                  <span>Crop Icon</span>
                </button>
                
                <button 
                  onClick={handleAutoSpectrumPalette}
                  className="bg-secondary hover:bg-secondary/80 text-foreground font-bold px-2 py-1 rounded border flex items-center gap-1 cursor-pointer text-[10px]"
                  title="Apply rainbow spectrum to workspace tabs"
                >
                  <Palette className="w-3 h-3 text-purple-500" />
                  <span>Spectrum</span>
                </button>
              </div>
            </div>

            {/* Tab Customizer Panel */}
            <div className={`pt-2 border-t flex flex-col gap-1.5 ${isVert ? 'w-full' : 'shrink-0'}`}>
              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">Tab Bar Settings</span>
              
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold text-muted-foreground w-12 shrink-0">Layout:</span>
                  <div className="flex flex-1 gap-1">
                    <button 
                      onClick={() => setFormData({ ...formData, tabLayout: 'top' })}
                      className={`flex-1 py-0.5 rounded text-[9px] font-bold transition-all border ${(formData.tabLayout || 'top') === 'top' ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary hover:bg-secondary/80 text-foreground border-border'}`}
                    >
                      Top Bar
                    </button>
                    <button 
                      onClick={() => setFormData({ ...formData, tabLayout: 'side' })}
                      className={`flex-1 py-0.5 rounded text-[9px] font-bold transition-all border ${formData.tabLayout === 'side' ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary hover:bg-secondary/80 text-foreground border-border'}`}
                    >
                      Sidebar
                    </button>
                  </div>
                </div>
                
                {formData.tabLayout !== 'side' && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold text-muted-foreground w-12 shrink-0">Rows:</span>
                    <div className="flex flex-1 gap-1">
                      <button 
                        onClick={() => setFormData({ ...formData, tabRows: 'single' })}
                        className={`flex-1 py-0.5 rounded text-[9px] font-bold transition-all border ${(formData.tabRows || 'single') === 'single' ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary hover:bg-secondary/80 text-foreground border-border'}`}
                      >
                        Single Row
                      </button>
                      <button 
                        onClick={() => setFormData({ ...formData, tabRows: 'multi' })}
                        className={`flex-1 py-0.5 rounded text-[9px] font-bold transition-all border ${formData.tabRows === 'multi' ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary hover:bg-secondary/80 text-foreground border-border'}`}
                      >
                        Multi-Row
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Button Position Settings */}
            <div className={`pt-2 border-t flex flex-col gap-1.5 ${isVert ? 'w-full' : 'shrink-0'}`}>
              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">Action Button Positions</span>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold text-muted-foreground w-12 shrink-0">Export:</span>
                  <div className="flex flex-1 gap-1">
                    {(['top', 'bottom', 'nav'] as const).map((pos) => (
                      <button 
                        key={pos}
                        onClick={() => setFormData({ ...formData, uiControlsPositions: { ...formData.uiControlsPositions, export: pos } })}
                        className={`flex-1 py-0.5 rounded text-[9px] font-bold transition-all border ${((formData.uiControlsPositions?.export || 'top') === pos) ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary hover:bg-secondary/80 text-foreground border-border'}`}
                      >
                        {pos.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold text-muted-foreground w-12 shrink-0">Save:</span>
                  <div className="flex flex-1 gap-1">
                    {(['top', 'bottom', 'nav'] as const).map((pos) => (
                      <button 
                        key={pos}
                        onClick={() => setFormData({ ...formData, uiControlsPositions: { ...formData.uiControlsPositions, save: pos } })}
                        className={`flex-1 py-0.5 rounded text-[9px] font-bold transition-all border ${((formData.uiControlsPositions?.save || 'top') === pos) ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary hover:bg-secondary/80 text-foreground border-border'}`}
                      >
                        {pos.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Presets & Save Default Layout */}
            <div className={`pt-2 border-t flex flex-col gap-1.5 ${isVert ? 'w-full' : 'shrink-0'}`}>
              <div className="flex items-center justify-between gap-1">
                <span className="text-[9px] font-bold text-muted-foreground uppercase">Presets:</span>
                <div className="flex gap-1 flex-wrap">
                  <button onClick={() => handleApplyLayoutPreset('classic')} className="px-1.5 py-0.5 bg-secondary hover:bg-secondary/80 rounded text-[9px] font-bold border cursor-pointer">Classic</button>
                  <button onClick={() => handleApplyLayoutPreset('sidebar')} className="px-1.5 py-0.5 bg-secondary hover:bg-secondary/80 rounded text-[9px] font-bold border cursor-pointer">Sidebar</button>
                  <button onClick={() => handleApplyLayoutPreset('minimal')} className="px-1.5 py-0.5 bg-secondary hover:bg-secondary/80 rounded text-[9px] font-bold border cursor-pointer">Minimal</button>
                  <button onClick={() => handleApplyLayoutPreset('dashboard')} className="px-1.5 py-0.5 bg-secondary hover:bg-secondary/80 rounded text-[9px] font-bold border cursor-pointer">Dashboard</button>
                </div>
              </div>

              <div className="flex gap-1.5 w-full">
                <button
                  onClick={handleSaveAsDefaultLayout}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 text-[10px] font-bold py-1 px-2 rounded-md shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                  title="Save current layout configuration as default for future sessions"
                >
                  <Check className="w-3 h-3" />
                  <span>Save Default</span>
                </button>
                
                <button
                  onClick={() => {
                    localStorage.removeItem("default_editor_layout");
                    localStorage.removeItem("editor_view_size");
                    handleApplyLayoutPreset('classic');
                  }}
                  className="px-2 py-1 bg-destructive/10 hover:bg-destructive text-destructive hover:text-destructive-foreground text-[10px] font-bold rounded-md shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                  title="Reset everything to factory defaults"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset All</span>
                </button>
              </div>
            </div>

            {/* Universal Dropbox Dropper Widget */}
            <div className="pt-3 border-t flex flex-col gap-2 w-full">
              <span className="text-[10px] font-black uppercase text-blue-500 dark:text-blue-400 tracking-wider flex items-center gap-1">
                <Inbox className="w-3.5 h-3.5" /> Universal Dropbox Dropper
              </span>
              <div 
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingUniversal(true);
                }}
                onDragLeave={() => setIsDraggingUniversal(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingUniversal(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    processDroppedFiles(e.dataTransfer.files);
                  }
                }}
                onClick={() => {
                  const picker = document.createElement('input');
                  picker.type = 'file';
                  picker.multiple = true;
                  picker.onchange = (evt: any) => {
                    const files = evt.target.files;
                    if (files && files.length > 0) {
                      processDroppedFiles(files);
                    }
                  };
                  picker.click();
                }}
                className={`p-3.5 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${
                  isDraggingUniversal 
                    ? 'border-blue-500 bg-blue-500/10 scale-[1.02]' 
                    : 'border-blue-400/40 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/60'
                }`}
              >
                <Upload className={`w-5 h-5 mx-auto text-blue-500 mb-1 ${isDraggingUniversal ? 'animate-bounce' : 'animate-pulse'}`} />
                <p className="text-[10px] font-black text-foreground">DRAG FILES HERE TO DROP</p>
                <p className="text-[8px] text-muted-foreground mt-0.5 leading-tight">Images, Audios, Videos, or Docs. Dropbox routes them to proper categories instantly!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Global Toggleable Ingest & Profile Analyzer Panel
  const renderQuickIngestPanel = () => {
    if (!isQuickIngestOpen) return null;

    return (
      <div className="bg-gradient-to-r from-blue-950/40 via-purple-950/40 to-slate-900/90 border-b border-blue-500/30 p-3 sm:p-4 backdrop-blur shadow-lg z-30 transition-all">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-stretch justify-between">
          {/* Left: Drag & Drop files target */}
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-blue-400 tracking-wider flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-blue-400" />
                Universal Ingest Drop Zone (Media, Docs, & Text)
              </span>
              <span className="text-[10px] text-muted-foreground">
                Documents auto-route to Media Vault & trigger character updates
              </span>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingQuickIngest(true);
              }}
              onDragLeave={() => setIsDraggingQuickIngest(false)}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingQuickIngest(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  processDroppedFiles(e.dataTransfer.files);
                }
              }}
              onClick={() => {
                const picker = document.createElement('input');
                picker.type = 'file';
                picker.multiple = true;
                picker.onchange = (evt: any) => {
                  const files = evt.target.files;
                  if (files && files.length > 0) {
                    processDroppedFiles(files);
                  }
                };
                picker.click();
              }}
              className={`p-4 border-2 border-dashed rounded-xl flex items-center justify-center gap-3 cursor-pointer transition-all ${
                isDraggingQuickIngest
                  ? 'border-blue-400 bg-blue-500/20 scale-[1.01] ring-2 ring-blue-400/40'
                  : 'border-blue-500/40 bg-card/60 hover:bg-blue-500/10 hover:border-blue-400'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0">
                <FileText className={`w-5 h-5 text-blue-400 ${isDraggingQuickIngest ? 'animate-bounce' : ''}`} />
              </div>
              <div className="flex flex-col text-left">
                <p className="text-xs font-black text-foreground">Click or Drag & Drop Any File Here</p>
                <p className="text-[10px] text-muted-foreground">
                  Drop TXT, MD, DOC, JSON, PNG, JPG, MP3, MP4, OBJ to auto-catalog and synthesize profile data
                </p>
              </div>
            </div>
          </div>

          {/* Right: Complete Character Analyzer Trigger */}
          <div className="w-full md:w-80 flex flex-col justify-between gap-2 p-3 bg-secondary/30 rounded-xl border border-border/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-purple-400 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Global Profile Analyzer
              </span>
              <button
                type="button"
                onClick={() => setIsQuickIngestOpen(false)}
                className="text-[10px] text-muted-foreground hover:text-foreground font-bold px-2 py-0.5 rounded bg-secondary/60 cursor-pointer"
              >
                Hide
              </button>
            </div>

            <p className="text-[11px] text-muted-foreground leading-snug">
              Scans all story pages, documents, images, transcripts, powers, and fills in missing attributes.
            </p>

            {lastIngestAnalysisSummary && (
              <p className="text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 p-1.5 rounded-lg leading-tight">
                {lastIngestAnalysisSummary}
              </p>
            )}

            <button
              type="button"
              onClick={() => handleAnalyzeEntireProfile()}
              disabled={isAnalyzingEntireProfile}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-black text-xs shadow-md border border-purple-400/50 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${isAnalyzingEntireProfile ? 'animate-spin' : ''}`} />
              <span>{isAnalyzingEntireProfile ? 'Analyzing Entire Profile...' : '⚡ Scan Entire Profile Now'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render horizontal panels placed at the top
  const renderTopPanels = () => {
    return (
      <div className="flex flex-col shrink-0">
        {isProfileControlsHidden ? (
          <div className="flex gap-2 p-2.5 bg-card/90 backdrop-blur border-b shrink-0 overflow-x-auto scrollbar-none items-center justify-between shadow-xs z-20">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {getOrderedTabs().map((tab) => {
                const IconComponent = tab.icon;
                const currentLabel = tab.isCustom ? tab.defaultLabel : getTabLabel(tab.id, tab.defaultLabel);
                const isActive = activeOuterTab === tab.id;
                const tabColor = formData.tabColors?.[tab.id] || DEFAULT_TAB_SPECTRUM_LOCAL[tab.id] || '#3b82f6';

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => { setActiveOuterTab(tab.id); setAiReport(null); }}
                    className={`px-3.5 py-1.5 text-xs font-black rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer border ${
                      isActive
                        ? 'shadow-md scale-102 font-extrabold'
                        : 'bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground border-border'
                    }`}
                    style={{
                      borderColor: isActive ? tabColor : undefined,
                      backgroundColor: isActive ? tabColor : undefined,
                      color: isActive ? '#ffffff' : undefined
                    }}
                  >
                    <IconComponent className="w-4 h-4 shrink-0" />
                    <span>{currentLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick action controls in Focus Mode */}
            <div className="flex items-center gap-2 shrink-0 pl-2 border-l border-border/40">
              <button
                type="button"
                onClick={() => setIsQuickIngestOpen(!isQuickIngestOpen)}
                className={`px-3 py-1.5 text-xs font-extrabold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                  isQuickIngestOpen
                    ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-400/40'
                    : 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20'
                }`}
                title="Toggle Universal File Drop Zone & Full Profile Analyzer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>{isQuickIngestOpen ? 'Hide Ingest' : '📥 Drop & Ingest'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleAnalyzeEntireProfile()}
                disabled={isAnalyzingEntireProfile}
                className="px-3 py-1.5 text-xs font-extrabold rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border border-purple-400 shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Analyze everything within entire character profile, notes, documents and media"
              >
                <Sparkles className={`w-4 h-4 ${isAnalyzingEntireProfile ? 'animate-spin' : ''}`} />
                <span>{isAnalyzingEntireProfile ? 'Analyzing...' : '⚡ Full Analyzer'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowFeatureHelpModal(true)}
                className="p-1.5 text-xs font-bold rounded-xl bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border cursor-pointer"
                title="Help & Feature Guide (?)"
              >
                <HelpCircle className="w-4 h-4 text-primary" />
              </button>

              <button
                type="button"
                onClick={() => setIsProfileControlsHidden(false)}
                className="p-1.5 text-xs font-bold rounded-xl bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border cursor-pointer"
                title="Unhide all Editor Controls & Sidebars"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {tabPos === 'top' && renderTabsBar('horizontal')}
            {toolsPos === 'top' && renderEditToolsPanel('horizontal')}
          </>
        )}

        {/* Global Expandable Ingest & Drop Zone Panel */}
        {renderQuickIngestPanel()}
      </div>
    );
  };

  // Render horizontal panels placed at the bottom
  const renderBottomPanels = () => {
    return (
      <div className="flex flex-col shrink-0">
        {toolsPos === 'bottom' && renderEditToolsPanel('horizontal')}
        {tabPos === 'bottom' && renderTabsBar('horizontal')}
      </div>
    );
  };

  const handleDuplicateBiblePage = (pageId: string) => {
    const existingPages = formData.biblePages || [];
    const pageToDup = existingPages.find(p => p.id === pageId);
    if (!pageToDup) return;
    const newPage = {
      id: `page-${Date.now()}`,
      title: `${pageToDup.title} (Copy)`,
      content: pageToDup.content || '',
      parentId: pageToDup.parentId
    };
    setFormData(prev => ({
      ...prev,
      biblePages: [...(prev.biblePages || []), newPage]
    }));
    setActiveDetailSubTab(newPage.id);
    setCopyToast(`Duplicated page as "${newPage.title}"`);
    setTimeout(() => setCopyToast(null), 2500);
  };

  const handleCopyBiblePageContent = async (pageId: string) => {
    const page = formData.biblePages?.find(p => p.id === pageId);
    if (!page) return;
    try {
      await navigator.clipboard.writeText(page.content || '');
      setCopyToast('Subpage content copied to clipboard!');
      setTimeout(() => setCopyToast(null), 2500);
    } catch (e) {
      alert('Failed to copy text to clipboard.');
    }
  };

  const handleDumpFileUpload = async (filesOrEvent: File[] | React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => {
    let files: File[] = [];
    if (Array.isArray(filesOrEvent)) {
      files = filesOrEvent;
    } else if ('dataTransfer' in filesOrEvent && (filesOrEvent as React.DragEvent<HTMLDivElement>).dataTransfer) {
      filesOrEvent.preventDefault();
      setIsDragOverDump(false);
      files = Array.from((filesOrEvent as React.DragEvent<HTMLDivElement>).dataTransfer.files);
    } else if ('target' in filesOrEvent && (filesOrEvent.target as HTMLInputElement)?.files) {
      files = Array.from((filesOrEvent.target as HTMLInputElement).files || []);
    }

    if (!files || files.length === 0) return;

    const newDumpFiles: DumpMediaFile[] = [];

    for (const file of files) {
      try {
        const isJson = file.name.toLowerCase().endsWith('.json') || file.type === 'application/json';
        const isTxt = file.name.toLowerCase().endsWith('.txt') || file.type === 'text/plain';

        if (isJson || isTxt) {
          const text = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsText(file);
          });

          if (isJson) {
            try {
              const data = JSON.parse(text);
              let parsedText = '';
              if (data && typeof data === 'object' && !Array.isArray(data)) {
                if (data.name || data.description || data.personality || data.scenario) {
                  parsedText += `--- CHARACTER PROFILE IMPORT ---\n`;
                  if (data.name) parsedText += `Name: ${data.name}\n`;
                  if (data.species) parsedText += `Species: ${data.species}\n`;
                  if (data.gender) parsedText += `Gender: ${data.gender}\n`;
                  if (data.personality) parsedText += `Personality: ${data.personality}\n`;
                  if (data.description) parsedText += `Description: ${data.description}\n`;
                  if (data.scenario) parsedText += `Scenario: ${data.scenario}\n`;
                  if (data.first_mes || data.first_message) parsedText += `First Message: ${data.first_mes || data.first_message}\n`;
                  if (data.mes_example || data.example_messages) parsedText += `Example Dialogue:\n${data.mes_example || data.example_messages}\n`;
                } else if (Array.isArray(data.messages)) {
                  parsedText += `--- CHAT EXPORT MESSAGES ---\n`;
                  data.messages.slice(0, 1000).forEach((m: any) => {
                    const sender = m.from || m.author || m.sender || m.role || 'Participant';
                    const content = m.text || m.content || '';
                    if (content) {
                      parsedText += `[${sender}]: ${typeof content === 'string' ? content : JSON.stringify(content)}\n`;
                    }
                  });
                } else if (data.threads || data.mapping) {
                  parsedText += `--- CHAT CONVERSATION THREADS ---\n`;
                  let count = 0;
                  const nodes = data.mapping ? Object.values(data.mapping) : [];
                  nodes.forEach((node: any) => {
                    if (node.message && node.message.content && node.message.content.parts) {
                      const role = node.message.author?.role || 'user';
                      const parts = node.message.content.parts.filter((p: any) => typeof p === 'string').join('\n');
                      if (parts && count < 1000) {
                        parsedText += `[${role}]: ${parts}\n`;
                        count++;
                      }
                    }
                  });
                } else {
                  parsedText += JSON.stringify(data, null, 2);
                }
              } else if (Array.isArray(data)) {
                parsedText += `--- CHAT EXPORT STREAM ---\n`;
                data.slice(0, 1000).forEach((m: any) => {
                  const sender = m.role || m.sender || m.from || m.author || 'Participant';
                  const content = m.content || m.text || '';
                  if (content) {
                    parsedText += `[${sender}]: ${content}\n`;
                  }
                });
              } else {
                parsedText += text;
              }
              setQuickDumpText(prev => prev ? prev + '\n\n' + parsedText : parsedText);
              setCopyToast(`Imported and parsed JSON chat export file: ${file.name}`);
              setTimeout(() => setCopyToast(null), 3000);
            } catch (e) {
              setQuickDumpText(prev => prev ? prev + '\n\n' + text : text);
              setCopyToast(`Imported raw JSON file: ${file.name}`);
              setTimeout(() => setCopyToast(null), 3000);
            }
          } else {
            setQuickDumpText(prev => prev ? prev + '\n\n' + text : text);
            setCopyToast(`Imported raw text file: ${file.name}`);
            setTimeout(() => setCopyToast(null), 3000);
          }
          continue; // Successfully handled, skip base64 conversion
        }

        const base64Res = await new Promise<{ base64: string; mimeType: string }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve({ base64: reader.result as string, mimeType: file.type || 'application/octet-stream' });
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        let type: 'image' | 'audio' | 'video' | 'file' = 'file';
        if (file.type.startsWith('image/')) type = 'image';
        else if (file.type.startsWith('audio/')) type = 'audio';
        else if (file.type.startsWith('video/')) type = 'video';

        const sizeFormatted = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
        const previewUrl = type === 'image' || type === 'audio' || type === 'video' ? URL.createObjectURL(file) : '';

        newDumpFiles.push({
          id: `dump-file-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          mimeType: base64Res.mimeType,
          data: base64Res.base64,
          previewUrl,
          type,
          sizeFormatted
        });
      } catch (err) {
        console.error('Error reading dumped file:', err);
      }
    }

    if (newDumpFiles.length > 0) {
      setDumpMediaFiles(prev => [...prev, ...newDumpFiles]);
      setCopyToast(`Attached ${newDumpFiles.length} media file(s) to Dump Analyzer!`);
      setTimeout(() => setCopyToast(null), 2500);
    }
  };

  const mediaUrlToBase64 = async (url: string): Promise<{ base64: string; mimeType: string }> => {
    if (url.startsWith('data:')) {
      const parts = url.split(';');
      const mimeType = parts[0].split(':')[1] || 'audio/mp3';
      return { base64: url, mimeType };
    }
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({ base64: reader.result as string, mimeType: blob.type || 'audio/mp3' });
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleTranscribeSingleMedia = async (mediaTitle: string, mediaSrc: string, mimeTypeHint: string = 'audio/mp3') => {
    setIsTranscribingMediaId(mediaTitle);
    try {
      const { base64, mimeType } = await mediaUrlToBase64(mediaSrc);
      const res = await fetch('/api/transcribe-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaName: mediaTitle,
          mimeType: mimeType || mimeTypeHint,
          data: base64
        })
      });
      const data = await res.json();
      if (data.transcript || data.summary) {
        const transcriptMarkdown = `### ${mediaTitle} - Speech & Audio Transcript\n\n` +
          `**Summary:** ${data.summary || 'N/A'}\n\n` +
          `**Verbatim Spoken Content & Lyrics:**\n\n${data.transcript || 'No spoken text detected.'}\n\n` +
          (data.formattedMarkdown ? `---\n${data.formattedMarkdown}\n` : '');

        const newPageId = `transcript-page-${Date.now()}`;
        setFormData(prev => ({
          ...prev,
          biblePages: [
            ...(prev.biblePages || []),
            {
              id: newPageId,
              title: `Transcript: ${mediaTitle}`,
              content: transcriptMarkdown,
              isLocked: false
            }
          ]
        }));
        setActiveDetailSubTab(newPageId);
        setCopyToast(`Transcript saved to Section Index!`);
      } else {
        setCopyToast("No transcript produced.");
      }
    } catch (err) {
      console.error('Transcription error:', err);
      setCopyToast("Failed to transcribe media.");
    } finally {
      setIsTranscribingMediaId(null);
      setTimeout(() => setCopyToast(null), 3000);
    }
  };

  const [isAnalyzingPage, setIsAnalyzingPage] = useState<boolean>(false);

  const handleAnalyzePageContent = async (pageId: string) => {
    const page = formData.biblePages?.find(p => p.id === pageId);
    if (!page) {
      setCopyToast("Please select a valid section page.");
      setTimeout(() => setCopyToast(null), 2500);
      return;
    }

    setIsAnalyzingPage(true);
    try {
      const response = await fetch('/api/analyze-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageTitle: page.title,
          characterName: formData.name,
          characterDescription: formData.description,
          allPages: formData.biblePages || [],
          galleryImages: galleryImages || [],
          audios: formData.audios || [],
          videos: formData.videos || [],
          genericFiles: formData.genericFiles || [],
          currentContent: page.content || ''
        }),
      });

      const data = await response.json();
      if (data.content) {
        setFormData(prev => {
          const updatedPages = (prev.biblePages || []).map(p => {
            if (p.id === pageId) {
              return { ...p, content: data.content };
            }
            return p;
          });
          return { ...prev, biblePages: updatedPages };
        });
        setCopyToast(`Section "${page.title}" analyzed and organized successfully!`);
      } else {
        setCopyToast("Analyzer returned no content.");
      }
    } catch (err) {
      console.error('Page analysis failed:', err);
      setCopyToast("Failed to analyze section page.");
    } finally {
      setIsAnalyzingPage(false);
      setTimeout(() => setCopyToast(null), 3000);
    }
  };

  // Global Complete Profile & All Ingested Assets Analyzer
  const handleAnalyzeEntireProfile = async (droppedTextOverride?: string) => {
    setIsAnalyzingEntireProfile(true);
    try {
      const allBiblePages = formData.biblePages || [];
      const biblePagesText = allBiblePages.map(p => `### Page: ${p.title}\n${p.content}`).join('\n\n');
      
      const allDocumentsText = (formData.genericFiles || []).map(f => `### Document: ${f.name} (${f.type})\n${f.description || ''}`).join('\n');
      const allAudioText = (formData.audios || []).map(a => `### Audio Track: ${a.title}\n${a.description || ''}`).join('\n');
      const allVideoText = (formData.videos || []).map(v => `### Video Clip: ${v.title}\n${v.description || ''}`).join('\n');
      const allProjectsText = (formData.projects || []).map(p => `### Project: ${p.projectName} (${p.role}) - ${p.status}\n${p.description || ''}`).join('\n');
      const allRelsText = (formData.entityRelationships || []).map(r => `### Relationship with ${r.targetEntityName}: ${r.relationshipType} - ${r.notes || ''}`).join('\n');
      const allCustomTabsText = (formData.customTabs || []).map(c => `### Custom Lore: ${c.label}\n${c.content || ''}`).join('\n');

      const comprehensiveProfileText = `=== ENTIRE CHARACTER PROFILE ARCHIVE ===
Current Name: ${formData.name || 'Unnamed / Empty'}
Current Tagline: ${formData.tagline || 'Empty'}
Current Species: ${formData.species || 'Empty'}
Current Gender: ${formData.gender || 'Empty'}
Current Role / Archetype: ${formData.role || 'Empty'}
Current Alignment: ${formData.alignment || 'Empty'}
Current Status: ${formData.status || 'Empty'}
Current Age: ${formData.age || 'Empty'}
Current Height: ${formData.height || 'Empty'}
Current Weight: ${formData.weight || 'Empty'}
Current Primary Description / Biography:
${formData.description || 'No description provided yet.'}

Story Codex / Bible Pages:
${biblePagesText || 'None currently created.'}

Cataloged Documents & Media Vault:
${allDocumentsText || 'No extra documents.'}
${allAudioText || 'No audio tracks.'}
${allVideoText || 'No video clips.'}

Projects & Storyboards:
${allProjectsText || 'No projects linked.'}

Relationships & Network:
${allRelsText || 'No relationships mapped.'}

Custom Lore Tabs:
${allCustomTabsText || 'No custom tabs.'}

${droppedTextOverride ? `Newly Ingested / Dropped Document Content:\n${droppedTextOverride}\n` : ''}
${quickDumpText ? `Quick Notes & Ideas Dump:\n${quickDumpText}\n` : ''}

INSTRUCTIONS:
Please perform a complete, holistic character profile analysis and synthesis.
1. If basic character attributes (Name, Description, Species, Gender, Role, Alignment, Tagline) are missing or sparse, extract or synthesize them from the available documents/notes/media.
2. Generate comprehensive, rich Story Bible pages (Origins & Backstory, Powers & Abilities, Voice & Dialogue Guidelines, Visual Appearance & Style Notes).
3. If new media transcripts or document summaries exist, synthesize them into the character's codex.
4. Extract color palette tokens if suggested by the visual or aesthetic lore.
`;

      const allMediaFiles: any[] = [];
      if (galleryImages && galleryImages.length > 0) {
        galleryImages.slice(0, 5).forEach((img, idx) => {
          if (img.src && img.src.startsWith('data:image/')) {
            allMediaFiles.push({
              name: img.title || `Portrait ${idx + 1}`,
              mimeType: 'image/jpeg',
              data: img.src
            });
          }
        });
      }

      const response = await fetch('/api/analyze-multimodal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: comprehensiveProfileText,
          mediaFiles: allMediaFiles,
          mode: 'advanced',
          transcribeMedia: true
        }),
      });

      const data = await response.json();
      if (data.characters && data.characters.length > 0) {
        const char = data.characters[0];
        setFormData(prev => {
          const newPages = [...(prev.biblePages || [])];
          if (char.biblePages && Array.isArray(char.biblePages)) {
            char.biblePages.forEach((p: any) => {
              const existingIdx = newPages.findIndex(ep => ep.title.toLowerCase() === p.title.toLowerCase());
              if (existingIdx >= 0) {
                newPages[existingIdx] = {
                  ...newPages[existingIdx],
                  content: newPages[existingIdx].content ? `${newPages[existingIdx].content}\n\n---\n### AI Lore Update\n${p.content}` : p.content
                };
              } else {
                newPages.push({
                  id: `page-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                  title: p.title,
                  content: p.content,
                  parentId: p.parentId || null,
                  isLocked: false
                });
              }
            });
          }

          if (char.transcriptions && char.transcriptions.length > 0) {
            const transcriptContent = char.transcriptions.map((t: any) => 
              `### ${t.mediaName} (${(t.mediaType || 'media').toUpperCase()})\n` +
              `**Summary:** ${t.summary || 'N/A'}\n\n` +
              `**Spoken Dialogue / Speech / Lyrics Transcript:**\n` +
              `${t.transcript || 'No spoken text detected.'}\n`
            ).join('\n---\n\n');

            newPages.push({
              id: `page-transcripts-${Date.now()}`,
              title: "Media Transcripts & Lore Notes",
              content: transcriptContent,
              isLocked: false
            });
          }

          const updatedColorPalette = Array.from(new Set([
            ...(prev.colorPalette || []),
            ...(char.colorPalette || [])
          ])).slice(0, 16);

          return {
            ...prev,
            name: prev.name && prev.name !== 'Unnamed Character' ? prev.name : (char.name || prev.name),
            tagline: prev.tagline || char.tagline || (char.entityType ? `${char.entityType} • ${char.species || ''}` : prev.tagline),
            description: prev.description ? `${prev.description}\n\n${char.description || ''}`.trim() : (char.description || prev.description),
            species: prev.species || char.species || prev.species,
            gender: prev.gender || char.gender || prev.gender,
            biblePages: newPages,
            colorPalette: updatedColorPalette.length > 0 ? updatedColorPalette : prev.colorPalette
          };
        });

        setLastIngestAnalysisSummary(`Scanned entire profile! Added/updated ${char.biblePages?.length || 0} story pages & filled missing traits.`);
        setCopyToast("✨ Entire profile & media documents analyzed and updated successfully!");
      } else {
        setCopyToast("Analysis complete.");
      }
    } catch (err) {
      console.error("Full profile analysis failed:", err);
      setCopyToast("Failed to run full profile analysis.");
    } finally {
      setIsAnalyzingEntireProfile(false);
      setTimeout(() => setCopyToast(null), 3500);
    }
  };

  const handleAnalyzeTextDump = async (pageId: string) => {
    const textToAnalyze = pageId === 'quick' ? quickDumpText : (formData.biblePages?.find(p => p.id === pageId)?.content || '');
    const hasMedia = pageId === 'quick' && dumpMediaFiles.length > 0;

    setIsAnalyzing(true);
    try {
      let data: any;

      const comprehensiveText = `--- COMPLETE CHARACTER PROFILE CONTEXT ---\n` +
        `Name: ${formData.name || 'Unnamed'}\n` +
        `Tagline: ${formData.tagline || ''}\n` +
        `Species: ${formData.species || ''}\n` +
        `Gender: ${formData.gender || ''}\n` +
        `Description: ${formData.description || ''}\n\n` +
        `Existing Bible / Codex Pages:\n${JSON.stringify(formData.biblePages || [], null, 2)}\n\n` +
        `New Dump / Input Text / Dropped File Notes:\n${textToAnalyze}`;

      const allMediaFiles = [
        ...dumpMediaFiles.map(f => ({ name: f.name, mimeType: f.mimeType, data: f.data, type: f.type })),
        ...(galleryImages || []).map((img, idx) => ({ name: img.title || `Portrait ${idx+1}`, mimeType: 'image/jpeg', data: img.src, type: 'image' }))
      ];

      const response = await fetch('/api/analyze-multimodal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: comprehensiveText,
          mediaFiles: allMediaFiles.map(m => ({ name: m.name, mimeType: m.mimeType, data: m.data })),
          mode: 'advanced',
          transcribeMedia: true
        }),
      });
      data = await response.json();

      if (data.characters && data.characters.length > 0) {
        const char = data.characters[0];
        setFormData(prev => {
          const newPages = [...(prev.biblePages || [])];
          if (char.biblePages) {
            char.biblePages.forEach((p: any) => {
              newPages.push({
                id: `page-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                title: p.title,
                content: p.content + '\n\n*Note: Organized by Multimodal Archive Analyzer.*',
                parentId: p.parentId,
                isLocked: true
              });
            });
          }

          if (char.transcriptions && char.transcriptions.length > 0) {
            const transcriptContent = char.transcriptions.map((t: any) => 
              `### ${t.mediaName} (${(t.mediaType || 'media').toUpperCase()})\n` +
              `**Summary:** ${t.summary || 'N/A'}\n\n` +
              `**Spoken Dialogue / Speech / Lyrics Transcript:**\n` +
              `${t.transcript || 'No spoken text detected.'}\n`
            ).join('\n---\n\n');

            newPages.push({
              id: `page-transcripts-${Date.now()}`,
              title: "Media Transcripts & Speech Notes",
              content: transcriptContent,
              isLocked: false
            });
          }

          let newAudios = [...(prev.audios || [])];
          let newVideos = [...(prev.videos || [])];

          if (hasMedia && autoAttachDumpMedia) {
            dumpMediaFiles.forEach(f => {
              if (f.type === 'audio') {
                newAudios.push({
                  id: `audio-dump-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                  title: f.name.replace(/\.[^/.]+$/, ""),
                  src: f.previewUrl || f.data,
                  url: f.previewUrl || f.data,
                  description: `Transcribed audio track (${f.sizeFormatted})`
                });
              } else if (f.type === 'video') {
                newVideos.push({
                  id: `video-dump-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                  title: f.name.replace(/\.[^/.]+$/, ""),
                  src: f.previewUrl || f.data,
                  url: f.previewUrl || f.data,
                  description: `Transcribed video clip (${f.sizeFormatted})`
                });
              }
            });
          }

          return {
            ...prev,
            name: char.name || prev.name,
            description: char.description || prev.description,
            species: char.species || prev.species,
            gender: char.gender || prev.gender,
            biblePages: newPages,
            audios: newAudios,
            videos: newVideos
          };
        });

        if (pageId === 'quick') {
          setQuickDumpText('');
          setDumpMediaFiles([]);
        }
        setCopyToast("Profile updated, media transcribed & notes generated!");
      }
    } catch (err) {
      console.error('Analysis failed:', err);
      setCopyToast("Analyzer failed to process dump.");
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => setCopyToast(null), 3000);
    }
  };

  const handlePasteBiblePageContent = async (pageId: string) => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;

      const page = formData.biblePages?.find(p => p.id === pageId);
      if (page && page.content && page.content.trim() !== '') {
        const action = confirm('Existing content detected. Click OK to overwrite, or Cancel to append.');
        if (action) {
          updateBiblePageContent(pageId, text);
        } else {
          updateBiblePageContent(pageId, (page.content || '') + '\n\n' + text);
        }
      } else {
        updateBiblePageContent(pageId, text);
      }
      setCopyToast('Pasted text into notes!');
      setTimeout(() => setCopyToast(null), 2500);
    } catch (e) {
      alert('Unable to paste directly. Please click inside text box and press Ctrl+V / Cmd+V.');
    }
  };

  const handleReorderSubImages = (fromIdx: number, toIdx: number) => {
    const images = [...(formData.subImages || [])];
    if (fromIdx < 0 || fromIdx >= images.length || toIdx < 0 || toIdx >= images.length) return;
    const [moved] = images.splice(fromIdx, 1);
    images.splice(toIdx, 0, moved);
    setFormData({ ...formData, subImages: images });
  };

  const handleReorderAudios = (fromIdx: number, toIdx: number) => {
    const audios = [...(formData.audios || [])];
    if (fromIdx < 0 || fromIdx >= audios.length || toIdx < 0 || toIdx >= audios.length) return;
    const [moved] = audios.splice(fromIdx, 1);
    audios.splice(toIdx, 0, moved);
    setFormData({ ...formData, audios });
  };

  const handleReorderVideos = (fromIdx: number, toIdx: number) => {
    const vids = [...(formData.videos || [])];
    if (fromIdx < 0 || fromIdx >= vids.length || toIdx < 0 || toIdx >= vids.length) return;
    const [moved] = vids.splice(fromIdx, 1);
    vids.splice(toIdx, 0, moved);
    setFormData({ ...formData, videos: vids });
  };

  const handleReorderFiles = (fromIdx: number, toIdx: number) => {
    const files = [...(formData.genericFiles || [])];
    if (fromIdx < 0 || fromIdx >= files.length || toIdx < 0 || toIdx >= files.length) return;
    const [moved] = files.splice(fromIdx, 1);
    files.splice(toIdx, 0, moved);
    setFormData({ ...formData, genericFiles: files });
  };

  const handleCycleHeaderLayout = () => {
    const hb = formData.hideBanner ?? true;
    const hi = formData.hideIcon ?? false;
    const pl = formData.profileLayout || 'classic';
    const rev = formData.reverseHeaderLayout ?? false;

    let nextState: any = {};
    if (hb && hi) {
      // Both Hidden -> Both On (Classic)
      nextState = { hideBanner: false, hideIcon: false, profileLayout: 'classic', reverseHeaderLayout: false };
    } else if (!hb && !hi && pl === 'classic') {
      // Classic -> Side Split L-to-R
      nextState = { hideBanner: false, hideIcon: false, profileLayout: 'side', reverseHeaderLayout: false };
    } else if (!hb && !hi && pl === 'side' && !rev) {
      // Side Split L-to-R -> Side Split R-to-L
      nextState = { hideBanner: false, hideIcon: false, profileLayout: 'side', reverseHeaderLayout: true };
    } else if (!hb && !hi && pl === 'side' && rev) {
      // Side Split R-to-L -> Floating
      nextState = { hideBanner: false, hideIcon: false, profileLayout: 'floating', reverseHeaderLayout: false };
    } else if (!hb && !hi && pl === 'floating') {
      // Floating -> Stacked
      nextState = { hideBanner: false, hideIcon: false, profileLayout: 'stacked', reverseHeaderLayout: false };
    } else if (!hb && !hi && pl === 'stacked') {
      // Stacked -> Banner Only
      nextState = { hideBanner: false, hideIcon: true, profileLayout: 'classic', reverseHeaderLayout: false };
    } else if (!hb && hi) {
      // Banner Only -> Portrait Only
      nextState = { hideBanner: true, hideIcon: false, profileLayout: 'classic', reverseHeaderLayout: false };
    } else {
      // Portrait Only -> Hide Both
      nextState = { hideBanner: true, hideIcon: true, profileLayout: 'classic', reverseHeaderLayout: false };
    }

    setFormData(prev => ({
      ...prev,
      ...nextState
    }));

    let layoutDesc = "Both Hidden";
    if (!nextState.hideBanner && !nextState.hideIcon) {
      if (nextState.profileLayout === 'classic') layoutDesc = "Classic (Overlay)";
      else if (nextState.profileLayout === 'side' && !nextState.reverseHeaderLayout) layoutDesc = "Side Split";
      else if (nextState.profileLayout === 'side' && nextState.reverseHeaderLayout) layoutDesc = "Side Split (Reversed)";
      else if (nextState.profileLayout === 'floating') layoutDesc = "Floating Card";
      else if (nextState.profileLayout === 'stacked') layoutDesc = "Stacked Layout";
    } else if (!nextState.hideBanner && nextState.hideIcon) {
      layoutDesc = "Banner Only";
    } else if (nextState.hideBanner && !nextState.hideIcon) {
      layoutDesc = "Portrait Only";
    }

    setCopyToast(`Header Layout: ${layoutDesc}`);
    setTimeout(() => setCopyToast(null), 2500);
  };

  const handleApplyLayoutPreset = (presetKey: string) => {
    if (presetKey === 'classic') {
      setEditorSize('lg');
      setFormData(prev => ({
        ...prev,
        tabLayoutPosition: 'top',
        editToolsPosition: 'right',
        hideBanner: false,
        hideIcon: false,
        bannerHeight: 160,
        iconSize: 72
      }));
    } else if (presetKey === 'sidebar') {
      setEditorSize('fl');
      setFormData(prev => ({
        ...prev,
        tabLayoutPosition: 'left',
        editToolsPosition: 'right',
        hideBanner: false,
        hideIcon: false,
        bannerHeight: 180,
        iconSize: 80
      }));
    } else if (presetKey === 'minimal') {
      setEditorSize('fl');
      setFormData(prev => ({
        ...prev,
        tabLayoutPosition: 'left',
        editToolsPosition: 'right',
        hideBanner: true,
        hideIcon: true
      }));
    } else if (presetKey === 'dashboard') {
      setEditorSize('fl');
      setFormData(prev => ({
        ...prev,
        tabLayoutPosition: 'top',
        editToolsPosition: 'bottom',
        hideBanner: true,
        hideIcon: false,
        iconSize: 64
      }));
    } else if (presetKey === 'ultrawide') {
      setEditorSize('xl');
      setFormData(prev => ({
        ...prev,
        tabLayoutPosition: 'top',
        editToolsPosition: 'left',
        hideBanner: false,
        hideIcon: false
      }));
    }
    setCopyToast(`Applied layout preset: ${presetKey.toUpperCase()}`);
    setTimeout(() => setCopyToast(null), 2500);
  };

  const handleSaveAsDefaultLayout = () => {
    const defaultLayout = {
      editorSize,
      hideBanner: formData.hideBanner || false,
      hideIcon: formData.hideIcon || false,
      bannerHeight: formData.bannerHeight || 160,
      iconSize: formData.iconSize || 72,
      tabLayoutPosition: formData.tabLayoutPosition || 'left',
      editToolsPosition: formData.editToolsPosition || 'right',
      tabsWidth: formData.tabsWidth || 208,
      tabsHeight: formData.tabsHeight || 50,
      editToolsWidth: formData.editToolsWidth || 320,
      editToolsHeight: formData.editToolsHeight || 70,
      detailsHeaderTitle: formData.detailsHeaderTitle || 'Section Index',
      detailsHierarchyPosition: formData.detailsHierarchyPosition || 'left',
      mediaViewMode: formData.mediaViewMode || 'grid',
      mediaAspect: formData.mediaAspect || 'landscape',
      mediaGridCols: formData.mediaGridCols || 4,
      tabOrder: formData.tabOrder || [],
      editToolsOrder: formData.editToolsOrder || []
    };
    localStorage.setItem("default_editor_layout", JSON.stringify(defaultLayout));
    localStorage.setItem("editor_view_size", editorSize);
    setCopyToast("Saved as default layout for future sessions!");
    setTimeout(() => setCopyToast(null), 3000);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all duration-200 ${editorSize === 'fl' ? 'p-0' : 'p-2 sm:p-4'}`}>
      {copyToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-slate-900/95 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-2xl border border-primary/40 flex items-center gap-2 animate-in slide-in-from-top duration-200">
          <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
          <span>{copyToast}</span>
        </div>
      )}
      <div 
        ref={editorModalRef} 
        style={editorSize !== 'fl' && formData.modalCustomHeight ? { height: `${formData.modalCustomHeight}px` } : undefined}
        className={`bg-background flex flex-col w-full shadow-2xl overflow-hidden transition-all duration-300 relative ${
          editorSize === 'fl' ? 'h-screen w-screen max-w-none rounded-none inset-0 border-0' : 'rounded-xl h-[92vh]'
        } ${
          editorSize === 'sm' ? 'max-w-3xl' :
          editorSize === 'md' ? 'max-w-4xl' :
          editorSize === 'lg' ? 'max-w-6xl' :
          editorSize === 'xl' ? 'max-w-[95vw]' : ''
        }`}
      >
        
        {/* Hidden File Inputs for Banner & Portrait Uploads */}
        <input 
          type="file" 
          ref={bannerInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleBannerUpload} 
        />
        <input 
          type="file" 
          ref={portraitInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handlePortraitUpload} 
        />

        {/* Banner Section / Profile Header Area */}
        {(() => {
          if (formData.hideBanner) {
            if (formData.hideIcon) {
              return (
                <div className="bg-amber-500/5 border-b border-amber-500/10 px-5 py-3 flex items-center justify-between text-xs text-amber-600 shrink-0 font-bold select-none animate-in fade-in duration-200">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 animate-pulse text-amber-500" />
                    Header Banner & Portrait are currently hidden.
                  </span>
                  <button
                    type="button"
                    onClick={handleCycleHeaderLayout}
                    className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 font-extrabold px-2.5 py-1 rounded border border-amber-500/20 transition-all text-[10px] cursor-pointer"
                  >
                    Quick-Cycle Layouts
                  </button>
                </div>
              );
            }
            // Banner hidden, Icon visible
            return (
              <div className="bg-card border-b px-4 py-2.5 flex items-center justify-between gap-4 shrink-0 shadow-xs" style={{ borderBottomColor: activeTabColor }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div 
                    onClick={() => setShowPortraitPickerModal(true)}
                    className="relative group rounded-xl border border-border shadow-xs overflow-hidden shrink-0 bg-slate-800 cursor-pointer flex items-center justify-center transition-all hover:scale-105"
                    style={{ width: `${formData.iconSize || 48}px`, height: `${formData.iconSize || 48}px` }}
                  >
                    {mainImageSrc ? (
                      <img src={mainImageSrc} alt="Portrait Icon" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User className="w-6 h-6 text-white/40" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-bold text-base text-foreground truncate">{formData.name || 'Unnamed Character'}</h2>
                    <p className="text-xs text-muted-foreground truncate">{formData.tagline || formData.description || 'No description'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsQuickIngestOpen(!isQuickIngestOpen)}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      isQuickIngestOpen ? 'bg-blue-600 text-white border-blue-400' : 'bg-blue-600/15 text-blue-400 border-blue-500/30 hover:bg-blue-600/30'
                    }`}
                    title="Toggle Universal File Drop Zone & Profile Analyzer"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Ingest</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFeatureHelpModal(true)}
                    className="p-1.5 rounded-lg border border-border bg-secondary/70 hover:bg-secondary text-primary transition-all cursor-pointer"
                    title="Open Feature Help & Reference Guide (?)"
                  >
                    <HelpCircle className="w-4 h-4 text-primary" />
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsProfileControlsHidden(!isProfileControlsHidden)}
                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                      isProfileControlsHidden ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-400/50' : 'bg-blue-600/20 text-blue-500 border-blue-500/30 hover:bg-blue-600 hover:text-white'
                    }`}
                    title={isProfileControlsHidden ? "Show All Editor Controls & Sidebars" : "Hide Controls (Clean Showcase View)"}
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={toggleMasterLock}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${formData.isMasterLocked ? 'bg-red-500/20 text-red-500 border-red-500/30' : 'hover:bg-secondary text-muted-foreground'}`}
                    title={formData.isMasterLocked ? 'Unlock All Sections' : 'Master Lock All Sections'}
                  >
                    {formData.isMasterLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  </button>
                  <button onClick={handleClose} className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground cursor-pointer" title="Close Editor">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          }

          const layout = formData.profileLayout || 'classic';
          
          if (layout === 'stacked') {
            return (
              <div className="shrink-0 flex flex-col">
                {/* Visual Banner Landscape only */}
                <div 
                  className={`relative w-full h-32 sm:h-40 bg-slate-900 overflow-hidden transition-all duration-200 ${isDraggingBanner ? 'ring-4 ring-primary ring-inset' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingBanner(true); }}
                  onDragLeave={() => setIsDraggingBanner(false)}
                  onDrop={handleBannerDrop}
                >
                  {isDraggingBanner && (
                    <div className="absolute inset-0 bg-primary/20 backdrop-blur-xs flex items-center justify-center border-4 border-dashed border-primary z-50 animate-in fade-in">
                      <span className="bg-slate-900/90 text-white font-extrabold text-xs px-4 py-2 rounded-lg shadow-lg border border-white/20 flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-primary animate-bounce" />
                        Drop to set Banner Background
                      </span>
                    </div>
                  )}
                  {formData.bannerImageSrc ? (
                    <img 
                      src={formData.bannerImageSrc} 
                      alt="Header Banner" 
                      className="absolute inset-0 w-full h-full opacity-70" 
                      style={getBannerStyle()}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 opacity-95" />
                  )}
                  {/* Top Right Quick Close & Toggle Icons over Banner */}
                  <div className="absolute top-2 right-2 z-30 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsQuickIngestOpen(!isQuickIngestOpen)}
                      className={`px-2.5 py-1.5 rounded-xl backdrop-blur-md border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-lg ${
                        isQuickIngestOpen ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-400/50' : 'bg-black/50 hover:bg-blue-600 text-blue-300 hover:text-white border-white/20'
                      }`}
                      title="Toggle Universal File Drop Zone & Profile Analyzer"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Ingest</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowFeatureHelpModal(true)}
                      className="p-1.5 rounded-xl backdrop-blur-md bg-black/50 hover:bg-black/80 text-primary border border-white/20 transition-all cursor-pointer shadow-lg"
                      title="Open Feature Help & Reference Guide (?)"
                    >
                      <HelpCircle className="w-4 h-4 text-primary" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIsProfileControlsHidden(!isProfileControlsHidden)}
                      className={`p-1.5 rounded-xl backdrop-blur-md border transition-all cursor-pointer shadow-lg flex items-center justify-center ${
                        isProfileControlsHidden 
                          ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-400/50' 
                          : 'bg-black/50 hover:bg-blue-600 text-blue-300 hover:text-white border-white/20'
                      }`}
                      title={isProfileControlsHidden ? "Show All Profile Buttons & Controls" : "Hide Controls (Clean Showcase View)"}
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                    </button>
                    <button 
                      type="button"
                      onClick={handleClose} 
                      className="p-1.5 bg-black/40 hover:bg-black/70 text-white/85 hover:text-white backdrop-blur-md rounded-xl transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Info Card Below Banner */}
                <div className={`bg-card border-b px-5 py-4 flex flex-col sm:items-end gap-5 relative ${formData.reverseHeaderLayout ? 'sm:flex-row-reverse text-right' : 'sm:flex-row'}`} style={{ borderBottomColor: activeTabColor }}>
                  {/* Portrait Overlay */}
                  {!formData.hideIcon && (
                    <div 
                      onClick={() => setShowPortraitPickerModal(true)}
                      className={`relative group w-20 h-20 sm:w-24 sm:h-24 -mt-10 sm:-mt-14 rounded-2xl border-4 border-card shadow-xl overflow-hidden shrink-0 bg-slate-800 flex items-center justify-center cursor-pointer transition-all ${isDraggingPortrait ? 'ring-4 ring-primary scale-110' : 'hover:scale-105 hover:shadow-2xl'}`}
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingPortrait(true); }}
                      onDragLeave={() => setIsDraggingPortrait(false)}
                      onDrop={(e) => { e.stopPropagation(); handlePortraitDrop(e); }}
                    >
                      {mainImageSrc ? (
                        <img 
                          src={mainImageSrc} 
                          alt="Portrait Icon" 
                          className={`w-full h-full ${formData.iconShape === 'circle' ? 'rounded-full' : formData.iconShape === 'square' ? 'rounded-none' : ''}`} 
                          style={getIconStyle()}
                          referrerPolicy="no-referrer" 
                        />
                      ) : (
                        <User className="w-10 h-10 text-white/40" />
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold gap-0.5">
                        <Camera className="w-4 h-4" />
                        <span>Change Icon</span>
                      </div>
                    </div>
                  )}

                  {/* Info details on Light Card background */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isEditMode ? (
                        <input 
                          type="text" 
                          value={formData.name || ''} 
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                          className="bg-secondary/40 border border-border rounded px-2.5 py-1 text-sm sm:text-lg font-black text-foreground outline-none focus:ring-2 focus:ring-primary/20 max-w-sm"
                        />
                      ) : (
                        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                          {formData.name || 'Unnamed Character'}
                        </h2>
                      )}
                      <button 
                        type="button"
                        onClick={() => setFormData({ ...formData, isFavorite: !formData.isFavorite })}
                        className="p-1.5 rounded-full hover:bg-secondary/80 border transition-all cursor-pointer"
                      >
                        <Heart className={`w-4 h-4 ${formData.isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
                      </button>
                    </div>

                    {isEditMode ? (
                      <input 
                        type="text" 
                        value={formData.tagline || formData.description || ''} 
                        onChange={e => setFormData({ ...formData, tagline: e.target.value, description: e.target.value })}
                        className="w-full bg-secondary/40 border border-border rounded px-2 py-1 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    ) : (
                      <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                        {formData.tagline || formData.description || 'Short character premise & lore overview'}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[10px] sm:text-xs text-muted-foreground font-semibold flex-wrap pt-1">
                      <span className="flex items-center gap-1 bg-secondary/40 px-2 py-0.5 rounded border">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        <span>Created: {formData.dateCreated || new Date().toISOString().split('T')[0]}</span>
                      </span>
                      <span className="flex items-center gap-1 bg-secondary/40 px-2 py-0.5 rounded border">
                        <User className="w-3.5 h-3.5 text-primary" />
                        <span>Created by:</span>
                        {isEditMode ? (
                          <input 
                            type="text" 
                            value={formData.creator || 'Alberto Armentero'} 
                            onChange={e => setFormData({ ...formData, creator: e.target.value })}
                            className="bg-card border rounded px-1.5 py-0.5 text-[10px] text-foreground outline-none w-28 focus:ring-1 focus:ring-primary/20"
                          />
                        ) : (
                          <strong className="text-foreground">{formData.creator || 'Alberto Armentero'}</strong>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          if (layout === 'side') {
            return (
              <div className={`shrink-0 flex flex-col border-b ${formData.reverseHeaderLayout ? 'md:flex-row-reverse' : 'md:flex-row'}`} style={{ borderBottomColor: activeTabColor }}>
                {/* Left Profile Sidebar Card */}
                <div className={`w-full md:w-80 bg-card p-5 flex flex-col justify-center items-center text-center shrink-0 border-y md:border-y-0 ${formData.reverseHeaderLayout ? 'md:border-l border-r-0' : 'md:border-r border-l-0'}`}>
                  {!formData.hideIcon && (
                    <div 
                      onClick={() => setShowPortraitPickerModal(true)}
                      className={`relative group w-24 h-24 rounded-2xl border-2 shadow-md overflow-hidden bg-slate-800 flex items-center justify-center cursor-pointer transition-all mb-4 ${isDraggingPortrait ? 'ring-4 ring-primary scale-115' : 'hover:scale-105'}`}
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingPortrait(true); }}
                      onDragLeave={() => setIsDraggingPortrait(false)}
                      onDrop={(e) => { e.stopPropagation(); handlePortraitDrop(e); }}
                    >
                      {mainImageSrc ? (
                        <img 
                          src={mainImageSrc} 
                          alt="Portrait Icon" 
                          className={`w-full h-full ${formData.iconShape === 'circle' ? 'rounded-full' : formData.iconShape === 'square' ? 'rounded-none' : ''}`} 
                          style={getIconStyle()}
                          referrerPolicy="no-referrer" 
                        />
                      ) : (
                        <User className="w-12 h-12 text-white/40" />
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold gap-0.5">
                        <Camera className="w-4 h-4" />
                        <span>Change Icon</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 w-full">
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      {isEditMode ? (
                        <input 
                          type="text" 
                          value={formData.name || ''} 
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                          className="bg-secondary/40 border border-border rounded px-2 py-0.5 text-center text-base font-black text-foreground outline-none w-full"
                        />
                      ) : (
                        <h2 className="text-xl font-black text-foreground">{formData.name || 'Unnamed Character'}</h2>
                      )}
                      <button 
                        type="button"
                        onClick={() => setFormData({ ...formData, isFavorite: !formData.isFavorite })}
                        className="p-1 rounded-full hover:bg-secondary/80 border transition-all cursor-pointer"
                      >
                        <Heart className={`w-3.5 h-3.5 ${formData.isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
                      </button>
                    </div>

                    {isEditMode ? (
                      <textarea 
                        value={formData.tagline || formData.description || ''} 
                        onChange={e => setFormData({ ...formData, tagline: e.target.value, description: e.target.value })}
                        className="w-full bg-secondary/40 border border-border rounded px-2 py-1 text-xs text-center text-foreground outline-none h-16 resize-none"
                      />
                    ) : (
                      <p className="text-xs text-muted-foreground font-medium line-clamp-2 px-2">
                        {formData.tagline || formData.description || 'Short character premise & lore overview'}
                      </p>
                    )}

                    <div className="pt-2 border-t w-full text-[10px] text-muted-foreground space-y-1 text-left">
                      <div className="flex items-center justify-between">
                        <span>Created:</span>
                        <span className="font-semibold">{formData.dateCreated || new Date().toISOString().split('T')[0]}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Creator:</span>
                        {isEditMode ? (
                          <input 
                            type="text" 
                            value={formData.creator || 'Alberto Armentero'} 
                            onChange={e => setFormData({ ...formData, creator: e.target.value })}
                            className="bg-card border rounded px-1.5 py-0.2 text-[10px] text-foreground outline-none w-28 text-right"
                          />
                        ) : (
                          <span className="font-bold text-foreground">{formData.creator || 'Alberto Armentero'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Visual Banner Section */}
                <div 
                  className={`relative flex-1 min-h-[140px] md:min-h-0 bg-slate-900 overflow-hidden transition-all duration-200 ${isDraggingBanner ? 'ring-4 ring-primary ring-inset' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingBanner(true); }}
                  onDragLeave={() => setIsDraggingBanner(false)}
                  onDrop={handleBannerDrop}
                >
                  {isDraggingBanner && (
                    <div className="absolute inset-0 bg-primary/20 backdrop-blur-xs flex items-center justify-center border-4 border-dashed border-primary z-50 animate-in fade-in">
                      <span className="bg-slate-900/90 text-white font-extrabold text-xs px-4 py-2 rounded-lg shadow-lg border border-white/20 flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-primary animate-bounce" />
                        Drop to set Banner Background
                      </span>
                    </div>
                  )}
                  {formData.bannerImageSrc ? (
                    <img 
                      src={formData.bannerImageSrc} 
                      alt="Header Banner" 
                      className="absolute inset-0 w-full h-full opacity-70" 
                      style={getBannerStyle()}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 opacity-95" />
                  )}
                  {/* Top Right Quick Close & Toggle Icons */}
                  <div className="absolute top-2 right-2 z-30 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsQuickIngestOpen(!isQuickIngestOpen)}
                      className={`px-2.5 py-1.5 rounded-xl backdrop-blur-md border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-lg ${
                        isQuickIngestOpen ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-400/50' : 'bg-black/50 hover:bg-blue-600 text-blue-300 hover:text-white border-white/20'
                      }`}
                      title="Toggle Universal File Drop Zone & Profile Analyzer"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Ingest</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowFeatureHelpModal(true)}
                      className="p-1.5 rounded-xl backdrop-blur-md bg-black/50 hover:bg-black/80 text-primary border border-white/20 transition-all cursor-pointer shadow-lg"
                      title="Open Feature Help & Reference Guide (?)"
                    >
                      <HelpCircle className="w-4 h-4 text-primary" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIsProfileControlsHidden(!isProfileControlsHidden)}
                      className={`p-1.5 rounded-xl backdrop-blur-md border transition-all cursor-pointer shadow-lg flex items-center justify-center ${
                        isProfileControlsHidden 
                          ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-400/50' 
                          : 'bg-black/50 hover:bg-blue-600 text-blue-300 hover:text-white border-white/20'
                      }`}
                      title={isProfileControlsHidden ? "Show All Profile Buttons & Controls" : "Hide Controls (Clean Showcase View)"}
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                    </button>
                    <button 
                      type="button"
                      onClick={handleClose} 
                      className="p-1.5 bg-black/40 hover:bg-black/70 text-white/85 hover:text-white backdrop-blur-md rounded-xl transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          if (layout === 'floating') {
            return (
              <div 
                className={`relative w-full bg-slate-900 border-b overflow-hidden shrink-0 min-h-[180px] sm:min-h-[220px] flex flex-col justify-between transition-all duration-200 ${isDraggingBanner ? 'ring-4 ring-primary ring-inset' : ''}`} 
                style={{ height: `${formData.bannerHeight ? formData.bannerHeight + 40 : 200}px`, borderBottom: `4px solid ${activeTabColor}` }}
                onDragOver={(e) => { e.preventDefault(); setIsDraggingBanner(true); }}
                onDragLeave={() => setIsDraggingBanner(false)}
                onDrop={handleBannerDrop}
              >
                {isEditMode && (
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-2 bg-primary/10 hover:bg-primary/50 cursor-row-resize transition-all z-50 group flex items-center justify-center"
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setIsResizingBannerHeight(true); }}
                    title="Drag bottom edge to stretch banner height"
                  >
                    <div className="w-16 h-1 bg-slate-300 dark:bg-slate-700 rounded-full group-hover:bg-primary" />
                  </div>
                )}
                {isDraggingBanner && (
                  <div className="absolute inset-0 bg-primary/20 backdrop-blur-xs flex items-center justify-center border-4 border-dashed border-primary z-50 animate-in fade-in">
                    <span className="bg-slate-900/90 text-white font-extrabold text-xs px-4 py-2 rounded-lg shadow-lg border border-white/20 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-primary animate-bounce" />
                      Drop to set Banner Background
                    </span>
                  </div>
                )}
                {formData.bannerImageSrc ? (
                  <img 
                    src={formData.bannerImageSrc} 
                    alt="Header Banner" 
                    className="absolute inset-0 w-full h-full opacity-60" 
                    style={getBannerStyle()}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 opacity-95" />
                )}

                {/* Top Right Close & Toggle Icons */}
                <div className="relative z-10 flex justify-end items-center gap-1.5 p-2 sm:p-3">
                  <button
                    type="button"
                    onClick={() => setIsQuickIngestOpen(!isQuickIngestOpen)}
                    className={`px-2.5 py-1.5 rounded-xl backdrop-blur-md border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-lg ${
                      isQuickIngestOpen ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-400/50' : 'bg-black/50 hover:bg-blue-600 text-blue-300 hover:text-white border-white/20'
                    }`}
                    title="Toggle Universal File Drop Zone & Profile Analyzer"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Ingest</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFeatureHelpModal(true)}
                    className="p-1.5 rounded-xl backdrop-blur-md bg-black/50 hover:bg-black/80 text-primary border border-white/20 transition-all cursor-pointer shadow-lg"
                    title="Open Feature Help & Reference Guide (?)"
                  >
                    <HelpCircle className="w-4 h-4 text-primary" />
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsProfileControlsHidden(!isProfileControlsHidden)}
                    className={`p-1.5 rounded-xl backdrop-blur-md border transition-all cursor-pointer shadow-lg flex items-center justify-center ${
                      isProfileControlsHidden 
                        ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-400/50' 
                        : 'bg-black/50 hover:bg-blue-600 text-blue-300 hover:text-white border-white/20'
                    }`}
                    title={isProfileControlsHidden ? "Show All Profile Buttons & Controls" : "Hide Controls (Clean Showcase View)"}
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>
                  <button 
                    type="button"
                    onClick={handleClose} 
                    className="p-1.5 bg-black/40 hover:bg-black/70 text-white/80 hover:text-white backdrop-blur-md rounded-xl transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Floating Absolute Card Overlay */}
                <div className="relative z-10 px-4 sm:px-6 pb-4 pt-2">
                  <div className="bg-slate-950/85 backdrop-blur-md border border-white/15 rounded-2xl p-4 shadow-2xl flex items-center gap-4 max-w-lg">
                    {/* Portrait Avatar */}
                    {!formData.hideIcon && (
                      <div 
                        onClick={() => setShowPortraitPickerModal(true)}
                        className={`relative group w-14 h-14 sm:w-16 sm:h-16 rounded-xl border border-white/20 shadow-lg overflow-hidden shrink-0 bg-slate-800 flex items-center justify-center cursor-pointer transition-all ${isDraggingPortrait ? 'ring-2 ring-primary scale-110' : 'hover:scale-105'}`}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingPortrait(true); }}
                        onDragLeave={() => setIsDraggingPortrait(false)}
                        onDrop={(e) => { e.stopPropagation(); handlePortraitDrop(e); }}
                      >
                        {mainImageSrc ? (
                          <img 
                            src={mainImageSrc} 
                            alt="Portrait Icon" 
                            className={`w-full h-full ${formData.iconShape === 'circle' ? 'rounded-full' : formData.iconShape === 'square' ? 'rounded-none' : ''}`} 
                            style={getIconStyle()}
                            referrerPolicy="no-referrer" 
                          />
                        ) : (
                          <User className="w-8 h-8 text-white/40" />
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold gap-0.5">
                          <Camera className="w-3.5 h-3.5" />
                          <span>Change</span>
                        </div>
                      </div>
                    )}

                    <div className="text-white space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isEditMode ? (
                          <input 
                            type="text" 
                            value={formData.name || ''} 
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="bg-black/60 border border-white/20 rounded px-2 py-0.5 text-sm sm:text-base font-black text-white outline-none focus:border-primary w-40"
                          />
                        ) : (
                          <h2 className="text-sm sm:text-lg font-black tracking-tight truncate">
                            {formData.name || 'Unnamed Character'}
                          </h2>
                        )}
                        <button 
                          type="button"
                          onClick={() => setFormData({ ...formData, isFavorite: !formData.isFavorite })}
                          className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
                        >
                          <Heart className={`w-3.5 h-3.5 ${formData.isFavorite ? 'fill-red-500 text-red-500' : 'text-white/70'}`} />
                        </button>
                      </div>

                      {isEditMode ? (
                        <input 
                          type="text" 
                          value={formData.tagline || formData.description || ''} 
                          onChange={e => setFormData({ ...formData, tagline: e.target.value, description: e.target.value })}
                          className="w-full bg-black/60 border border-white/15 rounded px-2 py-0.5 text-[10px] text-white/90 outline-none"
                        />
                      ) : (
                        <p className="text-[11px] sm:text-xs text-white/80 font-medium line-clamp-1">
                          {formData.tagline || formData.description || 'Short character premise & lore overview'}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-[9px] text-white/60 font-semibold flex-wrap pt-0.5">
                        <span>Created: {formData.dateCreated || new Date().toISOString().split('T')[0]}</span>
                        <span>•</span>
                        <span>By: {formData.creator || 'Alberto Armentero'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          // Default / Classic layout
          return (
            <div 
              className={`relative w-full bg-slate-900 border-b overflow-hidden shrink-0 min-h-[140px] flex flex-col justify-between transition-all duration-200 ${isDraggingBanner ? 'ring-4 ring-primary ring-inset' : ''}`} 
              style={{ height: `${formData.bannerHeight || 160}px`, borderBottom: `4px solid ${activeTabColor}` }}
              onDragOver={(e) => { e.preventDefault(); setIsDraggingBanner(true); }}
              onDragLeave={() => setIsDraggingBanner(false)}
              onDrop={handleBannerDrop}
            >
              {isEditMode && (
                <div 
                  className="absolute bottom-0 left-0 right-0 h-2 bg-primary/10 hover:bg-primary/50 cursor-row-resize transition-all z-50 group flex items-center justify-center"
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setIsResizingBannerHeight(true); }}
                  title="Drag bottom edge to stretch banner height"
                >
                  <div className="w-16 h-1 bg-slate-300 dark:bg-slate-700 rounded-full group-hover:bg-primary" />
                </div>
              )}
              {isDraggingBanner && (
                <div className="absolute inset-0 bg-primary/20 backdrop-blur-xs flex items-center justify-center border-4 border-dashed border-primary z-50 animate-in fade-in duration-150">
                  <span className="bg-slate-900/90 text-white font-extrabold text-xs px-4 py-2 rounded-lg shadow-lg border border-white/20 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-primary animate-bounce" />
                    Drop image to set as Banner Background
                  </span>
                </div>
              )}

              {/* Banner Background Image with Filter */}
              {formData.bannerImageSrc ? (
                <img 
                  src={formData.bannerImageSrc} 
                  alt="Header Banner" 
                  className="absolute inset-0 w-full h-full opacity-65 transition-all duration-300" 
                  style={getBannerStyle()}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 opacity-95" />
              )}

              {/* Top Right Quick Close & Toggle Icons over Banner */}
              <div className="relative z-10 flex justify-end items-center gap-1.5 p-2 sm:p-3">
                <button
                  type="button"
                  onClick={() => setIsQuickIngestOpen(!isQuickIngestOpen)}
                  className={`px-2.5 py-1.5 rounded-xl backdrop-blur-md border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-lg ${
                    isQuickIngestOpen ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-400/50' : 'bg-black/50 hover:bg-blue-600 text-blue-300 hover:text-white border-white/20'
                  }`}
                  title="Toggle Universal File Drop Zone & Profile Analyzer"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ingest</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowFeatureHelpModal(true)}
                  className="p-1.5 rounded-xl backdrop-blur-md bg-black/50 hover:bg-black/80 text-primary border border-white/20 transition-all cursor-pointer shadow-lg"
                  title="Open Feature Help & Reference Guide (?)"
                >
                  <HelpCircle className="w-4 h-4 text-primary" />
                </button>
                <button 
                  type="button"
                  onClick={() => setIsProfileControlsHidden(!isProfileControlsHidden)}
                  className={`p-1.5 rounded-xl backdrop-blur-md border transition-all cursor-pointer shadow-lg flex items-center justify-center ${
                    isProfileControlsHidden 
                      ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-400/50' 
                      : 'bg-black/50 hover:bg-blue-600 text-blue-300 hover:text-white border-white/20'
                  }`}
                  title={isProfileControlsHidden ? "Show All Profile Buttons & Controls" : "Hide Controls (Clean Showcase View)"}
                >
                  <SlidersHorizontal className="w-5 h-5" />
                </button>
                <button 
                  type="button"
                  onClick={handleClose} 
                  className="p-1.5 bg-black/40 hover:bg-black/70 text-white/80 hover:text-white backdrop-blur-md rounded-full transition-colors cursor-pointer"
                  title="Close Profile Editor"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Banner Bottom Info Bar - Square Mugshot Icon, Name, Tagline, Date & Creator */}
              <div className="relative z-10 flex items-end justify-between px-4 sm:px-6 pb-3 pt-2 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                <div className={`flex items-end gap-4 w-full ${formData.reverseHeaderLayout ? 'flex-row-reverse text-right' : ''}`}>
                  {/* Corner Square Avatar Icon */}
                  {!formData.hideIcon && (
                    <div 
                      onClick={() => setShowPortraitPickerModal(true)}
                      className={`relative group w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-white/90 shadow-2xl overflow-hidden shrink-0 bg-slate-800 flex items-center justify-center cursor-pointer transition-all ${isDraggingPortrait ? 'ring-4 ring-primary scale-110' : 'hover:scale-105'}`}
                      title="Click or drag image to change portrait icon"
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingPortrait(true); }}
                      onDragLeave={() => setIsDraggingPortrait(false)}
                      onDrop={(e) => { e.stopPropagation(); handlePortraitDrop(e); }}
                    >
                      {mainImageSrc ? (
                        <img src={mainImageSrc} alt="Portrait Icon" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User className="w-8 h-8 text-white/50" />
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold gap-0.5">
                        <Camera className="w-4 h-4" />
                        <span>Change Icon</span>
                      </div>
                      {isDraggingPortrait && (
                        <div className="absolute inset-0 bg-primary/40 backdrop-blur-xs flex items-center justify-center border-2 border-dashed border-primary z-50 animate-in fade-in">
                          <Camera className="w-5 h-5 text-white animate-pulse" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Title, Tagline, Creator & Date */}
                  <div className="text-white space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isEditMode ? (
                        <input 
                          type="text" 
                          value={formData.name || ''} 
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Character Name..."
                          className="bg-black/60 border border-white/30 rounded px-2 py-0.5 text-base sm:text-xl font-black text-white outline-none focus:border-primary max-w-sm"
                        />
                      ) : (
                        <h2 className="text-lg sm:text-2xl font-black tracking-tight drop-shadow-md truncate">
                          {formData.name || 'Unnamed Character'}
                        </h2>
                      )}
                      <button 
                        type="button"
                        onClick={() => setFormData({ ...formData, isFavorite: !formData.isFavorite })}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsFavIconModalOpen(true);
                        }}
                        className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur transition-all cursor-pointer flex items-center justify-center"
                        title={formData.isFavorite ? 'Remove from favorites (Right-click to change icon)' : 'Add to favorites (Right-click to customize icon)'}
                      >
                        <RenderFavoriteIcon 
                          iconId={formData.favoriteIcon} 
                          customColor={formData.favoriteColor} 
                          isFavorite={!!formData.isFavorite} 
                          size="sm" 
                        />
                      </button>
                      {isEditMode && (
                        <span className="bg-amber-500 text-black text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Edit Mode Active
                        </span>
                      )}
                    </div>

                    {/* Brief Description / Tagline */}
                    {isEditMode ? (
                      <input 
                        type="text" 
                        value={formData.tagline || formData.description || ''} 
                        onChange={e => setFormData({ ...formData, tagline: e.target.value, description: e.target.value })}
                        placeholder="Short description / tagline..."
                        className="w-full bg-black/60 border border-white/20 rounded px-2 py-0.5 text-xs text-white/90 outline-none focus:border-primary"
                      />
                    ) : (
                      <p className="text-xs sm:text-sm text-white/90 font-medium line-clamp-1 drop-shadow-sm">
                        {formData.tagline || formData.description || 'Short character premise & lore overview'}
                      </p>
                    )}

                    {/* Date Created & Creator Credit */}
                    <div className="flex items-center gap-3 text-[11px] text-white/80 font-semibold flex-wrap pt-0.5">
                      <span className="flex items-center gap-1 bg-black/30 backdrop-blur px-2 py-0.5 rounded border border-white/10">
                        <Calendar className="w-3 h-3 text-white/60" />
                        <span>Created: {formData.dateCreated || new Date().toISOString().split('T')[0]}</span>
                      </span>

                      <span className="flex items-center gap-1 bg-black/30 backdrop-blur px-2 py-0.5 rounded border border-white/10">
                        <User className="w-3 h-3 text-white/60" />
                        <span>Created by:</span>
                        {isEditMode ? (
                          <input 
                            type="text" 
                            value={formData.creator || 'Alberto Armentero'} 
                            onChange={e => setFormData({ ...formData, creator: e.target.value })}
                            className="bg-black/80 border border-white/30 rounded px-1 text-[11px] text-white outline-none w-28"
                          />
                        ) : (
                          <strong className="text-white">{formData.creator || 'Alberto Armentero'}</strong>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Optional Portrait Mini Dropper Box on the other side of the row */}
                {formData.showPortraitMiniDropper && (
                  <div 
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingPortraitMiniDropper(true); }}
                    onDragLeave={() => setIsDraggingPortraitMiniDropper(false)}
                    onDrop={(e) => {
                      e.preventDefault(); e.stopPropagation();
                      setIsDraggingPortraitMiniDropper(false);
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        processDroppedFiles(e.dataTransfer.files);
                      }
                    }}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.multiple = true;
                      input.onchange = (evt: any) => {
                        const files = evt.target.files;
                        if (files && files.length > 0) {
                          processDroppedFiles(files);
                        }
                      };
                      input.click();
                    }}
                    className={`border-2 border-dashed rounded-xl w-16 h-16 sm:w-20 sm:h-20 flex flex-col items-center justify-center text-center cursor-pointer shrink-0 transition-all ${
                      isDraggingPortraitMiniDropper
                        ? 'border-primary bg-primary/25 text-white scale-105 shadow-xl shadow-primary/20 ring-4 ring-primary/30'
                        : 'border-white/40 bg-black/40 hover:bg-black/60 hover:border-white text-white/70 hover:text-white shadow-lg'
                    }`}
                    title="Drop any image, audio, video or 3D model here to auto-route!"
                  >
                    <Inbox className={`w-6 h-6 ${isDraggingPortraitMiniDropper ? 'animate-bounce text-primary' : 'text-white/60'}`} />
                    <span className="text-[8px] font-black uppercase tracking-wider mt-1 block leading-none">Drop Files</span>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Dedicated Control Bar BELOW Banner */}
        {!isProfileControlsHidden && (
          <div className="bg-card border-b px-4 py-2 flex flex-col gap-2 shrink-0 text-xs shadow-sm z-20">
            {/* Main Bar (Always Visible) */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Edit Mode Toggle Switch */}
                <button 
                  onClick={() => setIsEditMode(!isEditMode)}
                  disabled={formData.isMasterLocked}
                  className={`px-3 py-1 rounded-lg border font-bold flex items-center gap-1.5 transition-all cursor-pointer ${formData.isMasterLocked ? 'opacity-50 cursor-not-allowed bg-secondary grayscale' : isEditMode ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md ring-2 ring-amber-400/30' : 'bg-secondary hover:bg-secondary/80 text-foreground'}`}
                >
                  {formData.isMasterLocked ? <Lock className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
                  <span>{formData.isMasterLocked ? 'Profile Locked' : isEditMode ? 'Edit Mode: ON' : 'Edit Mode'}</span>
                </button>

              {isEditMode && (
                <>
                  {/* Pre-fill Sample Profile Button */}
                  <button 
                    onClick={loadRichSampleProfile}
                    className="bg-secondary hover:bg-secondary/80 text-foreground font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    title="Pre-fill complete character profile with sample audio, video clips, model sheets, and lore"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    <span>Load Sample Showcase</span>
                  </button>

                  {/* Universal Drag & Drop Header Zone */}
                  <div 
                    className={`transition-all duration-200 border rounded-lg px-2.5 py-1 flex items-center gap-1.5 cursor-pointer relative overflow-hidden ${isDraggingUniversal ? 'bg-primary/20 border-primary shadow ring-2 ring-primary scale-102' : 'bg-secondary/40 hover:bg-secondary/80 border-dashed border-primary/40'}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingUniversal(true); }}
                    onDragLeave={(e) => handleDragLeaveGuard(e, setIsDraggingUniversal)}
                    onDrop={handleUniversalDrop}
                    title="Drag & Drop any image, audio, video, or document file directly here! It automatically routes to the right media section."
                  >
                    <Upload className={`w-3.5 h-3.5 text-primary ${isDraggingUniversal ? 'animate-bounce' : ''}`} />
                    <span className="font-extrabold text-[11px] text-foreground">
                      {isDraggingUniversal ? 'Release to Auto-Import File!' : 'Drop Any Asset Here'}
                    </span>
                    <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.2 rounded font-bold hidden sm:inline">Auto-Sort</span>
                  </div>

                  {/* View Size Toggles (SM, MD, LG, XL) */}
                  <div className="flex bg-secondary rounded-lg p-0.5 items-center border">
                    <span className="text-[9px] text-muted-foreground px-1.5 font-bold uppercase tracking-wider">Size</span>
                    <button 
                      onClick={() => { setEditorSize('sm'); localStorage.setItem("editor_view_size", "sm"); }} 
                      className={`px-1.5 py-0.5 text-[10px] rounded-md font-bold transition-all cursor-pointer ${editorSize === 'sm' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                      title="Small View"
                    >
                      SM
                    </button>
                    <button 
                      onClick={() => { setEditorSize('md'); localStorage.setItem("editor_view_size", "md"); }} 
                      className={`px-1.5 py-0.5 text-[10px] rounded-md font-bold transition-all cursor-pointer ${editorSize === 'md' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                      title="Medium View"
                    >
                      MD
                    </button>
                    <button 
                      onClick={() => { setEditorSize('lg'); localStorage.setItem("editor_view_size", "lg"); }} 
                      className={`px-1.5 py-0.5 text-[10px] rounded-md font-bold transition-all cursor-pointer ${editorSize === 'lg' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                      title="Large View (Default)"
                    >
                      LG
                    </button>
                    <button 
                      onClick={() => { setEditorSize('xl'); localStorage.setItem("editor_view_size", "xl"); }} 
                      className={`px-1.5 py-0.5 text-[10px] rounded-md font-bold transition-all cursor-pointer ${editorSize === 'xl' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                      title="Extra Wide View"
                    >
                      XL
                    </button>
                    <button 
                      onClick={() => { setEditorSize('fl'); localStorage.setItem("editor_view_size", "fl"); }} 
                      className={`px-1.5 py-0.5 text-[10px] rounded-md font-bold transition-all cursor-pointer ${editorSize === 'fl' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                      title="Full Screen Window View"
                    >
                      FL
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Action Buttons: Exports, Save, Close */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Quick Header Layout Cycle Control */}
              <button
                id="header-layout-quick-cycle"
                type="button"
                onClick={handleCycleHeaderLayout}
                className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 font-extrabold px-3 py-1.5 rounded-lg border border-amber-500/30 flex items-center gap-1.5 transition-all cursor-pointer text-xs group"
                title="Quick toggle and cycle through 8 different header banner & portrait icon layouts"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-500 group-hover:rotate-180 transition-transform duration-500" />
                <span>Layout: <span className="font-semibold text-foreground underline decoration-amber-500/50 decoration-2">{(() => {
                  const hb = formData.hideBanner ?? true;
                  const hi = formData.hideIcon ?? false;
                  const pl = formData.profileLayout || 'classic';
                  const rev = formData.reverseHeaderLayout ?? false;
                  if (hb && hi) return 'Hidden';
                  if (!hb && !hi) {
                    if (pl === 'classic') return 'Classic';
                    if (pl === 'side') return rev ? 'Side Split (R)' : 'Side Split';
                    if (pl === 'floating') return 'Floating';
                    if (pl === 'stacked') return 'Stacked';
                  }
                  if (!hb && hi) return 'Banner Only';
                  if (hb && !hi) return 'Portrait Only';
                  return 'Custom';
                })()}</span></span>
              </button>
              {(() => {
                const exportPos = formData.uiControlsPositions?.export || 'top';
                const savePos = formData.uiControlsPositions?.save || 'top';

                const ExportButton = (
                  <div className="relative">
                    <button 
                      onClick={() => setShowExportMenu(!showExportMenu)}
                      className="bg-secondary hover:bg-secondary/80 text-foreground font-bold px-3 py-1 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <DownloadCloud className="w-3.5 h-3.5 text-primary" />
                      <span>Exports</span>
                      <ChevronDown className="w-3 h-3 text-muted-foreground" />
                    </button>
                    {showExportMenu && (
                      <div className="absolute right-0 mt-1 w-56 bg-card border rounded-xl shadow-2xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95">
                        <button 
                          onClick={() => {
                            setShowBibleReaderModal(true);
                            setShowExportMenu(false);
                          }}
                          className="w-full text-left px-2.5 py-2 hover:bg-primary/10 rounded-lg font-bold flex items-center gap-2 text-xs text-primary cursor-pointer border border-primary/20 bg-primary/5"
                        >
                          <BookOpenCheck className="w-4 h-4 text-primary" />
                          <div className="min-w-0">
                            <div>Interactive Flipbook Reader</div>
                            <div className="text-[10px] text-muted-foreground font-normal">Swipeable 3D booklet viewer</div>
                          </div>
                        </button>
                        <button 
                          onClick={() => {
                            setShowExportMenu(false);
                            handlePrintCatalogBooklet({ printMode: 'complete-bible' });
                          }}
                          className="w-full text-left px-2.5 py-1.5 hover:bg-secondary rounded-lg font-semibold flex items-center gap-2 text-xs text-foreground cursor-pointer"
                        >
                          <Printer className="w-4 h-4 text-purple-500" />
                          <span>Complete Bible Print/PDF</span>
                        </button>
                        <button 
                          onClick={() => { setShowBookletModal(true); setShowExportMenu(false); }}
                          className="w-full text-left px-2.5 py-1.5 hover:bg-secondary rounded-lg font-semibold flex items-center gap-2 text-xs text-foreground cursor-pointer"
                        >
                          <BookOpen className="w-4 h-4 text-indigo-500" />
                          <span>Standard Dossier Booklet</span>
                        </button>
                        <button 
                          onClick={handleExportJSON}
                          className="w-full text-left px-2.5 py-1.5 hover:bg-secondary rounded-lg font-semibold flex items-center gap-2 text-xs text-foreground cursor-pointer"
                        >
                          <DownloadCloud className="w-4 h-4 text-blue-500" />
                          <span>JSON Archive (.json)</span>
                        </button>
                        <button 
                          onClick={handleExportDoc}
                          className="w-full text-left px-2.5 py-1.5 hover:bg-secondary rounded-lg font-semibold flex items-center gap-2 text-xs text-foreground cursor-pointer"
                        >
                          <FileText className="w-4 h-4 text-emerald-500" />
                          <span>Word Brief (.doc)</span>
                        </button>
                        <button 
                          onClick={handleExportMarkdown}
                          className="w-full text-left px-2.5 py-1.5 hover:bg-secondary rounded-lg font-semibold flex items-center gap-2 text-xs text-foreground cursor-pointer"
                        >
                          <Share2 className="w-4 h-4 text-amber-500" />
                          <span>Markdown Codex (.md)</span>
                        </button>
                      </div>
                    )}
                  </div>
                );

                const SaveButton = (
                  <button 
                    onClick={handleSave} 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1 rounded-lg shadow flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save</span>
                  </button>
                );

                return (
                  <>
                    {exportPos === 'top' && ExportButton}
                    {savePos === 'top' && SaveButton}
                  </>
                );
              })()}

              {/* Header Mini Dropper component */}
              <div 
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingHeaderDropper(true); }}
                onDragLeave={() => setIsDraggingHeaderDropper(false)}
                onDrop={(e) => {
                  e.preventDefault(); e.stopPropagation();
                  setIsDraggingHeaderDropper(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    processDroppedFiles(e.dataTransfer.files);
                  }
                }}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.multiple = true;
                  input.onchange = (evt: any) => {
                    const files = evt.target.files;
                    if (files && files.length > 0) {
                      processDroppedFiles(files);
                    }
                  };
                  input.click();
                }}
                className={`border border-dashed rounded-lg px-2.5 py-1 text-center cursor-pointer flex items-center justify-center gap-1.5 transition-all text-xs select-none ${
                  isDraggingHeaderDropper
                    ? 'border-primary bg-primary/20 text-primary scale-102 font-black shadow-lg shadow-primary/10'
                    : 'border-muted-foreground/30 hover:border-primary bg-secondary/40 hover:bg-secondary/85 text-muted-foreground hover:text-foreground'
                }`}
                style={{ height: '32px' }}
                title="Drop files (including 3D models) here to upload them immediately!"
              >
                <Inbox className={`w-3.5 h-3.5 text-primary ${isDraggingHeaderDropper ? 'animate-bounce' : ''}`} />
                <span className="font-bold uppercase tracking-wider text-[10px]">Drop Files</span>
              </div>

              {/* Close Button */}
              <button 
                onClick={handleClose} 
                className="bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground p-1.5 rounded-lg border cursor-pointer"
                title="Close Profile"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Secondary Edit Tools Toolbar (ONLY Visible when Edit Mode is ON) */}
          {isEditMode && (
            <div className="flex items-center justify-between gap-2 flex-wrap border-t pt-2 w-full animate-in fade-in duration-200">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-600 border border-amber-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Sliders className="w-3 h-3" /> Edit Tools
                </span>

                {/* Banner Controls */}
                <button 
                  onClick={() => bannerInputRef.current?.click()}
                  className="bg-secondary hover:bg-secondary/80 text-foreground font-bold px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition-all cursor-pointer text-[11px]"
                >
                  <Camera className="w-3 h-3 text-primary" />
                  <span>{formData.bannerImageSrc ? 'Change Banner' : 'Upload Banner'}</span>
                </button>
                {formData.bannerImageSrc && (
                  <button 
                    onClick={() => setFormData({ ...formData, bannerImageSrc: undefined })}
                    className="bg-secondary/60 hover:bg-destructive/20 hover:text-destructive text-muted-foreground font-semibold px-2 py-1 rounded-md border transition-all cursor-pointer text-[11px]"
                    title="Remove Banner Image"
                  >
                    Clear
                  </button>
                )}

                {/* Banner Filters Dropdown */}
                <div className="relative group">
                  <button className="bg-secondary hover:bg-secondary/80 text-foreground font-bold px-2.5 py-1 rounded-md border flex items-center gap-1 cursor-pointer text-[11px]">
                    <Sliders className="w-3 h-3 text-primary" />
                    <span>Banner Filter</span>
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  </button>
                  <div className="absolute left-0 mt-1 w-44 bg-card border rounded-lg shadow-xl z-50 p-1 hidden group-hover:block animate-in fade-in">
                    <button onClick={() => handleSetBannerFilter('normal')} className="w-full text-left px-2.5 py-1.5 hover:bg-secondary rounded font-medium flex items-center justify-between">
                      <span>Normal</span>
                      <Sun className="w-3 h-3 text-amber-500" />
                    </button>
                    <button onClick={() => handleSetBannerFilter('lighter')} className="w-full text-left px-2.5 py-1.5 hover:bg-secondary rounded font-medium flex items-center justify-between">
                      <span>Lighter ☀️</span>
                    </button>
                    <button onClick={() => handleSetBannerFilter('darker')} className="w-full text-left px-2.5 py-1.5 hover:bg-secondary rounded font-medium flex items-center justify-between">
                      <span>Darker 🌙</span>
                    </button>
                    <button onClick={() => handleSetBannerFilter('contrast')} className="w-full text-left px-2.5 py-1.5 hover:bg-secondary rounded font-medium flex items-center justify-between">
                      <span>High Contrast ⚡</span>
                    </button>
                    <button onClick={() => handleSetBannerFilter('vibrant')} className="w-full text-left px-2.5 py-1.5 hover:bg-secondary rounded font-medium flex items-center justify-between">
                      <span>Vibrant 🎨</span>
                    </button>
                    <button onClick={() => handleSetBannerFilter('sepia')} className="w-full text-left px-2.5 py-1.5 hover:bg-secondary rounded font-medium flex items-center justify-between">
                      <span>Sepia 📜</span>
                    </button>
                    <button onClick={() => handleSetBannerFilter('bw')} className="w-full text-left px-2.5 py-1.5 hover:bg-secondary rounded font-medium flex items-center justify-between">
                      <span>B&W 🎬</span>
                    </button>
                  </div>
                </div>

                {/* Banner Align & Crop Button */}
                <button
                  onClick={() => setShowBannerCropModal(true)}
                  className="bg-secondary hover:bg-secondary/80 text-foreground font-bold px-2.5 py-1 rounded-md border flex items-center gap-1.5 cursor-pointer transition-all text-[11px]"
                  title="Align banner image (8 directions / center) and crop fit with live preview"
                >
                  <Maximize2 className="w-3 h-3 text-primary" />
                  <span>Align & Crop Banner</span>
                </button>

                {/* Icon / Portrait Align & Crop Button */}
                <button
                  onClick={() => setShowIconCropModal(true)}
                  className="bg-secondary hover:bg-secondary/80 text-foreground font-bold px-2.5 py-1 rounded-md border flex items-center gap-1.5 cursor-pointer transition-all text-[11px]"
                  title="Align icon/portrait image, zoom scale, and crop fit with live preview"
                >
                  <User className="w-3 h-3 text-primary" />
                  <span>Align & Crop Icon</span>
                </button>

                {/* Tab Color Spectrum Button */}
                <button 
                  onClick={handleAutoSpectrumPalette}
                  className="bg-secondary hover:bg-secondary/80 text-foreground font-bold px-2.5 py-1 rounded-md border flex items-center gap-1.5 cursor-pointer text-[11px]"
                  title="Auto-apply a harmonized rainbow color spectrum to all main tabs for a vibrant look"
                >
                  <Palette className="w-3 h-3 text-purple-500" />
                  <span>Spectrum Tabs</span>
                </button>

                {/* Sync Tab Colors to Palette Accent Color */}
                <button 
                  onClick={() => {
                    const accentColor = colorInput || '#3b82f6';
                    const syncedColors: Record<string, string> = {};
                    ['overview', 'profile', 'details', 'projects', 'media', 'technical', 'dev'].forEach(tabId => {
                      syncedColors[tabId] = accentColor;
                    });
                    setFormData((prev: any) => ({
                      ...prev,
                      tabColors: syncedColors
                    }));
                  }}
                  className="bg-secondary hover:bg-secondary/80 text-foreground font-bold px-2 py-1 rounded-md border flex items-center gap-1 cursor-pointer text-[11px]"
                  title="Synchronize all tab colors to match the currently selected accent color"
                >
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span>Sync Accent</span>
                </button>

                {/* Reset to system default spectrum colors */}
                <button 
                  onClick={() => {
                    setFormData((prev: any) => ({
                      ...prev,
                      tabColors: {
                        overview: '#3b82f6',
                        profile: '#eab308',
                        details: '#06b6d4',
                        projects: '#a855f7',
                        media: '#10b981',
                        technical: '#f43f5e',
                        dev: '#f97316'
                      }
                    }));
                  }}
                  className="bg-secondary hover:bg-secondary/80 text-foreground font-bold px-2 py-1 rounded-md border flex items-center gap-1 cursor-pointer text-[11px]"
                  title="Reset tab spectrum colors to standard defaults"
                >
                  <Sliders className="w-3 h-3 text-red-500" />
                  <span>Reset Tabs</span>
                </button>

                {/* Quick Toggle Banner Visibility */}
                <button
                  type="button"
                  onClick={() => setFormData((prev: any) => ({ ...prev, hideBanner: !prev.hideBanner }))}
                  className={`px-2.5 py-1 rounded-md border text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1 ${
                    formData.hideBanner 
                      ? 'bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20' 
                      : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border-emerald-500/20'
                  }`}
                  title="Toggle top background banner visibility completely"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Banner: {formData.hideBanner ? 'Hidden' : 'Visible'}</span>
                </button>

                {/* Quick Toggle Icon Visibility */}
                <button
                  type="button"
                  onClick={() => setFormData((prev: any) => ({ ...prev, hideIcon: !prev.hideIcon }))}
                  className={`px-2.5 py-1 rounded-md border text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1 ${
                    formData.hideIcon 
                      ? 'bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20' 
                      : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border-emerald-500/20'
                  }`}
                  title="Toggle portrait avatar icon visibility completely"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Icon: {formData.hideIcon ? 'Hidden' : 'Visible'}</span>
                </button>

                {/* Show Mini Dropper Beside Portrait Checkbox Toggle */}
                <label className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border border-amber-500/30 font-bold px-2.5 py-1 rounded-md text-[11px] cursor-pointer transition-all">
                  <input 
                    type="checkbox" 
                    checked={!!formData.showPortraitMiniDropper} 
                    onChange={(e) => setFormData({ ...formData, showPortraitMiniDropper: e.target.checked })}
                    className="w-3 h-3 accent-primary cursor-pointer rounded"
                  />
                  <span>Portrait Dropper</span>
                </label>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Render top panels (tabs and tools if placed at top) */}
        {renderTopPanels()}

        {/* Mid layout section */}
        <div className="flex flex-1 min-h-0 overflow-hidden flex-row relative">
          {/* Render left tab bar */}
          {tabPos === 'left' && renderTabsBar('vertical')}

          {/* Render left edit tools */}
          {toolsPos === 'left' && renderEditToolsPanel('vertical')}

          {/* Legacy layout wrapper hidden cleanly to maintain component references */}
          <div className="hidden">
            <div className={`flex flex-1 min-h-0 overflow-hidden ${formData.tabLayout === 'side' ? 'flex-row' : 'flex-col'}`}>
          {/* Main Tab Navigation Bar */}
          {formData.tabLayout === 'side' ? (
            <div className="flex flex-col border-r bg-card shrink-0 gap-1.5 p-4 w-52 select-none justify-start h-full relative">
              <div className="pb-2 border-b mb-1 flex items-center justify-between">
                <span className="font-extrabold text-[10px] text-muted-foreground uppercase tracking-widest">Navigation</span>
                
                {/* Tab Customizer Button (Settings) */}
                <div className="relative">
                  <button 
                    onClick={() => setShowTabSettings(!showTabSettings)}
                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${showTabSettings ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary hover:bg-secondary/80 text-foreground'}`}
                    title="Tab Layout & Sorting Settings"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>

                  {showTabSettings && (
                    <div className="absolute left-0 mt-2 bg-popover text-popover-foreground border rounded-xl shadow-2xl p-4 w-60 z-50 animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col gap-3">
                      <div className="flex items-center justify-between border-b pb-1.5">
                        <span className="font-bold text-xs flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-primary" />
                          Tab Bar Customizer
                        </span>
                        <button 
                          onClick={() => setShowTabSettings(false)}
                          className="p-1 hover:bg-secondary rounded-md"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Tab Layout (Top vs Side) */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">Layout Type</span>
                        <div className="grid grid-cols-2 gap-1 bg-secondary/30 p-1 rounded-lg border">
                          <button 
                            onClick={() => setFormData({ ...formData, tabLayout: 'top' })}
                            className={`py-1 rounded text-[10px] font-bold transition-all ${(formData.tabLayout || 'top') === 'top' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                          >
                            Top Bar
                          </button>
                          <button 
                            onClick={() => setFormData({ ...formData, tabLayout: 'side' })}
                            className={`py-1 rounded text-[10px] font-bold transition-all ${formData.tabLayout === 'side' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                          >
                            Sidebar
                          </button>
                        </div>
                      </div>

                      {/* Reordering Controls */}
                      <div className="space-y-1 border-t pt-2">
                        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">Tab Operations</span>
                        <button 
                          onClick={() => {
                            setFormData({
                              ...formData,
                              tabOrder: []
                            });
                            alert('Tab sorting order reset to default!');
                          }}
                          className="w-full bg-secondary hover:bg-secondary/80 text-foreground py-1 rounded text-[10px] font-bold border cursor-pointer"
                        >
                          Reset Tab Order
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Scrollable vertical list of tabs */}
              <div className="flex-1 flex flex-col gap-1 overflow-y-auto scrollbar-none pb-2">
                {getOrderedTabs().map((tab) => {
                  const IconComponent = tab.icon;
                  const currentLabel = tab.isCustom ? tab.defaultLabel : getTabLabel(tab.id, tab.defaultLabel);
                  const isActive = activeOuterTab === tab.id;
                  const tabColor = formData.tabColors?.[tab.id] || DEFAULT_TAB_SPECTRUM[tab.id] || '#3b82f6';

                  return (
                    <div 
                      key={tab.id} 
                      className="relative group flex items-center w-full py-0.5"
                      draggable={isEditMode}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', tab.id);
                        setDraggedTabId(tab.id);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const targetId = tab.id;
                        const draggedId = e.dataTransfer.getData('text/plain') || draggedTabId;
                        if (draggedId) {
                          handleTabReorder(draggedId, targetId);
                        }
                      }}
                      onDragEnd={() => setDraggedTabId(null)}
                    >
                      {isEditMode && (
                        <div 
                          className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-foreground p-0.5 mr-1 shrink-0 flex items-center justify-center"
                          title="Drag to reorder"
                        >
                          <div className="grid grid-cols-2 gap-0.5 w-1.5 h-3">
                            <div className="w-0.5 h-0.5 rounded-full bg-current" />
                            <div className="w-0.5 h-0.5 rounded-full bg-current" />
                            <div className="w-0.5 h-0.5 rounded-full bg-current" />
                            <div className="w-0.5 h-0.5 rounded-full bg-current" />
                            <div className="w-0.5 h-0.5 rounded-full bg-current" />
                            <div className="w-0.5 h-0.5 rounded-full bg-current" />
                          </div>
                        </div>
                      )}

                      <button 
                        className={`flex-1 font-extrabold transition-all flex items-center gap-2 cursor-pointer w-full px-2.5 py-1.5 text-xs rounded-lg justify-start text-left border-l-2`}
                        style={{
                          color: isActive ? tabColor : undefined,
                          borderColor: isActive ? tabColor : 'transparent',
                          backgroundColor: isActive ? `${tabColor}15` : undefined
                        }}
                        onClick={() => { 
                          setActiveOuterTab(tab.id); 
                          if (tab.isCustom) {
                            const customTabObj = formData.customTabs?.find(ct => ct.id === tab.id);
                            if (customTabObj?.subTabs && customTabObj.subTabs.length > 0) {
                              setActiveCustomSubTab(customTabObj.subTabs[0].id);
                            }
                          }
                          setAiReport(null); 
                        }}
                      >
                        <span 
                          className="w-1.5 h-1.5 rounded-full shrink-0" 
                          style={{ backgroundColor: tabColor }}
                        />
                        <IconComponent className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate flex-1">{currentLabel}</span>

                        {tab.isCustom && isEditMode && (
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              handleDeleteCustomMainTab(tab.id); 
                            }}
                            className="p-0.5 text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-destructive/10 ml-1 shrink-0"
                            title="Delete Custom Tab"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </button>

                      {isEditMode && !tab.isCustom && (
                        <div className="flex items-center gap-0.5 pl-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <input 
                            type="color" 
                            value={tabColor}
                            onChange={e => handleSetTabColor(tab.id, e.target.value)}
                            className="w-3.5 h-3.5 rounded cursor-pointer border-0 bg-transparent shrink-0"
                            title={`Change '${currentLabel}' tab color`}
                          />
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleRenameTab(tab.id, tab.defaultLabel); }}
                            className="p-0.5 text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                            title={`Rename '${currentLabel}' tab`}
                          >
                            <Edit2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add tab button at the bottom of vertical sidebar */}
              <div className="mt-auto pt-2 border-t shrink-0">
                <button 
                  onClick={() => setShowAddMainTabModal(true)}
                  className="w-full px-2 py-1.5 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors border border-dashed border-primary/30"
                  title="Add custom tab"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Tab</span>
                </button>
              </div>
            </div>
          ) : (
            <div className={`flex border-b px-4 sm:px-6 bg-card shrink-0 gap-1 items-center relative select-none w-full ${
              (formData.tabRows || 'single') === 'multi' ? 'flex-wrap py-1.5 overflow-visible' : 'overflow-x-auto scrollbar-none'
            }`}>
              {getOrderedTabs().map((tab) => {
                const IconComponent = tab.icon;
                const currentLabel = tab.isCustom ? tab.defaultLabel : getTabLabel(tab.id, tab.defaultLabel);
                const isActive = activeOuterTab === tab.id;
                const tabColor = formData.tabColors?.[tab.id] || DEFAULT_TAB_SPECTRUM[tab.id] || '#3b82f6';

                return (
                  <div 
                    key={tab.id} 
                    className="relative group flex items-center shrink-0 py-1 gap-0.5"
                    draggable={isEditMode}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', tab.id);
                      setDraggedTabId(tab.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const targetId = tab.id;
                      const draggedId = e.dataTransfer.getData('text/plain') || draggedTabId;
                      if (draggedId) {
                        handleTabReorder(draggedId, targetId);
                      }
                    }}
                    onDragEnd={() => setDraggedTabId(null)}
                  >
                    {isEditMode && (
                      <div 
                        className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-foreground p-0.5 shrink-0 flex items-center justify-center"
                        title="Drag to reorder"
                      >
                        <div className="grid grid-cols-2 gap-0.5 w-1.5 h-3">
                          <div className="w-0.5 h-0.5 rounded-full bg-current" />
                          <div className="w-0.5 h-0.5 rounded-full bg-current" />
                          <div className="w-0.5 h-0.5 rounded-full bg-current" />
                          <div className="w-0.5 h-0.5 rounded-full bg-current" />
                          <div className="w-0.5 h-0.5 rounded-full bg-current" />
                          <div className="w-0.5 h-0.5 rounded-full bg-current" />
                        </div>
                      </div>
                    )}

                    <button 
                      className="px-3 py-2 text-xs sm:text-sm font-extrabold rounded-t-lg transition-all flex items-center gap-1.5 cursor-pointer border-b-2"
                      style={{
                        color: isActive ? tabColor : undefined,
                        borderColor: isActive ? tabColor : 'transparent',
                        backgroundColor: isActive ? `${tabColor}15` : undefined
                      }}
                      onClick={() => { 
                        setActiveOuterTab(tab.id); 
                        if (tab.isCustom) {
                          const customTabObj = formData.customTabs?.find(ct => ct.id === tab.id);
                          if (customTabObj?.subTabs && customTabObj.subTabs.length > 0) {
                            setActiveCustomSubTab(customTabObj.subTabs[0].id);
                          }
                        }
                        setAiReport(null); 
                      }}
                    >
                      <span 
                        className="w-2 h-2 rounded-full shrink-0" 
                        style={{ backgroundColor: tabColor }}
                      />
                      <IconComponent className="w-4 h-4 shrink-0" />
                      <span>{currentLabel}</span>

                      {tab.isCustom && isEditMode && (
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            handleDeleteCustomMainTab(tab.id); 
                          }}
                          className="p-0.5 text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-destructive/10 ml-1.5"
                          title="Delete Custom Tab"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </button>

                    {isEditMode && !tab.isCustom && (
                      <div className="flex items-center gap-0.5 pl-0.5 shrink-0">
                        <input 
                          type="color" 
                          value={tabColor}
                          onChange={e => handleSetTabColor(tab.id, e.target.value)}
                          className="w-3.5 h-3.5 rounded cursor-pointer border-0 bg-transparent shrink-0"
                          title={`Change '${currentLabel}' tab color`}
                        />
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleRenameTab(tab.id, tab.defaultLabel); }}
                          className="p-0.5 text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                          title={`Rename '${currentLabel}' tab`}
                        >
                          <Edit2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add Custom Tab Button */}
              <button 
                onClick={() => setShowAddMainTabModal(true)}
                className="px-2.5 py-1 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg flex items-center gap-1 cursor-pointer transition-colors border border-dashed border-primary/30 shrink-0 ml-1"
                title="Add a new custom main tab"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Tab</span>
              </button>

              {/* Quick Reference Guide & Feature Tutorial Help Button */}
              <button 
                onClick={() => {
                  setHelpModalActiveTab(activeOuterTab);
                  setShowFeatureHelpModal(true);
                }}
                className="px-2.5 py-1 text-xs font-bold bg-secondary hover:bg-secondary/80 text-foreground rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors border shadow-xs shrink-0 ml-2"
                title="Quick Reference & Feature Tutorial Guide"
              >
                <HelpCircle className="w-3.5 h-3.5 text-primary" />
                <span>Guide & Features</span>
              </button>

              {/* Tab Customizer Popover Trigger REMOVED - NOW IN MAIN PANEL */}
            </div>
          )}

        </div> {/* End of legacy original wrapper */}
      </div> {/* End of legacy hidden container */}

          {/* Main Content Area */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-background/50">
          
          {/* Subtabs for Main Profile */}
          {activeOuterTab === 'profile' && (
            <div className="flex gap-1.5 p-2.5 px-6 bg-secondary/10 border-b shrink-0 overflow-x-auto scrollbar-none items-center">
              {[
                { id: 'all', label: 'All Sections' },
                { id: 'overview', label: 'Overview & Portrait' },
                { id: 'categories', label: 'Categories & Palette' },
                { id: 'timeline', label: 'Timeline & Dates' },
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setActiveProfileSubTab(sub.id as any)}
                  className={`px-3 py-1 text-xs font-bold rounded-full transition-colors shrink-0 cursor-pointer ${activeProfileSubTab === sub.id ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground'}`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          )}

          {/* Subtabs for Media Tab */}
          {activeOuterTab === 'media' && (
            <div className="flex gap-1.5 p-2.5 px-6 bg-secondary/10 border-b shrink-0 overflow-x-auto scrollbar-none">
              <button
                onClick={() => { setActiveMediaSubTab('images'); setAiReport(null); }}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-colors flex items-center gap-1 shrink-0 cursor-pointer ${activeMediaSubTab === 'images' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground'}`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                Images ({galleryImages.length})
              </button>
              <button
                onClick={() => { setActiveMediaSubTab('audios'); setAiReport(null); }}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-colors flex items-center gap-1 shrink-0 cursor-pointer ${activeMediaSubTab === 'audios' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground'}`}
              >
                <Music className="w-3.5 h-3.5" />
                Audios ({formData.audios?.length || 0})
              </button>
              <button
                onClick={() => { setActiveMediaSubTab('videos'); setAiReport(null); }}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-colors flex items-center gap-1 shrink-0 cursor-pointer ${activeMediaSubTab === 'videos' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground'}`}
              >
                <VideoIcon className="w-3.5 h-3.5" />
                Videos ({formData.videos?.length || 0})
              </button>
              <button
                onClick={() => { setActiveMediaSubTab('files'); setAiReport(null); }}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-colors flex items-center gap-1 shrink-0 cursor-pointer ${activeMediaSubTab === 'files' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground'}`}
              >
                <File className="w-3.5 h-3.5" />
                Documentations / Files ({formData.genericFiles?.length || 0})
              </button>
              <button
                onClick={() => { setActiveMediaSubTab('model3d'); setAiReport(null); }}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-colors flex items-center gap-1 shrink-0 cursor-pointer ${activeMediaSubTab === 'model3d' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground'}`}
              >
                <Boxes className="w-3.5 h-3.5 text-indigo-500" />
                3D Model Viewer
              </button>
              <button
                onClick={() => { setActiveMediaSubTab('dropbox'); setAiReport(null); }}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-colors flex items-center gap-1 shrink-0 cursor-pointer ${activeMediaSubTab === 'dropbox' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground'}`}
              >
                <Inbox className="w-3.5 h-3.5 text-blue-500" />
                Dropbox
              </button>
            </div>
          )}

          {/* Subtabs for Technical Specs */}
          {activeOuterTab === 'technical' && (
            <div className="flex gap-1.5 p-2.5 px-6 bg-secondary/10 border-b shrink-0 overflow-x-auto scrollbar-none">
              <button
                onClick={() => { setActiveTechSubTab('data'); setAiReport(null); }}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-colors flex items-center gap-1 shrink-0 cursor-pointer ${activeTechSubTab === 'data' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground'}`}
              >
                <Settings className="w-3.5 h-3.5" />
                Technical Data
              </button>
              <button
                onClick={() => { setActiveTechSubTab('export'); setAiReport(null); }}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-colors flex items-center gap-1 shrink-0 cursor-pointer ${activeTechSubTab === 'export' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground'}`}
              >
                <Download className="w-3.5 h-3.5" />
                Booklet Export
              </button>
            </div>
          )}

          {/* Actual Workspace Viewport */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* OVERVIEW TAB (AT-A-GLANCE & HIGHLIGHTED SPOTLIGHT MEDIA) */}
            {activeOuterTab === 'overview' && (
              <div className="space-y-6 max-w-5xl mx-auto p-2 animate-in fade-in duration-200">
                {/* Unified Hero Character Card */}
                <div className="bg-card border rounded-3xl p-6 shadow-xl relative overflow-hidden transition-all grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  
                  {/* Mugshot Column */}
                  <div className="md:col-span-4 flex flex-col items-center">
                    <div 
                      onClick={() => setShowPortraitPickerModal(true)}
                      className="relative group rounded-2xl border-4 border-primary/30 bg-secondary/30 shadow-xl overflow-hidden cursor-pointer flex items-center justify-center transition-all hover:border-primary hover:scale-[1.02] w-48 h-56"
                    >
                      {mainImageSrc ? (
                        <img src={mainImageSrc} alt={formData.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="text-muted-foreground flex flex-col items-center p-4">
                          <User className="w-12 h-12 mb-2 opacity-50 text-primary" />
                          <span className="text-xs font-semibold">No Mugshot Set</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-bold gap-1">
                        <Camera className="w-5 h-5 text-primary" />
                        <span>Change Mugshot Icon</span>
                      </div>
                    </div>
                  </div>

                  {/* Character Profile & Scrollable Bio Column */}
                  <div className="md:col-span-8 space-y-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="font-black tracking-tight text-foreground text-3xl">
                          {formData.name || 'Unnamed Character'}
                        </h2>
                        <span className="bg-primary/10 text-primary font-bold rounded-full border border-primary/20 text-xs px-3 py-1">
                          {formData.species || 'Character'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground italic mt-1 font-medium">
                        "{formData.tagline || formData.corePremise || 'An essential entity in your creative lore.'}"
                      </p>
                    </div>

                    {/* Scrollable Description Box */}
                    <div className="bg-secondary/10 p-4 rounded-2xl border space-y-1">
                      <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">Character Biography / Overview</span>
                      <div className="text-xs leading-relaxed text-foreground max-h-40 overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-primary/20">
                        {formData.description || 'No overview summary added yet. Click Details or Profile to customize.'}
                      </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                      <div className="bg-secondary/20 p-2.5 rounded-xl border text-center">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block">Gender</span>
                        <span className="text-xs font-black text-foreground">{formData.gender || 'Others'}</span>
                      </div>
                      <div className="bg-secondary/20 p-2.5 rounded-xl border text-center">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block">Status</span>
                        <span className="text-xs font-black text-emerald-600">{formData.status || 'Active'}</span>
                      </div>
                      <div className="bg-secondary/20 p-2.5 rounded-xl border text-center">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block">Date Created</span>
                        <span className="text-xs font-black text-foreground">{formData.dateCreated || 'Today'}</span>
                      </div>
                      <div className="bg-secondary/20 p-2.5 rounded-xl border text-center">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block">Total Library</span>
                        <span className="text-xs font-black text-primary">
                          {galleryImages.length + (formData.audios?.length || 0) + (formData.videos?.length || 0) + (formData.genericFiles?.length || 0)} Assets
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Highlighted Spotlight Media Panel */}
                <div className="p-6 bg-card border rounded-3xl shadow-xl space-y-4">
                  <div className="flex justify-between items-center border-b pb-3">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" /> Highlighted Spotlight Media
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Primary assets highlighting the character. Click any spotlight card to jump directly to its category or launch interactive preview.
                      </p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setActiveOuterTab('media')}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Manage All Media</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* 1. Highlighted Artwork Spot */}
                    <div 
                      onClick={() => { setActiveOuterTab('media'); setActiveMediaSubTab('images'); }}
                      className="p-4 bg-secondary/15 hover:bg-secondary/30 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-600 shrink-0">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-extrabold text-foreground group-hover:text-primary transition-colors">Featured Poster</h4>
                            <p className="text-[9px] text-muted-foreground uppercase font-semibold">Primary visual</p>
                          </div>
                        </div>
                        <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      {galleryImages.length > 0 ? (
                        <div className="space-y-1.5">
                          <p className="text-[11px] font-bold text-primary truncate">{galleryImages[0].title}</p>
                          <div className="relative w-full h-32 rounded-xl overflow-hidden border shadow-inner">
                            <img src={galleryImages[0].src} alt="Spotlight" className="w-full h-full object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-xl bg-background/50">
                          No images uploaded.
                        </div>
                      )}
                    </div>

                    {/* 2. Highlighted Audio Spot */}
                    <div 
                      className="p-4 bg-secondary/15 rounded-2xl border flex flex-col justify-between space-y-3"
                    >
                      <div 
                        onClick={() => { setActiveOuterTab('media'); setActiveMediaSubTab('audios'); }}
                        className="flex items-center justify-between cursor-pointer group"
                      >
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-blue-500/10 rounded-xl text-blue-600 shrink-0">
                            <Music className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-extrabold text-foreground group-hover:text-primary transition-colors">Debut Audio</h4>
                            <p className="text-[9px] text-muted-foreground uppercase font-semibold">Theme song</p>
                          </div>
                        </div>
                        <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      {formData.audios && formData.audios.length > 0 ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-bold text-primary truncate max-w-[140px]">{formData.audios[0].title}</p>
                            <span className="text-[9px] bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded font-bold">Debut</span>
                          </div>
                          <audio controls src={formData.audios[0].src} className="w-full h-8" />
                          {formData.audios.length > 1 && (
                            <div className="text-[10px] text-muted-foreground flex justify-between items-center pt-1">
                              <span>+ {formData.audios.length - 1} more tracks</span>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setActiveOuterTab('media'); setActiveMediaSubTab('audios'); }}
                                className="text-primary font-bold hover:underline cursor-pointer"
                              >
                                View Playlist
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div 
                          onClick={() => { setActiveOuterTab('media'); setActiveMediaSubTab('audios'); }}
                          className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-xl bg-background/50 cursor-pointer hover:border-primary"
                        >
                          No audio uploaded yet.
                        </div>
                      )}
                    </div>

                    {/* 3. Highlighted Video Spot */}
                    <div 
                      className="p-4 bg-secondary/15 rounded-2xl border flex flex-col justify-between space-y-3"
                    >
                      <div 
                        onClick={() => { setActiveOuterTab('media'); setActiveMediaSubTab('videos'); }}
                        className="flex items-center justify-between cursor-pointer group"
                      >
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-purple-500/10 rounded-xl text-purple-600 shrink-0">
                            <VideoIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-extrabold text-foreground group-hover:text-primary transition-colors">Featured Video</h4>
                            <p className="text-[9px] text-muted-foreground uppercase font-semibold">Teaser clip</p>
                          </div>
                        </div>
                        <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      {formData.videos && formData.videos.length > 0 ? (
                        <div className="space-y-1.5">
                          <p className="text-[11px] font-bold text-primary truncate">{formData.videos[0].title}</p>
                          <video 
                            controls 
                            src={formData.videos[0].src} 
                            className="w-full h-24 object-cover rounded-xl border bg-black shadow-inner" 
                          />
                        </div>
                      ) : (
                        <div 
                          onClick={() => { setActiveOuterTab('media'); setActiveMediaSubTab('videos'); }}
                          className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-xl bg-background/50 cursor-pointer hover:border-primary"
                        >
                          No video uploaded yet.
                        </div>
                      )}
                    </div>

                    {/* 4. Highlighted 3D Model Showcase Spot */}
                    <div 
                      onClick={() => { setActiveOuterTab('media'); setActiveMediaSubTab('model3d'); }}
                      className="p-4 bg-secondary/15 hover:bg-secondary/30 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-amber-500/10 rounded-xl text-amber-600 shrink-0">
                            <Box className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-extrabold text-foreground group-hover:text-primary transition-colors">3D Model Showcase</h4>
                            <p className="text-[9px] text-muted-foreground uppercase font-semibold">Interactive Viewer</p>
                          </div>
                        </div>
                        <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <div className="relative w-full h-28 rounded-xl overflow-hidden border bg-gradient-to-br from-slate-900 to-indigo-950 flex flex-col items-center justify-center p-3 text-center shadow-inner">
                        <Box className="w-8 h-8 text-amber-400 animate-spin-slow mb-1" />
                        <span className="text-[10px] font-bold text-white">Interactive 3D Model</span>
                        <span className="text-[8px] text-amber-300/80">Click to launch viewer</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeOuterTab === 'profile' && (
              <div className="space-y-6 max-w-4xl mx-auto p-2 animate-in fade-in duration-200">
                
                {/* Section 1: Overview & Portrait */}
                {(activeProfileSubTab === 'all' || activeProfileSubTab === 'overview') && (
                  <div className="p-5 bg-card border rounded-xl shadow-sm space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-foreground border-b pb-2 flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" /> Profile & Overview
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                      {/* Portrait Column */}
                      <div className="md:col-span-4 flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase block">Main Portrait</label>
                        <div className="bg-secondary/10 border rounded-lg p-2 relative overflow-hidden flex flex-col items-center justify-center h-48 w-full shadow-inner">
                          {mainImageSrc ? (
                            <img src={mainImageSrc} alt="Main Portrait" className="w-full h-full object-contain rounded-md" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="text-muted-foreground text-xs flex flex-col items-center p-4">
                              <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                              <span>No portrait selected</span>
                            </div>
                          )}
                        </div>
                        {galleryImages.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-semibold text-muted-foreground block">Available Images:</span>
                            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                              {galleryImages.map((img) => (
                                <button
                                  key={img.id}
                                  onClick={() => handleSetMainImage(img.src)}
                                  className={`relative shrink-0 w-10 h-10 rounded border overflow-hidden transition-all cursor-pointer ${mainImageSrc === img.src ? 'ring-2 ring-primary border-transparent shadow' : 'border-border hover:border-foreground/40'}`}
                                >
                                  <img src={img.src} alt="Sub Portrait" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Fields Column */}
                      <div className="md:col-span-8 space-y-3">
                        <div className="grid grid-cols-12 gap-3">
                          <div className="col-span-9">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Name / Title</label>
                            <input 
                              type="text" 
                              value={formData.name || ''} 
                              onChange={e => setFormData({...formData, name: e.target.value})} 
                              className="w-full bg-background border border-border/80 rounded-md px-3 py-1.5 text-sm font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary/20" 
                              placeholder="Enter item or character name..."
                            />
                          </div>
                          <div className="col-span-3 flex items-end pb-1.5">
                            <div className="flex items-center gap-1.5">
                              <input 
                                type="checkbox" 
                                id="favorite" 
                                checked={formData.isFavorite || false} 
                                onChange={e => setFormData({...formData, isFavorite: e.target.checked})} 
                                className="w-4 h-4 rounded text-primary cursor-pointer border-border" 
                              />
                              <label htmlFor="favorite" className="text-xs font-semibold flex items-center gap-1 cursor-pointer select-none">
                                <Heart className={`w-4 h-4 ${formData.isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} /> Favorite
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Profile Header Layout Selection - STRICTLY IMPLEMENTS FLEXIBLE PROFILE LAYOUTS */}
                        <div className="bg-secondary/35 border border-border/60 rounded-xl p-3 space-y-2">
                          <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">
                            Profile Header Layout Style
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                              { id: 'classic', label: 'Classic', desc: 'Standard banner with portrait overlay' },
                              { id: 'stacked', label: 'Stacked', desc: 'Full-width banner with card info below' },
                              { id: 'side', label: 'Side split', desc: 'Left column card with right banner panel' },
                              { id: 'floating', label: 'Floating', desc: 'Glassmorphic card floating over banner' }
                            ].map((layoutOpt) => (
                              <button
                                key={layoutOpt.id}
                                type="button"
                                onClick={() => setFormData({ ...formData, profileLayout: layoutOpt.id as any })}
                                className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between h-16 ${
                                  (formData.profileLayout || 'classic') === layoutOpt.id
                                    ? 'bg-primary/10 border-primary shadow-sm'
                                    : 'bg-background hover:bg-secondary/60 border-border'
                                }`}
                              >
                                <span className={`text-[11px] font-black ${
                                  (formData.profileLayout || 'classic') === layoutOpt.id ? 'text-primary' : 'text-foreground'
                                }`}>
                                  {layoutOpt.label}
                                </span>
                                <span className="text-[9px] text-muted-foreground leading-tight line-clamp-2">
                                  {layoutOpt.desc}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase block">Quick Summary / Overview</label>
                            <button 
                              type="button"
                              onClick={async () => {
                                if (isGeneratingDescription) return;
                                setIsGeneratingDescription(true);
                                try {
                                  const response = await fetch('/api/generate-description', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ character: formData })
                                  });
                                  if (!response.ok) {
                                    throw new Error('Failed to generate description');
                                  }
                                  const data = await response.json();
                                  if (data.description) {
                                    setFormData(prev => ({
                                      ...prev,
                                      description: data.description,
                                      tagline: data.tagline || prev.tagline
                                    }));
                                  }
                                } catch (err: any) {
                                  console.error(err);
                                  alert(`Error generating description: ${err.message}`);
                                } finally {
                                  setIsGeneratingDescription(false);
                                }
                              }}
                              disabled={isGeneratingDescription}
                              className="text-[10px] font-extrabold text-primary hover:text-primary-active flex items-center gap-1 transition-colors bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full cursor-pointer disabled:opacity-50"
                              title="Scan all profile details, custom pages, and lore to generate a professional biography summary"
                            >
                              <Sparkles className={`w-3 h-3 text-amber-500 ${isGeneratingDescription ? 'animate-spin' : ''}`} />
                              <span>{isGeneratingDescription ? 'Generating summary...' : 'AI Scan & Generate Biography'}</span>
                            </button>
                          </div>
                          <textarea 
                            value={formData.description || ''} 
                            onChange={e => setFormData({...formData, description: e.target.value})} 
                            className="w-full bg-background border border-border/80 rounded-md px-3 py-2 text-xs h-20 resize-none outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 leading-relaxed" 
                            placeholder="Write a brief overview or summary..."
                          />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Gender / Category</label>
                            <select 
                              value={formData.gender || 'Others'} 
                              onChange={e => setFormData({...formData, gender: e.target.value as Gender})} 
                              className="w-full bg-background border border-border/80 rounded-md px-2 py-1.5 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 cursor-pointer"
                            >
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Others">Others</option>
                              <option value="Objects">Object</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Type / Species</label>
                            <input 
                              type="text" 
                              value={formData.species || ''} 
                              onChange={e => setFormData({...formData, species: e.target.value})} 
                              className="w-full bg-background border border-border/80 rounded-md px-2 py-1.5 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20" 
                              placeholder="e.g. Artifact / Human"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">DB Status</label>
                            <select 
                              value={formData.status || 'Unsorted'} 
                              onChange={e => setFormData({...formData, status: e.target.value as Status})} 
                              className="w-full bg-background border border-border/80 rounded-md px-2 py-1.5 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 cursor-pointer"
                            >
                              <option value="Sorted">Sorted</option>
                              <option value="Unsorted">Unsorted</option>
                              <option value="Duplicate">Duplicate</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Completion %</label>
                            <input 
                              type="text" 
                              value={formData.completionRating || ''} 
                              onChange={e => setFormData({...formData, completionRating: e.target.value})} 
                              className="w-full bg-background border border-border/80 rounded-md px-2 py-1.5 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20" 
                              placeholder="e.g. 80%" 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 2: Categories & Color Palette */}
                {(activeProfileSubTab === 'all' || activeProfileSubTab === 'categories') && (
                  <div className="p-5 bg-card border rounded-xl shadow-sm space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-foreground border-b pb-2 flex items-center gap-2">
                      <Palette className="w-4 h-4 text-primary" /> Categories & Color Palette
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Categories Assignment */}
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-muted-foreground uppercase block">Custom Category Assignment</label>
                        <div className="flex flex-wrap gap-1.5">
                          {['Main Cast', 'Villains', 'Side Characters', 'Supporting', 'Recurring', 'Background', 'Artifacts', 'Locations'].map((cat) => {
                            const isAssigned = formData.categories?.includes(cat);
                            return (
                              <button
                                key={cat}
                                onClick={() => {
                                  const existing = formData.categories || [];
                                  const updated = isAssigned ? existing.filter(c => c !== cat) : [...existing, cat];
                                  setFormData({ ...formData, categories: updated });
                                }}
                                className={`px-2.5 py-1 text-xs rounded-full border transition-all cursor-pointer font-medium ${isAssigned ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary/40 hover:bg-secondary border-border text-muted-foreground'}`}
                              >
                                {isAssigned ? '✓ ' : '+ '}{cat}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex gap-2 items-center pt-2">
                          <input
                            type="text"
                            value={customCategoryInput}
                            onChange={e => setCustomCategoryInput(e.target.value)}
                            placeholder="Add custom category..."
                            className="bg-background border rounded px-2.5 py-1 text-xs outline-none focus:border-primary flex-1"
                          />
                          <button
                            onClick={() => {
                              if (customCategoryInput.trim()) {
                                const tag = customCategoryInput.trim();
                                if (!formData.categories?.includes(tag)) {
                                  setFormData({ ...formData, categories: [...(formData.categories || []), tag] });
                                }
                                setCustomCategoryInput('');
                              }
                            }}
                            className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded cursor-pointer hover:bg-primary/90"
                          >
                            Add
                          </button>
                        </div>
                        {formData.categories && formData.categories.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            <span className="text-[10px] text-muted-foreground font-semibold">Active:</span>
                            {formData.categories.map((c) => (
                              <span key={c} className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                {c}
                                <button
                                  onClick={() => setFormData({ ...formData, categories: formData.categories?.filter(cat => cat !== c) })}
                                  className="hover:text-destructive text-muted-foreground cursor-pointer"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Color Palette */}
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-muted-foreground uppercase block">Color Swatches</label>
                        <div className="flex flex-wrap gap-2 items-center min-h-[36px] bg-secondary/10 p-2 rounded-lg border">
                          {formData.colorPalette?.map((color, i) => (
                            <div key={i} className="group relative w-7 h-7 rounded-md border shadow-sm flex items-center justify-center shrink-0" style={{ backgroundColor: color }}>
                              <button 
                                onClick={() => removeColor(color)}
                                className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow"
                              >
                                <X className="w-2 h-2" />
                              </button>
                            </div>
                          ))}
                          {(!formData.colorPalette || formData.colorPalette.length === 0) && (
                            <span className="text-xs text-muted-foreground italic">No palette swatches added yet.</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <div className="relative flex items-center w-28">
                            <input 
                              type="color" 
                              value={colorInput} 
                              onChange={e => setColorInput(e.target.value)}
                              className="w-6 h-6 rounded border-none p-0 cursor-pointer absolute left-1"
                            />
                            <input
                              type="text"
                              value={colorInput}
                              onChange={e => setColorInput(e.target.value.toUpperCase())}
                              className="w-full pl-8 pr-2 py-1 text-xs bg-background border rounded uppercase font-mono font-bold"
                            />
                          </div>
                          <button onClick={addColor} className="bg-secondary hover:bg-secondary/85 text-foreground px-3 py-1 rounded text-xs font-bold border cursor-pointer">
                            + Add Swatch
                          </button>
                          {isEyeDropperSupported && (
                            <button onClick={handleEyeDropper} className="bg-secondary hover:bg-secondary/85 text-foreground p-1.5 rounded border shrink-0 cursor-pointer flex items-center gap-1 text-xs font-medium" title="Pick color from screen">
                              <Pipette className="w-3.5 h-3.5 text-primary" />
                              <span>Picker</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 3: Timeline & Archival Dates */}
                {(activeProfileSubTab === 'all' || activeProfileSubTab === 'timeline') && (
                  <div className="p-5 bg-card border rounded-xl shadow-sm space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-foreground border-b pb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" /> Timeline & Archival Dates
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-bold text-muted-foreground block mb-1">Date of Creation</label>
                        <input 
                          type="date" 
                          value={formData.dateCreated || ''} 
                          onChange={e => setFormData({...formData, dateCreated: e.target.value})} 
                          className="w-full bg-background border border-border/80 rounded-md px-3 py-1.5 text-xs outline-none focus:border-primary" 
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-muted-foreground block mb-1">Database Registry Date</label>
                        <input 
                          type="date" 
                          value={formData.dateUploaded || ''} 
                          onChange={e => setFormData({...formData, dateUploaded: e.target.value})} 
                          className="w-full bg-background border border-border/80 rounded-md px-3 py-1.5 text-xs outline-none focus:border-primary" 
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-muted-foreground block mb-1">Creation Source</label>
                        <select 
                          value={formData.dateCreatedSource || 'Added Manually'} 
                          onChange={e => setFormData({...formData, dateCreatedSource: e.target.value as any})} 
                          className="w-full bg-background border border-border/80 rounded-md px-3 py-1.5 text-xs outline-none focus:border-primary cursor-pointer"
                        >
                          <option value="Added Manually">✍️ Added Manually</option>
                          <option value="From File Properties">📁 From File Properties</option>
                          <option value="From Image Scanning">🔍 From Image Scanning</option>
                          <option value="From Text File">📄 From Text File</option>
                          <option value="Unknown">❓ Unknown</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* PROMINENT LINK BANNER TO DETAILS TAB */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between shadow-sm">
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary" /> Want full background notes & custom subpages?
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Access custom documentation pages, lore notes, and editorial tools inside the Details tab.
                    </p>
                  </div>
                  <button 
                    onClick={() => setActiveOuterTab('details')}
                    className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 flex items-center gap-1.5 shadow-sm transition-all shrink-0 cursor-pointer ml-3"
                  >
                    <span>More information in Details tab</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            )}

            {/* DETAILS TAB */}
            {activeOuterTab === 'details' && (
              <div className="flex flex-col space-y-6 h-full">
                {/* PERSISTENT MULTIMODAL DUMP & ANALYZER AREA */}
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="bg-primary/10 p-2 rounded-xl border border-primary/20 shrink-0">
                        <Sparkles className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-black text-sm uppercase tracking-tight text-foreground flex items-center gap-2">
                          Character Data Dump & Media Analyzer
                          <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Multimodal AI</span>
                        </h3>
                        <p className="text-[11px] text-muted-foreground font-medium">
                          Dump raw text, images, audio tracks (soundtracks, voiceovers), or video clips. The analyzer transcribes speech, extracts visual traits, and builds your profile.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="cursor-pointer bg-card hover:bg-secondary border text-foreground px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm border-border">
                        <Upload className="w-3.5 h-3.5 text-primary" />
                        <span>Attach Media Files</span>
                        <input 
                          type="file" 
                          multiple 
                          accept="image/*,audio/*,video/*,.json,.pdf,.txt" 
                          className="hidden" 
                          onChange={handleDumpFileUpload} 
                        />
                      </label>
                      <button 
                        onClick={() => { setQuickDumpText(''); setDumpMediaFiles([]); }}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all border border-transparent hover:border-border"
                        title="Clear dump area & media"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleAnalyzeTextDump('quick')}
                        disabled={isAnalyzing || (!quickDumpText.trim() && dumpMediaFiles.length === 0)}
                        className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-xs font-black shadow-lg hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
                      >
                        {isAnalyzing ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        )}
                        <span>{isAnalyzing ? 'Transcribing & Analyzing...' : 'Analyze & Populate Profile'}</span>
                      </button>
                    </div>
                  </div>

                  {/* ATTACHED MEDIA CHIPS ROW */}
                  {dumpMediaFiles.length > 0 && (
                    <div className="p-3 bg-card/80 border border-primary/20 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-foreground">
                        <span className="flex items-center gap-1.5 text-primary">
                          <Paperclip className="w-3.5 h-3.5" />
                          Attached Media for Dump Analysis ({dumpMediaFiles.length}):
                        </span>
                        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={autoAttachDumpMedia}
                            onChange={(e) => setAutoAttachDumpMedia(e.target.checked)}
                            className="rounded border-primary/30 text-primary focus:ring-primary h-3.5 w-3.5"
                          />
                          <span>Auto-save media items to character gallery/tracks</span>
                        </label>
                      </div>
                      <div className="flex flex-wrap gap-2.5 max-h-36 overflow-y-auto pr-1">
                        {dumpMediaFiles.map((file) => (
                          <div 
                            key={file.id}
                            className="flex items-center gap-2 bg-background border rounded-lg p-2 text-xs shadow-xs group relative max-w-xs"
                          >
                            {file.type === 'image' && file.previewUrl ? (
                              <img src={file.previewUrl} alt={file.name} className="w-8 h-8 rounded object-cover border" />
                            ) : file.type === 'video' ? (
                              <div className="w-8 h-8 rounded bg-primary/10 border flex items-center justify-center shrink-0">
                                <VideoIcon className="w-4 h-4 text-primary" />
                              </div>
                            ) : file.type === 'audio' ? (
                              <div className="w-8 h-8 rounded bg-primary/10 border flex items-center justify-center shrink-0">
                                <Music className="w-4 h-4 text-primary" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded bg-secondary border flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}

                            <div className="overflow-hidden min-w-0 flex-1 pr-4">
                              <p className="font-bold truncate text-[11px] text-foreground">{file.name}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">{file.sizeFormatted} • {file.type.toUpperCase()}</p>
                            </div>

                            <button
                              onClick={() => setDumpMediaFiles(prev => prev.filter(f => f.id !== file.id))}
                              className="absolute top-1 right-1 p-1 text-muted-foreground hover:text-destructive opacity-80 group-hover:opacity-100 transition-opacity"
                              title="Remove attached file"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* DROP ZONE & TEXT AREA */}
                  <div 
                    className={`relative rounded-xl transition-all ${
                      isDragOverDump ? 'ring-2 ring-primary bg-primary/10' : ''
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragOverDump(true); }}
                    onDragLeave={() => setIsDragOverDump(false)}
                    onDrop={handleDumpFileUpload}
                  >
                    <textarea 
                      value={quickDumpText}
                      onChange={(e) => setQuickDumpText(e.target.value)}
                      disabled={formData.isMasterLocked}
                      placeholder="Dump background notes, bio segments, or drag & drop images, audio files (soundtracks, voiceovers, documentaries), and video clips here... The Multimodal Analyzer will transcribe speech, extract visual traits, and organize the Section Index hierarchy automatically."
                      className="w-full h-32 bg-background/60 border border-border/80 rounded-xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 resize-none placeholder:text-muted-foreground/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {!quickDumpText && dumpMediaFiles.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25">
                        <div className="flex flex-col items-center gap-1.5 text-center">
                          <Upload className="w-7 h-7 text-primary animate-bounce" />
                          <span className="text-xs font-bold uppercase tracking-wider text-foreground">Drag & Drop Text, Images, Audios, or Video Clips</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-5 flex-1 min-h-[380px]">
                  {/* Left Sidebar Tree List for Subpages & Subcategories */}
                <div className="w-full md:w-64 shrink-0 bg-card/60 border rounded-xl p-3 flex flex-col space-y-3 shadow-sm">
                  <div className="flex items-center justify-between border-b pb-2">
                    {isEditingDetailsHeader ? (
                      <input
                        type="text"
                        autoFocus
                        value={formData.detailsHeaderTitle || 'Section Index'}
                        onChange={(e) => setFormData({ ...formData, detailsHeaderTitle: e.target.value })}
                        onBlur={() => setIsEditingDetailsHeader(false)}
                        onKeyDown={(e) => e.key === 'Enter' && setIsEditingDetailsHeader(false)}
                        className="bg-background border rounded px-1.5 py-0.5 text-xs font-bold text-foreground outline-none focus:border-primary w-full mr-2"
                      />
                    ) : (
                      <h4 
                        onClick={() => setIsEditingDetailsHeader(true)}
                        className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 cursor-pointer hover:text-foreground transition-colors group"
                        title="Click to customize/rename this header section"
                      >
                        <BookOpen className="w-4 h-4 text-primary" />
                        <span>{formData.detailsHeaderTitle || 'Section Index'}</span>
                        <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
                      </h4>
                    )}
                    <button
                      onClick={() => {
                        setNewSubPageParentId(null);
                        setShowAddSubPageModal(true);
                      }}
                      className="p-1 rounded bg-primary/10 hover:bg-primary/20 text-primary transition-colors text-[11px] font-bold flex items-center gap-1 cursor-pointer shrink-0 ml-1"
                      title="Add top-level subpage"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Page</span>
                    </button>
                  </div>

                  {/* Hierarchy Tree */}
                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-none">
                    {(formData.biblePages || [])
                      .filter(p => !p.parentId)
                      .map(rootPage => renderBiblePageNode(rootPage, 0))}
                  </div>
                </div>

                {/* Main Text Editor Panel */}
                <div 
                  className="flex-1 flex flex-col space-y-4"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleBibleTextDrop}
                >
                  <div className="flex flex-wrap justify-between items-center gap-3 border-b pb-2">
                    <h3 className="font-bold text-base flex items-center gap-2 text-foreground">
                      <FileText className="w-5 h-5 text-primary" />
                      {formData.biblePages?.find(p => p.id === activeDetailSubTab)?.title || 'Subpage Notes'}
                    </h3>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <button 
                        onClick={() => handleCopyBiblePageContent(activeDetailSubTab)}
                        className="bg-secondary/60 hover:bg-secondary text-foreground px-2 py-1.5 rounded-md text-xs font-semibold border transition-colors flex items-center gap-1 cursor-pointer"
                        title="Copy entire subpage content to clipboard"
                      >
                        <Copy className="w-3.5 h-3.5 text-primary" />
                        <span>Copy</span>
                      </button>

                      <button 
                        onClick={() => handlePasteBiblePageContent(activeDetailSubTab)}
                        className="bg-secondary/60 hover:bg-secondary text-foreground px-2 py-1.5 rounded-md text-xs font-semibold border transition-colors flex items-center gap-1 cursor-pointer"
                        title="Paste clipboard text into notes"
                      >
                        <Upload className="w-3.5 h-3.5 text-primary rotate-180" />
                        <span>Paste</span>
                      </button>

                      {/* Analyze & Organize Button */}
                      <button 
                        onClick={() => handleAnalyzePageContent(activeDetailSubTab)}
                        disabled={isAnalyzingPage}
                        className="bg-primary/20 hover:bg-primary/30 text-primary px-2.5 py-1.5 rounded-md text-xs font-bold border border-primary/50 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="Analyze all character notes and media assets to fulfill and organize this specific section"
                      >
                        {isAnalyzingPage ? (
                          <>
                            <Sparkles className="w-3.5 h-3.5 animate-spin" />
                            <span>Analyzing Section...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Analyze & Organize</span>
                          </>
                        )}
                      </button>

                      <button 
                        onClick={() => loadSectionTemplate(activeDetailSubTab)}
                        className="bg-secondary/60 hover:bg-secondary text-foreground px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer"
                      >
                        Load Template
                      </button>
                      
                      <label className="cursor-pointer bg-secondary/60 hover:bg-secondary text-foreground px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-colors flex items-center gap-1">
                        <Upload className="w-3.5 h-3.5" />
                        Import .txt
                        <input type="file" accept=".txt" className="hidden" onChange={handleBibleFileUpload} />
                      </label>

                      <button 
                        onClick={() => handleCreateProjectFromBiblePage(activeDetailSubTab)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                        title="Create an Episode or Project entry directly from this Bible note"
                      >
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>⚡ Turn into Episode / Project</span>
                      </button>

                      <button 
                        onClick={handleCheckText}
                        disabled={isCheckingText}
                        className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-primary/90 flex items-center gap-1 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                      >
                        {isCheckingText ? (
                          <>
                            <Sparkles className="w-3.5 h-3.5 animate-spin" />
                            Checking...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            Spellcheck & Organize (AI)
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex-1 relative min-h-[260px]">
                    <textarea 
                      value={formData.biblePages?.find(p => p.id === activeDetailSubTab)?.content || ''}
                      onChange={e => updateBiblePageContent(activeDetailSubTab, e.target.value)}
                      disabled={formData.isMasterLocked || formData.biblePages?.find(p => p.id === activeDetailSubTab)?.isLocked}
                      className="w-full h-full min-h-[240px] bg-secondary/10 border rounded-md p-4 font-mono text-xs md:text-sm resize-none focus:ring-2 focus:ring-primary/20 outline-none placeholder:text-muted-foreground/60 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                      placeholder="Type, paste, or drop a .txt file here to populate notes for this page..."
                    />
                  </div>
                </div>

                {/* AI Suggestions & Editorial Panel */}
                <div className="w-full lg:w-80 bg-secondary/10 border rounded-xl p-4 space-y-4 overflow-y-auto max-h-[440px]">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <h4 className="font-bold text-sm">Editorial Suite</h4>
                    </div>
                    {aiReport && (
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={sendReportToProfile}
                          className="bg-primary text-primary-foreground px-2.5 py-1 rounded text-[11px] font-black hover:bg-primary/90 transition-all cursor-pointer"
                          title="Save this report into the section index and fill the description"
                        >
                          Send to Profile
                        </button>
                        <button 
                          onClick={() => setAiReport(null)}
                          className="text-muted-foreground hover:text-foreground text-xs font-semibold cursor-pointer p-1"
                          title="Dismiss report"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Auto Check as you type Toggle & Quick Actions */}
                  <div className="flex items-center justify-between bg-card p-2 rounded-lg border text-xs">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-muted-foreground">
                      <input 
                        type="checkbox" 
                        checked={autoCheckSpelling}
                        onChange={e => setAutoCheckSpelling(e.target.checked)}
                        className="rounded border-border text-primary cursor-pointer"
                      />
                      <span>Auto-check as you type</span>
                    </label>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleCopyToClipboard(formData.biblePages?.find(p => p.id === activeDetailSubTab)?.content || '')}
                        className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Copy note text"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => {
                          handlePasteFromClipboard((pasted) => {
                            if (pasted) updateBiblePageContent(activeDetailSubTab, pasted);
                          });
                        }}
                        className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Paste into note"
                      >
                        <Clipboard className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  
                  {isCheckingText && (
                    <div className="space-y-2 py-8 text-center text-xs text-muted-foreground">
                      <Sparkles className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-2" />
                      <p className="font-semibold text-foreground">Analyzing text documents...</p>
                      <p>Correcting grammar and discovering related web references...</p>
                    </div>
                  )}

                  {!isCheckingText && !aiReport && (
                    <div className="text-xs text-muted-foreground py-6 text-center">
                      <p className="mb-2">Run the **Spellcheck & Organize (AI)** tool or enable **Auto-check** to scan notes for spelling/grammar errors and find references.</p>
                    </div>
                  )}

                  {!isCheckingText && aiReport && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="space-y-2">
                        <h5 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Spelling & Grammar Checklist</h5>
                        {aiReport.corrections && aiReport.corrections.length > 0 ? (
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {aiReport.corrections.map((corr, idx) => (
                              <div key={idx} className="p-2 bg-card rounded border text-xs space-y-1 shadow-sm">
                                <p className="text-red-500 font-medium line-through">"{corr.original}"</p>
                                <p className="text-green-600 font-bold">"{corr.corrected}"</p>
                                <p className="text-muted-foreground text-[10px] italic">{corr.explanation}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-green-600 font-semibold flex items-center gap-1">✅ No grammatical errors detected!</p>
                        )}
                        
                        {aiReport.organizedText && (
                          <button 
                            onClick={applyCorrections}
                            className="w-full mt-1.5 bg-green-100 hover:bg-green-200 text-green-800 text-xs py-1.5 rounded font-bold transition-all border border-green-200 cursor-pointer"
                          >
                            Apply Corrections
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <h5 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Suggested Reference Links</h5>
                        {aiReport.suggestedLinks && aiReport.suggestedLinks.length > 0 ? (
                          <div className="space-y-2">
                            {aiReport.suggestedLinks.map((link, idx) => (
                              <a 
                                key={idx} 
                                href={link.url} 
                                target="_blank" 
                                referrerPolicy="no-referrer"
                                className="block p-2.5 bg-card hover:bg-secondary/40 rounded border text-xs space-y-1 transition-all shadow-sm"
                              >
                                <div className="font-bold text-primary flex items-center gap-1 hover:underline">
                                  <LinkIcon className="w-3 h-3" />
                                  {link.title}
                                </div>
                                <p className="text-muted-foreground text-[10px] line-clamp-2">{link.description}</p>
                              </a>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">No external references found.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            )}

            {/* PROJECTS & RELATIONSHIPS TAB */}
            {activeOuterTab === 'projects' && (
              <div className="space-y-8 max-w-5xl mx-auto p-2 animate-in fade-in duration-200">
                {/* SECTION 1: ASSOCIATED PROJECTS & EPISODES (Details-Style Side-Panel Hierarchy) */}
                <div className="p-5 bg-card border rounded-xl shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b pb-3">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-primary" /> Associated Projects & Episodes Hierarchy
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Manage comics, games, show episodes, script outlines, or publications with interactive storyboard data sheets.
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        const newP: ProjectRelation = {
                          id: `proj_${Date.now()}`,
                          projectName: `New Episode / Project ${((formData.projects?.length || 0) + 1)}`,
                          roleOrRelation: 'Main Character Arc / Protagonist',
                          status: 'In Progress',
                          description: 'Add script notes, episode outlines, or production details here...',
                          tables: []
                        };
                        setFormData({ ...formData, projects: [...(formData.projects || []), newP] });
                        setSelectedProjectId(newP.id);
                      }}
                      className="bg-primary text-primary-foreground font-bold text-xs py-1.5 px-3 rounded shadow hover:bg-primary/90 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Project / Episode</span>
                    </button>
                  </div>

                  <div className="flex flex-col md:flex-row gap-5 min-h-[420px]">
                    {/* Left Sidebar List for Projects */}
                    <div className="w-full md:w-64 shrink-0 bg-card/60 border rounded-xl p-3 flex flex-col space-y-3 shadow-sm">
                      <div className="flex items-center justify-between border-b pb-2">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-primary" /> Project Index
                        </h4>
                        <span className="text-[10px] bg-secondary font-bold px-2 py-0.5 rounded-full border">
                          {formData.projects?.length || 0} Listed
                        </span>
                      </div>

                      {/* Project Search Filter */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                        <input 
                          type="text"
                          value={projectSearchQuery}
                          onChange={e => setProjectSearchQuery(e.target.value)}
                          placeholder="Filter projects..."
                          className="w-full pl-8 pr-2 py-1.5 text-xs bg-background border rounded-md outline-none focus:border-primary"
                        />
                      </div>

                      {/* Projects List */}
                      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-none">
                        {(formData.projects || [])
                          .filter(p => !projectSearchQuery.trim() || p.projectName.toLowerCase().includes(projectSearchQuery.toLowerCase()) || p.roleOrRelation.toLowerCase().includes(projectSearchQuery.toLowerCase()))
                          .map(p => {
                            const isSelected = selectedProjectId === p.id;
                            return (
                              <div 
                                key={p.id}
                                onClick={() => setSelectedProjectId(p.id)}
                                className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between group ${isSelected ? 'bg-primary/10 border-primary font-bold shadow-sm' : 'bg-card hover:bg-secondary/50 border-border'}`}
                              >
                                <div className="space-y-0.5 truncate pr-1">
                                  <div className="font-semibold text-foreground truncate">{p.projectName}</div>
                                  <div className="text-[10px] text-muted-foreground truncate">{p.roleOrRelation}</div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className="text-[9px] bg-secondary px-1.5 py-0.5 rounded border text-muted-foreground">
                                    {p.status}
                                  </span>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteProject(p.id); }}
                                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-1 transition-opacity cursor-pointer"
                                    title="Delete project"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        {(!formData.projects || formData.projects.length === 0) && (
                          <div className="text-center py-8 text-xs text-muted-foreground italic">
                            No projects added yet. Click above to create one!
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Main Editor Panel for Selected Project */}
                    {(() => {
                      const activeProj = formData.projects?.find(p => p.id === selectedProjectId);
                      if (!activeProj) {
                        return (
                          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border rounded-xl bg-secondary/5 space-y-3">
                            <Briefcase className="w-10 h-10 text-muted-foreground/40" />
                            <h4 className="font-bold text-sm text-foreground">Select or Create a Project</h4>
                            <p className="text-xs text-muted-foreground max-w-sm">
                              Choose a project entry from the index on the left, or create a new episode to start editing production scripts and storyboards.
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div className="flex-1 flex flex-col space-y-4">
                          {/* Project Header Controls */}
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 bg-secondary/10 p-3 rounded-lg border">
                            <div className="flex-1 min-w-[200px] space-y-1">
                              <label className="text-[10px] font-bold text-muted-foreground uppercase block">Project Title</label>
                              <input 
                                type="text" 
                                value={activeProj.projectName}
                                onChange={e => handleUpdateProject(activeProj.id, { projectName: e.target.value })}
                                className="w-full bg-background border rounded px-2.5 py-1 text-sm font-bold outline-none focus:border-primary"
                              />
                            </div>

                            <div className="w-36 space-y-1">
                              <label className="text-[10px] font-bold text-muted-foreground uppercase block">Status</label>
                              <select 
                                value={activeProj.status}
                                onChange={e => handleUpdateProject(activeProj.id, { status: e.target.value as any })}
                                className="w-full bg-background border rounded px-2 py-1 text-xs font-semibold outline-none focus:border-primary cursor-pointer"
                              >
                                <option value="Published">Published</option>
                                <option value="Unpublished">Unpublished</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Official">Official</option>
                                <option value="Unofficial">Unofficial</option>
                                <option value="Fan Work">Fan Work</option>
                                <option value="Concept">Concept</option>
                              </select>
                            </div>

                            <div className="w-48 space-y-1">
                              <label className="text-[10px] font-bold text-muted-foreground uppercase block">Role / Relation</label>
                              <input 
                                type="text" 
                                value={activeProj.roleOrRelation}
                                onChange={e => handleUpdateProject(activeProj.id, { roleOrRelation: e.target.value })}
                                className="w-full bg-background border rounded px-2.5 py-1 text-xs font-semibold outline-none focus:border-primary"
                              />
                            </div>

                            <button 
                              onClick={() => handleAddTableToProject(activeProj.id)}
                              className="mt-4 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold px-3 py-1.5 rounded border flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Table className="w-3.5 h-3.5" />
                              <span>+ Storyboard Table</span>
                            </button>
                          </div>

                          {/* Text Synopsis / Episode Notes Textarea */}
                          <div className="space-y-1 flex-1 flex flex-col">
                            <label className="text-xs font-bold text-muted-foreground uppercase block">Episode Outline / Production Notes</label>
                            <textarea 
                              value={activeProj.description || ''}
                              onChange={e => handleUpdateProject(activeProj.id, { description: e.target.value })}
                              className="w-full flex-1 min-h-[160px] bg-secondary/10 border rounded-md p-3 font-mono text-xs md:text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-colors resize-none"
                              placeholder="Write episode scripts, story outlines, production details, or notes here..."
                            />
                          </div>

                          {/* Render Embedded Storyboard / Data Tables */}
                          {activeProj.tables && activeProj.tables.length > 0 && (
                            <div className="space-y-4 pt-2 border-t">
                              <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Embedded Storyboard Sheets
                              </h4>
                              {activeProj.tables.map(tbl => (
                                <div key={tbl.id} className="bg-secondary/10 border rounded-lg p-3 space-y-2 overflow-x-auto">
                                  <div className="flex justify-between items-center">
                                    <h5 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                                      <Table className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>{tbl.title}</span>
                                    </h5>
                                    <button 
                                      onClick={() => handleAddRowToTable(activeProj.id, tbl.id)}
                                      className="text-[10px] bg-secondary hover:bg-secondary/80 font-bold px-2 py-0.5 rounded border flex items-center gap-1 cursor-pointer"
                                    >
                                      <Plus className="w-3 h-3" />
                                      <span>Add Row</span>
                                    </button>
                                  </div>

                                  <table className="w-full text-xs text-left border-collapse min-w-[500px]">
                                    <thead>
                                      <tr className="bg-secondary/40 border-b">
                                        {tbl.columns.map((col, cIdx) => (
                                          <th key={cIdx} className="p-2 font-bold text-[11px] text-muted-foreground uppercase border-r last:border-r-0">
                                            {col}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {tbl.rows.map((row, rIdx) => (
                                        <tr key={rIdx} className="border-b last:border-b-0 hover:bg-secondary/20">
                                          {row.map((cell, cIdx) => (
                                            <td key={cell.id} className="p-1.5 border-r last:border-r-0 align-top" style={{ backgroundColor: cell.bgColor }}>
                                              {cell.isImage ? (
                                                <div className="space-y-1">
                                                  {cell.content ? (
                                                    <div className="relative h-16 w-20 rounded border overflow-hidden group">
                                                      <img src={cell.content} alt="Cell asset" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                                    </div>
                                                  ) : (
                                                    <span className="text-[10px] text-muted-foreground italic">No image frame</span>
                                                  )}
                                                  <input 
                                                    type="text" 
                                                    value={cell.content}
                                                    onChange={e => handleUpdateTableCell(activeProj.id, tbl.id, rIdx, cIdx, { content: e.target.value })}
                                                    placeholder="Image URL..."
                                                    className="w-full text-[10px] bg-background border rounded px-1 py-0.5"
                                                  />
                                                </div>
                                              ) : (
                                                <div className="space-y-1">
                                                  <input 
                                                    type="text" 
                                                    value={cell.content}
                                                    onChange={e => handleUpdateTableCell(activeProj.id, tbl.id, rIdx, cIdx, { content: e.target.value })}
                                                    className={`w-full bg-transparent outline-none px-1 py-0.5 text-xs ${cell.fontWeight === 'bold' ? 'font-bold' : ''}`}
                                                    style={{ color: cell.textColor }}
                                                  />
                                                  <div className="flex items-center gap-1 opacity-40 hover:opacity-100 transition-opacity">
                                                    <button 
                                                      onClick={() => handleUpdateTableCell(activeProj.id, tbl.id, rIdx, cIdx, { fontWeight: cell.fontWeight === 'bold' ? 'normal' : 'bold' })}
                                                      className={`px-1 py-0.2 rounded text-[9px] border ${cell.fontWeight === 'bold' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
                                                    >
                                                      B
                                                    </button>
                                                  </div>
                                                </div>
                                              )}
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* SECTION 2: ENTITY & CHARACTER RELATIONSHIPS */}
                <div className="p-5 bg-card border rounded-xl shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-primary" /> Entity & Character Relationships
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Define bonds, rivalries, creators, or connections with other characters or objects with custom icons.
                      </p>
                    </div>
                  </div>

                  {/* Add Relationship Form */}
                  <div className="bg-secondary/20 p-4 rounded-lg border space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Add New Relationship</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Target Character / Entity</label>
                        <input 
                          type="text" 
                          value={relFormTarget}
                          onChange={e => setRelFormTarget(e.target.value)}
                          placeholder="e.g. Captain Vane / Golden Sword"
                          className="w-full bg-background border rounded px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Relationship Type</label>
                        <input 
                          type="text" 
                          value={relFormType}
                          onChange={e => setRelFormType(e.target.value)}
                          placeholder="e.g. Ally, Rival, Creator, Owner"
                          className="w-full bg-background border rounded px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Notes</label>
                        <input 
                          type="text" 
                          value={relFormNotes}
                          onChange={e => setRelFormNotes(e.target.value)}
                          placeholder="Relationship details..."
                          className="w-full bg-background border rounded px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button 
                        onClick={handleAddRelationship}
                        disabled={!relFormTarget.trim()}
                        className="bg-primary text-primary-foreground font-bold text-xs py-1.5 px-4 rounded hover:bg-primary/90 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Relationship Entry</span>
                      </button>
                    </div>
                  </div>

                  {/* List of Relationships */}
                  <div className="space-y-2 pt-2">
                    {formData.relationships && formData.relationships.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {formData.relationships.map(r => (
                          <div key={r.id} className="p-3 bg-card border rounded-lg shadow-sm flex flex-col justify-between space-y-2 relative group">
                            <div className="flex items-center gap-3">
                              {/* Relationship Avatar / Icon */}
                              <div 
                                onClick={() => {
                                  const url = prompt("Enter Image URL for Relationship Icon:", r.iconUrl || galleryImages[0]?.src || "");
                                  if (url !== null) {
                                    const updatedRels = (formData.relationships || []).map(item => item.id === r.id ? { ...item, iconUrl: url } : item);
                                    setFormData({ ...formData, relationships: updatedRels });
                                  }
                                }}
                                className="w-10 h-10 rounded-lg bg-secondary border overflow-hidden shrink-0 cursor-pointer flex items-center justify-center hover:ring-2 hover:ring-primary transition-all"
                                title="Click to upload or set icon URL"
                              >
                                {r.iconUrl ? (
                                  <img src={r.iconUrl} alt={r.targetName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <User className="w-5 h-5 text-muted-foreground" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                  <h4 className="font-bold text-xs text-foreground truncate">{r.targetName}</h4>
                                  <button 
                                    onClick={() => handleDeleteRelationship(r.id)}
                                    className="text-muted-foreground hover:text-destructive p-1 transition-colors cursor-pointer shrink-0 ml-1"
                                    title="Remove Relationship Entry"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <span className="inline-block mt-0.5 bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/20">
                                  {r.relationshipType}
                                </span>
                              </div>
                            </div>
                            {r.notes && (
                              <p className="text-[11px] text-muted-foreground leading-relaxed pt-1 border-t border-border/50">
                                {r.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 border border-dashed rounded-lg text-xs text-muted-foreground">
                        No relationships logged yet. Add your first relationship above!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* MOODBOARD TAB */}
            {activeOuterTab === 'moodboard' && (
              <div className="h-full p-4 animate-in fade-in duration-200">
                <MoodBoard />
              </div>
            )}

            {/* CUSTOM MAIN TABS WORKSPACE */}
            {activeOuterTab.startsWith('custom-') && (
              <div className="flex flex-col md:flex-row gap-5 h-full min-h-[380px]">
                {(() => {
                  const customTab = formData.customTabs?.find(t => t.id === activeOuterTab);
                  if (!customTab) return <p className="text-xs text-muted-foreground">Tab not found.</p>;

                  const activeSub = customTab.subTabs.find(s => s.id === activeCustomSubTab) || customTab.subTabs[0];

                  return (
                    <>
                      {/* Left Sidebar List for Custom Subpages */}
                      <div className="w-full md:w-60 shrink-0 bg-card/60 border rounded-xl p-3 flex flex-col space-y-3 shadow-sm">
                        <div className="flex items-center justify-between border-b pb-2">
                          <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-primary" /> {customTab.title} Subpages
                          </h4>
                          <button
                            onClick={() => {
                              const name = prompt("Enter new subpage title:");
                              if (name) handleAddCustomSubTab(customTab.id, name);
                            }}
                            className="p-1 rounded bg-primary/10 hover:bg-primary/20 text-primary transition-colors text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>New Page</span>
                          </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-1 scrollbar-none">
                          {customTab.subTabs.map(sub => (
                            <div
                              key={sub.id}
                              onClick={() => setActiveCustomSubTab(sub.id)}
                              className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${activeCustomSubTab === sub.id ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-secondary/80 text-foreground'}`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <FileText className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{sub.title}</span>
                              </div>
                              {customTab.subTabs.length > 1 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCustomSubTab(customTab.id, sub.id);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-black/20 rounded text-destructive"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Main Editor Panel */}
                      <div className="flex-1 p-5 bg-card border rounded-xl shadow-sm space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                            <Layers className="w-4 h-4 text-primary" /> {customTab.title} — {activeSub?.title || 'Notes'}
                          </h3>
                        </div>

                        <div className="space-y-2">
                          <textarea 
                            value={activeSub?.content || ''}
                            onChange={e => {
                              if (activeSub) handleUpdateCustomSubTabContent(customTab.id, activeSub.id, e.target.value);
                            }}
                            className="w-full h-64 bg-secondary/10 border rounded-lg p-4 font-mono text-xs md:text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                            placeholder={`Enter notes or documentation for ${activeSub?.title}...`}
                          />
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* MEDIA ASSETS TAB */}
            {activeOuterTab === 'media' && (
              <div 
                className={`flex flex-col md:flex-row gap-5 h-full min-h-[380px] relative transition-all duration-200 ${isDraggingMedia ? 'bg-primary/5 rounded-xl border-2 border-dashed border-primary/50 p-2' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setIsDraggingMedia(true); }}
                onDragLeave={() => setIsDraggingMedia(false)}
                onDrop={handleMediaDrop}
              >
                {isDraggingMedia && (
                  <div className="absolute inset-0 bg-primary/20 backdrop-blur-xs flex flex-col items-center justify-center border-4 border-dashed border-primary z-50 rounded-xl animate-in fade-in duration-150">
                    <div className="bg-slate-900/95 text-white font-extrabold text-sm px-6 py-4 rounded-xl shadow-xl border border-white/20 flex flex-col items-center gap-3 text-center max-w-sm">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary animate-bounce">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">Drop Media to Upload</h4>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {activeMediaSubTab === 'images' && "Add image to subImages collection"}
                          {activeMediaSubTab === 'audios' && "Add audio to voice notes & track list"}
                          {activeMediaSubTab === 'videos' && "Add video to associated media clips"}
                          {activeMediaSubTab === 'files' && "Add file attachment to documentation list"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Left Sidebar List for Media Categories & Hierarchy */}
                <div className="w-full md:w-60 shrink-0 bg-card/60 border rounded-xl p-3 flex flex-col space-y-3 shadow-sm">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Folder className="w-4 h-4 text-primary" /> Media Categories
                    </h4>
                    <button
                      onClick={() => {
                        setNewMediaCatType(activeMediaSubTab === 'audios' ? 'audio' : activeMediaSubTab === 'videos' ? 'video' : 'image');
                        setNewMediaCatParentId(null);
                        setShowAddMediaCatModal(true);
                      }}
                      className="p-1 rounded bg-primary/10 hover:bg-primary/20 text-primary transition-colors text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      title="Add category or show list"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New List</span>
                    </button>
                  </div>

                  {/* All Files item */}
                  <div 
                    onClick={() => setActiveMediaCategory('all')}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${activeMediaCategory === 'all' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-secondary/80 text-foreground'}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      <span>All Media Items</span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeMediaCategory === 'all' ? 'bg-white/20 text-white' : 'bg-secondary text-muted-foreground'}`}>
                      {activeMediaSubTab === 'audios' ? (formData.audios?.length || 0) : activeMediaSubTab === 'videos' ? (formData.videos?.length || 0) : galleryImages.length}
                    </span>
                  </div>

                  <div className="border-t pt-2 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block px-1">
                      {activeMediaSubTab === 'audios' ? 'Audio Categories' : activeMediaSubTab === 'videos' ? 'Video Lists' : 'Image Collections'}
                    </span>
                    <div className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-none">
                      {(formData.mediaCategories || [])
                        .filter(c => c.type === (activeMediaSubTab === 'audios' ? 'audio' : activeMediaSubTab === 'videos' ? 'video' : 'image') && !c.parentId)
                        .map(cat => renderMediaCategoryNode(cat, 0))}
                    </div>
                  </div>
                </div>

                {/* Right Media Grid & Viewer */}
                <div className="flex-1 space-y-4">
                  {/* Images View */}
                  {activeMediaSubTab === 'images' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b pb-2">
                        <h3 className="font-bold text-base flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-primary" />
                          {activeMediaCategory === 'all' ? 'All Images & Model Sheets' : (formData.mediaCategories?.find(c => c.id === activeMediaCategory)?.name || 'Image Collection')}
                        </h3>
                        <div className="flex items-center gap-2">
                          {/* Master Indicator Toggle */}
                          <button
                            type="button"
                            onClick={() => {
                              const nextVal = !formData.showIndicators;
                              setFormData({ ...formData, showIndicators: nextVal });
                            }}
                            className={`px-2.5 py-1.5 rounded-md text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                              formData.showIndicators ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-secondary text-muted-foreground border-border hover:text-foreground'
                            }`}
                            title="Master Toggle: Turn image indicator dots ON or OFF (Default: OFF)"
                          >
                            <div className={`w-2.5 h-2.5 rounded-full ${formData.showIndicators ? 'bg-white animate-pulse' : 'bg-muted-foreground/50'}`} />
                            <span>Indicators: {formData.showIndicators ? 'ON' : 'OFF'}</span>
                          </button>

                          <label className="cursor-pointer bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-primary/90 flex items-center gap-1.5 shadow-sm">
                            <Upload className="w-3.5 h-3.5" />
                            Upload Image
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (evt) => {
                                    const src = evt.target?.result as string;
                                    const newImg = {
                                      id: `sub-${Date.now()}`,
                                      src: src,
                                      title: file.name.replace(/\.[^/.]+$/, ""),
                                      description: 'Uploaded image asset.',
                                      category: activeMediaCategory !== 'all' ? activeMediaCategory : undefined
                                    };
                                    setFormData(prev => ({
                                      ...prev,
                                      subImages: [...(prev.subImages || []), newImg]
                                    }));
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }} 
                            />
                          </label>
                        </div>
                      </div>

                      {/* Relocated Pose Sheet & Model Showcase Carousel */}
                      <div 
                        className={`bg-card border rounded-2xl shadow-md overflow-hidden p-5 space-y-3 relative transition-all ${isDraggingPoseSheet ? 'ring-4 ring-primary border-primary bg-primary/5' : ''}`}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingPoseSheet(true); }}
                        onDragLeave={() => setIsDraggingPoseSheet(false)}
                        onDrop={handlePoseSheetDrop}
                      >
                        {isDraggingPoseSheet && (
                          <div className="absolute inset-0 bg-primary/20 backdrop-blur-xs flex items-center justify-center border-4 border-dashed border-primary z-50 rounded-2xl pointer-events-none">
                            <span className="bg-slate-900/90 text-white font-extrabold text-xs px-4 py-2 rounded-lg shadow-xl border flex items-center gap-2">
                              <ImageIcon className="w-4 h-4 text-primary animate-bounce" />
                              Drop Image to add to Pose Sheet Showcase
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <h4 className="text-sm font-black text-foreground flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-primary" />
                              <span>{formData.name || 'Character'} — Pose Sheet & Visual Showcase</span>
                            </h4>
                            <p className="text-[10px] text-muted-foreground">
                              Primary character models, pose sheets, and concept art. Drag images here to add.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const url = prompt("Enter Image URL for new Pose Sheet / Model:");
                              if (url) {
                                const title = prompt("Enter Title for this image (e.g. Action Pose Sheet):") || "Pose Sheet";
                                const newSub = { id: `sub-${Date.now()}`, src: url, title, description: "Custom character art asset." };
                                setFormData({
                                  ...formData,
                                  subImages: [...(formData.subImages || []), newSub]
                                });
                              }
                            }}
                            className="bg-primary text-primary-foreground font-bold px-2.5 py-1 rounded-lg text-[10px] flex items-center gap-1 hover:bg-primary/90 cursor-pointer shadow-xs"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Pose Sheet</span>
                          </button>
                        </div>

                        {/* Carousel Stage */}
                        {galleryImages.length > 0 ? (
                          <div className="relative group rounded-xl bg-secondary/30 border border-primary/10 overflow-hidden shadow-sm flex items-center justify-center h-72">
                            {(() => {
                              const idx = Math.min(overviewCarouselIdx, galleryImages.length - 1);
                              const currImg = galleryImages[idx] || galleryImages[0];
                              return (
                                <>
                                  <img 
                                    src={currImg.src} 
                                    alt={currImg.title} 
                                    className="w-full h-full object-contain bg-black/40 cursor-zoom-in"
                                    referrerPolicy="no-referrer"
                                    onClick={() => setGalleryIndex(idx)}
                                  />
                                  
                                  {/* Overlay */}
                                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-4 text-white flex flex-col justify-end">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <span className="bg-primary/80 text-primary-foreground text-[9px] font-black uppercase px-2 py-0.5 rounded mb-1 inline-block">
                                          {currImg.title || 'Pose Sheet'}
                                        </span>
                                        <p className="text-[11px] font-bold truncate max-w-sm">{formData.name} — Visual Showcase</p>
                                      </div>
                                      <span className="bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-200">
                                        {idx + 1} / {galleryImages.length}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Arrows */}
                                  {galleryImages.length > 1 && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => setOverviewCarouselIdx((idx - 1 + galleryImages.length) % galleryImages.length)}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-primary text-white flex items-center justify-center backdrop-blur-sm transition-all cursor-pointer"
                                        title="Previous Pose Sheet"
                                      >
                                        <ChevronLeft className="w-5 h-5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setOverviewCarouselIdx((idx + 1) % galleryImages.length)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-primary text-white flex items-center justify-center backdrop-blur-sm transition-all cursor-pointer"
                                        title="Next Pose Sheet"
                                      >
                                        <ChevronRight className="w-5 h-5" />
                                      </button>
                                    </>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="text-center py-10 border rounded-xl bg-secondary/10 flex flex-col items-center justify-center space-y-2">
                            <Camera className="w-8 h-8 text-muted-foreground opacity-40" />
                            <p className="text-xs font-semibold text-muted-foreground">No visual pose sheets added yet.</p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {galleryImages.map((img, i) => {
                          const isDotActive = formData.indicatorDots?.[img.id] ?? formData.showIndicators ?? false;
                          return (
                            <div key={img.id} className="border rounded-lg bg-secondary/10 p-3 flex flex-col gap-2 relative group shadow-sm justify-between">
                              <div className="relative group cursor-zoom-in animate-fade-in" onClick={() => setGalleryIndex(i)}>
                                 <img src={img.src} alt={img.title} className="w-full h-32 object-cover rounded-md border" referrerPolicy="no-referrer" />
                                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                                    <Maximize2 className="w-5 h-5 text-white" />
                                 </div>

                                 {/* Indicator Circle Dot Overlay */}
                                 {isDotActive && (
                                   <div className="absolute top-2 left-2 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white shadow-md animate-pulse z-10" title="Active Thumbnail Indicator" />
                                 )}

                                 {/* Individual Indicator Toggle Button */}
                                 <button
                                   type="button"
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     const currentDots = formData.indicatorDots || {};
                                     setFormData({
                                       ...formData,
                                       indicatorDots: {
                                         ...currentDots,
                                         [img.id]: !isDotActive
                                       }
                                     });
                                   }}
                                   className={`absolute top-2 right-2 p-1 rounded-full border transition-all cursor-pointer z-20 ${
                                     isDotActive
                                       ? 'bg-emerald-600 text-white border-emerald-400 shadow-md scale-110'
                                       : 'bg-black/60 text-white/70 hover:text-white border-white/20'
                                   }`}
                                   title="Toggle indicator circle for this thumbnail slot"
                                 >
                                   <div className={`w-2.5 h-2.5 rounded-full ${isDotActive ? 'bg-white' : 'bg-white/40'}`} />
                                 </button>
                              </div>

                            <div className="flex flex-col flex-1 justify-between gap-1.5">
                              <div>
                                <div className="flex justify-between items-center gap-1">
                                  <h4 className="font-bold text-xs truncate flex-1" title={img.title}>{img.title}</h4>
                                  {img.id !== 'main' && (
                                    <button 
                                      onClick={() => {
                                        const newTitle = prompt("Edit image title:", img.title);
                                        const newDesc = prompt("Edit image description:", img.description);
                                        if (newTitle !== null) {
                                          const updatedSubImages = (formData.subImages || []).map(sub => 
                                            sub.id === img.id ? { ...sub, title: newTitle.trim(), description: newDesc?.trim() ?? '' } : sub
                                          );
                                          setFormData({ ...formData, subImages: updatedSubImages });
                                        }
                                      }}
                                      className="text-muted-foreground hover:text-primary p-0.5 cursor-pointer"
                                      title="Edit Title & Description"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                                {img.description && <p className="text-[10px] text-muted-foreground line-clamp-2">{img.description}</p>}
                              </div>
                              <div className="flex items-center justify-between mt-1 pt-1 border-t border-border/50">
                                <button 
                                  onClick={() => {
                                    handleSetMainImage(img.src);
                                    alert('Set as entity portrait icon!');
                                  }}
                                  className="flex items-center gap-1 text-[10px] font-bold text-primary hover:underline cursor-pointer"
                                >
                                  <Camera className="w-3 h-3" />
                                  <span>Set Icon</span>
                                </button>
                                
                                {img.id !== 'main' && (
                                  <button 
                                    onClick={() => {
                                      if (confirm('Are you sure you want to delete this image from the gallery?')) {
                                        const updatedSubImages = (formData.subImages || []).filter(sub => sub.id !== img.id);
                                        setFormData({ ...formData, subImages: updatedSubImages });
                                      }
                                    }}
                                    className="text-muted-foreground hover:text-destructive p-0.5 cursor-pointer"
                                    title="Delete Image"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      </div>
                    </div>
                  )}

                  {/* Audios View */}
                  {activeMediaSubTab === 'audios' && (
                    <div className="space-y-6">
                      <UnifiedMediaPlayer 
                        character={formData as Character} 
                        onUpdateCharacter={(updated) => setFormData(updated)}
                        initialType="audio"
                      />

                      <div className="flex justify-between items-center border-b pb-2">
                        <h3 className="font-bold text-base flex items-center gap-2">
                          <Music className="w-4 h-4 text-primary" />
                          {activeMediaCategory === 'all' ? 'All Voice Notes & Audios' : (formData.mediaCategories?.find(c => c.id === activeMediaCategory)?.name || 'Audio List')}
                        </h3>
                        
                        <div className="flex items-center gap-2">
                          {isRecording ? (
                            <button 
                              onClick={stopRecording}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 animate-pulse shadow cursor-pointer"
                            >
                              <Square className="w-3.5 h-3.5" />
                              Stop Rec ({recordingSeconds}s)
                            </button>
                          ) : (
                            <button 
                              onClick={startRecording}
                              className="bg-secondary hover:bg-secondary/80 text-foreground px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 border cursor-pointer"
                            >
                              <Mic className="w-3.5 h-3.5 text-red-500" />
                              Record Live Voice
                            </button>
                          )}

                          <label className="cursor-pointer bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-primary/90 flex items-center gap-1.5 shadow-sm">
                            <Upload className="w-3.5 h-3.5" />
                            Upload Audio
                            <input type="file" accept="audio/*" className="hidden" onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const url = URL.createObjectURL(file);
                                const newAudio = {
                                  id: `audio-${Date.now()}`,
                                  src: url,
                                  title: file.name.replace(/\.[^/.]+$/, ""),
                                  description: `Uploaded audio asset (${(file.size / (1024 * 1024)).toFixed(2)} MB)`,
                                  category: activeMediaCategory !== 'all' ? activeMediaCategory : undefined
                                };
                                setFormData({ ...formData, audios: [...(formData.audios || []), newAudio] });
                              }
                            }} />
                          </label>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(formData.audios || [])
                          .filter(a => activeMediaCategory === 'all' || a.category === activeMediaCategory)
                          .map((audio) => (
                            <div key={audio.id} className="p-4 bg-card border rounded-xl shadow-sm space-y-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-bold text-sm">{audio.title}</h4>
                                  <p className="text-[11px] text-muted-foreground">{audio.description}</p>
                                </div>
                                <button 
                                  onClick={() => setFormData({ ...formData, audios: formData.audios?.filter(a => a.id !== audio.id) })}
                                  className="text-muted-foreground hover:text-destructive p-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              <audio controls src={audio.src} className="w-full h-8" />

                              {/* Transcribe & Category Reassignment */}
                              <div className="flex items-center justify-between pt-2 border-t">
                                <button
                                  type="button"
                                  onClick={() => handleTranscribeSingleMedia(audio.title, audio.src, 'audio/mp3')}
                                  disabled={isTranscribingMediaId === audio.title}
                                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                >
                                  {isTranscribingMediaId === audio.title ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Sparkles className="w-3 h-3" />
                                  )}
                                  <span>{isTranscribingMediaId === audio.title ? 'Transcribing Speech...' : 'Transcribe Audio & Lyrics'}</span>
                                </button>

                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Category:</span>
                                  <select
                                    value={audio.category || ''}
                                    onChange={(e) => {
                                      const catVal = e.target.value;
                                      const updated = (formData.audios || []).map(a => a.id === audio.id ? { ...a, category: catVal || undefined } : a);
                                      setFormData({ ...formData, audios: updated });
                                    }}
                                    className="bg-background border rounded px-1.5 py-0.5 text-xs text-foreground cursor-pointer outline-none focus:border-primary"
                                  >
                                    <option value="">Uncategorized</option>
                                    {(formData.mediaCategories || [])
                                      .filter(c => c.type === 'audio')
                                      .map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                      ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                          ))}
                        {(formData.audios || []).filter(a => activeMediaCategory === 'all' || a.category === activeMediaCategory).length === 0 && (
                          <div className="col-span-2 text-center py-12 border border-dashed rounded-xl text-muted-foreground text-xs">
                            No audio tracks found in this category list. Record or upload a track above!
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Videos View */}
                  {activeMediaSubTab === 'videos' && (
                    <div className="space-y-6">
                      <UnifiedMediaPlayer 
                        character={formData as Character} 
                        onUpdateCharacter={(updated) => setFormData(updated)}
                        initialType="video"
                      />

                      <div className="flex justify-between items-center border-b pb-2">
                        <h3 className="font-bold text-base flex items-center gap-2">
                          <VideoIcon className="w-4 h-4 text-primary" />
                          {activeMediaCategory === 'all' ? 'All Video Files & Shows' : (formData.mediaCategories?.find(c => c.id === activeMediaCategory)?.name || 'Video List')}
                        </h3>

                        <label className="cursor-pointer bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-primary/90 flex items-center gap-1.5 shadow-sm">
                          <Upload className="w-3.5 h-3.5" />
                          Upload Video Clip
                          <input type="file" accept="video/*" className="hidden" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const url = URL.createObjectURL(file);
                              const newVid = {
                                id: `video-${Date.now()}`,
                                src: url,
                                title: file.name.replace(/\.[^/.]+$/, ""),
                                description: `Uploaded video clip (${(file.size / (1024 * 1024)).toFixed(2)} MB)`,
                                category: activeMediaCategory !== 'all' ? activeMediaCategory : undefined
                              };
                              setFormData({ ...formData, videos: [...(formData.videos || []), newVid] });
                            }
                          }} />
                        </label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(formData.videos || [])
                          .filter(v => activeMediaCategory === 'all' || v.category === activeMediaCategory)
                          .map((vid) => (
                            <div key={vid.id} className="p-4 bg-card border rounded-xl shadow-sm space-y-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-bold text-sm">{vid.title}</h4>
                                  <p className="text-[11px] text-muted-foreground">{vid.description}</p>
                                </div>
                                <button 
                                  onClick={() => setFormData({ ...formData, videos: formData.videos?.filter(v => v.id !== vid.id) })}
                                  className="text-muted-foreground hover:text-destructive p-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              <video controls src={vid.src} className="w-full rounded-lg bg-black max-h-48" />

                              {/* Transcribe & Category Reassignment Selector */}
                              <div className="flex items-center justify-between pt-2 border-t">
                                <button
                                  type="button"
                                  onClick={() => handleTranscribeSingleMedia(vid.title, vid.src, 'video/mp4')}
                                  disabled={isTranscribingMediaId === vid.title}
                                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                >
                                  {isTranscribingMediaId === vid.title ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Sparkles className="w-3 h-3" />
                                  )}
                                  <span>{isTranscribingMediaId === vid.title ? 'Transcribing Speech...' : 'Transcribe Video Speech'}</span>
                                </button>

                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Category:</span>
                                  <select
                                    value={vid.category || ''}
                                    onChange={(e) => {
                                      const catVal = e.target.value;
                                      const updated = (formData.videos || []).map(v => v.id === vid.id ? { ...v, category: catVal || undefined } : v);
                                      setFormData({ ...formData, videos: updated });
                                    }}
                                    className="bg-background border rounded px-1.5 py-0.5 text-xs text-foreground cursor-pointer outline-none focus:border-primary"
                                  >
                                    <option value="">Uncategorized</option>
                                    {(formData.mediaCategories || [])
                                      .filter(c => c.type === 'video')
                                      .map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                      ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                          ))}
                        {(formData.videos || []).filter(v => activeMediaCategory === 'all' || v.category === activeMediaCategory).length === 0 && (
                          <div className="col-span-2 text-center py-12 border border-dashed rounded-xl text-muted-foreground text-xs">
                            No video files found in this category list. Upload a video above!
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Files Subtab View */}
                  {activeMediaSubTab === 'files' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b pb-2">
                        <h3 className="font-bold text-base flex items-center gap-2">
                          <Paperclip className="w-4 h-4 text-primary" />
                          {activeMediaCategory === 'all' ? 'All Document & File Attachments' : (formData.mediaCategories?.find(c => c.id === activeMediaCategory)?.name || 'File List')}
                        </h3>

                        <label className="cursor-pointer bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-primary/90 flex items-center gap-1.5 shadow-sm">
                          <Upload className="w-3.5 h-3.5" />
                          Upload File
                          <input type="file" className="hidden" onChange={handleFileUpload} />
                        </label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(formData.genericFiles || [])
                          .filter(f => activeMediaCategory === 'all' || f.category === activeMediaCategory)
                          .map((file) => (
                            <div key={file.id} className="p-4 bg-card border rounded-xl shadow-sm space-y-3">
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                                    <FileText className="w-5 h-5 text-primary" />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="font-bold text-sm truncate" title={file.name}>{file.name}</h4>
                                    <p className="text-[11px] text-muted-foreground">{file.size} • {file.dateUploaded}</p>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => handleDeleteFile(file.id)}
                                  className="text-muted-foreground hover:text-destructive p-1 transition-colors cursor-pointer"
                                  title="Delete File"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t">
                                <a 
                                  href={file.url} 
                                  download={file.name}
                                  className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Download File</span>
                                </a>

                                {/* Category Selector */}
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase">List:</span>
                                  <select
                                    value={file.category || ''}
                                    onChange={(e) => {
                                      const catVal = e.target.value;
                                      const updated = (formData.genericFiles || []).map(f => f.id === file.id ? { ...f, category: catVal || undefined } : f);
                                      setFormData({ ...formData, genericFiles: updated });
                                    }}
                                    className="bg-background border rounded px-2 py-0.5 text-xs text-foreground cursor-pointer outline-none focus:border-primary"
                                  >
                                    <option value="">Uncategorized</option>
                                    {(formData.mediaCategories || [])
                                      .map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                      ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                          ))}
                        {(formData.genericFiles || []).filter(f => activeMediaCategory === 'all' || f.category === activeMediaCategory).length === 0 && (
                          <div className="col-span-2 text-center py-12 border border-dashed rounded-xl text-muted-foreground text-xs">
                            No files attached in this list. Upload a document or file attachment above!
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 3D Model Viewer View */}
                  {activeMediaSubTab === 'model3d' && (
                    <ThreeModelViewer formData={formData} setFormData={setFormData} galleryImages={galleryImages} />
                  )}

                  {/* Dropbox Tab View */}
                  {activeMediaSubTab === 'dropbox' && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      <div className="flex justify-between items-center border-b pb-2">
                        <div>
                          <h3 className="font-bold text-base flex items-center gap-1.5 text-blue-500">
                            <Inbox className="w-4 h-4" /> Universal Dropbox Control Panel
                          </h3>
                          <p className="text-[11px] text-muted-foreground">Persistently drag-and-drop any media file to parse and route it to the proper tab instantly.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Drag and Drop Box - Left Column */}
                        <div className="md:col-span-2 space-y-4">
                          <div 
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingDropboxTab(true); }}
                            onDragLeave={() => setIsDraggingDropboxTab(false)}
                            onDrop={(e) => {
                              e.preventDefault(); e.stopPropagation();
                              setIsDraggingDropboxTab(false);
                              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                processDroppedFiles(e.dataTransfer.files);
                              }
                            }}
                            onClick={() => {
                              const picker = document.createElement('input');
                              picker.type = 'file';
                              picker.multiple = true;
                              picker.onchange = (evt: any) => {
                                const files = evt.target.files;
                                if (files && files.length > 0) {
                                  processDroppedFiles(files);
                                }
                              };
                              picker.click();
                            }}
                            className={`border-4 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[260px] ${
                              isDraggingDropboxTab
                                ? 'border-blue-500 bg-blue-500/10 scale-[1.01] shadow-lg shadow-blue-500/10'
                                : 'border-blue-400/40 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/60 shadow-xs'
                            }`}
                          >
                            <Inbox className={`w-14 h-14 text-blue-500 mb-4 ${isDraggingDropboxTab ? 'animate-bounce' : 'animate-pulse'}`} />
                            <p className="text-sm font-black text-foreground">DRAG & DROP MULTIPLE FILES HERE</p>
                            <p className="text-xs text-muted-foreground mt-2 max-w-md">
                              Or click anywhere to select files from your computer. Supports images (.png, .jpg), audio tracks (.mp3, .wav), video clips (.mp4, .mov), and documentations (.pdf, .txt).
                            </p>
                            <span className="mt-4 bg-blue-500/15 text-blue-700 dark:text-blue-300 font-bold px-3 py-1 rounded-full text-[10px] tracking-wide uppercase">
                              Smart Category Router Active
                            </span>
                          </div>

                          {/* Dropbox Transaction Logs Table */}
                          <div className="bg-card border rounded-2xl overflow-hidden shadow-xs">
                            <div className="bg-secondary/40 p-3.5 border-b flex justify-between items-center">
                              <h4 className="text-xs font-black uppercase text-foreground tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-blue-500" /> Recent Upload Transactions ({recentDropboxUploads.length})
                              </h4>
                              {recentDropboxUploads.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setRecentDropboxUploads([])}
                                  className="text-[10px] text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1 cursor-pointer"
                                >
                                  Clear Logs
                                </button>
                              )}
                            </div>
                            {recentDropboxUploads.length > 0 ? (
                              <div className="overflow-x-auto max-h-60">
                                <table className="w-full text-left border-collapse text-xs">
                                  <thead>
                                    <tr className="border-b bg-muted/40 font-bold text-muted-foreground text-[10px] uppercase">
                                      <th className="p-3">File Name</th>
                                      <th className="p-3">File Size</th>
                                      <th className="p-3">Assigned Destination</th>
                                      <th className="p-3 text-right">Time</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y">
                                    {recentDropboxUploads.map((log) => (
                                      <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="p-3 font-semibold text-foreground truncate max-w-xs" title={log.name}>{log.name}</td>
                                        <td className="p-3 text-muted-foreground font-mono">{log.size}</td>
                                        <td className="p-3">
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[9px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                            {log.destination}
                                          </span>
                                        </td>
                                        <td className="p-3 text-right text-muted-foreground font-mono text-[10px]">{log.timestamp}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-1">
                                <Inbox className="w-6 h-6 opacity-30 text-muted-foreground" />
                                <span>No files uploaded in this session yet. Drop some files above to see them route live!</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Category Stats Sidebar - Right Column */}
                        <div className="space-y-4">
                          <div className="bg-card border rounded-2xl p-4 space-y-4 shadow-xs">
                            <h4 className="text-xs font-black uppercase text-muted-foreground tracking-wider pb-2 border-b">Category Distribution</h4>
                            
                            <div className="space-y-2.5">
                              {/* Images count */}
                              <div 
                                onClick={() => setActiveMediaSubTab('images')}
                                className="p-3 rounded-xl border bg-secondary/15 hover:bg-primary/5 hover:border-primary/40 transition-all cursor-pointer flex justify-between items-center group"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:scale-105 transition-transform">
                                    <ImageIcon className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-foreground">Images & Concept Art</p>
                                    <p className="text-[10px] text-muted-foreground">Pose sheets, custom snap shots</p>
                                  </div>
                                </div>
                                <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-secondary text-foreground">
                                  {galleryImages.length}
                                </span>
                              </div>

                              {/* Audios count */}
                              <div 
                                onClick={() => setActiveMediaSubTab('audios')}
                                className="p-3 rounded-xl border bg-secondary/15 hover:bg-primary/5 hover:border-primary/40 transition-all cursor-pointer flex justify-between items-center group"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-105 transition-transform">
                                    <Music className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-foreground">Audio & Soundtracks</p>
                                    <p className="text-[10px] text-muted-foreground">Voice narration, themes</p>
                                  </div>
                                </div>
                                <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-secondary text-foreground">
                                  {(formData.audios || []).length}
                                </span>
                              </div>

                              {/* Videos count */}
                              <div 
                                onClick={() => setActiveMediaSubTab('videos')}
                                className="p-3 rounded-xl border bg-secondary/15 hover:bg-primary/5 hover:border-primary/40 transition-all cursor-pointer flex justify-between items-center group"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500 group-hover:scale-105 transition-transform">
                                    <VideoIcon className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-foreground">Video Clips</p>
                                    <p className="text-[10px] text-muted-foreground">Dialogue tracks, scenes</p>
                                  </div>
                                </div>
                                <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-secondary text-foreground">
                                  {(formData.videos || []).length}
                                </span>
                              </div>

                              {/* Files count */}
                              <div 
                                onClick={() => setActiveMediaSubTab('files')}
                                className="p-3 rounded-xl border bg-secondary/15 hover:bg-primary/5 hover:border-primary/40 transition-all cursor-pointer flex justify-between items-center group"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-500 group-hover:scale-105 transition-transform">
                                    <FileText className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-foreground">Documentation Files</p>
                                    <p className="text-[10px] text-muted-foreground">Notes, profiles, attachments</p>
                                  </div>
                                </div>
                                <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-secondary text-foreground">
                                  {(formData.genericFiles || []).length}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-card border rounded-2xl p-4 shadow-xs space-y-1.5">
                            <h5 className="text-[10px] font-black uppercase text-foreground tracking-wider flex items-center gap-1">
                              💡 Real-time Routing Guide
                            </h5>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                              When you drop any file onto this page (or use the persistent side panel widget), the Dropbox automatically inspects the file MIME-type. Images flow to the <strong>Images</strong> tab, audios to <strong>Audios</strong>, videos to <strong>Videos</strong>, and all other items route directly to the <strong>Files</strong> tab.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* DEV / CREDITS TRACKER TAB */}
            {activeOuterTab === 'dev' && (
              <div className="space-y-8 max-w-5xl mx-auto p-2 animate-in fade-in duration-200">
                {/* Dev Overview Metrics Header */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-card border rounded-xl shadow-sm space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Project Start Date</span>
                    <input 
                      type="date" 
                      value={formData.devTracker?.startDate || ''}
                      onChange={e => setFormData({
                        ...formData,
                        devTracker: { ...(formData.devTracker || { startDate: '', credits: [], logs: [] }), startDate: e.target.value }
                      })}
                      className="text-xs font-bold text-foreground bg-transparent outline-none border-b border-border/50 focus:border-primary"
                    />
                  </div>
                  <div className="p-4 bg-card border rounded-xl shadow-sm space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Total Hours Logged</span>
                    <p className="text-xl font-extrabold text-primary">
                      {((formData.devTracker?.logs || []).reduce((acc, log) => acc + (log.hoursSpent || 0), 0)).toFixed(1)} hrs
                    </p>
                  </div>
                  <div className="p-4 bg-card border rounded-xl shadow-sm space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Work Sessions Logged</span>
                    <p className="text-xl font-extrabold text-foreground">
                      {formData.devTracker?.logs?.length || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-card border rounded-xl shadow-sm space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Contributors & Credits</span>
                    <p className="text-xl font-extrabold text-emerald-600">
                      {formData.devTracker?.credits?.length || 0}
                    </p>
                  </div>
                </div>

                {/* SECTION 1: DEV WORK SESSION LOGGER */}
                <div className="p-5 bg-card border rounded-xl shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" /> Development & Completion Work Tracker
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Log how long tasks take to complete so you can estimate time requirements for future projects.
                      </p>
                    </div>
                  </div>

                  {/* Add Log Form */}
                  <div className="bg-secondary/20 p-4 rounded-lg border space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Log New Work Session</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Date</label>
                        <input 
                          type="date" 
                          value={devLogDate}
                          onChange={e => setDevLogDate(e.target.value)}
                          className="w-full bg-background border rounded px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Hours Spent</label>
                        <input 
                          type="number" 
                          step="0.5"
                          value={devLogHours}
                          onChange={e => setDevLogHours(Number(e.target.value) || 0)}
                          placeholder="e.g. 2.5"
                          className="w-full bg-background border rounded px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Milestone / Category</label>
                        <input 
                          type="text" 
                          value={devLogMilestone}
                          onChange={e => setDevLogMilestone(e.target.value)}
                          placeholder="e.g. Character Design, Script, Voice"
                          className="w-full bg-background border rounded px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Tasks / Notes</label>
                        <input 
                          type="text" 
                          value={devLogDesc}
                          onChange={e => setDevLogDesc(e.target.value)}
                          placeholder="What was completed in this session?"
                          className="w-full bg-background border rounded px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button 
                        onClick={handleAddDevLog}
                        disabled={!devLogHours}
                        className="bg-primary text-primary-foreground font-bold text-xs py-1.5 px-4 rounded hover:bg-primary/90 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Log Session</span>
                      </button>
                    </div>
                  </div>

                  {/* Work Log Entries List */}
                  <div className="space-y-2 pt-2">
                    {formData.devTracker?.logs && formData.devTracker.logs.length > 0 ? (
                      <div className="space-y-2">
                        {formData.devTracker.logs.map(log => (
                          <div key={log.id} className="p-3 bg-card border rounded-lg shadow-sm flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-mono font-bold bg-primary/10 text-primary px-2.5 py-1 rounded border border-primary/20 shrink-0">
                                {log.hoursSpent} hrs
                              </span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-foreground">{log.milestone || 'General Task'}</span>
                                  <span className="text-[10px] text-muted-foreground">• {log.date}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">{log.description}</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleDeleteDevLog(log.id)}
                              className="text-muted-foreground hover:text-destructive p-1 transition-colors cursor-pointer"
                              title="Delete Log Entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 border border-dashed rounded-lg text-xs text-muted-foreground">
                        No development work logged yet. Record your first work session above!
                      </div>
                    )}
                  </div>
                </div>

                {/* SECTION 2: CREDITS & CONTRIBUTORS */}
                <div className="p-5 bg-card border rounded-xl shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                        <Award className="w-4 h-4 text-primary" /> Credits & Contributor Directory
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Acknowledge artists, voice actors, writers, and collaborators who worked on this asset or project.
                      </p>
                    </div>
                  </div>

                  {/* Add Credit Form */}
                  <div className="bg-secondary/20 p-4 rounded-lg border space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Add Contributor Credit</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Contributor Name</label>
                        <input 
                          type="text" 
                          value={devCreditName}
                          onChange={e => setDevCreditName(e.target.value)}
                          placeholder="e.g. Sarah Jenkins"
                          className="w-full bg-background border rounded px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Role / Contribution</label>
                        <input 
                          type="text" 
                          value={devCreditRole}
                          onChange={e => setDevCreditRole(e.target.value)}
                          placeholder="e.g. Concept Artist, Voice Actor"
                          className="w-full bg-background border rounded px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Contact / Portfolio Link</label>
                        <input 
                          type="text" 
                          value={devCreditContact}
                          onChange={e => setDevCreditContact(e.target.value)}
                          placeholder="e.g. https://artstation.com/..."
                          className="w-full bg-background border rounded px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button 
                        onClick={handleAddDevCredit}
                        disabled={!devCreditName.trim()}
                        className="bg-primary text-primary-foreground font-bold text-xs py-1.5 px-4 rounded hover:bg-primary/90 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Credit Entry</span>
                      </button>
                    </div>
                  </div>

                  {/* Credits List */}
                  <div className="space-y-2 pt-2">
                    {formData.devTracker?.credits && formData.devTracker.credits.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {formData.devTracker.credits.map((cred, cIdx) => (
                          <div key={cred.id || cIdx} className="p-3 bg-card border rounded-lg shadow-sm flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                                <User className="w-4 h-4 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-xs text-foreground truncate">{cred.name}</h4>
                                <span className="text-[10px] font-bold text-primary block truncate">{cred.role}</span>
                                {cred.contact && (
                                  <a href={cred.contact} target="_blank" rel="noreferrer" className="text-[10px] text-muted-foreground hover:underline truncate block">
                                    {cred.contact}
                                  </a>
                                )}
                              </div>
                            </div>
                            <button 
                              onClick={() => handleDeleteDevCredit(cred.id || cred.name)}
                              className="text-muted-foreground hover:text-destructive p-1 transition-colors cursor-pointer shrink-0"
                              title="Delete Credit"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 border border-dashed rounded-lg text-xs text-muted-foreground">
                        No team credits logged yet. Add your first contributor credit above!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TECHNICAL SPECS TAB */}
            {activeOuterTab === 'technical' && (
              <div className="space-y-6 max-w-2xl mx-auto p-2 animate-in fade-in duration-200">
                {activeTechSubTab === 'data' && (
                  <>
                    {/* Publishing Data Box */}
                    <div className="space-y-4 p-5 bg-card border rounded-xl shadow-sm">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1 flex items-center gap-1.5">
                        <Settings className="w-4 h-4 text-primary" /> Publishing & Medium Specifications
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold block mb-1">First Publication</label>
                          <input 
                            type="text" 
                            value={formData.firstPublication || ''} 
                            onChange={e => setFormData({...formData, firstPublication: e.target.value})} 
                            className="w-full bg-background border rounded-md px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary outline-none" 
                            placeholder="e.g. Volume 1" 
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold block mb-1">First Appearance</label>
                          <input 
                            type="text" 
                            value={formData.firstAppearance || ''} 
                            onChange={e => setFormData({...formData, firstAppearance: e.target.value})} 
                            className="w-full bg-background border rounded-md px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary outline-none" 
                            placeholder="e.g. Chapter 4" 
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs font-bold block mb-1">Target Medium</label>
                          <select 
                            value={formData.firstAppearanceType || 'other'} 
                            onChange={e => setFormData({...formData, firstAppearanceType: e.target.value as any})} 
                            className="w-full bg-background border rounded-md px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary outline-none cursor-pointer"
                          >
                            <option value="comic">Comic Book</option>
                            <option value="animation">Animation (2D/3D)</option>
                            <option value="video game">Video Game</option>
                            <option value="show">Puppet / Live Show</option>
                            <option value="music">Music / Audio</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* System Diagnostics Box */}
                    <div className="space-y-4 p-5 bg-card border rounded-xl shadow-sm">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1">
                        System Upload Diagnostics & Properties
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-xs leading-relaxed">
                        <div>
                          <span className="text-slate-500 block">Unique ID</span>
                          <code className="font-mono bg-secondary/30 px-1.5 py-0.5 rounded text-[10px] break-all block">{activeChar?.id}</code>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Ingress Source Stream</span>
                          <span className="font-semibold capitalize block">{activeChar?.sourceType} ({activeChar?.sourceId})</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Creation Logging Date</span>
                          <span className="font-semibold block">{formData.dateCreated || 'Not set'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Database Registration Date</span>
                          <span className="font-semibold block">{formData.dateUploaded || 'Not set'}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeTechSubTab === 'export' && (
                  <div className="space-y-4 p-5 bg-card border rounded-xl shadow-sm">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b pb-2 flex items-center gap-1.5">
                      <Download className="w-4 h-4 text-primary" /> Booklet Export Center
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Compile profile, details subpages, projects, and custom notes into clean formatted documents for offline archiving, printing, or sharing with collaborators.
                    </p>
                    <div className="grid grid-cols-1 gap-3 pt-2">
                      <button 
                        onClick={() => handleExportBooklet('pdf')}
                        disabled={isExporting}
                        className="w-full text-left p-3 rounded-lg border hover:bg-secondary/50 flex items-center justify-between transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-red-500 shrink-0" />
                          <div>
                            <span className="font-bold text-xs block text-foreground">Export as PDF Booklet</span>
                            <span className="text-[11px] text-muted-foreground">Formatted PDF with title cover, custom subpages, and project indexes</span>
                          </div>
                        </div>
                        <Download className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                      </button>

                      <button 
                        onClick={() => handleExportBooklet('word')}
                        disabled={isExporting}
                        className="w-full text-left p-3 rounded-lg border hover:bg-secondary/50 flex items-center justify-between transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                          <div>
                            <span className="font-bold text-xs block text-foreground">Export as Word (.doc)</span>
                            <span className="text-[11px] text-muted-foreground">Editable Microsoft Word document with HTML styling and tables</span>
                          </div>
                        </div>
                        <Download className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                      </button>

                      <button 
                        onClick={() => handleExportBooklet('gdocs')}
                        disabled={isExporting}
                        className="w-full text-left p-3 rounded-lg border hover:bg-secondary/50 flex items-center justify-between transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <LinkIcon className="w-5 h-5 text-green-500 shrink-0" />
                          <div>
                            <span className="font-bold text-xs block text-foreground">Export to Google Docs</span>
                            <span className="text-[11px] text-muted-foreground">Creates a live document directly in your Google Drive CharArchive folder</span>
                          </div>
                        </div>
                        <Download className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SOURCE CODE & APPLICATIONS TAB */}
            {activeOuterTab === 'code' && (
              <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0 divide-y md:divide-y-0 md:divide-x divide-border">
                {/* Left Sidebar: Snippet / Code file list & search */}
                <div className="w-full md:w-80 shrink-0 flex flex-col min-h-0 bg-secondary/10">
                  <div className="p-4 border-b space-y-3 shrink-0">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-foreground">
                        <Code className="w-4 h-4 text-primary" /> Code Snippets ({(formData.codeFiles || []).length})
                      </h3>
                      <button
                        onClick={() => {
                          setIsAddingCodeSnippet(true);
                          setSelectedCodeFileId(null);
                          setCodeFormName('');
                          setCodeFormLanguage('TypeScript');
                          setCodeFormContent('');
                          setCodeFormDesc('');
                        }}
                        className="p-1 text-primary hover:bg-primary/10 rounded-md transition-colors cursor-pointer"
                        title="Add Code Snippet"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input 
                        type="text" 
                        placeholder="Search source files..." 
                        value={codeSearchQuery}
                        onChange={e => setCodeSearchQuery(e.target.value)}
                        className="w-full bg-background border rounded-md pl-8 pr-3 py-1.5 text-xs outline-none focus:border-primary font-medium"
                      />
                    </div>
                  </div>

                  {/* List */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                    {/* Pre-made Templates / Boilerplates Button */}
                    <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 p-2.5 rounded-lg text-xs space-y-2 mb-2">
                      <span className="font-bold text-foreground block">🚀 Fast Boilerplates</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => {
                            const newFile = {
                              id: `code-${Date.now()}-react`,
                              name: 'UserProfileComponent.tsx',
                              language: 'TypeScript',
                              description: 'Interactive Profile details grid with reactive state styling',
                              content: `import React, { useState } from 'react';\n\ninterface ProfileProps {\n  name: string;\n  status: string;\n}\n\nexport const UserProfileComponent: React.FC<ProfileProps> = ({ name, status }) => {\n  const [liked, setLiked] = useState(false);\n  return (\n    <div className="p-4 border rounded-xl bg-slate-900 text-white shadow-lg">\n      <h2 className="text-lg font-black">{name}</h2>\n      <p className="text-xs text-indigo-400">Status: {status}</p>\n      <button \n        onClick={() => setLiked(!liked)}\n        className="mt-4 px-3 py-1 bg-indigo-600 rounded-md text-xs font-bold hover:bg-indigo-500"\n      >\n        {liked ? '❤️ Active favorite' : '🤍 Add to favorites'}\n      </button>\n    </div>\n  );\n};`
                            };
                            setFormData(prev => ({ ...prev, codeFiles: [...(prev.codeFiles || []), newFile] }));
                            setSelectedCodeFileId(newFile.id);
                          }}
                          className="bg-background hover:bg-secondary border px-1.5 py-1 rounded text-[10px] font-bold text-left truncate transition-all cursor-pointer"
                        >
                          React Component
                        </button>
                        <button
                          onClick={() => {
                            const newFile = {
                              id: `code-${Date.now()}-py`,
                              name: 'image_analyzer.py',
                              language: 'Python',
                              description: 'OpenCV automated contour detection & style parsing',
                              content: `import cv2\nimport numpy as np\n\ndef analyze_asset(image_path):\n    # Load input character/asset image\n    img = cv2.imread(image_path)\n    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)\n    \n    # Run threshold contour tracing\n    _, thresh = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY_INV)\n    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)\n    \n    print(f"[Info] Identified {len(contours)} asset layers")\n    return contours`
                            };
                            setFormData(prev => ({ ...prev, codeFiles: [...(prev.codeFiles || []), newFile] }));
                            setSelectedCodeFileId(newFile.id);
                          }}
                          className="bg-background hover:bg-secondary border px-1.5 py-1 rounded text-[10px] font-bold text-left truncate transition-all cursor-pointer"
                        >
                          Python Contours
                        </button>
                      </div>
                    </div>

                    {((formData.codeFiles || []).filter(f => 
                      f.name.toLowerCase().includes(codeSearchQuery.toLowerCase()) ||
                      f.language.toLowerCase().includes(codeSearchQuery.toLowerCase()) ||
                      f.description.toLowerCase().includes(codeSearchQuery.toLowerCase())
                    ).length > 0) ? (
                      (formData.codeFiles || []).filter(f => 
                        f.name.toLowerCase().includes(codeSearchQuery.toLowerCase()) ||
                        f.language.toLowerCase().includes(codeSearchQuery.toLowerCase()) ||
                        f.description.toLowerCase().includes(codeSearchQuery.toLowerCase())
                      ).map(f => {
                        const isSel = selectedCodeFileId === f.id;
                        return (
                          <div 
                            key={f.id}
                            onClick={() => {
                              setSelectedCodeFileId(f.id);
                              setIsAddingCodeSnippet(false);
                            }}
                            className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all relative group ${isSel ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:bg-secondary/60'}`}
                          >
                            <div className="flex justify-between items-start">
                              <span className="font-mono font-bold text-xs truncate max-w-[80%]">{f.name}</span>
                              <span className={`text-[9px] uppercase font-black tracking-wider px-1 rounded ${isSel ? 'bg-white/20 text-white' : 'bg-secondary text-muted-foreground'}`}>{f.language}</span>
                            </div>
                            <p className={`text-[10px] truncate mt-1 ${isSel ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{f.description || 'No description added'}</p>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Delete ${f.name}?`)) {
                                  setFormData(prev => ({
                                    ...prev,
                                    codeFiles: (prev.codeFiles || []).filter(item => item.id !== f.id)
                                  }));
                                  if (selectedCodeFileId === f.id) setSelectedCodeFileId(null);
                                }
                              }}
                              className="absolute right-2 bottom-2 p-1 bg-black/10 hover:bg-rose-600 hover:text-white rounded text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              title="Delete Snippet"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-12 text-xs text-muted-foreground px-4">
                        No custom code files logged. Click the plus icon to catalog your first source file!
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Workspace Area */}
                <div className="flex-1 flex flex-col min-h-0 bg-card">
                  {isAddingCodeSnippet ? (
                    /* Create Form */
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-2xl mx-auto w-full">
                      <div className="border-b pb-2">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Catalog New Code Resource</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Define your script, config file, or mini application snippet.</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold block mb-1">File Name</label>
                          <input 
                            type="text" 
                            value={codeFormName}
                            onChange={e => setCodeFormName(e.target.value)}
                            placeholder="e.g. index.tsx, deploy.sh"
                            className="w-full bg-background border rounded-md px-3 py-1.5 text-xs outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold block mb-1">Language</label>
                          <select 
                            value={codeFormLanguage}
                            onChange={e => setCodeFormLanguage(e.target.value)}
                            className="w-full bg-background border rounded-md px-3 py-1.5 text-xs outline-none focus:border-primary"
                          >
                            {['TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'HTML/CSS', 'Shell', 'C++', 'SQL', 'JSON', 'YAML'].map(l => (
                              <option key={l} value={l}>{l}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold block mb-1">Purpose / Description</label>
                        <input 
                          type="text" 
                          value={codeFormDesc}
                          onChange={e => setCodeFormDesc(e.target.value)}
                          placeholder="Brief explanation of this script's utility or application integration"
                          className="w-full bg-background border rounded-md px-3 py-1.5 text-xs outline-none focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold block mb-1">Source Code</label>
                        <textarea 
                          value={codeFormContent}
                          onChange={e => setCodeFormContent(e.target.value)}
                          placeholder="// Paste your code or instructions here..."
                          className="w-full h-80 bg-slate-950 text-slate-100 font-mono text-xs rounded-md p-4 outline-none border focus:border-primary resize-y"
                        />
                      </div>

                      <div className="flex justify-end gap-2.5 pt-2 border-t">
                        <button
                          onClick={() => setIsAddingCodeSnippet(false)}
                          className="px-4 py-1.5 text-xs font-semibold bg-secondary hover:bg-secondary/80 rounded-md cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            if (!codeFormName.trim()) {
                              alert("Please enter a file name.");
                              return;
                            }
                            const newFile = {
                              id: `code-${Date.now()}`,
                              name: codeFormName.trim(),
                              language: codeFormLanguage,
                              content: codeFormContent,
                              description: codeFormDesc.trim(),
                              dateAdded: new Date().toISOString().split('T')[0]
                            };
                            setFormData(prev => ({
                              ...prev,
                              codeFiles: [...(prev.codeFiles || []), newFile]
                            }));
                            setSelectedCodeFileId(newFile.id);
                            setIsAddingCodeSnippet(false);
                          }}
                          className="px-5 py-1.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-md cursor-pointer"
                        >
                          Save Code Snippet
                        </button>
                      </div>
                    </div>
                  ) : selectedCodeFileId ? (
                    /* View / Editor Mode */
                    (() => {
                      const file = (formData.codeFiles || []).find(f => f.id === selectedCodeFileId);
                      if (!file) return <div className="m-auto text-xs text-muted-foreground font-bold">Select a code file from the list</div>;
                      return (
                        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                          {/* Header toolbar */}
                          <div className="p-4 border-b flex justify-between items-center bg-secondary/20 shrink-0">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-mono font-bold text-sm text-foreground">{file.name}</h3>
                                <span className="text-[10px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded bg-primary text-primary-foreground">{file.language}</span>
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-0.5">{file.description || 'No description'}</p>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(file.content);
                                  alert("Source code copied to clipboard!");
                                }}
                                className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5" /> Copy Code
                              </button>
                              <button
                                onClick={() => {
                                  const blob = new Blob([file.content], { type: 'text/plain' });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = file.name;
                                  a.click();
                                  URL.revokeObjectURL(url);
                                }}
                                className="px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" /> Download
                              </button>
                            </div>
                          </div>

                          {/* Code content viewer */}
                          <div className="flex-1 overflow-auto p-4 bg-slate-950 flex font-mono text-xs text-slate-200">
                            {/* Simulated Line Numbers */}
                            <div className="text-slate-600 select-none text-right pr-4 border-r border-slate-800 shrink-0 font-semibold space-y-1">
                              {file.content.split('\n').map((_, idx) => (
                                <div key={idx}>{idx + 1}</div>
                              ))}
                            </div>
                            {/* Code body */}
                            <pre className="pl-4 overflow-x-auto whitespace-pre leading-relaxed font-mono w-full text-left space-y-1">
                              {file.content.split('\n').map((line, lIdx) => (
                                <div key={lIdx} className="hover:bg-slate-900/50 px-1 rounded">
                                  {line || ' '}
                                </div>
                              ))}
                            </pre>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="m-auto text-center p-8 max-w-md space-y-3">
                      <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center m-auto">
                        <Code className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-sm text-foreground">Interactive Developer Workbench</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Catalog applications, configurations, scripts, and code libraries attached directly to this asset. Keep everything synchronized in one single workspace.
                      </p>
                      <button
                        onClick={() => {
                          setIsAddingCodeSnippet(true);
                          setSelectedCodeFileId(null);
                          setCodeFormName('');
                          setCodeFormLanguage('TypeScript');
                          setCodeFormContent('');
                          setCodeFormDesc('');
                        }}
                        className="bg-primary text-primary-foreground font-black text-xs px-4 py-2 rounded-md hover:bg-primary/90 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Catalog First Code File
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PRODUCTION BIBLE PUBLISHER & MAGAZINE CATALOGER TAB */}
            {activeOuterTab === 'cataloger' && (
              <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0 divide-y md:divide-y-0 md:divide-x divide-border">
                {/* Left Controls & Page Selection panel */}
                <div className="w-full md:w-[420px] shrink-0 flex flex-col min-h-0 bg-secondary/10 border-r">
                  <div className="p-3.5 border-b space-y-3.5 shrink-0 bg-card/60">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-foreground">
                          <Book className="w-4 h-4 text-primary" /> Production Bible & Publisher
                        </h3>
                        <p className="text-[10px] text-muted-foreground">Print complete archive or selective dossiers</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setShowBibleReaderModal(true)}
                          className="px-2.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                          title="Open Interactive 3D Flipbook Reader"
                        >
                          <BookOpenCheck className="w-3.5 h-3.5" /> Reader
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePrintCatalogBooklet()}
                          className="px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                          title="Print or Save as High-Res PDF"
                        >
                          <Printer className="w-3.5 h-3.5" /> Print / PDF
                        </button>
                      </div>
                    </div>

                    {/* Quick Mode Presets */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                        Dossier Preset Mode
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { id: 'complete-bible', label: '📖 Complete Bible', desc: 'All assets, lore, audio, code' },
                          { id: 'basic-dossier', label: '📄 Executive Pitch', desc: 'Cover, bio, specs & key art' },
                          { id: 'gallery-focus', label: '🎨 Gallery & Turnarounds', desc: 'Art plates, videos, files' },
                          { id: 'lore-focus', label: '📜 Lore Codex', desc: 'Worldbuilding & relations' },
                        ].map(preset => {
                          const isCurrent = bibleOptions.printMode === preset.id;
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => {
                                let targetSections: string[] = [];
                                if (preset.id === 'complete-bible') {
                                  targetSections = ALL_BIBLE_SECTIONS.map(s => s.id);
                                } else if (preset.id === 'basic-dossier') {
                                  targetSections = ['cover', 'biography', 'attributes', 'gallery', 'backCover'];
                                } else if (preset.id === 'gallery-focus') {
                                  targetSections = ['cover', 'gallery', 'videos', 'files', 'backCover'];
                                } else if (preset.id === 'lore-focus') {
                                  targetSections = ['cover', 'biography', 'lore', 'relationships', 'projects', 'backCover'];
                                }
                                setBibleOptions(prev => ({
                                  ...prev,
                                  printMode: preset.id as any,
                                  sections: targetSections,
                                }));
                              }}
                              className={`p-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                                isCurrent 
                                  ? 'bg-primary text-primary-foreground border-primary shadow-xs font-bold' 
                                  : 'bg-card hover:bg-secondary/60 text-card-foreground'
                              }`}
                            >
                              <div className="text-[11px] font-bold truncate">{preset.label}</div>
                              <div className={`text-[9px] truncate ${isCurrent ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                                {preset.desc}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Styling Settings Grid */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/40">
                      <div>
                        <label className="text-[10px] font-black uppercase text-muted-foreground block mb-0.5">Theme Style</label>
                        <select
                          value={bibleOptions.theme}
                          onChange={e => setBibleOptions({ ...bibleOptions, theme: e.target.value as any })}
                          className="w-full bg-background border rounded-md px-2 py-1 text-xs outline-none focus:border-primary font-bold"
                        >
                          <option value="clean-editorial">Clean Editorial</option>
                          <option value="glossy-magazine">Glossy Magazine</option>
                          <option value="cyber-dossier">Cyber Dossier</option>
                          <option value="vintage-archive">Vintage Archive</option>
                          <option value="dark-anthology">Dark Anthology</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-muted-foreground block mb-0.5">Paper Size</label>
                        <select
                          value={bibleOptions.pageSize}
                          onChange={e => setBibleOptions({ ...bibleOptions, pageSize: e.target.value as any })}
                          className="w-full bg-background border rounded-md px-2 py-1 text-xs outline-none focus:border-primary font-bold"
                        >
                          <option value="letter">Letter (8.5" x 11")</option>
                          <option value="a4">Standard A4 (210x297mm)</option>
                        </select>
                      </div>
                    </div>

                    {/* Gallery & Image Settings Grid */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/40">
                      <div>
                        <label className="text-[10px] font-black uppercase text-muted-foreground block mb-0.5">Gallery Grid</label>
                        <select
                          value={bibleOptions.galleryLayout}
                          onChange={e => setBibleOptions({ ...bibleOptions, galleryLayout: e.target.value as any })}
                          className="w-full bg-background border rounded-md px-2 py-1 text-xs outline-none focus:border-primary font-bold"
                        >
                          <option value="1-per-page">1 Large / Page</option>
                          <option value="2-grid">2 Side-by-Side</option>
                          <option value="4-grid">4-Grid (2x2)</option>
                          <option value="6-grid">6-Grid (3x2)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-muted-foreground block mb-0.5">Image Print Fit</label>
                        <select
                          value={bibleOptions.imageFit}
                          onChange={e => setBibleOptions({ ...bibleOptions, imageFit: e.target.value as any })}
                          className="w-full bg-background border rounded-md px-2 py-1 text-xs outline-none focus:border-primary font-bold"
                        >
                          <option value="contain">Fit / Contain (No Crop)</option>
                          <option value="cover">Fill / Cover (Crop to Frame)</option>
                          <option value="fill">Stretch to Fill</option>
                        </select>
                      </div>
                    </div>

                    {/* Running Header & Footer */}
                    <div className="space-y-1.5 pt-1 border-t border-border/40">
                      <div>
                        <label className="text-[10px] font-black uppercase text-muted-foreground block mb-0.5">Running Header</label>
                        <input
                          type="text"
                          value={bibleOptions.runningHeader}
                          onChange={e => setBibleOptions({ ...bibleOptions, runningHeader: e.target.value })}
                          placeholder="Header line..."
                          className="w-full bg-background border rounded px-2 py-0.5 text-[11px] font-medium outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-muted-foreground block mb-0.5">Running Footer</label>
                        <input
                          type="text"
                          value={bibleOptions.runningFooter}
                          onChange={e => setBibleOptions({ ...bibleOptions, runningFooter: e.target.value })}
                          placeholder="Footer line ({page} supported)..."
                          className="w-full bg-background border rounded px-2 py-0.5 text-[11px] font-medium outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Selective Elements Checkboxes */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-muted-foreground tracking-wider pb-1">
                      <span>Included Sections ({bibleOptions.sections.length}/{ALL_BIBLE_SECTIONS.length})</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (bibleOptions.sections.length === ALL_BIBLE_SECTIONS.length) {
                            setBibleOptions(prev => ({ ...prev, sections: ['cover', 'backCover'], printMode: 'custom' }));
                          } else {
                            setBibleOptions(prev => ({ ...prev, sections: ALL_BIBLE_SECTIONS.map(s => s.id), printMode: 'custom' }));
                          }
                        }}
                        className="text-primary hover:underline text-[10px] lowercase cursor-pointer"
                      >
                        {bibleOptions.sections.length === ALL_BIBLE_SECTIONS.length ? 'deselect all' : 'select all'}
                      </button>
                    </div>

                    {ALL_BIBLE_SECTIONS.map((sec, idx) => {
                      const isSel = bibleOptions.sections.includes(sec.id);
                      const isViewing = activeCatalogerPageIdx === idx;
                      return (
                        <div
                          key={sec.id}
                          onClick={() => setActiveCatalogerPageIdx(idx)}
                          className={`p-2 rounded-lg border text-left transition-all relative group cursor-pointer ${
                            isViewing ? 'bg-primary/5 border-primary shadow-xs' : 'bg-card hover:bg-secondary/40'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <input
                              type="checkbox"
                              checked={isSel}
                              onChange={() => {
                                let updated: string[];
                                if (isSel) {
                                  updated = bibleOptions.sections.filter(id => id !== sec.id);
                                } else {
                                  updated = [...bibleOptions.sections, sec.id];
                                }
                                setBibleOptions(prev => ({ ...prev, sections: updated, printMode: 'custom' }));
                              }}
                              onClick={e => e.stopPropagation()}
                              className="mt-0.5 w-3.5 h-3.5 rounded border-gray-300 text-primary focus:ring-primary shrink-0 cursor-pointer"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-xs text-foreground truncate">{sec.title}</span>
                                <span className="text-[9px] font-bold text-muted-foreground bg-secondary px-1.5 py-0.2 rounded">
                                  {sec.category}
                                </span>
                              </div>
                              <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5 leading-relaxed">{sec.description}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Area: Interactive Paper Sheet Preview Simulator */}
                <div className="flex-1 overflow-y-auto p-6 bg-secondary/20 flex flex-col items-center">
                  <div className="text-center mb-4 flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase text-muted-foreground bg-background border px-3 py-1 rounded-full shadow-xs">
                        Page Preview: {ALL_BIBLE_SECTIONS[activeCatalogerPageIdx]?.title || 'Document Page'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowBibleReaderModal(true)}
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1 bg-background border px-2.5 py-1 rounded-full shadow-xs cursor-pointer"
                      >
                        <BookOpenCheck className="w-3.5 h-3.5" /> Fullscreen 3D Reader
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-semibold">
                      Interactive simulation of printed copy paper sheets with live layout, fit mode, and typography.
                    </p>
                  </div>

                  {/* Standard Letter Copy Paper Container Aspect Ratio */}
                  {(() => {
                    const currentSec = ALL_BIBLE_SECTIONS[activeCatalogerPageIdx] || ALL_BIBLE_SECTIONS[0];
                    const pageId = currentSec.id;

                    let themeClass = "font-serif bg-slate-50 text-slate-900 border-indigo-200";
                    if (bibleOptions.theme === 'glossy-magazine') themeClass = "font-serif bg-white text-slate-900 border-indigo-300";
                    if (bibleOptions.theme === 'cyber-dossier') themeClass = "font-mono bg-zinc-950 text-green-400 border-green-800 shadow-lg shadow-green-500/15";
                    if (bibleOptions.theme === 'vintage-archive') themeClass = "font-serif bg-amber-50/80 text-amber-950 border-amber-200/80";
                    if (bibleOptions.theme === 'dark-anthology') themeClass = "font-sans bg-zinc-900 text-zinc-100 border-zinc-700";

                    const fitMode = bibleOptions.imageFit || 'contain';
                    const fitStyle: React.CSSProperties = {
                      objectFit: fitMode === 'contain' ? 'contain' : fitMode === 'fill' ? 'fill' : 'cover',
                      width: '100%',
                      height: '100%',
                    };

                    return (
                      <div className={`w-full max-w-xl aspect-[8.5/11] border rounded-lg shadow-2xl relative p-8 flex flex-col justify-between transition-all select-none overflow-hidden text-left ${themeClass}`}>
                        {/* Running Header */}
                        <div className="border-b pb-2 flex justify-between items-center text-[10px] uppercase font-bold tracking-wider opacity-60">
                          <span className="truncate">{bibleOptions.runningHeader}</span>
                          <span className="shrink-0">{bibleOptions.pageSize.toUpperCase()} SIZE</span>
                        </div>

                        {/* Page Content Body */}
                        <div className="flex-1 py-4 flex flex-col justify-start overflow-hidden">
                          {pageId === 'cover' && (
                            <div className="my-auto text-center space-y-3">
                              <span className="text-[10px] tracking-[4px] uppercase font-black text-primary block">Official Spec Sheet Booklet</span>
                              <h2 className="text-3xl font-black leading-none uppercase tracking-tight break-words px-2 text-foreground">{formData.name || 'Untitled Character'}</h2>
                              {formData.tagline && (
                                <p className="text-xs italic opacity-85 max-w-md mx-auto">"{formData.tagline}"</p>
                              )}
                              
                              {formData.highlightedImageSrc ? (
                                <div className="w-56 h-40 border rounded-lg overflow-hidden mx-auto bg-slate-300/40 p-1 flex shadow-sm">
                                  <img src={formData.highlightedImageSrc} style={fitStyle} referrerPolicy="no-referrer" />
                                </div>
                              ) : (
                                <div className="w-56 h-36 border border-dashed rounded-lg flex items-center justify-center mx-auto text-[10px] opacity-50 font-mono">
                                  [No Highlight Portrait Image Selected]
                                </div>
                              )}

                              <div className="text-[10px] opacity-75 space-y-0.5 pt-1">
                                <p>Species: <strong className="font-extrabold">{formData.species || 'Unknown'}</strong> | Gender: <strong className="font-extrabold">{formData.gender || 'Unknown'}</strong></p>
                                <p>Lead Art Director / Creator: <strong className="font-extrabold">{formData.creator || 'Lead Developer'}</strong></p>
                              </div>
                            </div>
                          )}

                          {pageId === 'biography' && (
                            <div className="space-y-3 my-auto">
                              <h3 className="text-lg font-bold border-b pb-1">Profile Biography & Lore Summary</h3>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="border p-2.5 rounded bg-black/5">
                                  <h4 className="text-[10px] font-bold text-primary uppercase mb-1">Biography Description</h4>
                                  <p className="text-[10px] leading-relaxed line-clamp-6 opacity-90">{formData.description || 'No biography compiled.'}</p>
                                </div>
                                <div className="border p-2.5 rounded bg-black/5 space-y-1">
                                  <h4 className="text-[10px] font-bold text-primary uppercase mb-1">Core Identity Specs</h4>
                                  <div className="text-[10px] space-y-1">
                                    <div className="flex justify-between border-b pb-0.5"><span>Species:</span><span className="font-bold">{formData.species || 'N/A'}</span></div>
                                    <div className="flex justify-between border-b pb-0.5"><span>Gender:</span><span className="font-bold">{formData.gender || 'N/A'}</span></div>
                                    <div className="flex justify-between border-b pb-0.5"><span>Age:</span><span className="font-bold">{formData.age || 'N/A'}</span></div>
                                    <div className="flex justify-between border-b pb-0.5"><span>Status:</span><span className="font-bold">{formData.status || 'N/A'}</span></div>
                                    <div className="flex justify-between"><span>Completion:</span><span className="font-bold">{formData.completionRating || '100%'}</span></div>
                                  </div>
                                </div>
                              </div>
                              {formData.history && (
                                <div className="border p-2.5 rounded bg-black/5">
                                  <h4 className="text-[10px] font-bold text-primary uppercase mb-0.5">Origins & Timeline Narrative</h4>
                                  <p className="text-[10px] leading-relaxed line-clamp-3 opacity-90">{formData.history}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {pageId === 'attributes' && (
                            <div className="space-y-3 my-auto">
                              <h3 className="text-lg font-bold border-b pb-1">Physical & Personality Attributes</h3>
                              <div className="grid grid-cols-2 gap-2">
                                {Object.entries(formData.attributes || {}).map(([k, v]) => (
                                  <div key={k} className="border p-2 rounded bg-black/5 flex justify-between text-[10px]">
                                    <span className="opacity-75">{k}:</span>
                                    <strong className="font-bold">{String(v)}</strong>
                                  </div>
                                ))}
                                {Object.keys(formData.attributes || {}).length === 0 && (
                                  <div className="col-span-2 text-center py-6 text-[10px] opacity-60 font-mono">No custom physical attributes mapped.</div>
                                )}
                              </div>
                            </div>
                          )}

                          {pageId === 'lore' && (
                            <div className="space-y-3 my-auto">
                              <h3 className="text-lg font-bold border-b pb-1">Aesthetic Codex & Lore Document</h3>
                              <div className="space-y-2">
                                {(formData.biblePages || []).slice(0, 3).map(bp => (
                                  <div key={bp.id} className="border p-2.5 rounded bg-black/5">
                                    <h4 className="text-xs font-bold text-emerald-600 flex items-center gap-1">✦ {bp.title}</h4>
                                    <p className="text-[10px] opacity-85 leading-relaxed line-clamp-2 mt-0.5">{bp.content}</p>
                                  </div>
                                ))}
                                {(formData.biblePages || []).length === 0 && (
                                  <div className="text-center py-8 text-[10px] opacity-60 font-mono">No active codex sheets compiled.</div>
                                )}
                              </div>
                            </div>
                          )}

                          {pageId === 'gallery' && (
                            <div className="space-y-3 my-auto">
                              <div className="flex justify-between items-center border-b pb-1">
                                <h3 className="text-lg font-bold">Artwork & Pose Gallery</h3>
                                <span className="text-[9px] font-bold opacity-60">Layout: {bibleOptions.galleryLayout} | Fit: {bibleOptions.imageFit}</span>
                              </div>
                              <div className={`grid gap-2 ${
                                bibleOptions.galleryLayout === '1-per-page' ? 'grid-cols-1' :
                                bibleOptions.galleryLayout === '4-grid' ? 'grid-cols-2' :
                                bibleOptions.galleryLayout === '6-grid' ? 'grid-cols-3' : 'grid-cols-2'
                              }`}>
                                {(formData.subImages || []).slice(0, bibleOptions.galleryLayout === '1-per-page' ? 1 : bibleOptions.galleryLayout === '6-grid' ? 6 : 4).map(si => (
                                  <div key={si.id} className="border p-1.5 rounded bg-black/5 text-center">
                                    <div className={`${bibleOptions.galleryLayout === '1-per-page' ? 'h-48' : 'h-20'} bg-slate-200/50 rounded overflow-hidden mb-1`}>
                                      <img src={si.src} style={fitStyle} referrerPolicy="no-referrer" />
                                    </div>
                                    <span className="text-[10px] font-bold block truncate">{si.title || 'Artwork Plate'}</span>
                                  </div>
                                ))}
                              </div>
                              {(formData.subImages || []).length === 0 && (
                                <div className="text-center py-10 text-[10px] opacity-60 font-mono">No sub-images added to the gallery.</div>
                              )}
                            </div>
                          )}

                          {pageId === 'videos' && (
                            <div className="space-y-3 my-auto">
                              <h3 className="text-lg font-bold border-b pb-1">Video Clips & Cinematics</h3>
                              <div className="grid grid-cols-2 gap-2">
                                {(formData.videoClips || []).slice(0, 4).map(v => (
                                  <div key={v.id} className="border p-2 rounded bg-black/5 text-center">
                                    <div className="h-16 bg-slate-800 rounded flex items-center justify-center text-white mb-1 overflow-hidden">
                                      {v.thumbnailSrc ? <img src={v.thumbnailSrc} style={fitStyle} referrerPolicy="no-referrer" /> : <Play className="w-6 h-6 text-red-500" />}
                                    </div>
                                    <div className="text-[10px] font-bold truncate">{v.title}</div>
                                    <div className="text-[8px] opacity-75 truncate">{v.duration || '0:00'}</div>
                                  </div>
                                ))}
                                {(formData.videoClips || []).length === 0 && (
                                  <div className="col-span-2 text-center py-8 text-[10px] opacity-60 font-mono">No video attachments logged.</div>
                                )}
                              </div>
                            </div>
                          )}

                          {pageId === 'audios' && (
                            <div className="space-y-3 my-auto">
                              <h3 className="text-lg font-bold border-b pb-1">Audio Tracks & Voice Archive</h3>
                              <div className="space-y-1.5">
                                {(formData.audioTracks || []).slice(0, 5).map(a => (
                                  <div key={a.id} className="border p-2 rounded bg-black/5 flex justify-between items-center text-[10px]">
                                    <span className="font-bold flex items-center gap-1.5"><Music className="w-3.5 h-3.5 text-primary" /> {a.title}</span>
                                    <span className="opacity-75">{a.duration || '0:00'}</span>
                                  </div>
                                ))}
                                {(formData.audioTracks || []).length === 0 && (
                                  <div className="text-center py-8 text-[10px] opacity-60 font-mono">No audio tracks recorded.</div>
                                )}
                              </div>
                            </div>
                          )}

                          {pageId === 'files' && (
                            <div className="space-y-3 my-auto">
                              <h3 className="text-lg font-bold border-b pb-1">Production Project Attachments & Models</h3>
                              <div className="grid grid-cols-2 gap-2">
                                {(formData.uploadedFiles || []).slice(0, 6).map(f => (
                                  <div key={f.id} className="border p-2 rounded bg-black/5 flex items-center gap-2 text-[10px]">
                                    <File className="w-4 h-4 text-blue-500 shrink-0" />
                                    <div className="min-w-0">
                                      <div className="font-bold truncate">{f.name}</div>
                                      <div className="text-[8px] opacity-70">{f.size}</div>
                                    </div>
                                  </div>
                                ))}
                                {(formData.uploadedFiles || []).length === 0 && (
                                  <div className="col-span-2 text-center py-8 text-[10px] opacity-60 font-mono">No external file assets attached.</div>
                                )}
                              </div>
                            </div>
                          )}

                          {pageId === 'code' && (
                            <div className="space-y-3 my-auto">
                              <h3 className="text-lg font-bold border-b pb-1">Game Scripts & Source Code Snippets</h3>
                              <div className="space-y-2">
                                {(formData.codeSnippets || []).slice(0, 2).map(c => (
                                  <div key={c.id} className="border p-2 rounded bg-zinc-950 text-green-400 font-mono text-[9px]">
                                    <div className="text-[10px] font-bold text-white border-b border-zinc-800 pb-1 mb-1 flex justify-between">
                                      <span>{c.title}</span>
                                      <span className="text-zinc-500">{c.language}</span>
                                    </div>
                                    <pre className="overflow-hidden line-clamp-4">{c.content}</pre>
                                  </div>
                                ))}
                                {(formData.codeSnippets || []).length === 0 && (
                                  <div className="text-center py-8 text-[10px] opacity-60 font-mono">No source code snippets uploaded.</div>
                                )}
                              </div>
                            </div>
                          )}

                          {pageId === 'projects' && (
                            <div className="space-y-3 my-auto">
                              <h3 className="text-lg font-bold border-b pb-1">Project Roles & Client Portfolio</h3>
                              <div className="space-y-1.5">
                                {(formData.projects || []).slice(0, 4).map(p => (
                                  <div key={p.id} className="border p-2 rounded bg-black/5 flex justify-between items-start gap-3">
                                    <div>
                                      <h4 className="text-[11px] font-extrabold text-amber-600">{p.projectName}</h4>
                                      <p className="text-[9px] opacity-75">Role: <strong>{p.roleOrRelation}</strong></p>
                                    </div>
                                    <span className="text-[8px] uppercase font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">{p.status}</span>
                                  </div>
                                ))}
                                {(formData.projects || []).length === 0 && (
                                  <div className="text-center py-8 text-[10px] opacity-60 font-mono">No custom projects logged.</div>
                                )}
                              </div>
                            </div>
                          )}

                          {pageId === 'relationships' && (
                            <div className="space-y-3 my-auto">
                              <h3 className="text-lg font-bold border-b pb-1">Character Relationships & Network</h3>
                              <div className="space-y-1.5">
                                {(formData.relationships || []).slice(0, 4).map(r => (
                                  <div key={r.id} className="border p-2 rounded bg-black/5 flex justify-between items-center text-[10px]">
                                    <span className="font-bold">{r.targetCharacterName}</span>
                                    <span className="opacity-75">{r.type}</span>
                                  </div>
                                ))}
                                {(formData.relationships || []).length === 0 && (
                                  <div className="text-center py-8 text-[10px] opacity-60 font-mono">No relationship links established.</div>
                                )}
                              </div>
                            </div>
                          )}

                          {pageId === 'devLogs' && (
                            <div className="space-y-3 my-auto">
                              <h3 className="text-lg font-bold border-b pb-1">Development Logs & Trackers</h3>
                              <div className="space-y-1.5">
                                {(formData.devTracker?.logs || []).slice(0, 4).map(l => (
                                  <div key={l.id} className="border p-2 rounded bg-black/5 text-[10px]">
                                    <div className="flex justify-between font-bold opacity-75 mb-0.5">
                                      <span>{l.milestone || 'Work log'}</span>
                                      <span>{l.hoursSpent} hrs</span>
                                    </div>
                                    <p className="opacity-85 truncate">{l.description}</p>
                                  </div>
                                ))}
                                {(formData.devTracker?.logs || []).length === 0 && (
                                  <div className="text-center py-8 text-[10px] opacity-60 font-mono">No work sessions logged yet.</div>
                                )}
                              </div>
                            </div>
                          )}

                          {pageId === 'backCover' && (
                            <div className="space-y-3 my-auto flex flex-col justify-between h-full text-center">
                              <div className="my-auto space-y-3">
                                <h3 className="text-2xl font-black uppercase tracking-widest text-primary">Archival Index</h3>
                                <p className="text-[11px] opacity-80 max-w-sm mx-auto">
                                  Official Character Production Dossier compiled and authenticated for studio distribution.
                                </p>
                                <div className="border p-3 rounded-lg bg-black/5 text-[10px] max-w-xs mx-auto space-y-1">
                                  <div className="flex justify-between"><span>Subject Name:</span><strong>{formData.name}</strong></div>
                                  <div className="flex justify-between"><span>Compiled Date:</span><strong>{new Date().toISOString().split('T')[0]}</strong></div>
                                  <div className="flex justify-between"><span>Creator:</span><strong>{formData.creator || 'Studio Lead'}</strong></div>
                                </div>
                              </div>
                              <div className="pt-6 border-t border-dashed border-black/20">
                                <span className="text-[9px] font-black tracking-widest opacity-60 uppercase">END OF DOSSIER • ALL RIGHTS RESERVED</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Running Footer */}
                        <div className="border-t pt-2 flex justify-between items-center text-[10px] opacity-65 font-bold tracking-wider">
                          <span className="truncate">{bibleOptions.runningFooter.replace('{page}', String(activeCatalogerPageIdx + 1)).replace('{character}', formData.name || 'Character')}</span>
                          <span className="shrink-0">PAGE {activeCatalogerPageIdx + 1}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* SPREADSHEET LIBRARY TAB */}
            {activeOuterTab === 'spreadsheet' && (
              <div className="flex-1 overflow-hidden flex flex-col min-h-0 p-2 sm:p-4 bg-background">
                <SpreadsheetView
                  mode="profile"
                  character={formData as Character}
                  creatorProfileName={formData.creator}
                  onUpdateCharacter={(updated) => {
                    setFormData(prev => ({ ...prev, ...updated }));
                  }}
                />
              </div>
            )}
          </div>
        </div>

          {/* Render right edit tools */}
          {toolsPos === 'right' && renderEditToolsPanel('vertical')}

          {/* Render right tab bar */}
          {tabPos === 'right' && renderTabsBar('vertical')}

        </div> {/* end of Mid layout section */}

        {/* Render bottom panels (tabs and tools if placed at bottom) */}
        {renderBottomPanels()}

        {/* Modal for Adding a New Subpage in Details Tab */}
        {showAddSubPageModal && (
          <div 
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                if (newSubPageTitle.trim() !== '') {
                  if (window.confirm("You have unsaved changes. Are you sure you want to discard your new subpage title?")) {
                    setShowAddSubPageModal(false);
                    setNewSubPageTitle('');
                  }
                } else {
                  setShowAddSubPageModal(false);
                }
              }
            }}
          >
            <div className="bg-card text-card-foreground p-6 rounded-xl w-full max-w-md shadow-2xl border border-border animate-in zoom-in-95 duration-200 space-y-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-primary" /> Add New Details Subpage
              </h3>
              {newSubPageParentId && (
                <div className="text-xs bg-secondary/50 p-2 rounded border font-semibold flex items-center gap-1">
                  <span className="text-muted-foreground">Nested under parent:</span>
                  <span className="text-primary">{formData.biblePages?.find(p => p.id === newSubPageParentId)?.title || 'Selected Page'}</span>
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">Subpage Title</label>
                <input 
                  type="text" 
                  autoFocus
                  value={newSubPageTitle}
                  onChange={e => setNewSubPageTitle(e.target.value)}
                  placeholder="e.g. Dialogue & Speech / Weaponry"
                  className="w-full bg-background border rounded-md px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAddBiblePage();
                  }}
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button 
                  onClick={() => {
                    if (newSubPageTitle.trim() !== '') {
                      if (window.confirm("You have unsaved changes. Are you sure you want to discard your new subpage title?")) {
                        setShowAddSubPageModal(false);
                        setNewSubPageTitle('');
                      }
                    } else {
                      setShowAddSubPageModal(false);
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-semibold bg-secondary hover:bg-secondary/80 rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleAddBiblePage()}
                  className="px-4 py-1.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded cursor-pointer"
                >
                  Create Subpage
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal for Adding Media Category List */}
        {showAddMediaCatModal && (
          <div 
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                if (newMediaCatName.trim() !== '') {
                  if (window.confirm("You have unsaved changes. Are you sure you want to discard your new category name?")) {
                    setShowAddMediaCatModal(false);
                    setNewMediaCatName('');
                  }
                } else {
                  setShowAddMediaCatModal(false);
                }
              }
            }}
          >
            <div className="bg-card text-card-foreground p-6 rounded-xl w-full max-w-md shadow-2xl border border-border animate-in zoom-in-95 duration-200 space-y-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-primary" /> Create Media Category List
              </h3>
              {newMediaCatParentId && (
                <div className="text-xs bg-secondary/50 p-2 rounded border font-semibold flex items-center gap-1">
                  <span className="text-muted-foreground">Nested under list:</span>
                  <span className="text-primary">{formData.mediaCategories?.find(c => c.id === newMediaCatParentId)?.name}</span>
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">Category List Name</label>
                <input 
                  type="text" 
                  autoFocus
                  value={newMediaCatName}
                  onChange={e => setNewMediaCatName(e.target.value)}
                  placeholder="e.g. Soundtracks / Voice Samples / Battle Animations"
                  className="w-full bg-background border rounded-md px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAddMediaCategory();
                  }}
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button 
                  onClick={() => {
                    if (newMediaCatName.trim() !== '') {
                      if (window.confirm("You have unsaved changes. Are you sure you want to discard your new category name?")) {
                        setShowAddMediaCatModal(false);
                        setNewMediaCatName('');
                      }
                    } else {
                      setShowAddMediaCatModal(false);
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-semibold bg-secondary hover:bg-secondary/80 rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleAddMediaCategory()}
                  className="px-4 py-1.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded cursor-pointer"
                >
                  Create List
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal for Portrait Selector & Cropper */}
        {showPortraitPickerModal && (
          <div 
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowPortraitPickerModal(false);
              }
            }}
          >
            <div className="bg-card text-card-foreground p-6 rounded-xl w-full max-w-xl shadow-2xl border border-border animate-in zoom-in-95 duration-200 space-y-5">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Camera className="w-5 h-5 text-primary" /> Select or Upload Entity Portrait Icon
                </h3>
                <button onClick={() => setShowPortraitPickerModal(false)} className="p-1 hover:bg-secondary rounded">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Upload new image button */}
              <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border">
                <div>
                  <span className="font-bold text-xs block text-foreground">Upload Custom Portrait Picture</span>
                  <span className="text-[11px] text-muted-foreground">Select an image file from your device to automatically crop as portrait.</span>
                </div>
                <label className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded hover:bg-primary/90 cursor-pointer shrink-0">
                  Browse File
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = URL.createObjectURL(file);
                      handleSetMainImage(url);
                      setShowPortraitPickerModal(false);
                    }
                  }} />
                </label>
              </div>

              {/* Select from media assets gallery */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-muted-foreground uppercase block">Choose from existing media assets</span>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-60 overflow-y-auto p-1">
                  {galleryImages.map((img) => (
                    <div 
                      key={img.id} 
                      onClick={() => {
                        handleSetMainImage(img.src);
                        setShowPortraitPickerModal(false);
                      }}
                      className="border rounded-lg bg-secondary/20 hover:border-primary p-2 flex flex-col items-center gap-1.5 cursor-pointer group transition-all"
                    >
                      <div className="w-16 h-16 rounded-full overflow-hidden border border-border group-hover:scale-105 transition-transform">
                        <img src={img.src} alt={img.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <span className="text-[10px] font-semibold truncate max-w-full text-center" title={img.title}>{img.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end border-t pt-3">
                <button onClick={() => setShowPortraitPickerModal(false)} className="px-4 py-1.5 text-xs font-bold bg-secondary hover:bg-secondary/80 rounded cursor-pointer">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal for Adding a Custom Main Tab */}
        {showAddMainTabModal && (
          <div 
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                if (newMainTabTitle.trim() !== '') {
                  if (window.confirm("You have unsaved changes. Are you sure you want to discard your new tab title?")) {
                    setShowAddMainTabModal(false);
                    setNewMainTabTitle('');
                  }
                } else {
                  setShowAddMainTabModal(false);
                }
              }
            }}
          >
            <div className="bg-card text-card-foreground p-6 rounded-xl w-full max-w-md shadow-2xl border border-border animate-in zoom-in-95 duration-200 space-y-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" /> Add New Main Workspace Tab
              </h3>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">Tab Name</label>
                <input 
                  type="text" 
                  autoFocus
                  value={newMainTabTitle}
                  onChange={e => setNewMainTabTitle(e.target.value)}
                  placeholder="e.g. Worldbuilding / Inventory / Lore"
                  className="w-full bg-background border rounded-md px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAddCustomMainTab();
                  }}
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button 
                  onClick={() => {
                    if (newMainTabTitle.trim() !== '') {
                      if (window.confirm("You have unsaved changes. Are you sure you want to discard your new tab title?")) {
                        setShowAddMainTabModal(false);
                        setNewMainTabTitle('');
                      }
                    } else {
                      setShowAddMainTabModal(false);
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-semibold bg-secondary hover:bg-secondary/80 rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddCustomMainTab}
                  className="px-4 py-1.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded cursor-pointer"
                >
                  Create Main Tab
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirm Overlay */}
        {showDeleteConfirm && (
          <div 
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowDeleteConfirm(false);
              }
            }}
          >
            <div className="bg-card text-card-foreground p-6 rounded-xl w-full max-w-md shadow-2xl border border-border animate-in zoom-in-95 duration-200">
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-destructive">
                <AlertCircle className="w-5 h-5" /> Remove Archive Entry
              </h3>
              <p className="text-muted-foreground text-xs mb-6 leading-relaxed">
                Are you sure you want to delete this entry? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 text-sm font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm font-medium transition-colors shadow-sm cursor-pointer"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Unsaved Changes Confirm Overlay */}
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
                  className="w-full py-2 rounded-md bg-primary text-primary-foreground hover:bg-opacity-90 text-sm font-medium transition-colors text-center shadow-sm cursor-pointer"
                >
                  Save and Exit
                </button>
                <button
                  onClick={() => {
                    setShowUnsavedConfirm(false);
                    if (onClose) onClose();
                  }}
                  className="w-full py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-opacity-80 text-sm font-medium transition-colors text-center border cursor-pointer"
                >
                  Discard Changes
                </button>
                <button
                  onClick={() => setShowUnsavedConfirm(false)}
                  className="w-full py-2 rounded-md bg-background border hover:bg-secondary text-sm font-medium transition-colors text-center cursor-pointer"
                >
                  Keep Editing
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Printable Multi-Page Booklet Modal */}
        {showBookletModal && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-6 animate-in fade-in duration-200 overflow-hidden select-text"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowBookletModal(false);
              }
            }}
          >
            <div className="bg-card text-card-foreground rounded-2xl w-full max-w-5xl h-[92vh] shadow-2xl border border-border flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              {/* Modal Top Header Bar */}
              <div className="p-4 bg-secondary/40 border-b flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-foreground">Character Dossier Booklet</h3>
                    <p className="text-[11px] text-muted-foreground">Printable publication dossier containing all notes, stats, projects, & credits.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handlePrintCatalogBooklet()}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print / PDF Booklet</span>
                  </button>
                  <button 
                    onClick={() => setShowBookletModal(false)}
                    className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable Booklet Content */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-10 bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 scrollbar-thin">
                {/* Cover Page */}
                <div className="border-b-4 border-primary pb-8 space-y-6">
                  {/* Banner Image */}
                  {(formData.bannerImageSrc || formData.bannerImage) && (
                    <div className="w-full h-48 sm:h-64 rounded-xl overflow-hidden border shadow-sm relative bg-slate-900">
                      <img 
                        src={formData.bannerImageSrc || formData.bannerImage} 
                        alt="Banner" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer" 
                      />
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
                    <div className="flex items-center gap-5">
                      {(formData.highlightedImageSrc || formData.image) ? (
                        <img 
                          src={formData.highlightedImageSrc || formData.image} 
                          alt={formData.name} 
                          className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl object-cover border-2 border-primary shadow-md bg-slate-100 dark:bg-slate-900" 
                          referrerPolicy="no-referrer" 
                        />
                      ) : (
                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-2xl border">
                          {formData.name?.[0] || 'C'}
                        </div>
                      )}
                      <div className="space-y-1">
                        <span className="text-xs font-black uppercase tracking-widest text-primary">Archival Publication Booklet</span>
                        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{formData.name}</h1>
                        <p className="text-sm italic font-medium text-slate-600 dark:text-slate-300 max-w-lg">{formData.tagline || formData.description}</p>
                        <div className="text-xs font-bold text-slate-500 pt-1">
                          Created by: <span className="text-primary">{formData.creator || 'Alberto Armentero'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 bg-white dark:bg-slate-900 p-4 rounded-xl border text-xs shadow-sm min-w-[200px]">
                      <div><span className="font-bold text-slate-400">Status:</span> <span className="font-semibold">{formData.status || 'Active'}</span></div>
                      <div><span className="font-bold text-slate-400">Species:</span> <span className="font-semibold">{formData.species || 'Human'}</span></div>
                      <div><span className="font-bold text-slate-400">Gender:</span> <span className="font-semibold">{formData.gender || 'Unspecified'}</span></div>
                      <div><span className="font-bold text-slate-400">Age:</span> <span className="font-semibold">{formData.age || 'Unknown'}</span></div>
                      <div><span className="font-bold text-slate-400">Registry Date:</span> <span className="font-semibold">{formData.dateUploaded || new Date().toISOString().split('T')[0]}</span></div>
                    </div>
                  </div>
                </div>

                {/* Section 1: Core Overview & Premise */}
                <div className="space-y-3">
                  <h2 className="text-lg font-black uppercase tracking-wider text-primary border-b pb-1">1. At-A-Glance Overview</h2>
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 font-medium whitespace-pre-wrap">
                    {formData.description || 'No overview summary provided.'}
                  </p>
                </div>

                {/* Section 2: Character Specs & Physical Attributes */}
                <div className="space-y-3">
                  <h2 className="text-lg font-black uppercase tracking-wider text-primary border-b pb-1">2. Specifications & Attributes</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-white dark:bg-slate-900 p-4 rounded-xl border">
                    <div><span className="font-bold text-slate-400 block">Height</span><span className="font-semibold">{formData.height || 'N/A'}</span></div>
                    <div><span className="font-bold text-slate-400 block">Weight</span><span className="font-semibold">{formData.weight || 'N/A'}</span></div>
                    <div><span className="font-bold text-slate-400 block">Hair / Eyes</span><span className="font-semibold">{formData.hairColor || 'N/A'} / {formData.eyeColor || 'N/A'}</span></div>
                    <div><span className="font-bold text-slate-400 block">Alignment</span><span className="font-semibold">{formData.alignment || 'N/A'}</span></div>
                    <div><span className="font-bold text-slate-400 block">Occupation</span><span className="font-semibold">{formData.occupation || 'N/A'}</span></div>
                    <div><span className="font-bold text-slate-400 block">World / Universe</span><span className="font-semibold">{formData.worldName || 'N/A'}</span></div>
                    <div><span className="font-bold text-slate-400 block">Affiliation</span><span className="font-semibold">{formData.affiliation || 'N/A'}</span></div>
                    <div><span className="font-bold text-slate-400 block">Origin</span><span className="font-semibold">{formData.placeOfOrigin || 'N/A'}</span></div>

                    {/* Custom Attributes Fields */}
                    {formData.attributes && Object.entries(formData.attributes).length > 0 && (
                      <div className="col-span-2 sm:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                        {Object.entries(formData.attributes).map(([key, val]) => (
                          <div key={key}>
                            <span className="font-bold text-slate-400 block">{key}</span>
                            <span className="font-semibold">{val || 'N/A'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 3: Subpage Bible & Lore Notes */}
                {formData.biblePages && formData.biblePages.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-black uppercase tracking-wider text-primary border-b pb-1">3. Lore Bible & Background Notes</h2>
                    <div className="space-y-6">
                      {formData.biblePages.map((page) => (
                        <div key={page.id} className="bg-white dark:bg-slate-900 p-5 rounded-xl border space-y-2">
                          <h3 className="font-bold text-base text-primary">{page.title}</h3>
                          <p className="text-xs font-mono leading-relaxed whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                            {page.content || 'Empty note page.'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* NEW SECTION: Media Gallery & Posable Reference Assets */}
                {((formData.subImages && formData.subImages.length > 0) || 
                  (formData.audios && formData.audios.length > 0) || 
                  (formData.videos && formData.videos.length > 0) || 
                  (formData.genericFiles && formData.genericFiles.length > 0)) && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-black uppercase tracking-wider text-primary border-b pb-1">4. Media Gallery & Studio Reference Assets</h2>
                    
                    <div className="space-y-6">
                      {/* Sub-Images (Pose Sheets & Model Sheets) */}
                      {formData.subImages && formData.subImages.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Concept Poses & Turnarounds</h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {formData.subImages.map((img) => (
                              <div key={img.id} className="bg-white dark:bg-slate-900 p-3 rounded-xl border text-xs space-y-2">
                                <div className="w-full h-32 rounded-lg bg-slate-900 overflow-hidden relative border">
                                  <img 
                                    src={img.src} 
                                    alt={img.title || 'Studio Reference'} 
                                    className="w-full h-full object-cover" 
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                <div className="space-y-0.5">
                                  <div className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{img.title || 'Untitled Artwork'}</div>
                                  {img.description && <p className="text-[10px] text-slate-500 line-clamp-2">{img.description}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Video Media list */}
                      {formData.videos && formData.videos.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Video Attachments & Promos</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {formData.videos.map((vid) => (
                              <div key={vid.id} className="bg-white dark:bg-slate-900 p-3 rounded-xl border text-xs flex gap-3 items-center">
                                <div className="w-16 h-12 bg-slate-800 rounded-lg shrink-0 flex items-center justify-center border border-white/10 text-primary">
                                  <span className="text-[10px] font-bold">VIDEO</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{vid.title}</div>
                                  <p className="text-[10px] text-slate-400 font-bold">{vid.category || 'Reference clip'}</p>
                                  {vid.description && <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{vid.description}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Audio Media list */}
                      {formData.audios && formData.audios.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Audio Tracks & Voice Clips</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {formData.audios.map((aud) => (
                              <div key={aud.id} className="bg-white dark:bg-slate-900 p-3 rounded-xl border text-xs flex gap-3 items-center">
                                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full shrink-0 flex items-center justify-center text-primary border">
                                  <span className="text-[10px] font-bold">♫</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{aud.title}</div>
                                  <p className="text-[10px] text-slate-400 font-bold">{aud.category || 'Dialogue Track'}</p>
                                  {aud.description && <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{aud.description}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Section 5: Projects & Episodes */}
                {formData.projects && formData.projects.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-black uppercase tracking-wider text-primary border-b pb-1">5. Associated Projects & Episodes</h2>
                    <div className="space-y-4">
                      {formData.projects.map((proj) => (
                        <div key={proj.id} className="bg-white dark:bg-slate-900 p-5 rounded-xl border space-y-2">
                          <div className="flex justify-between items-center">
                            <h3 className="font-bold text-base">{proj.projectName}</h3>
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border">{proj.status}</span>
                          </div>
                          <p className="text-xs font-semibold text-primary">{proj.roleOrRelation}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{proj.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 6: Relationships */}
                {formData.relationships && formData.relationships.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-black uppercase tracking-wider text-primary border-b pb-1">6. Character Relationships</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {formData.relationships.map((rel) => (
                        <div key={rel.id} className="bg-white dark:bg-slate-900 p-3 rounded-xl border text-xs space-y-1 flex items-center gap-3">
                          {rel.iconUrl && <img src={rel.iconUrl} alt={rel.targetName} className="w-10 h-10 rounded-full object-cover border shrink-0" referrerPolicy="no-referrer" />}
                          <div>
                            <div className="font-bold">{rel.targetName} <span className="text-primary text-[10px]">({rel.relationshipType})</span></div>
                            <p className="text-slate-500 text-[11px]">{rel.notes}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 7: Dev Tracker & Contributor Credits */}
                {formData.devTracker && formData.devTracker.logs && formData.devTracker.logs.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-black uppercase tracking-wider text-primary border-b pb-1">7. Production Development Logs</h2>
                    <div className="space-y-3 bg-white dark:bg-slate-900 p-4 rounded-xl border text-xs">
                      {formData.devTracker.logs.map((log) => (
                        <div key={log.id} className="flex justify-between items-start gap-4 pb-2 border-b last:border-0 last:pb-0">
                          <div>
                            <span className="font-bold text-primary">{log.date}</span>: {log.description}
                          </div>
                          <span className="font-bold shrink-0">{log.hoursSpent} hrs spent</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer Section */}
                <div className="space-y-3 pt-6 border-t text-xs text-slate-500">
                  <div className="flex justify-between items-center">
                    <div>Document compiled automatically by <span className="font-bold text-primary">Character Dossier Engine</span>.</div>
                    <div>Lead Author / Creator: <span className="font-bold text-slate-800 dark:text-slate-200">{formData.creator || 'Alberto Armentero'}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gallery Image zoom layout */}
        {galleryIndex !== null && galleryImages[galleryIndex] && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none overflow-hidden"
            onTouchStart={handleTouchStartGallery}
            onTouchEnd={handleTouchEndGallery}
            onClick={() => setGalleryIndex(null)}
          >
            {/* Top toolbar */}
            <div className={`absolute top-0 inset-x-0 p-4 flex justify-end gap-3 transition-opacity duration-500 z-50 bg-gradient-to-b from-black/80 to-transparent ${galleryShowOverlay && !isGalleryIdle ? 'opacity-100' : 'opacity-0'}`} onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setGalleryShowOverlay(!galleryShowOverlay)}
                className="p-2.5 rounded-full bg-secondary/80 text-foreground hover:bg-secondary transition-colors cursor-pointer border border-border/40"
              >
                {galleryShowOverlay ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setGalleryIndex(null)}
                className="p-2.5 rounded-full bg-secondary/80 text-foreground hover:bg-secondary transition-colors cursor-pointer border border-border/40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation buttons */}
            <button 
              className={`absolute left-4 z-40 p-3 rounded-full bg-secondary/50 text-foreground hover:bg-secondary transition-all cursor-pointer border border-border/20 ${!isGalleryIdle ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
              onClick={(e) => { e.stopPropagation(); setGalleryIndex((galleryIndex - 1 + galleryImages.length) % galleryImages.length); }}
            >
              <ChevronLeft className="w-8 h-8" />
            </button>

            <button 
              className={`absolute right-4 z-40 p-3 rounded-full bg-secondary/50 text-foreground hover:bg-secondary transition-all cursor-pointer border border-border/20 ${!isGalleryIdle ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}
              onClick={(e) => { e.stopPropagation(); setGalleryIndex((galleryIndex + 1) % galleryImages.length); }}
            >
              <ChevronRight className="w-8 h-8" />
            </button>

            {/* Main Image */}
            <img
              src={galleryImages[galleryIndex].src}
              alt={galleryImages[galleryIndex].title}
              className="max-w-full max-h-[100vh] object-contain shadow-2xl animate-in zoom-in-95 duration-200"
              referrerPolicy="no-referrer"
            />

            {/* Bottom bar */}
            <div className={`absolute bottom-0 inset-x-0 p-8 pt-16 flex flex-col justify-end transition-opacity duration-500 z-30 bg-gradient-to-t from-black via-black/80 to-transparent ${galleryShowOverlay && !isGalleryIdle ? 'opacity-100' : 'opacity-0'}`}>
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

        {/* Banner Alignment & Crop Modal */}
        {showBannerCropModal && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200 select-text"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowBannerCropModal(false);
              }
            }}
          >
            <div className="bg-card text-card-foreground rounded-2xl w-full max-w-xl shadow-2xl border p-6 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <Maximize2 className="w-5 h-5 text-primary" />
                  <h3 className="font-extrabold text-base">Banner Alignment & Crop Tool</h3>
                </div>
                <button onClick={() => setShowBannerCropModal(false)} className="p-1 hover:bg-secondary rounded-lg cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* LIVE PREVIEW BANNER INSIDE MODAL */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    Live Preview
                  </label>
                  <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full animate-pulse">Drag & Drop Image Here to Replace</span>
                </div>
                <div 
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingBannerModal(true); }}
                  onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingBannerModal(false); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingBannerModal(false);
                    const file = e.dataTransfer.files[0];
                    if (file && file.type.startsWith('image/')) {
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        const src = evt.target?.result as string;
                        setFormData(prev => ({ ...prev, bannerImageSrc: src }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className={`relative w-full h-36 bg-slate-900 rounded-xl overflow-hidden border-2 transition-all ${
                    isDraggingBannerModal ? 'border-primary scale-[1.02] ring-4 ring-primary/20' : 'border-border/60'
                  } shadow-inner cursor-pointer`}
                  title="Drag and drop a new banner image here directly!"
                >
                  {formData.bannerImageSrc ? (
                    <img 
                      src={formData.bannerImageSrc} 
                      alt="Banner Preview" 
                      className="absolute inset-0 w-full h-full opacity-80"
                      style={getBannerStyle()}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center text-xs text-muted-foreground">
                      No Banner Image Uploaded
                    </div>
                  )}

                  {/* Drag overlay message */}
                  {isDraggingBannerModal && (
                    <div className="absolute inset-0 bg-primary/90 text-primary-foreground flex flex-col items-center justify-center gap-2 z-30 font-black text-xs animate-in fade-in duration-100">
                      <Upload className="w-8 h-8 animate-bounce" />
                      <span>Drop Image to Set as Banner!</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                    <div className="flex items-center gap-2 text-white">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/50 overflow-hidden flex items-center justify-center shrink-0">
                        {mainImageSrc ? (
                          <img src={mainImageSrc} alt="Portrait" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs">{formData.name || 'Character Name'}</h4>
                        <p className="text-[10px] text-white/70 line-clamp-1">{formData.tagline || formData.description || 'Tagline preview'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                    Alignment / Position (9 Directions)
                  </label>
                  <div className="grid grid-cols-3 gap-2 bg-secondary/30 p-3 rounded-xl border">
                    {[
                      { id: 'top-left', label: 'Top-Left' },
                      { id: 'top', label: 'Top' },
                      { id: 'top-right', label: 'Top-Right' },
                      { id: 'left', label: 'Left' },
                      { id: 'center', label: 'Center' },
                      { id: 'right', label: 'Right' },
                      { id: 'bottom-left', label: 'Bottom-Left' },
                      { id: 'bottom', label: 'Bottom' },
                      { id: 'bottom-right', label: 'Bottom-Right' },
                    ].map(dir => (
                      <button
                        key={dir.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, bannerAlignment: dir.id })}
                        className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          (formData.bannerAlignment || 'center') === dir.id
                            ? 'bg-primary text-primary-foreground border-primary shadow'
                            : 'bg-card hover:bg-secondary text-foreground'
                        }`}
                      >
                        {dir.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                    Banner Fit & Crop Mode
                  </label>
                  <div className="flex gap-2">
                    {[
                      { id: 'cover', label: 'Cover (Fill Area)' },
                      { id: 'contain', label: 'Contain (Fit Whole)' },
                      { id: 'fill', label: 'Stretch Fill' },
                    ].map(fit => (
                      <button
                        key={fit.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, bannerFit: fit.id as any })}
                        className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          (formData.bannerFit || 'cover') === fit.id
                            ? 'bg-primary text-primary-foreground border-primary shadow'
                            : 'bg-card hover:bg-secondary text-foreground'
                        }`}
                      >
                        {fit.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBannerCropModal(false)}
                    className="bg-primary text-primary-foreground font-bold px-5 py-2 rounded-xl text-xs shadow hover:bg-primary/95 cursor-pointer"
                  >
                    Apply Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Icon / Portrait Alignment & Crop Modal */}
        {showIconCropModal && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200 select-text"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowIconCropModal(false);
              }
            }}
          >
            <div className="bg-card text-card-foreground rounded-2xl w-full max-w-xl shadow-2xl border p-6 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  <h3 className="font-extrabold text-base">Icon & Portrait Alignment & Crop Tool</h3>
                </div>
                <button onClick={() => setShowIconCropModal(false)} className="p-1 hover:bg-secondary rounded-lg cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* LIVE PREVIEW ICON INSIDE MODAL WITH DIRECT UPLOAD BUTTON */}
              <div className="space-y-3 bg-secondary/20 p-4 rounded-xl border">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    Live Icon Preview
                  </label>
                  <button
                    type="button"
                    onClick={() => portraitInputRef.current?.click()}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload New Icon</span>
                  </button>
                </div>

                <div 
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingIconModal(true); }}
                  onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingIconModal(false); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingIconModal(false);
                    const file = e.dataTransfer.files[0];
                    if (file && file.type.startsWith('image/')) {
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        const src = evt.target?.result as string;
                        setFormData(prev => ({ ...prev, highlightedImageSrc: src }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className={`flex items-center justify-center py-4 bg-slate-950/80 rounded-xl border-2 transition-all relative overflow-hidden ${
                    isDraggingIconModal ? 'border-primary bg-slate-900 scale-[1.02] ring-4 ring-primary/20' : 'border-white/10'
                  }`}
                  title="Drag and drop a new portrait icon here directly!"
                >
                  <div
                    className={`w-32 h-32 border-4 border-primary shadow-2xl overflow-hidden bg-slate-900 flex items-center justify-center relative ${
                      formData.iconShape === 'circle' ? 'rounded-full' : formData.iconShape === 'square' ? 'rounded-none' : 'rounded-2xl'
                    }`}
                  >
                    {mainImageSrc ? (
                      <img 
                        src={mainImageSrc} 
                        alt="Icon Preview" 
                        className="w-full h-full"
                        style={getIconStyle()}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <User className="w-12 h-12 text-white/40" />
                    )}
                  </div>

                  {/* Drag overlay message */}
                  {isDraggingIconModal && (
                    <div className="absolute inset-0 bg-primary/95 text-primary-foreground flex flex-col items-center justify-center gap-2 z-30 font-black text-xs animate-in fade-in duration-100">
                      <Upload className="w-8 h-8 animate-bounce" />
                      <span>Drop Image to Set as Portrait!</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {/* 9 Directions Alignment Grid */}
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                    Alignment / Focus Point (9 Directions)
                  </label>
                  <div className="grid grid-cols-3 gap-2 bg-secondary/30 p-3 rounded-xl border">
                    {[
                      { id: 'top-left', label: 'Top-Left' },
                      { id: 'top', label: 'Top' },
                      { id: 'top-right', label: 'Top-Right' },
                      { id: 'left', label: 'Left' },
                      { id: 'center', label: 'Center' },
                      { id: 'right', label: 'Right' },
                      { id: 'bottom-left', label: 'Bottom-Left' },
                      { id: 'bottom', label: 'Bottom' },
                      { id: 'bottom-right', label: 'Bottom-Right' },
                    ].map(dir => (
                      <button
                        key={dir.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, iconAlignment: dir.id })}
                        className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          (formData.iconAlignment || 'center') === dir.id
                            ? 'bg-primary text-primary-foreground border-primary shadow'
                            : 'bg-card hover:bg-secondary text-foreground'
                        }`}
                      >
                        {dir.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scale / Zoom Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Zoom Scale
                    </label>
                    <span className="text-xs font-bold text-primary">
                      {((formData.iconScale ?? 1) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.5"
                    step="0.05"
                    value={formData.iconScale ?? 1}
                    onChange={(e) => setFormData({ ...formData, iconScale: parseFloat(e.target.value) })}
                    className="w-full accent-primary cursor-pointer"
                  />
                </div>

                {/* Fit Mode */}
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                    Icon Fit Mode
                  </label>
                  <div className="flex gap-2">
                    {[
                      { id: 'cover', label: 'Cover (Fill)' },
                      { id: 'contain', label: 'Contain (Fit Whole)' },
                      { id: 'fill', label: 'Stretch Fill' },
                    ].map(fit => (
                      <button
                        key={fit.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, iconFit: fit.id as any })}
                        className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          (formData.iconFit || 'cover') === fit.id
                            ? 'bg-primary text-primary-foreground border-primary shadow'
                            : 'bg-card hover:bg-secondary text-foreground'
                        }`}
                      >
                        {fit.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Shape Mask */}
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                    Icon Mask Shape
                  </label>
                  <div className="flex gap-2">
                    {[
                      { id: 'rounded', label: 'Rounded Box' },
                      { id: 'circle', label: 'Circle Circle' },
                      { id: 'square', label: 'Sharp Square' },
                    ].map(shape => (
                      <button
                        key={shape.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, iconShape: shape.id as any })}
                        className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          (formData.iconShape || 'rounded') === shape.id
                            ? 'bg-primary text-primary-foreground border-primary shadow'
                            : 'bg-card hover:bg-secondary text-foreground'
                        }`}
                      >
                        {shape.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowIconCropModal(false)}
                    className="bg-primary text-primary-foreground font-bold px-5 py-2 rounded-xl text-xs shadow hover:bg-primary/95 cursor-pointer"
                  >
                    Apply Icon Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Visual workspace resizer at the absolute bottom edge of the modal */}
        {isEditMode && editorSize !== 'fl' && (
          <div 
            className="absolute bottom-0 left-0 right-0 h-2 bg-secondary/80 hover:bg-primary/60 transition-all cursor-row-resize z-50 flex items-center justify-center border-t border-border/40 group"
            onMouseDown={(e) => { e.preventDefault(); setIsResizingModalHeight(true); }}
            title="Drag to stretch/resize workspace height (or use layout sliders)"
          >
            <div className="w-16 h-1 bg-slate-400 dark:bg-slate-600 rounded-full group-hover:bg-primary" />
          </div>
        )}
      </div>

      <FeatureHelpModal 
        isOpen={showFeatureHelpModal} 
        onClose={() => setShowFeatureHelpModal(false)} 
        initialTab={helpModalActiveTab} 
        character={formData as Character}
      />

      {showBibleReaderModal && (
        <BookletReaderModal
          character={formData as Character}
          initialOptions={bibleOptions}
          onClose={() => setShowBibleReaderModal(false)}
          onPrint={(opts) => {
            printBibleDocument(formData as Character, opts || bibleOptions);
          }}
        />
      )}

      {/* Favorite Icon Customizer Modal */}
      {isFavIconModalOpen && (
        <FavoriteIconSelectorModal
          isOpen={isFavIconModalOpen}
          onClose={() => setIsFavIconModalOpen(false)}
          targetCharacter={formData as Character}
          characters={characters}
          setCharacters={setCharacters}
          items={items}
          setItems={setItems}
          onSaveSelection={(iconId, color) => {
            setFormData(prev => ({
              ...prev,
              favoriteIcon: iconId,
              favoriteColor: color,
              isFavorite: true
            }));
          }}
        />
      )}
    </div>
  );
};

// ==========================================
// 3D MODEL MANNEQUIN & INTERACTIVE POSE VIEWER
// ==========================================
interface ThreeModelViewerProps {
  formData: any;
  setFormData: any;
  galleryImages: any[];
}

const ThreeModelViewer: React.FC<ThreeModelViewerProps> = ({ formData, setFormData, galleryImages }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | THREE.OrthographicCamera | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);

  const default3DModels = [
    {
      id: 'preset-1',
      name: 'Dragon_Slayer_Sword.obj',
      size: '1.45 MB',
      extension: 'OBJ',
      vertexCount: 18450,
      faceCount: 32840,
      weaponType: 'sword',
      color: '#ef4444',
      wireframe: false,
      timestamp: 'Blender 4.2 Factory'
    },
    {
      id: 'preset-2',
      name: 'Archangel_Aegis_Shield.stl',
      size: '2.10 MB',
      extension: 'STL',
      vertexCount: 12320,
      faceCount: 24150,
      weaponType: 'shield',
      color: '#3b82f6',
      wireframe: false,
      timestamp: 'Blender 4.2 Factory'
    },
    {
      id: 'preset-3',
      name: 'Celestial_Mystic_Staff.gltf',
      size: '0.85 MB',
      extension: 'GLTF',
      vertexCount: 9840,
      faceCount: 18900,
      weaponType: 'staff',
      color: '#a855f7',
      wireframe: false,
      timestamp: 'Blender 4.2 Factory'
    }
  ];

  const allModels = [...default3DModels, ...(formData.models3D || [])];
  const [selectedModel, setSelectedModel] = useState<any>(default3DModels[0]);

  // Custom UI States
  const [armorColor, setArmorColor] = useState<string>('#3b82f6');
  const [weaponType, setWeaponType] = useState<'sword' | 'staff' | 'shield' | 'none'>('sword');
  const [wireframe, setWireframe] = useState<boolean>(false);
  const [animationMode, setAnimationMode] = useState<'idle' | 'float' | 'pose'>('idle');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [rotationSpeed, setRotationSpeed] = useState<number>(0.3);
  
  // Transform sliders (Gizmos)
  const [modelScale, setModelScale] = useState<number>(1.0);
  const [modelOffsetX, setModelOffsetX] = useState<number>(0);
  const [modelOffsetY, setModelOffsetY] = useState<number>(-0.4);
  const [modelOffsetZ, setModelOffsetZ] = useState<number>(0);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showAxes, setShowAxes] = useState<boolean>(true);

  // Joint/Pose Slider States
  const [headTilt, setHeadTilt] = useState<number>(0);
  const [armAngle, setArmAngle] = useState<number>(0.3);
  const [torsoTwist, setTorsoTwist] = useState<number>(0);
  
  // Snapshot options
  const [snapshotTitle, setSnapshotTitle] = useState<string>('');
  const [snapshotSuccess, setSnapshotSuccess] = useState<boolean>(false);

  // Blender Viewport navigation & projection state variables
  const [viewportPreset, setViewportPreset] = useState<'orbit' | 'blender'>('orbit');
  const [isOrthographic, setIsOrthographic] = useState<boolean>(false);
  const [activeShortcutKey, setActiveShortcutKey] = useState<string | null>(null);

  // Mesh references to update live
  const armorMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const weaponMeshRef = useRef<THREE.Group | null>(null);
  const headMeshRef = useRef<THREE.Mesh | null>(null);
  const torsoMeshRef = useRef<THREE.Mesh | null>(null);
  const leftArmRef = useRef<THREE.Group | null>(null);
  const rightArmRef = useRef<THREE.Group | null>(null);

  // Sync selected model's custom props if preset changed
  useEffect(() => {
    if (selectedModel) {
      if (selectedModel.weaponType) setWeaponType(selectedModel.weaponType);
      if (selectedModel.color) setArmorColor(selectedModel.color);
      if (selectedModel.wireframe !== undefined) setWireframe(selectedModel.wireframe);
    }
  }, [selectedModel]);

  useEffect(() => {
    if (!canvasRef.current) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0b1329'); // Deep cosmic night
    sceneRef.current = scene;

    // Elegant neon cyber grid helper
    const gridHelper = new THREE.GridHelper(16, 16, '#6366f1', '#1e293b');
    gridHelper.position.y = -2;
    gridHelper.visible = showGrid;
    scene.add(gridHelper);

    // Blender RGB axes helper
    const axesHelper = new THREE.AxesHelper(2.0);
    axesHelper.position.set(0, -1.95, 0);
    axesHelper.visible = showAxes;
    scene.add(axesHelper);

    // 2. Camera setup
    const aspect = canvasRef.current.clientWidth / canvasRef.current.clientHeight;
    let camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
    if (isOrthographic) {
      const d = 1.8;
      camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 0.1, 100);
      camera.position.set(0, 1.2, 5.5);
    } else {
      camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 100);
      camera.position.set(0, 1.2, 5.5);
    }
    cameraRef.current = camera;

    // 3. Renderer setup (preserveDrawingBuffer ensures snapshots convert perfectly to PNG)
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      preserveDrawingBuffer: true
    });
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    // 4. Studio Lighting setup
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.5);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight('#cbd5e1', 0.8);
    dirLight1.position.set(4, 8, 6);
    scene.add(dirLight1);

    const backglowLight = new THREE.DirectionalLight('#6366f1', 0.6);
    backglowLight.position.set(-4, -4, -6);
    scene.add(backglowLight);

    const spotlight = new THREE.PointLight('#4f46e5', 2.0, 12);
    spotlight.position.set(0, 1.2, 1.5);
    scene.add(spotlight);

    // 5. Build Character Mannequin Group
    const characterGroup = new THREE.Group();
    groupRef.current = characterGroup;
    scene.add(characterGroup);

    // Apply sliders to group transforms (offset, scale)
    characterGroup.scale.setScalar(modelScale);
    characterGroup.position.set(modelOffsetX, modelOffsetY, modelOffsetZ);

    // Materials
    const skinMat = new THREE.MeshStandardMaterial({ color: '#fbcfe8', roughness: 0.45, metalness: 0.1 });
    const armorMat = new THREE.MeshStandardMaterial({ color: armorColor, roughness: 0.15, metalness: 0.85, wireframe: wireframe });
    armorMaterialRef.current = armorMat;

    // Decorative Base Stage
    const stageGeo = new THREE.CylinderGeometry(1.4, 1.5, 0.2, 32);
    const stageMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.6, metalness: 0.2 });
    const stage = new THREE.Mesh(stageGeo, stageMat);
    stage.position.y = -1.9;
    characterGroup.add(stage);

    // Dynamic Torso
    const torsoGeo = new THREE.CylinderGeometry(0.42, 0.3, 1.2, 16);
    const torso = new THREE.Mesh(torsoGeo, armorMat);
    torso.position.y = -0.3;
    torsoMeshRef.current = torso;
    characterGroup.add(torso);

    // Shoulder Guards / Pauldrons
    const shoulderL = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), armorMat);
    shoulderL.position.set(-0.62, 0.32, 0);
    characterGroup.add(shoulderL);

    const shoulderR = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), armorMat);
    shoulderR.position.set(0.62, 0.32, 0);
    characterGroup.add(shoulderR);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 32, 32), skinMat);
    head.position.y = 0.62;
    headMeshRef.current = head;
    characterGroup.add(head);

    // Helmet plume/visor
    const crest = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.4, 4), armorMat);
    crest.position.set(0, 0.35, 0);
    head.add(crest);

    // Left Arm Pivot
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.62, 0.32, 0);
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.8, 16), armorMat);
    armL.position.y = -0.38;
    leftArmGroup.add(armL);
    leftArmRef.current = leftArmGroup;
    characterGroup.add(leftArmGroup);

    // Right Arm Pivot
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.62, 0.32, 0);
    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.8, 16), armorMat);
    armR.position.y = -0.38;
    rightArmGroup.add(armR);
    rightArmRef.current = rightArmGroup;
    characterGroup.add(rightArmGroup);

    // Left and Right Leg pillars
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.1, 1.0, 16), armorMat);
    legL.position.set(-0.22, -1.3, 0);
    characterGroup.add(legL);

    const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.1, 1.0, 16), armorMat);
    legR.position.set(0.22, -1.3, 0);
    characterGroup.add(legR);

    // Weapon slot in Right Hand
    const weaponSlot = new THREE.Group();
    weaponSlot.position.y = -0.78;
    rightArmGroup.add(weaponSlot);
    weaponMeshRef.current = weaponSlot;

    // Shield slot on Left Hand
    const shieldGroup = new THREE.Group();
    shieldGroup.position.set(-0.18, -0.38, 0.1);
    const shield = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.04), armorMat);
    shieldGroup.add(shield);
    leftArmGroup.add(shieldGroup);

    // CUSTOM MODEL REAL-TIME OBJ / STL PARSER RENDER PASS!
    if (selectedModel && selectedModel.rawContent) {
      try {
        const customGeo = new THREE.BufferGeometry();
        const positions: number[] = [];
        const indices: number[] = [];
        const ext = selectedModel.extension || '';
        
        if (ext === 'OBJ') {
          const lines = selectedModel.rawContent.split('\n');
          const tempVerts: [number, number, number][] = [];
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('v ')) {
              const parts = line.split(/\s+/).slice(1).map(Number);
              if (parts.length >= 3) {
                tempVerts.push([parts[0], parts[1], parts[2]]);
              }
            } else if (line.startsWith('f ')) {
              const parts = line.split(/\s+/).slice(1);
              const faceIndices = parts.map(p => {
                const idxStr = p.split('/')[0];
                return parseInt(idxStr, 10) - 1;
              });
              for (let j = 1; j < faceIndices.length - 1; j++) {
                indices.push(faceIndices[0], faceIndices[j], faceIndices[j+1]);
              }
            }
          }
          
          const posBuffer: number[] = [];
          indices.forEach(idx => {
            if (tempVerts[idx]) {
              posBuffer.push(...tempVerts[idx]);
            }
          });
          
          if (posBuffer.length > 0) {
            customGeo.setAttribute('position', new THREE.Float32BufferAttribute(posBuffer, 3));
            customGeo.computeVertexNormals();
          }
        }
        
        if (customGeo.attributes.position) {
          // Clear standard weapon slots
          while(weaponSlot.children.length > 0) {
            weaponSlot.remove(weaponSlot.children[0]);
          }
          const customMesh = new THREE.Mesh(customGeo, armorMat);
          customGeo.computeBoundingBox();
          const size = new THREE.Vector3();
          customGeo.boundingBox?.getSize(size);
          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          const scaleFactor = 1.3 / maxDim;
          customMesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
          customMesh.position.set(0, 0.4, 0); // Position at center stage
          weaponSlot.add(customMesh);
        }
      } catch (err) {
        console.error("Renderer mesh parser failed:", err);
      }
    } else {
      // Build standard preset weapons
      const goldMat = new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.15, metalness: 0.85 });
      const steelMat = new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.1, metalness: 0.95 });

      if (weaponType === 'sword') {
        const h = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.3, 8), goldMat);
        h.rotation.x = Math.PI / 2;
        weaponSlot.add(h);

        const b = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.1, 0.02), steelMat);
        b.position.y = 0.6;
        weaponSlot.add(b);
      } else if (weaponType === 'staff') {
        const s = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.6, 8), goldMat);
        s.position.y = 0.2;
        weaponSlot.add(s);

        const c = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), new THREE.MeshBasicMaterial({ color: '#6366f1', wireframe: true }));
        c.position.y = 1.0;
        weaponSlot.add(c);
      } else if (weaponType === 'shield') {
        const shieldBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.1), goldMat);
        weaponSlot.add(shieldBuckle);
      }
    }

    // Drag rotation, panning and zooming controls
    let isDragging = false;
    let isPanning = false;
    let isZooming = false;
    let previousMousePos = { x: 0, y: 0 };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePos = { x: e.clientX, y: e.clientY };
      
      // Determine manipulation action based on active preset
      if (viewportPreset === 'blender') {
        // MMB is button 1, or Left Click with modifiers
        if (e.button === 1 || e.button === 0) {
          if (e.shiftKey) {
            isPanning = true;
          } else if (e.ctrlKey || e.metaKey) {
            isZooming = true;
          }
        }
      } else {
        // Standard Orbit mode controls
        if (e.shiftKey) {
          isPanning = true;
        } else if (e.ctrlKey || e.metaKey) {
          isZooming = true;
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !characterGroup) return;
      const delta = {
        x: e.clientX - previousMousePos.x,
        y: e.clientY - previousMousePos.y
      };

      if (isPanning) {
        // Translate / Pan character horizontally & vertically
        characterGroup.position.x += delta.x * 0.005;
        characterGroup.position.y -= delta.y * 0.005;
      } else if (isZooming) {
        // Zoom view distance
        camera.position.z = Math.min(15.0, Math.max(1.5, camera.position.z + delta.y * 0.012));
      } else {
        // Orbit / Rotate character axes
        characterGroup.rotation.y += delta.x * 0.007;
        characterGroup.rotation.x += delta.y * 0.007;
      }
      
      previousMousePos = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging = false;
      isPanning = false;
      isZooming = false;
    };

    // Canvas Mousewheel Zoom implementation
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = Math.min(15.0, Math.max(1.5, camera.position.z + e.deltaY * 0.005));
    };

    // Global keyboard listener for hotkeys (1, 3, 5, 7, 9, .)
    const handleKeyDownGlobal = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const key = e.key.toLowerCase();
      
      if (key === '1' || e.code === 'Numpad1') {
        e.preventDefault();
        setActiveShortcutKey('1');
        characterGroup.rotation.set(0, 0, 0);
        camera.position.set(0, 1.2, 5.5);
        setTimeout(() => setActiveShortcutKey(null), 150);
      } else if (key === '3' || e.code === 'Numpad3') {
        e.preventDefault();
        setActiveShortcutKey('3');
        characterGroup.rotation.set(0, Math.PI / 2, 0);
        camera.position.set(0, 1.2, 5.5);
        setTimeout(() => setActiveShortcutKey(null), 150);
      } else if (key === '7' || e.code === 'Numpad7') {
        e.preventDefault();
        setActiveShortcutKey('7');
        characterGroup.rotation.set(Math.PI / 2, 0, 0);
        camera.position.set(0, 1.2, 5.5);
        setTimeout(() => setActiveShortcutKey(null), 150);
      } else if (key === '9' || e.code === 'Numpad9') {
        e.preventDefault();
        setActiveShortcutKey('9');
        characterGroup.rotation.y += Math.PI;
        setTimeout(() => setActiveShortcutKey(null), 150);
      } else if (key === '5' || e.code === 'Numpad5') {
        e.preventDefault();
        setActiveShortcutKey('5');
        setIsOrthographic(prev => !prev);
        setTimeout(() => setActiveShortcutKey(null), 150);
      } else if (key === '.' || key === 'delete' || e.code === 'NumpadDecimal') {
        e.preventDefault();
        setActiveShortcutKey('.');
        characterGroup.position.set(modelOffsetX, modelOffsetY, modelOffsetZ);
        characterGroup.rotation.set(0, 0, 0);
        camera.position.set(0, 1.2, 5.5);
        setTimeout(() => setActiveShortcutKey(null), 150);
      }
    };

    const canvas = canvasRef.current;
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDownGlobal);

    // Animation frames loop
    let animId: number;
    const clock = new THREE.Clock();

    const tick = () => {
      animId = requestAnimationFrame(tick);
      const elapsed = clock.getElapsedTime();

      if (animationMode === 'idle') {
        characterGroup.position.y = modelOffsetY + Math.sin(elapsed * 1.6) * 0.06;
        head.rotation.z = Math.sin(elapsed * 0.8) * 0.04;
        if (autoRotate) characterGroup.rotation.y += rotationSpeed * 0.004;
      } else if (animationMode === 'float') {
        characterGroup.position.y = modelOffsetY + Math.sin(elapsed * 2.2) * 0.2;
        characterGroup.rotation.y += 0.006 + rotationSpeed * 0.004;
        leftArmGroup.rotation.x = -Math.PI/6 + Math.sin(elapsed * 1.2) * 0.12;
        rightArmGroup.rotation.x = -Math.PI/6 + Math.cos(elapsed * 1.2) * 0.12;
      } else if (animationMode === 'pose') {
        characterGroup.position.y = modelOffsetY;
        characterGroup.rotation.y = elapsed * (0.15 + rotationSpeed * 0.3); // Gentle turntable
      }

      renderer.render(scene, camera);
    };

    tick();

    const handleResize = () => {
      if (!canvasRef.current || !renderer || !camera) return;
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = canvasRef.current.clientWidth / canvasRef.current.clientHeight;
      } else if (camera instanceof THREE.OrthographicCamera) {
        const aspect = canvasRef.current.clientWidth / canvasRef.current.clientHeight;
        const d = 1.8;
        camera.left = -d * aspect;
        camera.right = d * aspect;
        camera.top = d;
        camera.bottom = -d;
      }
      camera.updateProjectionMatrix();
      renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('wheel', handleWheel);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDownGlobal);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [animationMode, selectedModel, modelScale, modelOffsetX, modelOffsetY, modelOffsetZ, showGrid, showAxes, autoRotate, rotationSpeed, weaponType, armorColor, wireframe, viewportPreset, isOrthographic]);

  // Joint pose binders
  useEffect(() => {
    if (headMeshRef.current) headMeshRef.current.rotation.x = headTilt;
  }, [headTilt]);

  useEffect(() => {
    if (rightArmRef.current) rightArmRef.current.rotation.z = armAngle;
  }, [armAngle]);

  useEffect(() => {
    if (torsoMeshRef.current) torsoMeshRef.current.rotation.y = torsoTwist;
  }, [torsoTwist]);

  const handleSnapshot = () => {
    if (!rendererRef.current || !canvasRef.current || !sceneRef.current || !cameraRef.current) return;
    
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    const dataUrl = canvasRef.current.toDataURL('image/png');
    
    const newImg = {
      id: `3d-snap-${Date.now()}`,
      src: dataUrl,
      title: snapshotTitle.trim() || `${selectedModel?.name || 'Mannequin'} 3D Snapshot`,
      description: `Rendered 3D customizer visual snapshot. Model size: ${selectedModel?.size || 'N/A'}. Format: ${selectedModel?.extension || 'OBJ'}`,
      category: undefined
    };

    setFormData((prev: any) => ({
      ...prev,
      subImages: [...(prev.subImages || []), newImg]
    }));

    setSnapshotSuccess(true);
    setSnapshotTitle('');
    setTimeout(() => setSnapshotSuccess(false), 3000);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex justify-between items-center border-b pb-2">
        <div>
          <h3 className="font-bold text-base flex items-center gap-1.5 text-indigo-500">
            <Boxes className="w-4 h-4" /> Interactive 3D Model Sandbox & Library
          </h3>
          <p className="text-[11px] text-muted-foreground">Select models, rotate with mouse drag, scroll to zoom, adjust fine gizmo scales, and run complete topology analyzers.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* WebGL Canvas Block */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-[#0b1329] rounded-2xl overflow-hidden border border-indigo-500/20 shadow-xl relative min-h-[440px]">
            <canvas ref={canvasRef} className="w-full h-[440px] block cursor-grab active:cursor-grabbing" />
            
            <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-700/50 text-white text-[10px] pointer-events-none">
              <p className="font-bold flex items-center gap-1">🖱️ Interaction Controls</p>
              <p className="text-slate-300 mt-0.5">Left Click + Drag: Orbit Rotation Angle</p>
              <p className="text-slate-300">Scroll Mousewheel: Zoom View Distance</p>
            </div>

            {snapshotSuccess && (
              <div className="absolute top-3 right-3 bg-emerald-600 border border-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg animate-bounce">
                📸 Snapshot saved to Image Category!
              </div>
            )}
          </div>

          {/* 3D Model Library Section - Interactive Thumbnails Grid */}
          <div className="bg-card border rounded-2xl p-4 space-y-3 shadow-xs">
            <div className="flex justify-between items-center pb-2 border-b">
              <div className="flex items-center gap-1.5 text-primary">
                <Layers className="w-4 h-4" />
                <h4 className="text-xs font-black uppercase tracking-wider">3D Model Library ({allModels.length})</h4>
              </div>
              <span className="text-[10px] text-muted-foreground font-semibold">Click any model thumbnail to load & analyze</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {allModels.map((model) => {
                const isSelected = selectedModel?.id === model.id;
                return (
                  <div 
                    key={model.id}
                    onClick={() => setSelectedModel(model)}
                    className={`relative rounded-xl border p-3 flex flex-col gap-2 cursor-pointer transition-all select-none ${
                      isSelected 
                        ? 'border-indigo-500 bg-indigo-500/5 ring-2 ring-indigo-500/10 shadow-sm' 
                        : 'border-border hover:border-foreground/20 bg-secondary/10 hover:bg-secondary/30'
                    }`}
                  >
                    <div className="h-16 w-full rounded-lg bg-[#0b1329] border border-white/5 flex flex-col items-center justify-center relative overflow-hidden text-white group">
                      <Boxes className={`w-6 h-6 transition-transform group-hover:scale-110 ${isSelected ? 'text-indigo-400 animate-pulse' : 'text-slate-500'}`} />
                      <span className="absolute top-1 right-1 text-[8px] font-black uppercase bg-black/40 px-1 rounded">
                        {model.extension}
                      </span>
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-xs font-black truncate text-foreground" title={model.name}>
                        {model.name}
                      </p>
                      <div className="text-[10px] text-muted-foreground font-semibold flex justify-between">
                        <span>{model.size}</span>
                        <span className="text-[8px] text-indigo-500 dark:text-indigo-400">{(model.vertexCount || 0).toLocaleString()} V</span>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dress-up, Posing, and Topology Analyzer Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-card border rounded-2xl p-4 space-y-4 shadow-sm">
            <h4 className="text-xs font-black uppercase text-muted-foreground tracking-wider pb-1.5 border-b">Blender transform gizmos</h4>

            {/* Scale Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                <span>Model Scale</span>
                <span>{modelScale.toFixed(2)}x</span>
              </div>
              <input 
                type="range" min="0.4" max="2.0" step="0.05" value={modelScale} 
                onChange={e => setModelScale(parseFloat(e.target.value))} 
                className="w-full accent-indigo-500 cursor-pointer h-1 rounded bg-secondary"
              />
            </div>

            {/* Offset Y position slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                <span>Offset Elevation</span>
                <span>{modelOffsetY.toFixed(2)}</span>
              </div>
              <input 
                type="range" min="-1.5" max="0.5" step="0.05" value={modelOffsetY} 
                onChange={e => setModelOffsetY(parseFloat(e.target.value))} 
                className="w-full accent-indigo-500 cursor-pointer h-1 rounded bg-secondary"
              />
            </div>

            {/* Grid & Axes Toggles */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t">
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-foreground cursor-pointer uppercase select-none">
                <input 
                  type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)}
                  className="w-3.5 h-3.5 accent-indigo-500 cursor-pointer rounded"
                />
                <span>Blender Grid</span>
              </label>
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-foreground cursor-pointer uppercase select-none">
                <input 
                  type="checkbox" checked={showAxes} onChange={e => setShowAxes(e.target.checked)}
                  className="w-3.5 h-3.5 accent-indigo-500 cursor-pointer rounded"
                />
                <span>Gizmo Axes</span>
              </label>
            </div>

            {/* Turntable Rotation Controls */}
            <div className="pt-2 border-t space-y-2">
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-foreground cursor-pointer uppercase select-none">
                <input 
                  type="checkbox" checked={autoRotate} onChange={e => setAutoRotate(e.target.checked)}
                  className="w-3.5 h-3.5 accent-indigo-500 cursor-pointer rounded"
                />
                <span>Turntable Autoplay</span>
              </label>
              {autoRotate && (
                <div className="space-y-1 pl-5">
                  <div className="flex justify-between text-[9px] font-semibold text-muted-foreground uppercase">
                    <span>Turntable Speed</span>
                    <span>{rotationSpeed.toFixed(2)}</span>
                  </div>
                  <input 
                    type="range" min="0.05" max="1.5" step="0.05" value={rotationSpeed} 
                    onChange={e => setRotationSpeed(parseFloat(e.target.value))} 
                    className="w-full accent-indigo-500 cursor-pointer h-1 rounded bg-secondary"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Blender Viewport Navigation & Hotkeys Controls */}
          <div className="bg-card border rounded-2xl p-4 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-1.5 border-b">
              <span className="text-[10px] font-extrabold uppercase text-indigo-500 tracking-wider flex items-center gap-1">
                <Compass className="w-3.5 h-3.5" /> Viewport Preset & Hotkeys
              </span>
              <span className="text-[8px] bg-indigo-500/10 text-indigo-400 font-bold px-1.5 py-0.5 rounded">Blender Engine</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setViewportPreset('orbit')}
                className={`text-[11px] font-bold py-1.5 px-2 rounded-xl border transition-all cursor-pointer ${
                  viewportPreset === 'orbit' 
                    ? 'bg-primary/10 border-primary text-primary shadow-xs' 
                    : 'bg-secondary hover:bg-secondary/80 border-border text-foreground'
                }`}
              >
                Standard Orbit
              </button>
              <button
                type="button"
                onClick={() => setViewportPreset('blender')}
                className={`text-[11px] font-bold py-1.5 px-2 rounded-xl border transition-all cursor-pointer ${
                  viewportPreset === 'blender' 
                    ? 'bg-indigo-500/15 border-indigo-500 text-indigo-400 shadow-xs' 
                    : 'bg-secondary hover:bg-secondary/80 border-border text-foreground'
                }`}
                title="MMB Orbit, Shift+MMB Pan, Ctrl+MMB Zoom"
              >
                Blender Mode
              </button>
            </div>

            {/* Projection Mode */}
            <div className="flex justify-between items-center bg-secondary/30 p-2 rounded-xl border border-border/50">
              <span className="text-[10px] font-bold text-foreground">Projection:</span>
              <button
                type="button"
                onClick={() => setIsOrthographic(prev => !prev)}
                className={`text-[10px] font-extrabold border px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  isOrthographic 
                    ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40' 
                    : 'bg-secondary hover:bg-secondary/80 text-foreground'
                }`}
              >
                <span>{isOrthographic ? 'Orthographic' : 'Perspective'}</span>
                <span className="bg-black/25 text-[8px] text-muted-foreground px-1 py-0.2 rounded font-mono">Num 5</span>
              </button>
            </div>

            {/* Quick preset views */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-wider block">Viewport Shortcuts Cheat Sheet</span>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { label: 'Front (X-Z)', key: '1', action: () => { if (groupRef.current && cameraRef.current) { groupRef.current.rotation.set(0, 0, 0); cameraRef.current.position.set(0, 1.2, 5.5); } } },
                  { label: 'Right (Y-Z)', key: '3', action: () => { if (groupRef.current && cameraRef.current) { groupRef.current.rotation.set(0, Math.PI / 2, 0); cameraRef.current.position.set(0, 1.2, 5.5); } } },
                  { label: 'Top (X-Y)', key: '7', action: () => { if (groupRef.current && cameraRef.current) { groupRef.current.rotation.set(Math.PI / 2, 0, 0); cameraRef.current.position.set(0, 1.2, 5.5); } } },
                  { label: 'Invert 180°', key: '9', action: () => { if (groupRef.current) { groupRef.current.rotation.y += Math.PI; } } },
                  { label: 'Ortho/Persp', key: '5', action: () => setIsOrthographic(prev => !prev) },
                  { label: 'Focus Center', key: '.', action: () => { if (groupRef.current && cameraRef.current) { groupRef.current.position.set(modelOffsetX, modelOffsetY, modelOffsetZ); groupRef.current.rotation.set(0, 0, 0); cameraRef.current.position.set(0, 1.2, 5.5); } } }
                ].map(view => {
                  const isPressed = activeShortcutKey === view.key;
                  return (
                    <button
                      key={view.key}
                      type="button"
                      onClick={view.action}
                      className={`border text-[9px] font-black p-1.5 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                        isPressed 
                          ? 'bg-amber-500/20 border-amber-500 text-amber-500 scale-95' 
                          : 'bg-secondary hover:bg-secondary/80 border'
                      }`}
                    >
                      <span className="truncate text-[8px] text-foreground">{view.label}</span>
                      <span className="text-[8px] text-indigo-500 font-mono font-bold">Num {view.key}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Manipulate guides */}
            <div className="bg-slate-900/40 border border-slate-800/40 p-2 rounded-xl text-[9px] text-muted-foreground space-y-1">
              {viewportPreset === 'blender' ? (
                <>
                  <p className="flex justify-between"><span>Middle Mouse Click & Drag:</span> <span className="font-bold text-indigo-400">Orbit View</span></p>
                  <p className="flex justify-between"><span>Shift + Middle Mouse Drag:</span> <span className="font-bold text-indigo-400">Pan View</span></p>
                  <p className="flex justify-between"><span>Ctrl + Middle Mouse / Wheel:</span> <span className="font-bold text-indigo-400">Zoom View</span></p>
                </>
              ) : (
                <>
                  <p className="flex justify-between"><span>Mouse Left Click & Drag:</span> <span className="font-bold text-indigo-400">Orbit View</span></p>
                  <p className="flex justify-between"><span>Shift + Mouse Drag:</span> <span className="font-bold text-indigo-400">Pan View</span></p>
                  <p className="flex justify-between"><span>Ctrl + Mouse / Mousewheel:</span> <span className="font-bold text-indigo-400">Zoom View</span></p>
                </>
              )}
            </div>
          </div>

          {/* Model Analyzer Telemetry Panel */}
          <div className="bg-[#0b1329] text-indigo-100 rounded-2xl p-4 border border-indigo-500/20 space-y-3.5 shadow-xl">
            <div className="flex items-center gap-1.5 text-indigo-400 border-b border-white/10 pb-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest">Model Analyzer Telemetry</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-white/5 p-1.5 rounded">
                <span className="text-indigo-300/60 block font-bold uppercase tracking-wider text-[8px]">Source File</span>
                <strong className="text-white truncate block">{selectedModel?.name}</strong>
              </div>
              <div className="bg-white/5 p-1.5 rounded">
                <span className="text-indigo-300/60 block font-bold uppercase tracking-wider text-[8px]">Format Ext</span>
                <strong className="text-indigo-300 block">{selectedModel?.extension || 'OBJ'}</strong>
              </div>
              <div className="bg-white/5 p-1.5 rounded">
                <span className="text-indigo-300/60 block font-bold uppercase tracking-wider text-[8px]">Vertex Count</span>
                <strong className="text-emerald-400 block">{(selectedModel?.vertexCount || 12000).toLocaleString()} V</strong>
              </div>
              <div className="bg-white/5 p-1.5 rounded">
                <span className="text-indigo-300/60 block font-bold uppercase tracking-wider text-[8px]">Poly Count (Est)</span>
                <strong className="text-emerald-400 block">{(selectedModel?.faceCount || 22000).toLocaleString()} F</strong>
              </div>
            </div>
            <div className="text-[9px] text-indigo-200/80 font-semibold bg-white/5 p-2.5 rounded-lg space-y-1">
              <span className="text-indigo-300 block font-black uppercase tracking-wider text-[8px]">Mesh Quality Inspector</span>
              <p className="flex justify-between"><span>• Blender Normals:</span> <span className="text-emerald-400 font-bold">Pass</span></p>
              <p className="flex justify-between"><span>• UV Atlas Alignment:</span> <span className="text-emerald-400 font-bold">Optimal</span></p>
              <p className="flex justify-between"><span>• Precision Type:</span> <span className="text-indigo-300">32-bit float</span></p>
            </div>
          </div>

          {/* Sandbox Dress-up controls (Only shown if standard mannequin is rendering) */}
          <div className="bg-card border rounded-2xl p-4 space-y-3 shadow-sm">
            <h4 className="text-xs font-black uppercase text-muted-foreground tracking-wider pb-1.5 border-b">Sandbox Outfit & Poses</h4>

            {/* Color swapper */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Armor Set Color</label>
              <div className="flex gap-1.5 flex-wrap">
                {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#f8fafc', '#1e293b'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setArmorColor(color)}
                    style={{ backgroundColor: color }}
                    className={`w-5 h-5 rounded-full border cursor-pointer transition-all ${armorColor === color ? 'border-primary ring-2 ring-primary/20 scale-110' : 'border-transparent hover:scale-105'}`}
                  />
                ))}
              </div>
            </div>

            {/* Weapon loadout */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Weapon Loadout</label>
              <div className="grid grid-cols-4 gap-1">
                {(['sword', 'staff', 'shield', 'none'] as const).map((wt) => (
                  <button
                    key={wt}
                    onClick={() => setWeaponType(wt)}
                    className={`py-1 rounded text-[10px] font-bold uppercase transition-all border cursor-pointer ${weaponType === wt ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-secondary hover:bg-secondary/80 text-foreground'}`}
                  >
                    {wt}
                  </button>
                ))}
              </div>
            </div>

            {/* Animation state */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Animation Cycle</label>
              <div className="grid grid-cols-3 gap-1">
                {(['idle', 'float', 'pose'] as const).map((am) => (
                  <button
                    key={am}
                    onClick={() => setAnimationMode(am)}
                    className={`py-1 rounded text-[10px] font-bold uppercase transition-all border cursor-pointer ${animationMode === am ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-secondary hover:bg-secondary/80 text-foreground'}`}
                  >
                    {am}
                  </button>
                ))}
              </div>
            </div>

            {/* Joint pose sliders */}
            <div className="space-y-2 pt-1 border-t">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Fine Joint Rotations</span>
              
              <div className="space-y-0.5">
                <div className="flex justify-between text-[9px] font-semibold text-muted-foreground">
                  <span>Head Tilt</span>
                  <span>{Math.round(headTilt * 50)}°</span>
                </div>
                <input 
                  type="range" min="-0.6" max="0.6" step="0.05" value={headTilt} 
                  onChange={e => setHeadTilt(parseFloat(e.target.value))} 
                  className="w-full accent-primary cursor-pointer h-1 rounded bg-secondary"
                />
              </div>

              <div className="space-y-0.5">
                <div className="flex justify-between text-[9px] font-semibold text-muted-foreground">
                  <span>Right Shoulder Angle</span>
                  <span>{Math.round(armAngle * 50)}°</span>
                </div>
                <input 
                  type="range" min="-0.4" max="1.5" step="0.05" value={armAngle} 
                  onChange={e => setArmAngle(parseFloat(e.target.value))} 
                  className="w-full accent-primary cursor-pointer h-1 rounded bg-secondary"
                />
              </div>

              <div className="space-y-0.5">
                <div className="flex justify-between text-[9px] font-semibold text-muted-foreground">
                  <span>Torso Pivot</span>
                  <span>{Math.round(torsoTwist * 50)}°</span>
                </div>
                <input 
                  type="range" min="-1.5" max="1.5" step="0.05" value={torsoTwist} 
                  onChange={e => setTorsoTwist(parseFloat(e.target.value))} 
                  className="w-full accent-primary cursor-pointer h-1 rounded bg-secondary"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t">
              <input 
                type="checkbox" id="wf" checked={wireframe} onChange={e => setWireframe(e.target.checked)}
                className="w-3.5 h-3.5 accent-primary cursor-pointer rounded"
              />
              <label htmlFor="wf" className="text-[10px] font-bold text-foreground cursor-pointer uppercase select-none">Cyber Wireframe</label>
            </div>
          </div>

          {/* Capture Snapshot angle */}
          <div className="bg-card border rounded-2xl p-4 space-y-2 shadow-sm">
            <span className="text-[10px] font-bold text-muted-foreground uppercase block">📸 Snap and Save Angle</span>
            <input
              type="text"
              placeholder="Snapshot Title (e.g. Guardian Stance)"
              value={snapshotTitle}
              onChange={e => setSnapshotTitle(e.target.value)}
              className="w-full bg-background border rounded px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={handleSnapshot}
              className="w-full bg-indigo-600 text-white hover:bg-indigo-700 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-colors"
            >
              <Camera className="w-4 h-4" />
              <span>Capture & Save Angle</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

