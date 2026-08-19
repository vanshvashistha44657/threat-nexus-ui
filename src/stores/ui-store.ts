import { create } from "zustand";

interface UiState {
  globalSearch: string;
  setGlobalSearch: (value: string) => void;
  density: "comfortable" | "compact";
  setDensity: (d: "comfortable" | "compact") => void;
  accent: "cyan" | "azure" | "emerald";
  setAccent: (a: "cyan" | "azure" | "emerald") => void;
}

export const useUiStore = create<UiState>((set) => ({
  globalSearch: "",
  setGlobalSearch: (globalSearch) => set({ globalSearch }),
  density: "comfortable",
  setDensity: (density) => set({ density }),
  accent: "cyan",
  setAccent: (accent) => set({ accent }),
}));
