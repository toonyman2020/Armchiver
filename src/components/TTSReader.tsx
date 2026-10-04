import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Volume2 } from 'lucide-react';

interface TTSReaderProps {
  text: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg' | string;
}

export const TTSReader: React.FC<TTSReaderProps> = ({ text, label }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      // Try to find a good default male/female voice
      const defaultVoice = availableVoices.find(v => v.name.includes('Google') || v.name.includes('Natural')) || availableVoices[0];
      if (defaultVoice) setSelectedVoice(defaultVoice.name);
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const togglePlay = () => {
    if (isPlaying && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    } else if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = voices.find(v => v.name === selectedVoice);
      if (voice) utterance.voice = voice;
      
      utterance.onend = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };
      
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
      setIsPaused(false);
    }
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  return (
    <div className="flex items-center gap-2 bg-secondary/30 p-1.5 rounded-lg border border-border/40 group">
      {label && <span className="text-[10px] font-bold text-muted-foreground uppercase ml-1 mr-2">{label} Reader</span>}
      
      <div className="flex items-center gap-1">
        <button
          onClick={togglePlay}
          className={`p-1.5 rounded-md transition-all ${
            isPlaying && !isPaused ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
          }`}
          title={isPlaying && !isPaused ? "Pause" : "Play Text-to-Speech"}
        >
          {isPlaying && !isPaused ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>
        
        {isPlaying && (
          <button
            onClick={stop}
            className="p-1.5 rounded-md hover:bg-destructive hover:text-white text-muted-foreground transition-all"
            title="Stop Reading"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>
        )}
      </div>

      <select
        value={selectedVoice}
        onChange={(e) => setSelectedVoice(e.target.value)}
        className="text-[10px] bg-transparent border-none outline-none text-muted-foreground hover:text-foreground cursor-pointer max-w-[80px] truncate opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {voices.filter(v => v.lang.startsWith('en')).map(v => (
          <option key={v.name} value={v.name}>{v.name}</option>
        ))}
      </select>
      
      <Volume2 className="w-3 h-3 text-muted-foreground/50" />
    </div>
  );
};
