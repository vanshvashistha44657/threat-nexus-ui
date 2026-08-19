import { create } from "zustand";
import { IS_LIVE_BACKEND } from "@/services";
import type { Severity } from "@/services";

export type ConnectionStatus = "connected" | "reconnecting" | "disconnected";

export interface LiveEvent {
  id: string;
  at: string;
  kind: "alert" | "incident" | "ioc" | "notification" | "intel" | "system";
  severity: Severity;
  message: string;
  detail: string;
}

interface RealtimeState {
  status: ConnectionStatus;
  events: LiveEvent[];
  eventsSeen: number;
  setStatus: (status: ConnectionStatus) => void;
  push: (event: LiveEvent) => void;
  reset: () => void;
}

export const useRealtimeStore = create<RealtimeState>((set) => ({
  status: IS_LIVE_BACKEND ? "reconnecting" : "connected",
  events: [],
  eventsSeen: 0,
  setStatus: (status) => set({ status }),
  push: (event) =>
    set((s) => ({ events: [event, ...s.events].slice(0, 60), eventsSeen: s.eventsSeen + 1 })),
  reset: () => set({ events: [], eventsSeen: 0 }),
}));
