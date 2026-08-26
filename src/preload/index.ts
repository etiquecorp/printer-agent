import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";

interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
}

const api = {
  device: {
    setToken: (token: string): Promise<void> =>
      ipcRenderer.invoke("device:set-token", token),
    clear: (): Promise<void> => ipcRenderer.invoke("device:clear"),
  },
  settings: {
    get: (): Promise<{ apiUrl: string; browserPrintUrl: string }> =>
      ipcRenderer.invoke("settings:get"),
    update: (settings: {
      apiUrl?: string;
      browserPrintUrl?: string;
    }): Promise<{ apiUrl: string; browserPrintUrl: string }> =>
      ipcRenderer.invoke("settings:update", settings),
  },
  agent: {
    connect: (): Promise<void> => ipcRenderer.invoke("agent:connect"),
    disconnect: (): Promise<void> => ipcRenderer.invoke("agent:disconnect"),
    reconnect: (): Promise<void> => ipcRenderer.invoke("agent:reconnect"),
    refreshPrinters: (): Promise<void> =>
      ipcRenderer.invoke("agent:refresh-printers"),
    testPrint: (uid: string): Promise<void> =>
      ipcRenderer.invoke("agent:test-print", uid),
    getStatus: (): Promise<{ status: string; printers: unknown[] }> =>
      ipcRenderer.invoke("agent:get-status"),
    onStatus: (callback: (status: string) => void): (() => void) => {
      const listener = (
        _event: Electron.IpcRendererEvent,
        status: string,
      ): void => callback(status);
      ipcRenderer.on("agent:status", listener);
      return () => ipcRenderer.removeListener("agent:status", listener);
    },
    onPrinters: (callback: (printers: unknown[]) => void): (() => void) => {
      const listener = (
        _event: Electron.IpcRendererEvent,
        printers: unknown[],
      ): void => callback(printers);
      ipcRenderer.on("agent:printers", listener);
      return () => ipcRenderer.removeListener("agent:printers", listener);
    },
  },
  app: {
    getLoginItemEnabled: (): Promise<boolean> =>
      ipcRenderer.invoke("app:get-login-item"),
    setLoginItemEnabled: (enabled: boolean): Promise<void> =>
      ipcRenderer.invoke("app:set-login-item", enabled),
  },
  logs: {
    getAll: (): Promise<LogEntry[]> => ipcRenderer.invoke("logs:get"),
    clear: (): Promise<void> => ipcRenderer.invoke("logs:clear"),
    onAppend: (callback: (entry: LogEntry) => void): (() => void) => {
      const listener = (
        _event: Electron.IpcRendererEvent,
        entry: LogEntry,
      ): void => callback(entry);
      ipcRenderer.on("logs:append", listener);
      return () => ipcRenderer.removeListener("logs:append", listener);
    },
  },
  installers: {
    runBrowserPrint: (): Promise<void> =>
      ipcRenderer.invoke("installers:run-browser-print"),
    runDriver: (): Promise<void> => ipcRenderer.invoke("installers:run-driver"),
  },
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}

export type AgentApi = typeof api;
