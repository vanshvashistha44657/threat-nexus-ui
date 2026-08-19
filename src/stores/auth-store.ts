import { create } from "zustand";
import { persist } from "zustand/middleware";
import { permissionsFor, services, type AuthUser, type Role } from "@/services";
import { setAccessToken } from "@/services/api-client";

interface AuthState {
  user: AuthUser | null;
  status: "unauthenticated" | "authenticated" | "expired";
  hydrated: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<AuthUser>;
  logout: () => void;
  expire: () => void;
  setRole: (role: Role) => void;
  has: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      status: "unauthenticated",
      hydrated: false,
      async login(email, password, remember) {
        const { user, token } = await services.auth.login({ email, password, remember });
        setAccessToken(token);
        set({ user, status: "authenticated" });
        return user;
      },
      logout() {
        setAccessToken(null);
        set({ user: null, status: "unauthenticated" });
      },
      expire() {
        setAccessToken(null);
        set({ user: null, status: "expired" });
      },
      setRole(role) {
        const user = get().user;
        if (!user) return;
        set({ user: { ...user, role, permissions: permissionsFor(role) } });
      },
      has(permission) {
        return get().user?.permissions.includes(permission) ?? false;
      },
    }),
    {
      name: "sentinelops.auth",
      partialize: (s) => ({ user: s.user, status: s.status }),
      onRehydrateStorage: () => () => {
        markHydrated();
      },
    },
  ),
);

function markHydrated() {
  if (!useAuthStore.getState().hydrated) useAuthStore.setState({ hydrated: true });
}

// Guarantee the flag flips on the client even if rehydration already finished
// (or failed) before the subscription above was registered.
if (typeof window !== "undefined") {
  if (useAuthStore.persist.hasHydrated()) markHydrated();
  useAuthStore.persist.onFinishHydration(() => markHydrated());
  void Promise.resolve().then(markHydrated);
}

export function useCurrentUser() {
  return useAuthStore((s) => s.user);
}

