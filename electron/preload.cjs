/**
 * CharArchive - preload script
 *
 * The renderer runs with contextIsolation on and no Node integration, so it
 * cannot touch the filesystem or child processes. This exposes one narrow,
 * read-only capability: telling the app it is running inside Electron, so the
 * UI can label itself and offer desktop-friendly behaviour.
 */
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("chararchive", {
  isDesktop: true,
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
  /**
   * Ask the main process to close the window cleanly.
   *
   * Closing this way runs the same shutdown path as the window's own close
   * button, which also stops the local server. A plain window.close() from the
   * renderer would leave the server running.
   */
  requestClose: () => ipcRenderer.invoke("app:request-close"),
  confirmClose: (message) => ipcRenderer.invoke("app:confirm-close", message),
});