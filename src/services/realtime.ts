/**
 * Realtime transport.
 *
 * Live mode: connects to the FastAPI WebSocket hub (VITE_API_BASE_URL) with
 * automatic reconnection. Demo mode: a clean, interval-driven simulator that
 * emits clearly-labelled DEMO events. Both use the same event shape, so the UI
 * never changes when the backend arrives.
 */
import { API_BASE_URL, IS_LIVE_BACKEND } from "./api-client";
import { getDemoDataset, mutateDataset, DEMO_CONSTANTS } from "./demo-data";
import type { LiveEvent } from "@/stores/realtime-store";
import type { Severity } from "./types";

export interface RealtimeHandlers {
  onEvent: (event: LiveEvent) => void;
  onStatus: (status: "connected" | "reconnecting" | "disconnected") => void;
}

const SEV: Severity[] = ["critical", "high", "medium", "low"];

function randomOf<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function makeDemoEvent(): LiveEvent {
  const kind = randomOf(["alert", "alert", "incident", "ioc", "notification", "intel"] as const);
  const host = randomOf(DEMO_CONSTANTS.HOSTS);
  const rule = randomOf(DEMO_CONSTANTS.RULES);
  const severity = kind === "alert" ? randomOf(SEV) : randomOf(["high", "medium", "low"] as Severity[]);
  const now = new Date().toISOString();
  const base = { id: `ev-${Date.now()}-${Math.floor(Math.random() * 999)}`, at: now, severity };

  switch (kind) {
    case "alert": {
      const id = `ALT-${48211 + getDemoDataset().alerts.length}`;
      mutateDataset((d) => {
        const template = d.alerts[Math.floor(Math.random() * d.alerts.length)]!;
        d.alerts.unshift({
          ...template,
          id,
          severity,
          status: "new",
          assignee: null,
          host,
          rule: rule[0],
          title: rule[0],
          ruleId: rule[1],
          timestamp: now,
          notes: [],
        });
        d.notifications.unshift({
          id: `ntf-${Date.now()}`,
          title: severity === "critical" ? "Critical alert triggered" : "New alert",
          body: `${rule[0]} on ${host}`,
          severity,
          category: "critical_alert",
          read: false,
          createdAt: now,
          link: "/alerts",
        });
      });
      return { ...base, kind: "alert", message: `${rule[0]}`, detail: `${id} · ${host}` };
    }
    case "incident":
      return {
        ...base,
        kind: "incident",
        message: "Incident updated by correlation engine",
        detail: `${randomOf(getDemoDataset().incidents).id} · assets re-scoped`,
      };
    case "ioc": {
      const ioc = randomOf(getDemoDataset().iocs);
      mutateDataset((d) => {
        const target = d.iocs.find((i) => i.id === ioc.id);
        if (target) {
          target.matches += 1;
          target.lastSeen = now;
        }
      });
      return { ...base, kind: "ioc", message: "IOC match observed", detail: `${ioc.type.toUpperCase()} ${ioc.value}` };
    }
    case "intel":
      return {
        ...base,
        kind: "intel",
        message: "Threat feed synchronised",
        detail: `${randomOf(getDemoDataset().feeds).name} · new indicators ingested`,
      };
    default:
      return {
        ...base,
        kind: "notification",
        message: "Analyst activity",
        detail: `${randomOf(DEMO_CONSTANTS.ANALYSTS)} updated a case`,
      };
  }
}

export function connectRealtime(handlers: RealtimeHandlers): () => void {
  if (IS_LIVE_BACKEND) {
    let socket: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let closed = false;

    const open = () => {
      handlers.onStatus("reconnecting");
      const url = API_BASE_URL.replace(/^http/, "ws") + "/ws";
      socket = new WebSocket(url);
      socket.onopen = () => handlers.onStatus("connected");
      socket.onmessage = (msg) => {
        try {
          handlers.onEvent(JSON.parse(msg.data as string) as LiveEvent);
        } catch {
          /* ignore malformed frames */
        }
      };
      socket.onclose = () => {
        if (closed) return;
        handlers.onStatus("disconnected");
        retry = setTimeout(open, 4000);
      };
      socket.onerror = () => socket?.close();
    };
    open();
    return () => {
      closed = true;
      if (retry) clearTimeout(retry);
      socket?.close();
    };
  }

  // DEMO MODE simulator
  handlers.onStatus("connected");
  const interval = setInterval(() => handlers.onEvent(makeDemoEvent()), 7000);
  const first = setTimeout(() => handlers.onEvent(makeDemoEvent()), 2500);
  return () => {
    clearInterval(interval);
    clearTimeout(first);
  };
}
