import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Session } from "@/shared/types/auth";

type AuthState = {
  session: Session | null;
  currentTenantId: string | null;
  isLoggedIn: boolean;
  setLoggedIn: (session: Session) => void;
  setTenant: (tenantId: string) => void;
  logout: () => void;
};

export const useAuth = create(
  persist<AuthState>(
    (set) => ({
      session: null,
      currentTenantId: null,
      isLoggedIn: false,
      setLoggedIn: (session) =>
        set({
          session,
          isLoggedIn: true,
          currentTenantId: Object.keys(session.tenants)[0] ?? null,
        }),
      setTenant: (tenantId) => set({ currentTenantId: tenantId }),
      logout: () =>
        set({ session: null, isLoggedIn: false, currentTenantId: null }),
    }),
    { name: "agent-auth" },
  ),
);
