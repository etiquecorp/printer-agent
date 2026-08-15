import { create } from "zustand";
import { persist } from "zustand/middleware";

type SettingsState = {
  apiUrl: string;
  browserPrintUrl: string;
  setApiUrl: (apiUrl: string) => void;
  setBrowserPrintUrl: (browserPrintUrl: string) => void;
};

export const useSettings = create(
  persist<SettingsState>(
    (set) => ({
      apiUrl: "http://localhost:8080",
      browserPrintUrl: "http://localhost:9100",
      setApiUrl: (apiUrl) => set({ apiUrl: apiUrl.replace(/\/+$/, "") }),
      setBrowserPrintUrl: (browserPrintUrl) =>
        set({ browserPrintUrl: browserPrintUrl.replace(/\/+$/, "") }),
    }),
    { name: "agent-settings" },
  ),
);
