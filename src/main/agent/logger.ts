export type LogLevel = "info" | "warn" | "error";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
}

const MAX_ENTRIES = 500;

let entries: LogEntry[] = [];
let listener: ((entry: LogEntry) => void) | null = null;

function record(level: LogLevel, message: string): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
  };
  entries.push(entry);
  if (entries.length > MAX_ENTRIES) {
    entries = entries.slice(entries.length - MAX_ENTRIES);
  }

  const consoleFn =
    level === "error"
      ? console.error
      : level === "warn"
        ? console.warn
        : console.log;
  consoleFn(`[agent] ${message}`);

  listener?.(entry);
}

export const agentLogger = {
  info: (message: string): void => record("info", message),
  warn: (message: string): void => record("warn", message),
  error: (message: string): void => record("error", message),

  getAll(): LogEntry[] {
    return entries;
  },

  clear(): void {
    entries = [];
  },

  setListener(cb: ((entry: LogEntry) => void) | null): void {
    listener = cb;
  },
};
