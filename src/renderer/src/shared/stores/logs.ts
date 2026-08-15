import { create } from "zustand";
import type { LogEntry } from "@/shared/types/agent";

type LogsState = {
  entries: LogEntry[];
  setEntries: (entries: LogEntry[]) => void;
  appendEntry: (entry: LogEntry) => void;
  clear: () => void;
};

export const useLogs = create<LogsState>((set) => ({
  entries: [],
  setEntries: (entries) => set({ entries }),
  appendEntry: (entry) =>
    set((state) => ({ entries: [...state.entries, entry] })),
  clear: () => set({ entries: [] }),
}));
