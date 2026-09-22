import { app, shell, BrowserWindow } from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import icon from "../../resources/icon.png?asset";

import { agentRuntime } from "./agent/runtime";
import { registerIpcHandlers } from "./ipc";
import { createTray, destroyTray } from "./tray";
import { appUpdater } from "./updater";

// In dev, Electron's own binary name ("Electron") shows in the dock/menu bar
// unless overridden explicitly, since we're not running the packaged app yet.
app.setName("Agente de Impressão Etiquê");

// The window hides instead of closing (see the "close" handler below), so the WS connection and
// printing keep working from the tray. Only an explicit "Sair" (tray menu) or Cmd+Q really quits.
let isQuitting = false;

// Only one instance may run at a time — the second launch just focuses the first one's window
// (via the "second-instance" handler below) instead of opening a new copy.
const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
} else {
  setupApp();
}

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 720,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    icon,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }

  return mainWindow;
}

function setupApp(): void {
  let mainWindow: BrowserWindow | null = null;

  app.on("second-instance", () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.whenReady().then(() => {
    // Set app user model id for windows
    electronApp.setAppUserModelId("com.etique.agent");

    // Electron's own binary icon shows in dev; force the dock icon on macOS
    if (process.platform === "darwin") {
      app.dock?.setIcon(icon);
    }

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on("browser-window-created", (_, window) => {
      optimizer.watchWindowShortcuts(window);
    });

    mainWindow = createWindow();
    registerIpcHandlers(mainWindow);
    createTray(mainWindow, icon, () => {
      isQuitting = true;
      app.quit();
    });

    // Reconnects on its own if a device was already paired on a previous run — the agent
    // shouldn't need the renderer to be open to start printing after a machine reboot.
    agentRuntime.connect();

    // electron-updater reads the publish feed baked into the packaged app; running it
    // against an unpackaged dev build has nothing to check against and only logs noise.
    if (app.isPackaged) {
      appUpdater.init();
    }

    app.on("activate", function () {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0)
        mainWindow = createWindow();
    });
  });

  app.on("before-quit", () => {
    isQuitting = true;
    destroyTray();
  });

  // The tray keeps the app alive on every platform now — closing the window only hides it.
  app.on("window-all-closed", () => {
    // no-op: quitting happens via the tray's "Sair" or Cmd+Q (before-quit), not window closes.
  });
}
