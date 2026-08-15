import { ipcMain, type BrowserWindow } from "electron";

import { agentRuntime } from "./agent/runtime";
import { agentLogger } from "./agent/logger";
import { isLoginItemEnabled, setLoginItemEnabled } from "./tray";

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  agentRuntime.setListener({
    onStatus: (status) => mainWindow.webContents.send("agent:status", status),
    onPrinters: (printers) =>
      mainWindow.webContents.send("agent:printers", printers),
  });

  agentLogger.setListener((entry) =>
    mainWindow.webContents.send("logs:append", entry),
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

  ipcMain.handle("logs:get", () => agentLogger.getAll());

  ipcMain.handle("logs:clear", () => {
    agentLogger.clear();
  });
}
