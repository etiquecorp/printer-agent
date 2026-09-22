import { app, ipcMain, type BrowserWindow } from "electron";

import { agentRuntime } from "./agent/runtime";
import { agentLogger } from "./agent/logger";
import { isLoginItemEnabled, setLoginItemEnabled } from "./tray";
import { runBrowserPrintInstaller, runDriverInstaller } from "./installers";
import { appUpdater } from "./updater";

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  agentRuntime.setListener({
    onStatus: (status) => mainWindow.webContents.send("agent:status", status),
    onPrinters: (printers) =>
      mainWindow.webContents.send("agent:printers", printers),
  });

  agentLogger.setListener((entry) =>
    mainWindow.webContents.send("logs:append", entry),
  );

  appUpdater.setListener((state) =>
    mainWindow.webContents.send("updater:status", state),
  );

  ipcMain.handle("device:set-token", (_e, token: string) => {
    agentRuntime.setDeviceToken(token);
  });

  ipcMain.handle("device:clear", () => {
    agentRuntime.clearDevice();
  });

  ipcMain.handle("settings:get", () => agentRuntime.getSettings());

  ipcMain.handle(
    "settings:update",
    (_e, settings: { apiUrl?: string; browserPrintUrl?: string }) =>
      agentRuntime.updateSettings(settings),
  );

  ipcMain.handle("agent:connect", () => {
    agentRuntime.connect();
  });

  ipcMain.handle("agent:disconnect", () => {
    agentRuntime.disconnect();
  });

  ipcMain.handle("agent:reconnect", () => {
    agentRuntime.reconnect();
  });

  ipcMain.handle("agent:refresh-printers", () =>
    agentRuntime.refreshPrinters(),
  );

  ipcMain.handle("agent:test-print", (_e, uid: string) =>
    agentRuntime.testPrint(uid),
  );

  ipcMain.handle("agent:get-status", () => ({
    status: agentRuntime.getStatus(),
    printers: agentRuntime.getPrinters(),
  }));

  ipcMain.handle("app:get-login-item", () => isLoginItemEnabled());

  ipcMain.handle("app:set-login-item", (_e, enabled: boolean) => {
    setLoginItemEnabled(enabled);
  });

  ipcMain.handle("app:get-version", () => app.getVersion());

  ipcMain.handle("updater:get-status", () => appUpdater.getState());

  ipcMain.handle("updater:check", () => appUpdater.check());

  ipcMain.handle("updater:quit-and-install", () => {
    appUpdater.quitAndInstall();
  });

  ipcMain.handle("logs:get", () => agentLogger.getAll());

  ipcMain.handle("logs:clear", () => {
    agentLogger.clear();
  });

  ipcMain.handle("installers:run-browser-print", () =>
    runBrowserPrintInstaller(),
  );

  ipcMain.handle("installers:run-driver", () => runDriverInstaller());
}
