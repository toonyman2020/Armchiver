import React, { useEffect, useRef, useState } from 'react';
import { 
  Gamepad2, 
  Play, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Trophy, 
  Zap, 
  AlertCircle, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight,
  Maximize2,
  Minimize2,
  Trash2,
  Award,
  BookOpen,
  Apple,
  Heart,
  Pause,
  Home,
  Code,
  Terminal,
  FileText
} from 'lucide-react';
import { getStoredCreditsConfig, StudioCreditsConfig } from './DeveloperCodeModal';

// Web Audio Retro sound effects engine
class SoundEffects {
  public enabled: boolean = true;
  private ctx: AudioContext | null = null;

  private init() {
    try {
      if (!this.ctx && typeof window !== 'undefined') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch (e) {
      console.warn('AudioContext init error:', e);
    }
  }

  playJump() {
    try {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(500, this.ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch (e) {
      console.warn('playJump sound error:', e);
    }
  }

  playCollect() {
    try {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.25);
    } catch (e) {
      console.warn('playCollect sound error:', e);
    }
  }

  playCrash() {
    try {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {
      console.warn('playCrash sound error:', e);
    }
  }

  playVictory() {
    try {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 triumph
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.1, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.25);
      });
    } catch (e) {
      console.warn('playVictory sound error:', e);
    }
  }

  playLaugh() {
    try {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        const timeOffset = i * 0.15;
        osc.frequency.setValueAtTime(600 + (i % 2 === 0 ? 150 : 0), now + timeOffset);
        osc.frequency.exponentialRampToValueAtTime(100, now + timeOffset + 0.12);
        gain.gain.setValueAtTime(0.12, now + timeOffset);
        gain.gain.exponentialRampToValueAtTime(0.01, now + timeOffset + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + timeOffset);
        osc.stop(now + timeOffset + 0.12);
      }
    } catch (e) {
      console.warn('playLaugh sound error:', e);
    }
  }

  playFreeze() {
    try {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.35);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn('playFreeze sound error:', e);
    }
  }

  playTuna() {
    try {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [587.33, 739.99, 880.00, 1174.66]; // D5, F#5, A5, D6
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.15, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.07 + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.2);
      });
    } catch (e) {
      console.warn('playTuna sound error:', e);
    }
  }
}

const sfx = new SoundEffects();

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  color: string;
  type: 'car' | 'truck' | 'racecar' | 'log' | 'lilypad';
  active?: boolean;
}

interface Fruit {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'apple' | 'cherry' | 'tuna' | 'clock';
  color: string;
  active: boolean;
  moveTimer?: number;
  targetX?: number;
  targetY?: number;
  isMoving?: boolean;
  despawnTimer?: number;
}

interface LeaderboardEntry {
  initials: string;
  score: number;
  date: string;
}

interface TextEffect {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  scale: number;
  duration: number;
}

interface Clown {
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
  spawnTimer: number;
  isSpotted: boolean;
  rowY: number;
  laughTimer: number;
  rideObstacleIdx?: number;
  hasSpawnedOnce: boolean;
  teleportTimer: number;
  restTimer: number;
  stepCooldown: number;
}

const safeGetStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
};

const safeSetStorage = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    // Ignore storage errors in restricted contexts
  }
};

const safeRemoveStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    // Ignore storage errors in restricted contexts
  }
};

const drawRoundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) => {
  if (typeof ctx.roundRect === 'function') {
    try {
      ctx.roundRect(x, y, w, h, Math.max(0, r));
      return;
    } catch (e) {
      // Fallback below
    }
  }
  ctx.rect(x, y, w, h);
};

const getLevelLayout = (lvl: number) => {
  // Phase 1 (1-24): UP, Phase 2 (25-49): DOWN, Phase 3 (50-74): RIGHT, Phase 4 (75-100): LEFT
  let direction: 'up' | 'down' | 'right' | 'left' = 'up';
  if (lvl >= 25 && lvl <= 49) direction = 'down';
  else if (lvl >= 50 && lvl <= 74) direction = 'right';
  else if (lvl >= 75) direction = 'left';

  // Sub-flip road & water every 10 levels
  const isSubFlipped = Math.floor(lvl / 10) % 2 === 1;

  return { direction, isSubFlipped };
};

const drawCatTreeCave = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  isOccupied: boolean = false
) => {
  ctx.save();

  // 1. Cat Tree / Cave Wood Base
  ctx.fillStyle = '#78350f';
  drawRoundRect(ctx, x, y, width, height, 8);
  ctx.fill();

  ctx.strokeStyle = '#a16207';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 2. Ears on Cave Roof
  ctx.fillStyle = '#78350f';
  // Left ear
  ctx.beginPath();
  ctx.moveTo(x + 4, y);
  ctx.lineTo(x + 12, y);
  ctx.lineTo(x + 4, y - 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.moveTo(x + 6, y);
  ctx.lineTo(x + 10, y);
  ctx.lineTo(x + 5, y - 5);
  ctx.closePath();
  ctx.fill();

  // Right ear
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.moveTo(x + width - 4, y);
  ctx.lineTo(x + width - 12, y);
  ctx.lineTo(x + width - 4, y - 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.moveTo(x + width - 6, y);
  ctx.lineTo(x + width - 10, y);
  ctx.lineTo(x + width - 5, y - 5);
  ctx.closePath();
  ctx.fill();

  // 3. Arched Entrance Opening
  ctx.fillStyle = '#1c100b';
  ctx.beginPath();
  ctx.arc(x + width / 2, y + height / 2 + 2, width / 2.6, Math.PI, 0, false);
  ctx.rect(x + width / 2 - width / 2.6, y + height / 2 + 2, width / 1.3, height / 2 - 2);
  ctx.fill();

  // 4. Soft Yellow Cushion Bed
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  drawRoundRect(ctx, x + 8, y + height - 10, width - 16, 7, 3);
  ctx.fill();

  // 5. Sisal Rope Scratching Post Texture on Sides
  ctx.fillStyle = '#d97706';
  for (let p = 0; p < 3; p++) {
    ctx.fillRect(x + 2, y + 10 + p * 6, 4, 3);
    ctx.fillRect(x + width - 6, y + 10 + p * 6, 4, 3);
  }

  // 6. Occupied state
  if (isOccupied) {
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(x + width / 2, y + height / 2 + 2, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('zZ', x + width / 2, y + height / 2 + 5);
    ctx.textAlign = 'left';
  } else {
    ctx.fillStyle = 'rgba(253, 224, 71, 0.2)';
    ctx.beginPath();
    ctx.arc(x + width / 2, y + height / 2 + 2, 12, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
};

export function MiniGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Game states & scoring
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const livesRef = useRef(3);
  const textEffectsRef = useRef<TextEffect[]>([]);
  const clownRef = useRef<Clown>({
    x: -100,
    y: -100,
    width: 20,
    height: 20,
    active: false,
    spawnTimer: 180, // initial delay
    isSpotted: false,
    rowY: 5,
    laughTimer: 0,
    hasSpawnedOnce: false,
    teleportTimer: 400,
    restTimer: 200,
    stepCooldown: 0
  });
  const [victoryCount, setVictoryCount] = useState(() => {
    const saved = safeGetStorage('catti_cango_victory_count');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'paused' | 'gameover' | 'victory_stats' | 'victory_initials'>('idle');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sizeMultiplier, setSizeMultiplier] = useState<'normal' | 'large'>('normal');
  const [creditsConfig, setCreditsConfig] = useState<StudioCreditsConfig>(getStoredCreditsConfig());

  useEffect(() => {
    const handleCreditsUpdate = () => {
      setCreditsConfig(getStoredCreditsConfig());
    };
    window.addEventListener('catti_cango_credits_updated', handleCreditsUpdate);
    return () => {
      window.removeEventListener('catti_cango_credits_updated', handleCreditsUpdate);
    };
  }, []);

  // Statistics tracking refs
  const statsTotalDeathsRef = useRef(0);
  const statsClownDeathsRef = useRef(0);
  const statsClockUsesRef = useRef(0);
  const statsExtrasCollectedRef = useRef(0);
  const statsFruitsCollectedRef = useRef(0);
  const statsFruitScoreRef = useRef(0);

  const [gameStats, setGameStats] = useState({
    totalDeaths: 0,
    clownDeaths: 0,
    clockUses: 0,
    extrasCollected: 0,
    fruitsCollected: 0,
    fruitScore: 0,
    finalScore: 0
  });

  // Initials input state
  const [playerInitials, setPlayerInitials] = useState('');

  // High score leaderboard state
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => {
    const saved = safeGetStorage('catti_cango_leaderboard');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback below
      }
    }
    return [
      { initials: "ALB", score: 5000, date: "2026-08-01" },
      { initials: "AST", score: 3500, date: "2026-08-02" },
      { initials: "PLA", score: 2000, date: "2026-08-03" }
    ];
  });

  // Define row Y coordinates for the cat
  const ROW_Y_POSITIONS = [
    22,  // Row 0: Goal docks (10 to 45)
    75,  // Row 1: River Lane 1 (70 to 100)
    105, // Row 2: River Lane 2 (100 to 130)
    135, // Row 3: River Lane 3 (130 to 160)
    165, // Row 4: River Lane 4 (160 to 190)
    197, // Row 5: Middle walkway (195 to 220)
    225, // Row 6: Road Lane 1 (220 to 250)
    255, // Row 7: Road Lane 2 (250 to 280)
    285, // Row 8: Road Lane 3 (280 to 310)
    315, // Row 9: Road Lane 4 (310 to 340)
    365  // Row 10: Start Grass (340 to 400)
  ];

  // Cat coordinates and boundaries (18x18 fits perfectly inside any 30px lane)
  const catRef = useRef({ x: 230, y: 365, width: 18, height: 18 });
  const catRowRef = useRef(10);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const fruitsRef = useRef<Fruit[]>([]);
  const keysPressedRef = useRef<{ [key: string]: boolean }>({});
  const animationFrameId = useRef<number | null>(null);

  // New features refs & state
  const passedRowsRef = useRef<Set<number>>(new Set());
  const itemMeterRef = useRef<number>(0);
  const [itemMeter, setItemMeter] = useState<number>(0);
  const isGoldenCatRef = useRef<boolean>(false);
  const [isGoldenCat, setIsGoldenCat] = useState<boolean>(false);
  const freezeTimerRef = useRef<number>(0);
  const [freezeSeconds, setFreezeSeconds] = useState<number>(0);
  const spawnTimerRef = useRef<number>(360);

  // Sync sounds
  useEffect(() => {
    sfx.enabled = soundEnabled;
  }, [soundEnabled]);

  // Line/Street progression score check (once per row per level run)
  const checkLineProgression = () => {
    const currentRow = catRowRef.current;
    if (currentRow < 10 && !passedRowsRef.current.has(currentRow)) {
      passedRowsRef.current.add(currentRow);
      const isRiverOrRoad = (currentRow >= 1 && currentRow <= 4) || (currentRow >= 6 && currentRow <= 9);
      const linePoints = isRiverOrRoad ? 20 : 15;
      
      setScore(prev => {
        const nextScore = prev + linePoints;
        const oldExtra = Math.floor(prev / 500);
        const newExtra = Math.floor(nextScore / 500);
        if (newExtra > oldExtra) {
          const deltaLives = newExtra - oldExtra;
          livesRef.current = livesRef.current + deltaLives;
          setLives(livesRef.current);
          textEffectsRef.current.push({
            x: 240,
            y: 180,
            text: deltaLives > 1 ? `+${deltaLives} LIVES!` : "1-UP!",
            color: "#fbbf24",
            alpha: 1.0,
            scale: 1.8,
            duration: 100
          });
        }
        return nextScore;
      });

      textEffectsRef.current.push({
        x: catRef.current.x + 9,
        y: catRef.current.y,
        text: isRiverOrRoad ? `+${linePoints} STREET!` : `+${linePoints} LINE!`,
        color: "#38bdf8",
        alpha: 1.0,
        scale: 1.1,
        duration: 60
      });
    }
  };

  // Helper for grid-by-grid movement for the clown with Line of Sight & Traffic Avoidance
  const makeClownGridMove = () => {
    const clown = clownRef.current;
    if (!clown.active) return;

    const cat = catRef.current;
    const catRow = catRowRef.current;
    const canvas = canvasRef.current;
    const canvasWidth = canvas ? canvas.width : 480;

    // Line of sight checks: Horizontal, Vertical, or Adjacent
    const isHorizontalLOS = clown.rowY === catRow;
    const isVerticalLOS = Math.abs(clown.x - cat.x) < 28;
    const isAdjacentLOS = Math.abs(clown.rowY - catRow) <= 1 && Math.abs(clown.x - cat.x) <= 40;
    const inLineOfSight = isHorizontalLOS || isVerticalLOS || isAdjacentLOS;

    // If player crosses or enters clown's line of sight, wake clown up immediately!
    if (inLineOfSight) {
      clown.restTimer = 0;
    }

    if (clown.restTimer > 0 || clown.stepCooldown > 0) return;

    // Helper: is a target cell valid and safe from immediate traffic for clown?
    const isValidCell = (targetRow: number, targetX: number): boolean => {
      // Goal row (Row 0) is strictly OFF-LIMITS for the clown!
      if (targetRow <= 0 || targetRow > 10) return false;
      if (targetX < 10 || targetX > canvasWidth - 30) return false;

      const { isSubFlipped } = getLevelLayout(level);
      const riverRows = !isSubFlipped ? [1, 2, 3, 4] : [6, 7, 8, 9];
      const roadRows = !isSubFlipped ? [6, 7, 8, 9] : [1, 2, 3, 4];

      // River rows: MUST be on a log/lilypad
      if (riverRows.includes(targetRow)) {
        const targetY = ROW_Y_POSITIONS[targetRow];
        const onLog = obstaclesRef.current.some(obs =>
          (obs.type === 'log' || obs.type === 'lilypad') &&
          targetX + clown.width > obs.x &&
          targetX < obs.x + obs.width &&
          Math.abs(obs.y + 2 - targetY) < 18
        );
        return onLog;
      }

      // Road rows: Check if stepping here would instantly get squished by an oncoming car
      if (roadRows.includes(targetRow)) {
        const targetY = ROW_Y_POSITIONS[targetRow];
        const isCarDanger = obstaclesRef.current.some(obs => 
          (obs.type === 'car' || obs.type === 'truck' || obs.type === 'racecar') &&
          Math.abs(obs.y - targetY) < 18 &&
          targetX + clown.width > obs.x - 12 &&
          targetX < obs.x + obs.width + 12
        );
        if (isCarDanger) return false; // Avoid stepping directly into traffic!
      }

      return true; // Walkway (row 5), grass (row 10)
    };

    // Candidate grid moves: Up, Down, Left, Right
    const candidates: { row: number; x: number }[] = [
      { row: clown.rowY - 1, x: clown.x }, // Up
      { row: clown.rowY + 1, x: clown.x }, // Down
      { row: clown.rowY, x: clown.x - 30 }, // Left
      { row: clown.rowY, x: clown.x + 30 }  // Right
    ];

    let validCandidates = candidates.filter(c => isValidCell(c.row, c.x));

    // Fallback if all candidates are blocked by traffic: allow safe steps (strictly row 1..10)
    if (validCandidates.length === 0) {
      validCandidates = candidates.filter(c => c.row >= 1 && c.row <= 10 && c.x >= 10 && c.x <= canvasWidth - 30);
    }

    if (validCandidates.length > 0) {
      // Pick candidate move that brings clown closest to cat
      const targetCatY = ROW_Y_POSITIONS[catRow];
      let bestCandidate = validCandidates[0];
      let bestDist = Infinity;

      for (const cand of validCandidates) {
        const candY = ROW_Y_POSITIONS[cand.row];
        const distSq = Math.pow(cand.x - cat.x, 2) + Math.pow(candY - targetCatY, 2);
        if (distSq < bestDist) {
          bestDist = distSq;
          bestCandidate = cand;
        }
      }

      clown.rowY = bestCandidate.row;
      clown.x = bestCandidate.x;
      clown.y = ROW_Y_POSITIONS[clown.rowY];
      clown.stepCooldown = 12; // cooldown between steps

      // If clown lands on middle safe walkway (row 5) and NOT in line of sight, he may rest
      if (clown.rowY === 5 && !inLineOfSight && Math.random() < 0.4) {
        clown.restTimer = 180 + Math.floor(Math.random() * 200); // 3 to 6 seconds
      }
    }
  };

  const processDirectionalMove = (screenDir: 'up' | 'down' | 'left' | 'right') => {
    if (gameState !== 'playing') return;
    const { direction } = getLevelLayout(level);
    const step = 30;
    let moved = false;

    // Translate visual screen direction to grid movement based on level rotation
    if (direction === 'up') {
      if (screenDir === 'up') {
        if (catRowRef.current > 0) { catRowRef.current -= 1; catRef.current.y = ROW_Y_POSITIONS[catRowRef.current]; moved = true; }
      } else if (screenDir === 'down') {
        if (catRowRef.current < 10) { catRowRef.current += 1; catRef.current.y = ROW_Y_POSITIONS[catRowRef.current]; moved = true; }
      } else if (screenDir === 'left') {
        catRef.current.x = Math.max(10, catRef.current.x - step); moved = true;
      } else if (screenDir === 'right') {
        catRef.current.x = Math.min(450, catRef.current.x + step); moved = true;
      }
    } else if (direction === 'down') {
      if (screenDir === 'down') {
        if (catRowRef.current > 0) { catRowRef.current -= 1; catRef.current.y = ROW_Y_POSITIONS[catRowRef.current]; moved = true; }
      } else if (screenDir === 'up') {
        if (catRowRef.current < 10) { catRowRef.current += 1; catRef.current.y = ROW_Y_POSITIONS[catRowRef.current]; moved = true; }
      } else if (screenDir === 'left') {
        catRef.current.x = Math.min(450, catRef.current.x + step); moved = true;
      } else if (screenDir === 'right') {
        catRef.current.x = Math.max(10, catRef.current.x - step); moved = true;
      }
    } else if (direction === 'right') {
      if (screenDir === 'right') {
        if (catRowRef.current > 0) { catRowRef.current -= 1; catRef.current.y = ROW_Y_POSITIONS[catRowRef.current]; moved = true; }
      } else if (screenDir === 'left') {
        if (catRowRef.current < 10) { catRowRef.current += 1; catRef.current.y = ROW_Y_POSITIONS[catRowRef.current]; moved = true; }
      } else if (screenDir === 'up') {
        catRef.current.x = Math.max(10, catRef.current.x - step); moved = true;
      } else if (screenDir === 'down') {
        catRef.current.x = Math.min(450, catRef.current.x + step); moved = true;
      }
    } else if (direction === 'left') {
      if (screenDir === 'left') {
        if (catRowRef.current > 0) { catRowRef.current -= 1; catRef.current.y = ROW_Y_POSITIONS[catRowRef.current]; moved = true; }
      } else if (screenDir === 'right') {
        if (catRowRef.current < 10) { catRowRef.current += 1; catRef.current.y = ROW_Y_POSITIONS[catRowRef.current]; moved = true; }
      } else if (screenDir === 'down') {
        catRef.current.x = Math.max(10, catRef.current.x - step); moved = true;
      } else if (screenDir === 'up') {
        catRef.current.x = Math.min(450, catRef.current.x + step); moved = true;
      }
    }

    if (moved) {
      checkLineProgression();
      sfx.playJump();
      makeClownGridMove();
    }
  };

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyW', 'KeyS', 'KeyA', 'KeyD'].includes(e.code)) {
        e.preventDefault();
      }
      keysPressedRef.current[e.code] = true;

      if (gameState === 'playing') {
        if (e.code === 'ArrowUp' || e.code === 'KeyW') {
          processDirectionalMove('up');
        } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
          processDirectionalMove('down');
        } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
          processDirectionalMove('left');
        } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
          processDirectionalMove('right');
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, level]);

  // Mobile virtual buttons
  const handleMove = (direction: 'up' | 'down' | 'left' | 'right') => {
    processDirectionalMove(direction);
  };

  // Generate collectible fruits & special food/clock items ONLY ONCE per level
  const generateFruits = () => {
    const list: Fruit[] = [];
    
    // 1. Multiple Fruits (Apple or Cherry) per level - between 1 and 5 fruits
    const fruitLaneY = [65, 115, 145, 205, 265, 295, 345];
    const fruitCount = 1 + Math.floor(Math.random() * 5);
    for (let i = 0; i < fruitCount; i++) {
      const chosenY = fruitLaneY[Math.floor(Math.random() * fruitLaneY.length)];
      list.push({
        x: Math.max(30, Math.min(430, 40 + Math.random() * 380)),
        y: chosenY,
        width: 15,
        height: 15,
        type: Math.random() > 0.5 ? 'apple' : 'cherry',
        color: Math.random() > 0.5 ? '#ef4444' : '#f43f5e',
        active: true,
        moveTimer: 180 + Math.random() * 240,
        targetX: 0,
        targetY: 0,
        isMoving: false
      });
    }

    // 2. Special item 1: Tuna Fish 🐟 (+1 Extra Life) - Spawns randomly on some levels (~55% chance)
    if (Math.random() > 0.45) {
      list.push({
        x: Math.max(40, Math.min(420, 50 + Math.random() * 360)),
        y: 195 + Math.random() * 10,
        width: 16,
        height: 16,
        type: 'tuna',
        color: '#38bdf8',
        active: true,
        moveTimer: 200 + Math.random() * 250,
        targetX: 0,
        targetY: 0,
        isMoving: false
      });
    }

    // 3. Special item 2: Clock / Timer ⏰ (Time Freeze) - Spawns randomly on some levels (~55% chance)
    if (Math.random() > 0.45) {
      list.push({
        x: Math.max(40, Math.min(420, 50 + Math.random() * 360)),
        y: 345 + Math.random() * 10,
        width: 16,
        height: 16,
        type: 'clock',
        color: '#f59e0b',
        active: true,
        moveTimer: 200 + Math.random() * 250,
        targetX: 0,
        targetY: 0,
        isMoving: false
      });
    }

    fruitsRef.current = list;
  };

  // Generate obstacles for the current level
  const generateLevelObstacles = (currentLevel: number) => {
    const obstacleList: Obstacle[] = [];
    const { direction, isSubFlipped } = getLevelLayout(currentLevel);

    const roadLanes = !isSubFlipped ? [220, 250, 280, 310] : [70, 100, 130, 160];
    const riverLanes = !isSubFlipped ? [70, 100, 130, 160] : [220, 250, 280, 310];

    // Banner notifications on map flips
    if (currentLevel > 1) {
      if (currentLevel % 25 === 0) {
        const dirLabel = direction === 'down' ? 'UPSIDE DOWN' : direction === 'right' ? 'HORIZONTAL RIGHT' : 'HORIZONTAL LEFT';
        textEffectsRef.current.push({
          x: 240,
          y: 180,
          text: `LEVEL ${currentLevel}: MAP ROTATED ${dirLabel}! 🔄`,
          color: '#fbbf24',
          alpha: 1.0,
          scale: 1.4,
          duration: 120
        });
      } else if (currentLevel % 10 === 0) {
        textEffectsRef.current.push({
          x: 240,
          y: 180,
          text: `LEVEL ${currentLevel}: ROAD & WATER FLIPPED! 🔀`,
          color: '#38bdf8',
          alpha: 1.0,
          scale: 1.4,
          duration: 120
        });
      }
    }

    // Speed tier increases every 5 levels
    const speedTier = Math.floor((currentLevel - 1) / 5);

    roadLanes.forEach((y, idx) => {
      const dir = idx % 2 === 0 ? 1 : -1;
      // Traffic speed scales per tier (every 5 levels) + fine level bonus, capped at 11.0 so levels remain beatable
      const roadSpeedMagnitude = Math.min(11.0, 1.4 + (speedTier * 1.3) + ((currentLevel % 5) * 0.12));
      const laneSpeed = roadSpeedMagnitude * dir * (0.88 + Math.random() * 0.24);
      const isTruck = Math.random() > 0.65;
      const size = isTruck ? 50 : 32;
      const type = isTruck ? 'truck' : (Math.random() > 0.5 ? 'racecar' : 'car');
      const colors = ['#f43f5e', '#3b82f6', '#10b981', '#fbbf24', '#a855f7', '#ec4899'];
      const color = colors[Math.floor(Math.random() * colors.length)];

      // 2 to 3 cars per lane with fair spacing
      for (let j = 0; j < 3; j++) {
        obstacleList.push({
          x: j * 165 + Math.random() * 40,
          y: y + 3,
          width: size,
          height: 24,
          speed: laneSpeed,
          color,
          type
        });
      }
    });

    riverLanes.forEach((y, idx) => {
      const dir = idx % 2 === 0 ? -1 : 1;
      // River log speed scales per 5 levels tier, capped at 6.5
      const riverSpeedMagnitude = Math.min(6.5, 1.0 + (speedTier * 0.5) + ((currentLevel % 5) * 0.08));
      const laneSpeed = riverSpeedMagnitude * dir * (0.9 + Math.random() * 0.2);
      const isLog = idx % 2 === 0;
      const size = isLog ? 75 : 45;
      const type = isLog ? 'log' : 'lilypad';
      const color = isLog ? '#b45309' : '#047857';

      for (let j = 0; j < 2; j++) {
        obstacleList.push({
          x: j * 240 + Math.random() * 50,
          y: y + 3,
          width: size,
          height: 24,
          speed: laneSpeed,
          color,
          type
        });
      }
    });

    obstaclesRef.current = obstacleList;
    generateFruits();
    clownRef.current.active = false;
  };

  const exportStatsTxt = () => {
    const report = `==================================
CAT'S CAN GO - LEVEL 100 VICTORY REPORT
==================================
Date: ${new Date().toLocaleString()}
Final Score: ${gameStats.finalScore}
Fruit Score: ${gameStats.fruitScore}
Total Fruits Collected: ${gameStats.fruitsCollected}
Tuna / Extras Collected: ${gameStats.extrasCollected}
Clocks / Freeze Uses: ${gameStats.clockUses}
Total Deaths: ${gameStats.totalDeaths}
Clown Deaths: ${gameStats.clownDeaths}
==================================
Congratulations on conquering Level 100!
`;
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CatsCanGo_Victory_Stats_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const startNewGame = () => {
    statsTotalDeathsRef.current = 0;
    statsClownDeathsRef.current = 0;
    statsClockUsesRef.current = 0;
    statsExtrasCollectedRef.current = 0;
    statsFruitsCollectedRef.current = 0;
    statsFruitScoreRef.current = 0;

    catRef.current = { x: 230, y: 365, width: 18, height: 18 };
    catRowRef.current = 10;
    passedRowsRef.current.clear();
    itemMeterRef.current = 0;
    setItemMeter(0);
    isGoldenCatRef.current = false;
    setIsGoldenCat(false);
    freezeTimerRef.current = 0;
    setFreezeSeconds(0);
    setScore(0);
    setLevel(1);
    livesRef.current = 3;
    setLives(3);
    textEffectsRef.current = [];
    clownRef.current = {
      x: -100,
      y: -100,
      width: 20,
      height: 20,
      active: false,
      spawnTimer: 180, // initial delay
      isSpotted: false,
      rowY: 5,
      laughTimer: 0,
      hasSpawnedOnce: false,
      teleportTimer: 360,
      restTimer: 200,
      stepCooldown: 0
    };
    setPlayerInitials('');
    setGameState('playing');
    generateLevelObstacles(1);
  };

  const togglePause = () => {
    setGameState((prev) => (prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev));
  };

  const resetGame = () => {
    startNewGame();
  };

  const goToMainMenu = () => {
    clownRef.current.active = false;
    clownRef.current.hasSpawnedOnce = false;
    setGameState('idle');
  };

  const handleLeaderboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInitials = (playerInitials || "CAT").trim().toUpperCase().slice(0, 3);
    const newEntry: LeaderboardEntry = {
      initials: cleanInitials,
      score: score,
      date: new Date().toISOString().split('T')[0]
    };

    const updated = [...leaderboard, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Keep top 5

    setLeaderboard(updated);
    safeSetStorage('catti_cango_leaderboard', JSON.stringify(updated));
    setGameState('idle');
  };

  // Reset entire persistent game metrics & highscore
  const resetEntireGameData = () => {
    if (window.confirm("Are you sure you want to completely wipe all scores, levels, leaderboard records, and victory counts? This cannot be undone.")) {
      safeRemoveStorage('catti_cango_leaderboard');
      safeRemoveStorage('catti_cango_victory_count');
      setVictoryCount(0);
      setLeaderboard([
        { initials: "ALB", score: 5000, date: "2026-08-01" },
        { initials: "AST", score: 3500, date: "2026-08-02" },
        { initials: "PLA", score: 2000, date: "2026-08-03" }
      ]);
      setScore(0);
      setLevel(1);
      setGameState('idle');
      alert("All game logs and scores have been wiped successfully!");
    }
  };

  // Game Render and Animation tick
  useEffect(() => {
    if (gameState !== 'playing') {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localLevel = level;
    let localScore = score;

    const getLineNumberFromY = (y: number): number => {
      let closestIndex = 10;
      let minDiff = Infinity;
      for (let i = 0; i <= 10; i++) {
        const diff = Math.abs(ROW_Y_POSITIONS[i] - y);
        if (diff < minDiff) {
          minDiff = diff;
          closestIndex = i;
        }
      }
      return Math.max(1, 10 - closestIndex);
    };

    const handlePlayerDeath = (deathType: 'car_river' | 'clown' = 'car_river') => {
      sfx.playCrash();
      passedRowsRef.current.clear();

      statsTotalDeathsRef.current += 1;
      if (deathType === 'clown') {
        statsClownDeathsRef.current += 1;
      }

      // Reset freeze & golden mode on death
      freezeTimerRef.current = 0;
      setFreezeSeconds(0);
      isGoldenCatRef.current = false;
      setIsGoldenCat(false);
      itemMeterRef.current = 0;
      setItemMeter(0);

      const newLives = livesRef.current - 1;
      livesRef.current = newLives;
      setLives(newLives);
      if (newLives <= 0) {
        setGameState('gameover');
      } else {
        catRef.current = { x: 230, y: 365, width: 18, height: 18 };
        catRowRef.current = 10;
        textEffectsRef.current.push({
          x: 240,
          y: 200,
          text: "-1 LIFE",
          color: "#f87171",
          alpha: 1.0,
          scale: 1.4,
          duration: 90
        });
      }
    };

    const gameLoop = () => {
      // Time Freeze & Super Golden Cat update (5 to 10 seconds range)
      const isFrozen = freezeTimerRef.current > 0;
      if (isFrozen) {
        freezeTimerRef.current--;
        if (freezeTimerRef.current % 30 === 0) {
          setFreezeSeconds(Math.ceil(freezeTimerRef.current / 60));
        }
      } else if (isGoldenCatRef.current) {
        isGoldenCatRef.current = false;
        setIsGoldenCat(false);
        itemMeterRef.current = 0;
        setItemMeter(0);
      }

      // 1. Clear background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Safe Goal Lane
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, canvas.width, 55);

      // Goal Dock Bays
      ctx.fillStyle = '#10b981';
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(35 + i * 90, 10, 45, 35);
      }

      // Deep River Zone
      ctx.fillStyle = '#1e40af';
      ctx.fillRect(0, 55, canvas.width, 140);

      // Walkway Safety Divider
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 195, canvas.width, 25);

      // Black Asphalt Highway Lane
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 220, canvas.width, 120);

      // Yellow dashed highway dividers
      ctx.strokeStyle = '#eab308';
      ctx.setLineDash([8, 12]);
      for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 220 + i * 30);
        ctx.lineTo(canvas.width, 220 + i * 30);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Starting Walkway Grass
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 340, canvas.width, 60);

      // Draw active status inside canvas
      ctx.fillStyle = '#38bdf8';
      ctx.font = '11px monospace';
      ctx.fillText(`LEVEL ${localLevel}/100`, 15, 385);

      // Draw 5-Item Golden Cat Meter dots
      ctx.fillStyle = isGoldenCatRef.current ? '#facc15' : '#38bdf8';
      ctx.font = '10px monospace';
      ctx.fillText(isGoldenCatRef.current ? `GOLDEN CAT!` : `METER:`, 130, 385);
      for (let m = 0; m < 5; m++) {
        ctx.fillStyle = isGoldenCatRef.current ? '#facc15' : (m < itemMeterRef.current ? '#38bdf8' : '#334155');
        ctx.beginPath();
        ctx.arc(190 + m * 9, 382, isGoldenCatRef.current ? 4.5 : 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw lives on the right side of the canvas
      ctx.textAlign = 'right';
      ctx.fillStyle = '#f87171'; // soft red hearts
      const heartString = '♥'.repeat(Math.max(0, livesRef.current));
      ctx.fillText(`LIVES: ${heartString || 'NONE'}`, 465, 385);
      ctx.textAlign = 'left'; // reset back to default left-align

      const cat = catRef.current;
      let onPlatform = false;
      let platformSpeed = 0;

      // 2. Draw Obstacles (Cars, Trucks, Logs)
      const obstacles = obstaclesRef.current;
      obstacles.forEach((obs) => {
        if (!isFrozen) {
          obs.x += obs.speed;
          // Wrap edges
          if (obs.speed > 0 && obs.x > canvas.width) {
            obs.x = -obs.width;
          } else if (obs.speed < 0 && obs.x < -obs.width) {
            obs.x = canvas.width;
          }
        }

        ctx.fillStyle = obs.color;
        if (obs.type === 'car') {
          // Draw a car body
          ctx.beginPath();
          drawRoundRect(ctx, obs.x, obs.y, obs.width, obs.height, 5);
          ctx.fill();
          // Wheels
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(obs.x + 3, obs.y - 1, 6, 2);
          ctx.fillRect(obs.x + obs.width - 9, obs.y - 1, 6, 2);
          ctx.fillRect(obs.x + 3, obs.y + obs.height - 1, 6, 2);
          ctx.fillRect(obs.x + obs.width - 9, obs.y + obs.height - 1, 6, 2);
          // Windows
          ctx.fillStyle = '#94a3b8';
          if (obs.speed > 0) {
            // Facing right: windshield on right, back window on left
            ctx.fillRect(obs.x + 6, obs.y + 4, obs.width - 15, obs.height - 8);
            ctx.fillStyle = '#1e293b'; // windshield accent
            ctx.fillRect(obs.x + obs.width - 9, obs.y + 4, 3, obs.height - 8);
            // Headlights on right
            ctx.fillStyle = '#eab308';
            ctx.fillRect(obs.x + obs.width - 2, obs.y + 2, 2, 3);
            ctx.fillRect(obs.x + obs.width - 2, obs.y + obs.height - 5, 2, 3);
            // Taillights on left
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(obs.x, obs.y + 2, 2, 3);
            ctx.fillRect(obs.x, obs.y + obs.height - 5, 2, 3);
          } else {
            // Facing left: windshield on left, back window on right
            ctx.fillRect(obs.x + 9, obs.y + 4, obs.width - 15, obs.height - 8);
            ctx.fillStyle = '#1e293b'; // windshield accent
            ctx.fillRect(obs.x + 6, obs.y + 4, 3, obs.height - 8);
            // Headlights on left
            ctx.fillStyle = '#eab308';
            ctx.fillRect(obs.x, obs.y + 2, 2, 3);
            ctx.fillRect(obs.x, obs.y + obs.height - 5, 2, 3);
            // Taillights on right
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(obs.x + obs.width - 2, obs.y + 2, 2, 3);
            ctx.fillRect(obs.x + obs.width - 2, obs.y + obs.height - 5, 2, 3);
          }
        } else if (obs.type === 'truck') {
          // Semi truck cab & trailer
          if (obs.speed > 0) {
            // Facing right: trailer on left, cab on right
            // Trailer
            ctx.fillStyle = obs.color;
            ctx.fillRect(obs.x, obs.y, obs.width - 12, obs.height);
            // Cab
            ctx.fillStyle = '#475569';
            ctx.fillRect(obs.x + obs.width - 12, obs.y + 2, 10, obs.height - 4);
            // Windshield
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(obs.x + obs.width - 5, obs.y + 4, 3, obs.height - 8);
            // Headlights
            ctx.fillStyle = '#eab308';
            ctx.fillRect(obs.x + obs.width - 2, obs.y + 3, 2, 3);
            ctx.fillRect(obs.x + obs.width - 2, obs.y + obs.height - 6, 2, 3);
            // Taillights
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(obs.x, obs.y + 3, 2, 3);
            ctx.fillRect(obs.x, obs.y + obs.height - 6, 2, 3);
          } else {
            // Facing left: trailer on right, cab on left
            // Trailer
            ctx.fillStyle = obs.color;
            ctx.fillRect(obs.x + 12, obs.y, obs.width - 12, obs.height);
            // Cab
            ctx.fillStyle = '#475569';
            ctx.fillRect(obs.x + 2, obs.y + 2, 10, obs.height - 4);
            // Windshield
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(obs.x + 4, obs.y + 4, 3, obs.height - 8);
            // Headlights
            ctx.fillStyle = '#eab308';
            ctx.fillRect(obs.x, obs.y + 3, 2, 3);
            ctx.fillRect(obs.x, obs.y + obs.height - 6, 2, 3);
            // Taillights
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(obs.x + obs.width - 2, obs.y + 3, 2, 3);
            ctx.fillRect(obs.x + obs.width - 2, obs.y + obs.height - 6, 2, 3);
          }
        } else if (obs.type === 'racecar') {
          // Sleek formula car
          ctx.beginPath();
          drawRoundRect(ctx, obs.x + 3, obs.y + 1, obs.width - 6, obs.height - 2, 7);
          ctx.fill();
          
          if (obs.speed > 0) {
            // Facing right: spoiler on left, cockpit in middle-right
            ctx.fillStyle = '#0f172a'; // spoiler
            ctx.fillRect(obs.x + 2, obs.y, 4, obs.height);
            // Cockpit
            ctx.fillStyle = '#eab308';
            ctx.fillRect(obs.x + obs.width - 15, obs.y + 5, 6, obs.height - 10);
            // Front wing
            ctx.fillStyle = obs.color;
            ctx.fillRect(obs.x + obs.width - 4, obs.y + 4, 4, obs.height - 8);
          } else {
            // Facing left: spoiler on right, cockpit in middle-left
            ctx.fillStyle = '#0f172a'; // spoiler
            ctx.fillRect(obs.x + obs.width - 6, obs.y, 4, obs.height);
            // Cockpit
            ctx.fillStyle = '#eab308';
            ctx.fillRect(obs.x + 9, obs.y + 5, 6, obs.height - 10);
            // Front wing
            ctx.fillStyle = obs.color;
            ctx.fillRect(obs.x, obs.y + 4, 4, obs.height - 8);
          }
        } else if (obs.type === 'log') {
          // Wooden floating logs
          ctx.beginPath();
          drawRoundRect(ctx, obs.x, obs.y, obs.width, obs.height, 6);
          ctx.fill();
          // Rings
          ctx.strokeStyle = '#78350f';
          ctx.strokeRect(obs.x + 4, obs.y + 3, obs.width - 8, obs.height - 6);
        } else if (obs.type === 'lilypad') {
          // Green leaf
          ctx.beginPath();
          ctx.arc(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.height / 2, 0, Math.PI * 1.85);
          ctx.fill();
        }

        // Road crash collision checks
        if (cat.y >= 220 && cat.y < 340) {
          if (
            cat.x < obs.x + obs.width &&
            cat.x + cat.width > obs.x &&
            cat.y < obs.y + obs.height &&
            cat.y + cat.height > obs.y
          ) {
            if (isGoldenCatRef.current) {
              sfx.playCrash();
              localScore += 50;
              setScore(localScore);
              const effectType = Math.random();
              if (effectType < 0.33) {
                obs.x = -9999;
                obs.active = false;
              } else if (effectType < 0.66) {
                obs.speed = obs.speed > 0 ? 25 : -25;
              } else {
                obs.y -= 150;
              }
              textEffectsRef.current.push({
                x: obs.x + obs.width / 2,
                y: obs.y,
                text: "💥 OBLITERATED! 🌟",
                color: "#facc15",
                alpha: 1.0,
                scale: 1.3,
                duration: 70
              });
            } else {
              handlePlayerDeath('car_river');
            }
          }
        }

        // River log ride collision checks
        if (cat.y >= 55 && cat.y < 195) {
          if (
            cat.x < obs.x + obs.width &&
            cat.x + cat.width > obs.x &&
            cat.y < obs.y + obs.height &&
            cat.y + cat.height > obs.y
          ) {
            onPlatform = true;
            platformSpeed = obs.speed;
          }
        }
      });

      // If Time is Frozen, pop out stepping stones across the river lanes to form a safe bridge!
      const steppingStones: { x: number; y: number; width: number; height: number }[] = [];
      if (isFrozen) {
        const stoneLanesY = [70, 100, 130, 160];
        stoneLanesY.forEach((sy) => {
          for (let sx = 45; sx < canvas.width; sx += 90) {
            steppingStones.push({ x: sx, y: sy + 3, width: 28, height: 18 });
          }
        });

        // Render stepping stones popping out of water
        steppingStones.forEach((stone) => {
          ctx.fillStyle = '#64748b'; // slate grey stone
          ctx.beginPath();
          drawRoundRect(ctx, stone.x, stone.y, stone.width, stone.height, 6);
          ctx.fill();
          // Stone highlight top
          ctx.fillStyle = '#94a3b8';
          ctx.beginPath();
          drawRoundRect(ctx, stone.x + 3, stone.y + 2, stone.width - 6, 6, 3);
          ctx.fill();

          // Check collision with player cat
          if (cat.y >= 55 && cat.y < 195) {
            if (
              cat.x < stone.x + stone.width &&
              cat.x + cat.width > stone.x &&
              cat.y < stone.y + stone.height &&
              cat.y + cat.height > stone.y
            ) {
              onPlatform = true;
              platformSpeed = 0;
            }
          }
        });
      }

      // 3. Float river current physics
      if (cat.y >= 55 && cat.y < 195) {
        if (isGoldenCatRef.current) {
          onPlatform = true;
          platformSpeed = 0;
        } else if (onPlatform) {
          if (!isFrozen) {
            cat.x += platformSpeed;
          }
          // Keep bound inside walls
          if (cat.x < 0) cat.x = 0;
          if (cat.x > canvas.width - cat.width) cat.x = canvas.width - cat.width;
        } else {
          // Slipped in the river
          handlePlayerDeath('car_river');
        }
      }

      // 4. Update and Draw Collectibles (Fruits, Tuna 🐟, Clock ⏰)
      const fruits = fruitsRef.current;
      fruits.forEach((fruit) => {
        if (!fruit.active) return;

        // Proximity check to player Catti (move away if player gets close)
        const catDistX = fruit.x - cat.x;
        const catDistY = fruit.y - cat.y;
        const distToCat = Math.sqrt(catDistX * catDistX + catDistY * catDistY);

        if (!fruit.isMoving) {
          if (distToCat < 65 && Math.random() > 0.4) {
            // Flee away from player within play area bounds
            const fleeAngle = Math.atan2(catDistY, catDistX);
            const fleeDist = 35 + Math.random() * 25;
            fruit.targetX = Math.max(30, Math.min(430, fruit.x + Math.cos(fleeAngle) * fleeDist));
            fruit.targetY = Math.max(65, Math.min(350, fruit.y + Math.sin(fleeAngle) * fleeDist));
            fruit.isMoving = true;
          } else if (fruit.moveTimer !== undefined) {
            fruit.moveTimer--;
            if (fruit.moveTimer <= 0) {
              if (Math.random() > 0.6) {
                // Wander off slightly in a random direction
                const wanderAngle = Math.random() * Math.PI * 2;
                const wanderDist = 20 + Math.random() * 20;
                fruit.targetX = Math.max(30, Math.min(430, fruit.x + Math.cos(wanderAngle) * wanderDist));
                fruit.targetY = Math.max(65, Math.min(350, fruit.y + Math.sin(wanderAngle) * wanderDist));
                fruit.isMoving = true;
              } else {
                // Stay stationary for longer
                fruit.moveTimer = 200 + Math.random() * 300;
              }
            }
          } else {
            fruit.moveTimer = 180 + Math.random() * 240;
          }
        } else {
          // Move towards target position at gentle speed
          const baseSpeed = 0.4 + Math.floor(localLevel / 10) * 0.1;
          const dx = (fruit.targetX ?? fruit.x) - fruit.x;
          const dy = (fruit.targetY ?? fruit.y) - fruit.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < baseSpeed) {
            fruit.x = Math.max(30, Math.min(430, fruit.targetX ?? fruit.x));
            fruit.y = Math.max(65, Math.min(350, fruit.targetY ?? fruit.y));
            fruit.isMoving = false;
            fruit.moveTimer = 200 + Math.random() * 300; // Return to stationary
          } else {
            fruit.x += (dx / dist) * baseSpeed;
            fruit.y += (dy / dist) * baseSpeed;
            // Strict play area bounds clamping
            fruit.x = Math.max(30, Math.min(430, fruit.x));
            fruit.y = Math.max(65, Math.min(350, fruit.y));
          }
        }

        const hopY = fruit.isMoving ? Math.abs(Math.sin(Date.now() / 120) * 4) : 0;

        // Render based on collectible type
        if (fruit.type === 'tuna') {
          // Tuna Fish 🐟
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.ellipse(fruit.x + 8, fruit.y + 7 - hopY, 7, 4, 0, 0, Math.PI * 2);
          ctx.fill();
          // Tail fin
          ctx.beginPath();
          ctx.moveTo(fruit.x + 1, fruit.y + 7 - hopY);
          ctx.lineTo(fruit.x - 3, fruit.y + 3 - hopY);
          ctx.lineTo(fruit.x - 3, fruit.y + 11 - hopY);
          ctx.closePath();
          ctx.fill();
          // Eye
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(fruit.x + 12, fruit.y + 5 - hopY, 1.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (fruit.type === 'clock') {
          // Clock ⏰
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(fruit.x + 7, fruit.y + 7 - hopY, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(fruit.x + 7, fruit.y + 7 - hopY, 4.5, 0, Math.PI * 2);
          ctx.fill();
          // Clock hands
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(fruit.x + 7, fruit.y + 7 - hopY);
          ctx.lineTo(fruit.x + 7, fruit.y + 4 - hopY);
          ctx.moveTo(fruit.x + 7, fruit.y + 7 - hopY);
          ctx.lineTo(fruit.x + 10, fruit.y + 7 - hopY);
          ctx.stroke();
        } else {
          // Standard Fruits (Apples / Cherries)
          ctx.fillStyle = fruit.color;
          ctx.beginPath();
          ctx.arc(fruit.x + 7, fruit.y + 7 - hopY, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(fruit.x + 6, fruit.y - hopY, 2, 3);
        }

        // Collision check
        if (
          cat.x < fruit.x + fruit.width &&
          cat.x + cat.width > fruit.x &&
          cat.y < fruit.y + fruit.height &&
          cat.y + cat.height > fruit.y
        ) {
          fruit.active = false;

          // Increment 5-item golden cat meter!
          itemMeterRef.current += 1;
          setItemMeter(itemMeterRef.current);

          const oldScore = localScore;

          if (itemMeterRef.current >= 5) {
            itemMeterRef.current = 5;
            setItemMeter(5);
            if (!isGoldenCatRef.current) {
              isGoldenCatRef.current = true;
              setIsGoldenCat(true);
              const superFrames = 300 + Math.floor(Math.random() * 301); // 5 to 10 seconds
              freezeTimerRef.current = superFrames;
              setFreezeSeconds(Math.ceil(superFrames / 60));
              sfx.playVictory();
              textEffectsRef.current.push({
                x: 240,
                y: 160,
                text: "🌟 5 FRUITS! SUPER GOLDEN CAT MODE! 🌟",
                color: "#facc15",
                alpha: 1.0,
                scale: 1.6,
                duration: 140
              });
            }
          }

          if (fruit.type === 'tuna') {
            statsExtrasCollectedRef.current += 1;
            livesRef.current += 1;
            setLives(livesRef.current);
            localScore += 50;
            setScore(localScore);
            sfx.playTuna();
            textEffectsRef.current.push({
              x: fruit.x + 7,
              y: fruit.y,
              text: "+1 LIFE! 🐟 TUNA! (+50)",
              color: "#38bdf8",
              alpha: 1.0,
              scale: 1.4,
              duration: 90
            });
          } else if (fruit.type === 'clock') {
            statsClockUsesRef.current += 1;
            const freezeFrames = 300 + Math.floor(Math.random() * 301); // 5 to 10 seconds
            freezeTimerRef.current = freezeFrames;
            setFreezeSeconds(Math.ceil(freezeFrames / 60));
            localScore += 30;
            setScore(localScore);
            sfx.playFreeze();
            textEffectsRef.current.push({
              x: fruit.x + 7,
              y: fruit.y,
              text: "🧊 TIME FROZEN! ⏰ (+30)",
              color: "#fbbf24",
              alpha: 1.0,
              scale: 1.4,
              duration: 90
            });
          } else {
            statsFruitsCollectedRef.current += 1;
            sfx.playCollect();
            const lineNum = getLineNumberFromY(fruit.y);
            const pointsGained = 10 + lineNum;
            statsFruitScoreRef.current += pointsGained;
            localScore += pointsGained;
            setScore(localScore);

            textEffectsRef.current.push({
              x: fruit.x + 7,
              y: fruit.y + 7,
              text: `+${pointsGained}`,
              color: fruit.type === 'apple' ? '#ef4444' : '#f43f5e',
              alpha: 1.0,
              scale: 1.2,
              duration: 80
            });
          }

          // Every 500 points gives an extra life
          const oldExtraLivesGained = Math.floor(oldScore / 500);
          const newExtraLivesGained = Math.floor(localScore / 500);
          if (newExtraLivesGained > oldExtraLivesGained) {
            const deltaLives = newExtraLivesGained - oldExtraLivesGained;
            livesRef.current = livesRef.current + deltaLives;
            setLives(livesRef.current);
            
            textEffectsRef.current.push({
              x: 240,
              y: 180,
              text: deltaLives > 1 ? `+${deltaLives} LIVES!` : "1-UP!",
              color: "#fbbf24",
              alpha: 1.0,
              scale: 1.8,
              duration: 100
            });
          }
        }
      });

      // --- CLOWN LOGIC ---
      const clown = clownRef.current;
      
      if (gameState === 'playing') {
        // Helper function to find a suitable platform for the clown to spawn/teleport onto
        const findSuitablePlatform = (): { platform: Obstacle, posX: number } | null => {
          const platforms = obstaclesRef.current.filter(obs => 
            (obs.type === 'log' || obs.type === 'lilypad') &&
            obs.x + obs.width > 20 &&
            obs.x < canvas.width - 20
          );
          if (platforms.length === 0) return null;

          // Shuffle or pick random platforms
          const shuffled = [...platforms].sort(() => Math.random() - 0.5);

          for (const plat of shuffled) {
            const catOnThisPlat = 
              cat.x < plat.x + plat.width &&
              cat.x + cat.width > plat.x &&
              cat.y < plat.y + plat.height &&
              cat.y + cat.height > plat.y;

            if (catOnThisPlat) {
              if (plat.width > 60) {
                const catRelativeX = cat.x - plat.x;
                let posX = plat.x + 5;
                if (catRelativeX < plat.width / 2) {
                  posX = plat.x + plat.width - clown.width - 5;
                }
                if (Math.abs(posX - cat.x) >= 40) {
                  return { platform: plat, posX };
                }
              }
            } else {
              const posX = plat.x + plat.width / 2 - clown.width / 2;
              return { platform: plat, posX };
            }
          }

          const fallbackPlat = platforms[0];
          const posX = cat.x < fallbackPlat.x + fallbackPlat.width / 2 
            ? fallbackPlat.x + fallbackPlat.width - clown.width - 5 
            : fallbackPlat.x + 5;
          return { platform: fallbackPlat, posX };
        };

        const respawnClownOnLog = (effectText: string = "🤡 POOF!") => {
          // 50% chance to spawn on a safe middle walkway spot, 50% on floating logs
          if (Math.random() < 0.5) {
            clown.rowY = 5;
            clown.y = ROW_Y_POSITIONS[5];
            clown.x = 60 + Math.floor(Math.random() * 320);
            clown.restTimer = 180 + Math.floor(Math.random() * 240); // Sit still for 3-7s
            clown.active = true;
            clown.teleportTimer = 400 + Math.floor(Math.random() * 240);
          } else {
            const spawnInfo = findSuitablePlatform();
            if (spawnInfo) {
              clown.x = spawnInfo.posX;
              const rowIdx = ROW_Y_POSITIONS.findIndex(y => Math.abs(y - spawnInfo.platform.y) < 18);
              clown.rowY = rowIdx !== -1 ? rowIdx : 2;
              clown.y = ROW_Y_POSITIONS[clown.rowY];
              clown.restTimer = 120 + Math.floor(Math.random() * 180);
              clown.active = true;
              clown.teleportTimer = 400 + Math.floor(Math.random() * 240);
            } else {
              clown.rowY = 5;
              clown.y = ROW_Y_POSITIONS[5];
              clown.x = 200;
              clown.restTimer = 180;
              clown.active = true;
              clown.teleportTimer = 400;
            }
          }

          textEffectsRef.current.push({
            x: clown.x + clown.width / 2,
            y: clown.y + clown.height / 2,
            text: effectText,
            color: effectText.includes("SQUISHED") ? "#ef4444" : "#c084fc",
            alpha: 1.0,
            scale: 1.4,
            duration: 80
          });

          textEffectsRef.current.push({
            x: clown.x + clown.width / 2,
            y: clown.y - 10,
            text: "🤡 RE-SPOTTED!",
            color: "#ef4444",
            alpha: 1.0,
            scale: 1.3,
            duration: 80
          });
          sfx.playLaugh();
        };

        if (!clown.active && !clown.hasSpawnedOnce) {
          clown.spawnTimer--;
          if (clown.spawnTimer <= 0) {
            respawnClownOnLog("🤡 CLOWN SPOTTED!");
            if (clown.active) clown.hasSpawnedOnce = true;
          }
        } else if (!clown.active && clown.hasSpawnedOnce) {
          clown.spawnTimer--;
          if (clown.spawnTimer <= 0) {
            respawnClownOnLog("🤡 HE'S BACK!");
          }
        } else if (clown.active) {
          // Decrement timers
          clown.teleportTimer--;
          clown.laughTimer--;
          if (clown.stepCooldown > 0) clown.stepCooldown--;
          if (clown.restTimer > 0) clown.restTimer--;

          if (clown.laughTimer <= 0) {
            sfx.playLaugh();
            clown.laughTimer = 180 + Math.floor(Math.random() * 120);
          }

          // Check if clown and cat are on the EXACT SAME row/line
          const isOnSameLine = clown.rowY === catRowRef.current;

          if (isOnSameLine) {
            // Wake up immediately from resting if player steps onto the same line!
            clown.restTimer = 0;

            // Clown speed increases every 5 levels (Tier 0: L1-4, Tier 1: L5-9, Tier 2: L10-14, Tier 3: L15-19, Tier 4: L20-24, Tier 5+: L25+)
            const clownTier = Math.floor((localLevel - 1) / 5);
            const chaseSpeed = Math.min(8.5, 1.35 + (clownTier * 1.1) + ((localLevel % 5) * 0.05));

            // Move clown along the line directly towards player's position
            const dx = cat.x - clown.x;
            if (Math.abs(dx) > 2) {
              if (dx > 0) {
                clown.x = Math.min(cat.x, clown.x + chaseSpeed);
              } else {
                clown.x = Math.max(cat.x, clown.x - chaseSpeed);
              }
            }
          }

          // 1. Log drift if in river rows (1 to 4)
          if (clown.rowY >= 1 && clown.rowY <= 4) {
            const currentPlatform = obstaclesRef.current.find(obs => 
              (obs.type === 'log' || obs.type === 'lilypad') &&
              clown.x + clown.width > obs.x &&
              clown.x < obs.x + obs.width &&
              Math.abs(obs.y + 2 - clown.y) < 18
            );

            if (currentPlatform) {
              clown.x += currentPlatform.speed;
              clown.y = currentPlatform.y + 2;
            }
          } else {
            clown.y = ROW_Y_POSITIONS[clown.rowY];
          }

          // 2. Periodic autonomous grid step if not resting, not on same line, and player is idle
          if (!isOnSameLine && clown.restTimer <= 0 && clown.stepCooldown <= 0 && Math.random() < 0.02) {
            makeClownGridMove();
          }

          // 3. VEHICLE COLLISION ON STREETS (Rows 6 to 9):
          const isClownOnStreet = clown.rowY >= 6 && clown.rowY <= 9;
          if (isClownOnStreet) {
            const hitByVehicle = obstaclesRef.current.some(obs => 
              (obs.type === 'car' || obs.type === 'truck' || obs.type === 'racecar') &&
              clown.x + 3 < obs.x + obs.width &&
              clown.x + clown.width - 3 > obs.x &&
              clown.y + 3 < obs.y + obs.height &&
              clown.y + clown.height - 3 > obs.y
            );

            if (hitByVehicle) {
              // SQUISHED BY CAR! Respawn back to floating log/safe walkway!
              respawnClownOnLog("🤡 SQUISHED! 💥");
            }
          }

          // 4. DRIFTING OFF SCREEN / LOG GOING THROUGH:
          if (clown.x < -40 || clown.x > canvas.width + 20 || clown.y < 10 || clown.y > canvas.height + 20 || clown.teleportTimer <= 0) {
            respawnClownOnLog("🤡 POOF!");
          }

          // --- Draw Clown ---
          ctx.save();
          const wobbleY = Math.sin(Date.now() / 150) * 3;
          const cx = clown.x;
          const cy = clown.y + wobbleY;

          // Same-line alert aura
          if (isOnSameLine) {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
            ctx.beginPath();
            ctx.arc(cx + clown.width / 2, cy + clown.height / 2, 18, 0, Math.PI * 2);
            ctx.fill();
          }
          
          // 1. Red clown hair
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(cx, cy + 8, 4.5, 0, Math.PI * 2);
          ctx.arc(cx - 2, cy + 4, 3.5, 0, Math.PI * 2);
          ctx.arc(cx + clown.width, cy + 8, 4.5, 0, Math.PI * 2);
          ctx.arc(cx + clown.width + 2, cy + 4, 3.5, 0, Math.PI * 2);
          ctx.fill();
          
          // 2. White face make-up
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          drawRoundRect(ctx, cx + 1, cy + 3, clown.width - 2, clown.height - 3, 5);
          ctx.fill();
          
          // 3. Pointy hat
          ctx.fillStyle = '#eab308';
          ctx.beginPath();
          ctx.moveTo(cx + 4, cy + 3);
          ctx.lineTo(cx + clown.width - 4, cy + 3);
          ctx.lineTo(cx + clown.width / 2, cy - 6);
          ctx.closePath();
          ctx.fill();
          
          ctx.fillStyle = '#3b82f6';
          ctx.beginPath();
          ctx.arc(cx + clown.width / 2, cy - 6, 2, 0, Math.PI * 2);
          ctx.fill();
          
          // 4. Eyes (creepy cross makeup)
          ctx.fillStyle = '#8b5cf6';
          ctx.fillRect(cx + 4, cy + 5, 2, 4);
          ctx.fillRect(cx + 3, cy + 6, 4, 2);
          
          ctx.fillRect(cx + clown.width - 6, cy + 5, 2, 4);
          ctx.fillRect(cx + clown.width - 7, cy + 6, 4, 2);
          
          // 5. Big red nose
          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.arc(cx + clown.width / 2, cy + 10, 3.5, 0, Math.PI * 2);
          ctx.fill();
          
          // 6. Evil painted wide grin
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(cx + clown.width / 2, cy + 11, 5, 0, Math.PI);
          ctx.stroke();
          
          // 7. Mini fangs/teeth
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(cx + clown.width / 2 - 3, cy + 11, 1.5, 1.5);
          ctx.fillRect(cx + clown.width / 2 + 1.5, cy + 11, 1.5, 1.5);
          
          ctx.restore();

          // Collision Check
          if (
            cat.x < clown.x + clown.width &&
            cat.x + cat.width > clown.x &&
            cat.y < clown.y + clown.height &&
            cat.y + cat.height > clown.y
          ) {
            if (isGoldenCatRef.current) {
              sfx.playCrash();
              localScore += 200;
              setScore(localScore);
              textEffectsRef.current.push({
                x: clown.x + clown.width / 2,
                y: clown.y,
                text: "🤡💥 BLASTED BY SUPER CAT! 🌟",
                color: "#facc15",
                alpha: 1.0,
                scale: 1.6,
                duration: 100
              });
              respawnClownOnLog("🤡 OBLITERATED!");
            } else {
              textEffectsRef.current.push({
                x: cat.x + cat.width / 2,
                y: cat.y,
                text: "🤡 TAGGED YOU! 💥",
                color: "#ef4444",
                alpha: 1.0,
                scale: 1.6,
                duration: 100
              });
              
              handlePlayerDeath('clown');
              
              respawnClownOnLog("🤡 HAHAHA!");
            }
          }
        }
      }

      // 5. Draw Catti Cango (Mascot ginger/tuxedo cat face & ears or Super Golden Cat)
      if (isGoldenCatRef.current) {
        // Glowing golden aura halo
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.75)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cat.x + cat.width / 2, cat.y + cat.height / 2, 16 + Math.sin(Date.now() / 100) * 2, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = isGoldenCatRef.current ? '#facc15' : '#f97316'; // Golden vs Vivid Orange Cat Body
      ctx.beginPath();
      drawRoundRect(ctx, cat.x, cat.y + 4, cat.width, cat.height - 4, 4);
      ctx.fill();

      // Cat Ears (drawn from cat.y + 4 up to cat.y, staying inside the 18px bounding box height)
      ctx.fillStyle = isGoldenCatRef.current ? '#eab308' : '#ea580c';
      // Left ear
      ctx.beginPath();
      ctx.moveTo(cat.x, cat.y + 4);
      ctx.lineTo(cat.x + 5, cat.y + 4);
      ctx.lineTo(cat.x + 1.5, cat.y);
      ctx.closePath();
      ctx.fill();
      // Right ear
      ctx.beginPath();
      ctx.moveTo(cat.x + cat.width, cat.y + 4);
      ctx.lineTo(cat.x + cat.width - 5, cat.y + 4);
      ctx.lineTo(cat.x + cat.width - 1.5, cat.y);
      ctx.closePath();
      ctx.fill();

      // Cat Whiskers & Nose (perfectly aligned inside the 18px box)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      // Left whiskers
      ctx.moveTo(cat.x + 2, cat.y + 11); ctx.lineTo(cat.x - 3, cat.y + 10);
      ctx.moveTo(cat.x + 2, cat.y + 13); ctx.lineTo(cat.x - 3, cat.y + 13);
      // Right whiskers
      ctx.moveTo(cat.x + cat.width - 2, cat.y + 11); ctx.lineTo(cat.x + cat.width + 3, cat.y + 10);
      ctx.moveTo(cat.x + cat.width - 2, cat.y + 13); ctx.lineTo(cat.x + cat.width + 3, cat.y + 13);
      ctx.stroke();

      // Cat Nose
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(cat.x + cat.width / 2, cat.y + 12, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Cat eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cat.x + 5, cat.y + 8, 3, 0, Math.PI * 2);
      ctx.arc(cat.x + cat.width - 5, cat.y + 8, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0284c7'; // Blue pupils
      ctx.beginPath();
      ctx.arc(cat.x + 5, cat.y + 8, 1.5, 0, Math.PI * 2);
      ctx.arc(cat.x + cat.width - 5, cat.y + 8, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // 6. Check Level Goal Reached
      if (cat.y <= 45) {
        // Find which bay they entered
        const enteredBay = [35, 125, 215, 305, 395].some(
          (bayX) => cat.x + cat.width / 2 >= bayX && cat.x + cat.width / 2 <= bayX + 45
        );

        if (enteredBay) {
          sfx.playVictory();
          const oldScore = localScore;
          localScore += 250;
          localLevel += 1;

          setScore(localScore);

          // Every 500 points gives an extra life
          const oldExtraLivesGained = Math.floor(oldScore / 500);
          const newExtraLivesGained = Math.floor(localScore / 500);
          if (newExtraLivesGained > oldExtraLivesGained) {
            const deltaLives = newExtraLivesGained - oldExtraLivesGained;
            livesRef.current = livesRef.current + deltaLives;
            setLives(livesRef.current);
            
            textEffectsRef.current.push({
              x: 240,
              y: 180,
              text: deltaLives > 1 ? `+${deltaLives} LIVES!` : "1-UP!",
              color: "#fbbf24",
              alpha: 1.0,
              scale: 1.8,
              duration: 100
            });
          }
          
          // Reset freeze & golden mode on level completion
          freezeTimerRef.current = 0;
          setFreezeSeconds(0);
          isGoldenCatRef.current = false;
          setIsGoldenCat(false);
          itemMeterRef.current = 0;
          setItemMeter(0);

          if (localLevel > 100) {
            // BEAT THE ENTIRE GAME!
            const newVictoryCount = victoryCount + 1;
            setVictoryCount(newVictoryCount);
            safeSetStorage('catti_cango_victory_count', newVictoryCount.toString());

            setGameStats({
              totalDeaths: statsTotalDeathsRef.current,
              clownDeaths: statsClownDeathsRef.current,
              clockUses: statsClockUsesRef.current,
              extrasCollected: statsExtrasCollectedRef.current,
              fruitsCollected: statsFruitsCollectedRef.current,
              fruitScore: statsFruitScoreRef.current,
              finalScore: localScore
            });

            setGameState('victory_stats');
          } else {
            setLevel(localLevel);
            passedRowsRef.current.clear();
            generateLevelObstacles(localLevel);
            // Respawn at bottom
            catRef.current = { x: 230, y: 365, width: 18, height: 18 };
            catRowRef.current = 10;
          }
        } else {
          // Bounced off wall back to riverbank (Row 1)
          catRowRef.current = 1;
          cat.y = ROW_Y_POSITIONS[1];
        }
      }

      // 6b. Time Freeze Overlay Visuals
      if (isFrozen) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(130, 8, 220, 22);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.strokeRect(130, 8, 220, 22);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`🧊 TIME FROZEN: ${Math.ceil(freezeTimerRef.current / 60)}s ⏰`, 240, 23);
        ctx.textAlign = 'left';
      }

      // 7. Update and Draw Text Effects
      textEffectsRef.current = textEffectsRef.current.filter((effect) => {
        effect.y -= 0.6; // drift up
        effect.alpha -= 0.015; // fade out
        effect.duration--;
        
        ctx.save();
        ctx.globalAlpha = Math.max(0, effect.alpha);
        ctx.fillStyle = '#000000';
        ctx.font = `bold ${Math.floor(13 * effect.scale)}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(effect.text, effect.x + 1, effect.y + 1);
        ctx.fillStyle = effect.color;
        ctx.fillText(effect.text, effect.x, effect.y);
        ctx.restore();

        return effect.duration > 0;
      });

      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [gameState, level]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border rounded-xl p-5 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500 border border-orange-500/20">
              <Gamepad2 className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight">Catti Cango: Cattaloguer</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            A top-down arcade adventure. Guide Catti Cango through traffic, collect fresh fruits, and cross safe docks to clear Level 100!
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Sizing toggle */}
          <button
            onClick={() => setSizeMultiplier(sizeMultiplier === 'normal' ? 'large' : 'normal')}
            className="p-2 rounded-lg border bg-secondary hover:bg-secondary/80 text-muted-foreground border-border text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Toggle Arcade Cabinet Size"
          >
            {sizeMultiplier === 'large' ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{sizeMultiplier === 'large' ? "Normal Screen" : "Wide Theater"}</span>
          </button>

          {/* Sounds Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg border transition-all flex items-center justify-center ${
              soundEnabled 
                ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/25 hover:bg-orange-500/20' 
                : 'bg-secondary text-muted-foreground border-border hover:bg-secondary/80'
            }`}
            title={soundEnabled ? 'Mute Retro Chimes' : 'Unmute Retro Chimes'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Victory Count Ribbon */}
          {victoryCount > 0 && (
            <div className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 flex items-center gap-1.5 text-xs font-bold">
              <Award className="w-4 h-4 text-green-500" />
              <span>Runs Beaten: {victoryCount}</span>
            </div>
          )}

          {/* High Score Widget */}
          <div className="px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 flex items-center gap-2 text-xs font-bold">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span>Top Score: {leaderboard[0]?.score || 0} ({leaderboard[0]?.initials || 'ALB'})</span>
          </div>
        </div>
      </div>

      {/* Main Arcade Frame Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Playable Canvas Container */}
        <div className={`lg:col-span-8 flex flex-col items-center bg-zinc-950 rounded-2xl p-5 border border-zinc-800 shadow-2xl relative overflow-hidden group transition-all duration-300`}>
          {/* Retro Neon Overlay scanline / shadow bezel */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_65%,rgba(0,0,0,0.45)_100%)] z-10" />

          {/* Arcade Cabinet Header */}
          <div className="w-full max-w-[480px] lg:max-w-none flex items-center justify-between mb-3 text-[10px] text-zinc-500 font-mono border-b border-zinc-800 pb-2 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span>ARMENTERO PLAYARMS EMULATOR</span>
              <span className="animate-pulse text-orange-500">
                {gameState === 'playing' ? '● LIVE RUN' : gameState === 'paused' ? '⏸️ PAUSED' : '○ IDLE'}
              </span>
            </div>

            {/* In-Game Action Controls */}
            <div className="flex items-center gap-1.5">
              {gameState === 'playing' && (
                <button
                  onClick={togglePause}
                  className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 rounded font-bold text-[11px] transition-all flex items-center gap-1 active:scale-95"
                  title="Pause Game"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>PAUSE</span>
                </button>
              )}

              {gameState === 'paused' && (
                <button
                  onClick={togglePause}
                  className="px-2.5 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded font-bold text-[11px] transition-all flex items-center gap-1 active:scale-95"
                  title="Resume Game"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>RESUME</span>
                </button>
              )}

              {(gameState === 'playing' || gameState === 'paused') && (
                <button
                  onClick={resetGame}
                  className="px-2.5 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded font-bold text-[11px] transition-all flex items-center gap-1 active:scale-95"
                  title="Reset Game Run"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>RESET</span>
                </button>
              )}

              {gameState !== 'idle' && (
                <button
                  onClick={goToMainMenu}
                  className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded font-bold text-[11px] transition-all flex items-center gap-1 active:scale-95"
                  title="Return to Main Menu"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>MAIN MENU</span>
                </button>
              )}
            </div>
          </div>

          <div className="relative w-full flex justify-center">
            {/* Canvas with dynamic responsive width based on toggle */}
            <canvas
              ref={canvasRef}
              width={480}
              height={400}
              className={`bg-slate-900 rounded-lg shadow-inner border border-zinc-800 relative z-0 aspect-[12/10] transition-all duration-300 ${
                sizeMultiplier === 'large' ? 'w-full max-w-[640px]' : 'w-full max-w-[480px]'
              }`}
            />

            {/* Menu Overlays */}
            {gameState === 'idle' && (
              <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center text-center p-6 space-y-4 rounded-lg z-20">
                <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 border border-orange-500/30 animate-bounce">
                  <Gamepad2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-black tracking-wider text-orange-400">CATTI CANGO: CATTALOGUER</h2>
                  <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
                    Help our little orange mascot cross safe lanes. Dodge racing cars, float on wooden logs, and snack on apples/cherries (+10-20 pts) to score. Clear levels (+250 pts). Every 500 pts earns you an extra life!
                  </p>
                </div>
                <button
                  onClick={startNewGame}
                  className="py-2.5 px-6 bg-orange-500 hover:bg-orange-600 text-black font-bold text-xs rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>START ARCADE</span>
                </button>
              </div>
            )}

            {gameState === 'paused' && (
              <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center text-center p-6 space-y-5 rounded-lg z-20 animate-in fade-in duration-150">
                <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 border border-amber-500/30 animate-pulse">
                  <Pause className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-black tracking-widest text-amber-400">GAME PAUSED</h2>
                  <p className="text-xs text-zinc-400">Take a breather or select an action below to continue.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2.5 w-full max-w-[280px]">
                  <button
                    onClick={togglePause}
                    className="flex-1 py-2.5 px-4 bg-green-500 hover:bg-green-600 text-black font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>RESUME</span>
                  </button>

                  <button
                    onClick={resetGame}
                    className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>RESET</span>
                  </button>
                </div>

                <button
                  onClick={goToMainMenu}
                  className="py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-lg transition-all flex items-center gap-2 border border-zinc-700"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>MAIN MENU</span>
                </button>
              </div>
            )}

            {gameState === 'gameover' && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-center p-6 space-y-4 rounded-lg z-20 animate-in zoom-in-95 duration-150">
                <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 border border-red-500/30">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-red-500 tracking-widest">RUN OVER</h2>
                  <p className="text-xs text-zinc-400">Catti collided or slipped off into the deep water!</p>
                  <div className="pt-2 flex justify-center gap-4 text-xs">
                    <div>
                      <span className="text-zinc-500 block">LEVEL CLEARED</span>
                      <span className="font-bold text-zinc-200 text-sm">{level}</span>
                    </div>
                    <div className="border-l border-zinc-800" />
                    <div>
                      <span className="text-zinc-500 block">FINAL SCORE</span>
                      <span className="font-bold text-orange-400 text-sm">{score}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={startNewGame}
                    className="py-2.5 px-5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-red-600/20"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>TRY AGAIN</span>
                  </button>
                  <button
                    onClick={goToMainMenu}
                    className="py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-lg transition-all flex items-center gap-2 border border-zinc-700"
                  >
                    <Home className="w-4 h-4" />
                    <span>MAIN MENU</span>
                  </button>
                </div>
              </div>
            )}

            {gameState === 'victory_stats' && (
              <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center text-center p-6 space-y-4 rounded-lg z-20 animate-in zoom-in-95 overflow-y-auto">
                <div className="w-14 h-14 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 border border-yellow-500/30 animate-bounce">
                  <Trophy className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-black text-yellow-400 tracking-wider">🎉 LEVEL 100 VICTORY! 🎉</h2>
                  <p className="text-xs text-zinc-300">You beat the game! Here are your complete statistics:</p>
                </div>

                <div className="w-full max-w-[320px] bg-zinc-900/90 rounded-xl p-3 border border-zinc-800 grid grid-cols-2 gap-2 text-left text-xs">
                  <div className="flex justify-between items-center bg-zinc-950 p-2 rounded">
                    <span className="text-zinc-400">Total Score:</span>
                    <span className="font-bold text-orange-400">{gameStats.finalScore}</span>
                  </div>
                  <div className="flex justify-between items-center bg-zinc-950 p-2 rounded">
                    <span className="text-zinc-400">Fruit Score:</span>
                    <span className="font-bold text-green-400">{gameStats.fruitScore}</span>
                  </div>
                  <div className="flex justify-between items-center bg-zinc-950 p-2 rounded">
                    <span className="text-zinc-400">Total Deaths:</span>
                    <span className="font-bold text-red-400">{gameStats.totalDeaths}</span>
                  </div>
                  <div className="flex justify-between items-center bg-zinc-950 p-2 rounded">
                    <span className="text-zinc-400">Clown Deaths:</span>
                    <span className="font-bold text-purple-400">{gameStats.clownDeaths}</span>
                  </div>
                  <div className="flex justify-between items-center bg-zinc-950 p-2 rounded">
                    <span className="text-zinc-400">Clocks Used:</span>
                    <span className="font-bold text-amber-400">{gameStats.clockUses}</span>
                  </div>
                  <div className="flex justify-between items-center bg-zinc-950 p-2 rounded">
                    <span className="text-zinc-400">Tuna / Extras:</span>
                    <span className="font-bold text-sky-400">{gameStats.extrasCollected}</span>
                  </div>
                  <div className="col-span-2 flex justify-between items-center bg-zinc-950 p-2 rounded">
                    <span className="text-zinc-400">Total Fruits Collected:</span>
                    <span className="font-bold text-pink-400">{gameStats.fruitsCollected}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 w-full max-w-[240px]">
                  <button
                    onClick={exportStatsTxt}
                    className="py-2 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg transition-all shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    DOWNLOAD STATS REPORT (TXT)
                  </button>
                  <button
                    onClick={() => setGameState('victory_initials')}
                    className="py-2 px-4 bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-xs rounded-lg transition-all shadow-lg shadow-yellow-500/20 hover:scale-105"
                  >
                    CONTINUE TO LEADERBOARD 🏆
                  </button>
                </div>
              </div>
            )}

            {gameState === 'victory_initials' && (
              <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center text-center p-6 space-y-4 rounded-lg z-20 animate-in zoom-in-95">
                <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500 border border-yellow-500/30 animate-pulse">
                  <Trophy className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-yellow-500 tracking-wider">VICTORY LEVEL 100!</h2>
                  <p className="text-xs text-zinc-400">You completed the ultimate cataloguer road!</p>
                  <p className="text-sm font-bold text-green-400">Final Score: {score} pts</p>
                </div>
                
                <form onSubmit={handleLeaderboardSubmit} className="space-y-3 w-full max-w-[240px]">
                  <label className="block text-[11px] text-zinc-500 font-mono">ENTER YOUR INITIALS:</label>
                  <input
                    type="text"
                    required
                    maxLength={3}
                    placeholder="CAT"
                    value={playerInitials}
                    onChange={(e) => setPlayerInitials(e.target.value.toUpperCase())}
                    className="w-full text-center py-2 bg-zinc-900 border border-zinc-700 rounded text-zinc-100 font-black tracking-widest placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-xs rounded transition-colors"
                  >
                    SUBMIT TO LEADERBOARD
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* D-PAD Virtual Gamepad for touch & click control */}
          <div className="w-full max-w-[280px] mt-6 bg-zinc-900/60 rounded-2xl p-4 border border-zinc-800 flex flex-col items-center justify-center gap-2">
            <button
              onClick={() => handleMove('up')}
              disabled={gameState !== 'playing'}
              className="w-11 h-11 bg-zinc-800 active:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed border border-zinc-700 rounded-xl flex items-center justify-center text-zinc-300 shadow-md transition-all active:scale-90"
              title="Move Up"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
            <div className="flex gap-10">
              <button
                onClick={() => handleMove('left')}
                disabled={gameState !== 'playing'}
                className="w-11 h-11 bg-zinc-800 active:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed border border-zinc-700 rounded-xl flex items-center justify-center text-zinc-300 shadow-md transition-all active:scale-90"
                title="Move Left"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleMove('right')}
                disabled={gameState !== 'playing'}
                className="w-11 h-11 bg-zinc-800 active:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed border border-zinc-700 rounded-xl flex items-center justify-center text-zinc-300 shadow-md transition-all active:scale-90"
                title="Move Right"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={() => handleMove('down')}
              disabled={gameState !== 'playing'}
              className="w-11 h-11 bg-zinc-800 active:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed border border-zinc-700 rounded-xl flex items-center justify-center text-zinc-300 shadow-md transition-all active:scale-90"
              title="Move Down"
            >
              <ArrowDown className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* High Score Leaderboard & Credits side Panel */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Active Score card */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-sm relative overflow-hidden">
            <div className="absolute right-3 top-3 opacity-10">
              <Zap className="w-24 h-24 text-orange-500" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex justify-between items-center">
              <span>Current Run</span>
              <span className="flex items-center gap-1 text-red-500 font-bold bg-red-500/10 px-2 py-0.5 rounded-full text-[10px] animate-pulse">
                <Heart className="w-3 h-3 fill-current" />
                <span>{lives} LIVES</span>
              </span>
            </h3>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-extrabold tracking-tight text-foreground">{score}</span>
              <span className="text-xs text-muted-foreground">pts</span>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-border text-xs text-muted-foreground justify-between">
              <div>
                <span>Level Progress: </span>
                <span className="font-bold text-foreground bg-secondary px-2.5 py-0.5 rounded-full">{level}/100</span>
              </div>
              <button
                onClick={resetEntireGameData}
                className="text-[10px] text-red-500 hover:text-red-600 hover:underline flex items-center gap-1"
                title="Wipe Score Data"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset All Data</span>
              </button>
            </div>
          </div>

          {/* High Score Leaderboard List */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3.5 shadow-sm">
            <div className="flex items-center gap-2 border-b border-border pb-2.5">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <h3 className="font-bold text-sm">Leaderboard Rankings</h3>
            </div>
            <div className="space-y-2 font-mono text-xs">
              {leaderboard.map((entry, index) => (
                <div 
                  key={index} 
                  className={`flex items-center justify-between p-2 rounded-lg border ${
                    index === 0 
                      ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400 font-bold' 
                      : 'bg-secondary/40 border-border/60 text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-zinc-400">#{index + 1}</span>
                    <span className="text-foreground tracking-widest">{entry.initials}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-foreground">{entry.score} pts</span>
                    <span className="text-[10px] text-zinc-500 hidden sm:inline">{entry.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Fruit & Food Collecting Tip */}
          <div className="bg-orange-500/5 border border-orange-500/15 rounded-2xl p-4 text-xs text-muted-foreground flex gap-2.5 items-start">
            <Apple className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
            <p>
              <strong>Snack Check:</strong> Fresh <span className="text-red-500 font-bold">Apples and Cherries</span> spawn randomly! Collect them for <strong className="text-foreground">10 pts + lane bonus</strong>. Every <strong>500 points</strong> awards an extra life!
            </p>
          </div>

          {/* Tuna Fish Special Food Source Card */}
          <div className="bg-sky-500/5 border border-sky-500/15 rounded-2xl p-4 text-xs text-muted-foreground flex gap-2.5 items-start">
            <span className="text-xl shrink-0 leading-none">🐟</span>
            <p>
              <strong>Tuna Cat Feast:</strong> Special <span className="text-sky-400 font-bold">Tuna Fish</span> spawns at random! Catching it feeds Catti Cango, giving him <strong className="text-sky-400">+1 Extra Life</strong> and <strong>+50 bonus points</strong> instantly!
            </p>
          </div>

          {/* Clock Time Freeze & 5-Item Meter Card */}
          <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-4 text-xs text-muted-foreground flex gap-2.5 items-start">
            <span className="text-xl shrink-0 leading-none">⏰</span>
            <p>
              <strong>Time Freeze & Meter:</strong> Grab a <span className="text-amber-400 font-bold">Clock</span> or fill your <strong className="text-sky-400">5-Collectible Meter</strong> to freeze all cars, trucks, and river logs for <strong>7 full seconds</strong>!
            </p>
          </div>

          {/* Line & Street Passing Points Card */}
          <div className="bg-blue-500/5 border border-blue-500/15 rounded-2xl p-4 text-xs text-muted-foreground flex gap-2.5 items-start">
            <Zap className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <p>
              <strong>Line & Traffic Points:</strong> Advance up the grid! Passing each line or street awards <strong className="text-blue-400">+15 to +20 points</strong> once per row per run, even if you backtrack!
            </p>
          </div>

          {/* Creepy Clown Warning */}
          <div className="bg-red-500/5 border border-red-500/15 rounded-2xl p-4 text-xs text-muted-foreground flex gap-2.5 items-start">
            <span className="text-xl shrink-0 leading-none">🤡</span>
            <p>
              <strong>Clown Danger:</strong> Watch out for the <span className="text-red-500 font-bold">Killer Clown</span>! Spawning randomly on roads, walkways, or floating logs, this creepy menace will chase you if you land on the same log! Any touch is an instant, tragic kill. Stay far away!
            </p>
          </div>



        </div>

      </div>
    </div>
  );
}
