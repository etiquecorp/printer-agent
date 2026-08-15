import { create } from "zustand";
import type { AgentStatus, BrowserPrintDevice } from "@/shared/types/agent";

type AgentRuntimeState = {
  status: AgentStatus;
  printers: BrowserPrintDevice[];
  setStatus: (status: AgentStatus) => void;
  setPrinters: (printers: BrowserPrintDevice[]) => void;
};

export const useAgentRuntime = create<AgentRuntimeState>((set) => ({
  status: "idle",
  printers: [],
  setStatus: (status) => set({ status }),
  setPrinters: (printers) => set({ printers }),
}));
