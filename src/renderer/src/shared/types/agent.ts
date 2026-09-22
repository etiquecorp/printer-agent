export type AgentStatus =
  "idle" | "connecting" | "connected" | "unauthorized" | "error";

export interface BrowserPrintDevice {
  uid: string;
  name: string;
  connection: string;
  [key: string]: unknown;
}

export type LogLevel = "info" | "warn" | "error";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
}

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
