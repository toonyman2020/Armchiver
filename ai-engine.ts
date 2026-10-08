/**
 * AI engine for CharArchive.
 *
 * One interface in front of two very different back ends:
 *
 *   - Google Gemini, over HTTP, using a key the user supplies
 *   - A local Ollama server, with no key and no internet
 *
 * Every analysis route goes through generate(), so the choice of engine is a
 * setting rather than a code path. Before this existed each route talked to
 * Gemini directly, which meant the local-model option could be selected in the
 * settings panel and then silently ignored at analysis time.
 *
 * Local models also need managing: Ollama loads a model into memory the first
 * time it is used, so an unloaded model means the first analysis stalls for a
 * minute or more. listModels(), runningModels(), and loadModel() expose that
 * state so the UI can show what is ready and let the user warm a model up front.
 */
import fs from "fs";
import path from "path";

export type Provider = "gemini" | "ollama" | "off";

export interface AIConfig {
  provider: Provider;
  geminiApiKey: string;
  ollamaBaseUrl: string;
  ollamaVisionModel: string;
  ollamaTextModel: string;
  /**
   * Models the user has switched off. Only entries present here are disabled,
   * so a newly installed model is available by default without having to be
   * enabled first. Keyed by full Ollama model name.
   */
  disabledModels?: string[];
}

/** Vision models that are good at the app's actual job: counting and naming characters. */
export const PREFERRED_VISION = ["chararchive-vision", "qwen2.5vl", "qwen2-vl", "minicpm-v", "llava", "moondream"];

/**
 * Preferred name for a derived vision model with a usable context window.
 *
 * Ollama's published qwen2.5vl pins num_ctx to 4096, which a single 2K photo
 * exceeds, so every large upload failed with HTTP 400. Requesting a wider
 * window per call is ignored because the model's own parameter wins. Creating
 * a thin alias that only widens the window fixes it and reuses the same weight
 * blobs. See models/chararchive-vision.Modelfile.
 */
export const VISION_MODEL_ALIAS = "chararchive-vision";
/** Text models tuned to be unfiltered, preferred for creative and character work. */
export const PREFERRED_TEXT = ["dolphin", "openhermes", "wizardlm", "solar", "mistral-nemo"];

export function isDisabled(cfg: AIConfig, name: string): boolean {
  return (cfg.disabledModels || []).includes(name);
}

/** Order candidates best-first so a sensible default is chosen automatically. */
function rank(name: string, hints: string[]): number {
  const i = hints.findIndex((h) => name.toLowerCase().includes(h));
  return i === -1 ? hints.length : i;
}

export interface GenerateOptions {
  prompt: string;
  /** Base64 image data, without a data: prefix. */
  image?: string;
  /** Ask for JSON. Ollama enforces this natively; Gemini uses a response mime type. */
  json?: boolean;
  timeoutMs?: number;
}

// Gemini models, most preferred first. Used for failover when one is busy.
export const GEMINI_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.7-flash",
  "gemini-flash-latest",
  "gemini-3.1-flash-lite",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-3.1-pro-preview",
];

const CONFIG_PATH = path.join(process.cwd(), "chararchive.config.json");
const OLLAMA_PORTS = [11434, 11435, 11436];

const DEFAULTS: AIConfig = {
  // Local first. A fresh install used to default to Gemini with no key, so the
  // very first analysis failed with "GEMINI_API_KEY is not set" even on a
  // machine with perfectly good local models sitting in Ollama.
  provider: "ollama",
  geminiApiKey: "",
  ollamaBaseUrl: "http://127.0.0.1:11434",
  ollamaVisionModel: VISION_MODEL_ALIAS,
  ollamaTextModel: "dolphin-llama3:8b",
};

// Windows editors write a UTF-8 BOM that JSON.parse rejects.
function readJson(file: string): any {
  return JSON.parse(fs.readFileSync(file, "utf-8").replace(/^\uFEFF/, ""));
}

export function getConfig(): AIConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return { ...DEFAULTS, ...(readJson(CONFIG_PATH).ai || {}) };
    }
  } catch (err) {
    console.error("Could not read chararchive.config.json:", err);
  }
  return { ...DEFAULTS };
}

export function saveConfig(cfg: AIConfig) {
  let existing: any = {};
  try {
    if (fs.existsSync(CONFIG_PATH)) existing = readJson(CONFIG_PATH);
  } catch (err) {
    console.error("Could not parse existing config, starting fresh:", err);
  }
  existing.ai = cfg;
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(existing, null, 2), "utf-8");
}

/** Find the first Ollama port that answers, so a shifted server still works. */
export async function resolveOllamaUrl(preferred?: string): Promise<string | null> {
  const candidates = [preferred, ...OLLAMA_PORTS.map((p) => `http://127.0.0.1:${p}`)]
    .filter(Boolean) as string[];
  for (const url of candidates) {
    if (await probe(url, "/api/tags")) return url;
  }
  return null;
}

async function probe(url: string, route: string, timeoutMs = 2500): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(`${url.replace(/\/$/, "")}${route}`, { signal: ctrl.signal });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

export interface LocalModelInfo {
  name: string;
  sizeBytes: number;
  /** True when the weights are loaded in memory and ready to answer. */
  loaded: boolean;
  /** Populated by runningModels(): how long it has been resident. */
  loadedFor?: string;
}

/** Installed local models, flagged with whether each is currently loaded. */
export async function listLocalModels(baseUrl?: string): Promise<{ url: string | null; models: LocalModelInfo[] }> {
  const url = await resolveOllamaUrl(baseUrl);
  if (!url) return { url: null, models: [] };

  try {
    const [tags, running] = await Promise.all([
      fetchJson<any>(`${url}/api/tags`),
      fetchJson<any>(`${url}/api/ps`).catch(() => ({ models: [] })),
    ]);

    const loadedAt = new Map<string, string>();
    for (const m of running?.models || []) {
      if (m.name) loadedAt.set(m.name, m.expires_at || "");
    }

    const models = (tags?.models || [])
      .filter((m: any) => m.name)
      .map((m: any) => ({
        name: m.name,
        sizeBytes: m.size || 0,
        loaded: loadedAt.has(m.name),
        loadedFor: loadedAt.get(m.name),
      }));

    return { url, models };
  } catch (err) {
    console.error("Could not list local models:", err);
    return { url, models: [] };
  }
}

async function fetchJson<T>(url: string, init?: RequestInit, timeoutMs = 8000): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Load a model into memory.
 *
 * Ollama loads weights on first use, which makes the first real request very
 * slow. Calling this from the UI means the wait happens when the user chooses
 * the model rather than mid-analysis. Keep_alive holds it warm briefly.
 */
export async function loadLocalModel(name: string, baseUrl?: string, keepAlive = "10m") {
  const url = await resolveOllamaUrl(baseUrl);
  if (!url) throw new Error("No Ollama server is running.");

  await fetchJson<any>(
    `${url}/api/generate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: name, prompt: "", keep_alive: keepAlive, stream: false }),
    },
    // Loading a 5 GB model off disk can take a while.
    180000
  );
  return { name, loaded: true };
}

/** Ask Ollama to drop a model from memory. */
export async function unloadLocalModel(name: string, baseUrl?: string) {
  const url = await resolveOllamaUrl(baseUrl);
  if (!url) throw new Error("No Ollama server is running.");
  await fetchJson<any>(
    `${url}/api/generate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: name, keep_alive: 0 }),
    },
    20000
  );
  return { name, loaded: false };
}

function withTimeout(ms: number, label: string) {
  return new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s`)), ms)
  );
}

/** Substrings that mark a model as able to accept images. */
const VISION_HINTS = ["vision", "vl", "llava", "bakllava", "moondream", "minicpm-v", "gemma3"];

/**
 * Pick the model that will actually serve a request.
 *
 * Split out of callOllama so the UI can ask the engine which model it intends
 * to use. The top bar used to reimplement this rule in the browser, where it
 * disagreed with the server and could offer to load the base model instead of
 * the fixed one, so pressing it did not make analysis work.
 */
async function chooseLocalModel(
  cfg: AIConfig,
  url: string,
  wantImage: boolean
): Promise<string> {
  const preferred = wantImage ? cfg.ollamaVisionModel : cfg.ollamaTextModel;
  const hints = wantImage ? PREFERRED_VISION : PREFERRED_TEXT;

  // Choose among installed models the user has not switched off. The
  // configured choice wins; otherwise fall back to the best-ranked available
  // model for the job. Hard-failing on a name would make the app look broken
  // after a model is renamed, removed, or never downloaded.
  let model = preferred;
  try {
    const { models } = await listLocalModels(url);
    const enabled = models.map((m) => m.name).filter((n) => !isDisabled(cfg, n));

    // The derived wide-context model is the same weights as the base model with
    // the context window fixed, so it always wins when installed. Trusting a
    // saved preference here would keep re-selecting the base model and the
    // uploads would keep failing.
    const alias = enabled.find((n) => n === VISION_MODEL_ALIAS || n.startsWith(`${VISION_MODEL_ALIAS}:`));

    if (wantImage && alias) {
      model = alias;
    } else if (enabled.includes(preferred)) {
      model = preferred;
    } else {
      const capable = wantImage ? enabled.filter((n) => VISION_HINTS.some((h) => n.includes(h))) : enabled;
      const pool = capable.length ? capable : enabled;

      if (pool.length) {
        // Sort best-first so the strongest model is used by default.
        pool.sort((a, b) => rank(a, hints) - rank(b, hints));
        model = pool[0];
        console.log(
          preferred === model
            ? `Using local model "${model}".`
            : `Local model "${preferred}" is unavailable. Using "${model}" instead.`
        );
      } else {
        const total = models.length;
        throw new Error(
          total
            ? "Every installed model is switched off. Enable one in AI Engine Settings."
            : wantImage
              ? "No local model that accepts images is installed. Load a vision model such as qwen2.5vl:7b."
              : "No local models are installed. Pull one, then press Refresh in AI Engine Settings."
        );
      }
    }
  } catch (err: any) {
    // A listing failure should not block the request; let the call itself try.
    if (/switched off|No local model/.test(err?.message || "")) {
      throw err;
    }
    console.log("Could not list local models:", err?.message || err);
  }

  return model;
}

/**
 * Which model the engine will use for images and for text right now.
 *
 * Returns nulls rather than throwing when Ollama is unreachable, so the status
 * panel can still show what is installed.
 */
export async function getActiveModelNames(): Promise<{ vision: string | null; text: string | null }> {
  const cfg = getConfig();
  const url = await resolveOllamaUrl(cfg.ollamaBaseUrl);
  if (!url) return { vision: null, text: null };

  const pick = async (wantImage: boolean) => {
    try {
      return await chooseLocalModel(cfg, url, wantImage);
    } catch {
      return null;
    }
  };

  const [vision, text] = await Promise.all([pick(true), pick(false)]);
  return { vision, text };
}

async function callOllama(cfg: AIConfig, opts: GenerateOptions): Promise<string> {
  const url = await resolveOllamaUrl(cfg.ollamaBaseUrl);
  if (!url) {
    throw new Error(
      "No Ollama server answered. Start Ollama, then use Re-check in AI Engine Settings."
    );
  }

  const model = await chooseLocalModel(cfg, url, Boolean(opts.image));

  const body: Record<string, unknown> = {
    model,
    // /api/generate rather than /api/chat. qwen2.5vl answers image prompts
    // correctly on /api/generate, while /api/chat returns an empty message with
    // done_reason "load" against this model's chat template. Every prompt here
    // is a single instruction, so the chat wrapper buys nothing.
    prompt: opts.prompt,
    stream: false,
    // Hold the weights between requests so repeat analyses stay responsive.
    keep_alive: "10m",
  };
  if (opts.image) body.images = [opts.image];
  // Ollama enforces JSON natively, matching Gemini's responseMimeType.
  if (opts.json) body.format = "json";

  const timeout = opts.timeoutMs ?? 600000;
  const payload = JSON.stringify(body);

  let result: any;
  try {
    result = await Promise.race([
      fetchJson<any>(`${url}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      }, timeout + 5000),
      withTimeout(timeout, `Local model "${model}"`),
    ]);
  } catch (err: any) {
    // Ollama reports a context overflow as a bare HTTP 400, which tells the
    // user nothing. Translate it into something actionable.
    const detail = String(err?.message || "");
    if (/HTTP 400/.test(detail)) {
      throw new Error(
        `"${model}" could not fit this image. It ran out of context space, which ` +
          `usually means the model is too small or the image is unusually large.`
      );
    }
    if (/HTTP 404/.test(detail)) {
      throw new Error(`Ollama does not have a model called "${model}".`);
    }
    throw err;
  }

  const text = result?.response;
  if (!text) {
    throw new Error(
      `Local model "${model}" returned an empty response` +
        (result?.done_reason ? ` (done_reason: ${result.done_reason})` : "") +
        "."
    );
  }
  return text;
}

async function callGemini(apiKey: string, opts: GenerateOptions): Promise<string> {
  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { "User-Agent": "aistudio-build" } },
  });

  let lastError: any;
  // Gemini rate-limits aggressively; walk the list until one answers.
  for (const model of GEMINI_MODELS) {
    try {
      const parts: any[] = [];
      if (opts.image) {
        parts.push({ inlineData: { mimeType: "image/jpeg", data: opts.image } });
      }
      parts.push({ text: opts.prompt });

      const response = await ai.models.generateContent({
        model,
        contents: { parts },
        config: opts.json ? { responseMimeType: "application/json" } : undefined,
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from Gemini model");
      return text;
    } catch (err) {
      lastError = err;
      console.log(`Gemini model ${model} failed; trying the next candidate.`);
    }
  }
  throw lastError;
}

/**
 * Run one analysis against whichever engine is configured.
 * Returns raw text; callers already normalise JSON through cleanAndParseJSON.
 */
export async function generate(opts: GenerateOptions): Promise<string> {
  const cfg = getConfig();

  if (cfg.provider === "off") {
    throw new Error("AI is disabled. Choose a provider in AI Engine Settings.");
  }
  if (cfg.provider === "ollama") {
    return callOllama(cfg, opts);
  }
  if (!cfg.geminiApiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add a key in AI Engine Settings, or switch to Local Ollama."
    );
  }
  return callGemini(cfg.geminiApiKey, opts);
}

/** Whether the configured engine can actually run right now. */
export async function engineStatus() {
  const cfg = getConfig();
  const base = {
    provider: cfg.provider,
    visionModel: cfg.provider === "ollama" ? cfg.ollamaVisionModel : GEMINI_MODELS[0],
    textModel: cfg.provider === "ollama" ? cfg.ollamaTextModel : GEMINI_MODELS[0],
    hasGeminiKey: Boolean(cfg.geminiApiKey),
  };

  if (cfg.provider === "gemini") {
    return {
      ...base,
      ready: base.hasGeminiKey,
      detail: base.hasGeminiKey
        ? `Google Gemini via ${GEMINI_MODELS[0]}`
        : "No Gemini key saved. Add one, or switch to Local Ollama.",
    };
  }

  if (cfg.provider === "off") {
    return { ...base, ready: false, detail: "AI is disabled." };
  }

  const url = await resolveOllamaUrl(cfg.ollamaBaseUrl);
  if (!url) {
    return { ...base, ready: false, detail: "No Ollama server answered on ports 11434-11436." };
  }

  const { models } = await listLocalModels(url);
  const byName = new Map(models.map((m) => [m.name, m]));
  const vision = byName.get(cfg.ollamaVisionModel);
  const text = byName.get(cfg.ollamaTextModel);

  const problems: string[] = [];
  if (!vision) problems.push(`vision model "${cfg.ollamaVisionModel}" is not installed`);
  if (!text) problems.push(`text model "${cfg.ollamaTextModel}" is not installed`);
  const warm = (m?: LocalModelInfo) => (m?.loaded ? "loaded" : "not loaded yet");

  return {
    ...base,
    ready: problems.length === 0,
    detail: problems.length
      ? problems.join("; ")
      : `${url} — ${cfg.ollamaVisionModel}: ${warm(vision)}, ${cfg.ollamaTextModel}: ${warm(text)}`,
    visionLoaded: Boolean(vision?.loaded),
    textLoaded: Boolean(text?.loaded),
    models,
  };
}