import type {
  BrowserPrintDevice,
  LogEntry,
  UpdaterState,
} from "@/shared/types/agent";

export const agentBridge = {
  setDeviceToken: (token: string): Promise<void> =>
    window.api.device.setToken(token),
  clearDevice: (): Promise<void> => window.api.device.clear(),

  updateSettings: (settings: {
    apiUrl?: string;
    browserPrintUrl?: string;
  }): Promise<void> =>
    window.api.settings.update(settings).then(() => undefined),

  connect: (): Promise<void> => window.api.agent.connect(),
  disconnect: (): Promise<void> => window.api.agent.disconnect(),
  reconnect: (): Promise<void> => window.api.agent.reconnect(),
  refreshPrinters: (): Promise<void> => window.api.agent.refreshPrinters(),
  testPrint: (uid: string): Promise<void> => window.api.agent.testPrint(uid),

  getStatus: (): Promise<{ status: string; printers: BrowserPrintDevice[] }> =>
    window.api.agent.getStatus() as Promise<{
      status: string;
      printers: BrowserPrintDevice[];
    }>,

  onStatus: (callback: (status: string) => void): (() => void) =>
    window.api.agent.onStatus(callback),
  onPrinters: (
    callback: (printers: BrowserPrintDevice[]) => void,
  ): (() => void) =>
    window.api.agent.onPrinters(callback as (printers: unknown[]) => void),

  getLoginItemEnabled: (): Promise<boolean> =>
    window.api.app.getLoginItemEnabled(),
  setLoginItemEnabled: (enabled: boolean): Promise<void> =>
    window.api.app.setLoginItemEnabled(enabled),
  getAppVersion: (): Promise<string> => window.api.app.getVersion(),

  getUpdaterStatus: (): Promise<UpdaterState> =>
    window.api.updater.getStatus() as Promise<UpdaterState>,
  checkForUpdates: (): Promise<void> => window.api.updater.check(),
  quitAndInstallUpdate: (): Promise<void> =>
    window.api.updater.quitAndInstall(),
  onUpdaterStatus: (callback: (state: UpdaterState) => void): (() => void) =>
    window.api.updater.onStatus(callback),

  getLogs: (): Promise<LogEntry[]> => window.api.logs.getAll(),
  clearLogs: (): Promise<void> => window.api.logs.clear(),
  onLogAppend: (callback: (entry: LogEntry) => void): (() => void) =>
    window.api.logs.onAppend(callback),

  runBrowserPrintInstaller: (): Promise<void> =>
    window.api.installers.runBrowserPrint(),
  runDriverInstaller: (): Promise<void> => window.api.installers.runDriver(),
};
