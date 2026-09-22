import { create } from "zustand";
import { persist } from "zustand/middleware";

type DeviceState = {
  deviceName: string | null;
  setDeviceName: (name: string) => void;
  clearDevice: () => void;
};

// v0 → v1: locationId/locationName foram substituídos por deviceName.
// Usuários existentes têm locationName promovido automaticamente — sem re-pareamento.
type PersistedV0 = { locationName?: string | null };

export const useDevice = create(
  persist<DeviceState>(
    (set) => ({
      deviceName: null,
      setDeviceName: (name) => set({ deviceName: name }),
      clearDevice: () => set({ deviceName: null }),
    }),
    {
      name: "agent-device",
      version: 1,
      migrate: (persisted, version) => {
        if (version === 0) {
          const old = persisted as PersistedV0;
          return { deviceName: old.locationName ?? null } as DeviceState;
        }
        return persisted as DeviceState;
      },
    },
  ),
);
