import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, 
  Volume2, VolumeX, Music, Video, Info, Download, 
  Maximize2, Minimize2, List, Edit3, Save, X, Image as ImageIcon,
  Music2, FileAudio, FileVideo, ChevronDown, ChevronUp, AlertTriangle,
  Sparkles, RefreshCw, Mic, MicOff, Upload, FolderPlus
} from 'lucide-react';
import { Character, AudioMetadata } from '../types';
import { ID3Writer } from 'browser-id3-writer';

interface UnifiedMediaPlayerProps {
  character: Character;
  onUpdateCharacter: (updated: Character) => void;
  initialType?: 'audio' | 'video';
  onNavigateToPage?: (tab: string, pageId?: string) => void;
}

export const UnifiedMediaPlayer: React.FC<UnifiedMediaPlayerProps> = ({ 
  character, 
  onUpdateCharacter,
  initialType = 'audio',
  onNavigateToPage
}) => {
  const [activeType, setActiveType] = useState<'audio' | 'video'>(initialType);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showMetadataEditor, setShowMetadataEditor] = useState(false);
  const [editingMetadata, setEditingMetadata] = useState<AudioMetadata | null>(null);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(true);
  const [playerSizeMode, setPlayerSizeMode] = useState<'compact' | 'normal' | 'expanded'>('normal');
  const [isTranscribing, setIsTranscribing] = useState(false);

  // AI Organizer & Voice Prompt State
  const [showAIOrganizer, setShowAIOrganizer] = useState(false);
  const [aiInstruction, setAiInstruction] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isOrganizingAI, setIsOrganizingAI] = useState(false);
  const [organizeToast, setOrganizeToast] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRef = activeType === 'audio' ? audioRef : videoRef;

  const playlist = activeType === 'audio' ? (character.audios || []) : (character.videos || []);
  const currentItem = playlist[currentIndex];

  const associatedPage = currentItem ? character.biblePages?.find(p => 
    p.title === `Transcript: ${currentItem.title}` || 
    p.title === `Visual Analysis: ${currentItem.title}`
  ) : undefined;

  const handleTranscribeCurrentTrack = async () => {
    if (!currentItem) return;
    setIsTranscribing(true);
    try {
      let base64 = currentItem.src;
      let mimeType = activeType === 'audio' ? 'audio/mp3' : 'video/mp4';

      if (!base64.startsWith('data:')) {
        const res = await fetch(currentItem.src);
        const blob = await res.blob();
        mimeType = blob.type || mimeType;
        base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }

      const response = await fetch('/api/transcribe-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaName: currentItem.title,
          mimeType: mimeType,
          data: base64
        })
      });
      const data = await response.json();

      if (data.transcript || data.summary) {
        const isVid = activeType === 'video';
        const pageId = `${isVid ? 'analysis' : 'transcript'}-${Date.now()}`;
        const pageTitle = isVid ? `Visual Analysis: ${currentItem.title}` : `Transcript: ${currentItem.title}`;
        
        const updatedItem = {
          ...currentItem,
          metadata: {
            ...currentItem.metadata,
            lyrics: data.transcript || currentItem.metadata?.lyrics,
            comment: data.summary || currentItem.metadata?.comment
          }
        };

        const updatedPlaylist = playlist.map((item, idx) => idx === currentIndex ? updatedItem : item);
        
        let markdownContent = '';
        if (isVid) {
          markdownContent = `### ${currentItem.title} — Visual Analysis & Transcript\n\n**Summary:**\n${data.summary || 'No summary.'}\n\n**Visual Description:**\n${data.visualDescription || 'No description.'}\n\n**Transcript:**\n${data.transcript || 'None.'}`;
        } else {
          markdownContent = `### ${currentItem.title} — Transcript & Summary\n\n**Summary:**\n${data.summary || 'No summary.'}\n\n**Spoken Words / Lyrics:**\n${data.transcript || 'None.'}`;
        }

        const updatedChar = {
          ...character,
          [activeType === 'audio' ? 'audios' : 'videos']: updatedPlaylist,
          biblePages: [
            ...(character.biblePages || []),
            { id: pageId, title: pageTitle, content: markdownContent, isLocked: false }
          ]
        };
        onUpdateCharacter(updatedChar);
        setShowLyrics(true);
      }
    } catch (err) {
      console.error('Transcription error:', err);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleRunAIOrganizer = async () => {
    if (!aiInstruction.trim()) return;
    setIsOrganizingAI(true);
    try {
      const response = await fetch('/api/organize-media-albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction: aiInstruction,
          characterName: character.name,
          audios: character.audios || [],
          mediaCategories: character.mediaCategories || []
        })
      });
      const data = await response.json();
      if (data.audios) {
        const updatedCategories = [...(character.mediaCategories || []), ...(data.newCategories || [])];
        const updatedChar = {
          ...character,
          audios: data.audios,
          mediaCategories: updatedCategories
        };
        onUpdateCharacter(updatedChar);
        setOrganizeToast("Tracks successfully organized and renamed by AI!");
        setTimeout(() => setOrganizeToast(null), 3000);
        setShowAIOrganizer(false);
        setAiInstruction('');
      }
    } catch (err) {
      console.error('AI organize error:', err);
      setOrganizeToast("Failed to organize via AI.");
      setTimeout(() => setOrganizeToast(null), 3000);
    } finally {
      setIsOrganizingAI(false);
    }
  };

  const handleVoicePrompt = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // Fallback: Open AI Organizer drawer and enable voice simulation mode
      setShowAIOrganizer(true);
      setIsRecordingVoice(true);
      setTimeout(() => {
        setIsRecordingVoice(false);
        setAiInstruction(prev => prev ? `${prev} Organize tracks into thematic albums.` : "Organize tracks into thematic albums.");
      }, 1500);
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsRecordingVoice(true);
      recognition.onresult = (event: any) => {
        const speechText = event.results[0][0].transcript;
        setAiInstruction(prev => prev ? `${prev} ${speechText}` : speechText);
        setShowAIOrganizer(true);
      };
      recognition.onerror = () => {
        setIsRecordingVoice(false);
        setShowAIOrganizer(true);
      };
      recognition.onend = () => setIsRecordingVoice(false);

      recognition.start();
    } catch (e) {
      setIsRecordingVoice(false);
      setShowAIOrganizer(true);
    }
  };

  useEffect(() => {
    if (currentItem) {
      setEditingMetadata(currentItem.metadata || { title: currentItem.title });
    }
  }, [currentIndex, activeType, playlist]);

  useEffect(() => {
    if (mediaRef.current) {
      mediaRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted, activeType]);

  const togglePlay = () => {
    if (!mediaRef.current) return;
    if (isPlaying) {
      mediaRef.current.pause();
    } else {
      mediaRef.current.play().catch(console.error);
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (mediaRef.current) {
      setCurrentTime(mediaRef.current.currentTime);
      setDuration(mediaRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (mediaRef.current) {
      mediaRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleNext = () => {
    if (playlist.length === 0) return;
    let nextIndex = currentIndex + 1;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } else if (nextIndex >= playlist.length) {
      nextIndex = 0;
    }
    setCurrentIndex(nextIndex);
    setIsPlaying(true);
    setTimeout(() => {
      mediaRef.current?.play().catch(console.error);
    }, 100);
  };

  const handlePrev = () => {
    if (playlist.length === 0) return;
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = playlist.length - 1;
    }
    setCurrentIndex(prevIndex);
    setIsPlaying(true);
    setTimeout(() => {
      mediaRef.current?.play().catch(console.error);
    }, 100);
  };

  const handleMediaEnd = () => {
    if (repeatMode === 'one') {
      if (mediaRef.current) {
        mediaRef.current.currentTime = 0;
        mediaRef.current.play().catch(console.error);
      }
    } else if (repeatMode === 'all' || currentIndex < playlist.length - 1 || isShuffle) {
      handleNext();
    } else {
      setIsPlaying(false);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSaveMetadata = () => {
    if (!currentItem || !editingMetadata) return;
    
    const updatedCharacter = { ...character };
    if (activeType === 'audio' && updatedCharacter.audios) {
      updatedCharacter.audios = updatedCharacter.audios.map((a, i) => 
        i === currentIndex ? { ...a, metadata: editingMetadata, title: editingMetadata.title || a.title } : a
      );
    } else if (activeType === 'video' && updatedCharacter.videos) {
      updatedCharacter.videos = updatedCharacter.videos.map((v, i) => 
        i === currentIndex ? { ...v, metadata: editingMetadata, title: editingMetadata.title || v.title } : v
      );
    }
    
    onUpdateCharacter(updatedCharacter);
    setShowMetadataEditor(false);
  };

  const handleDownloadWithMetadata = async () => {
    if (!currentItem || activeType === 'video') {
      const link = document.createElement('a');
      link.href = currentItem.src;
      link.download = `${currentItem.title}.${activeType === 'audio' ? 'mp3' : 'mp4'}`;
      link.click();
      return;
    }

    try {
      const response = await fetch(currentItem.src);
      const arrayBuffer = await response.arrayBuffer();
      
      const writer = new (ID3Writer as any)(arrayBuffer);
      if (editingMetadata) {
        if (editingMetadata.title) writer.setFrame('TIT2', editingMetadata.title);
        if (editingMetadata.artist) writer.setFrame('TPE1', [editingMetadata.artist]);
        if (editingMetadata.album) writer.setFrame('TALB', editingMetadata.album);
        if (editingMetadata.genre) writer.setFrame('TCON', [editingMetadata.genre]);
        if (editingMetadata.year) writer.setFrame('TYER', editingMetadata.year);
        if (editingMetadata.lyrics) writer.setFrame('USLT', { description: '', lyrics: editingMetadata.lyrics });
        
        if (editingMetadata.albumCover) {
          try {
            const coverRes = await fetch(editingMetadata.albumCover);
            const coverBuffer = await coverRes.arrayBuffer();
            writer.setFrame('APIC', { type: 3, data: coverBuffer, description: 'Front cover' });
          } catch (e) {
            console.error('Failed cover:', e);
          }
        }
      }
      
      writer.addTag();
      const taggedBlob = writer.getBlob();
      const url = URL.createObjectURL(taggedBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${editingMetadata?.title || currentItem.title}.mp3`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed ID3 writer:', err);
      const link = document.createElement('a');
      link.href = currentItem.src;
      link.download = `${currentItem.title}.mp3`;
      link.click();
    }
  };

  if (playlist.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed rounded-2xl bg-secondary/20 space-y-4">
        <div className="bg-secondary p-4 rounded-full">
          {activeType === 'audio' ? <Music2 className="w-10 h-10 text-indigo-500" /> : <FileVideo className="w-10 h-10 text-amber-500" />}
        </div>
        <h3 className="font-bold text-lg text-foreground">No {activeType} items found</h3>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Add audio tracks or video clips to start using the unified media player and AI album organizer.
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col space-y-4 bg-card border rounded-2xl overflow-hidden shadow-sm transition-all ${playerSizeMode === 'compact' ? 'max-w-md mx-auto' : playerSizeMode === 'expanded' ? 'ring-2 ring-primary/30' : ''}`}>
      {/* Top Banner & Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-b bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl shadow-inner ${activeType === 'audio' ? 'bg-indigo-500/20 text-indigo-500 border border-indigo-500/30' : 'bg-amber-500/20 text-amber-500 border border-amber-500/30'}`}>
            {activeType === 'audio' ? <Music className="w-4 h-4" /> : <Video className="w-4 h-4" />}
          </div>
          <div>
            <h4 className="font-black text-xs uppercase tracking-wider text-foreground">Unified Media Player & Album Studio</h4>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">Active Stream: <span className="text-primary font-black">{activeType}</span> ({playlist.length} items)</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* AI Organizer & Dropbox Button */}
          <button
            onClick={() => setShowAIOrganizer(!showAIOrganizer)}
            className="px-3 py-1.5 rounded-lg text-xs font-black bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title="Open Dropbox & AI Album Organizer / Voice Prompt"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Dropbox & AI Albums</span>
          </button>

          {/* View Size Layout Toggles */}
          <div className="flex bg-secondary/60 p-1 rounded-xl border gap-1">
            <button 
              onClick={() => setPlayerSizeMode('compact')}
              className={`px-2 py-0.5 rounded text-[10px] font-black transition-all ${playerSizeMode === 'compact' ? 'bg-background text-primary shadow-sm border' : 'text-muted-foreground hover:text-foreground'}`}
              title="Compact View"
            >
              Compact
            </button>
            <button 
              onClick={() => setPlayerSizeMode('normal')}
              className={`px-2 py-0.5 rounded text-[10px] font-black transition-all ${playerSizeMode === 'normal' ? 'bg-background text-primary shadow-sm border' : 'text-muted-foreground hover:text-foreground'}`}
              title="Normal View"
            >
              Normal
            </button>
            <button 
              onClick={() => setPlayerSizeMode('expanded')}
              className={`px-2 py-0.5 rounded text-[10px] font-black transition-all ${playerSizeMode === 'expanded' ? 'bg-background text-primary shadow-sm border' : 'text-muted-foreground hover:text-foreground'}`}
              title="Expanded View"
            >
              Expanded
            </button>
          </div>

          <div className="flex bg-secondary/60 p-1 rounded-xl border">
            <button 
              onClick={() => { setActiveType('audio'); setIsPlaying(false); }}
              className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${activeType === 'audio' ? 'bg-background text-indigo-500 shadow-sm border' : 'text-muted-foreground hover:text-foreground'}`}
            >
              AUDIO
            </button>
            <button 
              onClick={() => { setActiveType('video'); setIsPlaying(false); }}
              className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${activeType === 'video' ? 'bg-background text-amber-500 shadow-sm border' : 'text-muted-foreground hover:text-foreground'}`}
            >
              VIDEO
            </button>
          </div>
        </div>
      </div>

      {/* Organize Toast notification */}
      {organizeToast && (
        <div className="mx-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 rounded-xl text-xs font-bold flex items-center justify-between animate-in fade-in">
          <span>{organizeToast}</span>
          <button onClick={() => setOrganizeToast(null)}><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* AI Organizer & Dropbox Modal Drawer */}
      {showAIOrganizer && (
        <div className="mx-4 p-4 bg-primary/5 border border-primary/20 rounded-2xl space-y-3 animate-in slide-in-from-top duration-300">
          <div className="flex items-center justify-between">
            <h5 className="font-black text-xs uppercase text-primary flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Dropbox & AI Voice/Text Album Organizer
            </h5>
            <button onClick={() => setShowAIOrganizer(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>
          <p className="text-xs text-muted-foreground">
            Type or use the microphone to tell the AI how to group tracks into albums, rename them, or ingest files from Dropbox. E.g.: "Create 3 albums: Theme Songs, Battles, and Ambient, and organize the tracks accordingly."
          </p>
          <div className="flex gap-2">
            <input 
              type="text"
              value={aiInstruction}
              onChange={e => setAiInstruction(e.target.value)}
              placeholder="Enter instructions (e.g., Create 3 albums for this character)..."
              className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-primary"
            />
            <button
              onClick={handleVoicePrompt}
              disabled={isRecordingVoice}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 cursor-pointer ${isRecordingVoice ? 'bg-red-500 text-white animate-pulse border-red-600' : 'bg-secondary hover:bg-secondary/80 text-foreground'}`}
              title="Speak instruction via microphone"
            >
              {isRecordingVoice ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-red-500" />}
              <span>{isRecordingVoice ? 'Listening...' : 'Voice'}</span>
            </button>
            <button
              onClick={handleRunAIOrganizer}
              disabled={isOrganizingAI || !aiInstruction.trim()}
              className="px-4 py-2 rounded-xl text-xs font-black bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
            >
              {isOrganizingAI ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{isOrganizingAI ? 'Organizing...' : 'Run AI Organizer'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-primary/10">
            <label className="cursor-pointer bg-secondary hover:bg-secondary/80 text-foreground px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border shadow-sm">
              <Upload className="w-3.5 h-3.5 text-indigo-500" />
              Upload Tracks from Dropbox / Device
              <input type="file" multiple accept="audio/*,video/*" className="hidden" onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  const newAudios = [...(character.audios || [])];
                  for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    const url = URL.createObjectURL(file);
                    newAudios.push({
                      id: `track-${Date.now()}-${i}`,
                      src: url,
                      title: file.name.replace(/\.[^/.]+$/, ""),
                      description: `Uploaded from Dropbox / Local (${(file.size / (1024 * 1024)).toFixed(2)} MB)`,
                      metadata: { title: file.name.replace(/\.[^/.]+$/, ""), album: 'Dropbox Uploads' }
                    });
                  }
                  onUpdateCharacter({ ...character, audios: newAudios });
                  setOrganizeToast(`Successfully imported ${files.length} tracks from Dropbox/Device!`);
                  setTimeout(() => setOrganizeToast(null), 3000);
                }
              }} />
            </label>
          </div>
        </div>
      )}

      <div className={`flex flex-col lg:flex-row ${playerSizeMode === 'compact' ? 'max-h-[300px]' : 'min-h-[400px]'}`}>
        {/* Main Display Area */}
        {playerSizeMode !== 'compact' && (
          <div className="flex-1 flex flex-col p-6 space-y-6">
            {/* Visual Canvas (Video Player or Audio Cover) */}
            <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center border border-white/5">
              {activeType === 'video' ? (
                <video 
                  ref={videoRef}
                  src={currentItem.src}
                  className="w-full h-full object-contain"
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={handleMediaEnd}
                  onLoadedMetadata={handleTimeUpdate}
                  playsInline
                  onClick={togglePlay}
                />
              ) : (
                <div className="relative w-full h-full flex items-center justify-center p-8">
                  {currentItem.metadata?.albumCover ? (
                    <img 
                      src={currentItem.metadata.albumCover} 
                      alt="Album Cover" 
                      className="w-48 h-48 sm:w-64 sm:h-64 object-cover rounded-xl shadow-2xl animate-in zoom-in-95 duration-500" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-48 h-48 sm:w-64 sm:h-64 bg-slate-900 rounded-xl flex items-center justify-center border border-white/10 shadow-2xl animate-pulse">
                      <Music2 className="w-20 h-20 text-indigo-400/40" />
                    </div>
                  )}
                  <audio 
                    ref={audioRef}
                    src={currentItem.src}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleMediaEnd}
                    onLoadedMetadata={handleTimeUpdate}
                  />
                </div>
              )}

              {/* Floating Info Overlay */}
              <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
                <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 pointer-events-auto flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
                  <span className="text-[10px] text-white/90 font-bold tracking-tight">#{currentIndex + 1} of {playlist.length} ({currentItem.metadata?.album || 'Unassigned Album'})</span>
                </div>
                <div className="flex items-center gap-2 pointer-events-auto">
                  <button 
                    onClick={handleTranscribeCurrentTrack}
                    disabled={isTranscribing}
                    className="px-2.5 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-full border border-primary/20 transition-all shadow-md flex items-center gap-1 hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
                    title="Transcribe Speech & Extract Lyrics with AI"
                  >
                    {isTranscribing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span className="text-[11px] font-bold">{isTranscribing ? 'Transcribing...' : 'AI Transcribe'}</span>
                  </button>
                  <button 
                    onClick={() => setShowMetadataEditor(true)}
                    className="p-2 bg-black/60 backdrop-blur-md text-white/90 hover:text-white rounded-full border border-white/10 transition-colors cursor-pointer"
                    title="Edit Metadata & ID3 Tags"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={handleDownloadWithMetadata}
                    className="p-2 bg-black/60 backdrop-blur-md text-white/90 hover:text-white rounded-full border border-white/10 transition-colors cursor-pointer"
                    title="Download Track with Embedded Tags"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Lyrics Toggle Overlay */}
              {showLyrics && (
                <div className="absolute inset-0 bg-black/85 backdrop-blur-xl p-8 flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
                  <button onClick={() => setShowLyrics(false)} className="absolute top-4 right-4 p-2 text-white/60 hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                  <h3 className="text-white font-black text-xl mb-6 uppercase tracking-tighter border-b border-white/20 pb-2">Lyrics & Transcript</h3>
                  <div className="flex-1 overflow-y-auto w-full max-w-md scrollbar-none space-y-4 text-white/90 font-medium">
                    {currentItem.metadata?.lyrics ? (
                      currentItem.metadata.lyrics.split('\n').map((line, i) => (
                        <p key={i} className="text-sm leading-relaxed">{line}</p>
                      ))
                    ) : (
                      <p className="text-sm italic text-white/50 py-12">No lyrics found. Click 'AI Transcribe' to extract lyrics!</p>
                    )}
                  </div>
                </div>
              )}

              {/* Associated Info / Transcript Link Banner */}
              {associatedPage && (
                <div className="absolute bottom-4 left-4 right-4 z-10 bg-slate-950/90 backdrop-blur-md p-3 rounded-xl border border-white/10 flex items-center justify-between pointer-events-auto shadow-2xl">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="bg-primary/20 p-1.5 rounded-lg border border-primary/30 text-primary shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-[10px] font-black uppercase text-primary tracking-wider leading-tight">AI Analysis & Transcript Available</p>
                      <p className="text-xs text-white/90 truncate font-semibold">{associatedPage.title}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onNavigateToPage) onNavigateToPage('details', associatedPage.id);
                    }}
                    className="bg-primary hover:bg-primary/95 text-primary-foreground text-[10px] font-black px-3 py-1.5 rounded-lg shadow-sm transition-all shrink-0 cursor-pointer flex items-center gap-1"
                  >
                    <span>Go to Page</span>
                    <span>➔</span>
                  </button>
                </div>
              )}
            </div>

            {/* Info & Controls Area */}
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <div className="flex justify-center items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${activeType === 'audio' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30' : 'bg-amber-500/10 text-amber-500 border-amber-500/30'}`}>
                    {currentItem.metadata?.genre || (activeType === 'audio' ? 'Audio Track' : 'Video Clip')}
                  </span>
                  {currentItem.metadata?.album && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-purple-500/10 text-purple-600 border border-purple-500/30">
                      Album: {currentItem.metadata.album}
                    </span>
                  )}
                </div>
                <h3 className="font-black text-xl text-foreground truncate px-4">{currentItem.metadata?.title || currentItem.title}</h3>
                <p className="text-sm text-primary font-bold">{currentItem.metadata?.artist || character.name}</p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <input 
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-[10px] font-black text-muted-foreground tabular-nums">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Transport Controls */}
              <div className="flex items-center justify-center gap-6 sm:gap-10">
                <button 
                  onClick={() => setIsShuffle(!isShuffle)}
                  className={`transition-colors ${isShuffle ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                  title="Shuffle"
                >
                  <Shuffle className="w-5 h-5" />
                </button>
                <button 
                  onClick={handlePrev}
                  className="text-muted-foreground hover:text-foreground hover:scale-110 transition-all"
                  title="Previous"
                >
                  <SkipBack className="w-6 h-6 fill-current" />
                </button>
                <button 
                  onClick={togglePlay}
                  className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                </button>
                <button 
                  onClick={handleNext}
                  className="text-muted-foreground hover:text-foreground hover:scale-110 transition-all"
                  title="Next"
                >
                  <SkipForward className="w-6 h-6 fill-current" />
                </button>
                <button 
                  onClick={() => setRepeatMode(repeatMode === 'none' ? 'all' : repeatMode === 'all' ? 'one' : 'none')}
                  className={`relative transition-colors ${repeatMode !== 'none' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                  title="Repeat"
                >
                  <Repeat className="w-5 h-5" />
                  {repeatMode === 'one' && <span className="absolute -top-1 -right-1 text-[8px] font-black bg-primary text-primary-foreground w-3 h-3 rounded-full flex items-center justify-center">1</span>}
                </button>
              </div>

              {/* Volume & Toggles */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button onClick={() => setIsMuted(!isMuted)} className="text-muted-foreground hover:text-foreground">
                    {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  <input 
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      setVolume(parseFloat(e.target.value));
                      setIsMuted(false);
                    }}
                    className="w-24 sm:w-32 h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setShowLyrics(!showLyrics)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 border ${showLyrics ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-secondary/40 text-muted-foreground hover:text-foreground border-transparent'}`}
                  >
                    <List className="w-3.5 h-3.5" />
                    LYRICS
                  </button>
                  <button 
                    onClick={() => setShowPlaylist(!showPlaylist)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 border ${showPlaylist ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-secondary/40 text-muted-foreground hover:text-foreground border-transparent'}`}
                  >
                    <List className="w-3.5 h-3.5" />
                    PLAYLIST
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sidebar (Playlist with Direct Play/Pause Buttons) */}
        {showPlaylist && (
          <div className={`${playerSizeMode === 'compact' ? 'w-full' : 'w-full lg:w-80'} bg-secondary/10 border-l p-4 flex flex-col space-y-4`}>
            <div className="flex items-center justify-between">
              <h5 className="font-black text-xs uppercase tracking-wider flex items-center gap-2">
                <List className="w-4 h-4 text-primary" />
                Playlist & Albums ({playlist.length})
              </h5>
              <button onClick={() => setShowPlaylist(false)} className="lg:hidden text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin max-h-[360px]">
              {playlist.map((item, idx) => {
                const isSelected = idx === currentIndex;
                return (
                  <div 
                    key={item.id}
                    className={`p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between gap-3 ${isSelected ? 'bg-primary/10 border-primary font-bold shadow-sm ring-1 ring-primary/20' : 'bg-card hover:bg-secondary/50 border-border opacity-80 hover:opacity-100'}`}
                  >
                    <div 
                      onClick={() => {
                        setCurrentIndex(idx);
                        setIsPlaying(true);
                        setTimeout(() => mediaRef.current?.play(), 100);
                      }}
                      className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                    >
                      <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-slate-800 flex items-center justify-center shrink-0 border border-white/5">
                        {item.metadata?.albumCover ? (
                          <img src={item.metadata.albumCover} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                        ) : (
                          <Music2 className="w-4 h-4 text-indigo-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground truncate">{item.metadata?.title || item.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{item.metadata?.album || 'Unassigned Album'}</p>
                      </div>
                    </div>

                    {/* Direct Play/Pause Button in Sidebar Playlist */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isSelected) {
                          togglePlay();
                        } else {
                          setCurrentIndex(idx);
                          setIsPlaying(true);
                          setTimeout(() => mediaRef.current?.play(), 100);
                        }
                      }}
                      className="p-2 rounded-lg bg-primary/20 hover:bg-primary text-primary hover:text-primary-foreground transition-all cursor-pointer shrink-0"
                      title={isSelected && isPlaying ? "Pause Track" : "Play Track"}
                    >
                      {isSelected && isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Hidden Audio / Video element ref */}
      {playerSizeMode === 'compact' && (
        <div className="p-4 bg-background border-t flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 truncate">
            <button onClick={togglePlay} className="p-2 bg-primary text-primary-foreground rounded-full">
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <div className="truncate">
              <p className="font-bold text-xs truncate">{currentItem.metadata?.title || currentItem.title}</p>
              <p className="text-[10px] text-muted-foreground truncate">{currentItem.metadata?.album || 'Compact Player'}</p>
            </div>
          </div>
          {activeType === 'audio' && (
            <audio ref={audioRef} src={currentItem.src} onTimeUpdate={handleTimeUpdate} onEnded={handleMediaEnd} />
          )}
        </div>
      )}

      {/* Metadata Editor Modal */}
      {showMetadataEditor && editingMetadata && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card text-card-foreground rounded-2xl w-full max-w-2xl shadow-2xl border border-border animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-500" />
                <h3 className="font-black text-base uppercase tracking-tight">Track Property Analyzer & ID3 Tag Editor</h3>
              </div>
              <button onClick={() => setShowMetadataEditor(false)} className="p-1 hover:bg-secondary rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Album Cover Art URL</label>
                    <input 
                      type="text" 
                      value={editingMetadata.albumCover || ''}
                      onChange={e => setEditingMetadata({...editingMetadata, albumCover: e.target.value})}
                      className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
                      placeholder="Paste cover image URL..."
                    />
                    {editingMetadata.albumCover && (
                      <div className="relative aspect-square w-full rounded-xl overflow-hidden border-2 border-indigo-500/20 shadow-lg mt-2">
                        <img src={editingMetadata.albumCover} alt="Cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Track Title</label>
                    <input 
                      type="text" 
                      value={editingMetadata.title || ''}
                      onChange={e => setEditingMetadata({...editingMetadata, title: e.target.value})}
                      className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Artist</label>
                    <input 
                      type="text" 
                      value={editingMetadata.artist || ''}
                      onChange={e => setEditingMetadata({...editingMetadata, artist: e.target.value})}
                      className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Album / Folder</label>
                      <input 
                        type="text" 
                        value={editingMetadata.album || ''}
                        onChange={e => setEditingMetadata({...editingMetadata, album: e.target.value})}
                        className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Year</label>
                      <input 
                        type="text" 
                        value={editingMetadata.year || ''}
                        onChange={e => setEditingMetadata({...editingMetadata, year: e.target.value})}
                        className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Genre</label>
                      <input 
                        type="text" 
                        value={editingMetadata.genre || ''}
                        onChange={e => setEditingMetadata({...editingMetadata, genre: e.target.value})}
                        className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Track No.</label>
                      <input 
                        type="text" 
                        value={editingMetadata.trackNo || ''}
                        onChange={e => setEditingMetadata({...editingMetadata, trackNo: e.target.value})}
                        className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Lyrics & Notes</label>
                    <textarea 
                      value={editingMetadata.lyrics || ''}
                      onChange={e => setEditingMetadata({...editingMetadata, lyrics: e.target.value})}
                      className="w-full h-32 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-primary resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 border-t bg-secondary/10 flex justify-end gap-3">
              <button 
                onClick={() => setShowMetadataEditor(false)}
                className="px-4 py-2 text-xs font-bold bg-secondary hover:bg-secondary/80 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveMetadata}
                className="px-6 py-2 text-xs font-black bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-lg flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Track Properties</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
