import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, ChevronRight, X, Printer, BookOpen, Layers, 
  ZoomIn, ZoomOut, Maximize, Minimize, FileText, Sparkles, Download, Check
} from 'lucide-react';
import { Character } from '../types';
import { generateBibleHtml, BiblePrintOptions, ALL_BIBLE_SECTIONS } from '../lib/biblePrinter';
import { executePrintDocument } from '../utils/printHelper';

interface BookletReaderModalProps {
  character: Character;
  isOpen?: boolean;
  onClose: () => void;
  options?: BiblePrintOptions;
  initialOptions?: BiblePrintOptions;
  onUpdateOptions?: (opts: Partial<BiblePrintOptions>) => void;
  onPrint?: (opts: any) => void;
}

export const BookletReaderModal: React.FC<BookletReaderModalProps> = ({
  character,
  isOpen = true,
  onClose,
  options,
  initialOptions,
  onUpdateOptions,
  onPrint,
}) => {
  const activeOptions = options || initialOptions || { character };
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [isDoubleSpread, setIsDoubleSpread] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [pagesHtml, setPagesHtml] = useState<string[]>([]);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);

  // Generate individual pages from HTML
  useEffect(() => {
    if (!isOpen) return;
    try {
      const fullHtml = generateBibleHtml(activeOptions);
      // Parse individual .booklet-page elements
      const parser = new DOMParser();
      const doc = parser.parseFromString(fullHtml, 'text/html');
      const pageElements = Array.from(doc.querySelectorAll('.booklet-page'));
      
      if (pageElements.length > 0) {
        const extracted = pageElements.map(el => el.outerHTML);
        setPagesHtml(extracted);
      } else {
        setPagesHtml([`<div class="booklet-page"><div class="content-body"><h2>${character.name}</h2><p>Generating document...</p></div></div>`]);
      }
    } catch (err) {
      console.error('Error generating pages HTML:', err);
    }
  }, [isOpen, activeOptions, character]);

  // Keyboard navigation (Left / Right / Home / End)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'Home') {
        e.preventDefault();
        setCurrentPage(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setCurrentPage(Math.max(0, pagesHtml.length - 1));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentPage, pagesHtml.length, isDoubleSpread]);

  if (!isOpen) return null;

  const totalPages = pagesHtml.length;
  const step = isDoubleSpread ? 2 : 1;

  const handleNext = () => {
    setCurrentPage(prev => {
      const next = prev + step;
      return next < totalPages ? next : prev;
    });
  };

  const handlePrev = () => {
    setCurrentPage(prev => {
      const next = prev - step;
      return next >= 0 ? next : 0;
    });
  };

  // Touch Swipe Handlers (Min swipe distance = 50px)
  const minSwipeDistance = 50;
  const onTouchStartHandler = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMoveHandler = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
  };

  const toggleFullscreen = () => {
    if (!modalContainerRef.current) return;
    if (!document.fullscreenElement) {
      modalContainerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handlePrint = () => {
    const fullHtml = generateBibleHtml(options);
    executePrintDocument(fullHtml);
  };

  const handleDownloadHtml = () => {
    const fullHtml = generateBibleHtml(options);
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${character.name || 'character'}_bible_booklet.html`;
    link.click();
    URL.revokeObjectURL(url);
    setCopyToast("Downloaded standalone booklet HTML!");
    setTimeout(() => setCopyToast(null), 3000);
  };

  return (
    <div 
      ref={modalContainerRef}
      className="fixed inset-0 z-[120] bg-slate-950/95 text-slate-100 flex flex-col backdrop-blur-md select-none animate-in fade-in duration-200"
    >
      {/* Top Header Bar */}
      <div className="h-14 border-b border-white/10 px-4 sm:px-6 flex items-center justify-between bg-slate-900/80 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg text-primary">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{character.name || 'Character Bible'}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary uppercase font-black">
                {options.mode.toUpperCase()} MODE
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Interactive Booklet Swipe & Page Reader ({totalPages} Pages Compiled)
            </p>
          </div>
        </div>

        {/* Toolbar & Controls */}
        <div className="flex items-center gap-2">
          {/* Double Spread Toggle */}
          <button
            type="button"
            onClick={() => setIsDoubleSpread(!isDoubleSpread)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isDoubleSpread ? 'bg-primary text-primary-foreground border-primary' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-white/10'
            }`}
            title="Toggle Two-Page Spread Book View"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isDoubleSpread ? '2-Page Spread' : 'Single Page'}</span>
          </button>

          {/* Zoom controls */}
          <div className="flex items-center bg-slate-800 rounded-lg border border-white/10 p-0.5">
            <button
              type="button"
              onClick={() => setZoomLevel(prev => Math.max(0.6, prev - 0.1))}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-bold px-1.5 text-slate-300">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel(prev => Math.min(1.8, prev + 0.1))}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-white/10 text-slate-300 hover:text-white cursor-pointer"
            title="Toggle Fullscreen View"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* Download HTML */}
          <button
            type="button"
            onClick={handleDownloadHtml}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-white/10 text-slate-300 hover:text-white cursor-pointer hidden md:flex items-center"
            title="Download Standalone Booklet File"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow cursor-pointer transition-all"
            title="Print or Save PDF"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print / Save PDF</span>
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg cursor-pointer transition-all ml-1"
            title="Close Booklet Reader (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Page Flipping Canvas Area */}
      <div 
        className="flex-1 overflow-auto relative flex items-center justify-center p-4 sm:p-8 bg-slate-950/90"
        onTouchStart={onTouchStartHandler}
        onTouchMove={onTouchMoveHandler}
        onTouchEnd={onTouchEndHandler}
      >
        {/* Previous Page Floating Button */}
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentPage === 0}
          className={`absolute left-2 sm:left-6 z-20 p-3 rounded-full bg-slate-900/90 border border-white/10 shadow-2xl text-white transition-all cursor-pointer ${
            currentPage === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-primary hover:scale-110'
          }`}
          title="Previous Page (Left Arrow or Swipe Right)"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Page Container */}
        <div 
          className="flex items-center justify-center gap-4 transition-transform duration-200"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
        >
          {/* Left Page (or Single Page) */}
          {pagesHtml[currentPage] && (
            <div 
              className="bg-white text-slate-900 rounded-lg shadow-2xl overflow-hidden border border-slate-700/50 flex flex-col"
              style={{
                width: options.pageSize === 'a3' ? '560px' : '480px',
                height: options.pageSize === 'a3' ? '780px' : '660px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
              }}
            >
              <div 
                className="w-full h-full overflow-y-auto p-4 select-text"
                dangerouslySetInnerHTML={{ __html: pagesHtml[currentPage] }}
              />
            </div>
          )}

          {/* Right Page (In Double Spread Mode) */}
          {isDoubleSpread && currentPage + 1 < totalPages && (
            <div 
              className="bg-white text-slate-900 rounded-lg shadow-2xl overflow-hidden border border-slate-700/50 flex flex-col"
              style={{
                width: options.pageSize === 'a3' ? '560px' : '480px',
                height: options.pageSize === 'a3' ? '780px' : '660px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
              }}
            >
              <div 
                className="w-full h-full overflow-y-auto p-4 select-text"
                dangerouslySetInnerHTML={{ __html: pagesHtml[currentPage + 1] }}
              />
            </div>
          )}
        </div>

        {/* Next Page Floating Button */}
        <button
          type="button"
          onClick={handleNext}
          disabled={isDoubleSpread ? currentPage + 2 >= totalPages : currentPage + 1 >= totalPages}
          className={`absolute right-2 sm:right-6 z-20 p-3 rounded-full bg-slate-900/90 border border-white/10 shadow-2xl text-white transition-all cursor-pointer ${
            (isDoubleSpread ? currentPage + 2 >= totalPages : currentPage + 1 >= totalPages)
              ? 'opacity-30 cursor-not-allowed'
              : 'hover:bg-primary hover:scale-110'
          }`}
          title="Next Page (Right Arrow or Swipe Left)"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Bottom Thumbnail Filmstrip Bar & Page Indicator */}
      <div className="h-20 border-t border-white/10 px-4 flex items-center justify-between bg-slate-900/90 shrink-0 gap-4">
        {/* Page status */}
        <div className="text-xs text-slate-300 font-bold shrink-0">
          Page {currentPage + 1} {isDoubleSpread && currentPage + 1 < totalPages ? `& ${currentPage + 2}` : ''} of {totalPages}
        </div>

        {/* Filmstrip thumbnails */}
        <div className="flex-1 flex items-center justify-center gap-2 overflow-x-auto py-2 px-2 no-scrollbar max-w-2xl">
          {pagesHtml.map((_, pIdx) => {
            const isActive = isDoubleSpread 
              ? (pIdx === currentPage || pIdx === currentPage + 1)
              : pIdx === currentPage;
            return (
              <button
                key={pIdx}
                type="button"
                onClick={() => setCurrentPage(isDoubleSpread && pIdx % 2 !== 0 ? pIdx - 1 : pIdx)}
                className={`w-9 h-12 rounded border transition-all flex flex-col items-center justify-center shrink-0 cursor-pointer ${
                  isActive 
                    ? 'bg-primary text-white border-primary ring-2 ring-primary/40 scale-110 font-bold' 
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border-white/10 hover:text-white'
                }`}
                title={`Jump to Page ${pIdx + 1}`}
              >
                <FileText className="w-3 h-3 mb-0.5 opacity-60" />
                <span className="text-[9px]">{pIdx + 1}</span>
              </button>
            );
          })}
        </div>

        {/* Swipe hint */}
        <div className="text-[11px] text-slate-400 hidden sm:flex items-center gap-1 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>Use keyboard arrows ← → or swipe on touch</span>
        </div>
      </div>

      {/* Copy Toast */}
      {copyToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom duration-200 z-[130]">
          <Check className="w-4 h-4" />
          <span>{copyToast}</span>
        </div>
      )}
    </div>
  );
};
