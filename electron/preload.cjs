/**
 * CharArchive - preload script
 *
 * The renderer runs with contextIsolation on and no Node integration, so it
 * cannot touch the filesystem or child processes. This exposes one narrow,
 * read-only capability: telling the app it is running inside Electron, so the
 * UI can label itself and offer desktop-friendly behaviour.
 */
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("chararchive", {
  isDesktop: true,
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
});