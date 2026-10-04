export type Gender = 'Male' | 'Female' | 'Others' | 'Objects';
export type Status = 'Sorted' | 'Unsorted' | 'Duplicate' | 'No Characters';
export type Theme = 'light' | 'dark' | 'green-blue' | 'red';

export interface SubImage {
  id: string;
  src: string;
  title: string;
  description: string;
  originalSrc?: string; // Add original source for re-cropping
  highlightArea?: { x: number; y: number; w: number; h: number }; // Relative coordinates (0-1)
}

export interface ProjectTable {
  id: string;
  title: string;
  columns: string[];
  rows: {
    id: string;
    content: string;
    isImage?: boolean;
    bgColor?: string;
    textColor?: string;
    fontWeight?: 'normal' | 'bold';
    fontSize?: string;
  }[][];
}

export interface ProjectRelation {
  id: string;
  projectName: string;
  roleOrRelation: string; // e.g. "Protagonist", "Cameo", "Weapon Creator", "Primary Setting"
  role?: string;
  status: 'Published' | 'Unpublished' | 'In Progress' | 'Official' | 'Unofficial' | 'Fan Work' | 'Concept';
  relatedEntities?: string; // Names of connected characters or items
  description?: string;
  linkUrl?: string;
  coverArtSrc?: string;
  category?: 'Video Game' | 'Animated Series' | 'Animated Pilot' | 'Comic / Book' | 'Music Album' | 'Mobile App' | 'Film' | string;
  season?: string;
  episode?: string;
  releaseYear?: string;
  platform?: string;
  tables?: ProjectTable[];
}

export interface EntityRelationship {
  id: string;
  targetName?: string;
  targetCharacterName?: string;
  targetEntityName?: string;
  name?: string;
  role?: string;
  description?: string;
  relationshipType?: string; // e.g. "Ally", "Rival", "Creator", "Owner", "Related Item", "Family"
  type?: string;
  notes?: string;
  iconUrl?: string; // Custom uploaded avatar or icon for the related character/entity
}

export interface GenericFileAttachment {
  id: string;
  name: string;
  size?: string;
  type: string;
  url: string;
  description?: string;
  dateAdded?: string;
  dateUploaded?: string;
  category?: string;
}

export interface DevLogEntry {
  id: string;
  date: string;
  hoursSpent: number;
  description: string;
  milestone?: string;
}

export interface DevTracker {
  startDate: string; // e.g., YYYY-MM-DD
  targetDeadline?: string;
  credits: { id?: string; role: string; name: string; contact?: string }[];
  logs: DevLogEntry[];
}

export interface CustomSubTab {
  id: string;
  title: string;
  content: string;
}

export interface CustomTab {
  id: string;
  title: string;
  label?: string;
  content?: string;
  subTabs: CustomSubTab[];
}

export interface AudioMetadata {
  trackNo?: string;
  trackCount?: string;
  discNo?: string;
  discCount?: string;
  title?: string;
  artist?: string;
  album?: string;
  genre?: string;
  year?: string;
  comment?: string;
  url?: string;
  albumArtist?: string;
  copyright?: string;
  publisher?: string;
  composer?: string;
  conductor?: string;
  encodedBy?: string;
  mood?: string;
  catalog?: string;
  isrc?: string;
  userRating?: number;
  key?: string;
  bpm?: string;
  lyrics?: string;
  albumCover?: string;
}

export interface BiblePage {
  id: string;
  title: string;
  content: string;
  parentId?: string;
  isLocked?: boolean;
  lastEdited?: string;
}

export interface Character {
  id: string;
  name: string;
  gender: Gender;
  species: string;
  description: string;
  tagline?: string;
  profileLayout?: 'classic' | 'stacked' | 'side' | 'floating';
  bannerAlignment?: string;
  bannerFit?: 'cover' | 'contain' | 'fill';
  isSketch?: boolean;
  isMasterLocked?: boolean;
  status: Status;
  sourceId: string; // The ID of the image or text it came from
  sourceType: 'image' | 'text';
  entityType?: string; // 'Character', 'Object', 'Material', 'Unknown'
  age?: string;
  role?: string;
  history?: string;
  personality?: string;
  appearance?: string;
  abilities?: string;
  strengths?: string;
  weaknesses?: string;
  completionRating?: string; // e.g., "85% - Fully rendered"
  colorPalette?: string[]; // Array of hex codes
  originalColorPalette?: string[]; // Original colors picked up by analyzer
  isFavorite?: boolean; // User marked as favorite
  favoriteIcon?: string; // Custom icon identifier or emoji (e.g. 'heart', 'heart-cyan', 'star', 'fire', 'sparkles', 'truck', 'smile', 'sleepy', 'smirk', 'heart-eyes', 'peace', 'thumbs-up', 'two-hearts', 'crown', 'gem', or custom image/emoji)
  favoriteColor?: string; // Custom color for the favorite icon
  isUniqueName?: boolean; // true if the name is a specific proper/unique character name, false if generic/descriptor
  highlightedImageSrc?: string;
  subImages?: SubImage[];
  layoutMode?: 'grid' | 'split' | 'bento' | 'timeline' | 'compact';
  // Technical specification fields
  firstPublication?: string;
  firstAppearance?: string;
  dateCreated?: string;
  dateUploaded?: string;
  dateCreatedSource?: 'From Image' | 'From Text' | 'From File Property' | 'Added Manually' | 'Unknown' | 'From File Properties' | 'From Image Scanning' | 'From Text File';
  characterBible?: string;
  biblePages?: BiblePage[];
  bannerImageSrc?: string;
  bannerImage?: string;
  image?: string;
  height?: string;
  weight?: string;
  hairColor?: string;
  eyeColor?: string;
  alignment?: string;
  occupation?: string;
  worldName?: string;
  affiliation?: string;
  placeOfOrigin?: string;
  firstAppearanceType?: 'comic' | 'animation' | 'video game' | 'show' | 'music' | 'other';
  originalCreationDate?: string;
  defaultThumbnailSrc?: string;
  layoutPreference?: 'side-by-side' | 'stacked' | 'mini-player';
  descriptionVisibility?: 'cropped' | 'full' | 'hover-reveal';
  audios?: { id: string; src: string; url?: string; title: string; description: string; category?: string; metadata?: AudioMetadata; isDuplicate?: boolean; duplicateOfId?: string; duration?: string; thumbnailSrc?: string; albumCover?: string; albumTitle?: string; artist?: string; trackNo?: string }[];
  audioTracks?: { id: string; src?: string; title: string; duration?: string; description?: string }[];
  videos?: { id: string; src: string; url?: string; title: string; description: string; category?: string; metadata?: AudioMetadata; isDuplicate?: boolean; duplicateOfId?: string; duration?: string; thumbnailSrc?: string; coverArtSrc?: string; seasonNo?: string; episodeNo?: string; episodeTitle?: string; isPilot?: boolean }[];
  videoClips?: { id: string; src?: string; title: string; duration?: string; thumbnailSrc?: string; description?: string }[];
  mediaCategories?: { id: string; name: string; type: 'image' | 'audio' | 'video'; parentId?: string }[];
  genericFiles?: (GenericFileAttachment & { isDuplicate?: boolean; duplicateOfId?: string })[];
  uploadedFiles?: { id: string; name: string; size?: string; url?: string }[];
  codeSnippets?: { id: string; title: string; language: string; content: string }[];
  outerTabLabels?: Record<string, string>;
  devTracker?: DevTracker;
  categories?: string[];
  tags?: string[];
  customGroup?: string;
  projects?: ProjectRelation[];
  relationships?: EntityRelationship[];
  entityRelationships?: EntityRelationship[];
  customTabs?: CustomTab[];
  creator?: string; // Default creator, e.g., "Alberto Armentero"
  bannerFilter?: { brightness: number; contrast: number; saturate: number };
  globalImageFilter?: { brightness: number; contrast: number; saturate: number };
  tabColors?: Record<string, string>; // Custom hex or tailwind colors per tab
  iconAlignment?: string;
  iconFit?: 'cover' | 'contain' | 'fill';
  iconScale?: number;
  iconShape?: 'rounded' | 'circle' | 'square';
  showIndicators?: boolean;
  indicatorDots?: Record<string, boolean>;
  attributes?: Record<string, string>; // Height, Weight, Hair Color, Eye Color, etc.
  tabLayout?: 'top' | 'side'; // Main tabs layout: Top bar or Side bar
  tabRows?: 'single' | 'multi'; // Multi-row wrapping for main tabs (applicable in top layout)
  tabOrder?: string[]; // Customized order of tabs for drag-and-drop sorting
  tabLayoutPosition?: 'top' | 'bottom' | 'left' | 'right'; // Tab position on any of the four sides
  editToolsPosition?: 'top' | 'bottom' | 'left' | 'right'; // Edit tools position on any of the four sides
  tabsWidth?: number; // Sizable width of the tab sidebar
  editToolsWidth?: number; // Sizable width of the edit tools sidebar
  tabsHeight?: number; // Sizable height of the horizontal tabs bar
  editToolsHeight?: number; // Sizable height of the horizontal edit tools bar
  uiControlsPositions?: { export?: 'top' | 'bottom' | 'nav'; save?: 'top' | 'bottom' | 'nav' };
  hideBanner?: boolean;
  hideIcon?: boolean;
  reverseHeaderLayout?: boolean;
  bannerHeight?: number;
  iconSize?: number;
  modalCustomHeight?: number;
  showPortraitMiniDropper?: boolean;
  corePremise?: string;
  models3D?: any[];
  detailsHeaderTitle?: string;
  detailsHierarchyPosition?: 'left' | 'right' | 'top' | 'bottom';
  mediaViewMode?: 'grid' | 'list';
  mediaAspect?: 'square' | 'landscape' | 'portrait' | 'wide' | 'auto';
  mediaGridCols?: number;
  editToolsOrder?: string[];
  codeFiles?: { id: string; name: string; language: string; content: string; description: string; dateAdded?: string }[];
  bookletSettings?: { template: 'magazine' | 'portfolio' | 'high-tech' | 'vintage'; pageSize: 'letter' | 'a4' | 'legal'; customHeader?: string; customFooter?: string; selectedPages?: string[] };
}

export interface ArchiveItem {
  id: string;
  type: 'image' | 'text' | 'audio' | 'video';
  content: string; // Object URL for image, or text string for text
  thumbnailContent?: string; // Cropped version for thumbnails
  originalName: string;
  characterId?: string;
  hash?: string; // To help detect exact duplicates
  description: string;
  isSketch?: boolean;
  charactersCount: number;
  fileDate?: number;
  artStyle?: string;
  medium?: string;
  rating?: number;
  fileSize?: number; // Size in bytes
  createdAt?: number;
  modifiedAt?: number;
  isFavorite?: boolean;
  favoriteIcon?: string;
  favoriteColor?: string;
  isHidden?: boolean;
  isGroup?: boolean;
  groupName?: string;
  isDuplicate?: boolean;
  duplicateOfId?: string;
}
