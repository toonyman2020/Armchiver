/**
 * Stage the runtime dependencies the packaged app actually needs.
 *
 * The production server requires far fewer packages than the dev server. Copying
 * only the real transitive closure into a staging folder and pointing
 * electron-builder at it cuts the packaged app from ~1 GB down to a fraction of
 * that: Electron's own binaries (371 MB alone), the Firebase client, TypeScript,
 * and the bundler never get shipped.
 *
 * Resolution is delegated to Node itself via require.resolve rather than being
 * reimplemented here. An earlier hand-rolled version trusted package.json
 * manifests and produced an installer that crashed on launch, because
 * google-auth-library@10.5.0 -- which googleapis-common nests inside itself --
 * requires "gtoken" without ever declaring it.
 *
 * Usage:
 *   node assets\\stage_runtime_deps.js
 */
const fs = require("fs");
const path = require("path");
const { builtinModules } = require("module");

const ROOT = path.dirname(__dirname);
const NM = path.join(ROOT, "node_modules");
const STAGE = path.join(ROOT, "build", "runtime", "node_modules");

// Direct runtime imports in server.ts. Vite is deliberately absent: it is a
// lazy dynamic import that only fires outside production.
const ROOTS = ["express", "adm-zip", "@google/genai", "multer", "googleapis"];

const BUILTINS = new Set([
  ...builtinModules,
  ...builtinModules.map((m) => `node:${m}`),
]);

function readManifest(dir) {
  const file = path.join(dir, "package.json");
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function dupe(dir) {
  let total = 0;
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(cur, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      const full = path.join(cur, e.name);
      if (e.isDirectory()) stack.push(full);
      else {
        try {
          total += fs.statSync(full).size;
        } catch {}
      }
    }
  }
  return total;
}

/**
 * Walk the real resolution graph.
 *
 * Each package is identified by its directory relative to node_modules, because
 * the same package name can appear at several versions in nested trees and each
 * one resolves against its own neighbours.
 */
function closure() {
  const found = new Map(); // relDir -> { manifest, deps:Set }
  const missing = new Set();
  const queue = ROOTS.map((name) => ({ name, from: ROOT }));

  while (queue.length) {
    const { name, from } = queue.shift();
    let resolved;
    try {
      resolved = require.resolve(`${name}/package.json`, { paths: [from] });
    } catch {
      try {
        // Not all packages expose ./package.json via exports; fall back to the
        // main entry and walk up to the package root.
        resolved = require.resolve(name, { paths: [from] });
      } catch {
        missing.add(name);
        continue;
      }
    }

    let dir = fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()
      ? resolved
      : path.dirname(resolved);

    let manifest = readManifest(dir);
    while (dir.startsWith(NM) && !manifest) {
      dir = path.dirname(dir);
      manifest = readManifest(dir);
    }
    if (!manifest) {
      missing.add(name);
      continue;
    }
    // Re-read from the package root so scoped names resolve correctly.
    while (dir !== path.dirname(dir) && !fs.existsSync(path.join(dir, "package.json"))) {
      dir = path.dirname(dir);
    }

    const rel = path.relative(NM, dir).replace(/\\/g, "/");
    if (found.has(rel)) continue;

    const entry = found.get(rel);
    found.set(rel, { manifest, dir });
    if (entry) continue;

    const deps = new Set([
      ...Object.keys(manifest.dependencies || {}),
      ...Object.keys(manifest.optionalDependencies || {}),
      ...Object.keys(manifest.peerDependencies || {}),
    ]);
    found.set(rel, { manifest, dir, deps });

    for (const dep of deps) {
      if (BUILTINS.has(dep) || dep.startsWith("node:")) continue;
      // Resolve each dependency from this package's own directory, which is
      // what Node does at runtime.
      queue.push({ name: dep, from: dir });
    }
  }

  return { packages: found, missing };
}

function main() {
  if (!fs.existsSync(NM)) {
    console.error("node_modules is missing. Run `npm install` first.");
    process.exit(1);
  }

  const { packages, missing } = closure();

  if (missing.size) {
    console.log("declared but not installed (skipped):");
    for (const name of [...missing].sort()) console.log(`   ${name}`);
    console.log();
  }

  fs.rmSync(path.dirname(STAGE), { recursive: true, force: true });
  fs.mkdirSync(STAGE, { recursive: true });

  for (const [rel, info] of packages) {
    const dst = path.join(STAGE, rel);
    if (fs.existsSync(dst)) continue;
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.cpSync(info.dir, dst, {
      recursive: true,
      // Trim test fixtures and documentation only at the top of a package.
      // A nested "docs" directory can be real runtime code: googleapis has an
      // apis/docs/ folder for the Google Docs API, and dropping it makes the
      // whole package fail to load.
      filter: (src) => {
        const rel = path.relative(info.dir, src).replace(/\\/g, "/");
        const depth = rel.split("/").filter(Boolean).length;
        if (depth > 1) return true;
        return !/^(test|tests|benchmark|docs|doc|example|examples|\.github)$/.test(rel);
      },
    });
  }

  const manifest = {
    name: "chararchive-runtime",
    version: "0.1.0",
    private: true,
    description: "Runtime dependencies for the packaged CharArchive app",
    dependencies: Object.fromEntries([...packages.keys()].map((rel) => [rel, "*"])),
  };
  fs.writeFileSync(path.join(STAGE, "..", "package.json"), JSON.stringify(manifest, null, 2));

  const staged = dupe(STAGE) / 1e6;
  const full = dupe(NM) / 1e6;
  console.log(`staged ${packages.size} packages into build/runtime/node_modules`);
  console.log(`staged logical size : ${staged.toFixed(1).padStart(8)} MB`);
  console.log(`node_modules total  : ${full.toFixed(1).padStart(8)} MB`);
  console.log(`not staged          : ${(full - staged).toFixed(1).padStart(8)} MB`);
}

main();