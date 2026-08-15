import { create } from "zustand";
import { persist } from "zustand/middleware";

type DeviceState = {
  locationId: number | null;
  locationName: string | null;
  setLocation: (locationId: number, locationName: string) => void;
  clearLocation: () => void;
};

export const useDevice = create(
  persist<DeviceState>(
    (set) => ({
      locationId: null,
      locationName: null,
      setLocation: (locationId, locationName) =>
        set({ locationId, locationName }),
      clearLocation: () => set({ locationId: null, locationName: null }),
    }),
    { name: "agent-device" },
  ),
);
