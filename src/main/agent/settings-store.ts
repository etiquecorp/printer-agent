import { app } from "electron";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

export interface AgentSettings {
  apiUrl: string;
  browserPrintUrl: string;
}

const DEFAULTS: AgentSettings = {
  apiUrl: "http://localhost:8080",
  browserPrintUrl: "http://localhost:9100",
};

const settingsFilePath = (): string =>
  join(app.getPath("userData"), "agent-settings.json");

function readSettings(): AgentSettings {
  const path = settingsFilePath();
  if (!existsSync(path)) return DEFAULTS;

  try {
    return { ...DEFAULTS, ...JSON.parse(readFileSync(path, "utf-8")) };
  } catch {
    return DEFAULTS;
  }
}

export const settingsStore = {
  get(): AgentSettings {
    return readSettings();
  },

  update(settings: Partial<AgentSettings>): AgentSettings {
    const current = readSettings();
    const next: AgentSettings = {
      apiUrl: settings.apiUrl
        ? settings.apiUrl.replace(/\/+$/, "")
        : current.apiUrl,
      browserPrintUrl: settings.browserPrintUrl
        ? settings.browserPrintUrl.replace(/\/+$/, "")
        : current.browserPrintUrl,
    };
    writeFileSync(settingsFilePath(), JSON.stringify(next));
    return next;
  },
};
