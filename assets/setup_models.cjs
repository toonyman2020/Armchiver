#!/usr/bin/env node
/**
 * Make sure the local AI models the app needs are present.
 *
 * The app runs entirely offline on models the user installs themselves. One
 * piece of setup is not optional and is easy to miss: the image analysis model
 * has to exist under the name `chararchive-vision`, derived from qwen2.5vl
 * with a usable context window. Without it, uploads fail with HTTP 400,
 * because the published model only accepts a 4096 token window and a single
 * 2K photo already exceeds that.
 *
 * This script is idempotent. It does nothing if the derived model is already
 * installed, and it never downloads more than the base model it wraps.
 */

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ALIAS = "chararchive-vision";
const BASE_MODEL = "qwen2.5vl:7b";
const MODELFILE = path.join(__dirname, "..", "models", `${ALIAS}.Modelfile`);

function findOllama() {
  const exe = process.platform === "win32" ? "ollama.exe" : "ollama";

  // Everything Ollama is usually installed under, plus whatever OLLAMA_PATH
  // points at. A portable or hand-unpacked install is common on this setup,
  // so the search cannot assume the default location.
  //
  // OLLAMA_PATH is only a hint. If it is stale it must not stop the search,
  // or a variable left over from an earlier machine leaves setup permanently
  // broken with no way out short of editing the environment by hand.
  const roots = [
    process.env.LOCALAPPDATA,
    process.env.ProgramFiles,
    `${process.env.ProgramFiles || ""} (x86)`,
    path.join(process.env.USERPROFILE || "", "AppData", "Local", "Programs"),
  ].filter(Boolean);

  const candidates = [];
  if (process.env.OLLAMA_PATH) candidates.push(process.env.OLLAMA_PATH);

  const relative = [
    "Ollama/bin",
    "Ollama",
    "bin",
    "ollama/bin",
    path.join("OtherAI", "Ollama", "bin"),
  ];
  for (const root of roots) {
    for (const rel of relative) candidates.push(path.join(root, rel, exe));
  }

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  // Portable installs do not live in a standard folder, so scan the drives for
  // a bin\ollama.exe. This runs once during setup and must not become a full
  // disk walk, so the depth is bounded and the noisy trees are skipped.
  for (const drive of ["Z:", "D:", "C:"]) {
    const found = searchForOllama(path.join(drive, "\\"), exe, 7);
    if (found) return found;
  }

  // Last resort: whatever is already on PATH.
  return exe;
}

function run(ollama, args) {
  return execFileSync(ollama, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

/** Look for bin\<ollama> a few levels down, skipping the noisy places. */
function searchForOllama(dir, exe, depth) {
  if (depth < 0) return null;

  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return null; // Unreadable or offline drive.
  }

  if (entries.some((e) => e.isFile() && e.name.toLowerCase() === exe)) {
    return path.join(dir, exe);
  }

  const skip = new Set(["node_modules", "$recycle.bin", "system volume information", "windows"]);
  for (const entry of entries) {
    if (!entry.isDirectory() || skip.has(entry.name.toLowerCase())) continue;
    const found = searchForOllama(path.join(dir, entry.name), exe, depth - 1);
    if (found) return found;
  }

  return null;
}

function installedModels(ollama) {
  // An empty list is never a valid answer, so a failure here has to raise
  // rather than silently look like "nothing is installed" and trigger a
  // pointless download.
  const raw = run(ollama, ["list"]);
  const names = new Set();
  for (const line of raw.split(/\r?\n/).slice(1)) {
    const name = line.trim().split(/\s+/)[0];
    if (name && name !== "NAME") names.add(name);
  }
  if (!names.size) {
    throw new Error("Ollama reported no models, which is not a usable answer.");
  }
  return names;
}

function main() {
  const ollama = findOllama();

  let installed;
  try {
    installed = installedModels(ollama);
  } catch (err) {
    console.error("Could not read the installed Ollama models.");
    console.error(`  Tried: ${ollama}`);
    console.error(`  ${err.message}`);
    console.error("  Start Ollama, or set OLLAMA_PATH to its full path, then run this again.");
    process.exitCode = 1;
    return;
  }

  const alreadyThere = installed.has(ALIAS) || installed.has(`${ALIAS}:latest`);
  if (alreadyThere) {
    console.log(`${ALIAS} is already installed. Nothing to do.`);
    return;
  }

  if (!installed.has(BASE_MODEL) && !installed.has("qwen2.5vl")) {
    console.log(`${BASE_MODEL} is not installed. Pulling it first.`);
    console.log("  This is a one-time download of roughly 6 GB.");
    try {
      run(ollama, ["pull", BASE_MODEL]);
    } catch (err) {
      console.error(`Download failed: ${err.message}`);
      console.error("  Check the connection, then run this again. Nothing was changed.");
      process.exitCode = 1;
      return;
    }
  }

  if (!fs.existsSync(MODELFILE)) {
    console.error(`Missing Modelfile: ${MODELFILE}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Creating ${ALIAS} from ${BASE_MODEL} with a 32768 token window...`);
  try {
    run(ollama, ["create", ALIAS, "-f", MODELFILE]);
  } catch (err) {
    console.error(`Could not create ${ALIAS}: ${err.message}`);
    console.error("  Image analysis will fail with a context error until this succeeds.");
    process.exitCode = 1;
    return;
  }

  console.log(`\nDone. ${ALIAS} is ready and image analysis will work.`);
  console.log("It reuses the same weights as the base model, so it adds no real disk cost.");
}

main();