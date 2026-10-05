# CharArchive

A character and asset archive for **Armentero Studios**. Catalog characters,
model sheets, artwork, audio, video, and project dossiers, with optional AI
analysis of uploaded images.

Runs as a native Windows desktop app. Everything is stored locally or in your
own Firebase project.

---

## Quick start

```powershell
npm install
npm run build
npm run electron:start
```

That builds the app and opens it in a desktop window. To open it again later
after it is installed, use the **CharArchive** shortcut on your desktop.

### Other commands

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server with hot reload (browser at `localhost:3000`) |
| `npm run build` | Production build of the React app and server bundle |
| `npm start` | Run the built server only (opens in your browser) |
| `npm run electron:dev` | Open the Electron window against an already-built `dist` |
| `npm run electron:start` | Build, then open the Electron window |
| `npm run package` | Build a Windows installer (`.exe`) into `release/` |
| `npm run package:dir` | Build an unpacked app folder, no installer (faster) |
| `npm run lint` | TypeScript check, no emit |
| `npm run clean` | Remove `dist/` |

---

## How it is put together

```
electron/main.cjs        Electron main process: starts the server, opens the window
electron/preload.cjs     Narrow read-only bridge (contextIsolation on)
server.ts                Express server + AI endpoints + Firebase admin
src/                     React app (the entire UI)
index.html               Vite entry
assets/                  Icons and the icon generator
_scripts_archive/        Retired one-off patch scripts (see "Cleanup" below)
```

The desktop app and the browser app are the **same** React code. The Electron
main process launches `dist/server.cjs` as a child process, waits for
`/api/health` to answer, then points a window at `http://127.0.0.1:3000`. There
is no second code path to keep in sync.

### Stack

- **React 19** + **Vite 6** + **TypeScript**
- **Tailwind CSS 4** with Radix UI primitives and `lucide-react` icons
- **Express** server on the loopback interface
- **Firebase** Firestore / Auth / Storage for cloud data
- **Electron 44** for the desktop shell
- **Gemini** (`@google/genai`) or a **local Ollama** model for AI analysis
- `pdfjs-dist`, `react-pageflip`, `jspdf` for PDF and booklet export
- `three` for 3D models, `html2canvas` for image capture, `dnd-kit` for sorting

---

## Configuration

### The AI engine (set inside the app)

Open **Menu**, then the developer panel, then **AI Engine Settings**. The
creator-panel PIN defaults to `000`.

Three providers are selectable:

- **Google Gemini** — paste an API key. Free keys: <https://aistudio.google.com/apikey>
- **Local Ollama** — point at a running Ollama server; uses a vision model for
  images and a text model for text. Auto-detects ports 11434- 11436.
- **Disabled**

Keys are stored in `chararchive.config.json` next to the app. That file is
listed in `.gitignore` and can never be committed. The app masks the key in the
UI and never sends the full value back to the browser.

### Environment variables

Only needed to change defaults. Copy `.env.example` to `.env` if required.

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | Local server port |
| `HOST` | `127.0.0.1` | Bind interface. Leave as loopback so the firewall is not prompted |
| `NODE_ENV` | `production` | Set to anything else for the Vite dev middleware |

### Firebase

`firebase-applet-config.json` holds the client config and is intentionally
committed — Firebase web config is designed to be public, and access is
controlled by Firestore security rules. **Security rules are what protect your
data, not this file.** No service-account keys belong in this repo.

---

## Security notes

- The server binds to `127.0.0.1` only, so nothing on your network can reach it.
- The Electron renderer runs with `contextIsolation: true` and
  `nodeIntegration: false`, so the UI has no filesystem or process access.
- The creator-panel PIN is **client-side only**. It is stored in `localStorage`
  and can be read or bypassed from devtools. It is a speed bump, not security.
- Firestore security rules are the real access control. Review them before
  sharing this app with anyone.

---

## Backups

The developer panel contains a **System Backup & Source Code Exporter** that
returns the running source files over `/api/backup-source`.

- Use **Download .txt Backup** for a portable, readable archive.
- **Export to PDF** prints from a browser, which converts code into vector
  shapes. The result is a *picture* of the code and its text cannot be
  extracted. Prefer the `.txt` option if you need to search or diff the output.

---

## Project layout in the source

| Area | Contents |
|---|---|
| `src/App.tsx` | Top-level layout, navigation, and the developer/settings panels |
| `src/components/` | 28 feature components (media, editors, readers, mini-game, mood board, ...) |
| `src/data/` | Seed data (`defaultDock.ts`) |
| `src/lib/` | Firebase client, backup and booklet helpers |
| `src/types.ts` | `Character`, `ArchiveItem`, `ProjectRelation`, and related types |
| `server.ts` | Express routes, AI endpoints, static serving |

`src/components/CharacterEditor.tsx` is by far the largest file. Changes to the
character schema usually mean editing it and `src/types.ts` together.

---

## Maintenance notes

**Patch scripts.** Roughly two dozen `fix_*.cjs` / `update_*.py` /
`generate_*.cjs` scripts used to sit in the project root. They patched source
files by string replacement, which is fragile and can silently corrupt a file.
They were moved to `_scripts_archive/` in 2026 and are excluded from git. Edit
source files directly instead of reviving those scripts.

**The icon.** `assets/icon.png` is the 256x256 master; `assets/icon.ico` holds
the seven standard Windows sizes. Regenerate both with:

```powershell
python assets\make_icon.py
```

The generator asserts that the background plate is opaque and dark, so a broken
render fails loudly instead of shipping a white icon.

---

## Credits

Created by **Alberto Armentero** for Armentero Studios.