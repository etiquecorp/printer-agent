import { app } from "electron";
import { autoUpdater } from "electron-updater";

import { agentLogger } from "./agent/logger";

export type UpdaterStatus =
  | "idle"
  | "checking"
  | "not-available"
  | "downloading"
  | "downloaded"
  | "error";

export interface UpdaterState {
  status: UpdaterStatus;
  version: string | null;
  progressPercent: number | null;
  error: string | null;
}

// A printer-agent station stays open for weeks between reboots, so it can't rely on
// relaunches alone to pick up new versions — it has to check for itself periodically.
const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000;
const FIRST_CHECK_DELAY_MS = 10_000;

let state: UpdaterState = {
  status: "idle",
  version: null,
  progressPercent: null,
  error: null,
};
let listener: ((state: UpdaterState) => void) | null = null;
let checkTimer: ReturnType<typeof setInterval> | null = null;

function setState(partial: Partial<UpdaterState>): void {
  state = { ...state, ...partial };
  listener?.(state);
}

function checkForUpdates(): void {
  autoUpdater.checkForUpdates().catch((error: Error) => {
    agentLogger.error(`Falha ao verificar atualizações: ${error.message}`);
    setState({ status: "error", error: error.message });
  });
}

export const appUpdater = {
  init(): void {
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on("checking-for-update", () => {
      agentLogger.info(
        `Verificando atualizações (versão atual: v${app.getVersion()})...`,
      );
      setState({ status: "checking", error: null });
    });

    autoUpdater.on("update-available", (info) => {
      agentLogger.info(
        `Atualização disponível: v${app.getVersion()} → v${info.version} ` +
          `(publicada em ${info.releaseDate}). Baixando...`,
      );
      setState({
        status: "downloading",
        version: info.version,
        progressPercent: 0,
      });
    });

    autoUpdater.on("update-not-available", (info) => {
      agentLogger.info(
        `Nenhuma atualização disponível — já na versão mais recente (v${info.version}).`,
      );
      setState({ status: "not-available" });
    });

    autoUpdater.on("download-progress", (progress) => {
      agentLogger.info(
        `Baixando atualização: ${Math.round(progress.percent)}% ` +
          `(${(progress.transferred / 1_000_000).toFixed(1)}/${(progress.total / 1_000_000).toFixed(1)} MB, ` +
          `${(progress.bytesPerSecond / 1_000).toFixed(0)} KB/s).`,
      );
      setState({
        status: "downloading",
        progressPercent: Math.round(progress.percent),
      });
    });

    autoUpdater.on("update-downloaded", (info) => {
      agentLogger.info(
        `Atualização v${info.version} baixada (${info.files.map((f) => f.url).join(", ")}) ` +
          "— será aplicada ao reiniciar.",
      );
      setState({
        status: "downloaded",
        version: info.version,
        progressPercent: 100,
      });
    });

    autoUpdater.on("error", (error) => {
      const cause = (error as NodeJS.ErrnoException).code;
      agentLogger.error(
        `Falha ao verificar atualizações${cause ? ` (${cause})` : ""}: ${error.message}`,
      );
      setState({ status: "error", error: error.message });
    });

    setTimeout(checkForUpdates, FIRST_CHECK_DELAY_MS);
    checkTimer = setInterval(checkForUpdates, CHECK_INTERVAL_MS);
  },

  check: checkForUpdates,

  quitAndInstall(): void {
    autoUpdater.quitAndInstall();
  },

  getState(): UpdaterState {
    return state;
  },

  setListener(cb: ((state: UpdaterState) => void) | null): void {
    listener = cb;
  },

  stop(): void {
    if (checkTimer) clearInterval(checkTimer);
    checkTimer = null;
  },
};
