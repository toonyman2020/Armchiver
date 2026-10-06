/**
 * CharArchive - Electron main process
 *
 * Starts the existing Express server in-process, then opens a native window
 * pointed at it. Nothing in the React app had to change: it still talks to
 * localhost over HTTP exactly as it does in a browser.
 */
const { app, BrowserWindow, shell, dialog, Menu } = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");
const { fork } = require("child_process");

const SERVER_PORT = Number(process.env.PORT) || 3000;
const SERVER_URL = `http://127.0.0.1:${SERVER_PORT}`;
const DEV_URL = process.env.VITE_DEV_SERVER_URL;

// In a packaged build the app lives in resources/app.asar, but the server
// bundle and node_modules have to be unpacked so they can be required/run
// from disk. Resolve the real (unpacked) location when packaged.
function appRoot() {
  if (!app.isPackaged) return app.getAppPath();
  return path.join(process.resourcesPath, "app.asar.unpacked");
}

/**
 * Where the trimmed runtime dependencies live.
 *
 * In development that is the repo's own node_modules. In a packaged build the
 * full tree is not shipped, so the staged subset sits under resources/runtime.
 */
function runtimeModules() {
  if (!app.isPackaged) return path.join(appRoot(), "node_modules");
  return path.join(process.resourcesPath, "runtime", "node_modules");
}

let mainWindow = null;
let serverProcess = null;

/** Poll the server until it answers so the window never loads a dead page. */
async function waitForServer(timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const ok = await new Promise((resolve) => {
      const req = http.get(`${SERVER_URL}/api/health`, (res) => {
        res.resume();
        resolve(res.statusCode === 200);
      });
      req.on("error", () => resolve(false));
      req.setTimeout(1500, () => {
        req.destroy();
        resolve(false);
      });
    });
    if (ok) return true;
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

function startServer() {
  const root = appRoot();
  const bundle = path.join(root, "dist", "server.cjs");

  if (!fs.existsSync(bundle)) {
    dialog.showErrorBox(
      "CharArchive is not built",
      `Could not find the server bundle at:\n${bundle}\n\nRun "npm run build" before launching.`
    );
    app.quit();
    return;
  }

  // The server bundle keeps its npm dependencies external, so point Node at
  // wherever those packages actually live in this installation.
  const modules = runtimeModules();

  serverProcess = fork(bundle, [], {
    cwd: root,
    env: {
      ...process.env,
      // The React bundle is prebuilt, so always serve from dist.
      NODE_ENV: "production",
      PORT: String(SERVER_PORT),
      ELECTRON_RUN_AS_NODE: "1",
      NODE_PATH: modules,
      CHARARCHIVE_MODULES: modules,
      // The React bundle stays inside app.asar, so hand the server the real
      // location rather than letting it guess from the working directory.
      CHARARCHIVE_DIST: path.join(app.getAppPath(), "dist"),
      // Seed data references character artwork by a /src/assets/images/... URL.
      // app.asar.unpacked holds a copy so the server can serve it directly.
      CHARARCHIVE_IMAGES: appRoot(),
    },
    stdio: ["ignore", "pipe", "pipe", "ipc"],
  });

  const prefix = (stream, tag) => {
    stream.on("data", (chunk) => {
      const text = chunk.toString().trim();
      if (!text) return;
      // The server logs every request; only surface notable lines in the window.
      if (/Server running|AI provider|EADDRINUSE|Error:|error:/i.test(text)) {
        console.log(`[server${tag}] ${text}`);
      }
    });
  };
  prefix(serverProcess.stdout, "");
  prefix(serverProcess.stderr, ":err");

  serverProcess.on("exit", (code) => {
    serverProcess = null;
    if (code !== 0 && !app.isQuitting) {
      dialog.showErrorBox(
        "CharArchive server stopped",
        `The local server exited with code ${code}.\n\n` +
          `If port ${SERVER_PORT} is already in use, close that program and try again.`
      );
    }
  });
}

function stopServer() {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill();
    serverProcess = null;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1000,
    minHeight: 700,
    backgroundColor: "#0b0d12",
    title: "CharArchive",
    show: false,
    webPreferences: {
      // Keep Chromium's normal sandboxed renderer. The app only ever talks to
      // its own localhost server.
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs"),
      spellcheck: true,
    },
  });

  // Avoid the white flash before React paints.
  mainWindow.once("ready-to-show", () => mainWindow.show());

  // Open external links (docs, key signup, YouTube) in the real browser
  // instead of hijacking the app window.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://") || url.startsWith("https://")) shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (event, url) => {
    const allowed = DEV_URL || SERVER_URL;
    if (!url.startsWith(allowed)) {
      event.preventDefault();
      if (url.startsWith("http")) shell.openExternal(url);
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  if (DEV_URL) {
    mainWindow.loadURL(DEV_URL);
  } else {
    mainWindow.loadURL(SERVER_URL);
  }
}

function buildMenu() {
  const isMac = process.platform === "darwin";
  const template = [
    ...(isMac ? [{ role: "appMenu" }] : []),
    {
      label: "File",
      submenu: [
        {
          label: "Reload Window",
          accelerator: "CmdOrCtrl+R",
          click: () => mainWindow?.reload(),
        },
        { type: "separator" },
        isMac ? { role: "close" } : { role: "quit", label: "Exit CharArchive" },
      ],
    },
    { role: "editMenu" },
    {
      label: "View",
      submenu: [
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
        { role: "toggleDevTools" },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "Get a Free Gemini API Key",
          click: () => shell.openExternal("https://aistudio.google.com/apikey"),
        },
        {
          label: "About CharArchive",
          click: () =>
            dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "CharArchive",
              message: `CharArchive ${app.getVersion()}`,
              detail:
                `Character & asset archive for Armentero Studios.\n\n` +
                `Electron ${process.versions.electron} · Chromium ${process.versions.chrome}\n` +
                `Node ${process.versions.node}\n\n` +
                `Local server: ${SERVER_URL}`,
            }),
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// One instance only, so two copies cannot fight over the port.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    buildMenu();

    if (DEV_URL) {
      // In dev the Vite server is already running; just wait for it.
      const ready = await waitForServer(30000);
      if (!ready) {
        dialog.showErrorBox(
          "CharArchive could not start",
          `No server answered at ${DEV_URL}. Start "npm run dev" first.`
        );
        app.quit();
        return;
      }
    } else {
      // Check first: if something is already serving this app on the port,
      // reuse it rather than fighting over the port.
      const alreadyUp = await waitForServer(1000);

      if (!alreadyUp) {
        startServer();
        const ready = await waitForServer(30000);
        if (!ready) {
          dialog.showErrorBox(
            "CharArchive could not start",
            `The local server did not respond on port ${SERVER_PORT}.\n\n` +
              `Another program may be using that port.`
          );
          app.quit();
          return;
        }
      }
    }

    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  // Closing the window shuts the server down so no invisible Node process is
  // left running in the background.
  app.on("before-quit", () => {
    app.isQuitting = true;
    stopServer();
  });

  app.on("window-all-closed", () => {
    stopServer();
    if (process.platform !== "darwin") app.quit();
  });
}