import express from 'express';
import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';
import { GoogleGenAI } from '@google/genai';
import multer from 'multer';
import { google } from 'googleapis';
import {
  generate,
  engineStatus,
  listLocalModels,
  loadLocalModel,
  unloadLocalModel,
  getConfig,
  saveConfig,
  getActiveModelNames,
} from './ai-engine';
import { IS_COMMERCIAL } from './src/flags';

// Vite is only needed by the dev middleware below, and it is heavy. Loading it
// lazily keeps the production bundle (and the packaged app) from having to ship
// it at all.
let createViteServer: typeof import('vite').createServer | null = null;
async function loadVite() {
  if (!createViteServer) {
    ({ createServer: createViteServer } = await import('vite'));
  }
  return createViteServer!;
}

// Use disk storage to prevent out-of-memory crashes
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), 'temp_uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  }),
  limits: { fileSize: 500 * 1024 * 1024 }
});

// Memory-based log buffer for easy real-time server debugging
const serverLogs: string[] = [];
const originalLog = console.log;
const originalError = console.error;

console.log = (...args: any[]) => {
  serverLogs.push(`[LOG] ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}`);
  if (serverLogs.length > 1000) serverLogs.shift();
  originalLog(...args);
};

console.error = (...args: any[]) => {
  serverLogs.push(`[ERROR] ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}`);
  if (serverLogs.length > 1000) serverLogs.shift();
  originalError(...args);
};

// ---------------------------------------------------------------------------
// AI Engine Settings
//
// The configuration lives in ai-engine.ts and is the single source of truth.
// This file used to keep its own copy, and the two drifted: the engine
// defaulted to local models while the duplicate here still defaulted to Gemini,
// so the "is AI available" guard below rejected every local request before the
// engine was ever reached. Every route asked for a key that was irrelevant.
// ---------------------------------------------------------------------------
const CONFIG_PATH = path.join(process.cwd(), 'chararchive.config.json');

const loadAIConfig = getConfig;
const saveAIConfig = saveConfig;
type AIConfig = ReturnType<typeof getConfig>;

// Apply the saved key so the Gemini key-test endpoint and any remaining legacy
// reads keep working.
function applyAIConfig(cfg: AIConfig) {
  if (cfg.geminiApiKey) {
    process.env.GEMINI_API_KEY = cfg.geminiApiKey;
  } else {
    delete process.env.GEMINI_API_KEY;
  }
}

// ---------------------------------------------------------------------------
// Engine routing
//
// Each analysis route used to build a GoogleGenAI client and call Gemini
// directly, which meant selecting Local Ollama in the settings panel had no
// effect on analysis at all. aiClient() keeps the existing call sites working
// while sending the request to whichever engine is configured.
// ---------------------------------------------------------------------------

/**
 * A stand-in for the GoogleGenAI client with the same generateContent shape.
 * The prompt and inline image are pulled back out of `contents.parts` so each
 * route can keep building its request exactly as before.
 */
function aiClient() {
  return {
    models: {
      generateContent: async (args: any) => {
        // Routes here pass the prompt either as a plain string in `contents` or
        // as a Gemini-style parts array. Reading only the parts array meant the
        // routes using a bare string silently sent an empty prompt: the model
        // had nothing to work from and answered with done_reason "load", which
        // surfaced as "returned an empty response" and looked like a broken
        // model. Accept both shapes.
        const parts: any[] = Array.isArray(args?.contents?.parts) ? args.contents.parts : [];
        const fromParts = parts
          .filter((p: any) => typeof p?.text === 'string')
          .map((p: any) => p.text)
          .join('\n\n');
        const prompt = fromParts || (typeof args?.contents === 'string' ? args.contents : '');
        const image = parts.find((p: any) => p?.inlineData?.data)?.inlineData?.data;

        if (!prompt) {
          throw new Error('The request had no text to send to the AI engine.');
        }

        const text = await generate({
          prompt,
          image,
          json: args?.config?.responseMimeType === 'application/json',
        });
        return { text };
      },
    },
  };
}

/** Whether the configured engine could plausibly run, checked without a call. */
function aiAvailable(): boolean {
  const cfg = loadAIConfig();
  if (cfg.provider === 'off') return false;
  if (cfg.provider === 'ollama') return true;
  return Boolean(cfg.geminiApiKey);
}

/** A message that says what is actually wrong, rather than always blaming the key. */
function aiUnavailableReason(): string {
  const cfg = loadAIConfig();
  if (cfg.provider === 'off') {
    return 'AI is disabled. Choose a provider under AI Engine Settings.';
  }
  if (cfg.provider === 'ollama') {
    return 'No local model server answered. Start Ollama, then press Re-check in AI Engine Settings.';
  }
  return 'GEMINI_API_KEY is not set. Add a key in AI Engine Settings, or switch to Local Ollama.';
}

const OLLAMA_FALLBACK_PORTS = [11434, 11435, 11436];

async function probeOllamaOnce(baseUrl: string) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/tags`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return { running: false, models: [] as string[], error: `HTTP ${res.status}` };
    const json: any = await res.json();
    const models = (json.models || []).map((m: any) => m.name).filter(Boolean);
    return { running: true, models, error: null as string | null };
  } catch (err: any) {
    return { running: false, models: [] as string[], error: err?.name === 'AbortError' ? 'Timed out' : String(err?.message || err) };
  }
}

// Ollama moves to a different port when another instance holds the default one,
// so probe the saved address first and then a couple of common fallbacks.
async function probeOllama(baseUrl: string) {
  const first = await probeOllamaOnce(baseUrl);
  if (first.running) return first;

  const tryPorts = OLLAMA_FALLBACK_PORTS.filter((p) => !baseUrl.includes(String(p)));
  for (const port of tryPorts) {
    const candidate = await probeOllamaOnce(`http://127.0.0.1:${port}`);
    if (candidate.running) {
      return { ...candidate, resolvedUrl: `http://127.0.0.1:${port}` };
    }
  }
  return first;
}

// Utility function to robustly extract and parse JSON from Gemini text response
function cleanAndParseJSON(text: string): any {
  if (!text) return {};
  let cleaned = text.trim();
  
  // Remove markdown code block wrappers if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }
  
  cleaned = cleaned.trim();
  
  // Find first '{' or '[' and last '}' or ']' to isolate the JSON block
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let startIdx = -1;
  let endIdx = -1;
  
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    endIdx = cleaned.lastIndexOf('}');
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    endIdx = cleaned.lastIndexOf(']');
  }
  
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }
  
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('Failed to parse JSON content:', cleaned);
    throw e;
  }
}

// Utility function to convert structured chat exports or SillyTavern character JSON cards to clean markdown text
function parseJsonContent(jsonStr: string): string {
  try {
    const data = JSON.parse(jsonStr);
    
    // Case 1: SillyTavern / Character Card JSON formats
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      if (data.name || data.description || data.personality || data.scenario) {
        let output = `--- CHARACTER PROFILE IMPORT ---\n`;
        if (data.name) output += `Name: ${data.name}\n`;
        if (data.species) output += `Species: ${data.species}\n`;
        if (data.gender) output += `Gender: ${data.gender}\n`;
        if (data.personality) output += `Personality: ${data.personality}\n`;
        if (data.description) output += `Description: ${data.description}\n`;
        if (data.scenario) output += `Scenario: ${data.scenario}\n`;
        if (data.first_mes || data.first_message) output += `First Message: ${data.first_mes || data.first_message}\n`;
        if (data.mes_example || data.example_messages) output += `Example Dialogue:\n${data.mes_example || data.example_messages}\n`;
        return output;
      }
      
      // Case 2: Telegram / ChatGPT messages array
      if (Array.isArray(data.messages)) {
        let output = `--- CHAT EXPORT MESSAGES ---\n`;
        data.messages.slice(0, 1000).forEach((m: any) => {
          const sender = m.from || m.author || m.sender || m.role || 'Participant';
          const text = m.text || m.content || '';
          if (text) {
            output += `[${sender}]: ${typeof text === 'string' ? text : JSON.stringify(text)}\n`;
          }
        });
        return output;
      }

      // Case 3: ChatGPT conversations format
      if (Array.isArray(data.mapping || data.threads)) {
        let output = `--- CHAT CONVERSATION THREADS ---\n`;
        let count = 0;
        const nodes = data.mapping ? Object.values(data.mapping) : [];
        nodes.forEach((node: any) => {
          if (node.message && node.message.content && node.message.content.parts) {
            const role = node.message.author?.role || 'user';
            const parts = node.message.content.parts.filter((p: any) => typeof p === 'string').join('\n');
            if (parts && count < 1000) {
              output += `[${role}]: ${parts}\n`;
              count++;
            }
          }
        });
        if (count > 0) return output;
      }
    }

    // Case 4: Top-level Array of messages/chats
    if (Array.isArray(data)) {
      let output = `--- CHAT EXPORT STREAM ---\n`;
      data.slice(0, 1000).forEach((item: any) => {
        if (typeof item === 'string') {
          output += `${item}\n`;
        } else if (item && typeof item === 'object') {
          const sender = item.role || item.sender || item.from || item.author || item.name || 'Speaker';
          const text = item.content || item.text || item.message || '';
          if (text) {
            output += `[${sender}]: ${text}\n`;
          }
        }
      });
      return output;
    }

    // Case 5: Generic JSON stringify
    return `--- GENERIC JSON FILE CONTENT ---\n` + JSON.stringify(data, null, 2);
  } catch (err) {
    return jsonStr; // fallback to raw string
  }
}

// Memory-based tracking of model failures to handle Gemini API rate limits and quotas dynamically
const modelFailures = new Map<string, { count: number; lastFailed: number }>();

function getModelsToTry(): string[] {
  // Failover between Gemini models only means anything when Gemini is the
  // configured provider. With Ollama the engine picks one local model for the
  // whole request, so every "alternate candidate" below would run the exact
  // same call again. That turned a single failure into seven identical
  // multi-minute attempts before the error finally surfaced, and the log
  // named Gemini models that were never involved.
  const cfg = loadAIConfig();
  if (cfg.provider !== 'gemini') {
    return ['local'];
  }

  // A robust selection of current stable Gemini multimodal models
  const allModels = [
    'gemini-3.5-flash-lite',
    'gemini-3.7-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-3.1-pro-preview'
  ];

  const now = Date.now();
  // Sort models dynamically: place active failures at the very end of the list
  return [...allModels].sort((a, b) => {
    const failA = modelFailures.get(a);
    const failB = modelFailures.get(b);

    const isAActiveFail = failA && (now - failA.lastFailed < 15 * 60 * 1000); // 15-minute cool-off
    const isBActiveFail = failB && (now - failB.lastFailed < 15 * 60 * 1000);

    if (isAActiveFail && !isBActiveFail) return 1;  // Put 'a' at the end
    if (!isAActiveFail && isBActiveFail) return -1; // Put 'b' at the end

    if (isAActiveFail && isBActiveFail) {
      // Both have failed recently; try the one that failed longest ago first
      return failA!.lastFailed - failB!.lastFailed;
    }

    return 0; // Default ordering
  });
}

// Helper function to recursively retrieve all source files
function getAllFilesRecursive(dirPath: string, relativeRoot: string = ''): { path: string; name: string }[] {
  let results: { path: string; name: string }[] = [];
  if (!fs.existsSync(dirPath)) return results;
  try {
    const list = fs.readdirSync(dirPath);
    const excludeDirs = ['node_modules', 'dist', 'temp_uploads', 'temp', '.git', '.aistudio', '.github'];
    const allowedExtensions = ['.ts', '.tsx', '.json', '.css', '.html', '.js', '.cjs', '.mjs', '.md'];

    for (const file of list) {
      const fullPath = path.join(dirPath, file);
      const relPath = relativeRoot ? `${relativeRoot}/${file}` : file;
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (excludeDirs.includes(file)) continue;
        results = results.concat(getAllFilesRecursive(fullPath, relPath));
      } else {
        const ext = path.extname(file).toLowerCase();
        if (allowedExtensions.includes(ext)) {
          results.push({ path: relPath, name: relPath });
        }
      }
    }
  } catch (err) {
    console.error(`Error scanning directory ${dirPath}:`, err);
  }
  return results;
}

async function startServer() {
  const app = express();

  // Honour PORT from .env / environment instead of hardcoding, falling back to a
  // free port if 3000 is already taken.
  const PORT = Number(process.env.PORT) || 3000;

  // Load any AI key saved from inside the app before routes are hit.
  const aiConfig = loadAIConfig();
  applyAIConfig(aiConfig);

  app.use((req, res, next) => {
    console.log(`Received request: ${req.method} ${req.url}`);
    next();
  });

  // Add built-in JSON parser for application/json bodies
  app.use(express.json({ limit: '500mb' }));
  app.use(express.urlencoded({ extended: true, limit: '500mb' }));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // ---- AI engine settings -------------------------------------------------
  // GET returns the current configuration. The API key itself is never sent
  // back to the browser, only whether one is present plus a masked preview.
  app.get('/api/settings/ai', async (req, res) => {
    const cfg = loadAIConfig();
    const masked = cfg.geminiApiKey
      ? `${cfg.geminiApiKey.slice(0, 4)}${'*'.repeat(8)}${cfg.geminiApiKey.slice(-4)}`
      : null;
    const ollama = await probeOllama(cfg.ollamaBaseUrl);
    // If auto-detection found Ollama on another port, remember it so the
    // provider dropdown can be switched on without further hunting.
    const resolvedUrl = (ollama as any).resolvedUrl;
    if (resolvedUrl && resolvedUrl !== cfg.ollamaBaseUrl) {
      cfg.ollamaBaseUrl = resolvedUrl;
      saveAIConfig(cfg);
    }
    res.json({
      success: true,
      provider: cfg.provider,
      hasGeminiKey: Boolean(cfg.geminiApiKey),
      maskedKey: masked,
      ollamaBaseUrl: cfg.ollamaBaseUrl,
      ollamaVisionModel: cfg.ollamaVisionModel,
      ollamaTextModel: cfg.ollamaTextModel,
      ollamaRunning: ollama.running,
      ollamaModels: ollama.models,
      ollamaError: ollama.error,
    });
  });

  app.post('/api/settings/ai', (req, res) => {
    try {
      const current = loadAIConfig();
      const body = req.body || {};
      const incoming: Partial<AIConfig> = body.ai || {};

      const next: AIConfig = {
        provider:
          incoming.provider === 'ollama' || incoming.provider === 'off' || incoming.provider === 'gemini'
            ? incoming.provider
            : current.provider,
        geminiApiKey:
          typeof incoming.geminiApiKey === 'string' ? incoming.geminiApiKey.trim() : current.geminiApiKey,
        ollamaBaseUrl:
          typeof incoming.ollamaBaseUrl === 'string' && incoming.ollamaBaseUrl.trim()
            ? incoming.ollamaBaseUrl.trim()
            : current.ollamaBaseUrl,
        ollamaVisionModel: incoming.ollamaVisionModel || current.ollamaVisionModel,
        ollamaTextModel: incoming.ollamaTextModel || current.ollamaTextModel,
      };

      saveAIConfig(next);
      applyAIConfig(next);
      res.json({
        success: true,
        provider: next.provider,
        hasGeminiKey: Boolean(next.geminiApiKey),
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Could not save AI settings' });
    }
  });

  // Clear the saved key without touching other stored preferences.
  app.post('/api/settings/ai/clear-key', (req, res) => {
    try {
      const cfg = loadAIConfig();
      cfg.geminiApiKey = '';
      saveAIConfig(cfg);
      applyAIConfig(cfg);
      res.json({ success: true, hasGeminiKey: false });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Could not clear the API key' });
    }
  });

  // Verify a key actually works before the user relies on it.
  app.post('/api/settings/ai/test', async (req, res) => {
    const key = String(req.body?.apiKey || process.env.GEMINI_API_KEY || '').trim();
    if (!key) {
      return res.json({ success: false, message: 'No API key provided.' });
    }
    try {
      const probe = new GoogleGenAI({ apiKey: key });
      await probe.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: 'Reply with the single word: OK',
      });
      res.json({ success: true, message: 'Gemini key is valid and responding.' });
    } catch (err: any) {
      res.json({
        success: false,
        message: String(err?.message || err).slice(0, 300),
      });
    }
  });

  app.post('/api/settings/ai/check-ollama', async (req, res) => {
    const baseUrl = String(req.body?.ollamaBaseUrl || loadAIConfig().ollamaBaseUrl);
    const probe = await probeOllama(baseUrl);
    res.json({ success: true, ...probe });
  });

  // ---- Local model management ---------------------------------------------
  // Ollama loads weights into memory on first use, so a model that is installed
  // but not loaded makes the first analysis after a restart very slow. These
  // routes let the UI show what is ready and warm a model on demand.
  app.get('/api/ai/status', async (req, res) => {
    try {
      res.json({ success: true, ...(await engineStatus()) });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Could not read engine status' });
    }
  });

  // Model inventory lives further down, alongside the toggle route, so the
  // on/off state and the list are returned together.

  app.post('/api/ai/models/load', async (req, res) => {
    const name = String(req.body?.model || '').trim();
    if (!name) return res.status(400).json({ error: 'No model name given.' });
    try {
      console.log(`Loading local model ${name} into memory...`);
      const result = await loadLocalModel(name);
      console.log(`Local model ${name} is loaded.`);
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Could not load the model' });
    }
  });

  app.post('/api/ai/models/unload', async (req, res) => {
    const name = String(req.body?.model || '').trim();
    if (!name) return res.status(400).json({ error: 'No model name given.' });
    try {
      res.json({ success: true, ...(await unloadLocalModel(name)) });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Could not unload the model' });
    }
  });

  // Switch a model on or off. Off models stay installed and are skipped when
  // the engine picks one to use, so a model can be muted without a re-download.
  app.post('/api/ai/models/toggle', async (req, res) => {
    const name = String(req.body?.model || '').trim();
    const enabled = Boolean(req.body?.enabled);
    if (!name) return res.status(400).json({ error: 'No model name given.' });

    try {
      const cfg = loadAIConfig();
      const disabled = new Set(cfg.disabledModels || []);

      // Never let the last usable model be switched off, or nothing can run.
      const { models } = await listLocalModels(cfg.ollamaBaseUrl);
      const others = models
        .map((m) => m.name)
        .filter((n) => n !== name && !disabled.has(n));
      if (!enabled && others.length === 0) {
        return res.status(400).json({
          error: 'At least one model has to stay on. Switch another one on first.',
        });
      }

      if (enabled) disabled.delete(name);
      else disabled.add(name);

      saveAIConfig({ ...cfg, disabledModels: [...disabled] });
      res.json({ success: true, enabled, disabledModels: [...disabled] });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Could not change the model setting' });
    }
  });

  // Flag each model with whether it is switched on, so the panel can render
  // the right control without a second round trip.
  app.get('/api/ai/models', async (req, res, next) => {
    try {
      const cfg = loadAIConfig();
      const { url, models } = await listLocalModels(
        String(req.query.ollamaBaseUrl || '') || undefined
      );
      const disabled = new Set(cfg.disabledModels || []);
      // The model the engine will really use, so the top bar's Load button
      // targets the same one analysis does rather than guessing in the browser.
      const active = await getActiveModelNames();
      res.json({
        success: true,
        serverRunning: Boolean(url),
        ollamaUrl: url,
        activeVisionModel: active.vision,
        activeTextModel: active.text,
        models: models.map((m) => ({ ...m, enabled: !disabled.has(m.name) })),
      });
    } catch (err: any) {
      next(err);
    }
  });

  // This route returns every source file in the project as text. It is the app's
  // own backup exporter and is invaluable while developing, but shipping it in a
  // build you hand to someone else would hand them the source too. A commercial
  // build removes it entirely rather than hiding it.
  if (!IS_COMMERCIAL) {
  app.get('/api/backup-source', (req, res) => {
    try {
      const rootFiles = ['server.ts', 'package.json', 'index.html', 'vite.config.ts', 'tsconfig.json', 'metadata.json', '.env.example'];
      const filesToBackup: { path: string; name: string }[] = [];
      
      for (const f of rootFiles) {
        if (fs.existsSync(path.join(process.cwd(), f))) {
          filesToBackup.push({ path: f, name: f });
        }
      }
      
      const srcFiles = getAllFilesRecursive(path.join(process.cwd(), 'src'), 'src');
      filesToBackup.push(...srcFiles);

      const backupData: { [key: string]: string } = {};

      for (const file of filesToBackup) {
        const fullPath = path.join(process.cwd(), file.path);
        if (fs.existsSync(fullPath)) {
          backupData[file.name] = fs.readFileSync(fullPath, 'utf-8');
        }
      }

      res.json({
        success: true,
        dateCreated: "June 28, 2026",
        files: backupData
      });
    } catch (error: any) {
      console.error('Backup source error:', error);
      res.status(500).json({ error: error.message || 'Error creating backup' });
    }
  });
  }

  app.post('/api/upload-archive', upload.single('archive'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No archive uploaded' });
      }

      const zip = new AdmZip(req.file.path);
      const zipEntries = zip.getEntries();
      const extractedFiles = zipEntries.map(entry => entry.entryName);

      // Extract to a temporary folder
      const tempPath = path.join(process.cwd(), 'temp', Date.now().toString());
      zip.extractAllTo(tempPath, true);
      
      // Delete temporary file after extracting
      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        message: 'Archive extracted successfully',
        files: extractedFiles,
        tempPath: tempPath
      });
    } catch (error: any) {
      console.error('Archive extraction error:', error);
      res.status(500).json({ error: error.message || 'Error extracting archive' });
    }
  });

  // Internal request log. Useful while developing, but it exposes paths and
  // internals, so a commercial build does not serve it.
  if (!IS_COMMERCIAL) {
    app.get('/api/logs', (req, res) => {
      res.json({ logs: serverLogs });
    });
  }

  app.post('/api/analyze-image', (req, res, next) => {
    console.log('Received analyze-image request');
    upload.single('image')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: `Upload error: ${err.message}` });
      } else if (err) {
        return res.status(500).json({ error: `Unknown upload error: ${err.message}` });
      }
      next();
    });
  }, async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No image uploaded' });
        return;
      }

      const mode = req.body.mode || 'advanced';
      const countingMode = req.body.countingMode || 'multiple';

      if (!aiAvailable()) {
        const msg = aiUnavailableReason();
        res.status(500).json({ error: msg });
        return;
      }

      const ai = aiClient();
      const base64Image = fs.readFileSync(req.file.path).toString('base64');
      // Delete temporary file after reading
      fs.unlinkSync(req.file.path);
      
      let mimeType = req.file.mimetype;
      // Sanitize common non-standard mime types
      if (mimeType === 'image/jpg') {
        mimeType = 'image/jpeg';
      }

      let prompt = `Analyze this image and act as an Archive Analyzer.\n`;
      prompt += `
CRITICAL CONSOLIDATION & COUNTING RULES (DO NOT OVER-COUNT):
- Separate subjects: If the image shows several subjects standing apart as their own distinct figures (for example a group shot, two characters side by side, or a crowd), count EACH one separately. Do not merge them just because they share a style, species, or colour. Two similar-looking characters standing side by side are two characters.
- Duplicate / Multi-Angle Entities: If the image is a character model sheet, character turnaround, or includes the same character multiple times in different angles, poses, crops, or zoom levels, DO NOT count them as separate characters. Consolidate them into a single character entry. The "totalCharacterCount" should count this character as 1.
- Distinguishing the two: consolidate only when the figures overlap, are shown in different poses or angles of the same subject, or are part of one turn-around layout. If two subjects are fully visible and do not overlap, they are separate characters.
- Character Age & Design Variations: If the image shows variations of the same character (such as a younger/kid version and an older/adult version, or versions with minor outfits/aesthetic changes but sharing core distinct details like facial features, eyes, scars, hairstyle, or theme), consolidate them into 1 character entry representing that master character.
  - In the consolidated character's "description", explicitly note both variations (e.g., "Depicts the character both as a young child and as an older adult, sharing similar golden hair and blue eyes").
  - Use a combined "suggestedName" indicating the variations if applicable (e.g., "Kaelen (Child & Adult)" or just "Kaelen").
  - If you are unsure whether two elements are the same character but they have highly similar outfits/looks, err on the side of consolidation and treat them as 1 character, noting the potential variation/uncertainty in the description.
`;
      if (countingMode === 'single') {
        prompt += `
- SINGLE OBJECT MODE: Treat the ENTIRE image as exactly ONE object/character/subject. Do NOT extract multiple entities. Just summarize the main focus as a single subject. The "totalCharacterCount" should always be 1, and the "characters" array should contain exactly 1 item representing the entire image's primary subject.
`;
      }
      if (mode === 'basic') {
        prompt += `
Identify the subjects quickly.
For each subject, find:
- "suggestedName": A brief name or label (taking into account the consolidation rules).
- "gender": Male, Female, Others, or Objects (if the subject is an inanimate object, weapon, prop, or non-living item).
- "species": The species or material type. (If it is an inanimate object or material, identify it, e.g., "Crystal ball", "Obsidian").
- "entityType": Character, Object, Material, Environment, or Unknown. (If you cannot identify something, look at the image and specify what it looks like, e.g. "Crystal ball-like object", "Glowing ore").
- "isUniqueName": boolean. Set to true ONLY if the subject has a specific, proper, unique personal character name (either written on the image itself, or a clearly distinct unique named individual). Set to false if the name is a generic descriptor, placeholder, plural group, species type, or inanimate object category (e.g. "Samurai Rabbits", "Unknown Warrior", "Red car", "Axe").

Return the result as a strict JSON object matching this schema exactly:
{
  "hasCharacters": boolean,
  "totalCharacterCount": number,
  "characters": [
    {
      "suggestedName": string,
      "gender": string,
      "species": string,
      "entityType": string,
      "isUniqueName": boolean
    }
  ]
}
`;
      } else {
        prompt += `
Perform a deep advanced scan of the image, analyzing details, style, completion, and colors.
Provide:
1. "hasCharacters": Does it contain any subjects (characters, objects, materials)? true or false.
2. "isSketch": Is this a sketch, rough drawing, or unfinished art? true or false.
3. "imageDescription": Provide a detailed description of the overall image.
4. "suggestedTitle": Provide a short, fitting title for the image (2-5 words).
5. "thumbnailBoundingBox": Provide normalized coordinates [ymin, xmin, ymax, xmax] (0 to 1) for a face or main subject to use for a thumbnail crop. If none, return [0, 0, 1, 1].
6. "artStyle": Describe the art style (e.g., "Cartoon", "Anime", "Realism").
7. "medium": Describe the medium used (e.g., "Digital Drawing", "Pencil Sketch").
8. "rating": Provide a completion rating from 1 to 10 for the overall drawing (representing how finished it is, 10 being fully finished/rendered).
9. "totalCharacterCount": The total number of unique, distinct entities/subjects found in the image after applying the consolidation rules.
10. "characters": List of consolidated subjects with:
   - "suggestedName": A brief name or label (indicating variations if applicable).
   - "gender": Male, Female, Others, or Objects (if the subject is an inanimate object, weapon, prop, or non-living item).
   - "species": Species or material type. (If it's an inanimate object or material, e.g., "Crystal ball", "Gold alloy").
   - "entityType": Character, Object, Material, Environment, or Unknown. (If you cannot identify something, describe what it looks like, e.g. "Crystal ball-like object", "Mysterious glowing ore").
   - "boundingBox": Normalized coordinate array [ymin, xmin, ymax, xmax] (0 to 1) indicating exactly where in the original image this character/subject is located. If it cannot be isolated, return [0,0,1,1].
   - "description": A detailed visual description of the subject, explicitly noting if multiple poses, angles, or age/design variations are depicted in the image.
   - "isSketchStatus": true if it looks like a sketch/unfinished.
   - "completionRating": Rate the overall completion of the drawing as a percentage with a brief reason (e.g., "85% - Fully rendered with shading", "30% - Rough pencil outline").
   - "colorPalette": An array of up to 5 prominent hex color codes (e.g., ["#FF5733", "#C70039"]).
   - "dateWrittenOnMedia": string (If a specific creation date is visually written on the image or explicitly stated in the text, extract it here. e.g., "01/08/2026"). Leave empty if no date is found.
   - "isUniqueName": boolean. Set to true ONLY if the subject has a specific, proper, unique personal character name (either written on the image itself, or a clearly distinct unique named individual). Set to false if the name is a generic descriptor, placeholder, plural group, species type, or inanimate object category (e.g. "Samurai Rabbits", "Unknown Warrior", "Red car", "Axe").
   - "featuresOfInterest": An array of up to 3 objects representing distinct, interesting features, unique emblems, special accessories, detailed close-up visual details, unusual markings, or stand-out items of interest detected in the character's visual depiction. Each feature must have:
     - "title": A short, descriptive label (e.g. "Enchanted Amulet", "Cybernetic Eye", "Gold Crest Emblem", "Dragon Tattoo", "Unusual Weapon").
     - "description": A short explanation of why this feature is interesting, distinctive, or unique (1-2 sentences).
     - "boundingBox": Normalized coordinate array [ymin, xmin, ymax, xmax] (0 to 1) indicating exactly where in the original image this detail/feature/emblem is located. Be precise.

Return the result as a strict JSON object matching this schema exactly:
{
  "hasCharacters": boolean,
  "isSketch": boolean,
  "imageDescription": string,
  "suggestedTitle": string,
  "thumbnailBoundingBox": [number, number, number, number],
  "artStyle": string,
  "medium": string,
  "rating": number,
  "totalCharacterCount": number,
  "characters": [
    {
      "suggestedName": string,
      "gender": string,
      "species": string,
      "entityType": string,
      "description": string,
      "boundingBox": [number, number, number, number],
      "isSketchStatus": boolean,
      "completionRating": string,
      "colorPalette": [string],
      "dateWrittenOnMedia": string,
      "isUniqueName": boolean,
      "featuresOfInterest": [
        {
          "title": string,
          "description": string,
          "boundingBox": [number, number, number, number]
        }
      ]
    }
  ]
}
`;
      }

      let result;
      let attempt = 0;
      const modelsToTry = getModelsToTry();

      while (attempt < modelsToTry.length) {
        const modelName = modelsToTry[attempt];
        try {
          console.log(`Analyzing image (attempt ${attempt + 1}/${modelsToTry.length})...`);
          
          const imagePart = {
            inlineData: {
              data: base64Image,
              mimeType: mimeType
            }
          };
          const textPart = {
            text: prompt
          };

          const response = await ai.models.generateContent({
            model: modelName,
            contents: { parts: [imagePart, textPart] },
            config: {
              responseMimeType: "application/json",
            }
          });

          const responseText = response.text;
          if (!responseText) {
            throw new Error('The AI engine returned an empty response.');
          }
          result = cleanAndParseJSON(responseText);
          
          // Clear any tracked failures for this model on success
          modelFailures.delete(modelName);
          break; // Success
        } catch (e: any) {
          console.log(`Attempt ${attempt + 1}/${modelsToTry.length} failed: ${e?.message || e}`);
          
          // Record model failure to deprioritize it for other incoming requests
          modelFailures.set(modelName, { count: (modelFailures.get(modelName)?.count || 0) + 1, lastFailed: Date.now() });
          
          attempt++;
          if (attempt >= modelsToTry.length) throw e;
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 300)); // Minimal wait before trying next model
        }
      }

      res.json(result);
    } catch (error: any) {
      console.error('Image analysis error:', error);
      res.status(500).json({ error: error.message || 'Error analyzing image' });
    }
  });

  app.post('/api/analyze-text', (req, res, next) => {
    console.log('Received analyze-text request');
    upload.single('text')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: `Upload error: ${err.message}` });
      } else if (err) {
        return res.status(500).json({ error: `Unknown upload error: ${err.message}` });
      }
      next();
    });
  }, async (req, res) => {
    try {
      let textContent = '';
      let isPdf = false;
      let pdfBase64 = '';

      if (req.file) {
        const isPdfFile = req.file.mimetype === 'application/pdf' || req.file.originalname.toLowerCase().endsWith('.pdf');
        if (isPdfFile) {
          isPdf = true;
          pdfBase64 = fs.readFileSync(req.file.path).toString('base64');
          fs.unlinkSync(req.file.path);
        } else {
          textContent = fs.readFileSync(req.file.path, 'utf-8');
          fs.unlinkSync(req.file.path);

          const isJsonFile = req.file.mimetype === 'application/json' || req.file.originalname.toLowerCase().endsWith('.json');
          if (isJsonFile) {
            textContent = parseJsonContent(textContent);
          }
        }
      } else if (req.body.text) {
        textContent = req.body.text;
        // In case they pass a JSON string in body
        if (textContent.trim().startsWith('{') || textContent.trim().startsWith('[')) {
          textContent = parseJsonContent(textContent);
        }
      } else {
        res.status(400).json({ error: 'No text provided' });
        return;
      }

      const mode = req.body.mode || 'advanced';
      const countingMode = req.body.countingMode || 'multiple';

      if (!aiAvailable()) {
        const msg = aiUnavailableReason();
        res.status(500).json({ error: msg });
        return;
      }

      const ai = aiClient();

      let prompt = `Analyze this text and act as an Archive Analyzer.\n`;
      prompt += `
CRITICAL CONSOLIDATION & COUNTING RULES (DO NOT OVER-COUNT):
- Separate subjects: If the text introduces several distinct named characters, count EACH one separately. Do not merge them just because they share a faction, species, or description pattern.
- Duplicate / Multi-Mention Entities: If the text describes or references the same character multiple times in different context/scenes/turns, DO NOT count them as separate characters. Consolidate them into a single character entry. The "totalCharacterCount" should count this character as 1.
- Distinguishing the two: consolidate only when the text is clearly describing one subject across different scenes or references. Two separately named characters with their own names, goals, or dialogue are two characters.
- Character Age & Design Variations: If the text describes variations of the same character (such as a younger/kid version and an older/adult version, or versions with outfit/aesthetic changes but sharing core distinct details like facial features, eyes, scars, hairstyle, or theme), consolidate them into 1 character entry representing that master character.
  - In the consolidated character's "description", explicitly note both variations (e.g., "Described both as a young child and as an older adult, sharing similar characteristics").
  - Use a combined "name" indicating the variations if applicable (e.g., "Kaelen (Child & Adult)" or just "Kaelen").
  - If you are unsure whether two descriptions are the same character but they have highly similar names/outfits/looks, err on the side of consolidation and treat them as 1 character, noting the potential variation/uncertainty in the description.
`;
      if (countingMode === 'single') {
        prompt += `
- SINGLE OBJECT MODE: Treat the ENTIRE text as describing exactly ONE object/character/subject. Do NOT extract multiple entities. Just summarize the main focus as a single subject. The "totalCharacterCount" should always be 1, and the "characters" array should contain exactly 1 item representing the entire text's primary subject.
`;
      }
      if (mode === 'basic') {
        prompt += `
Extract all distinct entities mentioned in the text quickly.
For each entity, find:
- "name": A brief name or label (taking into account the consolidation rules).
- "gender": Male, Female, Others, or Objects (if the subject is an inanimate object, weapon, prop, or non-living item).
- "species": Species or material type.
- "entityType": Character, Object, Material, Environment, or Unknown.
- "isUniqueName": boolean. Set to true ONLY if the subject has a specific, proper, unique personal character name (either written in the text, or a clearly distinct unique named individual). Set to false if the name is a generic descriptor, placeholder, plural group, species type, or inanimate object category (e.g. "Samurai Rabbits", "Unknown Warrior", "Red car", "Axe").

Return the result as a strict JSON object matching this schema exactly:
{
  "totalCharacterCount": number,
  "characters": [
    {
      "name": string,
      "gender": string,
      "species": string,
      "entityType": string,
      "isUniqueName": boolean
    }
  ]
}
`;
      } else {
        prompt += `
Perform a deep scan of the text.
Extract all distinct entities mentioned in the text.
For each entity, find:
- "name": A brief name or label (indicating variations if applicable).
- "gender": Male, Female, Others, or Objects (if the subject is an inanimate object, weapon, prop, or non-living item).
- "species": Species or material type.
- "entityType": Character, Object, Material, Environment, or Unknown.
- "description": A combined brief visual description, explicitly noting if multiple descriptions, contexts, or age/design variations are mentioned in the text.
- "completionRating": "100% - Text format"
- "colorPalette": Infer up to 5 colors based on descriptions in the text (e.g., ["#000000", "#FFFFFF"]).
- "isUniqueName": boolean. Set to true ONLY if the subject has a specific, proper, unique personal character name (either written in the text, or a clearly distinct unique named individual). Set to false if the name is a generic descriptor, placeholder, plural group, species type, or inanimate object category (e.g. "Samurai Rabbits", "Unknown Warrior", "Red car", "Axe").
- "biblePages": An array of structured notes found in the text. Categorize things like "Background", "Specifications", "Equipment", "Credits", "History", etc. Each page should have:
  - "title": The category title.
  - "content": The summarized information for that category.
  - "parentId": Optional, if it's a sub-note.

Return the result as a strict JSON object matching this schema exactly:
{
  "totalCharacterCount": number,
  "characters": [
    {
      "name": string,
      "gender": string,
      "species": string,
      "entityType": string,
      "description": string,
      "completionRating": string,
      "colorPalette": [string],
      "dateWrittenOnMedia": string,
      "isUniqueName": boolean,
      "biblePages": [
        { "title": string, "content": string, "parentId": string }
      ]
    }
  ]
}
`;
      }

      const contentsParts: any[] = [];
      if (isPdf) {
        prompt += `\nPlease analyze the attached PDF file content.`;
        contentsParts.push({ text: prompt });
        contentsParts.push({
          inlineData: {
            data: pdfBase64,
            mimeType: 'application/pdf'
          }
        });
      } else {
        prompt += `
Text to analyze:
${textContent}
`;
        contentsParts.push({ text: prompt });
      }

      let result;
      let attempt = 0;
      const modelsToTry = getModelsToTry();

      while (attempt < modelsToTry.length) {
        const modelName = modelsToTry[attempt];
        try {
          console.log(`Analyzing text (attempt ${attempt + 1}/${modelsToTry.length})...`);
          const response = await ai.models.generateContent({
            model: modelName,
            contents: { parts: contentsParts },
            config: {
              responseMimeType: "application/json",
            }
          });

          const responseText = response.text;
          if (!responseText) {
            throw new Error('The AI engine returned an empty response.');
          }
          result = cleanAndParseJSON(responseText);
          
          // Clear any tracked failures for this model on success
          modelFailures.delete(modelName);
          break; // Success
        } catch (e: any) {
          console.log(`Attempt ${attempt + 1}/${modelsToTry.length} failed: ${e?.message || e}`);
          
          // Record model failure to deprioritize it for other incoming requests
          modelFailures.set(modelName, { count: (modelFailures.get(modelName)?.count || 0) + 1, lastFailed: Date.now() });
          
          attempt++;
          if (attempt >= modelsToTry.length) throw e;
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 300)); // Minimal wait before trying next model
        }
      }

      res.json(result);
    } catch (error: any) {
      console.error('Text analysis error:', error);
      res.status(500).json({ error: error.message || 'Error analyzing text' });
    }
  });

  app.post('/api/analyze-multimodal', async (req, res) => {
    try {
      const { text = '', mediaFiles = [], mode = 'advanced', countingMode = 'multiple', transcribeMedia = true } = req.body;

      if (!aiAvailable()) {
        const msg = aiUnavailableReason();
        return res.status(500).json({ error: msg });
        return;
      }

      const ai = aiClient();

      let prompt = `You are an expert Character Data & Media Archive Analyzer.
Analyze all provided input streams (text notes, dumped images, audio tracks/soundtracks, video clips) and extract comprehensive, structured character profile information.

TEXT NOTES & SPECIFICATIONS:
${text || 'None provided.'}

MEDIA ATTACHMENTS ATTACHED:
${mediaFiles.map((m: any, i: number) => `- Media #${i+1}: ${m.name || 'File'} (${m.mimeType || 'unknown type'})`).join('\n') || 'None attached.'}

CRITICAL ANALYSIS INSTRUCTIONS:
1. CHARACTER PROFILE SYNTHESIS:
   - Extract/determine the primary character name, gender, species, entity type, and a detailed description/biography.
   - Combine text background notes with visual descriptions from images and narrative/spoken context from audio and video clips.

2. MULTIMEDIA ANALYSIS & TRANSCRIPTION:
   - IMAGES: Analyze visual attributes, costume/outfit, hairstyle, face, equipment, art style, and setting.
   - AUDIO & SOUNDTRACKS: Provide a precise verbatim TRANSCRIPTION of any spoken speech, dialogue, voiceovers, or narration. Describe track mood, instrumentation, lyrics or documentary speech content.
   - VIDEOS: Provide a full verbatim spoken TRANSCRIPTION of all dialogue/speech AND a scene breakdown describing the visual actions, movement, and key events.

3. SECTION INDEX BIBLE PAGES:
   Generate an array of "biblePages" to structure into subpages:
   - "Overview & Master Background"
   - "Visual Design & Image Analysis" (if images present)
   - "Transcripts & Spoken Audio/Video Content" (if audio/video present, containing the full text transcriptions of spoken words and media breakdown)
   - "Character Traits & Specifications"

Return the result as a strict JSON object with this schema:
{
  "totalCharacterCount": number,
  "characters": [
    {
      "name": string,
      "gender": string,
      "species": string,
      "entityType": string,
      "description": string,
      "completionRating": string,
      "colorPalette": [string],
      "isUniqueName": boolean,
      "transcriptions": [
        {
          "mediaName": string,
          "mediaType": "audio" | "video" | "image",
          "transcript": string,
          "summary": string
        }
      ],
      "biblePages": [
        {
          "title": string,
          "content": string,
          "parentId": string
        }
      ]
    }
  ]
}
`;

      const contentsParts: any[] = [{ text: prompt }];

      // Attach media files
      if (Array.isArray(mediaFiles)) {
        for (const file of mediaFiles) {
          if (file.data && file.mimeType) {
            let cleanBase64 = file.data;
            if (cleanBase64.includes(',')) {
              cleanBase64 = cleanBase64.split(',')[1];
            }
            contentsParts.push({
              inlineData: {
                data: cleanBase64,
                mimeType: file.mimeType
              }
            });
          }
        }
      }

      let result;
      let attempt = 0;
      const modelsToTry = getModelsToTry();

      while (attempt < modelsToTry.length) {
        const modelName = modelsToTry[attempt];
        try {
          console.log(`Analyzing media (attempt ${attempt + 1}/${modelsToTry.length})...`);
          const response = await ai.models.generateContent({
            model: modelName,
            contents: { parts: contentsParts },
            config: {
              responseMimeType: "application/json",
            }
          });

          const responseText = response.text;
          if (!responseText) {
            throw new Error('The AI engine returned an empty response.');
          }
          result = cleanAndParseJSON(responseText);
          modelFailures.delete(modelName);
          break;
        } catch (e: any) {
          console.log(`Attempt ${attempt + 1}/${modelsToTry.length} failed: ${e?.message || e}`);
          modelFailures.set(modelName, { count: (modelFailures.get(modelName)?.count || 0) + 1, lastFailed: Date.now() });
          attempt++;
          if (attempt >= modelsToTry.length) throw e;
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      res.json(result);
    } catch (error: any) {
      console.error('Multimodal analysis error:', error);
      res.status(500).json({ error: error.message || 'Error analyzing multimodal dump' });
    }
  });

  app.post('/api/analyze-page', async (req, res) => {
    try {
      const { pageTitle, characterName, characterDescription, allPages = [], galleryImages = [], audios = [], videos = [], genericFiles = [], currentContent = '' } = req.body;

      if (!aiAvailable()) {
        const msg = aiUnavailableReason();
        return res.status(500).json({ error: msg });
        return;
      }

      const ai = aiClient();

      let prompt = `You are an expert Character Archive Analyzer and Editor.
The user is focusing on a specific section/page titled: "${pageTitle}".
Character Name: ${characterName || 'Unknown'}
Character General Description: ${characterDescription || 'None'}

EXISTING CHARACTER NOTES / BIBLE PAGES:
${allPages.map((p: any) => `- [${p.title}]: ${p.content || 'Empty'}`).join('\n') || 'None'}

LIBRARY MEDIA ASSETS (Gallery Images, Audio Tracks, Videos, Files):
- Gallery Images: ${galleryImages.map((img: any) => img.title || 'Image').join(', ') || 'None'}
- Audio Tracks: ${audios.map((a: any) => a.title || 'Audio').join(', ') || 'None'}
- Videos: ${videos.map((v: any) => v.title || 'Video').join(', ') || 'None'}
- Files: ${genericFiles.map((f: any) => f.name || 'File').join(', ') || 'None'}

CURRENT PAGE CONTENT:
${currentContent || 'None'}

INSTRUCTIONS FOR FULFILLING "${pageTitle}":
1. FOCUS & ALIGNMENT: Analyze all provided character notes, media assets, and background information strictly to fulfill and organize the section titled "${pageTitle}".
2. IF "General Overview" or "Overview": Synthesize everything across notes, gallery, media, and files into a comprehensive, master structured overview list and narrative.
3. IF "Specifications", "Specs", or "Technical": Extract or analyze all materials for technical specs, measurements, traits, equipment, stats, and physical attributes. 
   - CRITICAL: If NO specifications exist in the source notes or library materials, generate professional, plausible character specifications appropriate for this character, and include this exact notice at the top or bottom of the content: "*(Note: Generated plausible specifications as none were found directly in source notes.)*"
4. IF any other section or custom page (e.g. Backstory, Powers, Relationships, Equipment, etc.): Focus entirely on organizing, structuring, and fulfilling that specific topic using all available character information. If source data is sparse, synthesize appropriate rich content while noting any generated details.
5. FORMATTING: Return clean Markdown format with professional headers, bullet points, and structured sections.

Return the result as a strict JSON object with this exact schema:
{
  "content": "string (the markdown content)"
}
`;

      const contentsParts = [{ text: prompt }];

      let result;
      let attempt = 0;
      const modelsToTry = getModelsToTry();

      while (attempt < modelsToTry.length) {
        const modelName = modelsToTry[attempt];
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: { parts: contentsParts },
            config: {
              responseMimeType: "application/json",
            }
          });

          const responseText = response.text;
          if (!responseText) throw new Error('Empty response');
          result = cleanAndParseJSON(responseText);
          break;
        } catch (e: any) {
          attempt++;
          if (attempt >= modelsToTry.length) throw e;
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      res.json(result);
    } catch (error: any) {
      console.error('Analyze page error:', error);
      res.status(500).json({ error: error.message || 'Error analyzing page' });
    }
  });

  app.post('/api/organize-media-albums', async (req, res) => {
    try {
      const { instruction, characterName, audios = [], mediaCategories = [] } = req.body;

      if (!aiAvailable()) {
        const msg = aiUnavailableReason();
        return res.status(500).json({ error: msg });
        return;
      }

      const ai = aiClient();

      let prompt = `You are an expert Audio Archive & Album Organizer for character media.
Character Name: ${characterName || 'Character'}
User Instruction / Voice Prompt: "${instruction || 'Organize these audio tracks into albums, update metadata titles, albums, genres, and categories.'}"

CURRENT AUDIO TRACKS:
${JSON.stringify(audios, null, 2)}

EXISTING MEDIA CATEGORIES:
${JSON.stringify(mediaCategories, null, 2)}

INSTRUCTIONS:
1. Analyze the user's instruction and the list of audio tracks.
2. Group and organize the tracks into logical albums or folders (e.g. creating categories or setting the album metadata field on each track).
3. Rename tracks or update their metadata (title, artist, album, genre, year, comments) to match professional standards based on the user's instructions.
4. Return a JSON object with updated audios array and any new media categories (albums) to create.

Return strict JSON with this exact schema:
{
  "audios": [
    {
      "id": "string",
      "title": "string",
      "src": "string",
      "category": "string",
      "metadata": {
        "title": "string",
        "artist": "string",
        "album": "string",
        "genre": "string",
        "year": "string",
        "trackNo": "string",
        "lyrics": "string",
        "albumCover": "string",
        "comment": "string"
      }
    }
  ],
  "newCategories": [
    {
      "id": "string",
      "name": "string",
      "type": "audio",
      "color": "string"
    }
  ]
}
`;

      const contentsParts = [{ text: prompt }];

      let result;
      let attempt = 0;
      const modelsToTry = getModelsToTry();

      while (attempt < modelsToTry.length) {
        const modelName = modelsToTry[attempt];
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: { parts: contentsParts },
            config: {
              responseMimeType: "application/json",
            }
          });

          const responseText = response.text;
          if (!responseText) throw new Error('Empty response');
          result = cleanAndParseJSON(responseText);
          break;
        } catch (e: any) {
          attempt++;
          if (attempt >= modelsToTry.length) throw e;
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      res.json(result);
    } catch (error: any) {
      console.error('Organize media albums error:', error);
      res.status(500).json({ error: error.message || 'Error organizing media albums' });
    }
  });

  app.post('/api/transcribe-media', async (req, res) => {
    try {
      const { mediaName = 'Media Track', mimeType, data, customPrompt } = req.body;

      if (!data || !mimeType) {
        return res.status(400).json({ error: 'Missing media data or mimeType' });
      }

      if (!aiAvailable()) {
        const msg = aiUnavailableReason();
        return res.status(500).json({ error: msg });
        return;
      }

      const ai = aiClient();

      let cleanBase64 = data;
      if (cleanBase64.includes(',')) {
        cleanBase64 = cleanBase64.split(',')[1];
      }

      const isVideo = mimeType.startsWith('video/');

      let prompt = customPrompt || `You are an expert audio & video media analysis and transcription agent.
Media Name: ${mediaName}
Type: ${mimeType}

INSTRUCTIONS:
1. Spoken Content & Dialog Transcription: Transcribe verbatim all spoken dialogue, speech, narrative voiceover, or lyrics present in this ${isVideo ? 'video' : 'audio track'}. If there is no spoken dialogue, specify "No spoken speech detected."
2. Content Summary: Provide a concise summary of the key themes, tone, information, and artistic subject matter.
${isVideo ? `3. Deep Visual Scene Analysis & Description: Perform a comprehensive analysis of the video's visual content. Describe the scene's aesthetics, character design, costume details, colors, cinematography, movement, art style, backdrop scenery, and actions. Elaborate on the character's visual representation.
4. Key Information Extraction: Note any important lore, character traits, or specific specifications revealed in the video.
` : ''}
Return strict JSON:
{
  "mediaTitle": "${mediaName}",
  "transcript": string,
  "summary": string,
  "visualDescription": string, ${isVideo ? '// Required: Comprehensive visual description of scene actions, art style, character designs, and settings' : '// Optional: description of audio characteristics'}
  "keyTopics": [string],
  "formattedMarkdown": string
}
`;

      const contentsParts: any[] = [
        { text: prompt },
        {
          inlineData: {
            data: cleanBase64,
            mimeType: mimeType
          }
        }
      ];

      let result;
      let attempt = 0;
      const modelsToTry = getModelsToTry();

      while (attempt < modelsToTry.length) {
        const modelName = modelsToTry[attempt];
        try {
          console.log(`Transcribing media (attempt ${attempt + 1}/${modelsToTry.length})...`);
          const response = await ai.models.generateContent({
            model: modelName,
            contents: { parts: contentsParts },
            config: {
              responseMimeType: "application/json",
            }
          });

          const responseText = response.text;
          if (!responseText) {
            throw new Error('The AI engine returned an empty response.');
          }
          result = cleanAndParseJSON(responseText);
          modelFailures.delete(modelName);
          break;
        } catch (e: any) {
          console.log(`Attempt ${attempt + 1}/${modelsToTry.length} failed: ${e?.message || e}`);
          modelFailures.set(modelName, { count: (modelFailures.get(modelName)?.count || 0) + 1, lastFailed: Date.now() });
          attempt++;
          if (attempt >= modelsToTry.length) throw e;
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      res.json(result);
    } catch (error: any) {
      console.error('Media transcription error:', error);
      res.status(500).json({ error: error.message || 'Error transcribing media' });
    }
  });

  app.post('/api/organize-and-check-text', async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'No text provided' });
      }

      if (!aiAvailable()) {
        const msg = aiUnavailableReason();
        return res.status(500).json({ error: msg });
        return;
      }

      const ai = aiClient();

      const contents = `You are an expert editor and character bible organizer.
Analyze the following text and perform these tasks:
1. **Spelling & Grammar Check**: Identify spelling, grammar, or formatting errors. Prepare an array of corrections, each with the original snippet, the corrected snippet, and an explanation.
2. **Organization**: Reorganize the text into a clean, professional, readable markdown structure.
3. **Links & Resources**: Identify key historical, biblical, mythology, or narrative terms, references, or subjects mentioned and suggest helpful links to other reference websites, wikis, or related content. Return realistic URLs (e.g., Wikipedia, Britannica, or specific wikis) with descriptions.
4. **Bible Categorization**: Split or map this text to standard bible pages if applicable (e.g., Executive Concepts, Core Premise, Height and Build, Personality and Speech).

Return the response as a strict JSON object with this schema:
{
  "originalText": string,
  "organizedText": string,
  "corrections": Array<{ "original": string, "corrected": string, "explanation": string, "type": "spelling" | "grammar" | "style" }>,
  "suggestedLinks": Array<{ "title": string, "url": string, "description": string }>,
  "bibleSections": {
    "executiveConcepts": string,
    "corePremise": string,
    "heightBuild": string,
    "personalitySpeech": string
  }
}

Do not include any other text besides the JSON.

Text to analyze:
${text}`;

      let resultJson;
      let attempt = 0;
      const modelsToTry = getModelsToTry();

      while (attempt < modelsToTry.length) {
        const modelName = modelsToTry[attempt];
        try {
          console.log(`Organizing text (attempt ${attempt + 1}/${modelsToTry.length})...`);
          const response = await ai.models.generateContent({
            model: modelName,
            contents,
            config: { responseMimeType: "application/json" }
          });
          const resultText = response.text || "{}";
          resultJson = cleanAndParseJSON(resultText);
          modelFailures.delete(modelName);
          break;
        } catch (e: any) {
          console.log(`Attempt ${attempt + 1}/${modelsToTry.length} failed: ${e?.message || e}`);
          modelFailures.set(modelName, { count: (modelFailures.get(modelName)?.count || 0) + 1, lastFailed: Date.now() });
          attempt++;
          if (attempt >= modelsToTry.length) throw e;
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      res.json(resultJson);
    } catch (err: any) {
      console.error('Error in organize-and-check-text:', err);
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });

  app.post('/api/generate-profile', async (req, res) => {
    try {
      const { character, prompt } = req.body;
      if (!aiAvailable()) {
        const msg = aiUnavailableReason();
        return res.status(500).json({ error: msg });
        return;
      }

      const ai = aiClient();

      const contents = `You are an expert creative writer and character designer.
Generate a rich, cohesive, and professional creative writing profile for a character based on the provided character details and optional custom instruction.

Current Character Info:
${JSON.stringify(character, null, 2)}

Instruction / Focus:
${prompt || 'Generate/expand all biography, personality, physical, and background details to make a fully fledged creative writing bible.'}

Provide:
1. An updated, captivating biography ('description').
2. Updated attributes: species, gender, entityType, and completionRating.
3. A set of cohesive color palette hex codes (5 colors) that match the character's aesthetic.
4. Rich content for the standard Bible Pages:
   - 'executive-concepts': Broad high-level thematic guidelines, summary of roles, symbolic motifs.
   - 'core-premise': The character's core goal, conflict, central question, and narrative function.
   - 'height-build': Physical attributes, build, facial style, posture, typical fashion/gear.
   - 'personality-speech': Emotional temperament, dialogue traits, vocal qualities, and quirks.
5. Content for any custom bible pages already defined on the character, or propose 2 new helpful custom pages (e.g., 'backstory', 'relationships') with contents!

Return the response as a strict JSON object with this schema:
{
  "name": string,
  "gender": "Male" | "Female" | "Others" | "Objects",
  "species": string,
  "entityType": string,
  "description": string,
  "completionRating": string,
  "colorPalette": string[],
  "biblePages": Array<{ "id": string, "title": string, "content": string, "parentId"?: string }>
}

Do not include any markup, markdown wrappers, or explanations outside of the JSON.`;

      let data;
      let attempt = 0;
      const modelsToTry = getModelsToTry();

      while (attempt < modelsToTry.length) {
        const modelName = modelsToTry[attempt];
        try {
          console.log(`Generating profile (attempt ${attempt + 1}/${modelsToTry.length})...`);
          const response = await ai.models.generateContent({
            model: modelName,
            contents,
            config: { responseMimeType: "application/json" }
          });
          data = cleanAndParseJSON(response.text || '{}');
          modelFailures.delete(modelName);
          break;
        } catch (e: any) {
          console.log(`Attempt ${attempt + 1}/${modelsToTry.length} failed: ${e?.message || e}`);
          modelFailures.set(modelName, { count: (modelFailures.get(modelName)?.count || 0) + 1, lastFailed: Date.now() });
          attempt++;
          if (attempt >= modelsToTry.length) throw e;
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      res.json(data);
    } catch (error: any) {
      console.error('Error generating profile:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  app.post('/api/generate-description', async (req, res) => {
    try {
      const { character } = req.body;
      if (!aiAvailable()) {
        const msg = aiUnavailableReason();
        return res.status(500).json({ error: msg });
        return;
      }

      const ai = aiClient();

      const contents = `You are an expert character biography novelist and story designer.
Scan the character's profile details provided below and write a beautifully composed, rich, and immersive character description / biography (2-3 paragraphs) that captures their core essence, background, and unique lore. Also generate a catchy, short, and punchy tagline (1 sentence).

Character details:
${JSON.stringify(character, null, 2)}

Return the response as a strict JSON object with this schema:
{
  "tagline": "Short one-sentence punchy teaser/tagline",
  "description": "Captivating 2-3 paragraph character biography"
}

Do not include any formatting, markdown wrappers, or explanations outside of the JSON.`;

      let data;
      let attempt = 0;
      const modelsToTry = getModelsToTry();

      while (attempt < modelsToTry.length) {
        const modelName = modelsToTry[attempt];
        try {
          console.log(`Generating description (attempt ${attempt + 1}/${modelsToTry.length})...`);
          const response = await ai.models.generateContent({
            model: modelName,
            contents,
            config: { responseMimeType: "application/json" }
          });
          data = cleanAndParseJSON(response.text || '{}');
          modelFailures.delete(modelName);
          break;
        } catch (e: any) {
          console.log(`Attempt ${attempt + 1}/${modelsToTry.length} failed: ${e?.message || e}`);
          modelFailures.set(modelName, { count: (modelFailures.get(modelName)?.count || 0) + 1, lastFailed: Date.now() });
          attempt++;
          if (attempt >= modelsToTry.length) throw e;
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      res.json(data);
    } catch (error: any) {
      console.error('Error generating description:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  app.post('/api/process-character-command', async (req, res) => {
    try {
      const { character, command } = req.body;
      if (!command) {
        return res.status(400).json({ error: 'No command provided' });
      }
      if (!aiAvailable()) {
        const msg = aiUnavailableReason();
        return res.status(500).json({ error: msg });
        return;
      }

      const ai = aiClient();

      const contents = `You are an intelligent AI character editor assistant.
The user has spoken/written an instruction command to update or expand a character's profile details.
Interpret the command and modify the relevant character fields. Apply creative embellishments that stay true to the user's intent.

Current Character Info:
${JSON.stringify(character, null, 2)}

User Instruction Command:
"${command}"

Update the character. You can modify any of these fields:
- name, gender, species, description, entityType, completionRating, colorPalette
- biblePages: Array of { id, title, content, parentId } (standard or custom pages and subpages)

Return the response as a strict JSON object with this schema:
{
  "updatedFields": {
    "name"?: string,
    "gender"?: "Male" | "Female" | "Others" | "Objects",
    "species"?: string,
    "entityType"?: string,
    "description"?: string,
    "completionRating"?: string,
    "colorPalette"?: string[],
    "biblePages"?: Array<{ "id": string, "title": string, "content": string, "parentId"?: string }>
  },
  "explanationOfChanges": string
}

Do not include any markup, markdown wrappers, or explanations outside of the JSON.`;

      let data;
      let attempt = 0;
      const modelsToTry = getModelsToTry();

      while (attempt < modelsToTry.length) {
        const modelName = modelsToTry[attempt];
        try {
          console.log(`Processing character command (attempt ${attempt + 1}/${modelsToTry.length})...`);
          const response = await ai.models.generateContent({
            model: modelName,
            contents,
            config: { responseMimeType: "application/json" }
          });
          data = cleanAndParseJSON(response.text || '{}');
          modelFailures.delete(modelName);
          break;
        } catch (e: any) {
          console.log(`Attempt ${attempt + 1}/${modelsToTry.length} failed: ${e?.message || e}`);
          modelFailures.set(modelName, { count: (modelFailures.get(modelName)?.count || 0) + 1, lastFailed: Date.now() });
          attempt++;
          if (attempt >= modelsToTry.length) throw e;
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      res.json(data);
    } catch (error: any) {
      console.error('Error processing character command:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  app.post('/api/export-docs', async (req, res) => {
    try {
      const { title, text, accessToken } = req.body;
      if (!accessToken) {
        return res.status(401).json({ error: 'Missing access token' });
      }

      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });

      const drive = google.drive({ version: 'v3', auth });
      const docs = google.docs({ version: 'v1', auth });

      // Find or create CharArchive folder
      let folderId = null;
      const folderRes = await drive.files.list({
        q: "mimeType='application/vnd.google-apps.folder' and name='CharArchive' and trashed=false",
        spaces: 'drive',
        fields: 'files(id)'
      });
      if (folderRes.data.files && folderRes.data.files.length > 0) {
        folderId = folderRes.data.files[0].id;
      } else {
        const createFolderRes = await drive.files.create({
          requestBody: { name: 'CharArchive', mimeType: 'application/vnd.google-apps.folder' },
          fields: 'id'
        });
        folderId = createFolderRes.data.id;
      }

      // Create new Document inside the folder
      const createDocRes = await docs.documents.create({
        requestBody: { title: `CharArchive - ${title}` }
      });
      const documentId = createDocRes.data.documentId;
      if (!documentId) throw new Error("Could not create document");

      // Move the document to the folder
      await drive.files.update({
        fileId: documentId,
        addParents: folderId!,
        removeParents: 'root'
      });

      // Write content to the document
      await docs.documents.batchUpdate({
        documentId: documentId,
        requestBody: {
          requests: [
            {
              insertText: {
                location: { index: 1 },
                text: text
              }
            }
          ]
        }
      });

      res.json({ success: true, url: `https://docs.google.com/document/d/${documentId}/edit` });
    } catch (error: any) {
      console.error('Export error:', error);
      res.status(500).json({ error: error.message || 'Error exporting to Docs' });
    }
  });

  // Always serve local character assets so exports work correctly in dev and production
  // Character artwork referenced by seed data as /src/assets/images/... is
// handled by Vite in development, which rewrites those URLs into hashed build
// assets. Serve the originals as a fallback so the path survives in a
// production build too, and resolve from app.asar when packaged.
  const localImages = path.join(process.cwd(), 'src/assets/images');
  const packagedImages = process.env.CHARARCHIVE_IMAGES
    ? path.join(process.env.CHARARCHIVE_IMAGES, 'src/assets/images')
    : null;
  app.use('/src/assets/images', express.static(localImages));
  if (packagedImages) {
    app.use('/src/assets/images', express.static(packagedImages));
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const createServer = await loadVite();
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In a packaged app the React bundle lives inside app.asar, which Node can
    // read but only via Electron's asar-aware fs shim. The Electron main
    // process therefore passes an explicit path in CHARARCHIVE_DIST, and we fall
    // back to the working directory for a plain `node dist/server.cjs` run.
    const distPath = process.env.CHARARCHIVE_DIST || path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Bind explicitly so a port clash produces a readable message instead of an
  // unhandled 'error' event crash.
  // Bind to loopback only. Nothing outside this machine needs to reach the
  // archive, and staying off 0.0.0.0 stops Windows Firewall from prompting the
  // user to grant network access every launch.
  const HOST = process.env.HOST || '127.0.0.1';

  const httpServer = await new Promise<any>((resolve, reject) => {
    const s = app.listen(PORT, HOST, () => resolve(s));
    s.on('error', reject);
  });

  httpServer.on('error', (err: any) => {
    if (err?.code === 'EADDRINUSE') {
      console.error(
        `Port ${PORT} is already in use. Close the other program using it, or set PORT in .env to a different number.`
      );
    } else {
      console.error('Server error:', err);
    }
    process.exit(1);
  });

  console.log(`Server running on http://localhost:${PORT} (bound to ${HOST} only)`);
  console.log(
    `AI provider: ${aiConfig.provider} | Gemini key: ${aiConfig.geminiApiKey ? 'set' : 'not set'} | Ollama: ${aiConfig.ollamaBaseUrl}`
  );
}

startServer();
