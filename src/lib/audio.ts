export function playNotificationSound() {
  try {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const audioContext = new AudioCtx();
    
    // Play a beautiful bell-like notification chime
    // Chime 1: higher frequency
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, audioContext.currentTime); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.1); // A5
    gain1.gain.setValueAtTime(0.15, audioContext.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
    osc1.connect(gain1);
    gain1.connect(audioContext.destination);
    osc1.start();
    osc1.stop(audioContext.currentTime + 0.4);

    // Chime 2: slightly delayed, harmonized frequency
    setTimeout(() => {
      try {
        if (!audioContext || audioContext.state === 'closed') return;
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, audioContext.currentTime); // A5
        osc2.frequency.exponentialRampToValueAtTime(1174.66, audioContext.currentTime + 0.1); // D6
        gain2.gain.setValueAtTime(0.15, audioContext.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.start();
        osc2.stop(audioContext.currentTime + 0.5);
      } catch (err) {
        console.warn('Delayed chime error:', err);
      }
    }, 150);
  } catch (e) {
    console.warn('Audio context not allowed or failed:', e);
  }
}
