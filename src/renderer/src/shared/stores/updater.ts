import { create } from "zustand";
import type { UpdaterState } from "@/shared/types/agent";

type UpdaterStoreState = UpdaterState & {
  setState: (state: UpdaterState) => void;
};

export const useUpdater = create<UpdaterStoreState>((set) => ({
  status: "idle",
  version: null,
  progressPercent: null,
  error: null,
  setState: (state) => set(state),
}));
