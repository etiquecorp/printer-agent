import type { BrowserPrintDevice } from "./browser-print";
import { agentLogger } from "./logger";
import { settingsStore, type AgentSettings } from "./settings-store";
import { tokenStore } from "./token-store";
import { AgentWsClient, type AgentStatus } from "./ws-client";

interface RuntimeListener {
  onStatus: (status: AgentStatus) => void;
  onPrinters: (printers: BrowserPrintDevice[]) => void;
}

let listener: RuntimeListener | null = null;

const client = new AgentWsClient({
  onStatusChange: (status) => listener?.onStatus(status),
  onPrintersChange: (printers) => listener?.onPrinters(printers),
});

function connectIfPossible(): void {
  const token = tokenStore.get();
  if (!token) return;

  const { apiUrl, browserPrintUrl } = settingsStore.get();
  client.connect(apiUrl, browserPrintUrl, token);
}

export const agentRuntime = {
  setListener(l: RuntimeListener): void {
    listener = l;
  },

  connect(): void {
    connectIfPossible();
  },

  disconnect(): void {
    client.disconnect();
  },

  reconnect(): void {
    agentLogger.info("Reconexão solicitada pelo usuário.");
    client.disconnect();
    connectIfPossible();
  },

  async refreshPrinters(): Promise<void> {
    await client.refreshPrinters();
  },

  async testPrint(uid: string): Promise<void> {
    await client.testPrint(uid);
  },

  getStatus(): AgentStatus {
    return client.getStatus();
  },

  getPrinters(): BrowserPrintDevice[] {
    return client.getPrinters();
  },

  getSettings(): AgentSettings {
    return settingsStore.get();
  },

  updateSettings(settings: Partial<AgentSettings>): AgentSettings {
    const updated = settingsStore.update(settings);
    agentLogger.info("Configurações atualizadas.");
    if (client.getStatus() !== "idle") {
      client.disconnect();
      connectIfPossible();
    }
    return updated;
  },

  setDeviceToken(token: string): void {
    tokenStore.set(token);
    agentLogger.info("Dispositivo pareado — token salvo.");
    connectIfPossible();
  },

  clearDevice(): void {
    tokenStore.clear();
    agentLogger.info("Pareamento removido deste computador.");
    client.disconnect();
  },

  hasDevice(): boolean {
    return tokenStore.get() !== null;
  },
};
