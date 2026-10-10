import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { IS_COMMERCIAL } from "./flags";
import {
  Upload,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Trash2,
  Crop,
  PieChart,
  Palette,
  Edit2,
  Check,
  X,
  Wand2,
  Download,
  ExternalLink,
  LogIn,
  LogOut,
  AlertCircle,
  Heart,
  Code,
  Copy,
  Lock,
  Unlock,
  ShieldAlert,
  Plus,
  User,
  Eye,
  ArrowUpDown,
  Maximize2,
  Minimize2,
  Sliders,
  RotateCcw,
  Delete,
  Menu,
  Clock,
  Database,
  Monitor,
  Terminal,
  Cpu,
  Gamepad2,
  Sparkles,
  SlidersHorizontal,
  FolderKanban,
  HelpCircle,
  LayoutGrid,
  Pencil,
  FileSpreadsheet,
  Table,
  ChevronDown,
  ChevronUp,
  Layers,
  CheckSquare,
  Square,
} from "lucide-react";
import { FeatureHelpModal } from "./components/FeatureHelpModal";
import { Character, ArchiveItem, Theme, Status, SubImage, ProjectRelation } from "./types";
import { DOCK_DEFAULT_CHARACTER, DOCK_DEFAULT_ITEM, ARTIE_DEFAULT_CHARACTER, ARTIE_DEFAULT_ITEM, STAN_DEFAULT_CHARACTER, STAN_DEFAULT_ITEM } from "./data/defaultDock";
import { v4 as uuidv4 } from "uuid";
import { Dashboard } from "./components/Dashboard";
import { MediaView } from "./components/MediaView";
import { DatabaseDashboard } from "./components/DatabaseDashboard";
import { SpreadsheetView } from "./components/SpreadsheetView";
import { MoodBoard } from "./components/MoodBoard";
import { CategoryDetail } from "./components/CategoryDetail";
import { ProjectGroupsView } from "./components/ProjectGroupsView";
import { SidebarEditableButton } from "./components/SidebarEditableButton";
import { MiniGame } from "./components/MiniGame";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableCategory } from "./components/SortableCategory";
import { SortableCharacterFilter } from "./components/SortableCharacterFilter";
import { FavoritesView } from "./components/FavoritesView";
import { DeveloperCodeModal } from "./components/DeveloperCodeModal";
import { ArcadeModeShowcase } from "./components/ArcadeModeShowcase";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { initAuth, googleSignIn, logout } from "./lib/auth";
import { playNotificationSound } from "./lib/audio";
import { safeCopyToClipboard } from "./lib/utils";

export const isNameGeneric = (name: string): boolean => {
  if (!name) return true;
  const lower = name.toLowerCase().trim();
  const genericKeywords = [
    "unknown",
    "generic",
    "character",
    "samurai",
    "rabbit",
    "horse",
    "warrior",
    "soldier",
    "guard",
    "ninja",
    "creature",
    "monster",
    "beast",
    "demon",
    "object",
    "weapon",
    "item",
    "sketch",
    "unnamed",
    "spirit",
    "background",
    "scenery",
    "concept",
    "art",
    "prop",
    "statue",
    "robot",
    "mecha",
    "cyborg",
    "villager",
    "person",
    "man",
    "woman",
    "boy",
    "girl",
    "child",
    "adult",
    "elder",
    "figure",
    "shadow",
    "silhouette",
    "mass",
    "horde",
    "animal",
    "the horse",
    "red car",
    "axe",
    "sword",
    "helmet",
    "armour",
    "shield",
    "banner",
  ];

  if (genericKeywords.some((keyword) => lower === keyword)) {
    return true;
  }

  if (
    lower.includes("samurai rabbit") ||
    lower.includes("white horse") ||
    lower.includes("black horse") ||
    lower.includes("unknown warrior") ||
    lower.includes("generic character") ||
    lower.includes("untitled")
  ) {
    return true;
  }

  return false;
};

export async function computeFileHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function generateThumbnail(file: File, boundingBox: [number, number, number, number]): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const [ymin, xmin, ymax, xmax] = boundingBox;
            const width = (xmax - xmin) * img.width;
            const height = (ymax - ymin) * img.height;
            canvas.width = 150; // Thumbnail size
            canvas.height = 150;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, xmin * img.width, ymin * img.height, width, height, 0, 0, 150, 150);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            } else {
                reject("Canvas context failed");
            }
        };
        img.onerror = reject;
    });
}

export async function generateHighlightedFeatureImage(file: File, boundingBox: [number, number, number, number]): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject("No 2d context");
            
            ctx.drawImage(img, 0, 0);
            
            const [ymin, xmin, ymax, xmax] = boundingBox;
            const sx = xmin * img.width;
            const sy = ymin * img.height;
            const sw = (xmax - xmin) * img.width;
            const sh = (ymax - ymin) * img.height;
            
            const cx = sx + sw / 2;
            const cy = sy + sh / 2;
            const radius = Math.max(sw, sh) / 1.5;
            
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
            ctx.lineWidth = Math.max(3, img.width / 150);
            ctx.strokeStyle = "#ef4444"; // red-500
            ctx.stroke();
            
            // Outer glow for visibility
            ctx.lineWidth = Math.max(1, img.width / 300);
            ctx.strokeStyle = "white";
            ctx.stroke();
            
            resolve(canvas.toDataURL("image/jpeg", 0.8));
        };
        img.onerror = () => reject("Image load error");
    });
}

export async function generateFeatureCrop(file: File, boundingBox: [number, number, number, number]): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const [ymin, xmin, ymax, xmax] = boundingBox;
            
            const clampedYmin = Math.max(0, Math.min(1, ymin));
            const clampedXmin = Math.max(0, Math.min(1, xmin));
            const clampedYmax = Math.max(0, Math.min(1, ymax));
            const clampedXmax = Math.max(0, Math.min(1, xmax));
            
            const sx = clampedXmin * img.width;
            const sy = clampedYmin * img.height;
            const sw = (clampedXmax - clampedXmin) * img.width;
            const sh = (clampedYmax - clampedYmin) * img.height;

            if (sw < 10 || sh < 10) {
                reject("Bounding box area too small for crop");
                return;
            }
            
            const maxDimension = 400; // Optimal size for feature/emblem details
            let targetWidth = sw;
            let targetHeight = sh;
            
            if (sw > maxDimension || sh > maxDimension) {
                if (sw > sh) {
                    targetWidth = maxDimension;
                    targetHeight = (sh / sw) * maxDimension;
                } else {
                    targetHeight = maxDimension;
                    targetWidth = (sw / sh) * maxDimension;
                }
            }
            
            canvas.width = targetWidth > 0 ? targetWidth : 150;
            canvas.height = targetHeight > 0 ? targetHeight : 150;
            
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(
                    img,
                    sx, sy, sw > 0 ? sw : img.width, sh > 0 ? sh : img.height,
                    0, 0, canvas.width, canvas.height
                );
                resolve(canvas.toDataURL('image/jpeg', 0.9));
            } else {
                reject("Canvas context failed");
            }
        };
        img.onerror = reject;
    });
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
    // Ignore storage quota or security errors in iframe context
  }
};

const safeRemoveStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    // Ignore storage quota or security errors in iframe context
  }
};

export default function App() {
  const [theme, setTheme] = useState<Theme>(
    () => (safeGetStorage("theme") as Theme) || "dark",
  );
  const [scanMode, setScanMode] = useState<"basic" | "advanced">(
    () =>
      (safeGetStorage("scanMode") as "basic" | "advanced") || "advanced",
  );
  const [countingMode, setCountingMode] = useState<"multiple" | "single">(
    () =>
      (safeGetStorage("countingMode") as "multiple" | "single") || "multiple",
  );
  const [imageSplitMode, setImageSplitMode] = useState<"crop" | "highlight">(
    () =>
      (safeGetStorage("imageSplitMode") as "crop" | "highlight") || "highlight",
  );
  const [sidebarWidth, setSidebarWidth] = useState(
    () => Number(safeGetStorage("sidebarWidth")) || 256,
  );
  const [rightSidebarWidth, setRightSidebarWidth] = useState(
    () => Number(safeGetStorage("rightSidebarWidth")) || 256,
  );
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };
  const [draggingSidebar, setDraggingSidebar] = useState<
    "left" | "right" | "leftVertical" | "rightVertical" | null
  >(null);

  const [leftNavHeight, setLeftNavHeight] = useState(
    () => Number(safeGetStorage("leftNavHeight")) || 550,
  );
  const [rightCategoriesHeight, setRightCategoriesHeight] = useState(() => {
    const saved = safeGetStorage("rightCategoriesHeight");
    if (saved) {
      const num = Number(saved);
      if (!isNaN(num)) {
        return num === 750 ? 420 : num;
      }
    }
    return 420;
  });
  const [creatorPin, setCreatorPin] = useState(() => {
    const saved = safeGetStorage("creator_pin");
    if (saved === "0000") return "000";
    return saved !== null ? saved : "000";
  });
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [windowWidth, setWindowWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleExpand = (e: Event) => {
      const customEvent = e as CustomEvent<{ src: string }>;
      if (customEvent.detail && customEvent.detail.src) {
        setExpandedImage(customEvent.detail.src);
      }
    };
    const handleCropArchive = (e: Event) => {
      const customEvent = e as CustomEvent<{ itemId: string, src: string }>;
      if (customEvent.detail && customEvent.detail.itemId && customEvent.detail.src) {
        setCroppingImage({
          slotName: "thumbnailContent",
          profileType: "archive",
          imageUrl: customEvent.detail.src,
          itemId: customEvent.detail.itemId,
        });
      }
    };
    const handleCropCharacter = (e: Event) => {
      const customEvent = e as CustomEvent<{ charId: string, src: string, slotName?: string }>;
      if (customEvent.detail && customEvent.detail.charId && customEvent.detail.src) {
        setCroppingImage({
          slotName: customEvent.detail.slotName || "subimage",
          profileType: "character",
          imageUrl: customEvent.detail.src,
          charId: customEvent.detail.charId,
        });
      }
    };
    const handleCharacterCropComplete = (e: Event) => {
      const customEvent = e as CustomEvent<{ croppedUrl: string; charId: string; slotName: string }>;
      const { croppedUrl, charId, slotName } = customEvent.detail;
      setCharacters((prev) =>
        prev.map((c) => {
          if (c.id === charId) {
            if (slotName === "highlightedImageSrc" || slotName === "defaultThumbnailSrc") {
              return { ...c, highlightedImageSrc: croppedUrl, defaultThumbnailSrc: croppedUrl };
            } else {
              const subImages = [...(c.subImages || [])];
              subImages.push({
                id: `subimg-${Date.now()}`,
                src: croppedUrl,
                title: "Cropped Feature",
                description: "Custom cropped portrait highlight",
              });
              return { ...c, subImages };
            }
          }
          return c;
        })
      );
      // Also update archive items thumbnail if matches
      setItems(prev => prev.map(item => {
        if (item.characterId === charId || (item.content && item.content.includes(charId))) {
          return { ...item, thumbnailContent: croppedUrl };
        }
        return item;
      }));
    };
    window.addEventListener("expand-image", handleExpand);
    window.addEventListener("crop-archive-image", handleCropArchive);
    window.addEventListener("crop-character-image", handleCropCharacter);
    window.addEventListener("character-crop-complete", handleCharacterCropComplete);
    return () => {
      window.removeEventListener("expand-image", handleExpand);
      window.removeEventListener("crop-archive-image", handleCropArchive);
      window.removeEventListener("crop-character-image", handleCropCharacter);
      window.removeEventListener("character-crop-complete", handleCharacterCropComplete);
    };
  }, []);

   const DEFAULT_CREATOR_PROFILE = {
    name: "Alberto Armentero",
    role: "Owner/Creator/Developer/Artist",
    date: "June 28, 2026",
    cautionText: "This is for developers only.",
    pinProtectionText: "PIN code needed for access",
    avatarUrl:
      "https://raw.githubusercontent.com/toonyman2020/Music-Player/Catti-Cango/Me.jpg",
    avatarOriginalUrl:
      "https://raw.githubusercontent.com/toonyman2020/Music-Player/Catti-Cango/Me.jpg",
    avatarLabel: "Alberto Armentero",
    mascotUrl:
      "https://raw.githubusercontent.com/toonyman2020/Music-Player/Catti-Cango/Super%20Green%20Me.png",
    mascotOriginalUrl:
      "https://raw.githubusercontent.com/toonyman2020/Music-Player/Catti-Cango/Super%20Green%20Me.png",
    mascotLabel: "Super Armentero / Creator/Mascot",
    treeLogoUrl:
      "https://raw.githubusercontent.com/toonyman2020/Music-Player/Catti-Cango/Logo%20-%20Armentero%20Studios.png",
    treeLogoOriginalUrl:
      "https://raw.githubusercontent.com/toonyman2020/Music-Player/Catti-Cango/Logo%20-%20Armentero%20Studios.png",
    treeLogoLabel: "Armentero Studios",
    labtechLogoUrl:
      "https://raw.githubusercontent.com/toonyman2020/Music-Player/Catti-Cango/Armstech%20Laboratories.jpg",
    labtechLogoOriginalUrl:
      "https://raw.githubusercontent.com/toonyman2020/Music-Player/Catti-Cango/Armstech%20Laboratories.jpg",
    labtechLogoLabel: "Armstech Laboratories",
    bio: "An advanced digital character scanner, scanning workspace, and media archive system. This platform is designed to seamlessly parse, index, and organize custom characters, original illustrations, and conceptual assets. Featuring deep metadata cataloging, real-time advanced attribute extraction, robust classification structures, and structured file hierarchy visualizers, it preserves the integrity of creative intellectual property with complete local autonomy.",
    portfolioUrl: "",
  };

  const DEFAULT_USER_PROFILE = {
    id: "default-user",
    name: "",
    role: "",
    date: "",
    avatarUrl: "",
    avatarOriginalUrl: "",
    avatarLabel: "",
    mascotUrl: "",
    mascotOriginalUrl: "",
    mascotLabel: "",
    treeLogoUrl: "",
    treeLogoOriginalUrl: "",
    treeLogoLabel: "",
    labtechLogoUrl: "",
    labtechLogoOriginalUrl: "",
    labtechLogoLabel: "",
    bio: "",
    portfolioUrl: "",
  };

  const [creatorProfile, setCreatorProfile] = useState(() => {
    const saved = safeGetStorage("creator_profile_data");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Force reset / migration if previous data had 'ComicMan Studios' or empty
        if (
          parsed.name === "ComicMan Studios" ||
          !parsed.name ||
          parsed.name === "Me"
        ) {
          parsed.name = "Alberto Armentero";
          parsed.role = "Owner/Creator/Developer/Artist";
        }
        if (!parsed.date) {
          parsed.date = "June 28, 2026";
        }
        if (!parsed.cautionText) {
          parsed.cautionText = "This is for developers only.";
        }
        if (!parsed.pinProtectionText) {
          parsed.pinProtectionText = "PIN code needed for access";
        }
        return parsed;
      } catch (e) {}
    }
    return DEFAULT_CREATOR_PROFILE;
  });

  const [userProfiles, setUserProfiles] = useState<any[]>(() => {
    const saved = safeGetStorage("user_profiles");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [DEFAULT_USER_PROFILE];
  });

  const [activeUserProfileId, setActiveUserProfileId] = useState<string>(() => {
    const saved = safeGetStorage("active_user_profile_id");
    return saved !== null ? saved : "default-user";
  });

  const activeUserProfile =
    userProfiles.find((p) => p.id === activeUserProfileId) ||
    userProfiles[0] ||
    DEFAULT_USER_PROFILE;

  const [swapProfileOrder, setSwapProfileOrder] = useState<boolean>(() => {
    return safeGetStorage("swap_profile_order") === "true";
  });
  const [creatorModalSize, setCreatorModalSize] = useState<
    "compact" | "spacious" | "expanded"
  >("expanded");
  const [userModalSize, setUserModalSize] = useState<
    "compact" | "spacious" | "expanded"
  >("expanded");
  const [croppingImage, setCroppingImage] = useState<{
    slotName: string;
    profileType: "creator" | "user" | "archive" | "character";
    imageUrl: string;
    itemId?: string;
    charId?: string;
  } | null>(null);

  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [isDeveloperModalOpen, setIsDeveloperModalOpen] = useState(false);
  const [isDevSdkModalOpen, setIsDevSdkModalOpen] = useState(false);
  const [developerNotes, setDeveloperNotes] = useState<string[]>(() => {
    try {
      const saved = safeGetStorage("developer_custom_notes");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [developerChanges, setDeveloperChanges] = useState<number>(() => {
    const saved = safeGetStorage("developer_changes_count");
    return saved ? parseInt(saved, 10) : 42; // default 42 changes
  });

  const [developerMajorVersions, setDeveloperMajorVersions] = useState<number>(() => {
    const saved = safeGetStorage("developer_major_versions");
    return saved ? parseInt(saved, 10) : 6; // default 6 major versions
  });

  const handleUpdateChanges = (val: number) => {
    const newVal = Math.max(0, val);
    setDeveloperChanges(newVal);
    safeSetStorage("developer_changes_count", newVal.toString());
  };

  const handleUpdateMajorVersions = (val: number) => {
    const newVal = Math.max(0, val);
    setDeveloperMajorVersions(newVal);
    safeSetStorage("developer_major_versions", newVal.toString());
  };

  const [unlockedCreatorTab, setUnlockedCreatorTab] = useState<"profile" | "developer" | "sdk">("profile");

  const [developerDays, setDeveloperDays] = useState<number>(() => {
    const saved = safeGetStorage("developer_days_spent");
    return saved ? parseInt(saved, 10) : 4; // default estimate 4 days
  });

  const [developerHours, setDeveloperHours] = useState<number>(() => {
    const saved = safeGetStorage("developer_hours_spent");
    return saved ? parseInt(saved, 10) : 28; // default estimate 28 hours
  });

  const handleUpdateDays = (val: number) => {
    const newVal = Math.max(0, val);
    setDeveloperDays(newVal);
    safeSetStorage("developer_days_spent", newVal.toString());
  };

  const handleUpdateHours = (val: number) => {
    const newVal = Math.max(0, val);
    setDeveloperHours(newVal);
    safeSetStorage("developer_hours_spent", newVal.toString());
  };

  const handleAddDeveloperNote = (note: string) => {
    if (!note.trim()) return;
    const updated = [note.trim(), ...developerNotes];
    setDeveloperNotes(updated);
    safeSetStorage("developer_custom_notes", JSON.stringify(updated));
  };

  const handleClearDeveloperNotes = () => {
    setDeveloperNotes([]);
    safeRemoveStorage("developer_custom_notes");
  };

  const [isEditingCreator, setIsEditingCreator] = useState(false);
  const [isUnlockingCreator, setIsUnlockingCreator] = useState(false);
  const [enteredPin, setEnteredPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [newPinSetting, setNewPinSetting] = useState("");

  // System Backup and Exporter state variables
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupData, setBackupData] = useState<any>(null);
  const [selectedBackupFile, setSelectedBackupFile] = useState<string>("");
  const [backupFileSearch, setBackupFileSearch] = useState<string>("");
  const [backupSuccessMessage, setBackupSuccessMessage] = useState<string>("");

  // AI engine settings (persisted server-side in chararchive.config.json)
  const [aiSettings, setAiSettings] = useState<any>(null);
  const [aiDraft, setAiDraft] = useState<any>({
    provider: "editorial",
    editorialApiKey: "",
    ollamaBaseUrl: "http://127.0.0.1:11434",
    ollamaVisionModel: "",
    ollamaTextModel: "",
  });
  const [aiSettingsLoading, setAiSettingsLoading] = useState(false);
  const [aiSettingsSaving, setAiSettingsSaving] = useState(false);
  const [aiTestMessage, setAiTestMessage] = useState<string>("");

  // Local model inventory and readiness
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [aiLocalModels, setAiLocalModels] = useState<any[]>([]);
  const [aiServerRunning, setAiServerRunning] = useState(false);
  const [aiOllamaUrl, setAiOllamaUrl] = useState<string | null>(null);
  const [aiModelsLoading, setAiModelsLoading] = useState(false);
  const [aiBusyModel, setAiBusyModel] = useState<string | null>(null);

  const loadAiSettings = useCallback(async () => {
    setAiSettingsLoading(true);
    try {
      const res = await fetch("/api/settings/ai");
      const json = await res.json();
      if (json.success) {
        setAiSettings(json);
        setAiDraft((d: any) => ({
          ...d,
          provider: json.provider,
          editorialApiKey: "",
          ollamaBaseUrl: json.ollamaBaseUrl,
          ollamaVisionModel: json.ollamaVisionModel,
          ollamaTextModel: json.ollamaTextModel,
        }));
      }
    } catch (e) {
      console.error("Failed to load AI settings:", e);
    } finally {
      setAiSettingsLoading(false);
    }
  }, []);

  const loadAiStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/status");
      const json = await res.json();
      if (json.success) setAiStatus(json);
    } catch (e) {
      console.error("Failed to read AI status:", e);
    }
  }, []);

  const loadAiModels = useCallback(async () => {
    setAiModelsLoading(true);
    try {
      const res = await fetch("/api/ai/models");
      const json = await res.json();
      setAiLocalModels(json.models || []);
      setAiServerRunning(Boolean(json.serverRunning));
      setAiOllamaUrl(json.ollamaUrl || null);
      setAiActiveVisionModel(json.activeVisionModel || null);
    } catch (e) {
      console.error("Failed to list local models:", e);
      setAiLocalModels([]);
      setAiServerRunning(false);
      setAiActiveVisionModel(null);
    } finally {
      setAiModelsLoading(false);
    }
  }, []);

  // Ollama loads weights on first use, so a model can be installed but not
  // resident. Warming it here moves that wait out of the user's first analysis.
  const handleModelAction = async (name: string, action: "load" | "unload") => {
    setAiBusyModel(name);
    setAiTestMessage("");
    try {
      const res = await fetch(`/api/ai/models/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: name }),
      });
      const json = await res.json();
      setAiTestMessage(
        json.success
          ? `OK: ${name} ${action === "load" ? "loaded into memory" : "released"}.`
          : `Failed: ${json.error || "unknown error"}`
      );
      await loadAiModels();
      await loadAiStatus();
    } catch (e: any) {
      setAiTestMessage(`Failed: ${e?.message || e}`);
    } finally {
      setAiBusyModel(null);
    }
  };

  const handleCloseApp = useCallback(async () => {
    // The character editor holds edits that are not written until Save. Warn
    // before letting those go.
    const desktop = (window as any).chararchive;

    if (isEditingCreator || isDeveloperModalOpen) {
      if (desktop?.confirmClose) {
        const discard = await desktop.confirmClose(
          "The editor is open with changes that have not been saved."
        );
        if (!discard) return;
      } else if (!window.confirm("You have unsaved changes. Close anyway?")) {
        return;
      }
    }

    if (desktop?.requestClose) {
      await desktop.requestClose();
      return;
    }
    window.close();
  }, [isEditingCreator, isDeveloperModalOpen]);

  // Second line of defence: the window's own close button, keyboard shortcut,
  // or taskbar close should warn too when the editor holds unsaved work.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isEditingCreator || isDeveloperModalOpen) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isEditingCreator, isDeveloperModalOpen]);

  const [aiTopBarBusy, setAiTopBarBusy] = useState<"load" | "unload" | null>(null);

  // Name of the model the server says it will use for images.
  const [aiActiveVisionModel, setAiActiveVisionModel] = useState<string | null>(null);

  // The model the engine would use for an image right now, and whether it is
  // resident in memory. The server reports the name because it owns the
  // selection rule; guessing here could offer to load a model that analysis
  // never uses, which makes the button look broken. The list is only a
  // fallback for when the server could not name one.
  const aiActiveModel = useMemo(() => {
    if (aiActiveVisionModel) return aiActiveVisionModel;
    const enabled: any[] = (aiLocalModels || []).filter((m) => m.enabled !== false);
    if (!enabled.length) return null;
    const vision = enabled.filter((m) => /vision|vl|llava|bakllava|moondream|minicpm|gemma3/i.test(m.name));
    return (vision[0] || enabled[0])?.name || null;
  }, [aiLocalModels, aiActiveVisionModel]);

  const aiActiveModelLoaded = useMemo(
    () => Boolean((aiLocalModels || []).find((m) => m.name === aiActiveModel)?.loaded),
    [aiLocalModels, aiActiveModel]
  );

  const handleTopBarLoadModel = async () => {
    if (!aiActiveModel) return;
    setAiTopBarBusy("load");
    try {
      await handleModelAction(aiActiveModel, "load");
    } finally {
      setAiTopBarBusy(null);
    }
  };

  const handleTopBarUnloadModel = async () => {
    if (!aiActiveModel) return;
    setAiTopBarBusy("unload");
    try {
      await handleModelAction(aiActiveModel, "unload");
    } finally {
      setAiTopBarBusy(null);
    }
  };

  const handleToggleModel = async (name: string, enabled: boolean) => {
    setAiBusyModel(name);
    setAiTestMessage("");
    try {
      const res = await fetch("/api/ai/models/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: name, enabled }),
      });
      const json = await res.json();
      if (!json.success) {
        setAiTestMessage(`Failed: ${json.error || "unknown error"}`);
      } else {
        setAiTestMessage(`OK: ${name} switched ${enabled ? "on" : "off"}.`);
      }
      await loadAiModels();
      await loadAiStatus();
    } catch (e: any) {
      setAiTestMessage(`Failed: ${e?.message || e}`);
    } finally {
      setAiBusyModel(null);
    }
  };

  const handleSaveAiSettings = async () => {
    setAiSettingsSaving(true);
    setAiTestMessage("");
    try {
      const res = await fetch("/api/settings/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ai: aiDraft }),
      });
      const json = await res.json();
      if (json.success) {
        setAiTestMessage("OK: Settings saved.");
        await loadAiSettings();
      } else {
        setAiTestMessage(`Failed: ${json.error || "unknown error"}`);
      }
    } catch (e: any) {
      setAiTestMessage(`Failed: ${e?.message || e}`);
    } finally {
      setAiSettingsSaving(false);
    }
  };

  const handleClearEditorialKey = async () => {
    setAiSettingsSaving(true);
    try {
      await fetch("/api/settings/ai/clear-key", { method: "POST" });
      setAiDraft((d: any) => ({ ...d, editorialApiKey: "" }));
      setAiTestMessage("Saved key removed from this computer.");
      await loadAiSettings();
    } finally {
      setAiSettingsSaving(false);
    }
  };

  const handleTestEditorialKey = async () => {
    setAiSettingsSaving(true);
    setAiTestMessage("");
    try {
      const res = await fetch("/api/settings/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: aiDraft.editorialApiKey.trim() }),
      });
      const json = await res.json();
      setAiTestMessage(
        json.success ? `OK: ${json.message}` : `Failed: ${json.message || "unknown error"}`
      );
    } catch (e: any) {
      setAiTestMessage(`Failed: ${e?.message || e}`);
    } finally {
      setAiSettingsSaving(false);
    }
  };

  const handleCheckOllama = async () => {
    setAiSettingsSaving(true);
    try {
      const res = await fetch("/api/settings/ai/check-ollama", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ollamaBaseUrl: aiDraft.ollamaBaseUrl }),
      });
      const json = await res.json();
      if (json.running && json.resolvedUrl) {
        setAiDraft((d: any) => ({ ...d, ollamaBaseUrl: json.resolvedUrl }));
      }
      await loadAiSettings();
    } finally {
      setAiSettingsSaving(false);
    }
  };

  useEffect(() => {
    loadAiSettings();
    loadAiStatus();
    loadAiModels();
  }, [loadAiSettings, loadAiStatus, loadAiModels]);

  const fetchBackupData = async () => {
    setBackupLoading(true);
    try {
      const res = await fetch("/api/backup-source");
      const json = await res.json();
      if (json.success) {
        setBackupData(json);
        if (json.files && Object.keys(json.files).length > 0) {
          setSelectedBackupFile(Object.keys(json.files)[0]);
        }
      } else {
        alert("Failed to load backup data from server.");
      }
    } catch (e) {
      console.error(e);
      alert("Error contacting the backup API server.");
    } finally {
      setBackupLoading(false);
    }
  };

  const generateBackupText = () => {
    if (!backupData) return "";
    
    let text = `================================================================================
                    CHARARCHIVE - COMPLETE SYSTEM BACKUP
================================================================================
Backup Generated On: ${new Date().toLocaleString()}
Application Creation Date: June 28, 2026 (Alberto Armentero)

--------------------------------------------------------------------------------
1. PROFILE CONFIGURATIONS & REGISTERED IDENTITIES
--------------------------------------------------------------------------------
CREATOR PROFILE:
  - Name: ${creatorProfile.name}
  - Role: ${creatorProfile.role}
  - Date Created: June 28, 2026
  - Bio: ${creatorProfile.bio}

ACTIVE USER PROFILE:
  - ID: ${activeUserProfile.id}
  - Name: ${activeUserProfile.name || "Anonymous User"}
  - Role: ${activeUserProfile.role || "Not Configured"}
  - Bio: ${activeUserProfile.bio || "No Bio Provided"}

ALL REGISTERED USER PROFILES:
${userProfiles.map((p, idx) => `  [Profile #${idx + 1}]
  - ID: ${p.id}
  - Name: ${p.name || "Unnamed User"}
  - Role: ${p.role || "Not Specified"}
  - Bio: ${p.bio || "None"}`).join("\n\n")}

--------------------------------------------------------------------------------
2. LIVE APP STATS & DETAILED INFORMATION
--------------------------------------------------------------------------------
Current Number of Scanned Archive Items: ${items?.length || 0}
Current Number of Cataloged Characters: ${characters?.length || 0}
Defined Custom Categories: ${customCategories?.map(c => c.name).filter(Boolean).join(", ") || "None"}
System Key Features:
  - Advanced Multi-model AI Fallback Engine (with automatic recovery)
  - Character turnaround and pose consolidation to prevent over-counting
  - Color palette selection, manual color-picking, and automated palette extraction
  - Structured nested categories (Unlimited depth sorting workspace)
  - Custom user profiles support with quick swapping and secure pinning
  - Image cropping module for precise face extraction and cataloging
  - Interactive media player and document reader interface

--------------------------------------------------------------------------------
3. TECHNICAL ARCHITECTURE SPECIFICATIONS
--------------------------------------------------------------------------------
Framework: React 18 + Vite + TypeScript (Full-Stack Express App)
Deployment: Cloud Run Container Ingress
Server Configuration: Port 3000 (Exposed proxy)
Core Engine: AI Multimodal Analyzer & Text Cataloger
AI Model Fallbacks: local, editorial-flash, editorial-pro
Storage System: LocalStorage Persistent Client Caches (profiles, settings, lists)

--------------------------------------------------------------------------------
4. COMPLETE WORKSPACE SOURCE CODE FILES
--------------------------------------------------------------------------------
`;

    Object.entries(backupData.files).forEach(([filename, content]) => {
      text += `\n\n================================================================================\n`;
      text += `FILE: ${filename}\n`;
      text += `================================================================================\n\n`;
      text += content;
    });

    return text;
  };

  const downloadBackupAsText = () => {
    if (!backupData) return;
    const text = generateBackupText();
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chararchive_backup_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setBackupSuccessMessage("Backup downloaded successfully as text file!");
    setTimeout(() => setBackupSuccessMessage(""), 4000);
  };

  const openBackupPrintablePDF = () => {
    if (!backupData) return;
    
    // Create a new browser tab/window for print layout
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to open the printable PDF view.");
      return;
    }

    // Pre-construct nested listings safely as simple strings to avoid parser issues
    const userProfilesHtml = userProfiles.map((p, idx) => {
      const activeText = p.id === activeUserProfile.id ? ' (Active)' : '';
      return '<div class="profile-card">' +
        '<strong>USER PROFILE #' + (idx + 1) + activeText + '</strong><br/>' +
        'Name: ' + (p.name || "Unnamed User") + '<br/>' +
        'Role: ' + (p.role || "Not Specified") + '<br/>' +
        'Bio: ' + (p.bio || "None") + '<br/>' +
        'ID: ' + p.id +
        '</div>';
    }).join("");

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
        '<span>June 28, 2026</span>' +
        '</div>' +
        '<pre><code>' + escapedContent + '</code></pre>' +
        '</div>';
    }).join("");

    const customCategoriesString = customCategories?.map(c => c.name).filter(Boolean).join(", ") || "None";
    const appStatsHtml = '<ul>' +
      '<li><strong>Total Scanned Assets:</strong> ' + (items?.length || 0) + ' items</li>' +
      '<li><strong>Total Cataloged Entities:</strong> ' + (characters?.length || 0) + ' characters</li>' +
      '<li><strong>Defined Custom Categories:</strong> ' + customCategoriesString + '</li>' +
      '</ul>';

    const generatedDateStr = new Date().toLocaleString();

    // Construct premium printable HTML
    printWindow.document.write(`
      <html>
        <head>
          <title>CharArchive Backup - June 28, 2026</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=JetBrains+Mono:wght@400;500&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              color: #111827;
              line-height: 1.5;
              padding: 40px;
              max-width: 900px;
              margin: 0 auto;
              background-color: #ffffff;
            }
            h1 {
              font-size: 28px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: -0.025em;
              border-bottom: 3px solid #111827;
              padding-bottom: 12px;
              margin-bottom: 30px;
            }
            h2 {
              font-size: 18px;
              font-weight: 700;
              border-bottom: 1.5px solid #e5e7eb;
              padding-bottom: 8px;
              margin-top: 40px;
              margin-bottom: 16px;
              text-transform: uppercase;
              color: #374151;
            }
            .meta-box {
              background-color: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 24px;
            }
            .meta-grid {
              display: grid;
              grid-template-cols: 1fr 1fr;
              gap: 16px;
            }
            .meta-item label {
              display: block;
              font-size: 11px;
              font-weight: 600;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              margin-bottom: 4px;
            }
            .meta-item .value {
              font-size: 14px;
              font-weight: 500;
              color: #111827;
            }
            .profile-card {
              border-left: 4px solid #111827;
              background-color: #f9fafb;
              padding: 16px;
              margin-bottom: 16px;
              border-radius: 0 8px 8px 0;
            }
            .file-section {
              margin-top: 30px;
              page-break-before: always;
            }
            .file-header {
              font-family: 'JetBrains Mono', monospace;
              background-color: #111827;
              color: #ffffff;
              padding: 10px 16px;
              font-size: 13px;
              font-weight: 600;
              border-radius: 6px 6px 0 0;
              display: flex;
              justify-content: space-between;
            }
            pre {
              font-family: 'JetBrains Mono', monospace;
              font-size: 11px;
              background-color: #f9fafb;
              border: 1px solid #e5e7eb;
              border-top: none;
              padding: 16px;
              margin: 0;
              border-radius: 0 0 6px 6px;
              overflow-x: auto;
              white-space: pre-wrap;
              word-break: break-all;
            }
            @media print {
              body {
                padding: 20px;
                font-size: 11px;
              }
              pre {
                font-size: 9px;
                background-color: #ffffff;
                border: 1px solid #cccccc;
              }
              .no-print {
                display: none;
              }
              .file-section {
                page-break-before: always;
              }
            }
            .toolbar {
              position: fixed;
              bottom: 20px;
              right: 20px;
              background: #111827;
              color: #ffffff;
              padding: 12px 24px;
              border-radius: 50px;
              box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);
              display: flex;
              gap: 16px;
              align-items: center;
              font-size: 13px;
              z-index: 9999;
            }
            .toolbar button {
              background: #2563eb;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 20px;
              font-weight: 600;
              cursor: pointer;
              transition: background 0.2s;
            }
            .toolbar button:hover {
              background: #1d4ed8;
            }
          </style>
        </head>
        <body>
          <div class="toolbar no-print">
            <span>Ready to print/save as PDF. Click button to launch dialog:</span>
            <button onclick="window.print()">Print / Save PDF</button>
            <button style="background: #4b5563;" onclick="window.close()">Close</button>
          </div>

          <h1>CharArchive System Backup</h1>
          <div class="meta-box">
            <div class="meta-grid">
              <div class="meta-item">
                <label>Backup Generated</label>
                <div class="value">${generatedDateStr}</div>
              </div>
              <div class="meta-item">
                <label>App Date Created</label>
                <div class="value">June 28, 2026</div>
              </div>
              <div class="meta-item">
                <label>Creator Profile Name</label>
                <div class="value">${creatorProfile.name}</div>
              </div>
              <div class="meta-item">
                <label>Active User Profile Name</label>
                <div class="value">${activeUserProfile.name || "Anonymous User"}</div>
              </div>
            </div>
          </div>

          <h2>System Overview & Specifications</h2>
          <p>
            CharArchive is an advanced digital character scanner, scanning workspace, and media archive system.
            It utilizes Vite, React, TypeScript, and a full-stack Node.js/Express server to orchestrate local caches,
            multimodal AI analyses, automatic duplicate detection, and visual cataloging. This file serves
            as a complete standalone archive and backup of the entire ecosystem as of <strong>June 28, 2026</strong>.
          </p>

          <div class="meta-box">
            <h3>Current Live Application Stats</h3>
            ${appStatsHtml}
          </div>

          <h2>Registered Profiles Listing</h2>
          <div class="profile-card">
            <strong>CREATOR / STUDIO PROFILE</strong><br/>
            Name: ${creatorProfile.name}<br/>
            Role: ${creatorProfile.role}<br/>
            Bio: ${creatorProfile.bio}<br/>
            Date Created: June 28, 2026
          </div>

          ${userProfilesHtml}

          <h2>Source Code Directory Index</h2>
          <ul>
            ${fileIndexHtml}
          </ul>

          <h2>Complete File Source Codes</h2>
          ${fileContentsHtml}

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            }
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    setBackupSuccessMessage("Backup print window opened! You can now print/save as PDF.");
    setTimeout(() => setBackupSuccessMessage(""), 4000);
  };
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isEditingCharacters, setIsEditingCharacters] = useState(false);
  const [selectedCharactersToClear, setSelectedCharactersToClear] = useState<
    Set<string>
  >(new Set());

  const [isEditingCategories, setIsEditingCategories] = useState(false);
  const [selectedCategoriesToClear, setSelectedCategoriesToClear] = useState<
    Set<string>
  >(new Set());

  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [isEditingUserProfile, setIsEditingUserProfile] = useState(false);
  const [isCreatingUserProfile, setIsCreatingUserProfile] = useState(false);
  const [userProfileForm, setUserProfileForm] = useState(activeUserProfile);

  const [modalForm, setModalForm] = useState(creatorProfile);
  const [originalProfile, setOriginalProfile] = useState(creatorProfile);
  const [items, setItems] = useState<ArchiveItem[]>(() => {
    const saved = safeGetStorage("archive_items");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure STAN_DEFAULT_ITEM and ARTIE_DEFAULT_ITEM are in items
          const hasArtie = parsed.some(it => it.id === ARTIE_DEFAULT_ITEM.id);
          const hasStan = parsed.some(it => it.id === STAN_DEFAULT_ITEM.id);
          const updated = [...parsed];
          if (!hasArtie) updated.push(ARTIE_DEFAULT_ITEM);
          if (!hasStan) updated.push(STAN_DEFAULT_ITEM);
          return updated;
        }
      } catch (e) {}
    }
    return [DOCK_DEFAULT_ITEM, ARTIE_DEFAULT_ITEM, STAN_DEFAULT_ITEM];
  });
  const [characters, setCharacters] = useState<Character[]>(() => {
    const saved = safeGetStorage("archive_characters");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure ARTIE_DEFAULT_CHARACTER is in characters and fully populated
          const hasArtie = parsed.some(c => c.id === ARTIE_DEFAULT_CHARACTER.id);
          let updated = parsed.map(c => {
            if (c.id === ARTIE_DEFAULT_CHARACTER.id) {
              return {
                ...ARTIE_DEFAULT_CHARACTER,
                ...c,
                audios: (c.audios && c.audios.length > 0) ? c.audios : ARTIE_DEFAULT_CHARACTER.audios,
                videos: (c.videos && c.videos.length > 0) ? c.videos : ARTIE_DEFAULT_CHARACTER.videos,
                projects: (c.projects && c.projects.length > 0) ? c.projects : ARTIE_DEFAULT_CHARACTER.projects,
                biblePages: (c.biblePages && c.biblePages.length > 0) ? c.biblePages : ARTIE_DEFAULT_CHARACTER.biblePages,
                relationships: (c.relationships && c.relationships.length > 0) ? c.relationships : ARTIE_DEFAULT_CHARACTER.relationships,
                attributes: { ...ARTIE_DEFAULT_CHARACTER.attributes, ...(c.attributes || {}) },
                codeFiles: (c.codeFiles && c.codeFiles.length > 0) ? c.codeFiles : ARTIE_DEFAULT_CHARACTER.codeFiles,
                genericFiles: (c.genericFiles && c.genericFiles.length > 0) ? c.genericFiles : ARTIE_DEFAULT_CHARACTER.genericFiles,
                completionRating: '100% - Fully Rigged 3D Mascot Concept'
              };
            }
            return c;
          });
          if (!hasArtie) updated.push(ARTIE_DEFAULT_CHARACTER);
          return updated;
        }
      } catch (e) {}
    }
    return [ARTIE_DEFAULT_CHARACTER];
  });
  
  const [historyCharacters, setHistoryCharacters] = useState<Character[]>(() => {
    const saved = safeGetStorage("archive_history_characters");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [DOCK_DEFAULT_CHARACTER, STAN_DEFAULT_CHARACTER];
  });
  
  useEffect(() => {
    safeSetStorage("archive_history_characters", JSON.stringify(historyCharacters));
  }, [historyCharacters]);
  
  const [lastAddedItemId, setLastAddedItemId] = useState<string | null>(null);

  const [categoryClipboard, setCategoryClipboard] = useState<
    { name: string; parentId?: string }[]
  >([]);
  const [showDuplicatesModal, setShowDuplicatesModal] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState<{hash: string, originalName: string, items: ArchiveItem[]}[]>([]);
  const [characterClipboard, setCharacterClipboard] = useState<string[]>([]);

  const [customCategories, setCustomCategories] = useState<
    { id: string; name: string; parentId?: string }[]
  >(() => {
    const saved = safeGetStorage("custom_categories");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((c) => c.id !== "total");
        }
      } catch (e) {
        // Fallback below
      }
    }
    return [
      { id: "male", name: "Male" },
      { id: "female", name: "Female" },
      { id: "others", name: "Others" },
      { id: "objects", name: "Objects" },
    ];
  });
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >(() => {
    const saved = safeGetStorage("expanded_categories");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {};
  });
  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "images"
    | "text"
    | "groups"
    | "categoryDetail"
    | "favorites"
    | "database"
    | "spreadsheet"
    | "windows"
    | "arcade"
    | "showcase"
    | "moodboard"
  >(() => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 1024 || "ontouchstart" in window) {
        return "showcase";
      }
    }
    return "dashboard";
  });
  const [isLeftPanelVisible, setIsLeftPanelVisible] = useState(false);
  const [isRightPanelVisible, setIsRightPanelVisible] = useState(false);
  const [isHeaderControlsHidden, setIsHeaderControlsHidden] = useState(true);
  const [isOverviewSectionHidden, setIsOverviewSectionHidden] = useState(true);
  const [isViewModePanelOpen, setIsViewModePanelOpen] = useState(false);
  const [isFrontDropZoneOpen, setIsFrontDropZoneOpen] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isGroup, setIsGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [isHeaderDragging, setIsHeaderDragging] = useState(false);
  const headerFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const cancelUploadRef = useRef(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadCompletedCount, setUploadCompletedCount] = useState(0);
  const [uploadTotalCount, setUploadTotalCount] = useState(0);
  const [uploadErrors, setUploadErrors] = useState<
    { fileName: string; error: string }[]
  >([]);

  const addCustomCategory = (name: string) => {
    setCustomCategories((prev) => [...prev, { id: uuidv4(), name }]);
  };

  const [deletedCategoryNames, setDeletedCategoryNames] = useState<string[]>(
    () => {
      const saved = safeGetStorage("deleted_category_names");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
      return [];
    },
  );

  useEffect(() => {
    safeSetStorage(
      "deleted_category_names",
      JSON.stringify(deletedCategoryNames),
    );
  }, [deletedCategoryNames]);

  const deleteCustomCategory = (id: string) => {
    const cat = customCategories.find((c) => c.id === id);
    if (cat) {
      setConfirmModal({
        isOpen: true,
        title: "Delete Category",
        message: `Are you sure you want to delete the category "${cat.name}"?`,
        confirmText: "Delete",
        type: "danger",
        onConfirm: () => {
          setDeletedCategoryNames((prev) => [...prev, cat.name]);
          setCustomCategories((prev) => prev.filter((c) => c.id !== id));
          setCharacters((prevChars) =>
            prevChars.map((c) => {
              if (c.name === cat.name && c.isUniqueName !== false) {
                return { ...c, isUniqueName: false };
              }
              return c;
            }),
          );
        },
      });
    } else {
      setCustomCategories((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const renameCustomCategory = (id: string, name: string) => {
    setCustomCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name } : c)),
    );
  };

  const setCustomCategoryParent = (
    id: string,
    parentId: string | undefined,
  ) => {
    setCustomCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, parentId } : c)),
    );
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setCustomCategories((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleCharacterDragEnd = (event: any) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      const activeName = active.id;
      const overName = over.id;

      const uniqueNames = getUniqueCharacterNames().map((c) => c.name);
      const currentOrder =
        characterOrder.length > 0 ? characterOrder : uniqueNames;

      const newOrder = [...currentOrder];
      // ensure both exist
      if (!newOrder.includes(activeName)) newOrder.push(activeName);
      if (!newOrder.includes(overName)) newOrder.push(overName);

      const oldIndex = newOrder.indexOf(activeName);
      const newIndex = newOrder.indexOf(overName);

      setCharacterOrder(arrayMove(newOrder, oldIndex, newIndex));
    }
  };

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    type?: "danger" | "warning" | "info";
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    type: "info",
    onConfirm: () => {},
  });

  const [appTitle, setAppTitle] = useState("Armstech Artchiver Database Analyzer");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isFeatureHelpOpen, setIsFeatureHelpOpen] = useState(false);

  const [user, setUser] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const [tabNames, setTabNames] = useState({
    dashboard: "Dashboard",
    images: "Images",
    text: "Documents",
    groups: "Project Groups",
    favorites: "Favorites",
    database: "Database",
    spreadsheet: "Spreadsheet",
    windows: "Windows App",
    arcade: "Arcade Room",
    showcase: "Showcase View",
    moodboard: "Mood Board"
  });

  const [categoryRenames, setCategoryRenames] = useState<
    Record<string, string>
  >({});

  // Apply theme to document
  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  // Persist state changes to LocalStorage
  useEffect(() => {
    safeSetStorage("theme", theme);
  }, [theme]);

  useEffect(() => {
    safeSetStorage("scanMode", scanMode);
  }, [scanMode]);

  useEffect(() => {
    safeSetStorage("countingMode", countingMode);
  }, [countingMode]);

  useEffect(() => {
    safeSetStorage("imageSplitMode", imageSplitMode);
  }, [imageSplitMode]);

  useEffect(() => {
    safeSetStorage("sidebarWidth", String(sidebarWidth));
  }, [sidebarWidth]);

  useEffect(() => {
    safeSetStorage("rightSidebarWidth", String(rightSidebarWidth));
  }, [rightSidebarWidth]);

  useEffect(() => {
    safeSetStorage("creatorProfile", JSON.stringify(creatorProfile));
  }, [creatorProfile]);

  useEffect(() => {
    safeSetStorage("archive_items", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    safeSetStorage("archive_characters", JSON.stringify(characters));
  }, [characters]);

  useEffect(() => {
    safeSetStorage("custom_categories", JSON.stringify(customCategories));
  }, [customCategories]);

  // Synchronize custom categories with unique character names
  useEffect(() => {
    const uniqueNames = Array.from(
      new Set(
        characters
          .filter((c) => c.isUniqueName !== false && !isNameGeneric(c.name))
          .map((c) => c.name)
          .filter(Boolean),
      ),
    );

    setCustomCategories((prev) => {
      let updated = [...prev];
      let changed = false;

      // Add missing categories
      uniqueNames.forEach((name) => {
        if (
          !updated.some((c) => c.name === name) &&
          !deletedCategoryNames.includes(name)
        ) {
          updated.push({ id: uuidv4(), name });
          changed = true;
        }
      });

      // Remove automatically created categories that no longer match any unique character name
      const initialLength = updated.length;
      updated = updated.filter((cat) => {
        if (deletedCategoryNames.includes(cat.name)) return false;

        const hasChar = characters.some(
          (c) =>
            c.name === cat.name &&
            c.isUniqueName !== false &&
            !isNameGeneric(c.name),
        );
        const hasChildren = prev.some((child) => child.parentId === cat.id);

        if (uniqueNames.includes(cat.name)) return true;
        if (hasChildren) return true;

        const matchesAnyChar = characters.some((c) => c.name === cat.name);
        if (matchesAnyChar) {
          return hasChar;
        }
        return true;
      });

      if (updated.length !== initialLength || changed) {
        return updated;
      }
      return prev;
    });
  }, [characters, deletedCategoryNames]);

  useEffect(() => {
    safeSetStorage(
      "expanded_categories",
      JSON.stringify(expandedCategories),
    );
  }, [expandedCategories]);

  useEffect(() => {
    safeSetStorage("appTitle", appTitle);
  }, [appTitle]);

  // Init Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setUser(user);
        setIsAuthChecking(false);
      },
      () => {
        setUser(null);
        setIsAuthChecking(false);
      },
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await googleSignIn();
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error(e);
    }
  };

  // Robust fetch wrapper that supports automatic retries with exponential backoff on transient errors
  const fetchWithRetry = async (
    url: string,
    options: RequestInit,
    retries = 3,
    delay = 1500,
  ): Promise<Response> => {
    try {
      const response = await fetch(url, options);
      
      const isApiRoute = url.includes("/api/");
      const contentType = response.headers.get("content-type") || "";
      const isHtmlResponseForApi = isApiRoute && contentType.includes("text/html");

      // Retry on transient status codes like 429 (Quota), 500, 502, 503 (High Demand), 504
      // OR if an API route returns HTML (which implies the dev server loading screen)
      if (
        ((!response.ok && (response.status === 429 || response.status >= 500)) || isHtmlResponseForApi) &&
        retries > 0
      ) {
        console.warn(
          `Fetch to ${url} returned status ${response.status} (isHtmlForApi: ${isHtmlResponseForApi}). Retrying in ${delay}ms... (${retries} retries left)`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retries - 1, delay * 1.5);
      }
      return response;
    } catch (error) {
      if (retries > 0) {
        console.warn(
          `Fetch to ${url} failed with error: ${error}. Retrying in ${delay}ms... (${retries} retries left)`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retries - 1, delay * 1.5);
      }
      throw error;
    }
  };

  const processFiles = async (files: File[], isGroup: boolean, groupName: string) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    cancelUploadRef.current = false;
    setUploadProgress(0);
    setUploadCompletedCount(0);
    setUploadTotalCount(0);
    setUploadErrors([]);

    let allFilesToProcess: File[] = [];

    for (const file of files) {
      if (cancelUploadRef.current) break;
      if (file.name.endsWith(".zip") || file.name.endsWith(".cbz")) {
        const zip = new JSZip();
        const loadedZip = await zip.loadAsync(file);
        for (const [relativePath, zipEntry] of Object.entries(
          loadedZip.files,
        )) {
          if (!zipEntry.dir) {
            const blob = await zipEntry.async("blob");
            allFilesToProcess.push(
              new File([blob], zipEntry.name, { type: file.type }),
            );
          }
        }
      } else {
        allFilesToProcess.push(file);
      }
    }
    
    setUploadTotalCount(allFilesToProcess.length);
    let completed = 0;
    const batchItems: ArchiveItem[] = [];
    const batchNewChars: Character[] = [];

    for (const file of allFilesToProcess) {
      if (cancelUploadRef.current) {
        break;
      }
      
      // Stagger uploads slightly to respect API rate limits under free tier
      if (completed > 0) {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      const isImage =
        file.type.startsWith("image/") ||
        file.name.match(/\.(jpg|jpeg|png|webp|gif)$/i);
      
      // Limit file size to 500MB to avoid 413 errors
      if (file.size > 500 * 1024 * 1024) {
        alert(`File ${file.name} is too large (> 500MB).`);
        continue;
      }
      
      const endpoint = isImage ? "/api/analyze-image" : "/api/analyze-text";
      const formData = new FormData();
      formData.append(isImage ? "image" : "text", file);
      formData.append("mode", scanMode);
      formData.append("countingMode", countingMode);
      formData.append("imageSplitMode", imageSplitMode);

      try {
        const response = await fetchWithRetry(endpoint, {
          method: "POST",
          body: formData,
        }, 5, 3000);

        if (!response.ok) {
          let errorText = await response.text();
          throw new Error(`Analysis failed: ${response.status} ${errorText}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          throw new Error(
            `Expected JSON but got ${contentType}: ${text.substring(0, 100)}`,
          );
        }

        const result = await response.json();
        const itemId = uuidv4();

        let contentStr = "";
        if (isImage) {
          contentStr = URL.createObjectURL(file);
        } else {
          contentStr = await file.text();
        }

        const fileHash = await computeFileHash(file);
        
        let thumbnailContent: string | undefined;
        if (isImage && result.thumbnailBoundingBox && result.thumbnailBoundingBox.length === 4) {
          thumbnailContent = await generateThumbnail(file, result.thumbnailBoundingBox);
        }

        const initialGroupName = isGroup ? (groupName.trim() || "") : "";
        
        const newItem: ArchiveItem = {
          id: itemId,
          type: isImage ? "image" : "text",
          content: contentStr,
          thumbnailContent: thumbnailContent,
          originalName: result.suggestedTitle || file.name,
          hash: fileHash,
          description: isImage
            ? result.imageDescription
            : `Text document with ${result.totalCharacterCount || result.characters?.length || 0} characters found.`,
          isSketch: result.isSketch,
          charactersCount:
            result.totalCharacterCount ||
            (result.hasCharacters || result.characters
              ? result.characters?.length || 0
              : 0),
          fileDate: file.lastModified,
          artStyle: result.artStyle,
          medium: result.medium,
          rating: result.rating,
          fileSize: file.size,
          isGroup: isGroup,
          groupName: initialGroupName,
        };

        batchItems.push(newItem);
        setItems((prev) => [...prev, newItem]);
        setLastAddedItemId(newItem.id);

        if (result.characters && result.characters.length > 0) {
          const fileChars: Character[] = [];
          for (const c of result.characters) {
            const nameVal = c.suggestedName || c.name || "Unknown";
            const suggestedIsUnique =
              c.isUniqueName !== undefined ? c.isUniqueName : true;
              
            let highlightedImageSrc: string | undefined = undefined;
            if (isImage && c.boundingBox && c.boundingBox.length === 4 && imageSplitMode === 'highlight') {
                try {
                    highlightedImageSrc = await generateHighlightedFeatureImage(file, c.boundingBox);
                } catch(e) { console.warn(e); }
            }

            const subImages: SubImage[] = [];
            if (isImage && c.featuresOfInterest && Array.isArray(c.featuresOfInterest)) {
              for (const feat of c.featuresOfInterest) {
                if (feat.boundingBox && feat.boundingBox.length === 4) {
                  try {
                    const croppedSrc = imageSplitMode === 'crop' 
                        ? await generateFeatureCrop(file, feat.boundingBox)
                        : await generateHighlightedFeatureImage(file, feat.boundingBox);
                    subImages.push({
                      id: 'sub-' + Math.random().toString(36).substring(2, 9),
                      src: croppedSrc,
                      title: feat.title || "Detail Spot",
                      description: feat.description || "Auto-detected interesting area or emblem."
                    });
                  } catch (cropErr) {
                    console.warn("Failed to generate auto-crop for feature:", feat.title, cropErr);
                  }
                }
              }
            }

            let dateCreated = undefined;
            let dateCreatedSource = undefined;
            if (c.dateWrittenOnMedia) {
              dateCreated = c.dateWrittenOnMedia;
              dateCreatedSource = isImage ? 'From Image' : 'From Text';
            } else if (file.lastModified) {
              dateCreated = new Date(file.lastModified).toLocaleDateString();
              dateCreatedSource = 'From File Property';
            }

            const charCategories = initialGroupName ? [initialGroupName] : [];
            const charProjects = initialGroupName ? [{
              id: uuidv4(),
              projectName: initialGroupName,
              roleOrRelation: "Primary Project Asset",
              status: "In Progress" as const,
              description: `Uploaded as part of project group '${initialGroupName}'`
            }] : [];

            const createdChar: Character = {
              id: uuidv4(),
              name: nameVal,
              dateCreated,
              dateCreatedSource,
              gender: c.gender || "Others",
              species: c.species || "Unknown",
              description: c.description || "",
              isSketch: c.isSketchStatus || false,
              status: isImage && result.isSketch ? "Unsorted" : "Sorted",
              sourceId: itemId,
              sourceType: isImage ? "image" : "text",
              entityType: c.entityType || "Character",
              completionRating: c.completionRating || "",
              colorPalette: c.colorPalette || [],
              originalColorPalette: c.colorPalette || [],
              isFavorite: false,
              isUniqueName: suggestedIsUnique && !isNameGeneric(nameVal),
              highlightedImageSrc: highlightedImageSrc,
              defaultThumbnailSrc: thumbnailContent || contentStr,
              subImages: subImages.length > 0 ? subImages : undefined,
              layoutMode: subImages.length > 0 ? "timeline" : "grid",
              categories: charCategories.length > 0 ? charCategories : undefined,
              projects: charProjects.length > 0 ? charProjects : undefined,
            };

            fileChars.push(createdChar);
            batchNewChars.push(createdChar);
          }
          setCharacters((prev) => [...prev, ...fileChars]);
        }
      } catch (err: any) {
        console.warn("Error uploading file", file.name, err);
        setUploadErrors((prev) => [
          ...prev,
          { fileName: file.name, error: err.message || String(err) },
        ]);
      }

      completed++;
      setUploadCompletedCount(completed);
      setUploadProgress((completed / allFilesToProcess.length) * 100);

      if (completed === allFilesToProcess.length) {
        playNotificationSound();
      }
    }

    // Post-upload batch group synthesis if isGroup is true
    if (isGroup && batchItems.length > 0) {
      let userProvidedName = groupName.trim();
      let finalGroupName = userProvidedName;

      if (!finalGroupName) {
        // AI Auto-Synthesis of Project Group Name based on character occurrences and image analysis
        const charNameCounts = new Map<string, number>();
        batchNewChars.forEach(c => {
          if (c.name && !isNameGeneric(c.name)) {
            charNameCounts.set(c.name, (charNameCounts.get(c.name) || 0) + 1);
          }
        });

        let topCharName = "";
        let maxCount = 0;
        charNameCounts.forEach((count, name) => {
          if (count > maxCount) {
            maxCount = count;
            topCharName = name;
          }
        });

        if (topCharName) {
          const distinctNames = new Set(batchNewChars.map(c => c.name));
          if (distinctNames.size > 1) {
            finalGroupName = `${topCharName} & Assets`;
          } else {
            finalGroupName = `${topCharName} Model Sheet Group`;
          }
        } else if (batchItems[0] && batchItems[0].originalName) {
          const baseName = batchItems[0].originalName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
          finalGroupName = `${baseName} Collection`;
        } else {
          finalGroupName = `Project Group (${new Date().toLocaleDateString()})`;
        }
      }

      // Determine top character for role assignments
      const charCounts = new Map<string, number>();
      batchNewChars.forEach(c => charCounts.set(c.name, (charCounts.get(c.name) || 0) + 1));
      let mainCharName = "";
      let topCount = 0;
      charCounts.forEach((cnt, nm) => {
        if (cnt > topCount && !isNameGeneric(nm)) {
          topCount = cnt;
          mainCharName = nm;
        }
      });

      const batchItemIds = new Set(batchItems.map(i => i.id));
      const batchCharIds = new Set(batchNewChars.map(c => c.id));

      // Update items in state with finalGroupName
      setItems(prev => prev.map(item => {
        if (batchItemIds.has(item.id)) {
          return {
            ...item,
            isGroup: true,
            groupName: finalGroupName
          };
        }
        return item;
      }));

      // Update characters in state with finalGroupName, category, and roleOrRelation
      setCharacters(prev => prev.map(char => {
        if (batchCharIds.has(char.id)) {
          let role = "Primary Project Asset";
          if (char.entityType === 'Objects' || char.entityType === 'Prop') {
            role = "Special Prop / Object";
          } else if (char.entityType === 'Vehicle') {
            role = "Vehicle / Transport";
          } else if (char.name === mainCharName) {
            role = "Primary Protagonist / Main Subject";
          } else if (batchNewChars.length > 1) {
            role = "Supporting Character / Companion";
          }

          const existingCats = char.categories || [];
          const updatedCats = Array.from(new Set([...existingCats.filter(c => c !== ""), finalGroupName]));

          const projRelation: ProjectRelation = {
            id: uuidv4(),
            projectName: finalGroupName,
            roleOrRelation: role,
            status: "In Progress",
            description: `Auto-categorized as ${role} inside project collection '${finalGroupName}'`
          };

          const existingProjs = char.projects || [];
          const updatedProjs = [...existingProjs.filter(p => p.projectName !== finalGroupName), projRelation];

          return {
            ...char,
            categories: updatedCats,
            projects: updatedProjs
          };
        }
        return char;
      }));
    }

    setIsUploading(false);
  };

  const handleScanDuplicates = () => {
    const hashGroups = new Map<string, ArchiveItem[]>();
    const nameSizeGroups = new Map<string, ArchiveItem[]>();

    for (const item of items) {
      if (item.hash) {
        if (!hashGroups.has(item.hash)) hashGroups.set(item.hash, []);
        hashGroups.get(item.hash)!.push(item);
      } else {
        const key = `${item.originalName}_${item.fileSize}`;
        if (!nameSizeGroups.has(key)) nameSizeGroups.set(key, []);
        nameSizeGroups.get(key)!.push(item);
      }
    }

    const duplicates = [];
    for (const [hash, group] of hashGroups.entries()) {
      if (group.length > 1) {
        duplicates.push({ hash, originalName: group[0].originalName, items: group });
      }
    }
    for (const [key, group] of nameSizeGroups.entries()) {
      if (group.length > 1) {
        duplicates.push({ hash: key, originalName: group[0].originalName, items: group });
      }
    }

    setDuplicateGroups(duplicates);
    setShowDuplicatesModal(true);
  };

  const handleExport = async () => {
    const zip = new JSZip();

    // We need to group items into folders based on their characters' status
    for (const item of items) {
      const itemChars = characters.filter((c) => c.sourceId === item.id);
      const targetFolders = new Set<string>();

      let tags = [];
      let finalDescription = item.description || "";

      if (itemChars.length === 0) {
        targetFolders.add("No Characters");
      } else {
        itemChars.forEach((char) => {
          if (char.status === "Duplicate") targetFolders.add("Duplicates");
          else if (char.status === "Unsorted") targetFolders.add("Unsorted");
          else targetFolders.add(char.gender);

          tags.push(char.species, char.gender, char.status);
        });
      }

      const metaText = [
        `File: ${item.originalName}`,
        `Original Date: ${item.fileDate ? new Date(item.fileDate).toLocaleString() : "Unknown"}`,
        `Tags: ${Array.from(new Set(tags)).join(", ")}`,
        `Description: ${finalDescription}`,
        `\n--- Characters (${itemChars.length}) ---`,
        ...itemChars.map(
          (c) =>
            `\nName: ${c.name}\nGender: ${c.gender}\nSpecies: ${c.species}\nStatus: ${c.status}\nDesc: ${c.description}`,
        ),
      ].join("\n");

      let fileData: Blob | string;
      if (item.type === "image") {
        const response = await fetch(item.content);
        fileData = await response.blob();
      } else {
        fileData = item.content;
      }

      // Add file and metadata to all relevant folders
      targetFolders.forEach((folderName) => {
        const folder = zip.folder(folderName);
        if (folder) {
          folder.file(item.originalName, fileData);
          folder.file(item.originalName + ".meta.txt", metaText);
        }
      });
    }

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "CharArchive_Export.zip");
    playNotificationSound();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      let files: File[] = Array.from(e.target.files) as File[];
      if (files.length > 200) {
        alert("You can only upload a maximum of 200 files at once.");
        files = files.slice(0, 200);
      }
      processFiles(files, isGroup, groupName);
    }
  };

  const [characterOrder, setCharacterOrder] = useState<string[]>(() => {
    const saved = safeGetStorage("character_order");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    safeSetStorage("character_order", JSON.stringify(characterOrder));
  }, [characterOrder]);

  const getUniqueCharacterNames = () => {
    const uniqueMap = new Map<string, number>();
    characters.forEach((c) => {
      if (c.isUniqueName !== false) {
        uniqueMap.set(c.name, (uniqueMap.get(c.name) || 0) + 1);
      }
    });
    const list = Array.from(uniqueMap.entries()).map(([name, count]) => ({
      id: name,
      name,
      count,
    }));

    // Sort based on characterOrder
    list.sort((a, b) => {
      const indexA = characterOrder.indexOf(a.name);
      const indexB = characterOrder.indexOf(b.name);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return 0;
    });

    return list;
  };

  const uniqueCharacterNames = getUniqueCharacterNames();

  const clearAll = () => {
    setShowClearConfirm(true);
  };

  const handleSidebarPointerMove = (e: PointerEvent) => {
    if (draggingSidebar === "left") {
      const newWidth = Math.max(200, Math.min(600, e.clientX));
      setSidebarWidth(newWidth);
      safeSetStorage("sidebarWidth", newWidth.toString());
    } else if (draggingSidebar === "right") {
      const newWidth = Math.max(
        200,
        Math.min(600, window.innerWidth - e.clientX),
      );
      setRightSidebarWidth(newWidth);
      safeSetStorage("rightSidebarWidth", newWidth.toString());
    } else if (draggingSidebar === "leftVertical") {
      const newHeight = Math.max(
        100,
        Math.min(window.innerHeight - 200, e.clientY),
      );
      setLeftNavHeight(newHeight);
      safeSetStorage("leftNavHeight", newHeight.toString());
    } else if (draggingSidebar === "rightVertical") {
      const newHeight = Math.max(
        100,
        Math.min(window.innerHeight - 200, e.clientY),
      );
      setRightCategoriesHeight(newHeight);
      safeSetStorage("rightCategoriesHeight", newHeight.toString());
    }
  };

  const handleSidebarPointerUp = () => {
    setDraggingSidebar(null);
  };

  useEffect(() => {
    if (draggingSidebar) {
      document.addEventListener("pointermove", handleSidebarPointerMove);
      document.addEventListener("pointerup", handleSidebarPointerUp);
    } else {
      document.removeEventListener("pointermove", handleSidebarPointerMove);
      document.removeEventListener("pointerup", handleSidebarPointerUp);
    }
    return () => {
      document.removeEventListener("pointermove", handleSidebarPointerMove);
      document.removeEventListener("pointerup", handleSidebarPointerUp);
    };
  }, [draggingSidebar]);

  const handleCloseCreatorModal = () => {
    if (isEditingCreator) {
      if (
        window.confirm(
          "You are currently editing the profile. Do you want to save your changes before closing?\n\nOK: Save and close\nCancel: Discard and close",
        )
      ) {
        setCreatorProfile(modalForm);
      }
    }
    setIsEditingCreator(false);
    setShowCreatorModal(false);
  };

  const handleCloseUserModal = () => {
    if (isEditingUserProfile) {
      if (
        window.confirm(
          "You are currently editing a user profile. Do you want to save your changes before closing?\n\nOK: Save and close\nCancel: Discard and close",
        )
      ) {
        let updatedProfiles = [...userProfiles];
        if (isCreatingUserProfile) {
          const newProfile = { ...userProfileForm, id: uuidv4() };
          updatedProfiles.push(newProfile);
          setActiveUserProfileId(newProfile.id);
        } else {
          updatedProfiles = updatedProfiles.map((p) =>
            p.id === userProfileForm.id ? userProfileForm : p,
          );
        }
        setUserProfiles(updatedProfiles);
      }
    }
    setIsEditingUserProfile(false);
    setIsCreatingUserProfile(false);
    setShowUserProfileModal(false);
  };

  return (
    <div
      className={`min-h-screen bg-background text-foreground flex flex-col md:flex-row transition-colors duration-200 ${draggingSidebar ? "select-none" : ""}`}
    >
      {/* Left Sidebar Backdrop */}
      {isLeftPanelVisible && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsLeftPanelVisible(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`bg-card border-r border-border flex flex-col overflow-y-auto md:overflow-hidden shrink-0 h-screen transition-transform duration-300 md:transition-none md:translate-x-0
          fixed inset-y-0 left-0 z-40 md:relative md:inset-auto md:h-screen shadow-2xl md:shadow-none w-[280px] md:w-auto
          ${isLeftPanelVisible ? "translate-x-0" : "-translate-x-full md:hidden"}
        `}
        style={{
          width:
            typeof window !== "undefined" && windowWidth >= 768
              ? sidebarWidth
              : undefined,
        }}
      >
            <div
              style={{
                height:
                  typeof window !== "undefined" && windowWidth >= 768
                    ? leftNavHeight
                    : "auto",
              }}
              className="flex flex-col p-4 pb-2 shrink-0 overflow-y-auto"
            >
              <div className="flex items-center gap-2 font-bold text-xl mb-8 text-primary group">
                <Palette className="w-6 h-6 shrink-0" />
                {isEditingTitle ? (
                  <input
                    autoFocus
                    className="bg-transparent border-b border-primary outline-none w-full"
                    value={appTitle}
                    onChange={(e) => setAppTitle(e.target.value)}
                    onBlur={() => setIsEditingTitle(false)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && setIsEditingTitle(false)
                    }
                  />
                ) : (
                  <span
                    className="truncate cursor-pointer"
                    onClick={() => setIsEditingTitle(true)}
                  >
                    {appTitle}
                  </span>
                )}
                <Edit2
                  className="w-4 h-4 opacity-0 group-hover:opacity-100 cursor-pointer ml-auto shrink-0"
                  onClick={() => setIsEditingTitle(true)}
                />
                <button
                  onClick={() => setIsLeftPanelVisible(false)}
                  className="md:hidden p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary shrink-0 focus:outline-none"
                  title="Close Sidebar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 space-y-2">
                
                {typeof window !== "undefined" && window.self !== window.top && (
                  <a
                    href={window.location.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-blue-500 bg-blue-500/10 hover:bg-blue-500/20 transition-all border border-blue-500/20 mb-2 shadow-sm"
                  >
                    <ExternalLink className="w-5 h-5 shrink-0" />
                    <span>Open App</span>
                  </a>
                )}
{deferredPrompt && (
                  <button
                    onClick={handleInstallClick}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-all border border-primary/20 mb-2 shadow-sm"
                  >
                    <Download className="w-5 h-5 shrink-0" />
                    <span>Install App</span>
                  </button>
                )}

                <SidebarEditableButton
                  active={activeTab === "dashboard"}
                  onClick={() => setActiveTab("dashboard")}
                  icon={<PieChart className="w-5 h-5" />}
                  label={tabNames.dashboard}
                  onChange={(v) =>
                    setTabNames((prev) => ({ ...prev, dashboard: v }))
                  }
                />
                <SidebarEditableButton
                  active={activeTab === "images"}
                  onClick={() => setActiveTab("images")}
                  icon={<ImageIcon className="w-5 h-5" />}
                  label={tabNames.images}
                  onChange={(v) =>
                    setTabNames((prev) => ({ ...prev, images: v }))
                  }
                />
                <SidebarEditableButton
                  active={activeTab === "text"}
                  onClick={() => setActiveTab("text")}
                  icon={<FileText className="w-5 h-5" />}
                  label={tabNames.text}
                  onChange={(v) =>
                    setTabNames((prev) => ({ ...prev, text: v }))
                  }
                />
                <SidebarEditableButton
                  active={activeTab === "groups"}
                  onClick={() => setActiveTab("groups")}
                  icon={<FolderKanban className="w-5 h-5 text-amber-500" />}
                  label={tabNames.groups}
                  onChange={(v) =>
                    setTabNames((prev) => ({ ...prev, groups: v }))
                  }
                />
                <SidebarEditableButton
                  active={activeTab === "favorites"}
                  onClick={() => setActiveTab("favorites")}
                  icon={<Heart className="w-5 h-5 text-red-500 fill-red-500" />}
                  label={tabNames.favorites}
                  onChange={(v) =>
                    setTabNames((prev) => ({ ...prev, favorites: v }))
                  }
                />
                <SidebarEditableButton
                  active={activeTab === "database"}
                  onClick={() => setActiveTab("database")}
                  icon={<Database className="w-5 h-5" />}
                  label={tabNames.database}
                  onChange={(v) =>
                    setTabNames((prev) => ({ ...prev, database: v }))
                  }
                />
                <SidebarEditableButton
                  active={activeTab === "spreadsheet"}
                  onClick={() => setActiveTab("spreadsheet")}
                  icon={<FileSpreadsheet className="w-5 h-5 text-emerald-500" />}
                  label={tabNames.spreadsheet || "Spreadsheet"}
                  onChange={(v) =>
                    setTabNames((prev) => ({ ...prev, spreadsheet: v }))
                  }
                />
                <SidebarEditableButton
                  active={activeTab === "windows"}
                  onClick={() => setActiveTab("windows")}
                  icon={<Monitor className="w-5 h-5 text-blue-500" />}
                  label={tabNames.windows}
                  onChange={(v) =>
                    setTabNames((prev) => ({ ...prev, windows: v }))
                  }
                />
                <SidebarEditableButton
                  active={activeTab === "arcade"}
                  onClick={() => setActiveTab("arcade")}
                  icon={<Gamepad2 className="w-5 h-5 text-emerald-500 animate-pulse" />}
                  label={tabNames.arcade}
                  onChange={(v) =>
                    setTabNames((prev) => ({ ...prev, arcade: v }))
                  }
                />
                <SidebarEditableButton
                  active={activeTab === "showcase"}
                  onClick={() => setActiveTab("showcase")}
                  icon={<Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />}
                  label={tabNames.showcase || "Showcase View"}
                  onChange={(v) =>
                    setTabNames((prev) => ({ ...prev, showcase: v }))
                  }
                />
              </nav>
              <div className="pt-4 border-t border-border mt-4 space-y-1.5">
                  <button
                    onClick={() => setIsFeatureHelpOpen(true)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-primary bg-primary/10 hover:bg-primary/20 transition-all border border-primary/30 shadow-xs cursor-pointer"
                  >
                    <HelpCircle className="w-5 h-5 text-primary shrink-0" />
                    <span>Feature Guide & Help (?)</span>
                  </button>
                  <button
                    onClick={() => setIsDeveloperModalOpen(true)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-muted-foreground hover:bg-secondary transition-all cursor-pointer"
                  >
                    <Code className="w-5 h-5" />
                    <span>Developer</span>
                  </button>
                </div>
            </div>

            <div
              className="hidden md:flex h-3 cursor-row-resize bg-border/30 hover:bg-orange-500 transition-all w-full z-10 shrink-0 items-center justify-center group/splitter touch-none"
              onPointerDown={(e) => {
                e.preventDefault();
                setDraggingSidebar("leftVertical");
              }}
            >
              <div className="w-10 h-[3px] bg-border group-hover/splitter:bg-white rounded" />
            </div>

            <div className="flex-1 md:overflow-y-auto p-4 pt-2 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Scan Mode</span>
                <select
                  className="bg-secondary text-secondary-foreground text-sm rounded-md border-none p-1"
                  value={scanMode}
                  onChange={(e) => setScanMode(e.target.value as any)}
                >
                  <option value="basic">Basic</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Counting</span>
                <select
                  className="bg-secondary text-secondary-foreground text-sm rounded-md border-none p-1"
                  value={countingMode}
                  onChange={(e) => setCountingMode(e.target.value as any)}
                >
                  <option value="multiple">Multiple Objects</option>
                  <option value="single">Single Object</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Image Extraction</span>
                <select
                  className="bg-secondary text-secondary-foreground text-sm rounded-md border-none p-1"
                  value={imageSplitMode}
                  onChange={(e) => setImageSplitMode(e.target.value as any)}
                >
                  <option value="highlight">Full Highlight (No Split)</option>
                  <option value="crop">Crop Parts (Split)</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Theme</span>
                <select
                  className="bg-secondary text-secondary-foreground text-sm rounded-md border-none p-1"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as Theme)}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="green-blue">Green Blue</option>
                  <option value="red">Red</option>
                </select>
              </div>

              {/* Profile section header with switch option */}
              <div className="flex items-center justify-between mt-4 mb-2 pt-2 border-t border-border/30">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Creator Profile & Credits
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const next = !swapProfileOrder;
                    setSwapProfileOrder(next);
                    safeSetStorage("swap_profile_order", String(next));
                  }}
                  className="text-[10px] flex items-center gap-1.5 text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded transition-all font-semibold"
                  title="Switch layout order of User and Creator profiles"
                >
                  <ArrowUpDown className="w-3 h-3" />
                  <span>Switch Order</span>
                </button>
              </div>

              {(() => {
                const creatorCard = (
                  <div
                    onClick={() => {
                      setModalForm(creatorProfile);
                      setOriginalProfile(creatorProfile);
                      setIsEditingCreator(false);
                      setIsUnlockingCreator(false);
                      setEnteredPin("");
                      setPinError("");
                      setNewPinSetting(creatorPin);
                      setShowCreatorModal(true);
                    }}
                    className="p-3 bg-secondary/30 hover:bg-secondary/60 rounded-lg border border-border/50 cursor-pointer transition-all mt-2 space-y-3 animate-in fade-in duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                          Creator Credit
                        </div>
                        <div className="text-sm font-bold truncate text-foreground">
                          {creatorProfile.name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {creatorProfile.role}
                        </div>
                      </div>
                    </div>
                    {/* Ordered credits images */}
                    <div className="flex gap-2 items-center pt-1.5 border-t border-border/40">
                      {creatorProfile.avatarUrl && (
                        <img
                          src={creatorProfile.avatarUrl}
                          alt={
                            creatorProfile.avatarLabel || "Alberto Armentero"
                          }
                          className="w-7 h-7 rounded-full object-cover border border-primary/20 hover:scale-110 transition-transform cursor-zoom-in"
                          title={
                            creatorProfile.avatarLabel || "Alberto Armentero"
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            window.dispatchEvent(
                              new CustomEvent("expand-image", {
                                detail: { src: creatorProfile.avatarOriginalUrl || creatorProfile.avatarUrl },
                              }),
                            );
                          }}
                        />
                      )}
                      {creatorProfile.mascotUrl && (
                        <img
                          src={creatorProfile.mascotUrl}
                          alt={
                            creatorProfile.mascotLabel ||
                            "Super Armentero / Creator/Mascot"
                          }
                          className="w-7 h-7 rounded-full object-cover border border-primary/20 hover:scale-110 transition-transform cursor-zoom-in"
                          title={
                            creatorProfile.mascotLabel ||
                            "Super Armentero / Creator/Mascot"
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            window.dispatchEvent(
                              new CustomEvent("expand-image", {
                                detail: { src: creatorProfile.mascotOriginalUrl || creatorProfile.mascotUrl },
                              }),
                            );
                          }}
                        />
                      )}
                      {creatorProfile.treeLogoUrl && (
                        <img
                          src={creatorProfile.treeLogoUrl}
                          alt={
                            creatorProfile.treeLogoLabel || "Armentero Studios"
                          }
                          className="w-7 h-7 rounded-full object-cover border border-primary/20 hover:scale-110 transition-transform cursor-zoom-in"
                          title={
                            creatorProfile.treeLogoLabel || "Armentero Studios"
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            window.dispatchEvent(
                              new CustomEvent("expand-image", {
                                detail: { src: creatorProfile.treeLogoOriginalUrl || creatorProfile.treeLogoUrl },
                              }),
                            );
                          }}
                        />
                      )}
                      {creatorProfile.labtechLogoUrl && (
                        <img
                          src={creatorProfile.labtechLogoUrl}
                          alt={
                            creatorProfile.labtechLogoLabel ||
                            "Armstech Laboratories"
                          }
                          className="w-7 h-7 rounded-full object-cover border border-primary/20 hover:scale-110 transition-transform cursor-zoom-in"
                          title={
                            creatorProfile.labtechLogoLabel ||
                            "Armstech Laboratories"
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            window.dispatchEvent(
                              new CustomEvent("expand-image", {
                                detail: { src: creatorProfile.labtechLogoOriginalUrl || creatorProfile.labtechLogoUrl },
                              }),
                            );
                          }}
                        />
                      )}
                    </div>
                    {/* Compact Developer Caution badge at the bottom */}
                    <div className="mt-1 flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/25 text-[10px] text-amber-800 dark:text-amber-300 font-semibold leading-normal">
                      <span>⚠️</span>
                      <span>{creatorProfile.cautionText || "This is for developers only."}</span>
                    </div>
                  </div>
                );

                const userCard = (
                  <div
                    onClick={() => {
                      setUserProfileForm(activeUserProfile);
                      setIsEditingUserProfile(false);
                      setIsCreatingUserProfile(false);
                      setShowUserProfileModal(true);
                    }}
                    className="p-3 bg-secondary/30 hover:bg-secondary/60 rounded-lg border border-border/50 cursor-pointer transition-all mt-2 animate-in fade-in duration-300 group"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                          User Profile
                        </div>
                        <div className="text-sm font-bold truncate text-foreground group-hover:text-primary transition-colors">
                          {activeUserProfile.name || "Empty Profile"}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {activeUserProfile.role || "No role set"}
                        </div>
                      </div>
                    </div>
                    {/* Ordered credits images */}
                    <div className="flex gap-2 items-center pt-1.5 border-t border-border/40">
                      {activeUserProfile.avatarUrl && (
                        <img
                          src={activeUserProfile.avatarUrl}
                          alt={activeUserProfile.avatarLabel || "User Avatar"}
                          className="w-7 h-7 rounded-full object-cover border border-primary/20 hover:scale-110 transition-transform cursor-zoom-in"
                          title={activeUserProfile.avatarLabel || "User Avatar"}
                          onClick={(e) => {
                            e.stopPropagation();
                            window.dispatchEvent(
                              new CustomEvent("expand-image", {
                                detail: { src: activeUserProfile.avatarOriginalUrl || activeUserProfile.avatarUrl },
                              }),
                            );
                          }}
                        />
                      )}
                      {activeUserProfile.mascotUrl && (
                        <img
                          src={activeUserProfile.mascotUrl}
                          alt={activeUserProfile.mascotLabel || "User Mascot"}
                          className="w-7 h-7 rounded-full object-cover border border-primary/20 hover:scale-110 transition-transform cursor-zoom-in"
                          title={activeUserProfile.mascotLabel || "User Mascot"}
                          onClick={(e) => {
                            e.stopPropagation();
                            window.dispatchEvent(
                              new CustomEvent("expand-image", {
                                detail: { src: activeUserProfile.mascotOriginalUrl || activeUserProfile.mascotUrl },
                              }),
                            );
                          }}
                        />
                      )}
                      {activeUserProfile.treeLogoUrl && (
                        <img
                          src={activeUserProfile.treeLogoUrl}
                          alt={activeUserProfile.treeLogoLabel || "User Logo"}
                          className="w-7 h-7 rounded-full object-cover border border-primary/20 hover:scale-110 transition-transform cursor-zoom-in"
                          title={activeUserProfile.treeLogoLabel || "User Logo"}
                          onClick={(e) => {
                            e.stopPropagation();
                            window.dispatchEvent(
                              new CustomEvent("expand-image", {
                                detail: { src: activeUserProfile.treeLogoOriginalUrl || activeUserProfile.treeLogoUrl },
                              }),
                            );
                          }}
                        />
                      )}
                      {activeUserProfile.labtechLogoUrl && (
                        <img
                          src={activeUserProfile.labtechLogoUrl}
                          alt={
                            activeUserProfile.labtechLogoLabel ||
                            "User Alt Logo"
                          }
                          className="w-7 h-7 rounded-full object-cover border border-primary/20 hover:scale-110 transition-transform cursor-zoom-in"
                          title={
                            activeUserProfile.labtechLogoLabel ||
                            "User Alt Logo"
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            window.dispatchEvent(
                              new CustomEvent("expand-image", {
                                detail: {
                                  src: activeUserProfile.labtechLogoUrl,
                                },
                              }),
                            );
                          }}
                        />
                      )}
                      {!activeUserProfile.avatarUrl &&
                        !activeUserProfile.mascotUrl &&
                        !activeUserProfile.treeLogoUrl &&
                        !activeUserProfile.labtechLogoUrl && (
                          <span className="text-[10px] text-muted-foreground italic">
                            No profile images set
                          </span>
                        )}
                    </div>
                  </div>
                );

                const actionButtons = (
                  <div className="pt-3 border-t border-border/40 mt-3 space-y-2">
                    <button
                      onClick={handleExport}
                      className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary border border-primary/25 py-2 rounded-lg hover:bg-primary/25 transition-all text-xs font-semibold shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export Archive
                    </button>

                    {!isAuthChecking &&
                      (user ? (
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center justify-center gap-2 bg-secondary text-secondary-foreground py-2 rounded-lg hover:bg-secondary/80 transition-all text-xs font-semibold border border-border/40"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Sign Out
                        </button>
                      ) : (
                        <button
                          onClick={handleLogin}
                          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-all text-xs font-semibold border border-transparent shadow-sm"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          Sign in with Google
                        </button>
                      ))}

                    <button
                      onClick={clearAll}
                      className="w-full flex items-center justify-center gap-2 bg-destructive/10 text-destructive border border-destructive/25 py-2 rounded-lg hover:bg-destructive/20 transition-all text-xs font-semibold shadow-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Clear All Data
                    </button>
                  </div>
                );

                return swapProfileOrder ? (
                  <>
                    {creatorCard}
                    {userCard}
                    {actionButtons}
                  </>
                ) : (
                  <>
                    {userCard}
                    {creatorCard}
                    {actionButtons}
                  </>
                );
              })()}
            </div>
          </aside>

          {/* Resizer Handle */}
          {isLeftPanelVisible && (
            <div
              className="hidden md:flex w-3 hover:bg-orange-500/10 cursor-col-resize z-20 transition-colors items-center justify-center group/left-col-splitter touch-none -mx-1"
              onPointerDown={(e) => {
                e.preventDefault();
                setDraggingSidebar("left");
              }}
            >
              <div className="w-[3px] h-12 bg-orange-500 rounded group-hover/left-col-splitter:h-24 transition-all duration-200" />
            </div>
          )}

      {/* Main Content */}
      <main className={activeTab === "showcase" ? "flex-1 p-0 overflow-y-auto h-screen" : "flex-1 p-6 md:p-8 overflow-y-auto h-screen"}>
        {/* Main Title Section Page & Outer Touch Toolbar (Hidden in Showcase View to keep top clean & eliminate clutter) */}
        {activeTab !== "showcase" && (
          <>
            {!isHeaderControlsHidden && (
              <div className="mb-6 pb-4 border-b border-border/40 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                    <Palette className="w-6 h-6 text-primary" />
                    <span>Armstech Artchiver Database Analyzer (AADA)</span>
                  </h1>
                  <p className="text-xs text-muted-foreground mt-1 max-w-4xl leading-relaxed">
                    A comprehensive, high-security character model sheet, illustration, and database analysis platform with real-time AI vision scanning and automatic duplicates tracking.
                  </p>
                </div>
                <button
                  onClick={() => setIsFeatureHelpOpen(true)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
                  title="Open Complete Feature Help & Reference Guide"
                >
                  <HelpCircle className="w-4 h-4 text-primary" />
                  <span>Feature Guide & Reference (?)</span>
                </button>
              </div>
            )}
            {/* Responsive Touch Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-secondary/10 p-3 rounded-2xl border border-border/60">
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => setIsLeftPanelVisible(!isLeftPanelVisible)}
                  className={`h-11 px-4 text-sm font-medium flex items-center gap-2 rounded-xl border transition-all active:scale-95 cursor-pointer focus:outline-none select-none
                    ${isLeftPanelVisible 
                      ? "bg-primary text-primary-foreground border-primary shadow-sm hover:bg-primary/90" 
                      : "bg-card text-foreground border-border hover:bg-secondary/50"
                    }
                  `}
                >
                  <Menu className="w-5 h-5 shrink-0" />
                  <span>Menu</span>
                </button>

                {/* Views & View Modes Unified Button Group */}
                <div className="flex items-center gap-1.5 p-1 bg-card border border-border rounded-2xl shadow-xs">
                  {/* Primary Views / View Mode Switcher Button */}
                  <button
                    onClick={() => setIsViewModePanelOpen(!isViewModePanelOpen)}
                    className={`h-10 px-3 sm:px-3.5 text-xs font-bold flex items-center gap-2 rounded-xl transition-all active:scale-95 cursor-pointer select-none ${
                      isViewModePanelOpen
                        ? "bg-primary text-primary-foreground border border-primary shadow-xs"
                        : "text-foreground hover:bg-secondary/60"
                    }`}
                    title="Toggle Views / View Mode Settings & Layout Panel"
                  >
                    <Layers className={`w-4 h-4 shrink-0 ${isViewModePanelOpen ? 'text-primary-foreground' : 'text-primary'}`} />
                    <div className="flex flex-col text-left leading-none">
                      <span className="font-extrabold text-xs">View Mode</span>
                      <span className={`text-[10px] font-medium truncate max-w-[100px] sm:max-w-[125px] mt-0.5 ${isViewModePanelOpen ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>
                        {isHeaderControlsHidden
                          ? "Mode 01: Simple"
                          : "Mode 01: Advanced"}
                      </span>
                    </div>
                    {isViewModePanelOpen ? (
                      <ChevronUp className="w-3.5 h-3.5 shrink-0 opacity-80" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-80" />
                    )}
                  </button>

                  <div className="w-px h-6 bg-border/80" />

                  {/* Showcase View Button - Positioned right with the View Mode */}
                  <button
                    onClick={() => setActiveTab("showcase")}
                    className="h-10 px-3 sm:px-3.5 text-xs font-extrabold flex items-center gap-1.5 rounded-xl border transition-all active:scale-95 cursor-pointer shadow-xs select-none bg-gradient-to-r from-cyan-500/20 via-pink-500/20 to-amber-500/20 border-cyan-400/40 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-500/30"
                    title="Switch to View Mode 02: Showcase Presentation"
                  >
                    <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />
                    <span className="hidden sm:inline">✨ {tabNames.showcase || "Showcase View"}</span>
                    <span className="sm:hidden">✨ Showcase</span>
                  </button>
                </div>

                {!isHeaderControlsHidden && (
                  <div className="flex items-center gap-2 px-3 sm:px-4 h-11 bg-card text-foreground border border-border rounded-xl">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={isGroup} 
                        onChange={(e) => setIsGroup(e.target.checked)} 
                        className="w-4 h-4 text-primary rounded"
                      />
                      <span className="text-sm font-medium">Group files</span>
                    </label>
                    {isGroup && (
                      <input
                        type="text"
                        placeholder="Group name"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className="text-sm p-1 rounded border border-border bg-background max-w-[120px]"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Compact Header Drag & Drop Tool Box (Always accessible, outside hidden controls) */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsHeaderDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsHeaderDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsHeaderDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    let files: File[] = Array.from(e.dataTransfer.files);
                    if (files.length > 200) {
                      alert("You can only upload a maximum of 200 files at once.");
                      files = files.slice(0, 200);
                    }
                    processFiles(files, isGroup, groupName);
                  }
                }}
                onClick={() => headerFileInputRef.current?.click()}
                className={`h-11 px-3 py-1 flex items-center gap-2.5 rounded-xl border-2 border-dashed transition-all cursor-pointer select-none relative group min-w-[200px] sm:min-w-[240px] max-w-[320px] shrink-0 ${
                  isHeaderDragging
                    ? "border-primary bg-primary/25 text-primary scale-102 shadow-md ring-2 ring-primary/40"
                    : "border-pink-500/50 hover:border-pink-400 bg-card/90 text-foreground hover:bg-secondary/60 shadow-xs"
                }`}
                title="Click or Drag & Drop files here to upload (Max 200 files)"
              >
                <input
                  type="file"
                  multiple
                  className="hidden"
                  ref={headerFileInputRef}
                  onChange={(e) => {
                    if (e.target.files) {
                      let files: File[] = Array.from(e.target.files);
                      if (files.length > 200) {
                        alert("You can only upload a maximum of 200 files at once.");
                        files = files.slice(0, 200);
                      }
                      processFiles(files, isGroup, groupName);
                    }
                  }}
                />
                <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0 border border-pink-500/30 group-hover:scale-110 transition-transform">
                  <UploadCloud className={`w-4 h-4 ${isHeaderDragging ? 'text-pink-400 animate-bounce' : 'text-pink-400'}`} />
                </div>
                <div className="flex flex-col justify-center min-w-0 flex-1">
                  <div className="text-xs font-black tracking-tight flex items-center justify-between gap-1 leading-none">
                    <span className="truncate">{isHeaderDragging ? "Drop Files Now!" : "Drag & Drop Files"}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${items.length > 100 ? 'bg-pink-500/20 text-pink-400' : 'bg-secondary text-muted-foreground'}`}>
                      {items.length}/200
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate leading-none mt-1">
                    Click or drop ({ (items.reduce((acc, item) => acc + (item.fileSize || 0), 0) / (1024 * 1024)).toFixed(2) } MB)
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {!isHeaderControlsHidden && (
                  <>
                    <button
                      onClick={handleScanDuplicates}
                      className={`h-11 px-3 sm:px-4 text-xs sm:text-sm font-medium flex items-center gap-2 rounded-xl border transition-all active:scale-95 cursor-pointer focus:outline-none select-none bg-card text-foreground border-border hover:bg-secondary/50`}
                      title="Scan all uploaded files to find duplicates"
                    >
                      <Copy className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                      <span className="hidden sm:inline">Find Duplicates</span>
                    </button>
                    <button
                      onClick={() => setIsRightPanelVisible(!isRightPanelVisible)}
                      className={`h-11 px-3 sm:px-4 text-xs sm:text-sm font-medium flex items-center gap-2 rounded-xl border transition-all active:scale-95 cursor-pointer focus:outline-none select-none
                        ${isRightPanelVisible 
                          ? "bg-primary text-primary-foreground border-primary shadow-sm hover:bg-primary/90" 
                          : "bg-card text-foreground border-border hover:bg-secondary/50"
                        }
                      `}
                    >
                      <Sliders className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                      <span>Filters</span>
                    </button>
                  </>
                )}

                {/* Focus View / Ultimate Controls Toggle Button */}
                <button
                  onClick={() => setIsHeaderControlsHidden(!isHeaderControlsHidden)}
                  className={`h-11 px-3 sm:px-4 text-xs sm:text-sm font-medium flex items-center gap-2 rounded-xl border transition-all active:scale-95 cursor-pointer focus:outline-none select-none ${
                    isHeaderControlsHidden
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card text-foreground border-border hover:bg-secondary/50"
                  }`}
                  title={isHeaderControlsHidden ? "Show Full Workspace Controls (Advanced View)" : "Hide Controls for Focus Mode (Simple View)"}
                >
                  <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  <span>{isHeaderControlsHidden ? "Show Controls" : "Focus Mode"}</span>
                </button>

                {/* Overview Toggle Button */}
                {activeTab === "dashboard" && (
                  <button
                    onClick={() => setIsOverviewSectionHidden(!isOverviewSectionHidden)}
                    className={`h-11 px-3 sm:px-4 text-xs sm:text-sm font-medium flex items-center gap-2 rounded-xl border transition-all active:scale-95 cursor-pointer focus:outline-none select-none ${
                      !isOverviewSectionHidden
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-card text-foreground border-border hover:bg-secondary/50"
                    }`}
                    title={isOverviewSectionHidden ? "Show Dashboard Statistics & Overview" : "Hide Dashboard Statistics & Overview"}
                  >
                    <PieChart className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                    <span className="hidden sm:inline">{isOverviewSectionHidden ? "Show Overview" : "Hide Overview"}</span>
                  </button>
                )}

                {/* Feature Guide Question Mark Quick Button */}
                <button
                  onClick={() => setIsFeatureHelpOpen(true)}
                  className="h-11 px-3 sm:px-4 text-xs sm:text-sm font-bold flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 transition-all active:scale-95 cursor-pointer shadow-xs"
                  title="Feature Tutorial & Quick Reference Guide (?)"
                >
                  <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-primary" />
                  <span className="hidden sm:inline">Guide (?)</span>
                </button>

                {/* Local AI status and controls. Analysis fails if the chosen
                      model is not resident in memory, so the state and a one
                      click fix sit in the top bar rather than buried in
                      settings. */}
                  <div className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-card/70 px-2 py-1">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        aiStatus?.ready
                          ? aiActiveModelLoaded
                            ? "bg-emerald-500"
                            : "bg-amber-500"
                          : "bg-destructive"
                      }`}
                      title={aiStatus?.detail || "Checking the AI engine..."}
                    />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hidden md:inline">
                      {aiStatus?.ready
                        ? aiActiveModelLoaded
                          ? "AI Ready"
                          : "AI Idle"
                        : "AI Offline"}
                    </span>

                    <button
                      onClick={handleTopBarLoadModel}
                      disabled={Boolean(aiTopBarBusy) || !aiActiveModel}
                      title={
                        aiActiveModel
                          ? aiActiveModelLoaded
                            ? `${aiActiveModel} is loaded and ready`
                            : `Load ${aiActiveModel} into memory so analysis is ready`
                          : "No local model selected"
                      }
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors disabled:opacity-50 ${
                        aiActiveModelLoaded
                          ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                          : "bg-amber-500/15 text-amber-500 border-amber-500/30 hover:bg-amber-500/25"
                      }`}
                    >
                      {aiTopBarBusy === "load"
                        ? "Loading..."
                        : aiActiveModelLoaded
                          ? "Loaded"
                          : "Load AI"}
                    </button>

                    <button
                      onClick={handleTopBarUnloadModel}
                      disabled={Boolean(aiTopBarBusy) || !aiActiveModelLoaded}
                      title={
                        aiActiveModelLoaded
                          ? `Release ${aiActiveModel} from memory`
                          : "Nothing is loaded"
                      }
                      className="px-2 py-1 rounded-lg text-[10px] font-bold border border-border bg-background text-muted-foreground hover:border-destructive/50 hover:text-destructive transition-colors disabled:opacity-50"
                    >
                      {aiTopBarBusy === "unload" ? "..." : "Unload"}
                    </button>
                  </div>

                  {/* Close. On the desktop build this asks whether to keep or
                    discard in-progress edits, then shuts the local server down
                    with the window. In a browser it just tries to close the tab. */}
                <button
                  onClick={handleCloseApp}
                  className="h-11 w-11 sm:w-auto sm:px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all active:scale-95 cursor-pointer shadow-xs"
                  title="Close CharArchive"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  <span className="hidden sm:inline">Close</span>
                </button>
              </div>
            </div>

            {/* Revealed View Modes & Workspace Configuration Panel */}
            {isViewModePanelOpen && (
              <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-card border-2 border-primary/40 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-border">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-extrabold tracking-tight text-foreground flex items-center gap-2">
                        <span>Views & Workspace View Modes</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold">
                          Mode Switcher
                        </span>
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Toggle between View Mode 01 (Desktop Workspace) and View Mode 02 (Showcase), or customize Simple vs. Advanced view.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setActiveTab("dashboard");
                        setIsHeaderControlsHidden(true);
                        setIsOverviewSectionHidden(true);
                      }}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground cursor-pointer transition-colors"
                      title="Set to Simple Desktop View (Focus Mode)"
                    >
                      ⚡ Simple Preset
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("dashboard");
                        setIsHeaderControlsHidden(false);
                        setIsOverviewSectionHidden(false);
                      }}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary cursor-pointer transition-colors"
                      title="Set to Full Advanced Mode (Reveal Everything)"
                    >
                      🚀 Advanced Preset
                    </button>
                    <button
                      onClick={() => setIsViewModePanelOpen(false)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer transition-colors"
                      title="Close Views Panel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Primary Mode Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* View Mode 01: Desktop View Card */}
                  <div className="p-4 rounded-xl border-2 transition-all border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Monitor className="w-5 h-5 text-primary" />
                        <h3 className="font-extrabold text-sm text-foreground">
                          View Mode 01: Desktop Workspace
                        </h3>
                      </div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                        ✓ Active Mode
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                      Character database dashboard with responsive tile cards, model sheet inspections, sidebars, and full management tools.
                    </p>

                    <div className="space-y-2 pt-2 border-t border-border/60">
                      {/* Checkbox for Simple vs Advanced View */}
                      <label className="flex items-start gap-2.5 p-2 rounded-lg bg-background/80 border border-border cursor-pointer hover:bg-secondary/40 transition-colors">
                        <input
                          type="checkbox"
                          checked={!isHeaderControlsHidden}
                          onChange={(e) => {
                            setIsHeaderControlsHidden(!e.target.checked);
                          }}
                          className="w-4 h-4 mt-0.5 text-primary rounded cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-foreground">
                              Advanced View (Reveal All Controls)
                            </span>
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                              !isHeaderControlsHidden ? 'bg-green-500/20 text-green-400' : 'bg-secondary text-muted-foreground'
                            }`}>
                              {!isHeaderControlsHidden ? "Advanced: Revealed" : "Simple: Focused"}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Uncheck for Simple View / Focus Mode (cleans workspace and hides headers & clutter). Check to reveal all duplicate scanners, grouping tools, and filters.
                          </p>
                        </div>
                      </label>

                      {/* Sub-Checkboxes for finer control */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                        <label className="flex items-center gap-2 p-1.5 rounded-lg bg-background/50 hover:bg-background border border-border/60 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!isOverviewSectionHidden}
                            onChange={(e) => {
                              setIsOverviewSectionHidden(!e.target.checked);
                            }}
                            className="w-3.5 h-3.5 text-primary rounded"
                          />
                          <span className="font-medium text-foreground text-[11px]">Overview Analytics</span>
                        </label>
                        <label className="flex items-center gap-2 p-1.5 rounded-lg bg-background/50 hover:bg-background border border-border/60 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isLeftPanelVisible}
                            onChange={(e) => setIsLeftPanelVisible(!isLeftPanelVisible)}
                            className="w-3.5 h-3.5 text-primary rounded"
                          />
                          <span className="font-medium text-foreground text-[11px]">Navigation Menu</span>
                        </label>
                        <label className="flex items-center gap-2 p-1.5 rounded-lg bg-background/50 hover:bg-background border border-border/60 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isRightPanelVisible}
                            onChange={(e) => setIsRightPanelVisible(!isRightPanelVisible)}
                            className="w-3.5 h-3.5 text-primary rounded"
                          />
                          <span className="font-medium text-foreground text-[11px]">Filter Sidebar</span>
                        </label>
                        <label className="flex items-center gap-2 p-1.5 rounded-lg bg-background/50 hover:bg-background border border-border/60 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isGroup}
                            onChange={(e) => setIsGroup(e.target.checked)}
                            className="w-3.5 h-3.5 text-primary rounded"
                          />
                          <span className="font-medium text-foreground text-[11px]">Group Uploads</span>
                        </label>
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={() => setActiveTab("dashboard")}
                          className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                            activeTab === "dashboard"
                              ? "bg-primary text-primary-foreground shadow-xs"
                              : "bg-secondary hover:bg-secondary/80 text-foreground border border-border"
                          }`}
                        >
                          <Monitor className="w-4 h-4" />
                          <span>{activeTab === "dashboard" ? "Currently in Desktop Workspace" : "Switch to Desktop Workspace"}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* View Mode 02: Showcase Mode Card */}
                  <div className="p-4 rounded-xl border-2 transition-all flex flex-col justify-between border-border bg-card/60 hover:border-border/80">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
                          <h3 className="font-extrabold text-sm text-foreground">
                            View Mode 02: Showcase Presentation
                          </h3>
                        </div>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                          Switch to Mode 02
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                        Distraction-free, full-screen interactive character model presentation with audio players, visual banners, animated transitions, and lore inspection.
                      </p>

                      <div className="space-y-2 p-3 rounded-lg bg-background/80 border border-border/80 text-xs">
                        <div className="flex items-center gap-2 text-foreground font-semibold">
                          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Immersive Model Sheet Viewer</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Provides a smooth arcade-style experience with carousel navigation, audio playback, sound effects, and character lore books.
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 mt-auto">
                      <button
                        onClick={() => setActiveTab("showcase")}
                        className="w-full py-2.5 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm bg-gradient-to-r from-cyan-500/20 via-pink-500/20 to-amber-500/20 border border-cyan-400/40 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-500/30"
                      >
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        <span>✨ Enter Showcase Mode 02</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Additional Quick Tab Selectors */}
                <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                    <LayoutGrid className="w-3.5 h-3.5 text-primary" />
                    <span>Other Workspace Views:</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setActiveTab("spreadsheet")}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
                        activeTab === "spreadsheet"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary/60 hover:bg-secondary text-foreground border-border"
                      }`}
                    >
                      <Table className="w-3.5 h-3.5" />
                      <span>Spreadsheet View</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("database")}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
                        activeTab === "database"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary/60 hover:bg-secondary text-foreground border-border"
                      }`}
                    >
                      <Database className="w-3.5 h-3.5" />
                      <span>Database View</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("moodboard")}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
                        activeTab === "moodboard"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary/60 hover:bg-secondary text-foreground border-border"
                      }`}
                    >
                      <Palette className="w-3.5 h-3.5" />
                      <span>Moodboard View</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("arcade")}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
                        activeTab === "arcade"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary/60 hover:bg-secondary text-foreground border-border"
                      }`}
                    >
                      <Gamepad2 className="w-3.5 h-3.5" />
                      <span>Arcade Mini-Game</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        {uploadErrors.length > 0 && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-900 dark:text-red-200 rounded-lg p-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Some files failed to process:
              </span>
              <button
                onClick={() => setUploadErrors([])}
                className="text-muted-foreground hover:text-foreground text-xs font-medium cursor-pointer"
              >
                Clear Errors
              </button>
            </div>
            <ul className="text-sm list-disc pl-5 space-y-1 max-h-40 overflow-y-auto">
              {uploadErrors.map((err, idx) => (
                <li key={idx} className="flex justify-between items-center group">
                  <span>
                    <strong className="text-foreground">{err.fileName}</strong>:{" "}
                    {err.error}
                  </span>
                  <button
                    onClick={() => safeCopyToClipboard(`${err.fileName}: ${err.error}`)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-red-500 transition-opacity"
                    title="Copy error"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {isUploading && (
          <div className="mb-6 bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              <span className="font-medium">Uploading and analyzing files...</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm font-medium">
                {uploadTotalCount > 0 ? `${uploadCompletedCount} of ${uploadTotalCount} files` : ""} ({Math.round(uploadProgress)}%)
              </div>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to cancel the upload?')) {
                    cancelUploadRef.current = true;
                    setIsUploading(false);
                  }
                }}
                className="px-3 py-1 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {activeTab === "dashboard" && (
          <Dashboard
            items={items}
            characters={characters}
            onProcessFiles={processFiles}
            isGroup={isGroup}
            groupName={groupName}
            setIsGroup={setIsGroup}
            setGroupName={setGroupName}
            setCharacters={setCharacters}
            setItems={setItems}
            onUpload={handleFileInput}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              setActiveTab("categoryDetail");
            }}
            isOverviewSectionHidden={isOverviewSectionHidden}
            setIsOverviewSectionHidden={setIsOverviewSectionHidden}
          />
        )}
        {activeTab === "images" && (
          <MediaView
            type="image"
            items={items.filter((i) => i.type === "image")}
            characters={characters.filter((c) => c.sourceType === "image")}
            onUpload={handleFileInput}
            setCharacters={setCharacters}
            setItems={setItems}
            filter={selectedCategory || "All"}
            setFilter={setSelectedCategory}
            lastAddedItemId={lastAddedItemId}
            isGroup={isGroup}
            groupName={groupName}
            setIsGroup={setIsGroup}
            setGroupName={setGroupName}
          />
        )}
        {activeTab === "text" && (
          <MediaView
            type="text"
            items={items.filter((i) => i.type === "text")}
            characters={characters.filter((c) => c.sourceType === "text")}
            onUpload={handleFileInput}
            setCharacters={setCharacters}
            setItems={setItems}
            filter={selectedCategory || "All"}
            setFilter={setSelectedCategory}
            lastAddedItemId={lastAddedItemId}
            isGroup={isGroup}
            groupName={groupName}
            setIsGroup={setIsGroup}
            setGroupName={setGroupName}
          />
        )}
        {activeTab === "groups" && (
          <ProjectGroupsView
            items={items}
            characters={characters}
            setItems={setItems}
            setCharacters={setCharacters}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              setActiveTab("categoryDetail");
            }}
            onProcessFiles={processFiles}
          />
        )}
        {activeTab === "favorites" && (
          <FavoritesView
            characters={characters}
            setCharacters={setCharacters}
            items={items}
            setItems={setItems}
          />
        )}
        {activeTab === "database" && (
          <DatabaseDashboard />
        )}
        {activeTab === "spreadsheet" && (
          <div className="h-full flex-1 flex flex-col min-h-0 animate-in fade-in duration-300">
            <SpreadsheetView
              mode="global"
              characters={characters}
              items={items}
              setCharacters={setCharacters}
              setItems={setItems}
              creatorProfileName={creatorProfile?.name}
              activeUserProfileName={activeUserProfile?.name}
              onSelectCharacter={(char) => {
                setSelectedCharacter(char);
              }}
              onUpdateCharacter={(updated) => {
                setCharacters(prev => prev.map(c => c.id === updated.id ? updated : c));
              }}
            />
          </div>
        )}
        {activeTab === "moodboard" && (
          <MoodBoard />
        )}
        {activeTab === "windows" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header banner */}
            <div className="bg-gradient-to-r from-blue-600/10 via-teal-600/5 to-transparent border border-blue-500/20 rounded-xl p-6 relative overflow-hidden">
              <div className="absolute right-4 top-4 text-blue-500/10 select-none pointer-events-none">
                <Monitor className="w-48 h-48 -mr-10 -mt-10 rotate-12" />
              </div>
              <div className="max-w-xl space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/25 uppercase tracking-wider">
                  Windows Native Support
                </span>
                <h1 className="text-3xl font-bold tracking-tight">Run Armstech Artchiver Database Analyzer on Windows</h1>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Enjoy a fast, native-feeling desktop experience. Run AADA inside a standalone browser app container, or boot the entire full-stack server completely locally and offline on your PC.
                </p>
              </div>
            </div>

            {/* Two Column Options */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Option A: PWA Installation */}
              <div className="bg-card border rounded-xl p-6 space-y-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                      <Monitor className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">Progressive Web App (PWA)</h2>
                      <p className="text-xs text-muted-foreground">The easiest way to get a desktop app window</p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Install Armstech Artchiver Database Analyzer (AADA) directly to your Windows desktop. It will run in its own window without browser tabs, create a desktop shortcut, pin to your Taskbar, and start instantly.
                  </p>

                  <div className="space-y-3 bg-secondary/15 rounded-lg p-4 border border-border/40 text-sm">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Installation Steps:</h3>
                    <ol className="list-decimal list-inside space-y-2 text-xs text-muted-foreground">
                      <li>Click <strong className="text-foreground">Open App</strong> in the left sidebar to open the app in a dedicated browser tab.</li>
                      <li>In Google Chrome or Microsoft Edge, look at the right side of the address bar at the top of the browser.</li>
                      <li>Click the <strong className="text-foreground">App Install Icon</strong> (looks like a computer with an arrow, or a plus sign).</li>
                      <li>Confirm by clicking <strong className="text-foreground">Install</strong> when prompted.</li>
                    </ol>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/40 flex flex-col gap-2.5">
                  {deferredPrompt ? (
                    <button
                      onClick={handleInstallClick}
                      className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>Install Windows App Now</span>
                    </button>
                  ) : (
                    <a
                      href={window.location.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 bg-secondary text-secondary-foreground hover:bg-secondary/80 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 border border-border/80 text-center"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>1. Open App in New Tab</span>
                    </a>
                  )}
                  <p className="text-[10px] text-muted-foreground text-center">
                    Works on Google Chrome, Microsoft Edge, and Brave browsers on Windows.
                  </p>
                </div>
              </div>

              {/* Option B: Local Server Pack */}
              <div className="bg-card border rounded-xl p-6 space-y-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-500 border border-teal-500/20">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">100% Offline Local PC Pack</h2>
                      <p className="text-xs text-muted-foreground">Run both the server and database on your PC</p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Download and run AADA completely offline. This hosts both the user interface and the background AI analysis engine directly on your Windows PC.
                  </p>

                  <div className="space-y-3 bg-secondary/15 rounded-lg p-4 border border-border/40 text-sm">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Setup Instructions:</h3>
                    <ol className="list-decimal list-inside space-y-2 text-xs text-muted-foreground">
                      <li>Download the full source code (Export ZIP under Settings menu, or download files).</li>
                      <li>Install <a href="https://nodejs.org/" target="_blank" rel="noopener noreferrer" className="text-teal-500 font-semibold hover:underline">Node.js</a> on your Windows machine.</li>
                      <li>Double-click the <strong className="text-foreground">run-windows.bat</strong> launcher in the main directory!</li>
                      <li>The launcher will automatically install modules, build, and open the app!</li>
                    </ol>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/40 space-y-3">
                  <button
                    onClick={() => {
                      const batContent = `@echo off\r\ntitle AADA - Windows Local Launcher\r\ncolor 0B\r\ncls\r\necho Checking requirements...\r\nwhere node >nul 2>&1\r\nif %errorlevel% neq 0 (\r\n  echo Node.js not found! Please install from https://nodejs.org/\r\n  pause\r\n  exit /b\r\n)\r\necho Installing packages...\r\ncall npm install\r\necho Building application...\r\ncall npm run build\r\nstart http://localhost:3000\r\ncall npm run start\r\npause`;
                      const blob = new Blob([batContent], { type: "text/plain;charset=utf-8" });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href = url;
                      link.download = "run-windows.bat";
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                    }}
                    className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Windows Launcher Script (.bat)</span>
                  </button>
                  <p className="text-[10px] text-muted-foreground text-center">
                    Your downloaded files will already contain the pre-built batch launcher script.
                  </p>
                </div>
              </div>
            </div>

            {/* Manual Commands & Power Users */}
            <div className="bg-card border rounded-xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Manual Power-User Console Instructions</h2>
                  <p className="text-xs text-muted-foreground">For launching via Command Prompt (CMD) or PowerShell</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                If you prefer to start AADA manually through the console on Windows, open your favorite terminal (such as CMD or PowerShell) inside the extracted directory and execute:
              </p>

              <div className="bg-black/90 text-zinc-300 font-mono text-xs rounded-lg p-4 relative overflow-hidden group border border-zinc-800">
                <button
                  onClick={() => {
                    safeCopyToClipboard("npm install\nnpm run build\nnpm run start");
                    alert("Commands copied to clipboard!");
                  }}
                  className="absolute top-2.5 right-2.5 px-2.5 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] font-bold text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Copy Commands
                </button>
                <div className="space-y-1">
                  <p className="text-zinc-500"># 1. Install all dependencies</p>
                  <p className="text-teal-400">npm install</p>
                  <p className="text-zinc-500 mt-2"># 2. Compile the full-stack server and UI</p>
                  <p className="text-teal-400">npm run build</p>
                  <p className="text-zinc-500 mt-2"># 3. Spin up the server on port 3000</p>
                  <p className="text-teal-400">npm run start</p>
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500 text-xs leading-relaxed flex items-start gap-2.5">
                <span className="font-bold shrink-0">💡 TIP:</span>
                <span>
                  The local application caches all your uploaded images and data in your browser's persistent storage, meaning your catalog stays completely private and secure on your local hard drive!
                </span>
              </div>
            </div>
          </div>
        )}
        {activeTab === "arcade" && (
          <MiniGame />
        )}
        {activeTab === "showcase" && (
          <ArcadeModeShowcase
            characters={characters}
            selectedCharacter={selectedCharacter}
            onSelectCharacter={(char) => setSelectedCharacter(char)}
            title={tabNames.showcase || "Showcase View"}
            onSwitchToDesktop={() => setActiveTab("dashboard")}
            setCharacters={setCharacters}
            items={items}
            setItems={setItems}
          />
        )}
        {activeTab === "categoryDetail" && selectedCategory && (
          <CategoryDetail
            category={selectedCategory}
            customCategories={customCategories}
            items={items}
            characters={characters}
            onBack={() => setActiveTab("dashboard")}
            setCharacters={setCharacters}
            setItems={setItems}
            onSelectCategory={setSelectedCategory}
          />
        )}
      </main>

      {/* Right Sidebar Backdrop */}
      {isRightPanelVisible && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsRightPanelVisible(false)}
        />
      )}

      {/* Right Resizer Handle */}
      {isRightPanelVisible && (
        <div
          className="hidden md:flex w-3 hover:bg-orange-500/10 cursor-col-resize z-20 transition-colors items-center justify-center group/right-col-splitter touch-none -mx-1"
          onPointerDown={(e) => {
            e.preventDefault();
            setDraggingSidebar("right");
          }}
        >
          <div className="w-[3px] h-12 bg-orange-500 rounded group-hover/right-col-splitter:h-24 transition-all duration-200" />
        </div>
      )}

      {/* Right Sidebar */}
      <aside
        className={`border-l border-border flex flex-col overflow-y-auto md:overflow-hidden h-screen bg-card transition-transform duration-300 md:transition-none md:translate-x-0
          fixed inset-y-0 right-0 z-40 md:relative md:inset-auto md:h-screen shadow-2xl md:shadow-none w-[320px] md:w-auto
          ${isRightPanelVisible ? "translate-x-0" : "translate-x-full md:hidden"}
        `}
        style={{
          width:
            typeof window !== "undefined" && windowWidth >= 768
              ? rightSidebarWidth
              : undefined,
        }}
      >
            <div
              style={{
                height:
                  typeof window !== "undefined" && windowWidth >= 768
                    ? rightCategoriesHeight
                    : "auto",
              }}
              className="p-6 pb-2 shrink-0 relative flex flex-col"
            >
              <div className="flex flex-col gap-2 mb-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Categories
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsRightPanelVisible(false)}
                      className="md:hidden p-1 text-muted-foreground hover:text-foreground rounded hover:bg-secondary shrink-0 focus:outline-none"
                      title="Close Sidebar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setCustomCategories((prev) => {
                          const sorted = [...prev].sort((a, b) =>
                            a.name.localeCompare(b.name),
                          );
                          const isAsc =
                            prev.map((c) => c.id).join() ===
                            sorted.map((c) => c.id).join();
                          return isAsc ? sorted.reverse() : sorted;
                        });
                      }}
                      className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-secondary"
                      title="Sort A-Z / Z-A"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </button>
                    {categoryClipboard.length > 0 && (
                      <button
                        onClick={() => {
                          let newCats = [...customCategories];
                          categoryClipboard.forEach((cat) => {
                            newCats.push({
                              id: uuidv4(),
                              name: `${cat.name} (Copy)`,
                              parentId: cat.parentId,
                            });
                          });
                          setCustomCategories(newCats);
                        }}
                        className="text-[10px] bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded border border-amber-500/20 hover:bg-amber-500/20 transition-colors font-medium flex items-center gap-1"
                        title="Paste copied categories"
                      >
                        <Download className="w-3 h-3" /> Paste ({categoryClipboard.length})
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (isEditingCategories) {
                          setIsEditingCategories(false);
                          setSelectedCategoriesToClear(new Set());
                        } else {
                          setIsEditingCategories(true);
                        }
                      }}
                      className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20 transition-colors font-medium"
                    >
                      {isEditingCategories ? "Done Editing" : "Edit Categories"}
                    </button>
                  </div>
                </div>
                {isEditingCategories && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <button
                      onClick={() => {
                        if (
                          selectedCategoriesToClear.size ===
                          customCategories.length
                        ) {
                          setSelectedCategoriesToClear(new Set());
                        } else {
                          setSelectedCategoriesToClear(
                            new Set(customCategories.map((c) => c.id)),
                          );
                        }
                      }}
                      className="text-[10px] px-2 py-1 bg-secondary text-foreground rounded border border-border/50 hover:bg-secondary/80 transition-colors"
                    >
                      {selectedCategoriesToClear.size ===
                      customCategories.length
                        ? "Deselect All"
                        : "Select All"}
                    </button>
                    <button
                      onClick={() => {
                        if (selectedCategoriesToClear.size === 0) return;
                        const toClear = Array.from(selectedCategoriesToClear);
                        const toClearNames = customCategories
                          .filter((c) => toClear.includes(c.id))
                          .map((c) => c.name);

                        setConfirmModal({
                          isOpen: true,
                          title: "Delete Selected Categories",
                          message: `Are you sure you want to delete ${selectedCategoriesToClear.size} selected categories?`,
                          confirmText: "Delete All",
                          type: "danger",
                          onConfirm: () => {
                            setDeletedCategoryNames((prev) => [
                              ...prev,
                              ...toClearNames,
                            ]);
                            setCustomCategories((prev) =>
                              prev.filter((c) => !toClear.includes(c.id)),
                            );

                            // Also clear matching characters' unique name status to avoid automatic recreation
                            setCharacters((prevChars) =>
                              prevChars.map((c) => {
                                if (
                                  toClearNames.includes(c.name) &&
                                  c.isUniqueName !== false
                                ) {
                                  return { ...c, isUniqueName: false };
                                }
                                return c;
                              }),
                            );

                            setSelectedCategoriesToClear(new Set());
                            setIsEditingCategories(false);
                          },
                        });
                      }}
                      disabled={selectedCategoriesToClear.size === 0}
                      className="text-[10px] px-2 py-1 bg-destructive/10 text-destructive border border-destructive/20 rounded hover:bg-destructive/20 transition-colors disabled:opacity-50"
                    >
                      Delete Selected
                    </button>
                    <button
                      onClick={() => {
                        if (selectedCategoriesToClear.size === 0) return;
                        const toCopy = Array.from(selectedCategoriesToClear);
                        const catsToCopy = customCategories
                          .filter((c) => toCopy.includes(c.id))
                          .map((c) => ({ name: c.name, parentId: c.parentId }));
                        setCategoryClipboard(catsToCopy);
                        setSelectedCategoriesToClear(new Set());
                      }}
                      disabled={selectedCategoriesToClear.size === 0}
                      className="text-[10px] px-2 py-1 bg-primary/10 text-primary border border-primary/20 rounded hover:bg-primary/20 transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                    {categoryClipboard.length > 0 && (
                      <button
                        onClick={() => {
                          let newCats = [...customCategories];
                          categoryClipboard.forEach((cat) => {
                            newCats.push({
                              id: uuidv4(),
                              name: `${cat.name} (Copy)`,
                              parentId: cat.parentId,
                            });
                          });
                          setCustomCategories(newCats);
                        }}
                        className="text-[10px] px-2 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded hover:bg-amber-500/20 transition-colors flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" /> Paste (
                        {categoryClipboard.length})
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-1 mb-6">
                <DndContext
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={customCategories.map((c) => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {customCategories
                      .filter((c) => !c.parentId)
                      .map((cat) => {
                        const count =
                          cat.id === "total"
                            ? characters.length
                            : cat.id === "male"
                              ? characters.filter((c) => c.gender === "Male")
                                  .length
                              : cat.id === "female"
                                ? characters.filter(
                                    (c) => c.gender === "Female",
                                  ).length
                                : cat.id === "others"
                                  ? characters.filter(
                                      (c) => c.gender === "Others",
                                    ).length
                                  : cat.id === "objects"
                                    ? characters.filter(
                                        (c) => c.entityType === "Object",
                                      ).length
                                    : new Set(
                                        characters
                                          .filter((c) => c.name === cat.name)
                                          .map((c) => c.sourceId),
                                      ).size;

                        const subCats = customCategories.filter(
                          (child) => child.parentId === cat.id,
                        );
                        const isExpanded = expandedCategories[cat.id] !== false; // default to true
                        const handleToggleExpand = () => {
                          setExpandedCategories((prev) => ({
                            ...prev,
                            [cat.id]: !isExpanded,
                          }));
                        };

                        return (
                          <div key={cat.id} className="space-y-1 flex flex-col">
                            <div
                              className="flex items-center cursor-pointer"
                              onClick={() => {
                                if (isEditingCategories) {
                                  const newSet = new Set(
                                    selectedCategoriesToClear,
                                  );
                                  if (newSet.has(cat.id)) newSet.delete(cat.id);
                                  else newSet.add(cat.id);
                                  setSelectedCategoriesToClear(newSet);
                                }
                              }}
                            >
                              {isEditingCategories && (
                                <input
                                  type="checkbox"
                                  checked={selectedCategoriesToClear.has(
                                    cat.id,
                                  )}
                                  onChange={() => {}}
                                  className="mr-2 pointer-events-none"
                                />
                              )}
                              <div
                                className={`flex-1 ${isEditingCategories && selectedCategoriesToClear.has(cat.id) ? "opacity-50" : ""}`}
                              >
                                <SortableCategory
                                  id={cat.id}
                                  name={cat.name}
                                  count={count}
                                  parentId={cat.parentId}
                                  allCategories={customCategories}
                                  onSetParent={(pid) =>
                                    setCustomCategoryParent(cat.id, pid)
                                  }
                                  active={
                                    activeTab === "categoryDetail" &&
                                    selectedCategory === cat.id
                                  }
                                  onClick={() => {
                                    if (!isEditingCategories) {
                                      setSelectedCategory(cat.id);
                                      setActiveTab("categoryDetail");
                                    }
                                  }}
                                  onDelete={() => deleteCustomCategory(cat.id)}
                                  onChange={(v) =>
                                    renameCustomCategory(cat.id, v)
                                  }
                                  isExpandable={subCats.length > 0}
                                  isExpanded={isExpanded}
                                  onToggleExpand={handleToggleExpand}
                                  isEditing={isEditingCategories}
                                />
                              </div>
                            </div>

                            {isExpanded &&
                              subCats.map((subCat) => {
                                const subCount = new Set(
                                  characters
                                    .filter((c) => c.name === subCat.name)
                                    .map((c) => c.sourceId),
                                ).size;
                                return (
                                  <div
                                    key={subCat.id}
                                    className="pl-6 border-l border-orange-500/30 ml-3 flex items-center gap-1 mt-1 cursor-pointer"
                                    onClick={() => {
                                      if (isEditingCategories) {
                                        const newSet = new Set(
                                          selectedCategoriesToClear,
                                        );
                                        if (newSet.has(subCat.id))
                                          newSet.delete(subCat.id);
                                        else newSet.add(subCat.id);
                                        setSelectedCategoriesToClear(newSet);
                                      }
                                    }}
                                  >
                                    {isEditingCategories && (
                                      <input
                                        type="checkbox"
                                        checked={selectedCategoriesToClear.has(
                                          subCat.id,
                                        )}
                                        onChange={() => {}}
                                        className="mr-2 pointer-events-none"
                                      />
                                    )}
                                    <div
                                      className={`flex-1 ${isEditingCategories && selectedCategoriesToClear.has(subCat.id) ? "opacity-50" : ""}`}
                                    >
                                      <SortableCategory
                                        id={subCat.id}
                                        name={subCat.name}
                                        count={subCount}
                                        parentId={subCat.parentId}
                                        allCategories={customCategories}
                                        onSetParent={(pid) =>
                                          setCustomCategoryParent(
                                            subCat.id,
                                            pid,
                                          )
                                        }
                                        active={
                                          activeTab === "categoryDetail" &&
                                          selectedCategory === subCat.id
                                        }
                                        onClick={() => {
                                          if (!isEditingCategories) {
                                            setSelectedCategory(subCat.id);
                                            setActiveTab("categoryDetail");
                                          }
                                        }}
                                        onDelete={() =>
                                          deleteCustomCategory(subCat.id)
                                        }
                                        onChange={(v) =>
                                          renameCustomCategory(subCat.id, v)
                                        }
                                        isEditing={isEditingCategories}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        );
                      })}
                  </SortableContext>
                </DndContext>
                <button
                  onClick={() => addCustomCategory("New Category")}
                  className="text-xs text-primary pl-3 mt-2 flex items-center gap-1 hover:underline"
                >
                  + Add Category
                </button>
              </div>
            </div>
            <div
              className="hidden md:flex h-3 cursor-row-resize bg-border/30 hover:bg-orange-500 transition-all w-full z-10 shrink-0 items-center justify-center group/splitter touch-none"
              onPointerDown={(e) => {
                e.preventDefault();
                setDraggingSidebar("rightVertical");
              }}
            >
              <div className="w-10 h-[3px] bg-border group-hover/splitter:bg-white rounded" />
            </div>
            <div className="flex-1 md:overflow-y-auto p-6 pt-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">
                Filters
              </h2>
              <div className="space-y-1">
                {uniqueCharacterNames.length > 0 && (
                  <>
                    <div className="flex flex-col gap-2 px-3 mb-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs text-muted-foreground font-semibold">
                          Characters
                        </h3>
                        {characterClipboard.length > 0 && (
                          <button
                            onClick={() => {
                              let newChars = [...characters];
                              characterClipboard.forEach((nameToDup) => {
                                const matchingChars = characters.filter(
                                  (c) =>
                                    c.name === nameToDup &&
                                    c.isUniqueName !== false,
                                );
                                matchingChars.forEach((c) => {
                                  newChars.push({
                                    ...c,
                                    id: uuidv4(),
                                    name: `${nameToDup} (Copy)`,
                                  });
                                });
                              });
                              setCharacters(newChars);
                            }}
                            className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-1 rounded border border-amber-500/20 hover:bg-amber-500/20 transition-colors font-medium flex items-center gap-1"
                            title="Paste copied characters"
                          >
                            <Download className="w-3 h-3" /> Paste ({characterClipboard.length})
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (isEditingCharacters) {
                              setIsEditingCharacters(false);
                              setSelectedCharactersToClear(new Set());
                            } else {
                              setIsEditingCharacters(true);
                            }
                          }}
                          className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20 transition-colors font-medium"
                        >
                          {isEditingCharacters
                            ? "Done Editing"
                            : "Edit Characters"}
                        </button>
                      </div>
                    </div>
                    {isEditingCharacters && (
                      <div className="px-3 mb-3 flex flex-wrap gap-1.5">
                        <button
                          onClick={() => {
                            if (
                              selectedCharactersToClear.size ===
                              uniqueCharacterNames.length
                            ) {
                              setSelectedCharactersToClear(new Set());
                            } else {
                              setSelectedCharactersToClear(
                                new Set(
                                  uniqueCharacterNames.map((c) => c.name),
                                ),
                              );
                            }
                          }}
                          className="text-[10px] px-2 py-1 bg-secondary text-foreground rounded border border-border/50 hover:bg-secondary/80 transition-colors"
                        >
                          {selectedCharactersToClear.size ===
                          uniqueCharacterNames.length
                            ? "Deselect All"
                            : "Select All"}
                        </button>
                        <button
                          onClick={() => {
                            if (selectedCharactersToClear.size === 0) return;
                            const toClear = Array.from(
                              selectedCharactersToClear,
                            );
                            setConfirmModal({
                              isOpen: true,
                              title: "Clear Selected Characters",
                              message: `Are you sure you want to clear ${selectedCharactersToClear.size} selected characters?`,
                              confirmText: "Clear All",
                              type: "danger",
                              onConfirm: () => {
                                const updatedCharacters = characters.map((c) => {
                                  if (
                                    toClear.includes(c.name) &&
                                    c.isUniqueName !== false
                                  ) {
                                    return { ...c, isUniqueName: false };
                                  }
                                  return c;
                                });
                                setCharacters(updatedCharacters);
                                setSelectedCharactersToClear(new Set());
                                setIsEditingCharacters(false);
                              },
                            });
                          }}
                          disabled={selectedCharactersToClear.size === 0}
                          className="text-[10px] px-2 py-1 bg-destructive/10 text-destructive border border-destructive/20 rounded hover:bg-destructive/20 transition-colors disabled:opacity-50"
                        >
                          Delete Selected
                        </button>
                        <button
                          onClick={() => {
                            if (selectedCharactersToClear.size === 0) return;
                            const toCopy = Array.from(
                              selectedCharactersToClear,
                            );
                            setCharacterClipboard(toCopy);
                            setSelectedCharactersToClear(new Set());
                          }}
                          disabled={selectedCharactersToClear.size === 0}
                          className="text-[10px] px-2 py-1 bg-primary/10 text-primary border border-primary/20 rounded hover:bg-primary/20 transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" /> Copy
                        </button>
                        {characterClipboard.length > 0 && (
                          <button
                            onClick={() => {
                              let newChars = [...characters];
                              characterClipboard.forEach((nameToDup) => {
                                const matchingChars = characters.filter(
                                  (c) =>
                                    c.name === nameToDup &&
                                    c.isUniqueName !== false,
                                );
                                matchingChars.forEach((c) => {
                                  newChars.push({
                                    ...c,
                                    id: uuidv4(),
                                    name: `${nameToDup} (Copy)`,
                                  });
                                });
                              });
                              setCharacters(newChars);
                            }}
                            className="text-[10px] px-2 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded hover:bg-amber-500/20 transition-colors flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" /> Paste (
                            {characterClipboard.length})
                          </button>
                        )}
                      </div>
                    )}
                    <DndContext
                      collisionDetection={closestCenter}
                      onDragEnd={handleCharacterDragEnd}
                    >
                      <SortableContext
                        items={uniqueCharacterNames.map((c) => c.name)}
                        strategy={verticalListSortingStrategy}
                      >
                        {uniqueCharacterNames.map((cat) => (
                          <SortableCharacterFilter
                            key={cat.id}
                            id={cat.id}
                            name={cat.name}
                            count={cat.count}
                            active={
                              selectedCategory === cat.id &&
                              !isEditingCharacters
                            }
                            onClick={() => {
                              setSelectedCategory(cat.id);
                              setActiveTab("categoryDetail");
                            }}
                            onRename={() => {
                              const newName = prompt(
                                `Enter new name for "${cat.name}":`,
                                cat.name,
                              );
                              if (
                                newName &&
                                newName.trim() !== "" &&
                                newName !== cat.name
                              ) {
                                const updatedCharacters = characters.map(
                                  (c) => {
                                    if (
                                      c.name === cat.name &&
                                      c.isUniqueName !== false
                                    ) {
                                      return { ...c, name: newName.trim() };
                                    }
                                    return c;
                                  },
                                );
                                setCharacters(updatedCharacters);
                              }
                            }}
                            onClear={() => {
                              setConfirmModal({
                                isOpen: true,
                                title: "Clear Character Name",
                                message: `Are you sure you want to clear the name "${cat.name}"?`,
                                confirmText: "Clear",
                                type: "danger",
                                onConfirm: () => {
                                  const updatedCharacters = characters.map(
                                    (c) => {
                                      if (
                                        c.name === cat.name &&
                                        c.isUniqueName !== false
                                      ) {
                                        return { ...c, isUniqueName: false };
                                      }
                                      return c;
                                    },
                                  );
                                  setCharacters(updatedCharacters);
                                  const newSet = new Set(
                                    selectedCharactersToClear,
                                  );
                                  newSet.delete(cat.name);
                                  setSelectedCharactersToClear(newSet);
                                },
                              });
                            }}
                            isEditing={isEditingCharacters}
                            selected={selectedCharactersToClear.has(cat.name)}
                            onToggleSelect={() => {
                              const newSet = new Set(selectedCharactersToClear);
                              if (newSet.has(cat.name)) newSet.delete(cat.name);
                              else newSet.add(cat.name);
                              setSelectedCharactersToClear(newSet);
                            }}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  </>
                )}
                <h3 className="text-xs text-muted-foreground px-3 mt-4 mb-2">
                  Standard
                </h3>
                {(["All"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSelectedCategory(tab)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${selectedCategory === tab ? "bg-secondary text-foreground font-medium" : "text-muted-foreground hover:bg-secondary/50"}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </aside>

      {/* Creator Modal. Absent from a commercial build, so the developer
          panels and source export inside it are not shipped at all. */}
      {!IS_COMMERCIAL && showCreatorModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseCreatorModal();
            }
          }}
        >
          <div
            className={`bg-card text-card-foreground p-6 rounded-xl w-full shadow-2xl border border-border animate-in zoom-in-95 duration-200 transition-all duration-300 flex flex-col ${
              creatorModalSize === "compact"
                ? "max-w-2xl"
                : creatorModalSize === "spacious"
                  ? "max-w-4xl"
                  : "max-w-6xl w-[94vw]"
            }`}
            style={{
              resize: "both",
              overflow: "auto",
              minWidth: "450px",
              minHeight: "400px",
            }}
          >
            <div className="flex justify-between items-center mb-4 border-b border-border/50 pb-3">
              <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                <Palette className="w-5 h-5 text-primary" />
                Creator Profile & Credits
              </h2>
              <div className="flex items-center gap-3">
                {/* Modal Size Presets */}
                <div className="flex rounded-md bg-secondary p-0.5 text-[11px] font-medium border border-border/40">
                  <button
                    type="button"
                    title="Compact View"
                    onClick={() => setCreatorModalSize("compact")}
                    className={`px-2 py-1 rounded transition-all flex items-center gap-1 ${creatorModalSize === "compact" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Compact
                  </button>
                  <button
                    type="button"
                    title="Standard View"
                    onClick={() => setCreatorModalSize("spacious")}
                    className={`px-2 py-1 rounded transition-all flex items-center gap-1 ${creatorModalSize === "spacious" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Spacious
                  </button>
                  <button
                    type="button"
                    title="Expanded View"
                    onClick={() => setCreatorModalSize("expanded")}
                    className={`px-2 py-1 rounded transition-all flex items-center gap-1 ${creatorModalSize === "expanded" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <Maximize2 className="w-3 h-3" />
                    Wide
                  </button>
                </div>

                <button
                  onClick={handleCloseCreatorModal}
                  className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-colors border border-transparent hover:border-border/40"
                  title="Close Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {!isUnlockingCreator && (
              <div className="mb-5 animate-in fade-in duration-200">
                {/* Image Gallery */}
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 text-center">
                    {isEditingCreator
                      ? "Click any image to crop"
                      : "Click any image to expand full size"}
                  </p>
                  <div className="flex gap-4 justify-center py-2.5 bg-secondary/20 rounded-lg border border-border/50">
                    <div className="flex flex-col items-center gap-1.5 w-[130px]">
                      <img
                        src={
                          (isEditingCreator
                            ? modalForm.avatarUrl
                            : creatorProfile.avatarUrl) ||
                          "https://raw.githubusercontent.com/toonyman2020/Music-Player/Catti-Cango/Me.jpg"
                        }
                        alt={
                          (isEditingCreator
                            ? modalForm.avatarLabel
                            : creatorProfile.avatarLabel) || "Alberto Armentero"
                        }
                        className="w-16 h-16 rounded-full border border-primary/20 object-cover hover:scale-105 transition-transform cursor-pointer"
                        title={`${(isEditingCreator ? modalForm.avatarLabel : creatorProfile.avatarLabel) || "Alberto Armentero"} - ${isEditingCreator ? "Click to crop" : "Click to expand"}`}
                        onClick={() => {
                          const url =
                            (isEditingCreator
                              ? modalForm.avatarUrl
                              : creatorProfile.avatarUrl) ||
                            "https://raw.githubusercontent.com/toonyman2020/Music-Player/Catti-Cango/Me.jpg";
                          if (isEditingCreator) {
                            setCroppingImage({
                              slotName: "avatar",
                              profileType: "creator",
                              imageUrl: (isEditingCreator ? modalForm.avatarOriginalUrl : creatorProfile.avatarOriginalUrl) || url,
                            });
                          } else {
                            window.dispatchEvent(
                              new CustomEvent("expand-image", {
                                detail: { src: creatorProfile.avatarOriginalUrl || url },
                              }),
                            );
                          }
                        }}
                      />
                      <span
                        className="text-[10px] text-muted-foreground font-semibold text-center whitespace-normal break-words leading-tight w-full px-1"
                        title={
                          (isEditingCreator
                            ? modalForm.avatarLabel
                            : creatorProfile.avatarLabel) || "Alberto Armentero"
                        }
                      >
                        {(isEditingCreator
                          ? modalForm.avatarLabel
                          : creatorProfile.avatarLabel) || "Alberto Armentero"}
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 w-[130px]">
                      <img
                        src={
                          (isEditingCreator
                            ? modalForm.mascotUrl
                            : creatorProfile.mascotUrl) ||
                          "https://raw.githubusercontent.com/toonyman2020/Music-Player/Catti-Cango/Super%20Green%20Me.png"
                        }
                        alt={
                          (isEditingCreator
                            ? modalForm.mascotLabel
                            : creatorProfile.mascotLabel) ||
                          "Super Armentero / Creator/Mascot"
                        }
                        className="w-16 h-16 rounded-full border border-primary/20 object-cover hover:scale-105 transition-transform cursor-pointer"
                        title={`${(isEditingCreator ? modalForm.mascotLabel : creatorProfile.mascotLabel) || "Super Armentero / Creator/Mascot"} - ${isEditingCreator ? "Click to crop" : "Click to expand"}`}
                        onClick={() => {
                          const url =
                            (isEditingCreator
                              ? modalForm.mascotUrl
                              : creatorProfile.mascotUrl) ||
                            "https://raw.githubusercontent.com/toonyman2020/Music-Player/Catti-Cango/Super%20Green%20Me.png";
                          if (isEditingCreator) {
                            setCroppingImage({
                              slotName: "mascot",
                              profileType: "creator",
                              imageUrl: (isEditingCreator ? modalForm.mascotOriginalUrl : creatorProfile.mascotOriginalUrl) || url,
                            });
                          } else {
                            window.dispatchEvent(
                              new CustomEvent("expand-image", {
                                detail: { src: creatorProfile.mascotOriginalUrl || url },
                              }),
                            );
                          }
                        }}
                      />
                      <span
                        className="text-[10px] text-muted-foreground font-semibold text-center whitespace-normal break-words leading-tight w-full px-1"
                        title={
                          (isEditingCreator
                            ? modalForm.mascotLabel
                            : creatorProfile.mascotLabel) ||
                          "Super Armentero / Creator/Mascot"
                        }
                      >
                        {(isEditingCreator
                          ? modalForm.mascotLabel
                          : creatorProfile.mascotLabel) ||
                          "Super Armentero / Creator/Mascot"}
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 w-[130px]">
                      <img
                        src={
                          (isEditingCreator
                            ? modalForm.treeLogoUrl
                            : creatorProfile.treeLogoUrl) ||
                          "https://raw.githubusercontent.com/toonyman2020/Music-Player/Catti-Cango/Logo%20-%20Armentero%20Studios.png"
                        }
                        alt={
                          (isEditingCreator
                            ? modalForm.treeLogoLabel
                            : creatorProfile.treeLogoLabel) ||
                          "Armentero Studios"
                        }
                        className="w-16 h-16 rounded-full border border-primary/20 object-cover hover:scale-105 transition-transform cursor-pointer"
                        title={`${(isEditingCreator ? modalForm.treeLogoLabel : creatorProfile.treeLogoLabel) || "Armentero Studios"} - ${isEditingCreator ? "Click to crop" : "Click to expand"}`}
                        onClick={() => {
                          const url =
                            (isEditingCreator
                              ? modalForm.treeLogoUrl
                              : creatorProfile.treeLogoUrl) ||
                            "https://raw.githubusercontent.com/toonyman2020/Music-Player/Catti-Cango/Logo%20-%20Armentero%20Studios.png";
                          if (isEditingCreator) {
                            setCroppingImage({
                              slotName: "treeLogo",
                              profileType: "creator",
                              imageUrl: (isEditingCreator ? modalForm.treeLogoOriginalUrl : creatorProfile.treeLogoOriginalUrl) || url,
                            });
                          } else {
                            window.dispatchEvent(
                              new CustomEvent("expand-image", {
                                detail: { src: creatorProfile.treeLogoOriginalUrl || url },
                              }),
                            );
                          }
                        }}
                      />
                      <span
                        className="text-[10px] text-muted-foreground font-semibold text-center whitespace-normal break-words leading-tight w-full px-1"
                        title={
                          (isEditingCreator
                            ? modalForm.treeLogoLabel
                            : creatorProfile.treeLogoLabel) ||
                          "Armentero Studios"
                        }
                      >
                        {(isEditingCreator
                          ? modalForm.treeLogoLabel
                          : creatorProfile.treeLogoLabel) ||
                          "Armentero Studios"}
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 w-[130px]">
                      <img
                        src={
                          (isEditingCreator
                            ? modalForm.labtechLogoUrl
                            : creatorProfile.labtechLogoUrl) ||
                          "https://raw.githubusercontent.com/toonyman2020/Music-Player/Catti-Cango/Armstech%20Laboratories.jpg"
                        }
                        alt={
                          (isEditingCreator
                            ? modalForm.labtechLogoLabel
                            : creatorProfile.labtechLogoLabel) ||
                          "Armstech Laboratories"
                        }
                        className="w-16 h-16 rounded-full border border-primary/20 object-cover hover:scale-105 transition-transform cursor-pointer"
                        title={`${(isEditingCreator ? modalForm.labtechLogoLabel : creatorProfile.labtechLogoLabel) || "Armstech Laboratories"} - ${isEditingCreator ? "Click to crop" : "Click to expand"}`}
                        onClick={() => {
                          const url =
                            (isEditingCreator
                              ? modalForm.labtechLogoUrl
                              : creatorProfile.labtechLogoUrl) ||
                            "https://raw.githubusercontent.com/toonyman2020/Music-Player/Catti-Cango/Armstech%20Laboratories.jpg";
                          if (isEditingCreator) {
                            setCroppingImage({
                              slotName: "labtechLogo",
                              profileType: "creator",
                              imageUrl: (isEditingCreator ? modalForm.labtechLogoOriginalUrl : creatorProfile.labtechLogoOriginalUrl) || url,
                            });
                          } else {
                            window.dispatchEvent(
                              new CustomEvent("expand-image", {
                                detail: { src: creatorProfile.labtechLogoOriginalUrl || url },
                              }),
                            );
                          }
                        }}
                      />
                      <span
                        className="text-[10px] text-muted-foreground font-semibold text-center whitespace-normal break-words leading-tight w-full px-1"
                        title={
                          (isEditingCreator
                            ? modalForm.labtechLogoLabel
                            : creatorProfile.labtechLogoLabel) ||
                          "Armstech Laboratories"
                        }
                      >
                        {(isEditingCreator
                          ? modalForm.labtechLogoLabel
                          : creatorProfile.labtechLogoLabel) ||
                          "Armstech Laboratories"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!isEditingCreator && !isUnlockingCreator && (
              <div className="space-y-5">
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Creator Name
                    </span>
                    <p className="text-base font-semibold text-foreground">
                      {creatorProfile.name}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Role / Specialty
                    </span>
                    <p className="text-sm text-foreground">
                      {creatorProfile.role}
                    </p>
                  </div>
                  {creatorProfile.date && (
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Creation Date
                      </span>
                      <p className="text-sm text-foreground">
                        {creatorProfile.date}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Description
                    </span>
                    <p className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded-lg border border-border/50 leading-relaxed whitespace-pre-wrap">
                      {creatorProfile.bio}
                    </p>
                  </div>
                </div>

                {/* Developer Source Code Warning at the bottom */}
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/30 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-300 shadow-sm flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <span className="text-sm select-none">⚠️</span>
                  <p className="leading-relaxed font-semibold">
                    {creatorProfile.cautionText || "This is for developers only."}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {creatorPin ? (
                      <>
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                        <span>{creatorProfile.pinProtectionText || "PIN code needed for access"}</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5 text-green-500" />
                        <span>No PIN security active</span>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCloseCreatorModal}
                      className="px-4 py-2 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        setModalForm(creatorProfile);
                        if (creatorPin) {
                          setIsUnlockingCreator(true);
                          setEnteredPin("");
                          setPinError("");
                        } else {
                          setIsEditingCreator(true);
                          setNewPinSetting("");
                        }
                      }}
                      className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-opacity-90 transition-opacity flex items-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit Profile
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isUnlockingCreator && (
              <div className="space-y-4 py-2">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 mx-auto border border-amber-500/20">
                    <Lock className="w-6 h-6 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-bold">Enter Edit PIN</h3>
                  <p className="text-xs text-muted-foreground">
                    A 3-digit security PIN is required to edit the creator
                    profile. (Default is{" "}
                    <code className="bg-secondary px-1 py-0.5 rounded font-mono">
                      000
                    </code>
                    )
                  </p>
                </div>

                <div className="space-y-4 max-w-[200px] mx-auto">
                  <input
                    type="password"
                    maxLength={3}
                    value={enteredPin}
                    readOnly
                    placeholder="•••"
                    className="w-full text-center tracking-[1em] text-2xl font-bold p-2.5 rounded bg-secondary border border-border outline-none block text-foreground cursor-default"
                  />

                  {pinError && (
                    <p className="text-xs text-destructive text-center font-medium">
                      {pinError}
                    </p>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          if (enteredPin.length < 3) {
                            const val = enteredPin + num;
                            setEnteredPin(val);
                            setPinError("");
                            if (val.length === 3) {
                              if (val === creatorPin) {
                                setTimeout(() => {
                                  setIsEditingCreator(true);
                                  setIsUnlockingCreator(false);
                                  setNewPinSetting(creatorPin);
                                }, 150);
                              } else {
                                setPinError("Incorrect PIN code.");
                                setTimeout(() => setEnteredPin(""), 800);
                              }
                            }
                          }
                        }}
                        className="p-3 text-lg font-semibold rounded bg-secondary/80 hover:bg-primary/20 hover:text-primary transition-colors border border-border/50 flex items-center justify-center"
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setEnteredPin("")}
                      className="p-3 text-sm font-semibold rounded bg-secondary/50 hover:bg-destructive/20 hover:text-destructive transition-colors border border-border/50 flex items-center justify-center"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (enteredPin.length < 3) {
                          const val = enteredPin + "0";
                          setEnteredPin(val);
                          setPinError("");
                          if (val.length === 3) {
                            if (val === creatorPin) {
                              setTimeout(() => {
                                setIsEditingCreator(true);
                                setIsUnlockingCreator(false);
                                setNewPinSetting(creatorPin);
                              }, 150);
                            } else {
                              setPinError("Incorrect PIN code.");
                              setTimeout(() => setEnteredPin(""), 800);
                            }
                          }
                        }
                      }}
                      className="p-3 text-lg font-semibold rounded bg-secondary/80 hover:bg-primary/20 hover:text-primary transition-colors border border-border/50 flex items-center justify-center"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={() => setEnteredPin(enteredPin.slice(0, -1))}
                      className="p-3 text-sm font-semibold rounded bg-secondary/50 hover:bg-amber-500/20 hover:text-amber-500 transition-colors border border-border/50 flex items-center justify-center"
                    >
                      <Delete className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-border/50">
                  <button
                    onClick={() => {
                      setIsUnlockingCreator(false);
                      setEnteredPin("");
                      setPinError("");
                    }}
                    className="px-4 py-2 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    disabled={enteredPin.length < 3}
                    onClick={() => {
                      if (enteredPin === creatorPin) {
                        setIsEditingCreator(true);
                        setIsUnlockingCreator(false);
                        setNewPinSetting(creatorPin);
                      } else {
                        setPinError("Incorrect PIN code. Please try again.");
                        setEnteredPin("");
                      }
                    }}
                    className="px-5 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-opacity-90 disabled:opacity-55 transition-all flex items-center gap-1"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    Unlock
                  </button>
                </div>
              </div>
            )}

            {isEditingCreator && (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {/* Tab selectors for PIN-unlocked area */}
                <div className="flex border-b border-border pb-1 mb-3">
                  <button
                    type="button"
                    onClick={() => setUnlockedCreatorTab("profile")}
                    className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-all ${unlockedCreatorTab === "profile" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                  >
                    Profile Configuration
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnlockedCreatorTab("developer")}
                    className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${unlockedCreatorTab === "developer" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                  >
                    <Clock className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                    Developer Statistics & Log
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnlockedCreatorTab("sdk")}
                    className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${unlockedCreatorTab === "sdk" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                  >
                    <Code className="w-3.5 h-3.5" />
                    Developer SDK & Credits
                  </button>
                </div>

                {unlockedCreatorTab === "profile" && (
                  <div className="space-y-4">
                    {/* Live Previews */}
                <div className="p-2.5 bg-secondary/15 rounded-lg border border-border/40">
                  <div className="text-[10px] text-center font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Live Preview
                  </div>
                  <div className="flex gap-3 justify-center">
                    <div className="flex flex-col items-center gap-1 w-[120px]">
                      <img
                        src={
                          modalForm.avatarUrl ||
                          "https://raw.githubusercontent.com/toonyman2020/Music-Player/Catti-Cango/Me.jpg"
                        }
                        className="w-10 h-10 rounded-full border border-border object-cover"
                      />
                      <span className="text-[9px] text-muted-foreground font-semibold whitespace-normal break-words leading-tight text-center w-full px-1">
                        {modalForm.avatarLabel || "Alberto Armentero"}
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-1 w-[120px]">
                      <img
                        src={
                          modalForm.mascotUrl ||
                          "https://raw.githubusercontent.com/toonyman2020/Music-Player/Catti-Cango/Super%20Green%20Me.png"
                        }
                        className="w-10 h-10 rounded-full border border-border object-cover"
                      />
                      <span className="text-[9px] text-muted-foreground font-semibold whitespace-normal break-words leading-tight text-center w-full px-1">
                        {modalForm.mascotLabel ||
                          "Super Armentero / Creator/Mascot"}
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-1 w-[120px]">
                      <img
                        src={
                          modalForm.treeLogoUrl ||
                          "https://raw.githubusercontent.com/toonyman2020/Music-Player/Catti-Cango/Logo%20-%20Armentero%20Studios.png"
                        }
                        className="w-10 h-10 rounded-full border border-border object-cover"
                      />
                      <span className="text-[9px] text-muted-foreground font-semibold whitespace-normal break-words leading-tight text-center w-full px-1">
                        {modalForm.treeLogoLabel || "Armentero Studios"}
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-1 w-[120px]">
                      <img
                        src={
                          modalForm.labtechLogoUrl ||
                          "https://raw.githubusercontent.com/toonyman2020/Music-Player/Catti-Cango/Armstech%20Laboratories.jpg"
                        }
                        className="w-10 h-10 rounded-full border border-border object-cover"
                      />
                      <span className="text-[9px] text-muted-foreground font-semibold whitespace-normal break-words leading-tight text-center w-full px-1">
                        {modalForm.labtechLogoLabel || "Armstech Laboratories"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Profile Name & Title */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Creator/Studio Name
                    </label>
                    <input
                      type="text"
                      value={modalForm.name}
                      onChange={(e) =>
                        setModalForm({ ...modalForm, name: e.target.value })
                      }
                      className="w-full p-2 rounded bg-secondary text-xs border border-border outline-none focus:border-primary text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Role / Specialties
                    </label>
                    <input
                      type="text"
                      value={modalForm.role}
                      onChange={(e) =>
                        setModalForm({ ...modalForm, role: e.target.value })
                      }
                      className="w-full p-2 rounded bg-secondary text-xs border border-border outline-none focus:border-primary text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Creation Date
                    </label>
                    <input
                      type="text"
                      value={modalForm.date || ""}
                      onChange={(e) =>
                        setModalForm({ ...modalForm, date: e.target.value })
                      }
                      className="w-full p-2 rounded bg-secondary text-xs border border-border outline-none focus:border-primary text-foreground"
                    />
                  </div>
                </div>

                {/* Developer Source Code Warning & PIN Protection message */}
                <div className="bg-amber-500/15 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-800 dark:text-amber-300 space-y-3.5 shadow-sm">
                  <div className="space-y-1.5">
                    <div className="font-bold flex items-center gap-1.5 text-amber-700 dark:text-amber-200 uppercase tracking-wide text-[10px]">
                      <span className="p-0.5 px-1 bg-amber-500/20 rounded">⚠️</span>
                      <span>Developer Caution Message</span>
                    </div>
                    <input
                      type="text"
                      value={modalForm.cautionText || ""}
                      onChange={(e) =>
                        setModalForm({ ...modalForm, cautionText: e.target.value })
                      }
                      className="w-full p-2 rounded bg-background text-xs border border-amber-500/30 outline-none focus:border-amber-500 text-foreground font-semibold"
                      placeholder="This is for developers only."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="font-bold flex items-center gap-1.5 text-amber-700 dark:text-amber-200 uppercase tracking-wide text-[10px]">
                      <span className="p-0.5 px-1 bg-amber-500/20 rounded">🔒</span>
                      <span>PIN Protection Message</span>
                    </div>
                    <input
                      type="text"
                      value={modalForm.pinProtectionText || ""}
                      onChange={(e) =>
                        setModalForm({ ...modalForm, pinProtectionText: e.target.value })
                      }
                      className="w-full p-2 rounded bg-background text-xs border border-amber-500/30 outline-none focus:border-amber-500 text-foreground font-semibold"
                      placeholder="PIN code needed for access"
                    />
                  </div>
                </div>

                {/* Bio / Description */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Description
                  </label>
                  <textarea
                    rows={5}
                    value={modalForm.bio || ""}
                    onChange={(e) =>
                      setModalForm({ ...modalForm, bio: e.target.value })
                    }
                    className="w-full p-2.5 rounded bg-secondary text-xs border border-border outline-none focus:border-primary text-foreground resize-y min-h-[80px]"
                    placeholder="Describe your studio, archives, or team..."
                  />
                </div>

                {/* Slot 1 Config */}
                <div className="space-y-2 p-2.5 bg-secondary/10 rounded-lg border border-border/40">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Slot 1 (Creator/Me Image)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="block text-[10px] text-muted-foreground font-medium mb-1">
                        Image Label/Name
                      </span>
                      <input
                        type="text"
                        value={modalForm.avatarLabel || ""}
                        onChange={(e) =>
                          setModalForm({
                            ...modalForm,
                            avatarLabel: e.target.value,
                          })
                        }
                        className="w-full p-1.5 rounded bg-secondary text-xs border border-border"
                        placeholder="Alberto Armentero"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] text-muted-foreground font-medium mb-1">
                        Upload File
                      </span>
                      <div className="flex gap-1.5">
                        <label className="flex-1 w-full flex items-center justify-center gap-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded p-1.5 text-xs font-semibold cursor-pointer transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Choose</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  if (ev.target?.result) {
                                    setModalForm((prev) => ({
                                      ...prev,
                                      avatarUrl: ev.target!.result as string, avatarOriginalUrl: ev.target!.result as string,
                                    }));
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        {modalForm.avatarUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setCroppingImage({
                                slotName: "avatar",
                                profileType: "creator",
                                imageUrl: modalForm.avatarOriginalUrl || modalForm.avatarUrl,
                              })
                            }
                            className="flex-1 flex items-center justify-center gap-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-500 border border-amber-500/20 rounded p-1.5 text-xs font-semibold cursor-pointer transition-colors"
                            title="Crop Image"
                          >
                            <Crop className="w-3.5 h-3.5" />
                            <span>Crop</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <span className="block text-[9px] text-muted-foreground font-medium mb-1">
                      Or paste URL link:
                    </span>
                    <input
                      type="text"
                      value={modalForm.avatarUrl || ""}
                      onChange={(e) =>
                        setModalForm({
                          ...modalForm,
                          avatarUrl: e.target.value, avatarOriginalUrl: e.target.value,
                        })
                      }
                      className="w-full p-1.5 rounded bg-secondary text-[11px] border border-border"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                {/* Slot 2 Config */}
                <div className="space-y-2 p-2.5 bg-secondary/10 rounded-lg border border-border/40">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Slot 2 (Mascot Image)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="block text-[10px] text-muted-foreground font-medium mb-1">
                        Image Label/Name
                      </span>
                      <input
                        type="text"
                        value={modalForm.mascotLabel || ""}
                        onChange={(e) =>
                          setModalForm({
                            ...modalForm,
                            mascotLabel: e.target.value,
                          })
                        }
                        className="w-full p-1.5 rounded bg-secondary text-xs border border-border"
                        placeholder="Super Armentero / Creator/Mascot"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] text-muted-foreground font-medium mb-1">
                        Upload File
                      </span>
                      <div className="flex gap-1.5">
                        <label className="flex-1 w-full flex items-center justify-center gap-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded p-1.5 text-xs font-semibold cursor-pointer transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Choose</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  if (ev.target?.result) {
                                    setModalForm((prev) => ({
                                      ...prev,
                                      mascotUrl: ev.target!.result as string, mascotOriginalUrl: ev.target!.result as string,
                                    }));
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        {modalForm.mascotUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setCroppingImage({
                                slotName: "mascot",
                                profileType: "creator",
                                imageUrl: modalForm.mascotOriginalUrl || modalForm.mascotUrl,
                              })
                            }
                            className="flex-1 flex items-center justify-center gap-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-500 border border-amber-500/20 rounded p-1.5 text-xs font-semibold cursor-pointer transition-colors"
                            title="Crop Image"
                          >
                            <Crop className="w-3.5 h-3.5" />
                            <span>Crop</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <span className="block text-[9px] text-muted-foreground font-medium mb-1">
                      Or paste URL link:
                    </span>
                    <input
                      type="text"
                      value={modalForm.mascotUrl || ""}
                      onChange={(e) =>
                        setModalForm({
                          ...modalForm,
                          mascotUrl: e.target.value, mascotOriginalUrl: e.target.value,
                        })
                      }
                      className="w-full p-1.5 rounded bg-secondary text-[11px] border border-border"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                {/* Slot 3 Config */}
                <div className="space-y-2 p-2.5 bg-secondary/10 rounded-lg border border-border/40">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Slot 3 (Studio Logo)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="block text-[10px] text-muted-foreground font-medium mb-1">
                        Image Label/Name
                      </span>
                      <input
                        type="text"
                        value={modalForm.treeLogoLabel || ""}
                        onChange={(e) =>
                          setModalForm({
                            ...modalForm,
                            treeLogoLabel: e.target.value,
                          })
                        }
                        className="w-full p-1.5 rounded bg-secondary text-xs border border-border"
                        placeholder="Armentero Studios"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] text-muted-foreground font-medium mb-1">
                        Upload File
                      </span>
                      <div className="flex gap-1.5">
                        <label className="flex-1 w-full flex items-center justify-center gap-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded p-1.5 text-xs font-semibold cursor-pointer transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Choose</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  if (ev.target?.result) {
                                    setModalForm((prev) => ({
                                      ...prev,
                                      treeLogoUrl: ev.target!.result as string, treeLogoOriginalUrl: ev.target!.result as string,
                                    }));
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        {modalForm.treeLogoUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setCroppingImage({
                                slotName: "treeLogo",
                                profileType: "creator",
                                imageUrl: modalForm.treeLogoOriginalUrl || modalForm.treeLogoUrl,
                              })
                            }
                            className="flex-1 flex items-center justify-center gap-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-500 border border-amber-500/20 rounded p-1.5 text-xs font-semibold cursor-pointer transition-colors"
                            title="Crop Image"
                          >
                            <Crop className="w-3.5 h-3.5" />
                            <span>Crop</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <span className="block text-[9px] text-muted-foreground font-medium mb-1">
                      Or paste URL link:
                    </span>
                    <input
                      type="text"
                      value={modalForm.treeLogoUrl || ""}
                      onChange={(e) =>
                        setModalForm({
                          ...modalForm,
                          treeLogoUrl: e.target.value, treeLogoOriginalUrl: e.target.value,
                        })
                      }
                      className="w-full p-1.5 rounded bg-secondary text-[11px] border border-border"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                {/* Slot 4 Config */}
                <div className="space-y-2 p-2.5 bg-secondary/10 rounded-lg border border-border/40">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Slot 4 (Lab/Alt Logo)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="block text-[10px] text-muted-foreground font-medium mb-1">
                        Image Label/Name
                      </span>
                      <input
                        type="text"
                        value={modalForm.labtechLogoLabel || ""}
                        onChange={(e) =>
                          setModalForm({
                            ...modalForm,
                            labtechLogoLabel: e.target.value,
                          })
                        }
                        className="w-full p-1.5 rounded bg-secondary text-xs border border-border"
                        placeholder="Armstech Laboratories"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] text-muted-foreground font-medium mb-1">
                        Upload File
                      </span>
                      <div className="flex gap-1.5">
                        <label className="flex-1 w-full flex items-center justify-center gap-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded p-1.5 text-xs font-semibold cursor-pointer transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Choose</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  if (ev.target?.result) {
                                    setModalForm((prev) => ({
                                      ...prev,
                                      labtechLogoUrl: ev.target!
                                        .result as string,
                                    }));
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        {modalForm.labtechLogoUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setCroppingImage({
                                slotName: "labtechLogo",
                                profileType: "creator",
                                imageUrl: modalForm.labtechLogoOriginalUrl || modalForm.labtechLogoUrl,
                              })
                            }
                            className="flex-1 flex items-center justify-center gap-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-500 border border-amber-500/20 rounded p-1.5 text-xs font-semibold cursor-pointer transition-colors"
                            title="Crop Image"
                          >
                            <Crop className="w-3.5 h-3.5" />
                            <span>Crop</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <span className="block text-[9px] text-muted-foreground font-medium mb-1">
                      Or paste URL link:
                    </span>
                    <input
                      type="text"
                      value={modalForm.labtechLogoUrl || ""}
                      onChange={(e) =>
                        setModalForm({
                          ...modalForm,
                          labtechLogoUrl: e.target.value, labtechLogoOriginalUrl: e.target.value,
                        })
                      }
                      className="w-full p-1.5 rounded bg-secondary text-[11px] border border-border"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="p-3 bg-amber-500/5 rounded-lg border border-amber-500/20 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-500">
                    <ShieldAlert className="w-4 h-4" />
                    <span>PIN Protection Configuration</span>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Set Security PIN (3 Digits)
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        maxLength={3}
                        placeholder="Leave blank to disable PIN"
                        value={newPinSetting}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setNewPinSetting(val);
                        }}
                        className="w-full p-2 rounded bg-secondary text-xs border border-border outline-none focus:border-amber-500 font-mono text-foreground"
                      />
                      {newPinSetting ? (
                        <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-1 rounded font-semibold whitespace-nowrap">
                          PIN Active
                        </span>
                      ) : (
                        <span className="text-[10px] bg-muted text-muted-foreground px-2 py-1 rounded font-semibold whitespace-nowrap">
                          No PIN
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Empty the PIN setting field to delete/disable the lock
                      protection. (Default PIN is{" "}
                      <code className="bg-secondary px-1 py-0.5 rounded font-mono">
                        000
                      </code>
                      )
                    </p>
                  </div>
                </div>

                {/* System Backup & Exporter Section */}
                {/* AI ENGINE SETTINGS */}
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 space-y-3 mt-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span>AI Engine Settings</span>
                    </div>
                    {aiSettingsLoading ? (
                      <span className="text-[10px] text-muted-foreground">Checking...</span>
                    ) : aiSettings ? (
                      <span
                        className={`text-[10px] px-2 py-1 rounded font-semibold ${
                          aiSettings.provider === "editorial" && !aiSettings.hasEditorialKey
                            ? "bg-amber-500/10 text-amber-500"
                            : aiSettings.provider === "ollama" && !aiSettings.ollamaRunning
                              ? "bg-amber-500/10 text-amber-500"
                              : aiSettings.provider === "off"
                                ? "bg-muted text-muted-foreground"
                                : "bg-emerald-500/10 text-emerald-500"
                        }`}
                      >
                        {aiSettings.provider === "editorial"
                          ? aiSettings.hasEditorialKey
                            ? "AI Ready"
                            : "AI: No Key"
                          : aiSettings.provider === "ollama"
                            ? aiSettings.ollamaRunning
                              ? "Ollama Ready"
                              : "Ollama Not Found"
                            : "AI Disabled"}
                      </span>
                    ) : null}
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    Choose which AI engine analyzes your images and text. Both
                    options keep your data on this machine.
                  </p>

                  {/* Provider choice */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Active Provider
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(
                        [
                          { id: "editorial", label: "Editorial (legacy)" },
                          { id: "ollama", label: "Local Ollama" },
                          { id: "off", label: "Disabled" },
                        ] as const
                      ).map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setAiDraft((d) => ({ ...d, provider: p.id }))}
                          className={`py-2 px-1 rounded text-[10px] font-semibold border transition-colors ${
                            aiDraft.provider === p.id
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-secondary text-muted-foreground border-border hover:border-primary/40"
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Editorial key */}
                  {aiDraft.provider === "editorial" && (
                    <div className="space-y-2 rounded-md border border-border/50 bg-card/50 p-3">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Editorial API Key
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="password"
                          value={aiDraft.editorialApiKey}
                          onChange={(e) =>
                            setAiDraft((d) => ({ ...d, editorialApiKey: e.target.value }))
                          }
                          placeholder={
                            aiSettings?.hasEditorialKey
                              ? `Saved: ${aiSettings.maskedKey}`
                              : "Paste your API key here"
                          }
                          className="flex-1 p-2 rounded bg-secondary text-xs border border-border outline-none focus:border-primary font-mono text-foreground"
                        />
                        <button
                          type="button"
                          onClick={() => setAiDraft((d) => ({ ...d, editorialApiKey: "" }))}
                          className="px-2 py-2 rounded bg-secondary text-[10px] font-semibold border border-border hover:border-destructive/50 hover:text-destructive"
                          title="Clear the key field"
                        >
                          Clear
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5 items-center">
                        <button
                          type="button"
                          onClick={handleSaveAiSettings}
                          disabled={aiSettingsSaving}
                          className="px-3 py-1.5 rounded bg-primary text-primary-foreground text-[10px] font-bold disabled:opacity-50"
                        >
                          {aiSettingsSaving ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={handleTestEditorialKey}
                          disabled={aiSettingsSaving || !aiDraft.editorialApiKey.trim()}
                          className="px-3 py-1.5 rounded bg-secondary border border-border text-[10px] font-bold disabled:opacity-50"
                        >
                          Test Key
                        </button>
                        {aiSettings?.hasEditorialKey && (
                          <button
                            type="button"
                            onClick={handleClearEditorialKey}
                            disabled={aiSettingsSaving}
                            className="px-3 py-1.5 rounded bg-secondary border border-border text-[10px] font-bold text-destructive disabled:opacity-50"
                          >
                            Forget Saved Key
                          </button>
                        )}
                        <a
                          href="https://aistudio.google.com/apikey"
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold inline-flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Get a Free Key
                        </a>
                      </div>

                      {aiTestMessage && (
                        <p
                          className={`text-[10px] font-semibold ${
                            aiTestMessage.startsWith("OK") ? "text-emerald-500" : "text-destructive"
                          }`}
                        >
                          {aiTestMessage}
                        </p>
                      )}

                      <p className="text-[10px] text-muted-foreground">
                        Free keys are issued at aistudio.google.com/apikey. The key is
                        stored in chararchive.config.json on this computer and never
                        uploaded anywhere.
                      </p>
                    </div>
                  )}

                  {/* Ollama */}
                  {aiDraft.provider === "ollama" && (
                    <div className="space-y-2 rounded-md border border-border/50 bg-card/50 p-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Local Ollama Server
                        </label>
                        <button
                          type="button"
                          onClick={handleCheckOllama}
                          disabled={aiSettingsSaving}
                          className="px-2 py-1 rounded bg-secondary border border-border text-[10px] font-bold disabled:opacity-50"
                        >
                          Re-check
                        </button>
                      </div>

                      <input
                        type="text"
                        value={aiDraft.ollamaBaseUrl}
                        onChange={(e) =>
                          setAiDraft((d) => ({ ...d, ollamaBaseUrl: e.target.value }))
                        }
                        className="w-full p-2 rounded bg-secondary text-xs border border-border outline-none focus:border-primary font-mono text-foreground"
                        placeholder="http://127.0.0.1:11434"
                      />

                      {aiSettings?.ollamaRunning ? (
                        <>
                          <p className="text-[10px] text-emerald-500 font-semibold">
                            Connected to {aiSettings.ollamaBaseUrl} &middot;{" "}
                            {aiSettings.ollamaModels.length} model
                            {aiSettings.ollamaModels.length === 1 ? "" : "s"} found
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="block text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                                Vision model (images)
                              </label>
                              <select
                                value={aiDraft.ollamaVisionModel}
                                onChange={(e) =>
                                  setAiDraft((d) => ({ ...d, ollamaVisionModel: e.target.value }))
                                }
                                className="w-full p-1.5 rounded bg-secondary text-[11px] border border-border"
                              >
                                {aiLocalModels.length ? (
                                  aiLocalModels.map((m: any) => (
                                    <option key={m.name} value={m.name}>
                                      {m.name}
                                      {m.loaded ? " (ready)" : ""}
                                    </option>
                                  ))
                                ) : (
                                  aiSettings.ollamaModels.map((m: string) => (
                                    <option key={m} value={m}>
                                      {m}
                                    </option>
                                  ))
                                )}
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                                Text model
                              </label>
                              <select
                                value={aiDraft.ollamaTextModel}
                                onChange={(e) =>
                                  setAiDraft((d) => ({ ...d, ollamaTextModel: e.target.value }))
                                }
                                className="w-full p-1.5 rounded bg-secondary text-[11px] border border-border"
                              >
                                {aiLocalModels.length ? (
                                  aiLocalModels.map((m: any) => (
                                    <option key={m.name} value={m.name}>
                                      {m.name}
                                      {m.loaded ? " (ready)" : ""}
                                    </option>
                                  ))
                                ) : (
                                  aiSettings.ollamaModels.map((m: string) => (
                                    <option key={m} value={m}>
                                      {m}
                                    </option>
                                  ))
                                )}
                              </select>
                            </div>
                          </div>

                          {/* Inventory: what is installed, and what is resident. */}
                          <div className="space-y-1.5 border-t border-border/40 pt-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Installed Models
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  loadAiModels();
                                  loadAiStatus();
                                }}
                                disabled={aiModelsLoading}
                                className="text-[9px] px-2 py-0.5 rounded bg-secondary border border-border font-bold disabled:opacity-50"
                              >
                                {aiModelsLoading ? "Refreshing..." : "Refresh"}
                              </button>
                            </div>

                            {aiStatus && (
                              <p
                                className={`text-[10px] font-semibold ${
                                  aiStatus.ready ? "text-emerald-500" : "text-amber-500"
                                }`}
                              >
                                {aiStatus.detail}
                              </p>
                            )}

                            {aiLocalModels.length === 0 ? (
                              <p className="text-[10px] text-muted-foreground">
                                No models found. Check that Ollama is running and that
                                OLLAMA_MODELS points at the folder holding your models.
                              </p>
                            ) : (
                              <div className="space-y-1">
                                {aiLocalModels.map((m: any) => (
                                  <div
                                    key={m.name}
                                    className={`flex items-center justify-between gap-2 p-1.5 rounded border ${
                                      m.enabled === false
                                        ? "bg-muted/40 border-border/30 opacity-70"
                                        : "bg-secondary/60 border-border/50"
                                    }`}
                                  >
                                    <div className="min-w-0">
                                      <div className="text-[11px] font-mono truncate">
                                        {m.name}
                                      </div>
                                      <div className="text-[9px] text-muted-foreground">
                                        {(m.sizeBytes / 1e9).toFixed(1)} GB &middot;{" "}
                                        {m.enabled === false ? (
                                          <span className="text-muted-foreground font-semibold">
                                            switched off
                                          </span>
                                        ) : m.loaded ? (
                                          <span className="text-emerald-500 font-semibold">ready</span>
                                        ) : (
                                          <span className="text-amber-500 font-semibold">not loaded</span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      {m.enabled !== false && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleModelAction(m.name, m.loaded ? "unload" : "load")
                                          }
                                          disabled={aiBusyModel === m.name}
                                          className="px-2 py-1 rounded text-[9px] font-bold border border-border bg-background hover:border-primary disabled:opacity-50"
                                        >
                                          {aiBusyModel === m.name
                                            ? "..."
                                            : m.loaded
                                              ? "Release"
                                              : "Load"}
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        role="switch"
                                        aria-checked={m.enabled !== false}
                                        aria-label={`${m.enabled !== false ? "Switch off" : "Switch on"} ${m.name}`}
                                        title={
                                          m.enabled === false
                                            ? "Switch this model on"
                                            : "Switch this model off"
                                        }
                                        onClick={() =>
                                          handleToggleModel(m.name, m.enabled === false)
                                        }
                                        disabled={aiBusyModel === m.name}
                                        className={`relative w-9 h-5 rounded-full border transition-colors disabled:opacity-50 ${
                                          m.enabled !== false
                                            ? "bg-emerald-500 border-emerald-500"
                                            : "bg-muted border-border"
                                        }`}
                                      >
                                        <span
                                          className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all ${
                                            m.enabled !== false ? "left-4.5" : "left-0.5"
                                          }`}
                                        />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            <p className="text-[9px] text-muted-foreground">
                              Use the slider to switch a model on or off. Models are on by
                              default, and the app picks the best available one for the job.
                              An installed model that is on but not loaded reads its weights
                              from disk on first use, which can add a minute; Load it here to
                              move that wait to now.
                            </p>
                          </div>
                        </>
                      ) : (
                        <p className="text-[10px] text-amber-500 font-semibold">
                          No Ollama server answered. Start Ollama, then press Re-check.
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={handleSaveAiSettings}
                        disabled={aiSettingsSaving}
                        className="px-3 py-1.5 rounded bg-primary text-primary-foreground text-[10px] font-bold disabled:opacity-50"
                      >
                        {aiSettingsSaving ? "Saving..." : "Save"}
                      </button>
                    </div>
                  )}

                  {/* Ollama notice when not the active provider */}
                  {aiDraft.provider !== "ollama" && aiSettings?.ollamaRunning && (
                    <p className="text-[10px] text-muted-foreground">
                      Ollama detected on {aiSettings.ollamaBaseUrl} with{" "}
                      {aiSettings.ollamaModels.length} model
                      {aiSettings.ollamaModels.length === 1 ? "" : "s"} available.
                    </p>
                  )}
                </div>

                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 space-y-3 mt-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <FileText className="w-4 h-4 text-primary" />
                    <span>System Backup & Source Code Exporter</span>
                  </div>
                  
                  <div className="text-xs space-y-1.5 text-muted-foreground bg-card/65 p-3 rounded-md border border-border/40">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <div>
                        <span className="font-medium text-foreground">Creation Date:</span> June 28, 2026
                      </div>
                      <div>
                        <span className="font-medium text-foreground">Creator Profile:</span> {creatorProfile.name}
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium text-foreground">Active Profile:</span> {activeUserProfile.name || "Anonymous User"} ({activeUserProfile.role || "No Role"})
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium text-foreground">Registered Profiles:</span> {userProfiles.map(p => p.name || "Unnamed User").filter(Boolean).join(", ")}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">Scanned Assets:</span> {items?.length || 0} files
                      </div>
                      <div>
                        <span className="font-medium text-foreground">Cataloged Characters:</span> {characters?.length || 0} entities
                      </div>
                    </div>
                  </div>

                  {!backupData ? (
                    <button
                      type="button"
                      disabled={backupLoading}
                      onClick={fetchBackupData}
                      className="w-full py-2.5 px-4 rounded-md text-xs font-semibold bg-primary text-primary-foreground hover:bg-opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      {backupLoading ? (
                        <>
                          <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating Workspace Backup Archive...</span>
                        </>
                      ) : (
                        <>
                          <Code className="w-3.5 h-3.5" />
                          <span>Generate Application Source Code Backup</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={downloadBackupAsText}
                          className="flex-1 py-2 px-3 rounded bg-green-600 hover:bg-green-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download .txt Backup</span>
                        </button>
                        <button
                          type="button"
                          onClick={openBackupPrintablePDF}
                          className="flex-1 py-2 px-3 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Export to PDF</span>
                        </button>
                      </div>

                      {backupSuccessMessage && (
                        <div className="p-2 bg-green-500/10 border border-green-500/25 rounded text-green-500 text-[11px] font-semibold text-center flex items-center justify-center gap-1.5">
                          <Check className="w-3.5 h-3.5" />
                          <span>{backupSuccessMessage}</span>
                        </div>
                      )}

                      {/* File Inspector */}
                      <div className="space-y-1.5 border-t border-border/40 pt-2.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            Source File Inspector
                          </span>
                          <span className="text-[9px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded font-mono">
                            {Object.keys(backupData.files || {}).length} files archived
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-1.5">
                          <select
                            value={selectedBackupFile}
                            onChange={(e) => setSelectedBackupFile(e.target.value)}
                            className="col-span-2 p-1.5 rounded bg-secondary text-xs border border-border text-foreground font-mono outline-none focus:border-primary"
                          >
                            {Object.keys(backupData.files || {})
                              .filter(filename => filename.toLowerCase().includes(backupFileSearch.toLowerCase()))
                              .map((filename) => (
                                <option key={filename} value={filename}>
                                  {filename}
                                </option>
                              ))}
                          </select>
                          <input
                            type="text"
                            placeholder="Filter files..."
                            value={backupFileSearch}
                            onChange={(e) => setBackupFileSearch(e.target.value)}
                            className="p-1.5 rounded bg-secondary text-xs border border-border text-foreground outline-none focus:border-primary"
                          />
                        </div>

                        {selectedBackupFile && backupData.files[selectedBackupFile] && (
                          <div className="relative border border-border/50 rounded-md bg-secondary/30 overflow-hidden">
                            <div className="flex items-center justify-between bg-secondary/60 px-3 py-1 text-[10px] border-b border-border/40 font-mono text-muted-foreground">
                              <span>{selectedBackupFile}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  safeCopyToClipboard(backupData.files[selectedBackupFile]);
                                  alert("File contents copied to clipboard!");
                                }}
                                className="hover:text-foreground flex items-center gap-1 transition-colors"
                              >
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </button>
                            </div>
                            <pre className="p-3 text-[10px] font-mono overflow-auto max-h-[160px] text-foreground leading-normal whitespace-pre">
                              <code>{backupData.files[selectedBackupFile]}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

                {unlockedCreatorTab === "sdk" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="p-4 bg-secondary/15 rounded-xl border border-border/40 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
                          <Code className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-foreground">Developer Code & Credits SDK</h3>
                          <p className="text-xs text-muted-foreground">Modify the official branding configurations here.</p>
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Access the SDK to configure custom studio logos, creator avatars, and branding text that will appear in the main application.
                      </p>

                      <button
                        type="button"
                        onClick={() => setIsDevSdkModalOpen(true)}
                        className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>Open Developer SDK Settings</span>
                      </button>
                    </div>
                  </div>
                )}

                {unlockedCreatorTab === "developer" && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    {/* Time & Iteration Accounting Counters */}
                    <div className="bg-secondary/20 p-4 rounded-xl border border-border/50 space-y-4">
                      <div className="flex justify-between items-center border-b border-border/50 pb-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                          <Clock className="w-4 h-4 text-orange-400" />
                          Developer Accounting Indicators
                        </h3>
                        <span className="text-[10px] text-primary font-mono font-bold uppercase tracking-wider">
                          Persisted Locally
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Cumulative Changes (The 42 ones) */}
                        <div className="flex items-center justify-between p-3.5 bg-background rounded-xl border border-border">
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block">
                              Cumulative Changes
                            </span>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-2xl font-black text-orange-400 font-mono">
                                {developerChanges}
                              </span>
                              <span className="text-xs text-muted-foreground font-mono">
                                updates
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateChanges(developerChanges - 1)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-secondary hover:bg-secondary/80 active:bg-secondary/90 border border-border text-foreground font-mono text-sm transition-all font-bold"
                              title="Decrease Changes"
                            >
                              -
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateChanges(developerChanges + 1)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-secondary hover:bg-secondary/80 active:bg-secondary/90 border border-border text-foreground font-mono text-sm transition-all font-bold"
                              title="Increase Changes"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Major Iterations (The 6 ones) */}
                        <div className="flex items-center justify-between p-3.5 bg-background rounded-xl border border-border">
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block">
                              Major Releases
                            </span>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-2xl font-black text-orange-400 font-mono">
                                {developerMajorVersions}
                              </span>
                              <span className="text-xs text-muted-foreground font-mono">
                                phases
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateMajorVersions(developerMajorVersions - 1)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-secondary hover:bg-secondary/80 active:bg-secondary/90 border border-border text-foreground font-mono text-sm transition-all font-bold"
                              title="Decrease Major Releases"
                            >
                              -
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateMajorVersions(developerMajorVersions + 1)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-secondary hover:bg-secondary/80 active:bg-secondary/90 border border-border text-foreground font-mono text-sm transition-all font-bold"
                              title="Increase Major Releases"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Days Dedicated */}
                        <div className="flex items-center justify-between p-3.5 bg-background rounded-xl border border-border">
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block">
                              Days Dedicated
                            </span>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-2xl font-black text-orange-400 font-mono">
                                {developerDays}
                              </span>
                              <span className="text-xs text-muted-foreground font-mono">
                                days
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateDays(developerDays - 1)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-secondary hover:bg-secondary/80 active:bg-secondary/90 border border-border text-foreground font-mono text-sm transition-all font-bold"
                              title="Decrease Days"
                            >
                              -
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateDays(developerDays + 1)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-secondary hover:bg-secondary/80 active:bg-secondary/90 border border-border text-foreground font-mono text-sm transition-all font-bold"
                              title="Increase Days"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Total Hours Logged */}
                        <div className="flex items-center justify-between p-3.5 bg-background rounded-xl border border-border">
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block">
                              Total Hours Logged
                            </span>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-2xl font-black text-orange-400 font-mono">
                                {developerHours}
                              </span>
                              <span className="text-xs text-muted-foreground font-mono">
                                hours
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateHours(developerHours - 1)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-secondary hover:bg-secondary/80 active:bg-secondary/90 border border-border text-foreground font-mono text-sm transition-all font-bold"
                              title="Decrease Hours"
                            >
                              -
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateHours(developerHours + 1)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-secondary hover:bg-secondary/80 active:bg-secondary/90 border border-border text-foreground font-mono text-sm transition-all font-bold"
                              title="Increase Hours"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Developer Timeline */}
                    <div className="p-4 bg-secondary/10 rounded-xl border border-border/50 space-y-3">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold block">
                        Development Release Phases
                      </span>
                      <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                        <div className="flex gap-3 text-xs border-l-2 border-primary/20 pl-3 relative pb-1">
                          <span className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-primary" />
                          <div className="space-y-1">
                            <span className="font-mono text-primary font-bold">v1.6.0 (Current Version)</span>
                            <p className="text-muted-foreground text-[11px] leading-relaxed">Integrated Developer Accounting Counters, Interactive Log Systems, and fully persistent Local Storage states.</p>
                          </div>
                        </div>
                        <div className="flex gap-3 text-xs border-l-2 border-primary/20 pl-3 relative pb-1">
                          <span className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-primary/45" />
                          <div className="space-y-1">
                            <span className="font-mono text-primary/80 font-bold">v1.5.0</span>
                            <p className="text-muted-foreground text-[11px] leading-relaxed">Character scanner attribute analysis and image categorization structures.</p>
                          </div>
                        </div>
                        <div className="flex gap-3 text-xs border-l-2 border-primary/20 pl-3 relative pb-1">
                          <span className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-primary/45" />
                          <div className="space-y-1">
                            <span className="font-mono text-primary/80 font-bold">v1.4.0</span>
                            <p className="text-muted-foreground text-[11px] leading-relaxed">Secure creator profile suite and local PIN lock protection architecture.</p>
                          </div>
                        </div>
                        <div className="flex gap-3 text-xs border-l-2 border-primary/20 pl-3 relative pb-1">
                          <span className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-primary/45" />
                          <div className="space-y-1">
                            <span className="font-mono text-primary/80 font-bold">v1.3.0</span>
                            <p className="text-muted-foreground text-[11px] leading-relaxed">Local drag-and-drop file uploader and index catalogers.</p>
                          </div>
                        </div>
                        <div className="flex gap-3 text-xs border-l-2 border-primary/20 pl-3 relative pb-1">
                          <span className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-primary/45" />
                          <div className="space-y-1">
                            <span className="font-mono text-primary/80 font-bold">v1.2.0</span>
                            <p className="text-muted-foreground text-[11px] leading-relaxed">Split-screen file inspection module and detail panels.</p>
                          </div>
                        </div>
                        <div className="flex gap-3 text-xs border-l-2 border-primary/20 pl-3 relative">
                          <span className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-primary/45" />
                          <div className="space-y-1">
                            <span className="font-mono text-primary/80 font-bold">v1.1.0</span>
                            <p className="text-muted-foreground text-[11px] leading-relaxed">Project core setup, dashboard visualization layouts, and basic routing.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Developer Logger */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold block">
                        Developer Custom Notes Logger
                      </span>
                      <div className="flex gap-2">
                        <input
                          id="new-modal-dev-note-input"
                          type="text"
                          placeholder="Log custom developer entry..."
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const input = e.currentTarget;
                              handleAddDeveloperNote(input.value);
                              input.value = "";
                            }
                          }}
                          className="flex-1 p-2 rounded bg-secondary text-xs border border-border text-foreground"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById("new-modal-dev-note-input") as HTMLInputElement;
                            if (input && input.value.trim()) {
                              handleAddDeveloperNote(input.value);
                              input.value = "";
                            }
                          }}
                          className="px-3 py-1.5 bg-primary text-primary-foreground text-xs rounded hover:opacity-90 font-semibold"
                        >
                          Append
                        </button>
                      </div>

                      {developerNotes.length > 0 ? (
                        <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                          {developerNotes.map((note, index) => (
                            <div key={index} className="p-2 rounded bg-secondary/40 border border-border/55 text-[11px] leading-relaxed font-mono flex items-start gap-2 text-foreground font-semibold">
                              <span className="text-primary mt-0.5">•</span>
                              <span className="flex-1">{note}</span>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={handleClearDeveloperNotes}
                            className="text-[10px] text-destructive hover:underline font-semibold block pt-1"
                          >
                            Clear Custom Logs
                          </button>
                        </div>
                      ) : (
                        <p className="text-[11px] text-muted-foreground italic font-mono">No developer custom logs recorded.</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
                  <div className="mr-auto flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          confirm(
                            "Are you sure you want to clear all text fields in the creator profile?",
                          )
                        ) {
                          setModalForm((prev) => ({
                            ...prev,
                            name: "",
                            role: "",
                            bio: "",
                            avatarLabel: "",
                            mascotLabel: "",
                            treeLogoLabel: "",
                            labtechLogoLabel: "",
                            portfolioUrl: "",
                          }));
                        }
                      }}
                      className="px-3 py-2 text-xs font-medium rounded-md bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors"
                    >
                      Clear Text
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          confirm(
                            "Are you sure you want to clear all images in the creator profile?",
                          )
                        ) {
                          setModalForm((prev) => ({
                            ...prev,
                            avatarUrl: "",
                            mascotUrl: "",
                            treeLogoUrl: "",
                            labtechLogoUrl: "",
                          }));
                        }
                      }}
                      className="px-3 py-2 text-xs font-medium rounded-md bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors"
                    >
                      Clear Images
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setIsEditingCreator(false);
                      setModalForm(creatorProfile);
                    }}
                    className="px-4 py-2 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (newPinSetting && newPinSetting.length < 3) {
                        alert(
                          "PIN must be exactly 3 digits long or completely blank.",
                        );
                        return;
                      }

                      setCreatorProfile(modalForm);
                      safeSetStorage(
                        "creator_profile_data",
                        JSON.stringify(modalForm),
                      );

                      setCreatorPin(newPinSetting);
                      if (newPinSetting) {
                        safeSetStorage("creator_pin", newPinSetting);
                      } else {
                        safeRemoveStorage("creator_pin");
                      }
                      setIsEditingCreator(false);
                      setShowCreatorModal(false);
                    }}
                    className="px-5 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-opacity-90 transition-opacity"
                  >
                    Save & Lock
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Global Feature Help & Tutorial Guide Modal */}
      <FeatureHelpModal
        isOpen={isFeatureHelpOpen}
        onClose={() => setIsFeatureHelpOpen(false)}
      />

      {/* Developer surfaces. Removed from a commercial build. */}
      {!IS_COMMERCIAL && (
        <DeveloperCodeModal
          isOpen={isDevSdkModalOpen}
          onClose={() => setIsDevSdkModalOpen(false)}
        />
      )}

      {/* Developer Modal */}
      {!IS_COMMERCIAL && isDeveloperModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsDeveloperModalOpen(false);
            }
          }}
        >
          <div
            className="bg-[#0f141c] text-slate-100 p-6 rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-800/80 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-5 border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold flex items-center gap-2 text-orange-400 font-mono tracking-tight">
                <Code className="w-5 h-5 animate-pulse text-orange-500" />
                SYSTEM DEVELOPER PANEL
              </h2>
              <button
                onClick={() => setIsDeveloperModalOpen(false)}
                className="p-1.5 hover:bg-slate-800/80 rounded-lg text-slate-400 hover:text-slate-100 transition-colors border border-transparent hover:border-slate-800"
                title="Close Developer Panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Area */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-1 custom-scrollbar">
              
              {/* Summary Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/50 text-center space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block">Build Version</span>
                  <span className="text-sm font-bold text-orange-400 font-mono">v1.6.0 (Stable)</span>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/50 text-center space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block">Total Phases</span>
                  <span className="text-sm font-bold text-blue-400 font-mono">6 Iterations</span>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/50 text-center space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block">Source Status</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">Running (3000)</span>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/50 text-center space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block">Local Items</span>
                  <span className="text-sm font-bold text-purple-400 font-mono">{items.length} Scans / {characters.length} Chars</span>
                </div>
              </div>

              {/* Time Tracking Counters */}
              <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-800/60 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-orange-400" />
                    Development Resource Accounting
                  </h3>
                  <span className="text-[10px] text-orange-500/80 font-mono font-bold uppercase tracking-wider">Saved Locally</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Days Counter */}
                  <div className="flex items-center justify-between p-3 bg-slate-950/80 rounded-xl border border-slate-800/60">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Days Dedicated</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-orange-400 font-mono">{developerDays}</span>
                        <span className="text-xs text-slate-400 font-mono">days</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleUpdateDays(developerDays - 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-900 hover:bg-slate-800 active:bg-slate-950 border border-slate-800 text-slate-300 font-mono text-sm transition-all font-bold"
                        title="Decrease Days"
                      >
                        -
                      </button>
                      <button 
                        onClick={() => handleUpdateDays(developerDays + 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-900 hover:bg-slate-800 active:bg-slate-950 border border-slate-800 text-slate-300 font-mono text-sm transition-all font-bold"
                        title="Increase Days"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Hours Counter */}
                  <div className="flex items-center justify-between p-3 bg-slate-950/80 rounded-xl border border-slate-800/60">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Total Hours Logged</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-orange-400 font-mono">{developerHours}</span>
                        <span className="text-xs text-slate-400 font-mono">hours</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleUpdateHours(developerHours - 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-900 hover:bg-slate-800 active:bg-slate-950 border border-slate-800 text-slate-300 font-mono text-sm transition-all font-bold"
                        title="Decrease Hours"
                      >
                        -
                      </button>
                      <button 
                        onClick={() => handleUpdateHours(developerHours + 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-900 hover:bg-slate-800 active:bg-slate-950 border border-slate-800 text-slate-300 font-mono text-sm transition-all font-bold"
                        title="Increase Hours"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Version & Changes Timeline */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-orange-500" />
                    Iteration & Version Timeline
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">Chronological Order</span>
                </div>

                <div className="space-y-4 font-sans text-xs">
                  {/* v1.6.0 */}
                  <div className="relative pl-6 border-l-2 border-orange-500/80 pb-2">
                    <div className="absolute -left-[7px] top-0.5 w-3 h-3 rounded-full bg-orange-500 ring-4 ring-[#0f141c]" />
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-orange-400 font-mono text-[11px] bg-orange-500/15 px-1.5 py-0.5 rounded border border-orange-500/20">v1.6.0</span>
                      <span className="text-[10px] text-slate-500 font-mono">Current Iteration (July 2026)</span>
                    </div>
                    <p className="text-slate-300 font-semibold mb-1">Detailed Features Visual Preview & Crop Binding</p>
                    <ul className="list-disc pl-4 text-slate-400 space-y-1 leading-relaxed">
                      <li>Rendered auto-extracted sub-image features and emblems directly on primary character cards in the Media Grid list.</li>
                      <li>Added elegant micro-interaction badges showing a visual grid of detail spots for fast reviews.</li>
                      <li>Bound click handlers on emblem cards to launch the full inspector profile for granular details editing.</li>
                    </ul>
                  </div>

                  {/* v1.5.0 */}
                  <div className="relative pl-6 border-l-2 border-slate-800 pb-2">
                    <div className="absolute -left-[7px] top-0.5 w-3 h-3 rounded-full bg-slate-800 ring-4 ring-[#0f141c]" />
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-300 font-mono text-[11px] bg-slate-800 px-1.5 py-0.5 rounded">v1.5.0</span>
                      <span className="text-[10px] text-slate-500 font-mono">Previous Phase</span>
                    </div>
                    <p className="text-slate-300 font-semibold mb-1">Multi-Feature Analyzer & Coordinate Ingestion</p>
                    <ul className="list-disc pl-4 text-slate-400 space-y-1 leading-relaxed">
                      <li>Upgraded the server-side AI prompt schema to return coordinates of interest inside a structured schema (featuresOfInterest).</li>
                      <li>Created a specialized coordinate cropper canvas in the client application to ingest the analyzer's crops automatically.</li>
                    </ul>
                  </div>

                  {/* v1.4.0 */}
                  <div className="relative pl-6 border-l-2 border-slate-800 pb-2">
                    <div className="absolute -left-[7px] top-0.5 w-3 h-3 rounded-full bg-slate-800 ring-4 ring-[#0f141c]" />
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-300 font-mono text-[11px] bg-slate-800 px-1.5 py-0.5 rounded">v1.4.0</span>
                    </div>
                    <p className="text-slate-300 font-semibold mb-1">Image & Text Analysis API</p>
                    <ul className="list-disc pl-4 text-slate-400 space-y-1 leading-relaxed">
                      <li>Integrated the @google/genai server route.</li>
                      <li>Implemented face/portrait detection using AI bounding boxes for smart automatic character cropping.</li>
                    </ul>
                  </div>

                  {/* v1.3.0 */}
                  <div className="relative pl-6 border-l-2 border-slate-800 pb-2">
                    <div className="absolute -left-[7px] top-0.5 w-3 h-3 rounded-full bg-slate-800 ring-4 ring-[#0f141c]" />
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-300 font-mono text-[11px] bg-slate-800 px-1.5 py-0.5 rounded">v1.3.0</span>
                    </div>
                    <p className="text-slate-300 font-semibold mb-1">Ingestion Engine & Manual Image Cropping Tool</p>
                    <ul className="list-disc pl-4 text-slate-400 space-y-1 leading-relaxed">
                      <li>Created a robust workspace canvas coordinate cropper for fine-tuning thumbnails manually.</li>
                      <li>Added Drag-and-Drop and text parsing ingestion flows.</li>
                    </ul>
                  </div>

                  {/* v1.2.0 */}
                  <div className="relative pl-6 border-l-2 border-slate-800 pb-2">
                    <div className="absolute -left-[7px] top-0.5 w-3 h-3 rounded-full bg-slate-800 ring-4 ring-[#0f141c]" />
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-300 font-mono text-[11px] bg-slate-800 px-1.5 py-0.5 rounded">v1.2.0</span>
                    </div>
                    <p className="text-slate-300 font-semibold mb-1">Favorites & Layout Sorting Deck</p>
                    <ul className="list-disc pl-4 text-slate-400 space-y-1 leading-relaxed">
                      <li>Implemented complete Favorites categorization toggles with responsive state synchronization.</li>
                      <li>Designed customizable cards layout (Compact, Large, Grid) for flexible display densities.</li>
                    </ul>
                  </div>

                  {/* v1.1.0 */}
                  <div className="relative pl-6 border-l-2 border-slate-800 pb-2">
                    <div className="absolute -left-[7px] top-0.5 w-3 h-3 rounded-full bg-slate-800 ring-4 ring-[#0f141c]" />
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-300 font-mono text-[11px] bg-slate-800 px-1.5 py-0.5 rounded">v1.1.0</span>
                    </div>
                    <p className="text-slate-300 font-semibold mb-1">PIN Protected Creator Panel & Client Security</p>
                    <ul className="list-disc pl-4 text-slate-400 space-y-1 leading-relaxed">
                      <li>Created a secure Creator & Developer credits view locked behind a customizable numeric PIN.</li>
                      <li>Added configurable warnings, developer caution text fields, and local database hydration routines.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Dynamic Notes from the Developer / Creator */}
              <div className="space-y-3 bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300 font-mono flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <Edit2 className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                  Live Developer Log Notes
                </h3>
                <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                  Have you completed manual adjustments, code updates, or run local compile cycles? Keep the workspace up-to-date by appending notes directly into the developer log below:
                </p>

                {/* Log Input Form */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const input = form.elements.namedItem("devNote") as HTMLInputElement;
                    if (input && input.value.trim()) {
                      handleAddDeveloperNote(input.value);
                      form.reset();
                    }
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    name="devNote"
                    placeholder="e.g., v1.6.1 - Adjusted card margins for mobile touch targets"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200 outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20"
                    required
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Append Log
                  </button>
                </form>

                {/* Display list of custom notes */}
                {developerNotes.length > 0 ? (
                  <div className="mt-3 space-y-2 max-h-[150px] overflow-y-auto pr-1">
                    {developerNotes.map((note, nIdx) => (
                      <div key={nIdx} className="flex justify-between items-start gap-3 p-2 bg-slate-950/60 rounded-lg border border-slate-800/40 font-mono text-[11px]">
                        <div className="flex items-start gap-1.5 text-slate-300">
                          <span className="text-orange-500/70 select-none">▶</span>
                          <span className="break-all">{note}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = developerNotes.filter((_, idx) => idx !== nIdx);
                            setDeveloperNotes(updated);
                            safeSetStorage("developer_custom_notes", JSON.stringify(updated));
                          }}
                          className="text-slate-500 hover:text-red-400 transition-colors shrink-0"
                          title="Remove log entry"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleClearDeveloperNotes}
                        className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors underline"
                      >
                        Clear All Custom Logs
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 border border-dashed border-slate-800/60 rounded-lg">
                    <span className="text-[11px] text-slate-600 font-mono">No custom log entries appended yet.</span>
                  </div>
                )}
              </div>

            </div>

            {/* Footer */}
            <div className="mt-5 border-t border-slate-800 pt-3 flex justify-between items-center text-[10px] text-slate-500 font-mono">
              <span>Local Workspace Environment</span>
              <button
                type="button"
                onClick={() => setIsDeveloperModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors font-sans"
              >
                Close Panel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {showUserProfileModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseUserModal();
            }
          }}
        >
          <div
            className={`bg-card text-card-foreground p-6 rounded-xl w-full shadow-2xl border border-border animate-in zoom-in-95 duration-200 transition-all duration-300 flex flex-col ${
              userModalSize === "compact"
                ? "max-w-2xl"
                : userModalSize === "spacious"
                  ? "max-w-4xl"
                  : "max-w-6xl w-[94vw]"
            }`}
            style={{
              resize: "both",
              overflow: "auto",
              minWidth: "450px",
              minHeight: "400px",
            }}
          >
            <div className="flex justify-between items-center mb-4 border-b border-border/50 pb-3">
              <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                <User className="w-5 h-5 text-primary" />
                User Profiles Workspace
              </h2>
              <div className="flex items-center gap-3">
                {/* Modal Size Presets */}
                <div className="flex rounded-md bg-secondary p-0.5 text-[11px] font-medium border border-border/40">
                  <button
                    type="button"
                    title="Compact View"
                    onClick={() => setUserModalSize("compact")}
                    className={`px-2 py-1 rounded transition-all flex items-center gap-1 ${userModalSize === "compact" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Compact
                  </button>
                  <button
                    type="button"
                    title="Standard View"
                    onClick={() => setUserModalSize("spacious")}
                    className={`px-2 py-1 rounded transition-all flex items-center gap-1 ${userModalSize === "spacious" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Spacious
                  </button>
                  <button
                    type="button"
                    title="Expanded View"
                    onClick={() => setUserModalSize("expanded")}
                    className={`px-2 py-1 rounded transition-all flex items-center gap-1 ${userModalSize === "expanded" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <Maximize2 className="w-3 h-3" />
                    Wide
                  </button>
                </div>

                <button
                  onClick={handleCloseUserModal}
                  className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-colors border border-transparent hover:border-border/40"
                  title="Close Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Switch & Manage User Profiles */}
            {!isEditingUserProfile && (
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-secondary/20 rounded-lg border border-border/50 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Select Profile:
                  </span>
                  <select
                    value={activeUserProfileId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setActiveUserProfileId(id);
                      safeSetStorage("active_user_profile_id", id);
                      const found = userProfiles.find((p) => p.id === id);
                      if (found) {
                        setUserProfileForm(found);
                      }
                    }}
                    className="bg-card text-xs font-medium border border-border rounded px-2.5 py-1 text-foreground focus:outline-none focus:border-primary cursor-pointer"
                  >
                    {userProfiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.id === "default-user" ? "(Default)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setUserProfileForm({
                        id: "",
                        name: "",
                        role: "",
                        avatarUrl: "",
                        avatarLabel: "",
                        mascotUrl: "",
                        mascotLabel: "",
                        treeLogoUrl: "",
                        treeLogoLabel: "",
                        labtechLogoUrl: "",
                        labtechLogoLabel: "",
                        bio: "",
                      } as any);
                      setIsCreatingUserProfile(true);
                      setIsEditingUserProfile(true);
                    }}
                    className="px-2.5 py-1 text-xs font-medium bg-primary/15 text-primary hover:bg-primary/25 rounded border border-primary/25 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create Profile
                  </button>

                  {activeUserProfileId !== "default-user" && (
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            "Are you sure you want to delete this custom user profile? This action cannot be undone.",
                          )
                        ) {
                          const updated = userProfiles.filter(
                            (p) => p.id !== activeUserProfileId,
                          );
                          setUserProfiles(updated);
                          safeSetStorage(
                            "user_profiles",
                            JSON.stringify(updated),
                          );
                          setActiveUserProfileId("default-user");
                          safeSetStorage(
                            "active_user_profile_id",
                            "default-user",
                          );
                        }
                      }}
                      className="px-2.5 py-1 text-xs font-medium bg-destructive/15 text-destructive hover:bg-destructive/25 rounded border border-destructive/25 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Profile
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="mb-5 animate-in fade-in duration-200">
              {/* Image Gallery */}
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 text-center">
                  {isEditingUserProfile
                    ? "Click any image to crop"
                    : "Click any image to expand full size"}
                </p>
                <div className="flex gap-4 justify-center py-2.5 bg-secondary/20 rounded-lg border border-border/50 flex-wrap">
                  <div className="flex flex-col items-center gap-1.5 w-[130px]">
                    <img
                      src={
                        (isEditingUserProfile
                          ? userProfileForm.avatarUrl
                          : activeUserProfile.avatarUrl) ||
                        "https://raw.githubusercontent.com/toonyman2020/Music-Player/Catti-Cango/Me.jpg"
                      }
                      alt={
                        (isEditingUserProfile
                          ? userProfileForm.avatarLabel
                          : activeUserProfile.avatarLabel) || "User Avatar"
                      }
                      className="w-16 h-16 rounded-full border border-primary/20 object-cover hover:scale-105 transition-transform cursor-pointer"
                      title={`${(isEditingUserProfile ? userProfileForm.avatarLabel : activeUserProfile.avatarLabel) || "User Avatar"} - ${isEditingUserProfile ? "Click to crop" : "Click to expand"}`}
                      onClick={() => {
                        const url =
                          (isEditingUserProfile
                            ? userProfileForm.avatarUrl
                            : activeUserProfile.avatarUrl) ||
                          "https://raw.githubusercontent.com/toonyman2020/Music-Player/Catti-Cango/Me.jpg";
                        if (isEditingUserProfile) {
                          setCroppingImage({
                            slotName: "avatar",
                            profileType: "user",
                            imageUrl: (isEditingUserProfile ? userProfileForm.avatarOriginalUrl : activeUserProfile.avatarOriginalUrl) || url,
                          });
                        } else {
                          window.dispatchEvent(
                            new CustomEvent("expand-image", {
                              detail: { src: activeUserProfile.avatarOriginalUrl || url },
                            }),
                          );
                        }
                      }}
                    />
                    <span
                      className="text-[10px] text-muted-foreground font-semibold text-center whitespace-normal break-words leading-tight w-full px-1"
                      title={
                        (isEditingUserProfile
                          ? userProfileForm.avatarLabel
                          : activeUserProfile.avatarLabel) || "User Avatar"
                      }
                    >
                      {(isEditingUserProfile
                        ? userProfileForm.avatarLabel
                        : activeUserProfile.avatarLabel) || "User Avatar"}
                    </span>
                  </div>

                  <div className="flex flex-col items-center gap-1.5 w-[130px]">
                    <div
                      className="w-16 h-16 rounded-full border border-dashed border-border flex items-center justify-center bg-secondary/10 overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => {
                        const url = isEditingUserProfile
                          ? userProfileForm.mascotUrl
                          : activeUserProfile.mascotUrl;
                        if (url) {
                          if (isEditingUserProfile) {
                            setCroppingImage({
                              slotName: "mascot",
                              profileType: "user",
                              imageUrl: (isEditingUserProfile ? userProfileForm.mascotOriginalUrl : activeUserProfile.mascotOriginalUrl) || url,
                            });
                          } else {
                            window.dispatchEvent(
                              new CustomEvent("expand-image", {
                                detail: { src: activeUserProfile.mascotOriginalUrl || url },
                              }),
                            );
                          }
                        }
                      }}
                    >
                      {(
                        isEditingUserProfile
                          ? userProfileForm.mascotUrl
                          : activeUserProfile.mascotUrl
                      ) ? (
                        <img
                          src={
                            isEditingUserProfile
                              ? userProfileForm.mascotUrl
                              : activeUserProfile.mascotUrl
                          }
                          alt={
                            (isEditingUserProfile
                              ? userProfileForm.mascotLabel
                              : activeUserProfile.mascotLabel) || "User Mascot"
                          }
                          className="w-full h-full object-cover"
                          title={`${(isEditingUserProfile ? userProfileForm.mascotLabel : activeUserProfile.mascotLabel) || "User Mascot"} - ${isEditingUserProfile ? "Click to crop" : "Click to expand"}`}
                        />
                      ) : (
                        <User className="w-6 h-6 text-muted-foreground/45" />
                      )}
                    </div>
                    <span
                      className="text-[10px] text-muted-foreground font-semibold text-center whitespace-normal break-words leading-tight w-full px-1"
                      title={
                        (isEditingUserProfile
                          ? userProfileForm.mascotLabel
                          : activeUserProfile.mascotLabel) || "Mascot"
                      }
                    >
                      {(isEditingUserProfile
                        ? userProfileForm.mascotLabel
                        : activeUserProfile.mascotLabel) || "No Mascot"}
                    </span>
                  </div>

                  <div className="flex flex-col items-center gap-1.5 w-[130px]">
                    <div
                      className="w-16 h-16 rounded-full border border-dashed border-border flex items-center justify-center bg-secondary/10 overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => {
                        const url = isEditingUserProfile
                          ? userProfileForm.treeLogoUrl
                          : activeUserProfile.treeLogoUrl;
                        if (url) {
                          if (isEditingUserProfile) {
                            setCroppingImage({
                              slotName: "treeLogo",
                              profileType: "user",
                              imageUrl: (isEditingUserProfile ? userProfileForm.treeLogoOriginalUrl : activeUserProfile.treeLogoOriginalUrl) || url,
                            });
                          } else {
                            window.dispatchEvent(
                              new CustomEvent("expand-image", {
                                detail: { src: activeUserProfile.treeLogoOriginalUrl || url },
                              }),
                            );
                          }
                        }
                      }}
                    >
                      {(
                        isEditingUserProfile
                          ? userProfileForm.treeLogoUrl
                          : activeUserProfile.treeLogoUrl
                      ) ? (
                        <img
                          src={
                            isEditingUserProfile
                              ? userProfileForm.treeLogoUrl
                              : activeUserProfile.treeLogoUrl
                          }
                          alt={
                            (isEditingUserProfile
                              ? userProfileForm.treeLogoLabel
                              : activeUserProfile.treeLogoLabel) || "User Logo"
                          }
                          className="w-full h-full object-cover"
                          title={`${(isEditingUserProfile ? userProfileForm.treeLogoLabel : activeUserProfile.treeLogoLabel) || "User Logo"} - ${isEditingUserProfile ? "Click to crop" : "Click to expand"}`}
                        />
                      ) : (
                        <Palette className="w-6 h-6 text-muted-foreground/45" />
                      )}
                    </div>
                    <span
                      className="text-[10px] text-muted-foreground font-semibold text-center whitespace-normal break-words leading-tight w-full px-1"
                      title={
                        (isEditingUserProfile
                          ? userProfileForm.treeLogoLabel
                          : activeUserProfile.treeLogoLabel) || "Logo"
                      }
                    >
                      {(isEditingUserProfile
                        ? userProfileForm.treeLogoLabel
                        : activeUserProfile.treeLogoLabel) || "No Studio Logo"}
                    </span>
                  </div>

                  <div className="flex flex-col items-center gap-1.5 w-[130px]">
                    <div
                      className="w-16 h-16 rounded-full border border-dashed border-border flex items-center justify-center bg-secondary/10 overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => {
                        const url = isEditingUserProfile
                          ? userProfileForm.labtechLogoUrl
                          : activeUserProfile.labtechLogoUrl;
                        if (url) {
                          if (isEditingUserProfile) {
                            setCroppingImage({
                              slotName: "labtechLogo",
                              profileType: "user",
                              imageUrl: (isEditingUserProfile ? userProfileForm.labtechLogoOriginalUrl : activeUserProfile.labtechLogoOriginalUrl) || url,
                            });
                          } else {
                            window.dispatchEvent(
                              new CustomEvent("expand-image", {
                                detail: { src: activeUserProfile.labtechLogoOriginalUrl || url },
                              }),
                            );
                          }
                        }
                      }}
                    >
                      {(
                        isEditingUserProfile
                          ? userProfileForm.labtechLogoUrl
                          : activeUserProfile.labtechLogoUrl
                      ) ? (
                        <img
                          src={
                            isEditingUserProfile
                              ? userProfileForm.labtechLogoUrl
                              : activeUserProfile.labtechLogoUrl
                          }
                          alt={
                            (isEditingUserProfile
                              ? userProfileForm.labtechLogoLabel
                              : activeUserProfile.labtechLogoLabel) ||
                            "Alt Logo"
                          }
                          className="w-full h-full object-cover"
                          title={`${(isEditingUserProfile ? userProfileForm.labtechLogoLabel : activeUserProfile.labtechLogoLabel) || "Alt Logo"} - ${isEditingUserProfile ? "Click to crop" : "Click to expand"}`}
                        />
                      ) : (
                        <Eye className="w-6 h-6 text-muted-foreground/45" />
                      )}
                    </div>
                    <span
                      className="text-[10px] text-muted-foreground font-semibold text-center whitespace-normal break-words leading-tight w-full px-1"
                      title={
                        (isEditingUserProfile
                          ? userProfileForm.labtechLogoLabel
                          : activeUserProfile.labtechLogoLabel) || "Alt Logo"
                      }
                    >
                      {(isEditingUserProfile
                        ? userProfileForm.labtechLogoLabel
                        : activeUserProfile.labtechLogoLabel) || "No Alt Logo"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {!isEditingUserProfile && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      User Profile Name
                    </span>
                    <p className="text-base font-semibold text-foreground">
                      {activeUserProfile.name}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Role / Specialty
                    </span>
                    <p className="text-sm text-foreground">
                      {activeUserProfile.role}
                    </p>
                  </div>
                  {activeUserProfile.date && (
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Creation Date
                      </span>
                      <p className="text-sm text-foreground">
                        {activeUserProfile.date}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Description
                    </span>
                    <p className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded-lg border border-border/50 leading-relaxed whitespace-pre-wrap">
                      {activeUserProfile.bio}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <span className="text-xs text-muted-foreground italic">
                    Anyone can customize their own active user profile
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCloseUserModal}
                      className="px-4 py-2 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        setUserProfileForm(activeUserProfile);
                        setIsEditingUserProfile(true);
                      }}
                      className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-opacity-90 transition-opacity flex items-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit Profile
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isEditingUserProfile && (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {/* Profile Name & Title */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      User Profile Name
                    </label>
                    <input
                      type="text"
                      value={userProfileForm.name}
                      onChange={(e) =>
                        setUserProfileForm({
                          ...userProfileForm,
                          name: e.target.value,
                        })
                      }
                      className="w-full p-2 rounded bg-secondary text-xs border border-border outline-none focus:border-primary text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Role / Specialties
                    </label>
                    <input
                      type="text"
                      value={userProfileForm.role}
                      onChange={(e) =>
                        setUserProfileForm({
                          ...userProfileForm,
                          role: e.target.value,
                        })
                      }
                      className="w-full p-2 rounded bg-secondary text-xs border border-border outline-none focus:border-primary text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Creation Date
                    </label>
                    <input
                      type="text"
                      value={userProfileForm.date || ""}
                      onChange={(e) =>
                        setUserProfileForm({
                          ...userProfileForm,
                          date: e.target.value,
                        })
                      }
                      className="w-full p-2 rounded bg-secondary text-xs border border-border outline-none focus:border-primary text-foreground"
                    />
                  </div>
                </div>

                {/* Bio / Description */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Description
                  </label>
                  <textarea
                    rows={5}
                    value={userProfileForm.bio || ""}
                    onChange={(e) =>
                      setUserProfileForm({
                        ...userProfileForm,
                        bio: e.target.value,
                      })
                    }
                    className="w-full p-2.5 rounded bg-secondary text-xs border border-border outline-none focus:border-primary text-foreground resize-y min-h-[80px]"
                    placeholder="Describe your role or scanned character context..."
                  />
                </div>

                {/* Slot 1 Config */}
                <div className="space-y-2 p-2.5 bg-secondary/10 rounded-lg border border-border/40">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-primary">
                    Slot 1 (Profile Photo)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="block text-[10px] text-muted-foreground font-medium mb-1">
                        Label
                      </span>
                      <input
                        type="text"
                        value={userProfileForm.avatarLabel || ""}
                        onChange={(e) =>
                          setUserProfileForm({
                            ...userProfileForm,
                            avatarLabel: e.target.value,
                          })
                        }
                        className="w-full p-1.5 rounded bg-secondary text-xs border border-border"
                        placeholder="User Avatar"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] text-muted-foreground font-medium mb-1">
                        Upload File
                      </span>
                      <div className="flex gap-1.5">
                        <label className="flex-1 w-full flex items-center justify-center gap-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded p-1.5 text-xs font-semibold cursor-pointer transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Choose</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  if (ev.target?.result) {
                                    setUserProfileForm((prev) => ({
                                      ...prev,
                                      avatarUrl: ev.target!.result as string, avatarOriginalUrl: ev.target!.result as string,
                                    }));
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        {userProfileForm.avatarUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setCroppingImage({
                                slotName: "avatar",
                                profileType: "user",
                                imageUrl: userProfileForm.avatarOriginalUrl || userProfileForm.avatarUrl,
                              })
                            }
                            className="flex-1 flex items-center justify-center gap-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-500 border border-amber-500/20 rounded p-1.5 text-xs font-semibold cursor-pointer transition-colors"
                            title="Crop Image"
                          >
                            <Crop className="w-3.5 h-3.5" />
                            <span>Crop</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={userProfileForm.avatarUrl || ""}
                    onChange={(e) =>
                      setUserProfileForm({
                        ...userProfileForm,
                        avatarUrl: e.target.value, avatarOriginalUrl: e.target.value,
                      })
                    }
                    className="w-full p-1.5 rounded bg-secondary text-[11px] border border-border"
                    placeholder="Or paste URL link..."
                  />
                </div>

                {/* Slot 2 Config */}
                <div className="space-y-2 p-2.5 bg-secondary/10 rounded-lg border border-border/40">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-primary">
                    Slot 2 (Mascot Image)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="block text-[10px] text-muted-foreground font-medium mb-1">
                        Label
                      </span>
                      <input
                        type="text"
                        value={userProfileForm.mascotLabel || ""}
                        onChange={(e) =>
                          setUserProfileForm({
                            ...userProfileForm,
                            mascotLabel: e.target.value,
                          })
                        }
                        className="w-full p-1.5 rounded bg-secondary text-xs border border-border"
                        placeholder="User Mascot"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] text-muted-foreground font-medium mb-1">
                        Upload File
                      </span>
                      <div className="flex gap-1.5">
                        <label className="flex-1 w-full flex items-center justify-center gap-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded p-1.5 text-xs font-semibold cursor-pointer transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Choose</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  if (ev.target?.result) {
                                    setUserProfileForm((prev) => ({
                                      ...prev,
                                      mascotUrl: ev.target!.result as string, mascotOriginalUrl: ev.target!.result as string,
                                    }));
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        {userProfileForm.mascotUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setCroppingImage({
                                slotName: "mascot",
                                profileType: "user",
                                imageUrl: userProfileForm.mascotOriginalUrl || userProfileForm.mascotUrl,
                              })
                            }
                            className="flex-1 flex items-center justify-center gap-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-500 border border-amber-500/20 rounded p-1.5 text-xs font-semibold cursor-pointer transition-colors"
                            title="Crop Image"
                          >
                            <Crop className="w-3.5 h-3.5" />
                            <span>Crop</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={userProfileForm.mascotUrl || ""}
                    onChange={(e) =>
                      setUserProfileForm({
                        ...userProfileForm,
                        mascotUrl: e.target.value, mascotOriginalUrl: e.target.value,
                      })
                    }
                    className="w-full p-1.5 rounded bg-secondary text-[11px] border border-border"
                    placeholder="Or paste URL link..."
                  />
                </div>

                {/* Slot 3 Config */}
                <div className="space-y-2 p-2.5 bg-secondary/10 rounded-lg border border-border/40">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-primary">
                    Slot 3 (Studio Logo)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="block text-[10px] text-muted-foreground font-medium mb-1">
                        Label
                      </span>
                      <input
                        type="text"
                        value={userProfileForm.treeLogoLabel || ""}
                        onChange={(e) =>
                          setUserProfileForm({
                            ...userProfileForm,
                            treeLogoLabel: e.target.value,
                          })
                        }
                        className="w-full p-1.5 rounded bg-secondary text-xs border border-border"
                        placeholder="User Logo"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] text-muted-foreground font-medium mb-1">
                        Upload File
                      </span>
                      <div className="flex gap-1.5">
                        <label className="flex-1 w-full flex items-center justify-center gap-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded p-1.5 text-xs font-semibold cursor-pointer transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Choose</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  if (ev.target?.result) {
                                    setUserProfileForm((prev) => ({
                                      ...prev,
                                      treeLogoUrl: ev.target!.result as string, treeLogoOriginalUrl: ev.target!.result as string,
                                    }));
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        {userProfileForm.treeLogoUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setCroppingImage({
                                slotName: "treeLogo",
                                profileType: "user",
                                imageUrl: userProfileForm.treeLogoOriginalUrl || userProfileForm.treeLogoUrl,
                              })
                            }
                            className="flex-1 flex items-center justify-center gap-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-500 border border-amber-500/20 rounded p-1.5 text-xs font-semibold cursor-pointer transition-colors"
                            title="Crop Image"
                          >
                            <Crop className="w-3.5 h-3.5" />
                            <span>Crop</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={userProfileForm.treeLogoUrl || ""}
                    onChange={(e) =>
                      setUserProfileForm({
                        ...userProfileForm,
                        treeLogoUrl: e.target.value, treeLogoOriginalUrl: e.target.value,
                      })
                    }
                    className="w-full p-1.5 rounded bg-secondary text-[11px] border border-border"
                    placeholder="Or paste URL link..."
                  />
                </div>

                {/* Slot 4 Config */}
                <div className="space-y-2 p-2.5 bg-secondary/10 rounded-lg border border-border/40">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-primary">
                    Slot 4 (Alt Logo)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="block text-[10px] text-muted-foreground font-medium mb-1">
                        Label
                      </span>
                      <input
                        type="text"
                        value={userProfileForm.labtechLogoLabel || ""}
                        onChange={(e) =>
                          setUserProfileForm({
                            ...userProfileForm,
                            labtechLogoLabel: e.target.value,
                          })
                        }
                        className="w-full p-1.5 rounded bg-secondary text-xs border border-border"
                        placeholder="User Alt Logo"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] text-muted-foreground font-medium mb-1">
                        Upload File
                      </span>
                      <div className="flex gap-1.5">
                        <label className="flex-1 w-full flex items-center justify-center gap-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded p-1.5 text-xs font-semibold cursor-pointer transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Choose</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  if (ev.target?.result) {
                                    setUserProfileForm((prev) => ({
                                      ...prev,
                                      labtechLogoUrl: ev.target!
                                        .result as string,
                                    }));
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        {userProfileForm.labtechLogoUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setCroppingImage({
                                slotName: "labtechLogo",
                                profileType: "user",
                                imageUrl: userProfileForm.labtechLogoOriginalUrl || userProfileForm.labtechLogoUrl,
                              })
                            }
                            className="flex-1 flex items-center justify-center gap-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-500 border border-amber-500/20 rounded p-1.5 text-xs font-semibold cursor-pointer transition-colors"
                            title="Crop Image"
                          >
                            <Crop className="w-3.5 h-3.5" />
                            <span>Crop</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={userProfileForm.labtechLogoUrl || ""}
                    onChange={(e) =>
                      setUserProfileForm({
                        ...userProfileForm,
                        labtechLogoUrl: e.target.value, labtechLogoOriginalUrl: e.target.value,
                      })
                    }
                    className="w-full p-1.5 rounded bg-secondary text-[11px] border border-border"
                    placeholder="Or paste URL link..."
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
                  <div className="mr-auto flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          confirm(
                            "Are you sure you want to clear all text fields in this user profile?",
                          )
                        ) {
                          setUserProfileForm((prev) => ({
                            ...prev,
                            name: "",
                            role: "",
                            bio: "",
                            avatarLabel: "",
                            mascotLabel: "",
                            treeLogoLabel: "",
                            labtechLogoLabel: "",
                            portfolioUrl: "",
                          }));
                        }
                      }}
                      className="px-3 py-2 text-xs font-medium rounded-md bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors"
                    >
                      Clear Text
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          confirm(
                            "Are you sure you want to clear all images in this user profile?",
                          )
                        ) {
                          setUserProfileForm((prev) => ({
                            ...prev,
                            avatarUrl: "",
                            mascotUrl: "",
                            treeLogoUrl: "",
                            labtechLogoUrl: "",
                          }));
                        }
                      }}
                      className="px-3 py-2 text-xs font-medium rounded-md bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors"
                    >
                      Clear Images
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setIsEditingUserProfile(false);
                      setIsCreatingUserProfile(false);
                      setUserProfileForm(activeUserProfile);
                    }}
                    className="px-4 py-2 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!userProfileForm.name.trim()) {
                        alert("Profile Name is required.");
                        return;
                      }

                      let updatedList;
                      if (isCreatingUserProfile) {
                        const newId = "user-profile-" + Date.now();
                        const newProfile = { ...userProfileForm, id: newId };
                        updatedList = [...userProfiles, newProfile];
                        setUserProfiles(updatedList);
                        setActiveUserProfileId(newId);
                        safeSetStorage("active_user_profile_id", newId);
                      } else {
                        updatedList = userProfiles.map((p) =>
                          p.id === activeUserProfileId
                            ? { ...p, ...userProfileForm }
                            : p,
                        );
                        setUserProfiles(updatedList);
                      }

                      safeSetStorage(
                        "user_profiles",
                        JSON.stringify(updatedList),
                      );
                      setIsEditingUserProfile(false);
                      setIsCreatingUserProfile(false);
                      setShowUserProfileModal(false);
                    }}
                    className="px-5 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-opacity-90 transition-opacity"
                  >
                    Save Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showClearConfirm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowClearConfirm(false);
            }
          }}
        >
          <div className="bg-card text-card-foreground p-6 rounded-xl w-full max-w-md shadow-2xl border border-border animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5 text-destructive animate-bounce" />
              Clear All Data?
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              Are you sure you want to delete all uploaded files and character
              records? This action is permanent and cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setItems([]);
                  setCharacters([]);
                  safeRemoveStorage("archive_items");
                  safeRemoveStorage("archive_characters");
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm font-medium transition-colors shadow-sm"
              >
                Clear Everything
              </button>
            </div>
          </div>
        </div>
      )}

      {showDuplicatesModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDuplicatesModal(false);
            }
          }}
        >
          <div className="bg-card text-card-foreground p-6 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl border border-border animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-foreground">
              <Copy className="w-5 h-5 text-primary" />
              Duplicate Files Found
            </h2>
            <div className="flex-1 overflow-y-auto min-h-0 mb-6 space-y-4">
              {duplicateGroups.length === 0 ? (
                <p className="text-muted-foreground text-sm">No duplicate files found.</p>
              ) : (
                duplicateGroups.map((group, idx) => (
                  <div key={idx} className="bg-secondary/20 p-3 rounded-lg border border-border/50">
                    <p className="text-sm font-semibold mb-2 truncate">Group {idx + 1} - {group.originalName}</p>
                    <div className="space-y-2">
                      {group.items.map((item, itemIdx) => (
                        <div key={item.id} className="flex items-center justify-between bg-background p-2 rounded border border-border/40">
                          <div className="flex items-center gap-3 overflow-hidden">
                            {item.type === "image" ? (
                              <img src={item.thumbnailContent || item.content} alt="thumb" className="w-10 h-10 object-cover rounded shadow-sm" />
                            ) : (
                              <FileText className="w-10 h-10 text-muted-foreground p-1" />
                            )}
                            <div className="text-xs truncate">
                              <p className="font-medium truncate">{item.originalName}</p>
                              <p className="text-muted-foreground">{item.fileSize ? (item.fileSize / 1024).toFixed(1) + " KB" : ""}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setItems(prev => prev.filter(i => i.id !== item.id));
                              setCharacters(prev => prev.filter(c => c.sourceId !== item.id));
                              setDuplicateGroups(prev => {
                                const newGroups = prev.map(g => ({
                                  ...g,
                                  items: g.items.filter(i => i.id !== item.id)
                                }));
                                return newGroups.filter(g => g.items.length > 1);
                              });
                            }}
                            className="p-2 hover:bg-destructive text-destructive hover:text-destructive-foreground rounded-md transition-colors"
                            title="Delete this duplicate"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end pt-3 border-t border-border/50">
              <button
                onClick={() => setShowDuplicatesModal(false)}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Image Lightbox/Expand Overlay */}
      {expandedImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 cursor-zoom-out animate-in fade-in duration-200"
          onClick={() => setExpandedImage(null)}
        >
          <button
            onClick={() => setExpandedImage(null)}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-secondary/80 text-foreground hover:bg-secondary transition-colors cursor-pointer border border-border/40"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={expandedImage}
            alt="Full Size Expanded"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200 cursor-zoom-out"
          />
        </div>
      )}

      {/* Interactive Image Cropper Overlay */}
      {croppingImage && (
        <ImageCropper
          imageUrl={croppingImage.imageUrl}
          slotName={croppingImage.slotName}
          profileType={croppingImage.profileType}
          onClose={() => setCroppingImage(null)}
          onReset={() => {
            if (croppingImage.profileType === "creator") {
              setModalForm((prev) => ({
                ...prev,
                [croppingImage.slotName + "Url"]: (prev as any)[croppingImage.slotName + "OriginalUrl"],
              }));
            } else if (croppingImage.profileType === "user") {
              setUserProfileForm((prev) => ({
                ...prev,
                [croppingImage.slotName + "Url"]: (prev as any)[croppingImage.slotName + "OriginalUrl"],
              }));
            } else if (croppingImage.profileType === "archive") {
              setItems((prev) =>
                prev.map((i) =>
                  i.id === croppingImage.itemId
                    ? { ...i, thumbnailContent: undefined }
                    : i
                )
              );
            }
            setCroppingImage(null);
          }}
          onCropSave={(croppedUrl) => {
            if (croppingImage.profileType === "creator") {
              setModalForm((prev) => ({
                ...prev,
                [croppingImage.slotName + "Url"]: croppedUrl,
              }));
            } else if (croppingImage.profileType === "user") {
              setUserProfileForm((prev) => ({
                ...prev,
                [croppingImage.slotName + "Url"]: croppedUrl,
              }));
            } else if (croppingImage.profileType === "archive") {
              setItems((prev) =>
                prev.map((i) =>
                  i.id === croppingImage.itemId
                    ? { ...i, thumbnailContent: croppedUrl }
                    : i
                )
              );
            } else if (croppingImage.profileType === "character") {
              window.dispatchEvent(
                new CustomEvent("character-crop-complete", {
                  detail: {
                    croppedUrl,
                    charId: croppingImage.charId,
                    slotName: croppingImage.slotName,
                  },
                })
              );
            }
            setCroppingImage(null);
          }}
        />
      )}

      {/* Premium State-Driven Confirmation Dialog */}
      {confirmModal.isOpen && (
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
          }}
        >
          <div className="bg-card text-card-foreground p-6 rounded-xl w-full max-w-md shadow-2xl border border-border animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-3">
              {confirmModal.type === "danger" ? (
                <div className="p-1.5 bg-destructive/10 text-destructive rounded-lg shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
              ) : (
                <div className="p-1.5 bg-primary/10 text-primary rounded-lg shrink-0">
                  <AlertCircle className="w-5 h-5 text-blue-500" />
                </div>
              )}
              <span className="truncate">{confirmModal.title}</span>
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {confirmModal.message}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }}
                className={`px-4 py-2 text-sm font-semibold rounded-lg text-white hover:opacity-90 transition-opacity ${
                  confirmModal.type === "danger" ? "bg-destructive" : "bg-primary"
                }`}
              >
                {confirmModal.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const isCrossOrigin = (url: string) => {
  if (!url) return false;
  if (url.startsWith("data:") || url.startsWith("blob:") || url.startsWith("/")) return false;
  try {
    const parsed = new URL(url, window.location.href);
    return parsed.origin !== window.location.origin;
  } catch (e) {
    return false;
  }
};

interface ImageCropperProps {
  imageUrl: string;
  slotName: string;
  profileType: "creator" | "user" | "archive" | "character";
  onClose: () => void;
  onCropSave: (croppedDataUrl: string) => void;
  onReset: () => void;
}

export function ImageCropper({
  imageUrl,
  slotName,
  profileType,
  onClose,
  onCropSave,
  onReset,
}: ImageCropperProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDrag, setIsDrag] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isCircle, setIsCircle] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '3:4' | '4:3' | '16:9' | '9:16' | 'stretch'>('1:1');
  const [fitMode, setFitMode] = useState<'cover' | 'contain' | 'fill'>('cover');
  const [imgDims, setImgDims] = useState<{ w: number; h: number } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current) {
      const img = imgRef.current;
      if (img.complete && img.naturalWidth && img.naturalHeight) {
        setImgDims({ w: img.naturalWidth, h: img.naturalHeight });
      }
    }
  }, [imageUrl]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDrag(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrag) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsDrag(false);
  };

  // Touch support
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      setIsDrag(true);
      const touch = e.touches[0];
      setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDrag || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPan({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  // Frame dimensions based on aspect ratio
  let frameW = 240;
  let frameH = 240;
  let canvasW = 400;
  let canvasH = 400;

  if (aspectRatio === '3:4') {
    frameW = 210;
    frameH = 280;
    canvasW = 360;
    canvasH = 480;
  } else if (aspectRatio === '4:3') {
    frameW = 280;
    frameH = 210;
    canvasW = 480;
    canvasH = 360;
  } else if (aspectRatio === '16:9') {
    frameW = 300;
    frameH = 168;
    canvasW = 480;
    canvasH = 270;
  } else if (aspectRatio === '9:16') {
    frameW = 168;
    frameH = 300;
    canvasW = 270;
    canvasH = 480;
  } else if (aspectRatio === 'stretch') {
    frameW = 240;
    frameH = 240;
    canvasW = 400;
    canvasH = 400;
  }

  let renderWidth = frameW;
  let renderHeight = frameH;

  if (imgDims) {
    const { w, h } = imgDims;
    if (fitMode === 'fill' || aspectRatio === 'stretch') {
      renderWidth = frameW;
      renderHeight = frameH;
    } else if (fitMode === 'contain') {
      const scale = Math.min(frameW / w, frameH / h);
      renderWidth = w * scale;
      renderHeight = h * scale;
    } else {
      // cover
      const scale = Math.max(frameW / w, frameH / h);
      renderWidth = w * scale;
      renderHeight = h * scale;
    }
  }

  const executeCropAndSave = () => {
    const img = new Image();
    if (isCrossOrigin(imageUrl)) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvasW, canvasH);

        // Draw circular mask if requested (only in 1:1)
        if (isCircle && aspectRatio === '1:1') {
          ctx.beginPath();
          ctx.arc(canvasW / 2, canvasH / 2, canvasW / 2, 0, Math.PI * 2);
          ctx.clip();
        }

        const scaleX = canvasW / frameW;
        const scaleY = canvasH / frameH;

        if (fitMode === 'fill' || aspectRatio === 'stretch') {
          const dx = pan.x * scaleX;
          const dy = pan.y * scaleY;
          const dw = canvasW * zoom;
          const dh = canvasH * zoom;
          ctx.drawImage(img, (canvasW - dw) / 2 + dx, (canvasH - dh) / 2 + dy, dw, dh);
        } else {
          const scaledW = renderWidth * zoom * scaleX;
          const scaledH = renderHeight * zoom * scaleY;
          const dx = ((frameW - renderWidth * zoom) / 2 + pan.x) * scaleX;
          const dy = ((frameH - renderHeight * zoom) / 2 + pan.y) * scaleY;

          ctx.drawImage(img, dx, dy, scaledW, scaledH);
        }

        try {
          const croppedDataUrl = canvas.toDataURL("image/png", 0.95);
          onCropSave(croppedDataUrl);
        } catch (error) {
          console.error("Failed to export cropped canvas", error);
          alert(
            "Could not crop secure or cross-origin image. Try uploading a local file or using a different image URL.",
          );
          onClose();
        }
      }
    };
    img.onerror = () => {
      alert("Unable to load image for cropping.");
      onClose();
    };
    img.src = imageUrl;
  };

  return (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-card text-card-foreground p-5 sm:p-6 rounded-2xl w-full max-w-lg shadow-2xl border border-border animate-in zoom-in-95 duration-200 flex flex-col max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-3 border-b border-border/50 pb-2">
          <h3 className="text-base font-bold flex items-center gap-2">
            <Crop className="w-5 h-5 text-primary" />
            Precise Thumbnail & Image Cropper
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center justify-center space-y-3">
          {/* Aspect Ratio Presets */}
          <div className="w-full">
            <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
              Aspect Ratio Preset
            </label>
            <div className="grid grid-cols-6 gap-1 bg-secondary/40 p-1 rounded-lg border">
              {(['1:1', '3:4', '4:3', '16:9', '9:16', 'stretch'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setAspectRatio(r);
                    if (r === 'stretch') setFitMode('fill');
                    setPan({ x: 0, y: 0 });
                  }}
                  className={`py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
                    aspectRatio === r
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {r === 'stretch' ? 'Stretch' : r}
                </button>
              ))}
            </div>
          </div>

          {/* Viewport Frame */}
          <div
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUpOrLeave}
            style={{ width: `${frameW}px`, height: `${frameH}px` }}
            className={`relative bg-secondary/60 border-2 border-primary/60 shadow-inner overflow-hidden cursor-grab active:cursor-grabbing select-none transition-all flex items-center justify-center ${
              isCircle && aspectRatio === '1:1' ? "rounded-full" : "rounded-xl"
            }`}
          >
            <img
              ref={imgRef}
              src={imageUrl}
              onLoad={(e) => {
                setImgDims({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight });
              }}
              crossOrigin={isCrossOrigin(imageUrl) ? "anonymous" : undefined}
              alt="Crop Preview"
              draggable={false}
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: "center center",
                width: `${renderWidth}px`,
                height: `${renderHeight}px`,
                position: "absolute",
                left: "50%",
                top: "50%",
                marginLeft: `-${renderWidth / 2}px`,
                marginTop: `-${renderHeight / 2}px`,
                objectFit: fitMode,
              }}
              className="pointer-events-none select-none max-w-none max-h-none"
            />

            {/* Grid overlay lines */}
            <div className="absolute inset-0 border border-primary/20 pointer-events-none flex flex-col justify-between">
              <div className="h-px bg-primary/15 w-full mt-[33%]"></div>
              <div className="h-px bg-primary/15 w-full mb-[33%]"></div>
            </div>
            <div className="absolute inset-0 border border-primary/20 pointer-events-none flex justify-between">
              <div className="w-px bg-primary/15 h-full ml-[33%]"></div>
              <div className="w-px bg-primary/15 h-full mr-[33%]"></div>
            </div>
          </div>

          {/* Controls Row */}
          <div className="w-full space-y-2.5 px-1">
            {/* Zoom Slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground mb-1">
                <span className="flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-primary" />
                  Zoom Scale:
                </span>
                <span className="font-bold text-primary">{zoom.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="4"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Fit Mode and Shape Toggles */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Fit Mode</label>
                <div className="grid grid-cols-3 gap-1 bg-secondary/40 p-0.5 rounded-lg border text-[10px]">
                  {(['cover', 'contain', 'fill'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setFitMode(mode)}
                      className={`py-1 rounded font-bold capitalize transition-all cursor-pointer ${
                        fitMode === mode ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {mode === 'fill' ? 'Stretch' : mode}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Shape</label>
                <div className="grid grid-cols-2 gap-1 bg-secondary/40 p-0.5 rounded-lg border text-[10px]">
                  <button
                    type="button"
                    onClick={() => setIsCircle(false)}
                    className={`py-1 rounded font-bold transition-all cursor-pointer ${
                      !isCircle ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Standard
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCircle(true);
                      setAspectRatio('1:1');
                    }}
                    className={`py-1 rounded font-bold transition-all cursor-pointer ${
                      isCircle ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Circle
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 w-full pt-2 border-t border-border/50">
            <button
              type="button"
              onClick={() => {
                setPan({ x: 0, y: 0 });
                setZoom(1);
                setFitMode('cover');
                setAspectRatio('1:1');
                if (onReset) onReset();
              }}
              className="flex-1 py-2 text-xs font-bold rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors flex items-center justify-center gap-1 cursor-pointer"
              title="Reset Position & Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-xs font-bold rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={executeCropAndSave}
              className="flex-1 py-2 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-opacity flex items-center justify-center gap-1 shadow-sm cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Save Crop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Keep it modular, I will create Dashboard and MediaView components next.
