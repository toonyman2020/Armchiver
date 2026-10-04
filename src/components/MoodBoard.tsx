import React, { useRef, useState, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { 
  Pencil, MousePointer2, Trash2, Image as ImageIcon, 
  Video, FileText, Music, Layers, Download, Mic, Volume2, 
  Settings, PenTool, Link2, Share2, Play, Pause, Maximize2, Minimize2,
  Plus, Minus, RotateCcw, Eraser, Move, Wand2, Sparkles, Check, 
  ChevronRight, Scissors, Info, HelpCircle, RefreshCw, Palette, Eye, EyeOff
} from 'lucide-react';

type NodeType = 'image' | 'video' | 'audio' | 'text' | 'canvas' | 'character' | 'notebook' | 'prop';

interface Joint {
  id: string;
  name: string;
  x: number; // local offset coordinate
  y: number; // local offset coordinate
}

interface BoardNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  src?: string;
  name?: string;
  color?: string;
  isCustomUploaded?: boolean;
  joints?: Joint[];
  videoPlaying?: boolean;
  propType?: 'rock' | 'tree' | 'pillar' | 'ground' | 'castle';
  puppetType?: 'stick' | 'forest' | 'robot';
}

interface Connection {
  id: string;
  fromId: string;
  toId: string;
  label?: string;
  color: string;
}

const PREMADE_PUPPETS = [
  {
    id: 'puppet-stick',
    name: 'Interactive Stick Figure',
    type: 'character' as NodeType,
    puppetType: 'stick' as const,
    joints: [
      { id: 'head', name: 'Head', x: 100, y: 35 },
      { id: 'chest', name: 'Chest Joint', x: 100, y: 80 },
      { id: 'lHand', name: 'Left Hand', x: 40, y: 100 },
      { id: 'rHand', name: 'Right Hand', x: 160, y: 100 },
      { id: 'lFoot', name: 'Left Foot', x: 60, y: 180 },
      { id: 'rFoot', name: 'Right Foot', x: 140, y: 180 },
    ]
  },
  {
    id: 'puppet-forest',
    name: 'Ancient Tree Sprite',
    type: 'character' as NodeType,
    puppetType: 'forest' as const,
    joints: [
      { id: 'head', name: 'Canopy Crown', x: 100, y: 30 },
      { id: 'chest', name: 'Trunk Heart', x: 100, y: 90 },
      { id: 'lHand', name: 'Left Branch', x: 30, y: 70 },
      { id: 'rHand', name: 'Right Branch', x: 170, y: 70 },
      { id: 'lFoot', name: 'Left Root', x: 50, y: 190 },
      { id: 'rFoot', name: 'Right Root', x: 150, y: 190 },
    ]
  },
  {
    id: 'puppet-robot',
    name: 'Mechanized Sentry',
    type: 'character' as NodeType,
    puppetType: 'robot' as const,
    joints: [
      { id: 'head', name: 'Optic Pod', x: 100, y: 25 },
      { id: 'chest', name: 'Core Engine', x: 100, y: 85 },
      { id: 'lHand', name: 'Laser Blaster', x: 25, y: 110 },
      { id: 'rHand', name: 'Shield Pod', x: 175, y: 110 },
      { id: 'lFoot', name: 'Left Thruster', x: 60, y: 180 },
      { id: 'rFoot', name: 'Right Thruster', x: 140, y: 180 },
    ]
  }
];

const PREMADE_PROPS = [
  { id: 'prop-tree', name: 'Evergreen Pine', type: 'prop' as NodeType, propType: 'tree' as const },
  { id: 'prop-rock', name: 'Mossy Boulder', type: 'prop' as NodeType, propType: 'rock' as const },
  { id: 'prop-pillar', name: 'Ruin Column', type: 'prop' as NodeType, propType: 'pillar' as const },
  { id: 'prop-castle', name: 'Tower Battlement', type: 'prop' as NodeType, propType: 'castle' as const },
  { id: 'prop-ground', name: 'Meadow Hill', type: 'prop' as NodeType, propType: 'ground' as const }
];

const BACKGROUND_THEMES = [
  { id: 'noir', name: 'Obsidian Noir', class: 'bg-[#09090b]', grid: '#1e1b4b', style: { backgroundImage: 'radial-gradient(circle, #27272a 1px, transparent 1px)', backgroundSize: '24px 24px' } },
  { id: 'neon', name: 'Cyber Neon Grid', class: 'bg-[#03001e]', grid: '#f43f5e', style: { backgroundImage: 'linear-gradient(to right, #11001c 1px, transparent 1px), linear-gradient(to bottom, #11001c 1px, transparent 1px)', backgroundSize: '30px 30px' } },
  { id: 'forest', name: 'Deep Moss', class: 'bg-[#022c22]', grid: '#059669', style: { backgroundImage: 'radial-gradient(circle, #064e3b 1.5px, transparent 1.5px)', backgroundSize: '20px 20px' } },
  { id: 'sunset', name: 'Twilight Haze', class: 'bg-gradient-to-tr from-[#111827] via-[#31103f] to-[#1e1b4b]', grid: '#ec4899', style: { backgroundImage: 'radial-gradient(circle, #374151 1px, transparent 1px)', backgroundSize: '28px 28px' } },
  { id: 'blueprint', name: 'Draft Blueprint', class: 'bg-[#0b132b]', grid: '#3a506b', style: { backgroundImage: 'linear-gradient(to right, rgba(28, 37, 65, 0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(28, 37, 65, 0.5) 1px, transparent 1px)', backgroundSize: '20px 20px' } }
];

export function MoodBoard() {
  const [nodes, setNodes] = useState<BoardNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [activeTool, setActiveTool] = useState<'select' | 'pencil' | 'eraser' | 'hand' | 'link' | 'puppeteer'>('select');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [linkStartNodeId, setLinkStartNodeId] = useState<string | null>(null);

  // Drawing settings
  const [color, setColor] = useState('#a855f7'); // default neon purple
  const [brushSize, setBrushSize] = useState<number>(4);
  const [isDrawing, setIsDrawing] = useState(false);

  // Infinite Canvas / Zoom & Pan
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Fullscreen container mode
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Background style state
  const [activeTheme, setActiveTheme] = useState(BACKGROUND_THEMES[0]);

  // Puppeteering live preview pose helper
  const [activeJointDrag, setActiveJointDrag] = useState<{ nodeId: string; jointId: string } | null>(null);

  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const workspaceContainerRef = useRef<HTMLDivElement>(null);

  // Seed default setup
  useEffect(() => {
    resetToDefault();
  }, []);

  const resetToDefault = () => {
    setNodes([
      {
        id: 'default-notebook',
        type: 'notebook',
        x: 100,
        y: 120,
        width: 320,
        height: 250,
        content: '🌌 STORYBOARD / PLAN\n\nScene 1: Our hero approaches the Ancient Moss Ruins.\n\nUse the Link Tool to connect nodes, and try Puppeteer mode to pose characters!'
      },
      {
        id: 'default-puppet',
        type: 'character',
        x: 520,
        y: 80,
        width: 200,
        height: 250,
        name: PREMADE_PUPPETS[0].name,
        puppetType: 'stick',
        joints: PREMADE_PUPPETS[0].joints
      },
      {
        id: 'default-tree',
        type: 'prop',
        x: 780,
        y: 150,
        width: 140,
        height: 180,
        propType: 'tree',
        name: 'Evergreen Pine'
      }
    ]);
    setConnections([
      { id: 'conn-init', fromId: 'default-notebook', toId: 'default-puppet', label: 'Starts Journey', color: '#a855f7' }
    ]);
    setSelectedNodeId(null);
    setLinkStartNodeId(null);
  };

  const clearCanvas = () => {
    setNodes([]);
    setConnections([]);
    setSelectedNodeId(null);
    setLinkStartNodeId(null);
    
    // Clear back drawing canvas
    const canvas = mainCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#09090b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  // Adjust canvas resolution with high-DPI scaling
  useEffect(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = 4000;
    canvas.height = 4000;
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, 4000, 4000);
  }, []);

  const addNode = (type: NodeType, extra: Partial<BoardNode> = {}) => {
    const defaultDims = {
      image: { w: 250, h: 200 },
      video: { w: 320, h: 200 },
      audio: { w: 260, h: 120 },
      canvas: { w: 300, h: 200 },
      character: { w: 200, h: 250 },
      notebook: { w: 320, h: 250 },
      prop: { w: 140, h: 160 }
    }[type] || { w: 200, h: 200 };

    const centerX = (300 - pan.x) / zoom;
    const centerY = (200 - pan.y) / zoom;

    const newNode: BoardNode = {
      id: Math.random().toString(36).substring(2, 11),
      type,
      x: Math.max(40, centerX + (Math.random() * 80 - 40)),
      y: Math.max(40, centerY + (Math.random() * 80 - 40)),
      width: defaultDims.w,
      height: defaultDims.h,
      src: extra.src,
      name: extra.name || `New ${type.toUpperCase()}`,
      content: extra.content || '',
      color: extra.color || '#a855f7',
      joints: extra.joints,
      propType: extra.propType,
      puppetType: extra.puppetType
    };

    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
  };

  const removeNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setConnections(prev => prev.filter(c => c.fromId !== id && c.toId !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
  };

  // Canvas drawing coords calculated with zoom/pan
  const getPointerPos = (e: React.PointerEvent<any>) => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const handlePointerDown = (e: React.PointerEvent<any>) => {
    if (activeTool === 'hand') {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    if (activeTool !== 'pencil' && activeTool !== 'eraser') return;

    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getPointerPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  };

  const handlePointerMove = (e: React.PointerEvent<any>) => {
    if (isPanning && activeTool === 'hand') {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y
      });
      return;
    }

    if (!isDrawing || (activeTool !== 'pencil' && activeTool !== 'eraser')) return;

    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getPointerPos(e);
    ctx.strokeStyle = activeTool === 'eraser' ? '#09090b' : color;
    ctx.lineWidth = brushSize * 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
    setIsPanning(false);
    setActiveJointDrag(null);
  };

  // Node Clicking & Connection link logic
  const handleNodeClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNodeId(id);

    if (activeTool === 'link') {
      if (!linkStartNodeId) {
        setLinkStartNodeId(id);
      } else {
        if (linkStartNodeId !== id) {
          const fromNode = nodes.find(n => n.id === linkStartNodeId);
          const toNode = nodes.find(n => n.id === id);
          const fromName = fromNode ? fromNode.name || fromNode.type : 'Source';
          const toName = toNode ? toNode.name || toNode.type : 'Target';

          const label = prompt("Enter link description / label:", `Connects ${fromName} to ${toName}`);
          
          const newConn: Connection = {
            id: `conn-${Date.now()}`,
            fromId: linkStartNodeId,
            toId: id,
            label: label || 'Sequence Link',
            color: color
          };
          setConnections(prev => [...prev, newConn]);
        }
        setLinkStartNodeId(null);
        setActiveTool('select');
      }
    }
  };

  // Dragging character puppet limbs/joints in puppeteer mode
  const handleJointDrag = (nodeId: string, jointId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveJointDrag({ nodeId, jointId });
  };

  const handleWorkspaceMouseMove = (e: React.MouseEvent) => {
    if (!activeJointDrag) return;
    const { nodeId, jointId } = activeJointDrag;
    const targetNode = nodes.find(n => n.id === nodeId);
    if (!targetNode) return;

    const rect = document.getElementById(`node-wrap-${nodeId}`)?.getBoundingClientRect();
    if (!rect) return;

    // Calculate relative percentage position inside the puppet frame boundary
    const relativeX = ((e.clientX - rect.left) / rect.width) * 200; // standard width relative ref scale
    const relativeY = ((e.clientY - rect.top) / rect.height) * 250; // standard height relative ref scale

    setNodes(prev => prev.map(n => {
      if (n.id === nodeId && n.joints) {
        return {
          ...n,
          joints: n.joints.map(j => j.id === jointId ? { ...j, x: Math.min(190, Math.max(10, relativeX)), y: Math.min(240, Math.max(10, relativeY)) } : j)
        };
      }
      return n;
    }));
  };

  // Zoom helpers
  const zoomIn = () => setZoom(z => Math.min(2, z + 0.1));
  const zoomOut = () => setZoom(z => Math.max(0.4, z - 0.1));
  const resetZoom = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  // Render highly-polished modular SVG puppets
  const renderInteractivePuppet = (node: BoardNode) => {
    const js = node.joints || [];
    const getJ = (id: string) => js.find(j => j.id === id) || { x: 100, y: 100 };

    const head = getJ('head');
    const chest = getJ('chest');
    const lHand = getJ('lHand');
    const rHand = getJ('rHand');
    const lFoot = getJ('lFoot');
    const rFoot = getJ('rFoot');

    const isPuppeteer = activeTool === 'puppeteer';

    if (node.puppetType === 'stick') {
      return (
        <svg className="w-full h-full bg-[#18181b]/50 rounded-xl" viewBox="0 0 200 250">
          <defs>
            <radialGradient id="glowHead" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#c084fc" stopOpacity="1" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* Sticks / Limbs */}
          <line x1={head.x} y1={head.y} x2={chest.x} y2={chest.y} stroke="#c084fc" strokeWidth="4" strokeLinecap="round" />
          <line x1={chest.x} y1={chest.y} x2={lHand.x} y2={lHand.y} stroke="#60a5fa" strokeWidth="3.5" strokeLinecap="round" />
          <line x1={chest.x} y1={chest.y} x2={rHand.x} y2={rHand.y} stroke="#60a5fa" strokeWidth="3.5" strokeLinecap="round" />
          <line x1={chest.x} y1={chest.y} x2={lFoot.x} y2={lFoot.y} stroke="#34d399" strokeWidth="4" strokeLinecap="round" />
          <line x1={chest.x} y1={chest.y} x2={rFoot.x} y2={rFoot.y} stroke="#34d399" strokeWidth="4" strokeLinecap="round" />

          {/* Head Sphere */}
          <circle cx={head.x} cy={head.y} r="18" fill="url(#glowHead)" />
          <circle cx={head.x} cy={head.y} r="10" fill="#a855f7" stroke="#e9d5ff" strokeWidth="1.5" />

          {/* Joint Pin Controls */}
          {isPuppeteer && js.map(j => (
            <circle 
              key={j.id} 
              cx={j.x} 
              cy={j.y} 
              r="7" 
              fill="#f43f5e" 
              stroke="#ffffff" 
              strokeWidth="2" 
              className="cursor-pointer hover:scale-125 transition-transform" 
              onMouseDown={(e) => handleJointDrag(node.id, j.id, e)}
            />
          ))}
        </svg>
      );
    }

    if (node.puppetType === 'forest') {
      return (
        <svg className="w-full h-full bg-[#064e3b]/30 rounded-xl" viewBox="0 0 200 250">
          <defs>
            <linearGradient id="trunkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#78350f" />
              <stop offset="100%" stopColor="#451a03" />
            </linearGradient>
          </defs>
          {/* Branch Arms */}
          <line x1={chest.x} y1={chest.y} x2={lHand.x} y2={lHand.y} stroke="#854d0e" strokeWidth="6" strokeLinecap="round" />
          <line x1={chest.x} y1={chest.y} x2={rHand.x} y2={rHand.y} stroke="#854d0e" strokeWidth="6" strokeLinecap="round" />
          
          {/* Main Trunk Body */}
          <path d={`M ${chest.x - 16} 230 Q ${chest.x} ${chest.y} ${head.x} ${head.y}`} fill="none" stroke="url(#trunkGrad)" strokeWidth="18" strokeLinecap="round" />

          {/* Green Canopies */}
          <circle cx={head.x} cy={head.y} r="25" fill="#10b981" fillOpacity="0.8" />
          <circle cx={head.x - 12} cy={head.y - 10} r="18" fill="#047857" fillOpacity="0.9" />
          <circle cx={head.x + 12} cy={head.y - 8} r="18" fill="#059669" fillOpacity="0.9" />

          {/* Roots Leg joints */}
          <line x1={chest.x - 10} y1={210} x2={lFoot.x} y2={lFoot.y} stroke="#451a03" strokeWidth="5" strokeLinecap="round" />
          <line x1={chest.x + 10} y1={210} x2={rFoot.x} y2={rFoot.y} stroke="#451a03" strokeWidth="5" strokeLinecap="round" />

          {/* Joint Pin Controls */}
          {isPuppeteer && js.map(j => (
            <circle 
              key={j.id} 
              cx={j.x} 
              cy={j.y} 
              r="7" 
              fill="#fbbf24" 
              stroke="#ffffff" 
              strokeWidth="2" 
              className="cursor-pointer hover:scale-125 transition-transform" 
              onMouseDown={(e) => handleJointDrag(node.id, j.id, e)}
            />
          ))}
        </svg>
      );
    }

    if (node.puppetType === 'robot') {
      return (
        <svg className="w-full h-full bg-[#1e1b4b]/30 rounded-xl" viewBox="0 0 200 250">
          <defs>
            <linearGradient id="ironGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
          </defs>
          {/* Heavy Arm Joints & Legs */}
          <line x1={chest.x} y1={chest.y} x2={lHand.x} y2={lHand.y} stroke="#38bdf8" strokeWidth="5" strokeLinecap="round" />
          <line x1={chest.x} y1={chest.y} x2={rHand.x} y2={rHand.y} stroke="#38bdf8" strokeWidth="5" strokeLinecap="round" />
          <line x1={chest.x} y1={chest.y} x2={lFoot.x} y2={lFoot.y} stroke="#64748b" strokeWidth="6" strokeLinecap="round" />
          <line x1={chest.x} y1={chest.y} x2={rFoot.x} y2={rFoot.y} stroke="#64748b" strokeWidth="6" strokeLinecap="round" />

          {/* Torso Box */}
          <rect x={chest.x - 20} y={chest.y - 20} width="40" height="40" rx="6" fill="url(#ironGrad)" stroke="#94a3b8" strokeWidth="2" />
          <circle cx={chest.x} cy={chest.y} r="8" fill="#f43f5e" className="animate-pulse" /> {/* Glow Core */}

          {/* Optic Head */}
          <rect x={head.x - 14} y={head.y - 12} width="28" height="24" rx="4" fill="#0f172a" stroke="#64748b" strokeWidth="2" />
          <line x1={head.x - 8} y1={head.y} x2={head.x + 8} y2={head.y} stroke="#38bdf8" strokeWidth="3.5" />

          {/* Thruster Flames */}
          <ellipse cx={lFoot.x} cy={lFoot.y + 10} rx="5" ry="12" fill="#f97316" fillOpacity="0.8" />
          <ellipse cx={rFoot.x} cy={rFoot.y + 10} rx="5" ry="12" fill="#f97316" fillOpacity="0.8" />

          {/* Joint Pin Controls */}
          {isPuppeteer && js.map(j => (
            <circle 
              key={j.id} 
              cx={j.x} 
              cy={j.y} 
              r="7" 
              fill="#38bdf8" 
              stroke="#ffffff" 
              strokeWidth="2" 
              className="cursor-pointer hover:scale-125 transition-transform" 
              onMouseDown={(e) => handleJointDrag(node.id, j.id, e)}
            />
          ))}
        </svg>
      );
    }

    return null;
  };

  // Render landscape props
  const renderPropContent = (node: BoardNode) => {
    switch (node.propType) {
      case 'tree':
        return (
          <svg className="w-full h-full drop-shadow-[0_10px_15px_rgba(16,185,129,0.2)]" viewBox="0 0 100 120">
            <polygon points="50,10 20,60 80,60" fill="#065f46" />
            <polygon points="50,30 25,80 75,80" fill="#047857" />
            <polygon points="50,50 30,100 70,100" fill="#059669" />
            <rect x="44" y="100" width="12" height="20" fill="#78350f" />
          </svg>
        );
      case 'rock':
        return (
          <svg className="w-full h-full drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)]" viewBox="0 0 100 100">
            <path d="M 10 90 Q 25 15 50 30 T 90 90 Z" fill="#4b5563" stroke="#374151" strokeWidth="2" />
            <path d="M 30 85 Q 45 40 60 55 T 80 85 Z" fill="#6b7280" />
            <path d="M 20 60 Q 35 65 50 50" fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" /> {/* Moss */}
          </svg>
        );
      case 'pillar':
        return (
          <svg className="w-full h-full drop-shadow-2xl" viewBox="0 0 80 120">
            <rect x="15" y="10" width="50" height="15" fill="#374151" rx="2" />
            <rect x="25" y="25" width="30" height="85" fill="#4b5563" />
            <rect x="10" y="110" width="60" height="10" fill="#1f2937" rx="1" />
            {/* Ruin cracks */}
            <path d="M 30 35 L 45 50 L 35 60" fill="none" stroke="#111827" strokeWidth="2" />
          </svg>
        );
      case 'castle':
        return (
          <svg className="w-full h-full" viewBox="0 0 120 120">
            <rect x="20" y="40" width="80" height="80" fill="#374151" stroke="#1f2937" strokeWidth="3" />
            {/* Battlements */}
            <rect x="15" y="20" width="20" height="20" fill="#1f2937" />
            <rect x="50" y="20" width="20" height="20" fill="#1f2937" />
            <rect x="85" y="20" width="20" height="20" fill="#1f2937" />
            {/* Arch gate */}
            <path d="M 45 120 A 15 15 0 0 1 75 120 Z" fill="#111827" />
          </svg>
        );
      case 'ground':
        return (
          <svg className="w-full h-full opacity-90" viewBox="0 0 150 80" preserveAspectRatio="none">
            <path d="M 0 50 Q 50 10 100 40 T 150 30 L 150 80 L 0 80 Z" fill="#065f46" />
            <path d="M 20 55 Q 60 25 110 45 T 150 40 L 150 80 L 20 80 Z" fill="#047857" />
          </svg>
        );
      default:
        return null;
    }
  };

  const renderNodeContent = (node: BoardNode) => {
    switch (node.type) {
      case 'character':
        return renderInteractivePuppet(node);

      case 'prop':
        return renderPropContent(node);

      case 'video':
        return (
          <div className="w-full h-full bg-neutral-900 rounded-xl border border-neutral-800 flex flex-col overflow-hidden relative group">
            <div className="absolute top-2 left-2 bg-rose-600/90 text-[10px] font-black uppercase px-2 py-0.5 rounded-full z-10 tracking-wider">
              Video Loop
            </div>
            {node.src ? (
              <div className="flex-1 relative bg-black">
                {node.videoPlaying ? (
                  <video src={node.src} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-950">
                    <Video className="w-12 h-12 text-rose-500/40 mb-2 animate-pulse" />
                    <span className="text-[10px] text-neutral-400 font-bold">{node.name}</span>
                  </div>
                )}
                <button 
                  onClick={() => setNodes(prev => prev.map(n => n.id === node.id ? { ...n, videoPlaying: !n.videoPlaying } : n))}
                  className="absolute bottom-3 right-3 p-2 bg-rose-600 hover:bg-rose-500 rounded-full text-white shadow-lg z-10 transition-transform"
                >
                  {node.videoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
              </div>
            ) : null}
          </div>
        );

      case 'audio':
        return (
          <div className="w-full h-full bg-neutral-900 border-2 border-pink-500/30 rounded-xl p-3 flex flex-col justify-between overflow-hidden shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-pink-400" />
                <span className="text-xs font-bold text-neutral-200 truncate max-w-[120px]">{node.name}</span>
              </div>
              <button 
                onClick={() => setNodes(prev => prev.map(n => n.id === node.id ? { ...n, videoPlaying: !n.videoPlaying } : n))}
                className="p-1.5 bg-pink-600 hover:bg-pink-500 rounded-full text-white"
              >
                {node.videoPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </button>
            </div>
            <div className="h-6 flex items-end justify-between px-1 gap-[2px]">
              {[0.3, 0.7, 0.4, 0.9, 0.2, 0.8, 0.5, 0.9, 0.3].map((val, idx) => (
                <div 
                  key={idx}
                  className="bg-pink-500 rounded-full flex-1"
                  style={{ 
                    height: node.videoPlaying ? `${val * 100}%` : '20%',
                    animation: node.videoPlaying ? `pulse 1s ease-in-out infinite alternate ${idx * 0.1}s` : 'none'
                  }}
                />
              ))}
            </div>
          </div>
        );

      case 'notebook':
        return (
          <div className="w-full h-full bg-yellow-500/10 backdrop-blur-md border border-yellow-500/30 rounded-xl flex flex-col shadow-2xl overflow-hidden">
             <div className="bg-yellow-500/20 p-2.5 flex justify-between items-center border-b border-yellow-500/20 cursor-move drag-handle">
                <div className="flex items-center gap-1.5 text-yellow-300">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[10px] font-bold tracking-widest uppercase">Notebook Analyzer</span>
                </div>
                <div className="flex gap-1">
                    <button 
                      onClick={() => handleAITranscript(node.id)}
                      className="p-1 hover:bg-yellow-500/30 rounded text-amber-300" 
                      title="Dictate Scene (Voice-to-Text)"
                    >
                      <Mic className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => {
                        const isStick = node.content?.toLowerCase().includes("hero") || node.content?.toLowerCase().includes("stick");
                        const character = nodes.find(n => n.type === 'character');
                        if (isStick && character) {
                          setConnections(prev => [...prev, {
                            id: `conn-ai-${Date.now()}`,
                            fromId: node.id,
                            toId: character.id,
                            label: 'Semantic Association',
                            color: '#10b981'
                          }]);
                        } else {
                          alert("AI analyzed text. Add references to 'hero' or 'stick' to trigger intelligent auto-linking!");
                        }
                      }}
                      className="px-2 py-0.5 bg-yellow-500/30 hover:bg-yellow-500/50 rounded text-[10px] font-bold flex items-center gap-1 text-yellow-200"
                    >
                      <Link2 className="w-3 h-3" /> Link
                    </button>
                </div>
             </div>
             <textarea 
                className="flex-1 bg-transparent border-none resize-none p-3 text-sm text-yellow-100 placeholder:text-yellow-100/30 focus:outline-none focus:ring-0"
                value={node.content}
                onChange={(e) => {
                  const val = e.target.value;
                  setNodes(prev => prev.map(n => n.id === node.id ? { ...n, content: val } : n));
                }}
                placeholder="Write, dictate, or prompt story ideas..."
             />
          </div>
        );

      case 'image':
      default:
        return (
          <div 
            className="w-full h-full bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden flex flex-col relative group"
            onDoubleClick={() => {
              const url = prompt("Enter Custom Image URL:", "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=300");
              if (url) {
                setNodes(prev => prev.map(n => n.id === node.id ? { ...n, src: url, name: 'Mood Image' } : n));
              }
            }}
          >
            {node.src ? (
              <img src={node.src} alt="Mood asset" className="w-full h-full object-cover select-none pointer-events-none" />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                <ImageIcon className="w-10 h-10 text-neutral-600 mb-2" />
                <span className="text-[10px] text-neutral-400 font-bold">Double-click to paste Image URL</span>
              </div>
            )}
          </div>
        );
    }
  };

  // Automated Transcript Simulation
  const handleAITranscript = (nodeId: string) => {
    const sceneTranscripts = [
      "The Stick Hero discovers a glowing pillar inside the deep forest SPRITE ruins.",
      "A cinematic shot panning the ancient moss boulders while cyberpunk ambient tracks play.",
      "Story Idea: Stick Hero confronts the forest sprite as a mechanical sentry flies above."
    ];
    const text = sceneTranscripts[Math.floor(Math.random() * sceneTranscripts.length)];
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, content: text } : n));
  };

  return (
    <div 
      className={`flex flex-col bg-neutral-950 text-white border border-neutral-800 transition-all duration-300 relative ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'h-[650px] rounded-2xl overflow-hidden shadow-2xl'
      }`}
      onMouseMove={handleWorkspaceMouseMove}
      onMouseUp={handlePointerUp}
    >
      {/* Dynamic Header & Settings Panel */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-900/90 backdrop-blur z-20">
        <div className="flex items-center gap-2">
          {/* Main Select/Pencil/Puppet Tool Belt */}
          <div className="flex bg-neutral-950 rounded-xl p-1 border border-neutral-800 shadow-inner">
            <button 
              className={`p-2 rounded-lg transition-all ${activeTool === 'select' ? 'bg-indigo-600 text-white shadow-lg' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`} 
              onClick={() => { setActiveTool('select'); setLinkStartNodeId(null); }}
              title="Select / Move / Resize Mode"
            >
              <MousePointer2 className="w-4 h-4" />
            </button>
            <button 
              className={`p-2 rounded-lg transition-all ${activeTool === 'pencil' ? 'bg-purple-600 text-white shadow-lg' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`} 
              onClick={() => { setActiveTool('pencil'); setLinkStartNodeId(null); }}
              title="Calibrated Freehand Drawing Mode"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button 
              className={`p-2 rounded-lg transition-all ${activeTool === 'eraser' ? 'bg-purple-600 text-white shadow-lg' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`} 
              onClick={() => { setActiveTool('eraser'); setLinkStartNodeId(null); }}
              title="Freehand Canvas Eraser"
            >
              <Eraser className="w-4 h-4" />
            </button>
            <button 
              className={`p-2 rounded-lg transition-all ${activeTool === 'puppeteer' ? 'bg-rose-600 text-white shadow-lg' : 'text-neutral-400 hover:text-rose-400 hover:bg-rose-950/20'}`} 
              onClick={() => { setActiveTool('puppeteer'); setLinkStartNodeId(null); }}
              title="Puppeteer Mode (Animate / Rotate Joint Pins)"
            >
              <Scissors className="w-4 h-4" />
              <span className="text-[9px] font-black uppercase ml-1">Pose Puppets</span>
            </button>
            <button 
              className={`p-2 rounded-lg transition-all ${activeTool === 'link' ? 'bg-emerald-600 text-white shadow-lg' : 'text-neutral-400 hover:text-emerald-400 hover:bg-emerald-950/20'}`} 
              onClick={() => setActiveTool('link')}
              title="Visual Link Connector (Click Node A -> Node B)"
            >
              <Link2 className="w-4 h-4" />
            </button>
            <button 
              className={`p-2 rounded-lg transition-all ${activeTool === 'hand' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`} 
              onClick={() => { setActiveTool('hand'); setLinkStartNodeId(null); }}
              title="Hand Tool (Pan workspace)"
            >
              <Move className="w-4 h-4" />
            </button>
          </div>

          {/* Color & Ink Customizer */}
          {['pencil', 'link'].includes(activeTool) && (
            <div className="flex gap-1 items-center bg-neutral-950 p-1.5 rounded-xl border border-neutral-800">
              {['#a855f7', '#f43f5e', '#38bdf8', '#10b981', '#fbbf24', '#ffffff'].map(c => (
                <button 
                  key={c} 
                  className={`w-3.5 h-3.5 rounded-full border transition-transform ${color === c ? 'border-white scale-125' : 'border-transparent'}`} 
                  style={{ backgroundColor: c }} 
                  onClick={() => setColor(c)} 
                />
              ))}
            </div>
          )}
        </div>

        {/* Dynamic Insert Node bar */}
        <div className="flex items-center gap-1 bg-neutral-950 p-1 border border-neutral-800 rounded-xl shadow-inner">
          <span className="text-[9px] font-black uppercase tracking-wider text-neutral-500 px-2">Build Studio</span>
          <div className="w-px h-3 bg-neutral-800" />
          <button onClick={() => addNode('image')} className="p-1.5 hover:bg-neutral-800 rounded-lg text-purple-400" title="Insert Mood Art"><ImageIcon className="w-3.5 h-3.5" /></button>
          <button onClick={() => addNode('notebook')} className="p-1.5 hover:bg-neutral-800 rounded-lg text-amber-400" title="Insert Story Analyzer Notebook"><FileText className="w-3.5 h-3.5" /></button>
        </div>

        {/* Global Reset, Preference Background & Zoom Controls */}
        <div className="flex items-center gap-2">
          {/* Theme Preset Picker */}
          <div className="flex items-center gap-1.5 bg-neutral-950 px-2 py-1.5 rounded-xl border border-neutral-800">
            <Palette className="w-3.5 h-3.5 text-neutral-400" />
            <select 
              value={activeTheme.id}
              onChange={(e) => {
                const theme = BACKGROUND_THEMES.find(t => t.id === e.target.value);
                if (theme) setActiveTheme(theme);
              }}
              className="bg-transparent border-none text-[10px] font-bold text-neutral-200 focus:outline-none focus:ring-0 cursor-pointer"
            >
              {BACKGROUND_THEMES.map(t => (
                <option key={t.id} value={t.id} className="bg-neutral-900 text-white">{t.name}</option>
              ))}
            </select>
          </div>

          {/* Canvas Zoom Belt */}
          <div className="flex bg-neutral-950 rounded-xl p-1 border border-neutral-800">
            <button onClick={zoomOut} className="p-1 text-neutral-400 hover:text-white rounded"><Minus className="w-3 h-3" /></button>
            <span className="text-[9px] font-black px-2 flex items-center min-w-[36px] justify-center">{Math.round(zoom * 100)}%</span>
            <button onClick={zoomIn} className="p-1 text-neutral-400 hover:text-white rounded"><Plus className="w-3 h-3" /></button>
          </div>

          {/* Reset / Clear Buttons */}
          <button 
            onClick={resetToDefault} 
            className="p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-[10px] font-bold flex items-center gap-1"
            title="Reset Board to Default Template"
          >
            <RefreshCw className="w-3 h-3" /> Reset
          </button>
          <button 
            onClick={clearCanvas} 
            className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/40 rounded-lg text-[10px] font-bold flex items-center gap-1 text-rose-300"
            title="Clear all nodes and drawings"
          >
            <Trash2 className="w-3 h-3" /> Clear All
          </button>

          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg"
            title="Toggle Maximized Canvas"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Workspace Arena */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Assets Sidebar Panel */}
        <div className="w-56 bg-neutral-900/95 backdrop-blur-md border-r border-neutral-800 flex flex-col z-10 shadow-2xl">
          <div className="p-3 border-b border-neutral-800">
            <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Production Library</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-5 scrollbar-thin">
            
            {/* Rigged Puppets Section */}
            <div className="space-y-2">
              <p className="text-[9px] uppercase font-bold text-neutral-500 tracking-wider">Rig puppets (Stick & Sprite)</p>
              <div className="space-y-2">
                {PREMADE_PUPPETS.map(pup => (
                  <div 
                    key={pup.id} 
                    onClick={() => addNode('character', { puppetType: pup.puppetType, name: pup.name, joints: pup.joints })}
                    className="p-2 bg-neutral-800/80 hover:bg-indigo-950/20 border border-neutral-700 hover:border-indigo-500 rounded-xl cursor-pointer transition-all flex items-center gap-2 group"
                  >
                    <div className="w-10 h-10 bg-neutral-900 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-neutral-800">
                      <Scissors className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-neutral-200 truncate">{pup.name}</p>
                      <p className="text-[9px] text-indigo-400 font-medium">Animate Rig Joints</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Forest Landscape Props */}
            <div className="space-y-2">
              <p className="text-[9px] uppercase font-bold text-neutral-500 tracking-wider">Landscape & Forest Elements</p>
              <div className="grid grid-cols-2 gap-1.5">
                {PREMADE_PROPS.map(p => (
                  <div 
                    key={p.id}
                    onClick={() => addNode('prop', { propType: p.propType, name: p.name })}
                    className="p-1.5 bg-neutral-800/50 hover:bg-emerald-950/20 border border-neutral-700/60 hover:border-emerald-500 rounded-lg text-center cursor-pointer transition-all"
                  >
                    <span className="text-[10px] font-semibold block truncate text-neutral-300">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Media Add On URL section */}
            <div className="pt-2">
              <button 
                onClick={() => {
                  const url = prompt("Enter Custom Image / Asset URL to place on Board:", "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=300");
                  if (url) {
                    addNode('image', { src: url, name: 'Imported Asset' });
                  }
                }}
                className="w-full py-2 border border-dashed border-neutral-700 hover:border-purple-500 rounded-xl text-[10px] font-bold text-neutral-400 hover:text-purple-400 transition-all flex items-center justify-center gap-1.5"
              >
                <Wand2 className="w-3.5 h-3.5" /> Import Custom URL
              </button>
            </div>
          </div>
        </div>

        {/* Master Interactive Infinite Canvas */}
        <div 
          ref={workspaceContainerRef}
          className={`flex-1 relative overflow-hidden ${activeTheme.class}`}
          style={activeTheme.style}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* Translation Frame */}
          <div 
            style={{ 
              transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`, 
              transformOrigin: '0 0',
              width: '4000px',
              height: '4000px'
            }}
            className="absolute top-0 left-0 transition-transform duration-75 select-none"
          >
            {/* Freehand drawing backing canvas */}
            <canvas
              ref={mainCanvasRef}
              className={`absolute top-0 left-0 w-full h-full ${activeTool === 'pencil' || activeTool === 'eraser' ? 'pointer-events-auto cursor-crosshair' : 'pointer-events-none'}`}
            />

            {/* Relationship Lines SVG Overlays */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
              {connections.map(conn => {
                const fromNode = nodes.find(n => n.id === conn.fromId);
                const toNode = nodes.find(n => n.id === conn.toId);
                if (!fromNode || !toNode) return null;

                const x1 = fromNode.x + fromNode.width / 2;
                const y1 = fromNode.y + fromNode.height / 2;
                const x2 = toNode.x + toNode.width / 2;
                const y2 = toNode.y + toNode.height / 2;

                return (
                  <g key={conn.id}>
                    <line 
                      x1={x1} y1={y1} x2={x2} y2={y2} 
                      stroke={conn.color} strokeWidth="2.5" 
                      markerEnd="url(#board-arrow)" 
                    />
                    <circle cx={x1} cy={y1} r="5" fill={conn.color} className="animate-pulse" />
                    <circle cx={x2} cy={y2} r="5" fill={conn.color} />
                    {/* Floating Label box */}
                    <rect 
                      x={(x1 + x2) / 2 - 55} 
                      y={(y1 + y2) / 2 - 10} 
                      width="110" 
                      height="18" 
                      rx="4" 
                      fill="#18181b" 
                      stroke={conn.color} 
                      strokeWidth="1.5" 
                    />
                    <text 
                      x={(x1 + x2) / 2} 
                      y={(y1 + y2) / 2 + 3} 
                      fill="#ffffff" 
                      fontSize="9" 
                      fontWeight="black" 
                      textAnchor="middle"
                    >
                      {conn.label}
                    </text>
                  </g>
                );
              })}
              <defs>
                <marker id="board-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#fbbf24" />
                </marker>
              </defs>
            </svg>

            {/* Renderable Draggable Node Blocks */}
            {nodes.map(node => {
              const isSelected = selectedNodeId === node.id;
              const isLinkCandidate = activeTool === 'link' && linkStartNodeId === node.id;

              return (
                <Rnd
                  key={node.id}
                  id={`node-wrap-${node.id}`}
                  size={{ width: node.width, height: node.height }}
                  position={{ x: node.x, y: node.y }}
                  onDragStop={(e, d) => {
                    setNodes(prev => prev.map(n => n.id === node.id ? { ...n, x: d.x, y: d.y } : n));
                  }}
                  onResizeStop={(e, direction, ref, delta, position) => {
                    setNodes(prev => prev.map(n => n.id === node.id ? {
                      ...n,
                      width: ref.offsetWidth,
                      height: ref.offsetHeight,
                      ...position
                    } : n));
                  }}
                  minWidth={100}
                  minHeight={60}
                  bounds="parent"
                  disableDragging={activeTool !== 'select'}
                  enableResizing={activeTool === 'select'}
                  dragHandleClassName="drag-handle"
                  onDragStart={() => setSelectedNodeId(node.id)}
                  className={`absolute ${isSelected ? 'z-50' : 'z-20'}`}
                >
                  <div 
                    onClick={(e) => handleNodeClick(node.id, e)}
                    className={`w-full h-full relative transition-shadow duration-150 rounded-xl ${
                      isSelected ? 'ring-4 ring-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]' : 'ring-2 ring-neutral-800'
                    } ${isLinkCandidate ? 'ring-4 ring-emerald-400 animate-pulse' : ''}`}
                  >
                    {/* Drag & Remove utilities */}
                    {activeTool === 'select' && (
                      <div className="absolute inset-x-0 top-0 h-7 bg-black/50 hover:bg-black/75 rounded-t-xl cursor-move flex items-center justify-between px-2.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity drag-handle">
                        <span className="text-[9px] font-black uppercase text-neutral-300">Move Node</span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeNode(node.id); }}
                          className="w-4.5 h-4.5 bg-rose-600 hover:bg-rose-500 rounded-full flex items-center justify-center text-white"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {renderNodeContent(node)}
                  </div>
                </Rnd>
              );
            })}
          </div>

          {/* HUD Instructions Overlay */}
          <div className="absolute bottom-4 left-4 bg-neutral-900/90 border border-neutral-800 p-3 rounded-xl max-w-sm pointer-events-none text-[11px] text-neutral-400 flex flex-col gap-1 shadow-2xl z-10">
            <p className="font-bold text-white flex items-center gap-1.5"><HelpCircle className="w-4 h-4 text-purple-400" /> Interactive Storyboard HUD</p>
            <p>• Select <span className="text-purple-400 font-bold">Pose Puppets</span> to drag joints and pose 2D puppets directly!</p>
            <p>• Select <span className="text-emerald-400 font-bold">Link Tool</span> to create logic flows with prompt-based tags.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
