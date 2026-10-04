import React, { useState, useEffect } from 'react';
import { 
  Code, Copy, Check, Terminal, FileCode, Layers, X, Download, 
  BookOpen, Save, RotateCcw, FileText, Database, ShieldCheck, 
  Activity, Sliders, CheckCircle, Play, Trash2, Award, Search, FileDown
} from 'lucide-react';
import JSZip from 'jszip';

interface DeveloperCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface StudioCreditsConfig {
  studioName: string;
  creatorName: string;
  mascotName: string;
  meImgUrl: string;
  superImgUrl: string;
  logoImgUrl: string;
  labImgUrl: string;
  studioDescription: string;
  itemOrder: string[];
}

export const DEFAULT_CREDITS_CONFIG: StudioCreditsConfig = {
  studioName: "Armentero Studios",
  creatorName: "Alberto Armentero",
  mascotName: "Super Armentero",
  meImgUrl: "https://raw.githubusercontent.com/toonyman2020/Music-Player/Catti-Cango/Me.jpg",
  superImgUrl: "https://raw.githubusercontent.com/toonyman2020/Music-Player/Catti-Cango/Super%20Green%20Me.png",
  logoImgUrl: "https://raw.githubusercontent.com/toonyman2020/Music-Player/Catti-Cango/Logo%20-%20Armentero%20Studios.png",
  labImgUrl: "https://raw.githubusercontent.com/toonyman2020/Music-Player/Catti-Cango/Armstech%20Laboratories.jpg",
  studioDescription: "The Main Studio Tree root. Managing premium arts, designs, character archives, and brand coordination under a unified Armentero Studios creative roof.",
  itemOrder: ["creator", "mascot", "studio", "lab"]
};

export const getStoredCreditsConfig = (): StudioCreditsConfig => {
  try {
    const saved = localStorage.getItem('catti_cango_credits_config');
    if (saved) {
      return { ...DEFAULT_CREDITS_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    // fallback
  }
  return DEFAULT_CREDITS_CONFIG;
};

const CLOWN_AI_SOURCE_CODE = `/**
 * Armament Studios & Armentero Studios
 * Killer Clown AI Engine (Grid & Line-of-Sight Chasing System)
 * 
 * Features:
 * - Line of Sight (LOS) detection across Horizontal, Vertical, and Proximity axes.
 * - Autonomous Grid-by-Grid pathfinding with Traffic & Obstacle Awareness.
 * - Adaptive Level Speed Scaling (Exponential Tier Speed Increase every 5 levels).
 * - Safe Zone Resting & Dynamic Water Log Respawning.
 */

export interface GridPosition {
  x: number;
  y: number;
  rowY: number;
}

export interface ObstacleEntity {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'car' | 'truck' | 'racecar' | 'log' | 'lilypad';
  speed: number;
}

export interface ClownState {
  x: number;
  y: number;
  width: number;
  height: number;
  rowY: number;
  active: boolean;
  restTimer: number;
  stepCooldown: number;
  teleportTimer: number;
}

export class KillerClownAI {
  private ROW_Y_POSITIONS: number[];

  constructor(rowPositions?: number[]) {
    this.ROW_Y_POSITIONS = rowPositions || [
      22,  // Row 0: Goal docks
      75,  // Row 1: River Lane 1
      105, // Row 2: River Lane 2
      135, // Row 3: River Lane 3
      165, // Row 4: River Lane 4
      195, // Row 5: Middle Safe Walkway
      225, // Row 6: Road Lane 1
      255, // Row 7: Road Lane 2
      285, // Row 8: Road Lane 3
      315, // Row 9: Road Lane 4
      345  // Row 10: Bottom Starting Grass
    ];
  }

  /**
   * Checks whether the target (Player) is within Line of Sight (Horizontal, Vertical, or Proximity)
   */
  public checkLineOfSight(clown: ClownState, playerX: number, playerRowY: number): {
    inLOS: boolean;
    isHorizontal: boolean;
    isVertical: boolean;
    isAdjacent: boolean;
  } {
    const isHorizontal = clown.rowY === playerRowY;
    const isVertical = Math.abs(clown.x - playerX) < 28;
    const isAdjacent = Math.abs(clown.rowY - playerRowY) <= 1 && Math.abs(clown.x - playerX) <= 40;

    return {
      inLOS: isHorizontal || isVertical || isAdjacent,
      isHorizontal,
      isVertical,
      isAdjacent
    };
  }

  /**
   * Checks whether a candidate tile or road cell is safe from immediate vehicle traffic collisions
   */
  public isTrafficSafe(targetX: number, targetRowY: number, obstacles: ObstacleEntity[]): boolean {
    if (targetRowY < 6 || targetRowY > 9) return true; // Not a road lane

    const targetY = this.ROW_Y_POSITIONS[targetRowY];
    const dangerVehicle = obstacles.some(obs => 
      (obs.type === 'car' || obs.type === 'truck' || obs.type === 'racecar') &&
      Math.abs(obs.y - targetY) < 18 &&
      targetX + 20 > obs.x - 15 &&
      targetX < obs.x + obs.width + 15
    );

    return !dangerVehicle;
  }

  /**
   * Calculates the next grid step for the Clown toward the target position while respecting water logs and traffic safety
   */
  public computeNextGridStep(
    clown: ClownState,
    playerX: number,
    playerRowY: number,
    obstacles: ObstacleEntity[],
    canvasWidth: number = 480
  ): { targetRow: number; targetX: number } | null {
    if (!clown.active) return null;

    const candidates: { row: number; x: number }[] = [
      { row: clown.rowY - 1, x: clown.x }, // Up
      { row: clown.rowY + 1, x: clown.x }, // Down
      { row: clown.rowY, x: clown.x - 30 }, // Left
      { row: clown.rowY, x: clown.x + 30 }  // Right
    ];

    const validCandidates = candidates.filter(c => {
      if (c.row < 0 || c.row > 10) return false;
      if (c.x < 10 || c.x > canvasWidth - 30) return false;

      // River rows (1 to 4): Must land on a log
      if (c.row >= 1 && c.row <= 4) {
        const targetY = this.ROW_Y_POSITIONS[c.row];
        return obstacles.some(obs =>
          (obs.type === 'log' || obs.type === 'lilypad') &&
          c.x + clown.width > obs.x &&
          c.x < obs.x + obs.width &&
          Math.abs(obs.y + 2 - targetY) < 18
        );
      }

      // Road rows (6 to 9): Prefer cells free of immediate oncoming cars
      if (c.row >= 6 && c.row <= 9) {
        return this.isTrafficSafe(c.x, c.row, obstacles);
      }

      return true;
    });

    if (validCandidates.length === 0) return null;

    // Pick candidate closest to player position
    const targetPlayerY = this.ROW_Y_POSITIONS[playerRowY];
    let best = validCandidates[0];
    let bestDist = Infinity;

    for (const cand of validCandidates) {
      const candY = this.ROW_Y_POSITIONS[cand.row];
      const distSq = Math.pow(cand.x - playerX, 2) + Math.pow(candY - targetPlayerY, 2);
      if (distSq < bestDist) {
        bestDist = distSq;
        best = cand;
      }
    }

    return { targetRow: best.row, targetX: best.x };
  }
}`;

const GAME_LOOP_EXAMPLE = `// Example Usage in Game Animation Frame Loop:
import { KillerClownAI } from './clownAI';

const clownAI = new KillerClownAI();

function onGameFrameUpdate(clown, player, obstacles, currentLevel) {
  // 1. Line of Sight Check
  const los = clownAI.checkLineOfSight(clown, player.x, player.rowY);

  if (los.inLOS) {
    clown.restTimer = 0; // Wake up immediately!

    // Tiered chase speed scaling every 5 levels
    const tier = Math.floor((currentLevel - 1) / 5);
    const chaseSpeed = Math.min(8.5, 1.35 + (tier * 1.1) + ((currentLevel % 5) * 0.05));

    if (los.isHorizontal) {
      // Direct horizontal chase along the row
      const dx = player.x - clown.x;
      if (Math.abs(dx) > 2) {
        clown.x += (dx > 0 ? 1 : -1) * chaseSpeed;
      }
    } else {
      // Step vertically/horizontally toward player avoiding traffic
      const step = clownAI.computeNextGridStep(clown, player.x, player.rowY, obstacles);
      if (step) {
        clown.rowY = step.targetRow;
        clown.x = step.targetX;
      }
    }
  }

  // 2. Traffic Collision Check
  if (clown.rowY >= 6 && clown.rowY <= 9) {
    const isHit = obstacles.some(obs => 
      obs.type.includes('car') &&
      clown.x < obs.x + obs.width &&
      clown.x + clown.width > obs.x &&
      Math.abs(obs.y - clown.y) < 15
    );
    if (isHit) {
      // Respawn clown back across the street/river!
      respawnClownOnRiverLog(clown);
    }
  }
}`;

export const DeveloperCodeModal: React.FC<DeveloperCodeModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'module' | 'loop' | 'game' | 'credits' | 'preview' | 'backup' | 'prompt'>('module');
  const [copied, setCopied] = useState(false);

  // Credits editing state
  const [creditsConfig, setCreditsConfig] = useState<StudioCreditsConfig>(getStoredCreditsConfig());
  const [savedCredits, setSavedCredits] = useState(false);

  // Complete Backup Desk state
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupData, setBackupData] = useState<any>(null);
  const [selectedBackupFile, setSelectedBackupFile] = useState<string>("");
  const [backupFileSearch, setBackupFileSearch] = useState<string>("");
  const [copiedBackup, setCopiedBackup] = useState(false);

  // Diagnostics & Repair variables
  const [diagnosticsLogs, setDiagnosticsLogs] = useState<string[]>([]);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagScore, setDiagScore] = useState<number | null>(null);

  // Load backend files recursively
  useEffect(() => {
    if (isOpen) {
      setCreditsConfig(getStoredCreditsConfig());
      fetchBackup();
    }
  }, [isOpen]);

  const fetchBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await fetch('/api/backup-source');
      const data = await res.json();
      if (data.success) {
        setBackupData(data);
        if (data.files && Object.keys(data.files).length > 0) {
          const keys = Object.keys(data.files);
          const defaultSel = keys.find(k => k.endsWith('App.tsx')) || keys[0];
          setSelectedBackupFile(defaultSel);
        }
      }
    } catch (err) {
      console.error('Failed to fetch backup:', err);
    } finally {
      setBackupLoading(false);
    }
  };

  const handleSaveCredits = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('catti_cango_credits_config', JSON.stringify(creditsConfig));
      window.dispatchEvent(new Event('catti_cango_credits_updated'));
      setSavedCredits(true);
      setTimeout(() => setSavedCredits(false), 2500);
    } catch (e) {
      console.error('Failed to save credits:', e);
    }
  };

  const handleResetCredits = () => {
    setCreditsConfig(DEFAULT_CREDITS_CONFIG);
    try {
      localStorage.setItem('catti_cango_credits_config', JSON.stringify(DEFAULT_CREDITS_CONFIG));
      window.dispatchEvent(new Event('catti_cango_credits_updated'));
      setSavedCredits(true);
      setTimeout(() => setSavedCredits(false), 2500);
    } catch (e) {
      console.error('Failed to reset credits:', e);
    }
  };

  const moveItem = (index: number, direction: number) => {
    const order = creditsConfig.itemOrder || ["creator", "mascot", "studio", "lab"];
    const newOrder = [...order];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;
    setCreditsConfig({ ...creditsConfig, itemOrder: newOrder });
  };

  const handleCopy = async (textToCopy: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  const handleCopySingleBackupFile = async (content: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(content);
      }
      setCopiedBackup(true);
      setTimeout(() => setCopiedBackup(false), 2000);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  const handleDownload = (filename: string, code: string) => {
    try {
      const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download failed:', e);
    }
  };

  // ZIP Generation using JSZip
  const handleDownloadZip = async () => {
    if (!backupData) return;
    try {
      const zip = new JSZip();
      Object.entries(backupData.files).forEach(([filename, content]) => {
        zip.file(filename, content as string);
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chararchive_full_sourcecode_backup_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to create ZIP package:', err);
    }
  };

  // Combined text file generator
  const handleDownloadCombinedText = () => {
    if (!backupData) return;
    let text = `================================================================================
                    CHARARCHIVE - REPOSITORY FULL SOURCE EXPORT
================================================================================
Exported On: ${new Date().toLocaleString()}
Developer Studio: Armentero Studios
Creator: Alberto Armentero

--------------------------------------------------------------------------------
REPOSITORY DIRECTORY INDEX:
--------------------------------------------------------------------------------
${Object.keys(backupData.files).map((name, idx) => `[${idx + 1}] ${name}`).join('\n')}

--------------------------------------------------------------------------------
REPOSITORY SOURCE FILE BLOCKS:
--------------------------------------------------------------------------------
`;

    Object.entries(backupData.files).forEach(([filename, content]) => {
      text += `\n\n================================================================================\n`;
      text += `FILE: ${filename}\n`;
      text += `================================================================================\n\n`;
      text += content;
    });

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chararchive_full_sourcecode_export_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Styled printable PDF window
  const openBackupPrintablePDF = () => {
    if (!backupData) return;
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to open the printable PDF view.");
      return;
    }

    const fileIndexHtml = Object.keys(backupData.files).map(filename => {
      return '<li>' + filename + '</li>';
    }).join("");

    const fileContentsHtml = Object.entries(backupData.files).map(([filename, content]) => {
      const escapedContent = String(content)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      return '<div class="file-section">' +
        '<div class="file-header">' +
        '<span>FILE: ' + filename + '</span>' +
        '<span>Active Code</span>' +
        '</div>' +
        '<pre><code>' + escapedContent + '</code></pre>' +
        '</div>';
    }).join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>CharArchive - Entire Source Code Export</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            line-height: 1.5;
            padding: 40px;
            background: #fff;
          }
          h1 {
            font-size: 24px;
            font-weight: 800;
            margin-bottom: 5px;
            color: #0f172a;
          }
          .meta {
            font-size: 12px;
            color: #64748b;
            margin-bottom: 30px;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 15px;
          }
          .toc {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 40px;
          }
          .toc h2 {
            font-size: 16px;
            margin-top: 0;
            color: #334155;
          }
          .toc ul {
            font-family: monospace;
            font-size: 11px;
            columns: 2;
            padding-left: 20px;
          }
          .file-section {
            margin-bottom: 40px;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            overflow: hidden;
            page-break-inside: avoid;
          }
          .file-header {
            background: #f1f5f9;
            padding: 10px 15px;
            font-family: monospace;
            font-size: 12px;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            border-bottom: 1px solid #cbd5e1;
          }
          pre {
            margin: 0;
            padding: 15px;
            background: #f8fafc;
            overflow-x: auto;
          }
          code {
            font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
            font-size: 11px;
            white-space: pre-wrap;
            word-break: break-all;
          }
          @media print {
            body { padding: 20px; }
            .toc { page-break-after: always; }
          }
        </style>
      </head>
      <body>
        <h1>CHARARCHIVE - REPOSITORY EXPORT</h1>
        <div class="meta">
          Exported on: ${new Date().toLocaleString()}<br/>
          Full Full-Stack Application Source Backup<br/>
          Developer: Alberto Armentero / Armentero Studios
        </div>
        <div class="toc">
          <h2>REPOSITORY FILE DIRECTORY INDEX</h2>
          <ul>${fileIndexHtml}</ul>
        </div>
        ${fileContentsHtml}
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Diagnostic Scan Animation helper
  const runDiagnostics = () => {
    setIsDiagnosing(true);
    setDiagnosticsLogs([]);
    const logs = [
      "Initializing diagnostic sequence...",
      "Validating Local Storage schemas...",
      "Inspecting database key: catti_cango_credits_config... OK",
      "Inspecting database key: catti_cango_victory_count... Connected",
      "Analyzing active highscores ledger...",
      "Testing API ingress endpoints... /api/health returns 200",
      "Verifying system file trees...",
      "Total scanned files: " + (backupData ? Object.keys(backupData.files).length : "Pending"),
      "Diagnosis completed: All client structures optimal."
    ];

    logs.forEach((log, idx) => {
      setTimeout(() => {
        setDiagnosticsLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${log}`]);
        if (idx === logs.length - 1) {
          setIsDiagnosing(false);
          setDiagScore(100);
        }
      }, (idx + 1) * 350);
    });
  };

  const handleResetHighscores = () => {
    if (window.confirm("Reset arcade game leaderboards to default scores?")) {
      try {
        const defaults = [
          { initials: "ALB", score: 5000, date: "2026-08-01" },
          { initials: "AST", score: 3500, date: "2026-08-02" },
          { initials: "PLA", score: 2000, date: "2026-08-03" }
        ];
        localStorage.setItem('catti_cango_leaderboard', JSON.stringify(defaults));
        alert("Arcade Highscores successfully reset to defaults!");
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handlePurgeAllLocalStorage = () => {
    if (window.confirm("CRITICAL WARNING: This will purge ALL client-side databases, including categories, uploads, characters, images, and brand configs. Are you sure?")) {
      try {
        localStorage.clear();
        alert("All application states successfully cleared. Reloading page to hydrate defaults...");
        window.location.reload();
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (!isOpen) return null;

  // File lists for Backup Desk
  const fileKeys = backupData ? Object.keys(backupData.files) : [];
  const filteredFiles = fileKeys.filter(k => k.toLowerCase().includes(backupFileSearch.toLowerCase()));
  const activeFileContent = (backupData && selectedBackupFile) ? backupData.files[selectedBackupFile] : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
              <Terminal className="w-5.5 h-5.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">Developer & Credits Studio Control Center</h2>
                <span className="text-[10px] font-mono bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full font-bold">
                  v2.6 Enterprise
                </span>
              </div>
              <p className="text-xs text-zinc-400">Complete code management, diagnostic repair systems, branding, and dynamic backups.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors shrink-0"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-6 pt-3 pb-0 bg-zinc-900 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveTab('module')}
              className={`px-3 py-2 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-1.5 border-t border-x ${
                activeTab === 'module'
                  ? 'bg-zinc-950 text-orange-400 border-zinc-800 border-b-zinc-950 -mb-px'
                  : 'text-zinc-400 border-transparent hover:text-zinc-200'
              }`}
            >
              <FileCode className="w-4 h-4 text-orange-500/70" />
              <span>KillerClownAI.ts</span>
            </button>

            <button
              onClick={() => setActiveTab('loop')}
              className={`px-3 py-2 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-1.5 border-t border-x ${
                activeTab === 'loop'
                  ? 'bg-zinc-950 text-orange-400 border-zinc-800 border-b-zinc-950 -mb-px'
                  : 'text-zinc-400 border-transparent hover:text-zinc-200'
              }`}
            >
              <Layers className="w-4 h-4 text-orange-500/70" />
              <span>Loop Code</span>
            </button>

            <button
              onClick={() => setActiveTab('game')}
              className={`px-3 py-2 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-1.5 border-t border-x ${
                activeTab === 'game'
                  ? 'bg-zinc-950 text-emerald-400 border-zinc-800 border-b-zinc-950 -mb-px'
                  : 'text-zinc-400 border-transparent hover:text-zinc-200'
              }`}
            >
              <Play className="w-4 h-4 text-emerald-500/70" />
              <span>The Video Game & Repair</span>
            </button>

            <button
              onClick={() => setActiveTab('backup')}
              className={`px-3 py-2 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-1.5 border-t border-x ${
                activeTab === 'backup'
                  ? 'bg-zinc-950 text-sky-400 border-zinc-800 border-b-zinc-950 -mb-px'
                  : 'text-zinc-400 border-transparent hover:text-zinc-200'
              }`}
            >
              <Database className="w-4 h-4 text-sky-500/70" />
              <span>Source Backups Desk</span>
            </button>

            <button
              onClick={() => setActiveTab('credits')}
              className={`px-3 py-2 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-1.5 border-t border-x ${
                activeTab === 'credits'
                  ? 'bg-zinc-950 text-yellow-400 border-zinc-800 border-b-zinc-950 -mb-px'
                  : 'text-zinc-400 border-transparent hover:text-zinc-200'
              }`}
            >
              <BookOpen className="w-4 h-4 text-yellow-500/70" />
              <span>Official Credits</span>
            </button>

            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-2 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-1.5 border-t border-x ${
                activeTab === 'preview'
                  ? 'bg-zinc-950 text-orange-400 border-zinc-800 border-b-zinc-950 -mb-px'
                  : 'text-zinc-400 border-transparent hover:text-zinc-200'
              }`}
            >
              <Award className="w-4 h-4 text-orange-500/70" />
              <span>Preview Brand</span>
            </button>

            <button
              onClick={() => setActiveTab('prompt')}
              className={`px-3 py-2 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-1.5 border-t border-x ${
                activeTab === 'prompt'
                  ? 'bg-zinc-950 text-cyan-400 border-zinc-800 border-b-zinc-950 -mb-px'
                  : 'text-zinc-400 border-transparent hover:text-zinc-200'
              }`}
            >
              <FileText className="w-4 h-4 text-cyan-500/70" />
              <span>Creator AI Prompt</span>
            </button>
          </div>

          {/* Quick Universal Backup Actions inside header */}
          {backupData && (
            <div className="flex items-center gap-2 pb-2">
              <button
                onClick={handleDownloadZip}
                title="Download Entire Repository Codebase as standard ZIP Archive"
                className="px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-bold rounded flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ZIP Codebase</span>
              </button>
              <button
                onClick={openBackupPrintablePDF}
                title="Format entire workspace source code into printable PDF"
                className="px-2.5 py-1 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold rounded flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF Codebase</span>
              </button>
            </div>
          )}
        </div>

        {/* Viewport / Content */}
        <div className="flex-1 overflow-hidden bg-zinc-950 flex flex-col">
          
          {/* 1. KillerClownAI.ts Tab */}
          {activeTab === 'module' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 py-3.5 bg-zinc-900/60 border-b border-zinc-800 flex items-center justify-between shrink-0">
                <span className="text-xs text-zinc-300 font-mono font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                  Source Code: /src/components/clownAI.ts (Grid Line of Sight Chase)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy(CLOWN_AI_SOURCE_CODE)}
                    className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded border border-zinc-700 flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                  <button
                    onClick={() => handleDownload('KillerClownAI.ts', CLOWN_AI_SOURCE_CODE)}
                    className="px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-6 font-mono text-xs text-zinc-300 leading-relaxed bg-zinc-950 selection:bg-orange-500/30">
                <pre className="whitespace-pre-wrap break-all"><code>{CLOWN_AI_SOURCE_CODE}</code></pre>
              </div>
            </div>
          )}

          {/* 2. Game Loop Tab */}
          {activeTab === 'loop' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 py-3.5 bg-zinc-900/60 border-b border-zinc-800 flex items-center justify-between shrink-0">
                <span className="text-xs text-zinc-300 font-mono font-bold flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-orange-500" />
                  Integration Sample: RequestAnimationFrame Loop (Chase Mechanics)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy(GAME_LOOP_EXAMPLE)}
                    className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded border border-zinc-700 flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                  <button
                    onClick={() => handleDownload('GameLoopExample.ts', GAME_LOOP_EXAMPLE)}
                    className="px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-6 font-mono text-xs text-zinc-300 leading-relaxed bg-zinc-950 selection:bg-orange-500/30">
                <pre className="whitespace-pre-wrap break-all"><code>{GAME_LOOP_EXAMPLE}</code></pre>
              </div>
            </div>
          )}

          {/* 3. The Video Game Tab ("Cat's Can Go" & diagnostics/repair) */}
          {activeTab === 'game' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Game Profile Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Visual Card */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                        <Award className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-white text-sm">Cat's Can Go! Arcade</h3>
                    </div>
                    <p className="text-xs text-zinc-400">
                      An advanced Frogger-style game made by **Alberto Armentero / Playarms** branch. Supports 100 level loops, map directional rotations, and a dynamic chasing Clown AI.
                    </p>
                  </div>
                  
                  <div className="space-y-1.5 text-[11px] text-zinc-300 border-t border-zinc-800 pt-3">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Creator Branch:</span>
                      <span className="font-bold text-emerald-400">Playarms Toy & Gaming</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Language Stack:</span>
                      <span className="font-mono text-zinc-400">React TSX + Canvas</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Arcade Loop Cap:</span>
                      <span className="font-bold text-zinc-200">100 Levels Max</span>
                    </div>
                  </div>

                  {backupData?.files['src/components/MiniGame.tsx'] && (
                    <button
                      onClick={() => handleDownload('MiniGame.tsx', backupData.files['src/components/MiniGame.tsx'])}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/10"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export Game TSX File</span>
                    </button>
                  )}
                </div>

                {/* Rules & mechanics */}
                <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-bold text-white border-b border-zinc-800 pb-2">Core Gameplay Mechanics</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5">
                      <span className="font-bold text-orange-400">1. Level Progression & Map Rotation</span>
                      <p className="text-zinc-400 text-[11px] leading-relaxed">
                        Every 25 levels, the entire canvas rotates: Phase 1 starts upward; Phase 2 flips downward; Phase 3 moves horizontal right; and Phase 4 flows left, forcing player re-orientations.
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <span className="font-bold text-sky-400">2. Killer Clown AI & Cooldowns</span>
                      <p className="text-zinc-400 text-[11px] leading-relaxed">
                        Clown moves grid-by-grid to target player, using Line of Sight. Traffic awareness keeps him from crossing lanes in danger, and middle walkways let him resting.
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <span className="font-bold text-yellow-400">3. 5-Item Golden Cat Mode</span>
                      <p className="text-zinc-400 text-[11px] leading-relaxed">
                        Collecting apples, cherries, tuna, or clocks fills up the item meter. When full, the cat turns into a **Golden Cat**, becoming fully immune to traffic collisions!
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <span className="font-bold text-pink-400">4. Highscores & Tuna Upgrades</span>
                      <p className="text-zinc-400 text-[11px] leading-relaxed">
                        Grabbing rare Tuna Fish adds direct score bonus points and awards an extra life (1-UP), keeping highscore pursuits exciting.
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Diagnostic and Repair Panel */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-5">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4.5 h-4.5 text-emerald-400" />
                    <div>
                      <h3 className="font-bold text-sm text-white">Arcade Database & Systems Diagnostics</h3>
                      <p className="text-[11px] text-zinc-400">Perform integrity checks, wipe local caches, and repair broken game state keys.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {diagScore !== null && (
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                        Integrity Score: {diagScore}%
                      </span>
                    )}
                    <button
                      onClick={runDiagnostics}
                      disabled={isDiagnosing}
                      className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-45 text-zinc-200 text-xs font-bold rounded-lg border border-zinc-700 flex items-center gap-1.5"
                    >
                      <Activity className={`w-3.5 h-3.5 text-emerald-400 ${isDiagnosing ? 'animate-spin' : ''}`} />
                      <span>{isDiagnosing ? 'Running Scan...' : 'Run Systems Diagnostics'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  
                  {/* Actions column */}
                  <div className="space-y-3">
                    <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 flex flex-col justify-between h-full space-y-4">
                      <div>
                        <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-wider block mb-1">Leaderboards Reset</span>
                        <p className="text-[11px] text-zinc-400">Restores highscore tables and default initials to arcade high-scoring setups.</p>
                      </div>
                      <button
                        onClick={handleResetHighscores}
                        className="w-full py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Highscores</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 flex flex-col justify-between h-full space-y-4">
                      <div>
                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block mb-1">Clean Slate Cache Wipe</span>
                        <p className="text-[11px] text-zinc-400">Purges local storage arrays to fix missing data states, freezing issues, or broken structures.</p>
                      </div>
                      <button
                        onClick={handlePurgeAllLocalStorage}
                        className="w-full py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Wipe Local Storage</span>
                      </button>
                    </div>
                  </div>

                  {/* Terminal output */}
                  <div className="bg-zinc-950 rounded-xl border border-zinc-800 p-3 h-[130px] flex flex-col">
                    <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Diagnostic Console Out</span>
                    <div className="flex-1 overflow-y-auto font-mono text-[10px] text-zinc-400 space-y-1.5 custom-scrollbar pr-1">
                      {diagnosticsLogs.length > 0 ? (
                        diagnosticsLogs.map((log, idx) => (
                          <div key={idx} className="leading-tight break-all">
                            <span className="text-emerald-500 select-none mr-1">▶</span>
                            <span>{log}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-zinc-600 italic">No diagnostics run yet. Click 'Run Systems Diagnostics' above to perform a integrity check.</span>
                      )}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* 4. Complete Source Backup Desk Tab */}
          {activeTab === 'backup' && (
            <div className="flex-1 flex overflow-hidden">
              {backupLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-2">
                  <div className="w-8 h-8 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
                  <span className="text-xs text-zinc-400 font-mono">Scanning workspace repository source files...</span>
                </div>
              ) : (
                <div className="flex-1 flex overflow-hidden">
                  
                  {/* Left Side: Directory Tree / File List */}
                  <div className="w-72 border-r border-zinc-800 bg-zinc-900/45 flex flex-col shrink-0 overflow-hidden">
                    
                    {/* Search Bar */}
                    <div className="p-3 border-b border-zinc-800 space-y-2">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search files..."
                          value={backupFileSearch}
                          onChange={(e) => setBackupFileSearch(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 outline-none focus:border-sky-500/50"
                        />
                        <Search className="absolute left-2.5 top-2.2 w-3.5 h-3.5 text-zinc-500" />
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono block">
                        Files matched: {filteredFiles.length} of {fileKeys.length}
                      </span>
                    </div>

                    {/* Scrollable File List */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                      {filteredFiles.map(fileKey => {
                        const isSelected = selectedBackupFile === fileKey;
                        return (
                          <button
                            key={fileKey}
                            onClick={() => setSelectedBackupFile(fileKey)}
                            className={`w-full text-left p-2 rounded-lg text-xs font-mono transition-colors flex items-center gap-2 ${
                              isSelected 
                                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' 
                                : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 border border-transparent'
                            }`}
                          >
                            <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-sky-400' : 'text-zinc-500'}`} />
                            <span className="truncate">{fileKey}</span>
                          </button>
                        );
                      })}
                      {filteredFiles.length === 0 && (
                        <div className="text-center py-8 text-[11px] text-zinc-600 font-mono">
                          No matching files found.
                        </div>
                      )}
                    </div>

                    {/* Desk Summary Stats */}
                    <div className="p-3 bg-zinc-950/40 border-t border-zinc-800 text-[10px] text-zinc-500 font-mono space-y-1.5">
                      <div className="flex justify-between">
                        <span>Workspace Mode:</span>
                        <span className="font-bold text-emerald-400">Full-Stack Active</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Traversed files:</span>
                        <span>{fileKeys.length} items</span>
                      </div>
                    </div>

                  </div>

                  {/* Right Side: Code Previewer */}
                  <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
                    
                    {/* Toolbar */}
                    <div className="px-5 py-3 border-b border-zinc-800 bg-zinc-900/30 flex justify-between items-center shrink-0">
                      <div className="space-y-0.5">
                        <span className="text-xs font-mono font-bold text-sky-400 truncate block max-w-sm">
                          {selectedBackupFile || "Select a file"}
                        </span>
                        <span className="text-[10px] text-zinc-500 block">
                          Size: {activeFileContent ? (activeFileContent.length / 1024).toFixed(2) + " KB" : "0.00 KB"}
                        </span>
                      </div>

                      {activeFileContent && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCopySingleBackupFile(activeFileContent)}
                            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded border border-zinc-700 flex items-center gap-1"
                          >
                            {copiedBackup ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedBackup ? 'Copied File!' : 'Copy Content'}</span>
                          </button>
                          <button
                            onClick={() => {
                              const parts = selectedBackupFile.split('/');
                              const filename = parts[parts.length - 1];
                              handleDownload(filename, activeFileContent);
                            }}
                            className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded flex items-center gap-1"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download File</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Preview Box */}
                    <div className="flex-1 overflow-auto p-5 font-mono text-xs text-zinc-300 leading-relaxed bg-zinc-950 selection:bg-sky-500/20 custom-scrollbar">
                      {activeFileContent ? (
                        <pre className="whitespace-pre-wrap break-all"><code>{activeFileContent}</code></pre>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-1.5 font-sans">
                          <FileCode className="w-10 h-10 text-zinc-800" />
                          <span className="text-xs">No active file loaded. Pick a file from the directory sidebar.</span>
                        </div>
                      )}
                    </div>

                    {/* Export Action Deck footer */}
                    <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-900/30 flex justify-between items-center shrink-0 text-xs">
                      <span className="text-zinc-500 font-mono text-[10px]">EXPORT COMPILATION DECKS:</span>
                      
                      <div className="flex gap-2.5">
                        <button
                          onClick={handleDownloadCombinedText}
                          className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-lg border border-zinc-700 flex items-center gap-1.5"
                        >
                          <FileText className="w-4 h-4 text-orange-500" />
                          <span>Export Combined .txt</span>
                        </button>
                        <button
                          onClick={openBackupPrintablePDF}
                          className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg flex items-center gap-1.5 shadow-lg shadow-orange-600/10"
                        >
                          <FileDown className="w-4 h-4" />
                          <span>Save Complete PDF</span>
                        </button>
                        <button
                          onClick={handleDownloadZip}
                          className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg flex items-center gap-1.5 shadow-lg shadow-sky-600/10"
                        >
                          <Download className="w-4 h-4" />
                          <span>Export ZIP Archive</span>
                        </button>
                      </div>
                    </div>

                  </div>

                </div>
              )}
            </div>
          )}

          {/* 5. Brand Credits Configuration Form Tab */}
          {activeTab === 'credits' && (
            <form onSubmit={handleSaveCredits} className="flex-1 bg-zinc-950 p-6 overflow-y-auto space-y-4 text-xs text-zinc-300">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800 shrink-0">
                <div>
                  <h3 className="font-bold text-sm text-yellow-400">Armentero Studios Official Credits & Image Editor</h3>
                  <p className="text-zinc-400 text-xs">Update studio names, creator profiles, mascot titles, and image asset URLs live.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetCredits}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg flex items-center gap-1 text-xs font-medium transition-colors border border-zinc-700"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Defaults</span>
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg font-bold flex items-center gap-1.5 shadow-lg shadow-yellow-500/20 transition-all"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savedCredits ? 'SAVED SUCCESSFULLY! ✓' : 'SAVE CHANGES'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-zinc-400 font-medium">Studio / Brand Name:</label>
                  <input
                    type="text"
                    value={creditsConfig.studioName}
                    onChange={(e) => setCreditsConfig({ ...creditsConfig, studioName: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-white font-bold focus:outline-none focus:border-yellow-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-zinc-400 font-medium">Owner & Creator Name:</label>
                  <input
                    type="text"
                    value={creditsConfig.creatorName}
                    onChange={(e) => setCreditsConfig({ ...creditsConfig, creatorName: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-white font-bold focus:outline-none focus:border-yellow-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-zinc-400 font-medium">Superhero Mascot Name:</label>
                  <input
                    type="text"
                    value={creditsConfig.mascotName}
                    onChange={(e) => setCreditsConfig({ ...creditsConfig, mascotName: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-white font-bold focus:outline-none focus:border-yellow-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-zinc-400 font-medium">Alberto Armentero Photo Image URL:</label>
                  <input
                    type="url"
                    value={creditsConfig.meImgUrl}
                    onChange={(e) => setCreditsConfig({ ...creditsConfig, meImgUrl: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-white font-mono text-[11px] focus:outline-none focus:border-yellow-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-zinc-400 font-medium">Super Armentero Avatar Image URL:</label>
                  <input
                    type="url"
                    value={creditsConfig.superImgUrl}
                    onChange={(e) => setCreditsConfig({ ...creditsConfig, superImgUrl: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-white font-mono text-[11px] focus:outline-none focus:border-yellow-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-zinc-400 font-medium">Armentero Studios Logo URL:</label>
                  <input
                    type="url"
                    value={creditsConfig.logoImgUrl}
                    onChange={(e) => setCreditsConfig({ ...creditsConfig, logoImgUrl: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-white font-mono text-[11px] focus:outline-none focus:border-yellow-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-zinc-400 font-medium">Armstech Laboratories Logo URL:</label>
                  <input
                    type="url"
                    value={creditsConfig.labImgUrl}
                    onChange={(e) => setCreditsConfig({ ...creditsConfig, labImgUrl: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-white font-mono text-[11px] focus:outline-none focus:border-yellow-500"
                    required
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-zinc-400 font-medium">Studio Root Description:</label>
                  <textarea
                    value={creditsConfig.studioDescription}
                    onChange={(e) => setCreditsConfig({ ...creditsConfig, studioDescription: e.target.value })}
                    rows={2}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-white font-sans text-xs focus:outline-none focus:border-yellow-500 resize-none"
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2 pt-2 border-t border-zinc-800">
                  <label className="block text-yellow-400 font-bold">Rearrange Credit Cards & Logos Order:</label>
                  <p className="text-zinc-400 text-[11px]">Use the Move buttons to arrange the credit items in your desired order (e.g., placing Super Armentero where Armentero Studio is).</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {(creditsConfig.itemOrder || ["creator", "mascot", "studio", "lab"]).map((itemId, idx) => {
                      const titles: Record<string, string> = {
                        creator: 'Creator (Alberto)',
                        mascot: 'Mascot (Super Armentero)',
                        studio: 'Studio Logo',
                        lab: 'Lab Logo'
                      };
                      return (
                        <div key={itemId} className="bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 flex flex-col justify-between items-center text-center space-y-2">
                          <span className="text-[11px] font-bold text-yellow-400">{idx + 1}. {titles[itemId]}</span>
                          <div className="flex gap-1.5 w-full justify-center">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => moveItem(idx, -1)}
                              className="px-2 py-1 bg-zinc-850 hover:bg-zinc-750 disabled:opacity-30 rounded text-[10px] text-white font-medium border border-zinc-800"
                            >
                              ◀ Move
                            </button>
                            <button
                              type="button"
                              disabled={idx === (creditsConfig.itemOrder || []).length - 1}
                              onClick={() => moveItem(idx, 1)}
                              className="px-2 py-1 bg-zinc-850 hover:bg-zinc-750 disabled:opacity-30 rounded text-[10px] text-white font-medium border border-zinc-800"
                            >
                              Move ▶
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg font-bold text-xs shadow-lg shadow-yellow-500/20 transition-all flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{savedCredits ? 'SAVED & UPDATED! ✓' : 'SAVE & APPLY CREDITS'}</span>
                </button>
              </div>
            </form>
          )}

          {/* 6. Brand Preview Tab */}
          {activeTab === 'preview' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-orange-500" />
                    <h3 className="font-bold text-sm text-white">Official Credits & Branding</h3>
                  </div>
                  <span className="text-[10px] bg-orange-500/10 text-orange-500 font-extrabold px-2 py-0.5 rounded-full border border-orange-500/20">
                    {creditsConfig.studioName.toUpperCase()}
                  </span>
                </div>
                
                <div className="space-y-4 text-xs">
                  
                  {/* Creator Avatars & Armament Logo Cards Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(creditsConfig.itemOrder || ["creator", "mascot", "studio", "lab"]).map((itemId) => {
                      if (itemId === 'creator') {
                        return (
                          <div key="creator" className="bg-zinc-850/40 border border-zinc-800 rounded-xl p-3 flex flex-col items-center text-center space-y-1.5 hover:border-orange-500/40 transition-colors">
                            <img
                              src={creditsConfig.meImgUrl}
                              alt={creditsConfig.creatorName}
                              className="w-14 h-14 rounded-full object-cover border-2 border-orange-500/40 shadow-sm"
                              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                            <div>
                              <span className="font-bold text-white text-[11px] block line-clamp-1">{creditsConfig.creatorName}</span>
                              <span className="text-[9px] text-orange-500 uppercase font-semibold block">Owner & Creator</span>
                            </div>
                          </div>
                        );
                      }
                      if (itemId === 'mascot') {
                        return (
                          <div key="mascot" className="bg-zinc-850/40 border border-zinc-800 rounded-xl p-3 flex flex-col items-center text-center space-y-1.5 hover:border-emerald-500/40 transition-colors">
                            <img
                              src={creditsConfig.superImgUrl}
                              alt={creditsConfig.mascotName}
                              className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500/40 shadow-sm"
                              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                            <div>
                              <span className="font-bold text-white text-[11px] block line-clamp-1">{creditsConfig.mascotName}</span>
                              <span className="text-[9px] text-emerald-500 uppercase font-semibold block">Superhero Mascot</span>
                            </div>
                          </div>
                        );
                      }
                      if (itemId === 'studio') {
                        return (
                          <div key="studio" className="bg-zinc-850/40 border border-zinc-800 rounded-xl p-3 flex flex-col items-center text-center space-y-1.5 hover:border-amber-500/40 transition-colors">
                            <img
                              src={creditsConfig.logoImgUrl}
                              alt={`${creditsConfig.studioName} Brand Logo`}
                              className="w-14 h-14 rounded-lg object-contain border border-zinc-800 p-0.5 bg-black/20"
                              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                            <div>
                              <span className="font-bold text-white text-[11px] block line-clamp-1">{creditsConfig.studioName}</span>
                              <span className="text-[9px] text-amber-500 uppercase font-semibold block">Main Studio Tree</span>
                            </div>
                          </div>
                        );
                      }
                      if (itemId === 'lab') {
                        return (
                          <div key="lab" className="bg-zinc-850/40 border border-zinc-800 rounded-xl p-3 flex flex-col items-center text-center space-y-1.5 hover:border-blue-500/40 transition-colors">
                            <img
                              src={creditsConfig.labImgUrl}
                              alt="Armstech Laboratories Logo"
                              className="w-14 h-14 rounded-lg object-cover border border-zinc-800"
                              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                            <div>
                              <span className="font-bold text-white text-[11px] block line-clamp-1">Armstech Labs</span>
                              <span className="text-[9px] text-blue-500 uppercase font-semibold block">Tech & Innovations</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>

                  {/* Tree Branches Meta */}
                  <div className="relative pl-3.5 border-l-2 border-orange-500/40 space-y-3 pt-1">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-orange-500 block">{creditsConfig.studioName} & Armament</span>
                      <p className="text-zinc-400 text-[11px] leading-relaxed">
                        {creditsConfig.studioDescription}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-blue-500 block">Armstech Laboratories</span>
                      <p className="text-zinc-400 text-[11px] leading-relaxed">
                        The Science & Technology branch. Evolving future innovations, software tooling, custom hardware systems, and advanced utilities.
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-500 block">Playarms</span>
                      <p className="text-zinc-400 text-[11px] leading-relaxed">
                        The Toys & Gaming branch. Crafted to bring joy and entertainment through board games, physical card decks, creative toys, and interactive video game development.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                    <span>All Rights Reserved © 2026 {creditsConfig.studioName}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 7. Creator AI Prompt Tab */}
          {activeTab === 'prompt' && (() => {
            const generatedPrompt = `Build a complete production-ready React & Tailwind single-page application and full interactive applet featuring:

1. OFFICIAL CREATOR & STUDIO CREDITS:
   - Creator Name: ${creditsConfig.creatorName}
   - Studio Name: ${creditsConfig.studioName}
   - Superhero Mascot: ${creditsConfig.mascotName}
   - Creator Avatar GitHub Image: ${creditsConfig.meImgUrl}
   - Superhero Mascot GitHub Image: ${creditsConfig.superImgUrl}
   - Studio Logo GitHub Image: ${creditsConfig.logoImgUrl}
   - Armstech Laboratories GitHub Image: ${creditsConfig.labImgUrl}
   - Studio Description: ${creditsConfig.studioDescription}

2. SECURE PASSWORD KEYPAD LOCK SCREEN:
   - Interactive PIN keypad for developer/admin access.
   - Fully customizable password, locking mechanism, and success audio/visual feedback.

3. ADVANCED CHARACTER/ITEM EDITOR & LAYOUT ENGINE:
   - Window View Sizing modes: 'sm', 'md', 'lg', 'xl', and Full Screen ('fl').
   - Banner & Icon visibility toggles, height sliders, and icon sizing controls.
   - Layout Presets (Classic, Sidebar, Minimal, Dashboard, Ultrawide).
   - Subpage Hierarchy tree with page duplication and clipboard copy/paste support.
   - Comprehensive Backup Source Desk & Zip/Text Export utilities.

Please ensure all UI components, Lucide icons, responsive layouts, and local storage persistence are fully operational and match this exact creator and studio configuration.`;

            return (
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-cyan-400" />
                      <div>
                        <h3 className="font-bold text-sm text-white">Creator AI Master Prompt & Blueprint</h3>
                        <p className="text-xs text-zinc-400">Copy this exact generated prompt to feed into another AI generator to reproduce this application, brand, keypad, and editor suite.</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleCopy(generatedPrompt)}
                      className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? 'Copied to Clipboard!' : 'Copy Master Prompt'}</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Live Generated Prompt Preview:</label>
                    <textarea
                      readOnly
                      rows={18}
                      value={generatedPrompt}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs font-mono text-cyan-300 leading-relaxed outline-none resize-none shadow-inner"
                    />
                  </div>

                  <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4 text-xs text-cyan-200/90 leading-relaxed flex items-start gap-3">
                    <Terminal className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block font-bold mb-1">How to use this prompt:</strong>
                      <span>Paste this prompt directly into any AI assistant or code generator. It includes your exact GitHub image asset links, creator name, studio branding, password keypad specs, and layout editor architecture so you get an identical, polished build instantly without re-explaining!</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

        </div>

        {/* Footer info */}
        <div className="px-6 py-3.5 bg-zinc-950 flex items-center justify-between text-xs text-zinc-400 shrink-0 border-t border-zinc-800">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-orange-400 animate-pulse" />
            <span>Interactive Developer & Credits Control Center</span>
          </div>
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
            {creditsConfig.studioName} © 2026
          </span>
        </div>

      </div>
    </div>
  );
};
