import React, { useState, useEffect, useRef } from 'react';
import { 
  HelpCircle, X, Eye, EyeOff, User, BookOpen, Briefcase, 
  ImageIcon, Code, Printer, Settings, Clock, Sparkles, 
  Keyboard, UploadCloud, Search, Sliders, Shield, Layers,
  Terminal, FileText, CheckCircle2, ChevronRight, Lightbulb,
  Zap, Compass, Star, Palette, BookMarked, Cpu, Play,
  Maximize2, Minimize2, ArrowRight, Pause, Volume2, Film
} from 'lucide-react';
import { Character } from '../types';

// Import Generated Sketch Character Tutorial Assets - Verified
const guideMainHubImg = '/src/assets/images/guide_main_hub_1786688029077.jpg';
const guideBioProfileImg = '/src/assets/images/guide_bio_profile_1786688039599.jpg';
const guideCodexBookImg = '/src/assets/images/guide_codex_book_1786688050337.jpg';
const guidePortfolioArtImg = '/src/assets/images/guide_portfolio_art_1786688058361.jpg';
const guideMediaCubeImg = '/src/assets/images/guide_media_cube_1786688067781.jpg';
const guideCodeTerminalImg = '/src/assets/images/guide_code_terminal_1786688075561.jpg';
const guidePrintBookletImg = '/src/assets/images/guide_print_booklet_1786688084796.jpg';
const guideSpecsTechImg = '/src/assets/images/guide_specs_tech_1786688105151.jpg';
const guideDevHoursImg = '/src/assets/images/guide_dev_hours_1786688113929.jpg';

export interface FeatureHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: string;
  character?: Character | null;
  customIcon?: React.ElementType;
}

interface TabConfig {
  id: string;
  label: string;
  shortLabel: string;
  icon?: React.ElementType;
  section: string;
  badge: string;
  tagColor: string;
  accentBg: string;
  accentText: string;
  accentBorder: string;
  gradientHeader: string;
  activeBadge: string;
  sketchImg: string;
  sketchTitle: string;
  sketchCaption: string;
  proTip: string;
  videoUrl?: string;
  videoPrompt?: string;
  flipbookImages?: string[]; // Array of images for flipbook
}

export const FeatureHelpModal: React.FC<FeatureHelpModalProps> = ({ 
  isOpen, 
  onClose, 
  initialTab = 'main_workspace',
  character = null,
  customIcon: CustomIcon = Sparkles
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab || 'main_workspace');
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [viewMode, setViewMode] = useState<'detailed' | 'visual' | 'overlay'>('detailed');
  const [imageSize, setImageSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [flipbookIndex, setFlipbookIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [customIconUrl, setCustomIconUrl] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const imageSizeClasses = {
    small: 'max-h-[40vh] max-w-[50%]',
    medium: 'max-h-[60vh] max-w-[80%]',
    large: 'max-h-[85vh] max-w-[95%]'
  };

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomIconUrl(url);
    }
  };

  const helpTabs: TabConfig[] = [
    { 
      id: 'main_workspace', 
      label: 'Main Hub & Gallery', 
      shortLabel: 'Hub',
      icon: Sparkles, 
      section: 'Core Workspace',
      badge: 'Hub',
      tagColor: 'bg-amber-500 text-white',
      accentBg: 'bg-amber-500/10 dark:bg-amber-500/15',
      accentText: 'text-amber-600 dark:text-amber-400',
      accentBorder: 'border-amber-500/30',
      gradientHeader: 'from-amber-500/20 via-orange-500/10 to-transparent',
      activeBadge: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/20',
      sketchImg: guideMainHubImg,
      sketchTitle: 'Stan the Organizer',
      sketchCaption: 'Sorting, tagging & batch ingesting character cards seamlessly into the multiverse archive.',
      proTip: 'Drop up to 200 files onto the header zone at once! Enable "Group files into 1 character" to bundle turnarounds and sketches into a single profile.',
      videoPrompt: 'Show a stick figure rapidly dragging a large folder of character art files onto the header of the app. Transition to show the cards being automatically sorted and tagged by AI.',
      flipbookImages: [guideMainHubImg]
    },
    { 
      id: 'overview', 
      label: 'Overview & Summary', 
      shortLabel: 'Overview',
      icon: Eye, 
      section: 'Character Editor',
      badge: 'Stats',
      tagColor: 'bg-purple-500 text-white',
      accentBg: 'bg-purple-500/10 dark:bg-purple-500/15',
      accentText: 'text-purple-600 dark:text-purple-400',
      accentBorder: 'border-purple-500/30',
      gradientHeader: 'from-purple-500/20 via-indigo-500/10 to-transparent',
      activeBadge: 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-purple-500/20',
      sketchImg: character?.highlightedImageSrc || guideMainHubImg,
      sketchTitle: 'Hero Portrait & Snapshot',
      sketchCaption: 'Instant high-resolution portrait framing, completion gauges, and quick status toggles.',
      proTip: 'Click the "AI Polish" button next to any description to run automated grammar checks, style enhancement, and suggested codex tags.',
      videoPrompt: 'Show a stick figure opening a character profile, clicking "AI Polish", and watching the description text transform and improve in real-time with highlighted changes.',
      flipbookImages: [character?.highlightedImageSrc || guideMainHubImg]
    },
    { 
      id: 'profile', 
      label: 'Profile & Biography', 
      shortLabel: 'Profile',
      icon: User, 
      section: 'Character Editor',
      badge: 'Lore',
      tagColor: 'bg-emerald-500 text-white',
      accentBg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      accentText: 'text-emerald-600 dark:text-emerald-400',
      accentBorder: 'border-emerald-500/30',
      gradientHeader: 'from-emerald-500/20 via-teal-500/10 to-transparent',
      activeBadge: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/20',
      sketchImg: guideBioProfileImg,
      sketchTitle: 'Chronicler Scribe',
      sketchCaption: 'Documenting origin stories, legacy timelines, custom physical metrics & color schemes.',
      proTip: 'Add custom key-value pairs in the Attributes Ledger (e.g., "Weapon Class", "Aura Color", "Homeworld") to tailor specs for any fiction genre.',
      videoPrompt: 'Show a stick figure typing into the bio section, then adding a new custom attribute row titled "Aura Color" and picking a color swatch.',
      flipbookImages: [guideBioProfileImg]
    },
    { 
      id: 'details', 
      label: 'Codex Bible & Lore', 
      shortLabel: 'Codex',
      icon: BookOpen, 
      section: 'Character Editor',
      badge: 'Bible',
      tagColor: 'bg-blue-500 text-white',
      accentBg: 'bg-blue-500/10 dark:bg-blue-500/15',
      accentText: 'text-blue-600 dark:text-blue-400',
      accentBorder: 'border-blue-500/30',
      gradientHeader: 'from-blue-500/20 via-cyan-500/10 to-transparent',
      activeBadge: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-blue-500/20',
      sketchImg: guideCodexBookImg,
      sketchTitle: 'Master Story Tome',
      sketchCaption: 'Hierarchical worldbuilding chapters, secret locked lore sections, and rich text worldcrafting.',
      proTip: 'Click the padlock icon on critical lore chapters to lock them against accidental edits while presenting your production bible to clients or collaborators.',
      videoPrompt: 'Show a stick figure navigating the lore tree, creating new sub-chapters, and clicking the padlock icon to lock a chapter.',
      flipbookImages: [guideCodexBookImg]
    },
    { 
      id: 'projects', 
      label: 'Projects Portfolio', 
      shortLabel: 'Projects',
      icon: Briefcase, 
      section: 'Character Editor',
      badge: 'Works',
      tagColor: 'bg-rose-500 text-white',
      accentBg: 'bg-rose-500/10 dark:bg-rose-500/15',
      accentText: 'text-rose-600 dark:text-rose-400',
      accentBorder: 'border-rose-500/30',
      gradientHeader: 'from-rose-500/20 via-pink-500/10 to-transparent',
      activeBadge: 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-rose-500/20',
      sketchImg: guidePortfolioArtImg,
      sketchTitle: 'Production Storyboarder',
      sketchCaption: 'Mapping cross-media appearances across comics, video games, animated pilots, and merchandise.',
      proTip: 'Use the embedded Storyboard Grid tables inside projects to sketch scene-by-scene script breakdowns and shot lists directly linked to the character.',
      videoPrompt: 'Show a stick figure filling out a storyboard table, adding scenes, and linking a character image to a specific scene row.',
      flipbookImages: [guidePortfolioArtImg]
    },
    { 
      id: 'media', 
      label: 'Media Gallery & 3D', 
      shortLabel: 'Media',
      icon: ImageIcon, 
      section: 'Character Editor',
      badge: '3D/Assets',
      tagColor: 'bg-fuchsia-500 text-white',
      accentBg: 'bg-fuchsia-500/10 dark:bg-fuchsia-500/15',
      accentText: 'text-fuchsia-600 dark:text-fuchsia-400',
      accentBorder: 'border-fuchsia-500/30',
      gradientHeader: 'from-fuchsia-500/20 via-pink-500/10 to-transparent',
      activeBadge: 'bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white shadow-fuchsia-500/20',
      sketchImg: guideMediaCubeImg,
      sketchTitle: 'Media Sandbox & Stage',
      sketchCaption: 'Handling high-res sketches, turnaround plates, audio voice lines, video clips, and 3D rigs.',
      proTip: 'Switch to the 3D Model tab to inspect 3D character mannequins, test armor socket attachments, and simulate animated movement cycles.',
      videoPrompt: 'Show a stick figure dragging images into the gallery, then switching to the 3D view to rotate a character model.',
      flipbookImages: [guideMediaCubeImg]
    },
    { 
      id: 'code', 
      label: 'Code & Applications', 
      shortLabel: 'Code',
      icon: Code, 
      section: 'Character Editor',
      badge: 'Dev',
      tagColor: 'bg-lime-600 text-white',
      accentBg: 'bg-lime-500/10 dark:bg-lime-500/15',
      accentText: 'text-lime-600 dark:text-lime-400',
      accentBorder: 'border-lime-500/30',
      gradientHeader: 'from-lime-500/20 via-emerald-500/10 to-transparent',
      activeBadge: 'bg-gradient-to-r from-lime-600 to-emerald-600 text-white shadow-lime-500/20',
      sketchImg: guideCodeTerminalImg,
      sketchTitle: 'Hacker Script Engine',
      sketchCaption: 'Interactive script runner, game logic components, procedural shaders, and automation hooks.',
      proTip: 'Use the quick boilerplate dropdown to instantly inject working React components or Python image processing scripts with one click.',
      videoPrompt: 'Show a stick figure opening the code tab, selecting a "React Component" from the dropdown, and seeing the component code appear in the editor.',
      flipbookImages: [guideCodeTerminalImg]
    },
    { 
      id: 'cataloger', 
      label: 'Booklet Publisher & Print', 
      shortLabel: 'Publisher',
      icon: Printer, 
      section: 'Character Editor',
      badge: 'Print',
      tagColor: 'bg-indigo-600 text-white',
      accentBg: 'bg-indigo-500/10 dark:bg-indigo-500/15',
      accentText: 'text-indigo-600 dark:text-indigo-400',
      accentBorder: 'border-indigo-500/30',
      gradientHeader: 'from-indigo-500/20 via-blue-500/10 to-transparent',
      activeBadge: 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-indigo-500/20',
      sketchImg: guidePrintBookletImg,
      sketchTitle: 'Master Publisher Press',
      sketchCaption: 'Generating professional magazine spreads, interactive 3D flipbooks, and press-ready PDF books.',
      proTip: 'Open the "Interactive Flipbook Reader" to view a 3D dual-page spread reader with swipe controls, or print directly with custom running headers and page numbers.',
      videoPrompt: 'Show a stick figure selecting "Glossy Magazine", clicking "Generate Flipbook", and then flipping through the interactive digital magazine on screen.',
      flipbookImages: [guidePrintBookletImg]
    },
    { 
      id: 'technical', 
      label: 'Specs & Technical', 
      shortLabel: 'Specs',
      icon: Settings, 
      section: 'Character Editor',
      badge: 'System',
      tagColor: 'bg-orange-500 text-white',
      accentBg: 'bg-orange-500/10 dark:bg-orange-500/15',
      accentText: 'text-orange-600 dark:text-orange-400',
      accentBorder: 'border-orange-500/30',
      gradientHeader: 'from-orange-500/20 via-amber-500/10 to-transparent',
      activeBadge: 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-orange-500/20',
      sketchImg: guideSpecsTechImg,
      sketchTitle: 'Blueprint Engineer',
      sketchCaption: 'Creation timestamps, automated sourcing metadata, export schemas, and raw JSON configurations.',
      proTip: 'Export complete character profiles to standalone JSON files to back up your universe or migrate characters across creative workspaces.',
      videoPrompt: 'Show a stick figure reviewing the technical metadata, then clicking "Export JSON" and showing the download notification.',
      flipbookImages: [guideSpecsTechImg]
    },
    { 
      id: 'dev', 
      label: 'Dev Hours & Credits', 
      shortLabel: 'Credits',
      icon: Clock, 
      section: 'Character Editor',
      badge: 'Team',
      tagColor: 'bg-violet-600 text-white',
      accentBg: 'bg-violet-500/10 dark:bg-violet-500/15',
      accentText: 'text-violet-600 dark:text-violet-400',
      accentBorder: 'border-violet-500/30',
      gradientHeader: 'from-violet-500/20 via-fuchsia-500/10 to-transparent',
      activeBadge: 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-violet-500/20',
      sketchImg: guideDevHoursImg,
      sketchTitle: 'Studio Timekeeper',
      sketchCaption: 'Tracking development work sessions, billable milestone hours, and team artist rosters.',
      proTip: 'Log daily work sprints with milestone tags to accurately calculate total character production budgets and creation hours.',
      videoPrompt: 'Show a stick figure logging hours for a "concept art" milestone and the summary budget chart updating to reflect the new time.',
      flipbookImages: [guideDevHoursImg]
    }
  ];

  const currentTab = helpTabs.find(t => t.id === activeTab) || helpTabs[0];

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setFlipbookIndex(prev => (prev + 1) % (currentTab.flipbookImages?.length || 1));
      }, 2000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, currentTab]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200 select-text"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`bg-card text-card-foreground border border-border rounded-2xl shadow-2xl ${isMaximized ? 'w-[98vw] h-[98vh]' : 'max-w-5xl w-full max-h-[94vh]'} flex flex-col overflow-hidden animate-in zoom-in-95 duration-200`}>
        {/* Modal Top Header Bar */}
        <div className="p-4 sm:p-5 border-b flex justify-between items-center bg-gradient-to-r from-secondary/50 via-background to-secondary/30 shrink-0">
          <div className="flex items-center gap-3">
            <div 
              className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 text-white flex items-center justify-center shadow-lg font-black text-lg ring-2 ring-white/20 cursor-pointer overflow-hidden"
              onClick={() => fileInputRef.current?.click()}
            >
              {customIconUrl ? (
                <img src={customIconUrl} alt="Custom Icon" className="w-full h-full object-cover" />
              ) : (
                <CustomIcon className="w-6 h-6 animate-pulse" />
              )}
              <input type="file" ref={fileInputRef} onChange={handleIconChange} className="hidden" accept="image/*" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-foreground flex items-center gap-2">
                  <span>AADA Illustrated Guide & Reference</span>
                </h2>
                <span className="bg-primary/10 text-primary text-[10px] font-black px-2.5 py-0.5 rounded-full border border-primary/30 uppercase tracking-wider">
                  Interactive Handbook
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground">
                Explore feature tutorials, character workflows, and illustrated tips for every module.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Resize Controls */}
            <div className="flex bg-secondary/50 rounded-lg p-0.5">
              {(['small', 'medium', 'large'] as const).map((size) => {
                const Icon = size === 'small' ? Minimize2 : size === 'medium' ? Maximize2 : Maximize2;
                return (
                  <button
                    key={size}
                    onClick={() => setImageSize(size)}
                    className={`p-2 rounded-md transition-all ${
                      imageSize === size
                        ? 'bg-background shadow-sm text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    }`}
                    title={`${size.charAt(0).toUpperCase() + size.slice(1)} Size`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setViewMode(prev => prev === 'detailed' ? 'visual' : 'detailed')}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all cursor-pointer"
              title={viewMode === 'detailed' ? "Visual Only Mode" : "Show Details"}
            >
              {viewMode === 'detailed' ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-colors cursor-pointer"
              title={isMaximized ? "Restore Size" : "Maximize (Full Screen)"}
            >
              {isMaximized ? <Maximize2 className="w-5 h-5 rotate-180" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-colors cursor-pointer"
              title="Close Guide (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Colorful Tab Selector Navigation Strip */}
        <div className="flex border-b px-2 sm:px-4 py-2.5 bg-secondary/25 gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {helpTabs.map((tab, idx) => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                  isSel 
                    ? `${tab.activeBadge} shadow-md scale-105 ring-1 ring-white/20` 
                    : 'bg-background hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/60 hover:scale-102'
                }`}
                title={tab.label}
              >
                <div className={`p-1 rounded-md ${isSel ? 'bg-white/20' : tab.accentBg} ${isSel ? 'text-white' : tab.accentText}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span>{tab.shortLabel}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${isSel ? 'bg-white/25 text-white' : 'bg-secondary text-muted-foreground'}`}>
                  {idx + 1}
                </span>
              </button>
            );
          })}
        </div>
        
        {/* Modal Body */}
        <div className={`flex flex-1 overflow-hidden relative`}>
          {/* Visual Area (Always show) */}
          <div className={`flex-1 flex flex-col p-4 bg-black/5 overflow-y-auto`}>
            {/* Flipbook Viewer */}
            <div className="flex-1 flex flex-col items-center justify-center gap-4 min-h-[400px]">
              <div className="relative w-full h-full flex items-center justify-center">
                 <img 
                  src={currentTab.flipbookImages?.[flipbookIndex] || currentTab.sketchImg} 
                  alt="Flipbook Page" 
                  className={`${imageSizeClasses[imageSize]} object-contain rounded-xl shadow-2xl transition-all`}
                  referrerPolicy="no-referrer"
                 />
                 {/* Flipbook Controls */}
                 <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 p-2 rounded-full text-white">
                   <button onClick={() => setFlipbookIndex(p => Math.max(0, p - 1))} className="p-1 hover:bg-white/20 rounded-full"><ChevronRight className="rotate-180"/></button>
                   <button onClick={() => setIsPlaying(!isPlaying)} className="p-1 hover:bg-white/20 rounded-full">{isPlaying ? <Pause /> : <Play />}</button>
                   <button onClick={() => setFlipbookIndex(p => Math.min((currentTab.flipbookImages?.length || 1) - 1, p + 1))} className="p-1 hover:bg-white/20 rounded-full"><ChevronRight /></button>
                 </div>
              </div>
              
              {/* Subtitles (Concept) */}
              <div className="bg-black/80 text-white px-6 py-2 rounded-full text-sm font-medium shrink-0">
                {currentTab.sketchTitle} - Step {flipbookIndex + 1}
              </div>
            </div>
          </div>

          {/* Detailed Area (Conditional) */}
          {viewMode === 'detailed' && (
             <div className="w-1/3 border-l bg-card overflow-y-auto p-6 space-y-6 text-left scrollbar-thin scroll-smooth">

                {/* Active Tab Hero Banner */}
                <div className={`rounded-2xl border ${currentTab.accentBorder} bg-gradient-to-r ${currentTab.gradientHeader} p-4 sm:p-5 relative overflow-hidden shadow-xs`}>
                    <div className="flex flex-col items-start gap-2">
                        <h3 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2.5">
                        <currentTab.icon className={`w-6 h-6 ${currentTab.accentText}`} />
                        <span>{currentTab.label}</span>
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                        {currentTab.sketchCaption}
                        </p>
                    </div>
                </div>
                {/* Existing Steps and Content ... */}
                <div className={`p-4 rounded-xl border ${currentTab.accentBorder} bg-secondary/20`}>
                  <p className="text-xs">{currentTab.proTip}</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <Zap className={`w-4 h-4 ${currentTab.accentText}`} /> Step-by-Step
                    </h4>
                  </div>
                  {/* Step 1 */}
                  <div className="p-3 rounded-lg border bg-card text-xs">
                    <p className="font-bold">Step 1</p>
                    <p className="text-muted-foreground">Workflow details...</p>
                  </div>
                  {/* Step 2 */}
                  <div className="p-3 rounded-lg border bg-card text-xs">
                    <p className="font-bold">Step 2</p>
                    <p className="text-muted-foreground">Workflow details...</p>
                  </div>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeatureHelpModal;
