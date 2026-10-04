import React, { useState, useMemo, useRef } from 'react';
import { 
  Table, FileSpreadsheet, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown,
  Download, Copy, Check, Eye, Edit2, Plus, RefreshCw, Layers, Sparkles,
  ExternalLink, FileText, Image as ImageIcon, Volume2, Video, Paperclip,
  User, Tag, Calendar, UserCheck, CheckCircle2, AlertCircle, HelpCircle,
  Maximize2, X, SlidersHorizontal, ChevronRight, Hash, Database, Palette,
  Info, Columns, FileCode, Printer, ChevronDown, BookOpen, Music, Film,
  Award, FileBarChart
} from 'lucide-react';
import { Character, ArchiveItem, Gender, Status, BiblePage, SubImage, ProjectRelation, EntityRelationship } from '../types';
import { CharacterEditor } from './CharacterEditor';
import { SortingEditorModal } from './SortingEditorModal';
import { DatabaseReportModal } from './DatabaseReportModal';
import { safeCopyToClipboard } from '../lib/utils';
import { playNotificationSound } from '../lib/audio';

export interface SpreadsheetRowData {
  id: string;
  sourceType: 'character' | 'item' | 'subImage' | 'biblePage' | 'audio' | 'video' | 'file' | 'project' | 'relationship' | 'color' | 'devlog';
  name: string;
  gender: 'Male' | 'Female' | 'Others' | 'Undefined';
  rawGender?: string;
  entityType: string;
  dateCreated: string;
  dateCreatedSource?: string;
  creator: string;
  speciesOrWorld: string;
  status: string;
  completionRating: string;
  description: string;
  tagline?: string;
  imageSrc?: string;
  colorPalette?: string[];
  subAssetCounts?: {
    images: number;
    biblePages: number;
    audios: number;
    videos: number;
    files: number;
    projects: number;
    codeFiles?: number;
  };
  characterRef?: Character;
  itemRef?: ArchiveItem;
  originalData?: any;
}

interface SpreadsheetViewProps {
  mode: 'global' | 'profile';
  characters?: Character[];
  items?: ArchiveItem[];
  character?: Character;
  item?: ArchiveItem;
  creatorProfileName?: string;
  activeUserProfileName?: string;
  setCharacters?: React.Dispatch<React.SetStateAction<Character[]>>;
  setItems?: React.Dispatch<React.SetStateAction<ArchiveItem[]>>;
  onSelectCharacter?: (character: Character) => void;
  onSelectItem?: (item: ArchiveItem) => void;
  onUpdateCharacter?: (character: Character) => void;
  onBack?: () => void;
}

type SortField = 'name' | 'gender' | 'entityType' | 'dateCreated' | 'creator' | 'speciesOrWorld' | 'status' | 'completionRating';
type GenderFilter = 'All' | 'Male' | 'Female' | 'Others' | 'Undefined';

export function SpreadsheetView({
  mode = 'global',
  characters = [],
  items = [],
  character,
  item,
  creatorProfileName = 'Alberto Armentero',
  activeUserProfileName,
  setCharacters,
  setItems,
  onSelectCharacter,
  onSelectItem,
  onUpdateCharacter,
  onBack,
}: SpreadsheetViewProps) {
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortAscending, setSortAscending] = useState<boolean>(true);
  const [selectedCell, setSelectedCell] = useState<{ rowIdx: number; colKey: string; val: string } | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  // Scope Mode: Default is 1 character per profile (Unique Characters)
  const [rosterScope, setRosterScope] = useState<'uniqueProfiles' | 'allSubAssets'>('uniqueProfiles');

  // Modals & Inspectors
  const [previewImage, setPreviewImage] = useState<{ src: string; title: string; subtitle?: string } | null>(null);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [showSortingModal, setShowSortingModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Column Visibility state
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    rowNum: true,
    image: true,
    name: true,
    gender: true,
    entityType: true,
    dateCreated: true,
    creator: true,
    speciesOrWorld: true,
    status: true,
    completionRating: true,
    subAssets: true,
    colorPalette: true,
    description: true,
    actions: true,
  });

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    try { playNotificationSound(); } catch (e) {}
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Helper to normalize Gender into 4 categories: Male, Female, Others, Undefined
  const normalizeGender = (g: any): 'Male' | 'Female' | 'Others' | 'Undefined' => {
    if (!g) return 'Undefined';
    const str = String(g).trim().toLowerCase();
    if (str === 'male' || str === 'm' || str === 'man' || str === 'boy') return 'Male';
    if (str === 'female' || str === 'f' || str === 'woman' || str === 'girl') return 'Female';
    if (str === 'others' || str === 'other' || str === 'non-binary' || str === 'nb' || str === 'objects' || str === 'object') return 'Others';
    if (str === 'undefined' || str === 'unknown' || str === 'unclassified' || str === 'none' || str === 'not specified') return 'Undefined';
    return 'Undefined';
  };

  // Calculate deep multi-metric "Statue" counters across the entire library
  const statueCounts = useMemo(() => {
    const targetChars = mode === 'global' ? characters : (character ? [character] : characters);
    let totalUniqueChars = targetChars.length;
    let male = 0;
    let female = 0;
    let others = 0;
    let undefinedGender = 0;
    const speciesSet = new Set<string>();
    const worldSet = new Set<string>();
    let totalImages = 0;
    let totalAudios = 0;
    let totalVideos = 0;
    let totalBiblePages = 0;
    let totalProjects = 0;
    let totalCodeFiles = 0;
    let totalGenericFiles = 0;
    const allPalettes = new Set<string>();
    let totalDevHours = 0;

    targetChars.forEach((c) => {
      const g = normalizeGender(c.gender);
      if (g === 'Male') male++;
      else if (g === 'Female') female++;
      else if (g === 'Others') others++;
      else undefinedGender++;

      if (c.species?.trim()) speciesSet.add(c.species.trim());
      if (c.worldName?.trim()) worldSet.add(c.worldName.trim());

      const mainImg = c.defaultThumbnailSrc || c.highlightedImageSrc || c.image;
      totalImages += (c.subImages?.length || 0) + (mainImg ? 1 : 0);
      totalAudios += c.audios?.length || 0;
      totalVideos += c.videos?.length || 0;
      totalBiblePages += c.biblePages?.length || 0;
      totalProjects += c.projects?.length || 0;
      totalCodeFiles += c.codeFiles?.length || 0;
      totalGenericFiles += c.genericFiles?.length || 0;

      (c.colorPalette || []).forEach((hex) => allPalettes.add(hex.toUpperCase()));
      (c.devTracker?.logs || []).forEach((l) => totalDevHours += (l.hoursSpent || 0));
    });

    if (mode === 'global') {
      items.forEach((itm) => {
        if (itm.type === 'image') totalImages++;
        else if (itm.type === 'audio') totalAudios++;
        else if (itm.type === 'video') totalVideos++;
      });
    }

    return {
      totalUniqueChars,
      male,
      female,
      others,
      undefinedGender,
      speciesCount: speciesSet.size,
      speciesList: Array.from(speciesSet),
      worldsCount: worldSet.size,
      images: totalImages,
      audios: totalAudios,
      videos: totalVideos,
      biblePages: totalBiblePages,
      projects: totalProjects,
      codeFiles: totalCodeFiles,
      files: totalGenericFiles,
      colorPalettes: allPalettes.size,
      devHours: totalDevHours,
    };
  }, [mode, characters, character, items]);

  // Build the dataset based on mode and scope
  const rawRows: SpreadsheetRowData[] = useMemo(() => {
    const defaultCreator = creatorProfileName || 'Alberto Armentero';

    if (mode === 'global') {
      // 1. GLOBAL MODE: Default is 1 unique character per profile
      const rows: SpreadsheetRowData[] = [];
      const characterIds = new Set<string>();

      characters.forEach((char) => {
        characterIds.add(char.id);
        const normGender = normalizeGender(char.gender);
        const img = char.defaultThumbnailSrc || char.highlightedImageSrc || char.image || (char.subImages && char.subImages[0]?.src);
        
        rows.push({
          id: `char-${char.id}`,
          sourceType: 'character',
          name: char.name || 'Unnamed Character',
          gender: normGender,
          rawGender: char.gender || 'Undefined',
          entityType: char.entityType || 'Character Model',
          dateCreated: char.dateCreated || (char.dateUploaded ? new Date(char.dateUploaded).toISOString().split('T')[0] : 'Unknown'),
          dateCreatedSource: char.dateCreatedSource || 'From Profile',
          creator: char.creator || defaultCreator,
          speciesOrWorld: [char.species, char.worldName].filter(Boolean).join(' / ') || 'Unspecified Species',
          status: char.status || 'Sorted',
          completionRating: char.completionRating || '100% Ready',
          description: char.description || char.tagline || 'No description recorded.',
          tagline: char.tagline,
          imageSrc: img,
          colorPalette: char.colorPalette || [],
          subAssetCounts: {
            images: (char.subImages?.length || 0) + (img ? 1 : 0),
            biblePages: char.biblePages?.length || 0,
            audios: char.audios?.length || 0,
            videos: char.videos?.length || 0,
            files: char.genericFiles?.length || 0,
            projects: char.projects?.length || 0,
            codeFiles: char.codeFiles?.length || 0,
          },
          characterRef: char,
        });

        // If user explicitly switched to "allSubAssets" exploded view
        if (rosterScope === 'allSubAssets') {
          (char.subImages || []).forEach((subImg, idx) => {
            rows.push({
              id: `subimg-${char.id}-${idx}`,
              sourceType: 'subImage',
              name: `${char.name}: ${subImg.title || `Variant #${idx + 1}`}`,
              gender: normGender,
              rawGender: char.gender,
              entityType: 'Sub-Image / Render',
              dateCreated: char.dateCreated || 'Profile Date',
              dateCreatedSource: 'Gallery Attachment',
              creator: defaultCreator,
              speciesOrWorld: char.species || 'Visual Asset',
              status: 'Attached',
              completionRating: 'Rendered',
              description: subImg.description || `Sub-image variant for ${char.name}`,
              imageSrc: subImg.src,
              characterRef: char,
              originalData: subImg,
            });
          });

          (char.audios || []).forEach((aud, idx) => {
            rows.push({
              id: `audio-${char.id}-${idx}`,
              sourceType: 'audio',
              name: `${char.name}: ${aud.title || `Audio #${idx + 1}`}`,
              gender: 'Undefined',
              rawGender: 'Undefined',
              entityType: 'Audio Track / Theme',
              dateCreated: char.dateCreated || 'Unknown',
              dateCreatedSource: 'Audio Library',
              creator: defaultCreator,
              speciesOrWorld: aud.category || 'Soundtrack',
              status: 'Active',
              completionRating: aud.duration || 'Audio Track',
              description: aud.description || 'Character audio theme or voice line.',
              characterRef: char,
              originalData: aud,
            });
          });

          (char.videos || []).forEach((vid, idx) => {
            rows.push({
              id: `video-${char.id}-${idx}`,
              sourceType: 'video',
              name: `${char.name}: ${vid.title || `Video #${idx + 1}`}`,
              gender: 'Undefined',
              rawGender: 'Undefined',
              entityType: 'Video Clip / Animation',
              dateCreated: char.dateCreated || 'Unknown',
              dateCreatedSource: 'Video Library',
              creator: defaultCreator,
              speciesOrWorld: vid.category || 'Cinematic',
              status: 'Active',
              completionRating: vid.duration || 'Video Clip',
              description: vid.description || 'Character video clip or scene.',
              imageSrc: vid.thumbnailSrc,
              characterRef: char,
              originalData: vid,
            });
          });
        }
      });

      // Gather orphan items or standalone archive entries if not in unique profile mode
      if (rosterScope === 'allSubAssets') {
        items.forEach((itm) => {
          if (itm.characterId && characterIds.has(itm.characterId)) return;
          const dateStr = itm.fileDate ? new Date(itm.fileDate).toISOString().split('T')[0] : (itm.createdAt ? new Date(itm.createdAt).toISOString().split('T')[0] : 'Unknown');
          const img = itm.thumbnailContent || (itm.type === 'image' ? itm.content : undefined);

          rows.push({
            id: `item-${itm.id}`,
            sourceType: 'item',
            name: itm.originalName || 'Unclassified Asset',
            gender: 'Undefined',
            rawGender: 'Undefined',
            entityType: itm.type ? `${itm.type.toUpperCase()} File` : 'Unclassified Item',
            dateCreated: dateStr,
            dateCreatedSource: 'From Uploaded File',
            creator: defaultCreator,
            speciesOrWorld: itm.artStyle || 'Archive Item',
            status: itm.isDuplicate ? 'Duplicate' : 'Unsorted',
            completionRating: '100% Uploaded',
            description: itm.description || `Uploaded ${itm.type} asset from image archives.`,
            imageSrc: img,
            colorPalette: [],
            subAssetCounts: {
              images: itm.type === 'image' ? 1 : 0,
              biblePages: 0,
              audios: itm.type === 'audio' ? 1 : 0,
              videos: itm.type === 'video' ? 1 : 0,
              files: 1,
              projects: 0,
            },
            itemRef: itm,
          });
        });
      }

      return rows;
    } else {
      // 2. PROFILE MODE: Gather EVERYTHING within this single character's library!
      const targetChar = character || (characters[0] as Character);
      if (!targetChar) return [];

      const defaultCreator = targetChar.creator || creatorProfileName || 'Alberto Armentero';
      const rows: SpreadsheetRowData[] = [];

      // Row 1: The Main Character Profile Root
      const normGender = normalizeGender(targetChar.gender);
      const mainImg = targetChar.defaultThumbnailSrc || targetChar.highlightedImageSrc || targetChar.image;
      rows.push({
        id: `root-${targetChar.id}`,
        sourceType: 'character',
        name: `${targetChar.name} (Main Profile)`,
        gender: normGender,
        rawGender: targetChar.gender || 'Undefined',
        entityType: targetChar.entityType || 'Primary Character Entity',
        dateCreated: targetChar.dateCreated || 'Unknown',
        dateCreatedSource: targetChar.dateCreatedSource || 'Profile Root',
        creator: defaultCreator,
        speciesOrWorld: [targetChar.species, targetChar.worldName].filter(Boolean).join(' / ') || 'Main Spec',
        status: targetChar.status || 'Sorted',
        completionRating: targetChar.completionRating || 'Primary Spec',
        description: targetChar.description || targetChar.tagline || 'Core character profile entity.',
        tagline: targetChar.tagline,
        imageSrc: mainImg,
        colorPalette: targetChar.colorPalette || [],
        subAssetCounts: {
          images: (targetChar.subImages?.length || 0) + (mainImg ? 1 : 0),
          biblePages: targetChar.biblePages?.length || 0,
          audios: targetChar.audios?.length || 0,
          videos: targetChar.videos?.length || 0,
          files: targetChar.genericFiles?.length || 0,
          projects: targetChar.projects?.length || 0,
          codeFiles: targetChar.codeFiles?.length || 0,
        },
        characterRef: targetChar,
      });

      // Sub-Images
      (targetChar.subImages || []).forEach((subImg, idx) => {
        rows.push({
          id: `subimg-${subImg.id || idx}`,
          sourceType: 'subImage',
          name: subImg.title || `Visual Variant #${idx + 1}`,
          gender: normGender,
          rawGender: targetChar.gender,
          entityType: 'Sub-Image / Render',
          dateCreated: targetChar.dateCreated || 'Profile Date',
          dateCreatedSource: 'Gallery Attachment',
          creator: defaultCreator,
          speciesOrWorld: 'Visual Asset',
          status: 'Attached',
          completionRating: 'Rendered',
          description: subImg.description || `Sub-image variant for ${targetChar.name}`,
          imageSrc: subImg.src,
          characterRef: targetChar,
          originalData: subImg,
        });
      });

      // Bible Pages & Lore Documents
      (targetChar.biblePages || []).forEach((page, idx) => {
        rows.push({
          id: `bible-${page.id || idx}`,
          sourceType: 'biblePage',
          name: page.title || `Lore Doc #${idx + 1}`,
          gender: 'Undefined',
          rawGender: 'Undefined',
          entityType: 'Bible Lore Document',
          dateCreated: page.lastEdited || targetChar.dateCreated || 'Unknown',
          dateCreatedSource: 'Lore Section',
          creator: defaultCreator,
          speciesOrWorld: 'Canon Lore',
          status: page.isLocked ? 'Locked' : 'Draft',
          completionRating: `${page.content ? page.content.split(/\s+/).length : 0} words`,
          description: page.content || 'Empty lore document page.',
          characterRef: targetChar,
          originalData: page,
        });
      });

      // Audio Tracks & Voice Recordings
      (targetChar.audios || []).forEach((aud, idx) => {
        rows.push({
          id: `audio-${aud.id || idx}`,
          sourceType: 'audio',
          name: aud.title || `Audio Track #${idx + 1}`,
          gender: 'Undefined',
          rawGender: 'Undefined',
          entityType: 'Audio Track / Voice Log',
          dateCreated: targetChar.dateCreated || 'Unknown',
          dateCreatedSource: 'Audio Library',
          creator: defaultCreator,
          speciesOrWorld: aud.category || 'Soundtrack',
          status: aud.isDuplicate ? 'Duplicate' : 'Active',
          completionRating: aud.duration || 'Audio File',
          description: aud.description || 'Character audio voice track or music.',
          characterRef: targetChar,
          originalData: aud,
        });
      });

      // Video Clips
      (targetChar.videos || []).forEach((vid, idx) => {
        rows.push({
          id: `video-${vid.id || idx}`,
          sourceType: 'video',
          name: vid.title || `Video Clip #${idx + 1}`,
          gender: 'Undefined',
          rawGender: 'Undefined',
          entityType: 'Video Clip / Animation',
          dateCreated: targetChar.dateCreated || 'Unknown',
          dateCreatedSource: 'Video Library',
          creator: defaultCreator,
          speciesOrWorld: vid.category || 'Cinematic',
          status: vid.isDuplicate ? 'Duplicate' : 'Active',
          completionRating: vid.duration || 'Video Clip',
          description: vid.description || 'Character video clip or scene.',
          imageSrc: vid.thumbnailSrc,
          characterRef: targetChar,
          originalData: vid,
        });
      });

      // Generic Attached Files
      (targetChar.genericFiles || []).forEach((file, idx) => {
        rows.push({
          id: `file-${file.id || idx}`,
          sourceType: 'file',
          name: file.name || `Attachment #${idx + 1}`,
          gender: 'Undefined',
          rawGender: 'Undefined',
          entityType: `${file.type?.toUpperCase() || 'DOCUMENT'} File`,
          dateCreated: file.dateAdded || file.dateUploaded || 'Unknown',
          dateCreatedSource: 'File Attachment',
          creator: defaultCreator,
          speciesOrWorld: file.category || 'Attachment',
          status: file.isDuplicate ? 'Duplicate' : 'Uploaded',
          completionRating: file.size || 'Attachment',
          description: file.description || `Generic file attachment: ${file.name}`,
          characterRef: targetChar,
          originalData: file,
        });
      });

      // Project Relations
      (targetChar.projects || []).forEach((proj, idx) => {
        rows.push({
          id: `proj-${proj.id || idx}`,
          sourceType: 'project',
          name: proj.projectName || `Project #${idx + 1}`,
          gender: 'Undefined',
          rawGender: 'Undefined',
          entityType: 'Project Relation',
          dateCreated: 'Project Timeline',
          dateCreatedSource: 'Project Registry',
          creator: defaultCreator,
          speciesOrWorld: proj.roleOrRelation || 'Role',
          status: proj.status || 'In Progress',
          completionRating: proj.status || 'Active',
          description: proj.description || `Project connection: ${proj.projectName} (${proj.roleOrRelation})`,
          characterRef: targetChar,
          originalData: proj,
        });
      });

      // Entity Relationships
      (targetChar.relationships || []).forEach((rel, idx) => {
        rows.push({
          id: `rel-${rel.id || idx}`,
          sourceType: 'relationship',
          name: rel.targetName || rel.name || `Connected Entity #${idx + 1}`,
          gender: 'Undefined',
          rawGender: 'Undefined',
          entityType: 'Entity Connection / Lore Relation',
          dateCreated: 'Relational Canon',
          dateCreatedSource: 'Relationship Matrix',
          creator: defaultCreator,
          speciesOrWorld: rel.relationshipType || rel.role || 'Connection',
          status: 'Linked',
          completionRating: 'Connected',
          description: rel.description || rel.notes || `Connected relationship to ${rel.targetName || rel.name}`,
          imageSrc: rel.iconUrl,
          characterRef: targetChar,
          originalData: rel,
        });
      });

      // Color Palette entries
      (targetChar.colorPalette || []).forEach((hex, idx) => {
        rows.push({
          id: `color-${idx}`,
          sourceType: 'color',
          name: `Palette Swatch #${idx + 1} (${hex})`,
          gender: 'Undefined',
          rawGender: 'Undefined',
          entityType: 'Color Palette Swatch',
          dateCreated: 'Color Extraction',
          dateCreatedSource: 'Visual Spectrum',
          creator: defaultCreator,
          speciesOrWorld: hex,
          status: 'Extracted',
          completionRating: 'RGB/HEX',
          description: `Exact hex code ${hex} utilized for character outfit, skin, or armor.`,
          colorPalette: [hex],
          characterRef: targetChar,
        });
      });

      // Dev Tracker Logs
      (targetChar.devTracker?.logs || []).forEach((log, idx) => {
        rows.push({
          id: `devlog-${log.id || idx}`,
          sourceType: 'devlog',
          name: `Dev Log: ${log.milestone || 'Work Session'} (${log.date})`,
          gender: 'Undefined',
          rawGender: 'Undefined',
          entityType: 'Developer Tracking Entry',
          dateCreated: log.date || 'Unknown',
          dateCreatedSource: 'Dev Tracker',
          creator: defaultCreator,
          speciesOrWorld: `${log.hoursSpent} Hours Logged`,
          status: 'Logged',
          completionRating: `${log.hoursSpent}h`,
          description: log.description || 'Developer work log entry.',
          characterRef: targetChar,
          originalData: log,
        });
      });

      return rows;
    }
  }, [mode, rosterScope, characters, items, character, creatorProfileName]);

  // Statistics for Category summary chips
  const counts = useMemo(() => {
    let male = 0;
    let female = 0;
    let others = 0;
    let undefinedCount = 0;
    let withImages = 0;

    rawRows.forEach((r) => {
      if (r.gender === 'Male') male++;
      else if (r.gender === 'Female') female++;
      else if (r.gender === 'Others') others++;
      else undefinedCount++;

      if (r.imageSrc) withImages++;
    });

    return {
      total: rawRows.length,
      male,
      female,
      others,
      undefinedCount,
      withImages,
    };
  }, [rawRows]);

  // Filtered and Sorted Rows
  const filteredRows = useMemo(() => {
    return rawRows.filter((r) => {
      // 1. Gender Category Filter
      if (genderFilter !== 'All' && r.gender !== genderFilter) {
        return false;
      }

      // 2. Entity Type Filter
      if (typeFilter !== 'All') {
        if (typeFilter === 'character' && r.sourceType !== 'character') return false;
        if (typeFilter === 'subImage' && r.sourceType !== 'subImage') return false;
        if (typeFilter === 'biblePage' && r.sourceType !== 'biblePage') return false;
        if (typeFilter === 'media' && !['audio', 'video', 'file'].includes(r.sourceType)) return false;
        if (typeFilter === 'project' && r.sourceType !== 'project') return false;
        if (typeFilter === 'color' && r.sourceType !== 'color') return false;
      }

      // 3. Status Filter
      if (statusFilter !== 'All' && r.status !== statusFilter) {
        return false;
      }

      // 4. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = r.name.toLowerCase().includes(q);
        const matchesCreator = r.creator.toLowerCase().includes(q);
        const matchesDesc = r.description.toLowerCase().includes(q);
        const matchesSpecies = r.speciesOrWorld.toLowerCase().includes(q);
        const matchesType = r.entityType.toLowerCase().includes(q);
        const matchesDate = r.dateCreated.toLowerCase().includes(q);
        const matchesGender = r.gender.toLowerCase().includes(q);

        if (!matchesName && !matchesCreator && !matchesDesc && !matchesSpecies && !matchesType && !matchesDate && !matchesGender) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      let valA: any = a[sortField] || '';
      let valB: any = b[sortField] || '';

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortAscending ? -1 : 1;
      if (valA > valB) return sortAscending ? 1 : -1;
      return 0;
    });
  }, [rawRows, genderFilter, typeFilter, statusFilter, searchQuery, sortField, sortAscending]);

  // Handle Sorting toggle
  const handleHeaderSort = (field: SortField) => {
    if (sortField === field) {
      setSortField(field);
      setSortAscending(!sortAscending);
    } else {
      setSortField(field);
      setSortAscending(true);
    }
  };

  // CSV Export with Statue Counts Metadata Summary
  const handleExportCSV = () => {
    if (filteredRows.length === 0) {
      triggerToast('No records to export in current filter.');
      return;
    }

    const escapeCSV = (val: string) => {
      if (!val) return '""';
      const clean = String(val).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const csvLines: string[] = [
      `# ARMSTECH DATABASE & STATUE COUNTER AUDIT SPREADSHEET`,
      `# Generated: ${new Date().toISOString()}`,
      `# Total Unique Statues / Characters: ${statueCounts.totalUniqueChars}`,
      `# Male: ${statueCounts.male} | Female: ${statueCounts.female} | Others: ${statueCounts.others} | Undefined: ${statueCounts.undefinedGender}`,
      `# Species Count: ${statueCounts.speciesCount} | Images: ${statueCounts.images} | Audio: ${statueCounts.audios} | Video: ${statueCounts.videos} | Projects: ${statueCounts.projects} | Color Swatches: ${statueCounts.colorPalettes}`,
      ``,
    ];

    const headers = [
      'Row Number',
      'Name / Title',
      'Gender Category',
      'Entity Type',
      'Date Created',
      'Date Source',
      'Creator',
      'Species / World',
      'Status',
      'Completion Rating',
      'Description / Lore',
      'Has Image',
      'Image URL',
      'Color Palette',
    ];

    csvLines.push(headers.join(','));

    filteredRows.forEach((row, idx) => {
      const line = [
        idx + 1,
        escapeCSV(row.name),
        escapeCSV(row.gender),
        escapeCSV(row.entityType),
        escapeCSV(row.dateCreated),
        escapeCSV(row.dateCreatedSource || ''),
        escapeCSV(row.creator),
        escapeCSV(row.speciesOrWorld),
        escapeCSV(row.status),
        escapeCSV(row.completionRating),
        escapeCSV(row.description),
        escapeCSV(row.imageSrc ? 'Yes' : 'No'),
        escapeCSV(row.imageSrc || ''),
        escapeCSV((row.colorPalette || []).join('; ')),
      ];
      csvLines.push(line.join(','));
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csvLines.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    const fileName = mode === 'global' ? `armstech_statue_spreadsheet_${new Date().toISOString().split('T')[0]}.csv` : `${character?.name || 'character'}_library_spreadsheet.csv`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerToast(`Exported ${filteredRows.length} rows to ${fileName}`);
  };

  // Copy TSV for direct Google Sheets / Excel paste
  const handleCopyTSV = () => {
    if (filteredRows.length === 0) return;
    const headers = ['Row', 'Name', 'Gender', 'Type', 'Date Created', 'Creator', 'Species/World', 'Status', 'Completion', 'Description'];
    const lines = [headers.join('\t')];

    filteredRows.forEach((r, idx) => {
      lines.push([
        idx + 1,
        r.name,
        r.gender,
        r.entityType,
        r.dateCreated,
        r.creator,
        r.speciesOrWorld,
        r.status,
        r.completionRating,
        r.description.replace(/\n/g, ' '),
      ].join('\t'));
    });

    safeCopyToClipboard(lines.join('\n'));
    triggerToast('Copied spreadsheet data! Paste directly into Google Sheets (Ctrl+V)');
  };

  // Row selection toggle
  const toggleSelectRow = (id: string) => {
    const next = new Set(selectedRowIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedRowIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedRowIds.size === filteredRows.length) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(new Set(filteredRows.map((r) => r.id)));
    }
  };

  // Cell Click Selection for Google Sheets feel
  const handleCellClick = (rowIdx: number, colKey: string, val: string) => {
    setSelectedCell({ rowIdx, colKey, val });
  };

  // Active Cell Coordinate Display (e.g., B3, D12)
  const getCellAddress = () => {
    if (!selectedCell) return 'A1';
    const colMap: Record<string, string> = {
      image: 'A',
      name: 'B',
      gender: 'C',
      entityType: 'D',
      dateCreated: 'E',
      creator: 'F',
      speciesOrWorld: 'G',
      status: 'H',
      completionRating: 'I',
      subAssets: 'J',
      colorPalette: 'K',
      description: 'L',
      actions: 'M',
    };
    const col = colMap[selectedCell.colKey] || 'A';
    return `${col}${selectedCell.rowIdx + 1}`;
  };

  return (
    <div id="armstech-spreadsheet-container" className="w-full flex flex-col h-full bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden font-sans select-text">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 bg-emerald-600 text-white font-medium px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 border border-emerald-400/40 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Google Sheets Header & Master App Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700 cursor-pointer"
              title="Go Back"
            >
              <ChevronDown className="w-4 h-4 rotate-90" />
            </button>
          )}

          {/* Google Sheets Green Icon Badge */}
          <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
            <FileSpreadsheet className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                {mode === 'global' ? 'Google-Style Character & Model Spreadsheet' : `${character?.name || 'Character'} Library Spreadsheet`}
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {mode === 'global' ? '1 Profile / Model Spec' : 'Profile Sheet'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {mode === 'global'
                ? 'Master ledger indexing character models, gender classifications (Male/Female/Others/Undefined), species, media, and color palettes.'
                : `Collecting all sub-images, lore documents, audio, videos, files, and metadata inside ${character?.name || 'this profile'}.`}
            </p>
          </div>
        </div>

        {/* Master Action Tools: Sorting Studio, Audit Report, CSV, Copy TSV */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sorting & Grouping Studio Button */}
          <button
            onClick={() => setShowSortingModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-950 active:scale-95 cursor-pointer"
            title="Open Sorting & Grouping Window Editor"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Sorting & Grouping Studio</span>
          </button>

          {/* Audit & Counter Report Button */}
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 rounded-xl text-xs font-semibold transition-all shadow-xs active:scale-95 cursor-pointer"
            title="Open Statue Counter Audit & Report"
          >
            <FileBarChart className="w-3.5 h-3.5 text-emerald-400" />
            <span>Audit & Report</span>
          </button>

          <button
            onClick={handleCopyTSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all shadow-xs active:scale-95 cursor-pointer"
            title="Copy TSV data to paste into Google Sheets"
          >
            <Copy className="w-3.5 h-3.5 text-slate-400" />
            <span>Copy TSV</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-950 active:scale-95 cursor-pointer"
            title="Export spreadsheet to CSV file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowColumnPicker(!showColumnPicker)}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
              showColumnPicker ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Toggle Columns Visibility"
          >
            <Columns className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. STATUE MULTI-METRIC COUNTER RIBBON */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 py-2.5 flex items-center gap-2 overflow-x-auto scrollbar-thin shrink-0">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0 font-semibold mr-1">
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span>Statue Counters:</span>
        </div>

        {/* 1 Character Per Profile Default Switch */}
        {mode === 'global' && (
          <button
            onClick={() => setRosterScope(rosterScope === 'uniqueProfiles' ? 'allSubAssets' : 'uniqueProfiles')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all border shrink-0 cursor-pointer ${
              rosterScope === 'uniqueProfiles'
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-inner'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Toggle between 1 Unique Character per Profile vs All Sub-Assets"
          >
            <User className="w-3.5 h-3.5 text-emerald-400" />
            <span>1 Character / Profile ({statueCounts.totalUniqueChars})</span>
          </button>
        )}

        {/* Male Counter */}
        <button
          onClick={() => setGenderFilter(genderFilter === 'Male' ? 'All' : 'Male')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border shrink-0 cursor-pointer ${
            genderFilter === 'Male'
              ? 'bg-blue-600 text-white border-blue-400'
              : 'bg-blue-950/30 text-blue-300 border-blue-900/50 hover:bg-blue-900/40'
          }`}
        >
          <span>♂ Male</span>
          <span className="px-1.5 py-0.2 bg-blue-900/80 rounded-full text-[10px] font-bold text-blue-200">{statueCounts.male}</span>
        </button>

        {/* Female Counter */}
        <button
          onClick={() => setGenderFilter(genderFilter === 'Female' ? 'All' : 'Female')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border shrink-0 cursor-pointer ${
            genderFilter === 'Female'
              ? 'bg-pink-600 text-white border-pink-400'
              : 'bg-pink-950/30 text-pink-300 border-pink-900/50 hover:bg-pink-900/40'
          }`}
        >
          <span>♀ Female</span>
          <span className="px-1.5 py-0.2 bg-pink-900/80 rounded-full text-[10px] font-bold text-pink-200">{statueCounts.female}</span>
        </button>

        {/* Others Counter */}
        <button
          onClick={() => setGenderFilter(genderFilter === 'Others' ? 'All' : 'Others')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border shrink-0 cursor-pointer ${
            genderFilter === 'Others'
              ? 'bg-amber-600 text-white border-amber-400'
              : 'bg-amber-950/30 text-amber-300 border-amber-900/50 hover:bg-amber-900/40'
          }`}
        >
          <span>⚧ Others</span>
          <span className="px-1.5 py-0.2 bg-amber-900/80 rounded-full text-[10px] font-bold text-amber-200">{statueCounts.others}</span>
        </button>

        {/* Undefined Counter */}
        <button
          onClick={() => setGenderFilter(genderFilter === 'Undefined' ? 'All' : 'Undefined')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border shrink-0 cursor-pointer ${
            genderFilter === 'Undefined'
              ? 'bg-zinc-600 text-white border-zinc-400'
              : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
          }`}
        >
          <span>❓ Undefined</span>
          <span className="px-1.5 py-0.2 bg-zinc-800 rounded-full text-[10px] font-bold text-zinc-300">{statueCounts.undefinedGender}</span>
        </button>

        {/* Species Counter */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-900 text-slate-300 border border-slate-800 shrink-0"
          title={`Species detected: ${statueCounts.speciesList.join(', ') || 'None'}`}
        >
          <span>🦊 Species:</span>
          <strong className="text-white">{statueCounts.speciesCount}</strong>
        </div>

        {/* Media Counts */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-900 text-slate-300 border border-slate-800 shrink-0">
          <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
          <span>Images:</span>
          <strong className="text-white">{statueCounts.images}</strong>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-900 text-slate-300 border border-slate-800 shrink-0">
          <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Tracks:</span>
          <strong className="text-white">{statueCounts.audios}</strong>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-900 text-slate-300 border border-slate-800 shrink-0">
          <Video className="w-3.5 h-3.5 text-rose-400" />
          <span>Videos:</span>
          <strong className="text-white">{statueCounts.videos}</strong>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-900 text-slate-300 border border-slate-800 shrink-0">
          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          <span>Books/Lore:</span>
          <strong className="text-white">{statueCounts.biblePages}</strong>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-900 text-slate-300 border border-slate-800 shrink-0">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>Games/Projects:</span>
          <strong className="text-white">{statueCounts.projects}</strong>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-900 text-slate-300 border border-slate-800 shrink-0">
          <Palette className="w-3.5 h-3.5 text-fuchsia-400" />
          <span>Palettes:</span>
          <strong className="text-white">{statueCounts.colorPalettes}</strong>
        </div>
      </div>

      {/* 3. Google Sheets Formula Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-[280px]">
          <div className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-md font-mono text-[11px] text-emerald-400 font-bold min-w-[42px] text-center shadow-inner">
            {getCellAddress()}
          </div>
          <div className="font-mono text-xs font-bold text-slate-400 px-1 italic">fx</div>
          <div className="flex-1 bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1 text-slate-300 font-mono text-[11px] truncate shadow-inner">
            {selectedCell ? selectedCell.val : `=STATUE_AUDIT(UniqueProfiles: ${statueCounts.totalUniqueChars}, Species: ${statueCounts.speciesCount}, TotalImages: ${statueCounts.images}, Audios: ${statueCounts.audios}, Projects: ${statueCounts.projects})`}
          </div>
        </div>

        <div className="text-slate-400 text-xs flex items-center gap-2">
          <span>Roster: <strong className="text-emerald-400">{rosterScope === 'uniqueProfiles' ? '1 Character / Profile' : 'All Expanded Assets'}</strong></span>
        </div>
      </div>

      {/* 4. Search & Secondary Filters Toolbar */}
      <div className="bg-slate-900/60 border-b border-slate-800/60 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 flex-1 min-w-[240px]">
          {/* Live Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, creator, species, date, tags, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/60 transition-all placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/60 cursor-pointer"
          >
            <option value="All">All Entity Types</option>
            <option value="character">Characters Only</option>
            <option value="subImage">Sub-Images / Variants</option>
            <option value="biblePage">Bible Lore Docs</option>
            <option value="media">Media & Audio/Video</option>
            <option value="project">Projects & Games</option>
            <option value="color">Color Swatches</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/60 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Sorted">Sorted</option>
            <option value="Unsorted">Unsorted</option>
            <option value="Duplicate">Duplicate</option>
            <option value="Draft">Draft</option>
          </select>
        </div>

        {/* Results Counter & Row selection summary */}
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>
            Showing <strong className="text-white">{filteredRows.length}</strong> of {rawRows.length} rows
          </span>
          {selectedRowIds.size > 0 && (
            <span className="text-emerald-400 font-semibold">
              ({selectedRowIds.size} rows selected)
            </span>
          )}
        </div>
      </div>

      {/* Column Visibility Menu (Toggleable) */}
      {showColumnPicker && (
        <div className="bg-slate-900 border-b border-emerald-500/30 p-3 flex flex-wrap items-center gap-4 text-xs animate-in fade-in duration-150 shrink-0">
          <span className="font-bold text-emerald-400 flex items-center gap-1.5">
            <Columns className="w-3.5 h-3.5" /> Toggle Columns:
          </span>
          {Object.entries({
            image: '[A] Image',
            name: '[B] Name',
            gender: '[C] Gender',
            entityType: '[D] Type',
            dateCreated: '[E] Date',
            creator: '[F] Creator',
            speciesOrWorld: '[G] Species/World',
            status: '[H] Status',
            completionRating: '[I] Completion',
            subAssets: '[J] Sub-Assets',
            colorPalette: '[K] Colors',
            description: '[L] Description',
            actions: '[M] Actions',
          }).map(([key, label]) => (
            <label key={key} className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={visibleColumns[key] ?? true}
                onChange={(e) => setVisibleColumns({ ...visibleColumns, [key]: e.target.checked })}
                className="rounded border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
              />
              <span>{label}</span>
            </label>
          ))}
          <button
            onClick={() => setShowColumnPicker(false)}
            className="ml-auto text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer"
          >
            Close Picker
          </button>
        </div>
      )}

      {/* 5. Google Sheets Main Data Grid Table */}
      <div className="flex-1 overflow-auto bg-slate-950 scrollbar-thin">
        <table className="w-full text-left border-collapse text-xs">
          {/* Header Row (Google Sheets letters + field titles) */}
          <thead className="sticky top-0 z-20 bg-slate-900 text-slate-200 font-semibold border-b border-slate-800 shadow-sm">
            {/* Row Letters (A, B, C, D...) */}
            <tr className="bg-slate-900/90 text-[10px] font-mono text-slate-500 uppercase tracking-widest border-b border-slate-800/80">
              <th className="w-12 px-2 py-1 text-center bg-slate-900 border-r border-slate-800 select-none">#</th>
              {visibleColumns.image && <th className="w-16 px-2 py-1 text-center border-r border-slate-800">A</th>}
              {visibleColumns.name && <th className="px-3 py-1 border-r border-slate-800">B</th>}
              {visibleColumns.gender && <th className="w-28 px-3 py-1 border-r border-slate-800">C</th>}
              {visibleColumns.entityType && <th className="w-32 px-3 py-1 border-r border-slate-800">D</th>}
              {visibleColumns.dateCreated && <th className="w-32 px-3 py-1 border-r border-slate-800">E</th>}
              {visibleColumns.creator && <th className="w-36 px-3 py-1 border-r border-slate-800">F</th>}
              {visibleColumns.speciesOrWorld && <th className="w-36 px-3 py-1 border-r border-slate-800">G</th>}
              {visibleColumns.status && <th className="w-28 px-3 py-1 border-r border-slate-800">H</th>}
              {visibleColumns.completionRating && <th className="w-28 px-3 py-1 border-r border-slate-800">I</th>}
              {visibleColumns.subAssets && <th className="w-28 px-3 py-1 border-r border-slate-800">J</th>}
              {visibleColumns.colorPalette && <th className="w-28 px-3 py-1 border-r border-slate-800">K</th>}
              {visibleColumns.description && <th className="min-w-[200px] px-3 py-1 border-r border-slate-800">L</th>}
              {visibleColumns.actions && <th className="w-24 px-3 py-1 text-center">M</th>}
            </tr>

            {/* Column Titles */}
            <tr className="divide-x divide-slate-800 select-none">
              <th className="w-12 px-2 py-2.5 text-center bg-slate-900">
                <input
                  type="checkbox"
                  checked={filteredRows.length > 0 && selectedRowIds.size === filteredRows.length}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
                  title="Select All Rows"
                />
              </th>

              {visibleColumns.image && (
                <th className="w-16 px-2 py-2.5 text-center">
                  <span>Image</span>
                </th>
              )}

              {visibleColumns.name && (
                <th
                  onClick={() => handleHeaderSort('name')}
                  className="px-3 py-2.5 hover:bg-slate-800/80 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>Name / Title</span>
                    {sortField === 'name' ? (
                      sortAscending ? <ArrowUp className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-50" />
                    )}
                  </div>
                </th>
              )}

              {visibleColumns.gender && (
                <th
                  onClick={() => handleHeaderSort('gender')}
                  className="w-28 px-3 py-2.5 hover:bg-slate-800/80 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>Gender</span>
                    {sortField === 'gender' ? (
                      sortAscending ? <ArrowUp className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-50" />
                    )}
                  </div>
                </th>
              )}

              {visibleColumns.entityType && (
                <th
                  onClick={() => handleHeaderSort('entityType')}
                  className="w-32 px-3 py-2.5 hover:bg-slate-800/80 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>Type / Category</span>
                    {sortField === 'entityType' ? (
                      sortAscending ? <ArrowUp className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-50" />
                    )}
                  </div>
                </th>
              )}

              {visibleColumns.dateCreated && (
                <th
                  onClick={() => handleHeaderSort('dateCreated')}
                  className="w-32 px-3 py-2.5 hover:bg-slate-800/80 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>Date Created</span>
                    {sortField === 'dateCreated' ? (
                      sortAscending ? <ArrowUp className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-50" />
                    )}
                  </div>
                </th>
              )}

              {visibleColumns.creator && (
                <th
                  onClick={() => handleHeaderSort('creator')}
                  className="w-36 px-3 py-2.5 hover:bg-slate-800/80 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>Creator</span>
                    {sortField === 'creator' ? (
                      sortAscending ? <ArrowUp className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-50" />
                    )}
                  </div>
                </th>
              )}

              {visibleColumns.speciesOrWorld && (
                <th
                  onClick={() => handleHeaderSort('speciesOrWorld')}
                  className="w-36 px-3 py-2.5 hover:bg-slate-800/80 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>Species / Lore</span>
                    {sortField === 'speciesOrWorld' ? (
                      sortAscending ? <ArrowUp className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-50" />
                    )}
                  </div>
                </th>
              )}

              {visibleColumns.status && (
                <th
                  onClick={() => handleHeaderSort('status')}
                  className="w-28 px-3 py-2.5 hover:bg-slate-800/80 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>Status</span>
                    {sortField === 'status' ? (
                      sortAscending ? <ArrowUp className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-50" />
                    )}
                  </div>
                </th>
              )}

              {visibleColumns.completionRating && (
                <th
                  onClick={() => handleHeaderSort('completionRating')}
                  className="w-28 px-3 py-2.5 hover:bg-slate-800/80 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>Rating</span>
                    {sortField === 'completionRating' ? (
                      sortAscending ? <ArrowUp className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-50" />
                    )}
                  </div>
                </th>
              )}

              {visibleColumns.subAssets && (
                <th className="w-28 px-3 py-2.5 text-center">
                  <span>Library Count</span>
                </th>
              )}

              {visibleColumns.colorPalette && (
                <th className="w-28 px-3 py-2.5">
                  <span>Color Swatches</span>
                </th>
              )}

              {visibleColumns.description && (
                <th className="min-w-[200px] px-3 py-2.5">
                  <span>Description / Specs</span>
                </th>
              )}

              {visibleColumns.actions && (
                <th className="w-24 px-3 py-2.5 text-center">
                  <span>Actions</span>
                </th>
              )}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-800 font-normal">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={14} className="py-16 text-center text-slate-500 bg-slate-950">
                  <FileSpreadsheet className="w-12 h-12 mx-auto mb-2 opacity-30 text-emerald-500" />
                  <p className="text-sm font-semibold">No records found matching current filters.</p>
                  <p className="text-xs text-slate-500 mt-1">Try clearing search terms or changing gender/category filters.</p>
                </td>
              </tr>
            ) : (
              filteredRows.map((row, rowIdx) => {
                const isSelected = selectedRowIds.has(row.id);
                return (
                  <tr
                    key={row.id}
                    className={`transition-colors hover:bg-slate-900/80 divide-x divide-slate-800/80 ${
                      isSelected ? 'bg-emerald-950/30' : rowIdx % 2 === 0 ? 'bg-slate-950' : 'bg-slate-900/30'
                    }`}
                  >
                    {/* Row Index Checkbox Cell */}
                    <td className="w-12 px-2 py-2 text-center select-none bg-slate-900/40 text-[11px] font-mono text-slate-400">
                      <div className="flex items-center justify-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(row.id)}
                          className="rounded border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
                        />
                        <span>{rowIdx + 1}</span>
                      </div>
                    </td>

                    {/* [A] Image Thumbnail Cell */}
                    {visibleColumns.image && (
                      <td
                        onClick={() => handleCellClick(rowIdx, 'image', row.imageSrc || '')}
                        className={`w-16 p-1.5 text-center ${
                          selectedCell?.rowIdx === rowIdx && selectedCell?.colKey === 'image' ? 'ring-2 ring-emerald-500 ring-inset bg-emerald-950/20' : ''
                        }`}
                      >
                        {row.imageSrc ? (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImage({ src: row.imageSrc!, title: row.name, subtitle: `${row.gender} • ${row.entityType}` });
                            }}
                            className="w-10 h-10 rounded-lg overflow-hidden bg-slate-900 border border-slate-700/80 mx-auto cursor-pointer hover:scale-105 transition-all shadow-xs group relative"
                            title="Click to zoom image"
                          >
                            <img
                              src={row.imageSrc}
                              alt={row.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Eye className="w-3.5 h-3.5 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-600 text-[10px]">
                            {row.sourceType === 'audio' ? <Volume2 className="w-4 h-4 text-emerald-500/60" /> :
                             row.sourceType === 'video' ? <Video className="w-4 h-4 text-rose-500/60" /> :
                             row.sourceType === 'biblePage' ? <FileText className="w-4 h-4 text-amber-500/60" /> :
                             row.sourceType === 'project' ? <Layers className="w-4 h-4 text-cyan-500/60" /> :
                             row.sourceType === 'color' ? <Palette className="w-4 h-4 text-fuchsia-500/60" /> :
                             <User className="w-4 h-4 text-slate-600" />}
                          </div>
                        )}
                      </td>
                    )}

                    {/* [B] Name Cell with direct Link to Profile */}
                    {visibleColumns.name && (
                      <td
                        onClick={() => handleCellClick(rowIdx, 'name', row.name)}
                        className={`px-3 py-2 ${
                          selectedCell?.rowIdx === rowIdx && selectedCell?.colKey === 'name' ? 'ring-2 ring-emerald-500 ring-inset bg-emerald-950/20' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <span className="font-bold text-white text-xs block truncate">{row.name}</span>
                            {row.tagline && (
                              <span className="text-[10px] text-slate-400 block truncate italic">{row.tagline}</span>
                            )}
                          </div>

                          {row.characterRef && onSelectCharacter && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectCharacter(row.characterRef!);
                              }}
                              className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 hover:bg-emerald-800 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                              title="Jump directly to character profile page"
                            >
                              <span>Profile</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}

                    {/* [C] Gender Category Cell */}
                    {visibleColumns.gender && (
                      <td
                        onClick={() => handleCellClick(rowIdx, 'gender', row.gender)}
                        className={`w-28 px-3 py-2 ${
                          selectedCell?.rowIdx === rowIdx && selectedCell?.colKey === 'gender' ? 'ring-2 ring-emerald-500 ring-inset bg-emerald-950/20' : ''
                        }`}
                      >
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold inline-flex items-center gap-1 ${
                          row.gender === 'Male' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' :
                          row.gender === 'Female' ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40' :
                          row.gender === 'Others' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                          'bg-zinc-800 text-zinc-300 border border-zinc-700'
                        }`}>
                          {row.gender === 'Male' ? '♂ Male' :
                           row.gender === 'Female' ? '♀ Female' :
                           row.gender === 'Others' ? '⚧ Others' :
                           '❓ Undefined'}
                        </span>
                      </td>
                    )}

                    {/* [D] Type Cell */}
                    {visibleColumns.entityType && (
                      <td
                        onClick={() => handleCellClick(rowIdx, 'entityType', row.entityType)}
                        className={`w-32 px-3 py-2 text-slate-300 ${
                          selectedCell?.rowIdx === rowIdx && selectedCell?.colKey === 'entityType' ? 'ring-2 ring-emerald-500 ring-inset bg-emerald-950/20' : ''
                        }`}
                      >
                        <span className="text-[11px] bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 text-slate-300 font-mono">
                          {row.entityType}
                        </span>
                      </td>
                    )}

                    {/* [E] Date Created Cell */}
                    {visibleColumns.dateCreated && (
                      <td
                        onClick={() => handleCellClick(rowIdx, 'dateCreated', row.dateCreated)}
                        className={`w-32 px-3 py-2 font-mono text-[11px] text-slate-400 ${
                          selectedCell?.rowIdx === rowIdx && selectedCell?.colKey === 'dateCreated' ? 'ring-2 ring-emerald-500 ring-inset bg-emerald-950/20' : ''
                        }`}
                      >
                        {row.dateCreated}
                      </td>
                    )}

                    {/* [F] Creator Cell */}
                    {visibleColumns.creator && (
                      <td
                        onClick={() => handleCellClick(rowIdx, 'creator', row.creator)}
                        className={`w-36 px-3 py-2 ${
                          selectedCell?.rowIdx === rowIdx && selectedCell?.colKey === 'creator' ? 'ring-2 ring-emerald-500 ring-inset bg-emerald-950/20' : ''
                        }`}
                      >
                        <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                          <User className="w-3 h-3 text-emerald-400" />
                          {row.creator}
                        </span>
                      </td>
                    )}

                    {/* [G] Species / Lore Cell */}
                    {visibleColumns.speciesOrWorld && (
                      <td
                        onClick={() => handleCellClick(rowIdx, 'speciesOrWorld', row.speciesOrWorld)}
                        className={`w-36 px-3 py-2 text-slate-400 truncate ${
                          selectedCell?.rowIdx === rowIdx && selectedCell?.colKey === 'speciesOrWorld' ? 'ring-2 ring-emerald-500 ring-inset bg-emerald-950/20' : ''
                        }`}
                        title={row.speciesOrWorld}
                      >
                        {row.speciesOrWorld}
                      </td>
                    )}

                    {/* [H] Status Cell */}
                    {visibleColumns.status && (
                      <td
                        onClick={() => handleCellClick(rowIdx, 'status', row.status)}
                        className={`w-28 px-3 py-2 ${
                          selectedCell?.rowIdx === rowIdx && selectedCell?.colKey === 'status' ? 'ring-2 ring-emerald-500 ring-inset bg-emerald-950/20' : ''
                        }`}
                      >
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          row.status === 'Sorted' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                          row.status === 'Duplicate' ? 'bg-red-500/15 text-red-400 border border-red-500/30' :
                          row.status === 'Draft' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                          'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                    )}

                    {/* [I] Completion Rating Cell */}
                    {visibleColumns.completionRating && (
                      <td
                        onClick={() => handleCellClick(rowIdx, 'completionRating', row.completionRating)}
                        className={`w-28 px-3 py-2 font-mono text-[11px] text-slate-300 ${
                          selectedCell?.rowIdx === rowIdx && selectedCell?.colKey === 'completionRating' ? 'ring-2 ring-emerald-500 ring-inset bg-emerald-950/20' : ''
                        }`}
                      >
                        {row.completionRating}
                      </td>
                    )}

                    {/* [J] Sub-Assets Counts Cell */}
                    {visibleColumns.subAssets && (
                      <td
                        onClick={() => handleCellClick(rowIdx, 'subAssets', JSON.stringify(row.subAssetCounts || {}))}
                        className={`w-28 px-3 py-2 text-center ${
                          selectedCell?.rowIdx === rowIdx && selectedCell?.colKey === 'subAssets' ? 'ring-2 ring-emerald-500 ring-inset bg-emerald-950/20' : ''
                        }`}
                      >
                        {row.subAssetCounts ? (
                          <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-slate-400">
                            <span title="Images" className="flex items-center gap-0.5"><ImageIcon className="w-2.5 h-2.5 text-blue-400" />{row.subAssetCounts.images}</span>
                            <span title="Lore docs" className="flex items-center gap-0.5"><FileText className="w-2.5 h-2.5 text-amber-400" />{row.subAssetCounts.biblePages}</span>
                            <span title="Audios" className="flex items-center gap-0.5"><Volume2 className="w-2.5 h-2.5 text-emerald-400" />{row.subAssetCounts.audios}</span>
                            {row.subAssetCounts.videos > 0 && (
                              <span title="Videos" className="flex items-center gap-0.5"><Video className="w-2.5 h-2.5 text-rose-400" />{row.subAssetCounts.videos}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    )}

                    {/* [K] Color Palette Cell */}
                    {visibleColumns.colorPalette && (
                      <td
                        onClick={() => handleCellClick(rowIdx, 'colorPalette', (row.colorPalette || []).join(', '))}
                        className={`w-28 px-3 py-2 ${
                          selectedCell?.rowIdx === rowIdx && selectedCell?.colKey === 'colorPalette' ? 'ring-2 ring-emerald-500 ring-inset bg-emerald-950/20' : ''
                        }`}
                      >
                        {row.colorPalette && row.colorPalette.length > 0 ? (
                          <div className="flex items-center gap-1">
                            {row.colorPalette.slice(0, 4).map((hex, i) => (
                              <div
                                key={i}
                                className="w-3.5 h-3.5 rounded-full border border-slate-700 shadow-xs"
                                style={{ backgroundColor: hex }}
                                title={hex}
                              />
                            ))}
                            {row.colorPalette.length > 4 && (
                              <span className="text-[10px] text-slate-500 font-mono">+{row.colorPalette.length - 4}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    )}

                    {/* [L] Description Cell */}
                    {visibleColumns.description && (
                      <td
                        onClick={() => handleCellClick(rowIdx, 'description', row.description)}
                        className={`min-w-[200px] px-3 py-2 text-slate-300 text-[11px] leading-relaxed line-clamp-2 ${
                          selectedCell?.rowIdx === rowIdx && selectedCell?.colKey === 'description' ? 'ring-2 ring-emerald-500 ring-inset bg-emerald-950/20' : ''
                        }`}
                        title={row.description}
                      >
                        {row.description}
                      </td>
                    )}

                    {/* [M] Actions Cell */}
                    {visibleColumns.actions && (
                      <td className="w-24 px-3 py-2 text-center select-none">
                        <div className="flex items-center justify-center gap-1">
                          {row.characterRef && (
                            <button
                              onClick={() => {
                                if (onSelectCharacter) onSelectCharacter(row.characterRef!);
                                else setEditingCharacter(row.characterRef!);
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 transition-all border border-slate-700 cursor-pointer"
                              title="Edit Character Profile"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {row.imageSrc && (
                            <button
                              onClick={() => setPreviewImage({ src: row.imageSrc!, title: row.name, subtitle: `${row.gender} • ${row.entityType}` })}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700 cursor-pointer"
                              title="Preview Image"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              safeCopyToClipboard(JSON.stringify(row, null, 2));
                              triggerToast(`Copied row "${row.name}" data to clipboard`);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-all border border-slate-700 cursor-pointer"
                            title="Copy Row JSON"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 6. Google Sheets Bottom Status Bar */}
      <div className="bg-slate-900 border-t border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 font-mono shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Ready</span>
          </span>
          <span>{filteredRows.length} Rows</span>
          <span>13 Columns</span>
          <span className="text-emerald-400">Default: 1 Profile per Row</span>
        </div>

        <div className="flex items-center gap-4">
          <span>Statues: ♂ {statueCounts.male} | ♀ {statueCounts.female} | ⚧ {statueCounts.others} | ❓ {statueCounts.undefinedGender}</span>
          <span className="text-slate-500">Armstech Spreadsheet Engine v3.0</span>
        </div>
      </div>

      {/* Sorting & Grouping Studio Modal */}
      {showSortingModal && (
        <SortingEditorModal
          isOpen={showSortingModal}
          onClose={() => setShowSortingModal(false)}
          characters={characters}
          items={items}
          onUpdateCharacter={onUpdateCharacter}
          onSelectCharacter={onSelectCharacter}
        />
      )}

      {/* Audit & Statue Counter Report Modal */}
      {showReportModal && (
        <DatabaseReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          characters={characters}
          items={items}
          creatorProfileName={creatorProfileName}
        />
      )}

      {/* Image Preview / Lightbox Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="max-w-3xl w-full bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div>
                <h3 className="font-bold text-white text-base">{previewImage.title}</h3>
                {previewImage.subtitle && (
                  <p className="text-xs text-slate-400">{previewImage.subtitle}</p>
                )}
              </div>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 bg-slate-950 flex items-center justify-center max-h-[70vh] overflow-hidden">
              <img
                src={previewImage.src}
                alt={previewImage.title}
                className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-2xl border border-slate-800"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
              <a
                href={previewImage.src}
                download={`${previewImage.title.toLowerCase().replace(/\s+/g, '_')}_full.png`}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all"
              >
                <Download className="w-4 h-4" /> Download High-Res
              </a>
              <button
                onClick={() => setPreviewImage(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editing Character Modal (When clicked from spreadsheet) */}
      {editingCharacter && (
        <CharacterEditor
          character={editingCharacter}
          charId={editingCharacter.id}
          characters={characters}
          setCharacters={setCharacters}
          items={items}
          setItems={setItems}
          onClose={() => setEditingCharacter(null)}
          onSave={(updated) => {
            if (onUpdateCharacter && editingCharacter) {
              onUpdateCharacter({ ...editingCharacter, ...updated });
            } else if (setCharacters) {
              setCharacters((prev) => prev.map((c) => (c.id === editingCharacter.id ? { ...c, ...updated } : c)));
            }
            setEditingCharacter(null);
            triggerToast('Character updated successfully!');
          }}
        />
      )}
    </div>
  );
}
