import React, { useState } from 'react';
import { 
  X, Crop, Sliders, Image as ImageIcon, Layout, Move, RotateCw, ZoomIn, Check
} from 'lucide-react';
import { Character } from '../types';

interface AlignmentToolModalProps {
  character?: Character;
  imageSrc?: string;
  title?: string;
  onSave: (updated: any) => void;
  onClose: () => void;
}

export const AlignmentToolModal: React.FC<AlignmentToolModalProps> = ({ character, imageSrc, title, onSave, onClose }) => {
  const [activeTab, setActiveTab] = useState<'banner' | 'icon'>('banner');
  
  // Banner adjustment states
  const [bannerHeight, setBannerHeight] = useState<number>(character?.bannerHeight || 176);
  const [bannerFit, setBannerFit] = useState<'cover' | 'contain'>('cover');
  const [bannerPosY, setBannerPosY] = useState<number>(50); // % vertical position
  const [bannerFilter, setBannerFilter] = useState({
    brightness: character?.bannerFilter?.brightness || 100,
    contrast: character?.bannerFilter?.contrast || 100,
    saturate: character?.bannerFilter?.saturate || 100,
  });

  // Icon adjustment states
  const [iconSize, setIconSize] = useState<number>(character?.iconSize || 64);
  const [iconFit, setIconFit] = useState<'cover' | 'contain'>('cover');

  const displayBannerImage = imageSrc || character?.bannerImageSrc || character?.highlightedImageSrc;
  const displayIconImage = imageSrc || character?.defaultThumbnailSrc || character?.highlightedImageSrc || character?.characterBible;

  const handleApply = () => {
    if (character) {
      onSave({
        bannerHeight,
        bannerFilter,
        iconSize
      });
    } else {
      onSave(displayBannerImage);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Alignment Tool Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-secondary/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <Crop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">Alignment & Crop Tool</h3>
              <p className="text-xs text-muted-foreground">Adjust display framing, height, ratio, and filters for character media banners and icons.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection Bar */}
        <div className="flex border-b bg-secondary/10 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('banner')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl border-t border-x transition-all flex items-center gap-2 ${
              activeTab === 'banner'
                ? 'bg-card border-border text-foreground shadow-xs'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Layout className="w-4 h-4" />
            <span>Header Banner Tab</span>
          </button>
          <button
            onClick={() => setActiveTab('icon')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl border-t border-x transition-all flex items-center gap-2 ${
              activeTab === 'icon'
                ? 'bg-card border-border text-foreground shadow-xs'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Profile Icon Tab</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'banner' && (
            <div className="space-y-6">
              {/* Live Preview Area */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Banner Frame Preview</label>
                <div 
                  className="w-full bg-slate-900 rounded-xl overflow-hidden relative border border-border flex items-center justify-center"
                  style={{ height: `${bannerHeight}px` }}
                >
                  {displayBannerImage ? (
                    <img 
                      src={displayBannerImage} 
                      alt="Banner Preview" 
                      className="w-full h-full"
                      style={{ 
                        objectFit: bannerFit,
                        objectPosition: `center ${bannerPosY}%`,
                        filter: `brightness(${bannerFilter.brightness}%) contrast(${bannerFilter.contrast}%) saturate(${bannerFilter.saturate}%)`
                      }}
                    />
                  ) : (
                    <span className="text-xs font-bold text-muted-foreground">No Banner Image Set</span>
                  )}
                </div>
              </div>

              {/* Controls Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 bg-secondary/20 p-4 rounded-xl border border-border/50">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span>Banner Frame Height</span>
                    <span className="text-primary">{bannerHeight}px</span>
                  </div>
                  <input 
                    type="range" 
                    min={100} 
                    max={400} 
                    value={bannerHeight}
                    onChange={e => setBannerHeight(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>

                <div className="space-y-2 bg-secondary/20 p-4 rounded-xl border border-border/50">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span>Vertical Alignment (PosY)</span>
                    <span className="text-primary">{bannerPosY}%</span>
                  </div>
                  <input 
                    type="range" 
                    min={0} 
                    max={100} 
                    value={bannerPosY}
                    onChange={e => setBannerPosY(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>

                <div className="space-y-2 bg-secondary/20 p-4 rounded-xl border border-border/50">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span>Brightness</span>
                    <span className="text-primary">{bannerFilter.brightness}%</span>
                  </div>
                  <input 
                    type="range" 
                    min={50} 
                    max={150} 
                    value={bannerFilter.brightness}
                    onChange={e => setBannerFilter({...bannerFilter, brightness: Number(e.target.value)})}
                    className="w-full accent-primary"
                  />
                </div>

                <div className="space-y-2 bg-secondary/20 p-4 rounded-xl border border-border/50">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span>Contrast</span>
                    <span className="text-primary">{bannerFilter.contrast}%</span>
                  </div>
                  <input 
                    type="range" 
                    min={50} 
                    max={150} 
                    value={bannerFilter.contrast}
                    onChange={e => setBannerFilter({...bannerFilter, contrast: Number(e.target.value)})}
                    className="w-full accent-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'icon' && (
            <div className="space-y-6">
              {/* Icon Frame Preview */}
              <div className="flex flex-col items-center justify-center p-6 bg-secondary/20 rounded-xl border border-border/50 gap-4">
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Icon Frame Preview</span>
                <div 
                  className="rounded-2xl overflow-hidden border-2 border-primary shadow-xl bg-slate-900"
                  style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
                >
                  <img 
                    src={displayIconImage} 
                    alt="Icon Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Icon Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 bg-secondary/20 p-4 rounded-xl border border-border/50">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span>Icon Display Size</span>
                    <span className="text-primary">{iconSize}px</span>
                  </div>
                  <input 
                    type="range" 
                    min={48} 
                    max={160} 
                    value={iconSize}
                    onChange={e => setIconSize(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>

                <div className="space-y-2 bg-secondary/20 p-4 rounded-xl border border-border/50">
                  <span className="text-xs font-bold block mb-1">Scaling Mode</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIconFit('cover')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                        iconFit === 'cover' ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary/50 border-border'
                      }`}
                    >
                      Fill Frame (Cover)
                    </button>
                    <button
                      onClick={() => setIconFit('contain')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                        iconFit === 'contain' ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary/50 border-border'
                      }`}
                    >
                      Fit Whole (Contain)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t bg-secondary/20 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold bg-secondary hover:bg-secondary/80 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleApply}
            className="px-6 py-2 text-xs font-black bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-lg flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Apply Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
