import React, { useState, useEffect } from 'react';
import { 
  BookOpen, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, 
  X, RotateCcw, FileText, Download, Bookmark
} from 'lucide-react';

interface PDFBookReaderProps {
  title?: string;
  fileTitle?: string;
  content?: string;
  fileContent?: string;
  fileUrl?: string;
  onClose: () => void;
}

export const PDFBookReader: React.FC<PDFBookReaderProps> = ({ title, fileTitle, content, fileContent, fileUrl, onClose }) => {
  const displayTitle = title || fileTitle || 'Document Reader';
  const displayContent = content || fileContent || '';
  const [currentPage, setCurrentPage] = useState(1);
  const [fontSize, setFontSize] = useState(16);
  const [readingMode, setReadingMode] = useState<'single' | 'double'>('double');

  // Split raw text content into page chunks for book flipping experience
  const linesPerPage = 22;
  const lines = displayContent ? displayContent.split('\n') : ['[ Empty Document ]'];
  const pages: string[][] = [];
  
  for (let i = 0; i < lines.length; i += linesPerPage) {
    pages.push(lines.slice(i, i + linesPerPage));
  }
  if (pages.length === 0) pages.push(['No content available.']);

  const totalPages = pages.length;

  const nextPage = () => {
    if (readingMode === 'double') {
      if (currentPage + 2 <= totalPages) setCurrentPage(currentPage + 2);
      else if (currentPage + 1 <= totalPages) setCurrentPage(currentPage + 1);
    } else {
      if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (readingMode === 'double') {
      if (currentPage - 2 >= 1) setCurrentPage(currentPage - 2);
      else if (currentPage - 1 >= 1) setCurrentPage(1);
    } else {
      if (currentPage > 1) setCurrentPage(currentPage - 1);
    }
  };

  const pageLeftIndex = currentPage - 1;
  const pageRightIndex = readingMode === 'double' && currentPage < totalPages ? currentPage : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col animate-in fade-in duration-200">
      {/* Book Reader Header Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="font-bold text-sm tracking-wide">{displayTitle}</h3>
            <span className="text-[10px] text-slate-400">Flipbook Document Reader</span>
          </div>
        </div>

        {/* Center Controls */}
        <div className="flex items-center gap-4 bg-slate-800/80 px-4 py-1.5 rounded-full border border-slate-700">
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setFontSize(prev => Math.max(12, prev - 2))}
              className="p-1 hover:bg-slate-700 rounded transition-all text-slate-300"
              title="Decrease Font Size"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-slate-300 w-8 text-center">{fontSize}px</span>
            <button 
              onClick={() => setFontSize(prev => Math.min(28, prev + 2))}
              className="p-1 hover:bg-slate-700 rounded transition-all text-slate-300"
              title="Increase Font Size"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          <button
            onClick={() => setReadingMode(prev => prev === 'double' ? 'single' : 'double')}
            className={`px-2.5 py-0.5 rounded text-xs font-bold transition-all ${
              readingMode === 'double' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            {readingMode === 'double' ? '2-Page Book' : '1-Page View'}
          </button>

          <div className="h-4 w-px bg-slate-700" />

          <div className="flex items-center gap-2">
            <button 
              onClick={prevPage}
              disabled={currentPage <= 1}
              className="p-1 hover:bg-slate-700 disabled:opacity-30 rounded transition-all text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold text-slate-300 font-mono">
              {currentPage} {pageRightIndex !== null ? `& ${pageRightIndex + 1}` : ''} / {totalPages}
            </span>
            <button 
              onClick={nextPage}
              disabled={currentPage >= totalPages}
              className="p-1 hover:bg-slate-700 disabled:opacity-30 rounded transition-all text-white"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Close & Action Buttons */}
        <div className="flex items-center gap-2">
          {fileUrl && (
            <a 
              href={fileUrl} 
              download={title}
              className="p-2 hover:bg-slate-800 rounded-full transition-all text-slate-300 hover:text-white"
              title="Download Original File"
            >
              <Download className="w-5 h-5" />
            </a>
          )}
          <button 
            onClick={onClose}
            className="p-2 hover:bg-destructive rounded-full transition-all text-slate-300 hover:text-white"
            title="Close Book Reader"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Book Stage Container */}
      <div className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
        {/* Book Spine Shadow / Wrapper */}
        <div className={`w-full max-w-5xl aspect-[1.4/1] bg-[#fbf0d9] text-amber-950 rounded-xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] border border-amber-900/20 p-6 sm:p-10 flex flex-col md:flex-row gap-6 relative overflow-hidden`}>
          {/* Central Book Fold Shadow Line */}
          {readingMode === 'double' && (
            <div className="hidden md:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-8 bg-gradient-to-r from-black/15 via-black/25 to-black/15 pointer-events-none z-10" />
          )}

          {/* Left Page */}
          <div className="flex-1 flex flex-col justify-between border-b md:border-b-0 md:border-r border-amber-900/10 pr-0 md:pr-6 min-h-0">
            <div className="flex items-center justify-between text-[10px] font-bold text-amber-900/50 uppercase tracking-widest border-b border-amber-900/10 pb-2 mb-4">
              <span>{title}</span>
              <span>Page {currentPage}</span>
            </div>
            <div className="flex-1 overflow-auto font-serif space-y-2 leading-relaxed" style={{ fontSize: `${fontSize}px` }}>
              {pages[pageLeftIndex]?.map((line, idx) => (
                <p key={idx} className="min-h-[1.2em]">{line || ' '}</p>
              ))}
            </div>
            <div className="text-center text-[10px] font-bold text-amber-900/40 mt-4 pt-2 border-t border-amber-900/10">
              - {currentPage} -
            </div>
          </div>

          {/* Right Page */}
          {readingMode === 'double' && (
            <div className="flex-1 flex flex-col justify-between pl-0 md:pl-6 min-h-0">
              {pageRightIndex !== null ? (
                <>
                  <div className="flex items-center justify-between text-[10px] font-bold text-amber-900/50 uppercase tracking-widest border-b border-amber-900/10 pb-2 mb-4">
                    <span>{title}</span>
                    <span>Page {pageRightIndex + 1}</span>
                  </div>
                  <div className="flex-1 overflow-auto font-serif space-y-2 leading-relaxed" style={{ fontSize: `${fontSize}px` }}>
                    {pages[pageRightIndex]?.map((line, idx) => (
                      <p key={idx} className="min-h-[1.2em]">{line || ' '}</p>
                    ))}
                  </div>
                  <div className="text-center text-[10px] font-bold text-amber-900/40 mt-4 pt-2 border-t border-amber-900/10">
                    - {pageRightIndex + 1} -
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-amber-900/20 italic">
                  <span>[ End of Book ]</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
