import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Heart, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Vibrate, 
  Play, 
  Pause, 
  Shuffle, 
  Search, 
  Monitor, 
  Gamepad2, 
  Zap, 
  User, 
  Tag, 
  Briefcase, 
  Award, 
  ShieldCheck, 
  Layers, 
  X,
  SlidersHorizontal,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Character } from '../types';
import { CharacterEditor } from './CharacterEditor';
import { RenderFavoriteIcon } from './FavoriteIconRenderer';
import { FavoriteIconSelectorModal } from './FavoriteIconSelectorModal';

interface ArcadeModeShowcaseProps {
  characters: Character[];
  selectedCharacter?: Character | null;
  onSelectCharacter?: (char: Character) => void;
  title?: string;
  onSwitchToDesktop?: () => void;
  setCharacters?: React.Dispatch<React.SetStateAction<Character[]>>;
  items?: any[];
  setItems?: React.Dispatch<React.SetStateAction<any[]>>;
}

export type NeonTheme = 'rainbow' | 'cyberpunk' | 'matrix' | 'sunburst' | 'synthwave';

export function ArcadeModeShowcase({
  characters = [],
  selectedCharacter,
  onSelectCharacter,
  title = "SHOWCASE VIEW",
  onSwitchToDesktop,
  setCharacters,
  items = [],
  setItems
}: ArcadeModeShowcaseProps) {
  // Active character index state
  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    if (selectedCharacter && characters.length > 0) {
      const idx = characters.findIndex(c => c.id === selectedCharacter.id);
      return idx >= 0 ? idx : 0;
    }
    return 0;
  });

  // Slide direction for transition animation (1 for right/next, -1 for left/prev)
  const [direction, setDirection] = useState<number>(1);

  // Active editing character state (opens full CharacterEditor modal when clicked)
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  // Custom Favorite Icon Modal state
  const [isFavIconModalOpen, setIsFavIconModalOpen] = useState<boolean>(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');

  // Ultimate Controls State (unhidden by default)
  const [showControls, setShowControls] = useState<boolean>(true);

  // Arcade Settings: Neon Palette, Auto-play, Sound, Vibration
  const [neonTheme, setNeonTheme] = useState<NeonTheme>('rainbow');
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [vibrationEnabled, setVibrationEnabled] = useState<boolean>(true);
  const [screenPulse, setScreenPulse] = useState<boolean>(false);

  // Touch Swipe Gesture State
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Filtered characters list based on search and category
  const filteredCharacters = characters.filter(char => {
    const matchesSearch = searchQuery === '' || 
      char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (char.role && char.role.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (char.species && char.species.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (selectedCategoryFilter === 'All') return matchesSearch;
    if (selectedCategoryFilter === 'Favorites') return matchesSearch && char.isFavorite;
    if (selectedCategoryFilter === 'Male') return matchesSearch && char.gender === 'Male';
    if (selectedCategoryFilter === 'Female') return matchesSearch && char.gender === 'Female';
    if (selectedCategoryFilter === 'Objects') return matchesSearch && char.gender === 'Objects';
    return matchesSearch;
  });

  const activeChar = filteredCharacters[currentIndex] || filteredCharacters[0] || characters[0];

  // Sync index when filter changes
  useEffect(() => {
    if (currentIndex >= filteredCharacters.length && filteredCharacters.length > 0) {
      setCurrentIndex(0);
    }
  }, [filteredCharacters.length, currentIndex]);

  // Haptics & Sound Helper
  const triggerArcadeFeedback = () => {
    // Screen pulse FX
    setScreenPulse(true);
    setTimeout(() => setScreenPulse(false), 200);

    // Haptic vibration
    if (vibrationEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([15, 30, 15]);
      } catch (e) {
        // Ignored if device blocks vibration
      }
    }

    // Audio synth click blip
    if (soundEnabled) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(440, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
          gain.gain.setValueAtTime(0.12, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.08);
        }
      } catch (e) {
        // Ignored
      }
    }
  };

  // Carousel Navigation Handlers
  const handleNext = () => {
    if (filteredCharacters.length <= 1) return;
    setDirection(1);
    setCurrentIndex(prev => (prev + 1) % filteredCharacters.length);
    triggerArcadeFeedback();
  };

  const handlePrev = () => {
    if (filteredCharacters.length <= 1) return;
    setDirection(-1);
    setCurrentIndex(prev => (prev - 1 + filteredCharacters.length) % filteredCharacters.length);
    triggerArcadeFeedback();
  };

  const handleSelectIndex = (idx: number) => {
    if (idx === currentIndex) return;
    setDirection(idx > currentIndex ? 1 : -1);
    setCurrentIndex(idx);
    triggerArcadeFeedback();
  };

  const handleShuffle = () => {
    if (filteredCharacters.length <= 1) return;
    const randomIdx = Math.floor(Math.random() * filteredCharacters.length);
    setDirection(randomIdx > currentIndex ? 1 : -1);
    setCurrentIndex(randomIdx);
    triggerArcadeFeedback();
  };

  // Auto-play Carousel Timer
  useEffect(() => {
    if (!isAutoPlaying || filteredCharacters.length <= 1) return;
    const timer = setInterval(() => {
      handleNext();
    }, 4000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, filteredCharacters.length, currentIndex]);

  // Touch Finger Swiping Listeners
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;

    // Horizontal swipe threshold
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        handlePrev();
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (activeChar) setEditingCharacter(activeChar);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredCharacters.length, currentIndex, activeChar]);

  // Toggle Favorite
  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeChar || !setCharacters) return;
    triggerArcadeFeedback();
    setCharacters(prev => prev.map(c => c.id === activeChar.id ? { ...c, isFavorite: !c.isFavorite } : c));
  };

  // Neon Frame Theme Styling Mapping
  const getNeonStyle = () => {
    switch (neonTheme) {
      case 'cyberpunk':
        return {
          border: 'border-cyan-400',
          shadow: 'shadow-[0_0_25px_rgba(6,182,212,0.8),0_0_50px_rgba(236,72,153,0.5)]',
          badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
          accentText: 'text-cyan-400',
          gradientBg: 'from-cyan-950/40 via-background to-pink-950/40',
        };
      case 'matrix':
        return {
          border: 'border-emerald-400',
          shadow: 'shadow-[0_0_25px_rgba(52,211,153,0.8),0_0_50px_rgba(16,185,129,0.5)]',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
          accentText: 'text-emerald-400',
          gradientBg: 'from-emerald-950/40 via-background to-black',
        };
      case 'sunburst':
        return {
          border: 'border-amber-400',
          shadow: 'shadow-[0_0_25px_rgba(251,191,36,0.8),0_0_50px_rgba(245,158,11,0.5)]',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
          accentText: 'text-amber-400',
          gradientBg: 'from-amber-950/40 via-background to-red-950/40',
        };
      case 'synthwave':
        return {
          border: 'border-pink-500',
          shadow: 'shadow-[0_0_25px_rgba(236,72,153,0.8),0_0_50px_rgba(168,85,247,0.5)]',
          badgeBg: 'bg-pink-500/20 text-pink-300 border-pink-400/40',
          accentText: 'text-pink-400',
          gradientBg: 'from-purple-950/40 via-background to-pink-950/40',
        };
      case 'rainbow':
      default:
        return {
          border: 'border-indigo-400',
          shadow: 'shadow-[0_0_30px_rgba(99,102,241,0.7),0_0_60px_rgba(236,72,153,0.5)]',
          badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40',
          accentText: 'text-indigo-400',
          gradientBg: 'from-indigo-950/40 via-background to-purple-950/40',
        };
    }
  };

  const neonStyle = getNeonStyle();

  // Animation variants for smooth sliding
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 280 : -280,
      opacity: 0,
      scale: 0.88,
      rotateY: dir > 0 ? 15 : -15,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
      transition: {
        x: { type: 'spring' as const, stiffness: 300, damping: 28 },
        opacity: { duration: 0.25 },
        scale: { duration: 0.25 },
      },
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 280 : -280,
      opacity: 0,
      scale: 0.88,
      rotateY: dir < 0 ? 15 : -15,
      transition: {
        x: { type: 'spring' as const, stiffness: 300, damping: 28 },
        opacity: { duration: 0.2 },
      },
    }),
  };

  return (
    <div className={`relative min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between overflow-x-hidden select-none transition-all duration-300 ${screenPulse ? 'scale-[0.995] filter brightness-125' : ''}`}>
      
      {/* Dynamic Animated Ambient Background Glow */}
      <div className={`absolute inset-0 bg-gradient-to-b ${neonStyle.gradientBg} pointer-events-none opacity-80`} />
      
      {/* Retro Arcade Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293712_1px,transparent_1px),linear-gradient(to_bottom,#1f293712_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-40" />

      {/* Top Navigation & Controls Bar */}
      <header className="relative z-20 w-full px-3 py-2.5 sm:px-6 sm:py-3 bg-slate-900/80 backdrop-blur-md border-b border-white/10 flex flex-col gap-2 shadow-lg">
        <div className="flex items-center justify-between gap-3 w-full">
          
          {/* Title & Showcase Mode Badge with Control Reveal Toggle Icon */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* The Icon Button Next to Showcase View on the left to reveal/hide all buttons */}
            <button
              onClick={() => { setShowControls(!showControls); triggerArcadeFeedback(); }}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl p-0.5 shadow-md flex items-center justify-center transition-all cursor-pointer active:scale-90 ${
                showControls 
                  ? 'bg-gradient-to-tr from-cyan-400 via-indigo-500 to-pink-500 ring-2 ring-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.6)]' 
                  : 'bg-gradient-to-tr from-indigo-600 via-pink-500 to-amber-400 hover:scale-105'
              }`}
              title={showControls ? "Hide Controls Toolbar" : "Reveal All Buttons & Controls"}
            >
              <div className="w-full h-full bg-slate-950 rounded-[9px] flex items-center justify-center text-cyan-400">
                <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
              </div>
            </button>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-base tracking-wider bg-gradient-to-r from-cyan-400 via-pink-400 to-amber-300 bg-clip-text text-transparent uppercase drop-shadow-xs">
                  {title.toUpperCase()}
                </span>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  HUB
                </span>
              </div>
            </div>
          </div>

          {/* Center Search Bar - Always Visible */}
          <div className="relative flex-1 max-w-xs sm:max-w-md mx-2">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentIndex(0); }}
              placeholder="Search..."
              className="w-full bg-slate-950/80 border border-white/15 rounded-full pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all shadow-inner"
            />
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {onSwitchToDesktop && (
              <button
                onClick={() => { triggerArcadeFeedback(); onSwitchToDesktop(); }}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 font-extrabold text-xs shadow-md border border-cyan-500/40 hover:border-cyan-400 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                title="Switch back to View Mode 01: Desktop Workspace"
              >
                <Monitor className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">View Mode 01 (Desktop)</span>
                <span className="sm:hidden">Mode 01</span>
              </button>
            )}

            {/* Sleek Toggle Indicator on Right */}
            <button
              onClick={() => { setShowControls(!showControls); triggerArcadeFeedback(); }}
              className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-md shrink-0 active:scale-95 ${
                showControls
                  ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'bg-slate-800/80 text-slate-300 border-white/15 hover:bg-slate-800 hover:border-white/30'
              }`}
              title={showControls ? "Hide Controls" : "Reveal Controls"}
            >
              {showControls ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

        </div>

        {/* Expandable Extra Controls Toolbar (Hidden by Default) */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs"
            >
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 no-scrollbar text-[11px] font-bold">
                {['All', 'Favorites', 'Male', 'Female', 'Objects'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => { setSelectedCategoryFilter(cat); setCurrentIndex(0); triggerArcadeFeedback(); }}
                    className={`px-2.5 py-1 rounded-full border whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategoryFilter === cat 
                        ? 'bg-indigo-500 text-white border-indigo-400 shadow-xs' 
                        : 'bg-slate-900/60 text-slate-400 border-white/10 hover:text-white'
                    }`}
                  >
                    {cat === 'Favorites' ? '❤️ Favorites' : cat}
                  </button>
                ))}
              </div>

              {/* Extra HUD Settings */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Neon Light Color Selector */}
                <div className="flex items-center bg-slate-800/80 border border-white/10 rounded-lg p-0.5 shadow-xs">
                  {(['rainbow', 'cyberpunk', 'matrix', 'sunburst', 'synthwave'] as NeonTheme[]).map(t => (
                    <button
                      key={t}
                      onClick={() => { setNeonTheme(t); triggerArcadeFeedback(); }}
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center ${
                        neonTheme === t ? 'ring-2 ring-white scale-110 shadow-md' : 'opacity-60 hover:opacity-100'
                      }`}
                      title={`Switch Neon Frame to ${t}`}
                    >
                      {t === 'rainbow' && '🌈'}
                      {t === 'cyberpunk' && '⚡'}
                      {t === 'matrix' && '💚'}
                      {t === 'sunburst' && '🔥'}
                      {t === 'synthwave' && '💜'}
                    </button>
                  ))}
                </div>

                {/* Sound Toggle */}
                <button
                  onClick={() => { setSoundEnabled(!soundEnabled); triggerArcadeFeedback(); }}
                  className={`p-1.5 sm:p-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    soundEnabled ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' : 'bg-slate-800/60 text-slate-400 border-white/10'
                  }`}
                  title="Toggle Sound Effects"
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>

                {/* Haptic Vibration Toggle */}
                <button
                  onClick={() => { setVibrationEnabled(!vibrationEnabled); triggerArcadeFeedback(); }}
                  className={`p-1.5 sm:p-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    vibrationEnabled ? 'bg-pink-500/20 text-pink-300 border-pink-500/40' : 'bg-slate-800/60 text-slate-400 border-white/10'
                  }`}
                  title="Toggle Haptic Feedback Vibrations"
                >
                  <Vibrate className="w-3.5 h-3.5" />
                </button>

                {/* Auto-Play Toggle */}
                <button
                  onClick={() => { setIsAutoPlaying(!isAutoPlaying); triggerArcadeFeedback(); }}
                  className={`px-2 py-1.5 rounded-lg border text-[11px] font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                    isAutoPlaying ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse' : 'bg-slate-800/60 text-slate-300 border-white/10 hover:bg-slate-800'
                  }`}
                  title="Toggle Auto-Play Slider"
                >
                  {isAutoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isAutoPlaying ? 'PAUSE' : 'AUTO'}</span>
                </button>

                {/* Switch back to Studio Desktop Mode */}
                {onSwitchToDesktop && (
                  <button
                    onClick={() => { triggerArcadeFeedback(); onSwitchToDesktop(); }}
                    className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-md border border-white/20 flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Return to standard Studio Desktop workspace"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Studio Desktop</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Character Showcase Carousel Container */}
      <main 
        className="relative z-10 flex-1 w-full max-w-4xl mx-auto px-4 py-4 sm:py-6 flex flex-col items-center justify-center min-h-[480px]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {filteredCharacters.length === 0 ? (
          <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-8 text-center space-y-3 max-w-md shadow-2xl">
            <User className="w-12 h-12 text-slate-500 mx-auto animate-bounce" />
            <h3 className="text-lg font-bold text-white">No Matches Found</h3>
            <p className="text-xs text-slate-400">Try adjusting your search query or filters above.</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategoryFilter('All'); }}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : activeChar ? (
          <div className="relative w-full flex items-center justify-center">
            
            {/* Desktop Left Arrow Button */}
            <button
              onClick={handlePrev}
              className="absolute left-0 sm:-left-4 z-30 p-3 sm:p-4 rounded-full bg-slate-900/90 border border-white/20 text-indigo-300 hover:text-white hover:bg-indigo-600 hover:border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all cursor-pointer transform active:scale-90"
              title="Previous Character (Left Arrow)"
            >
              <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>

            {/* Sliding Animated Character Showcase Card */}
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={activeChar.id}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                onClick={() => setEditingCharacter(activeChar)}
                className="w-full max-w-lg bg-slate-900/95 rounded-3xl border border-white/10 shadow-2xl overflow-hidden cursor-pointer group transition-all duration-300 hover:border-indigo-500/50"
              >
                {/* Neon Light Frame Outer Wrap */}
                <div className={`p-4 sm:p-6 transition-all duration-300`}>
                  
                  {/* Top Header Card Info (Arcade Score / Index) */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border tracking-wider ${neonStyle.badgeBg}`}>
                        CHAR #{String(currentIndex + 1).padStart(2, '0')} / {filteredCharacters.length}
                      </span>
                      {activeChar.status && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-white/10 text-[10px] font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          {activeChar.status}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handleToggleFavorite}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsFavIconModalOpen(true);
                        }}
                        className={`p-2 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                          activeChar.isFavorite 
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 scale-110 shadow-md ring-1 ring-rose-500/30' 
                            : 'bg-slate-800/80 text-slate-400 border-white/10 hover:text-white hover:border-white/20'
                        }`}
                        title={activeChar.isFavorite ? 'Remove from favorites (Right-click to change icon)' : 'Add to favorites (Right-click to customize icon)'}
                      >
                        <RenderFavoriteIcon 
                          iconId={activeChar.favoriteIcon} 
                          customColor={activeChar.favoriteColor} 
                          isFavorite={!!activeChar.isFavorite} 
                          size="md" 
                        />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsFavIconModalOpen(true);
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[10px] font-bold text-slate-300 border border-white/10 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                        title="Customize favorite icon / emoji for this character or gender groups"
                      >
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                        <span className="hidden sm:inline">Change Icon</span>
                      </button>
                    </div>
                  </div>

                  {/* Neon Light Frame Character Thumbnail Section */}
                  <div className="my-4 relative flex justify-center items-center">
                    
                    {/* Glowing Color-Changing Neon Border Frame */}
                    <div className={`relative p-2.5 sm:p-3 rounded-2xl border-2 ${neonStyle.border} ${neonStyle.shadow} bg-slate-950 transition-all duration-500 group-hover:scale-[1.02]`}>
                      
                      {/* Neon Frame Corner LEDs */}
                      <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
                      <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-pink-400 shadow-[0_0_8px_#f472b6] animate-pulse" />
                      <div className="absolute bottom-1 left-1 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24] animate-pulse" />
                      <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />

                      {/* Character Avatar Image */}
                      <div className="w-48 h-48 sm:w-60 sm:h-60 rounded-xl overflow-hidden bg-slate-900 border border-white/10 flex items-center justify-center relative">
                        <img
                          src={activeChar.defaultThumbnailSrc || activeChar.highlightedImageSrc || (activeChar.subImages && activeChar.subImages[0]?.src) || 'https://raw.githubusercontent.com/toonyman2020/Music-Player/Catti-Cango/Logo%20-%20Armentero%20Studios.png'}
                          alt={activeChar.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                        />

                        {/* Interactive Click Overlay Hint */}
                        <div className="absolute inset-0 bg-indigo-950/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-xs">
                          <span className="bg-slate-900/90 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-full border border-white/20 shadow-xl flex items-center gap-1.5">
                            <Maximize2 className="w-3.5 h-3.5 text-cyan-400" /> TAP TO EDIT SPECS
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Character Name & Key Info */}
                  <div className="text-center space-y-2 mt-2">
                    
                    {/* Character Display Name */}
                    <h2 className="text-xl sm:text-2xl font-black tracking-wide text-white uppercase group-hover:text-cyan-300 transition-all drop-shadow-md">
                      {activeChar.name}
                    </h2>

                    {/* Role / Tagline / Species */}
                    <p className="text-xs sm:text-sm text-slate-300 font-medium line-clamp-1">
                      {activeChar.role || activeChar.tagline || `${activeChar.species || 'Entity'} • ${activeChar.gender}`}
                    </p>

                    {/* Spec Attributes Pills */}
                    <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px] font-bold text-slate-300 pt-1">
                      {activeChar.species && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-white/10 flex items-center gap-1">
                          <User className="w-3 h-3 text-indigo-400" /> {activeChar.species}
                        </span>
                      )}
                      {activeChar.gender && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-white/10">
                          {activeChar.gender}
                        </span>
                      )}
                      {activeChar.age && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-white/10">
                          Age: {activeChar.age}
                        </span>
                      )}
                      {activeChar.projects && activeChar.projects.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-purple-400" /> {activeChar.projects[0].projectName}
                        </span>
                      )}
                    </div>

                    {/* Short Description Snippet */}
                    <p className="text-xs text-slate-400 line-clamp-2 pt-1 max-w-md mx-auto leading-relaxed">
                      {activeChar.description || activeChar.history || 'No description provided. Click to open full specifications.'}
                    </p>

                    {/* Glowing Enter Profile Button */}
                    <div className="pt-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingCharacter(activeChar); }}
                        className="w-full py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-pink-500 hover:from-cyan-400 hover:to-pink-400 text-white font-extrabold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(99,102,241,0.5)] border border-white/20 transition-all cursor-pointer flex items-center justify-center gap-2 group-hover:scale-[1.01]"
                      >
                        <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                        <span>ENTER CHARACTER PROFILE</span>
                      </button>
                    </div>

                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Desktop Right Arrow Button */}
            <button
              onClick={handleNext}
              className="absolute right-0 sm:-right-4 z-30 p-3 sm:p-4 rounded-full bg-slate-900/90 border border-white/20 text-indigo-300 hover:text-white hover:bg-indigo-600 hover:border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all cursor-pointer transform active:scale-90"
              title="Next Character (Right Arrow)"
            >
              <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>
          </div>
        ) : null}
      </main>

      {/* Bottom Thumbnail Ribbon Carousel Navigation */}
      <footer className="relative z-20 w-full px-4 py-3 bg-slate-900/90 border-t border-white/10 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          
          {/* Shuffle Button */}
          <button
            onClick={handleShuffle}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            title="Shuffle Random Character"
          >
            <Shuffle className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Shuffle</span>
          </button>

          {/* Character Mini Thumbnail Ribbon */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 px-1 no-scrollbar max-w-xl">
            {filteredCharacters.map((char, idx) => {
              const isSelected = idx === currentIndex;
              return (
                <button
                  key={char.id}
                  onClick={() => handleSelectIndex(idx)}
                  className={`relative shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    isSelected 
                      ? 'border-cyan-400 scale-110 shadow-[0_0_15px_rgba(34,211,238,0.8)] z-10' 
                      : 'border-white/10 opacity-60 hover:opacity-100 hover:scale-105'
                  }`}
                  title={char.name}
                >
                  <img
                    src={char.defaultThumbnailSrc || char.highlightedImageSrc || (char.subImages && char.subImages[0]?.src) || 'https://raw.githubusercontent.com/toonyman2020/Music-Player/Catti-Cango/Logo%20-%20Armentero%20Studios.png'}
                    alt={char.name}
                    className="w-full h-full object-cover"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 border-2 border-white rounded-xl pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Page Indicators */}
          <div className="text-right shrink-0">
            <span className="text-[11px] font-extrabold text-cyan-400 font-mono">
              {currentIndex + 1} / {filteredCharacters.length}
            </span>
          </div>

        </div>
      </footer>

      {/* Full Character Editor Modal (Opens when user clicks any character) */}
      {editingCharacter && (
        <CharacterEditor
          character={editingCharacter}
          charId={editingCharacter.id}
          characters={characters}
          setCharacters={setCharacters}
          items={items}
          setItems={setItems}
          isShowcaseView={true}
          onClose={() => setEditingCharacter(null)}
          onSave={(updated) => {
            if (setCharacters) {
              setCharacters(prev => prev.map(c => c.id === editingCharacter.id ? { ...c, ...updated } : c));
            }
          }}
        />
      )}

      {/* Favorite Icon Customizer Modal */}
      {isFavIconModalOpen && activeChar && (
        <FavoriteIconSelectorModal
          isOpen={isFavIconModalOpen}
          onClose={() => setIsFavIconModalOpen(false)}
          targetCharacter={activeChar}
          characters={characters}
          setCharacters={setCharacters}
          items={items}
          setItems={setItems}
          onSaveSelection={(iconId, color) => {
            if (setCharacters) {
              setCharacters(prev => prev.map(c => c.id === activeChar.id ? {
                ...c,
                favoriteIcon: iconId,
                favoriteColor: color,
                isFavorite: true
              } : c));
            }
          }}
        />
      )}

    </div>
  );
}
