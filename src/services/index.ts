/**
 * SentinelOps service layer — the single boundary between the UI and data.
 *
 * Every page/hook consumes `services.*`. Each method tries the real FastAPI
 * endpoint first (when VITE_API_BASE_URL is set) and otherwise resolves the
 * seeded demo dataset. Swapping demo → FastAPI requires no page changes.
 */
import { apiFetch, ApiError, IS_LIVE_BACKEND } from "./api-client";
import { getDemoDataset, mutateDataset } from "./demo-data";
import { exportReport, type ExportFormat } from "./report-export";
import type {
  ActiveSession,
  AdminStats,
  AlertEvent,
  AlertStatus,
  Asset,
  AuditLog,
  DashboardMetrics,
  DetectionRule,
  HuntResult,
  Incident,
  InvestigationCase,
  Ioc,
  NotificationItem,
  Paginated,
  ReportItem,
  Role,
  SavedHunt,
  Session,
  Severity,
  ThreatActor,
  ThreatFeed,
  User,
} from "./types";

export * from "./types";
export { exportReport, type ExportFormat, type ExportResult } from "./report-export";
export { IS_LIVE_BACKEND, API_BASE_URL, ApiError } from "./api-client";

/** Simulated network latency so loading/skeleton states are exercised. */
const LATENCY = 220;

function demo<T>(value: T | (() => T), ms = LATENCY): Promise<T> {
  return new Promise((resolve) =>
    setTimeout(() => resolve(typeof value === "function" ? (value as () => T)() : value), ms),
  );
}

/**
 * Data-source mode, observable by the UI.
 *  - "live"      : VITE_API_BASE_URL is set and the FastAPI backend answers.
 *  - "degraded"  : a backend is configured but unreachable / not implemented,
 *                  so the seeded dataset is serving this session.
 *  - "demo"      : no backend configured.
 */
export type DataMode = "live" | "degraded" | "demo";
let dataMode: DataMode = IS_LIVE_BACKEND ? "live" : "demo";
const modeListeners = new Set<(m: DataMode) => void>();

export const getDataMode = () => dataMode;
export function subscribeDataMode(fn: (m: DataMode) => void) {
  modeListeners.add(fn);
  return () => modeListeners.delete(fn);
}
function setDataMode(next: DataMode) {
  if (dataMode === next) return;
  dataMode = next;
  modeListeners.forEach((fn) => fn(next));
}

/** Statuses that mean "this endpoint cannot serve us", not "you are denied". */
const FALLBACK_STATUSES = [0, 404, 405, 501, 502, 503, 504];

/**
 * Try the live backend; fall back to the seeded dataset when it is unreachable
 * or the endpoint is not implemented yet. Authentication and authorisation
 * failures (401/403/422) always propagate — they are real answers.
 */
async function resolve<T>(path: string, fallback: () => T, init?: RequestInit): Promise<T> {
  if (!IS_LIVE_BACKEND) return demo(fallback);
  try {
    const result = await apiFetch<T>(path, init);
    setDataMode("live");
    return result;
  } catch (error) {
    const status = error instanceof ApiError ? error.status : -1;
    if (!FALLBACK_STATUSES.includes(status)) throw error;
    setDataMode("degraded");
    return demo(fallback);
  }
}

function paginate<T>(items: T[], page: number, pageSize: number): Paginated<T> {
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), total: items.length, page, pageSize };
}

/* ------------------------------------------------------------------ auth */

export interface AuthUser extends User {
  permissions: string[];
}

export interface LoginPayload {
  email: string;
  password: string;
  remember: boolean;
}

const ROLE_PERMISSIONS: Record<Role, string[]> = {
  Administrator: [
    "alerts:write",
    "incidents:write",
    "cases:write",
    "iocs:write",
    "rules:write",
    "reports:write",
    "admin:access",
    "users:manage",
    "settings:write",
  ],
  "SOC Manager": [
    "alerts:write",
    "incidents:write",
    "cases:write",
    "iocs:write",
    "rules:write",
    "reports:write",
    "settings:write",
  ],
  "SOC Analyst L2": ["alerts:write", "incidents:write", "cases:write", "iocs:write", "reports:write"],
  "SOC Analyst L1": ["alerts:write"],
};

export function permissionsFor(role: Role) {
  return ROLE_PERMISSIONS[role];
}

/**
 * The administrator identity is configuration, never a hard-coded credential.
 * Only the e-mail is public; no password is stored, displayed or shipped to the
 * browser. A real deployment authenticates against the FastAPI /auth/login
 * endpoint which verifies an argon2/bcrypt hash server-side.
 */
export const ADMIN_EMAIL: string =
  (import.meta.env["VITE_ADMIN_EMAIL"] as string | undefined) ?? "vanshvashistha44657@gmail.com";

const auth = {
  async login({ email, password }: LoginPayload): Promise<{ user: AuthUser; token: string }> {
    if (IS_LIVE_BACKEND) {
      const res = await apiFetch<{ access_token: string; user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username: email, password }),
      });
      return {
        token: res.access_token,
        user: { ...res.user, permissions: permissionsFor(res.user.role) },
      };
    }
    // DEMO MODE: credentials are never validated client-side against a stored
    // secret. Any known account with a non-trivial password is accepted so the
    // submission build is demonstrable without leaking a real password.
    const data = getDemoDataset();
    const known = data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    await demo(null, 500);
    if (!known) throw new ApiError(401, "No SentinelOps account exists for that e-mail address.");
    if (password.trim().length < 6) throw new ApiError(401, "Invalid e-mail address or password.");
    if (known.status === "pending") throw new ApiError(403, "PENDING_APPROVAL");
    if (known.status === "rejected") throw new ApiError(403, "Your access request was rejected.");
    if (known.status === "disabled") throw new ApiError(403, "This account has been disabled.");
    return {
      token: `demo.${btoa(known.id)}.session`,
      user: { ...known, lastLogin: new Date().toISOString(), permissions: permissionsFor(known.role) },
    };
  },

  async register(input: { name: string; email: string; password: string }): Promise<User> {
    if (IS_LIVE_BACKEND) {
      return apiFetch<User>("/auth/register", { method: "POST", body: JSON.stringify(input) });
    }
    const created: User = {
      id: `usr-${Math.floor(1000 + Date.now() % 9000)}`,
      name: input.name,
      email: input.email,
      role: "SOC Analyst L1",
      status: "pending",
      lastLogin: null,
      createdAt: new Date().toISOString(),
      mfaEnabled: false,
    };
    mutateDataset((d) => {
      if (!d.users.some((u) => u.email === created.email)) d.users.unshift(created);
    });
    return demo(created, 550);
  },

  async requestPasswordReset(email: string) {
    return resolve<{ ok: true }>(
      "/auth/forgot-password",
      () => ({ ok: true }),
      { method: "POST", body: JSON.stringify({ email }) },
    );
  },

  async changePassword(input: { current: string; next: string }) {
    return resolve<{ ok: true }>("/auth/change-password", () => ({ ok: true }), {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async sessions(): Promise<Session[]> {
    return resolve("/auth/sessions", () => getDemoDataset().sessions);
  },

  /**
   * Session heartbeat. The backend refreshes `last_activity` for the bearer
   * token, which is what the Admin Portal's active-user view reads.
   * Endpoint: POST /auth/heartbeat
   */
  async heartbeat(): Promise<void> {
    if (!IS_LIVE_BACKEND) return;
    try {
      await apiFetch<{ ok: true }>("/auth/heartbeat", { method: "POST" });
    } catch {
      /* heartbeat is best-effort; connectivity errors surface elsewhere */
    }
  },

  /** Terminates the caller's own session server-side. POST /auth/logout */
  async logout(): Promise<void> {
    if (!IS_LIVE_BACKEND) return;
    try {
      await apiFetch<{ ok: true }>("/auth/logout", { method: "POST" });
    } catch {
      /* the local session is cleared regardless */
    }
  },

  async revokeSession(id: string) {
    return resolve<{ ok: true }>(`/auth/sessions/${id}`, () => {
      mutateDataset((d) => {
        d.sessions = d.sessions.filter((s) => s.id !== id);
      });
      return { ok: true };
    }, { method: "DELETE" });
  },
};


/* ------------------------------------------------------------- dashboard */

const dashboard = {
  metrics(): Promise<DashboardMetrics> {
    return resolve("/dashboard/metrics", () => getDemoDataset().metrics);
  },
  liveFeed(limit = 12): Promise<AlertEvent[]> {
    return resolve(`/dashboard/feed?limit=${limit}`, () =>
      [...getDemoDataset().alerts]
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
        .slice(0, limit),
    );
  },
  systemHealth(): Promise<AdminStats["services"]> {
    return resolve("/system/health", () => getDemoDataset().adminStats.services);
  },
};

/* ---------------------------------------------------------------- alerts */

export interface AlertFilters {
  search?: string;
  severity?: Severity[];
  status?: AlertStatus[];
  mitre?: string;
  host?: string;
  sourceIp?: string;
  hours?: number;
  page?: number;
  pageSize?: number;
}

const alerts = {
  list(filters: AlertFilters = {}): Promise<Paginated<AlertEvent>> {
    const qs = new URLSearchParams(
      Object.entries(filters).flatMap(([k, v]) =>
        v === undefined || v === "" || (Array.isArray(v) && v.length === 0) ? [] : [[k, String(v)]],
      ),
    ).toString();
    return resolve(`/alerts?${qs}`, () => {
      const { page = 1, pageSize = 15 } = filters;
      const now = Date.now();
      const items = getDemoDataset()
        .alerts.filter((a) => {
          if (filters.severity?.length && !filters.severity.includes(a.severity)) return false;
          if (filters.status?.length && !filters.status.includes(a.status)) return false;
          if (filters.mitre && a.mitreTechnique !== filters.mitre) return false;
          if (filters.host && a.host !== filters.host) return false;
          if (filters.sourceIp && !a.sourceIp.includes(filters.sourceIp)) return false;
          if (filters.hours && now - new Date(a.timestamp).getTime() > filters.hours * 3600_000)
            return false;
          if (filters.search) {
            const q = filters.search.toLowerCase();
            const hay = `${a.id} ${a.rule} ${a.host} ${a.sourceIp} ${a.destinationIp} ${a.user} ${a.mitreTechnique} ${a.assignee ?? ""}`.toLowerCase();
            if (!hay.includes(q)) return false;
          }
          return true;
        })
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      return paginate(items, page, pageSize);
    });
  },
  get(id: string): Promise<AlertEvent> {
    return resolve(`/alerts/${id}`, () => {
      const found = getDemoDataset().alerts.find((a) => a.id === id);
      if (!found) throw new ApiError(404, "Alert not found.");
      return found;
    });
  },
  update(id: string, patch: Partial<AlertEvent>): Promise<AlertEvent> {
    return resolve(
      `/alerts/${id}`,
      () => {
        let updated: AlertEvent | undefined;
        mutateDataset((d) => {
          const a = d.alerts.find((x) => x.id === id);
          if (a) {
            Object.assign(a, patch);
            a.timeline = [
              {
                id: `tl-${Date.now()}`,
                at: new Date().toISOString(),
                actor: "Current analyst",
                action: patch.status ? `Status set to ${patch.status}` : "Alert updated",
                detail: patch.assignee ? `Assigned to ${patch.assignee}` : undefined,
              },
              ...a.timeline,
            ];
            updated = a;
          }
        });
        if (!updated) throw new ApiError(404, "Alert not found.");
        return updated;
      },
      { method: "PATCH", body: JSON.stringify(patch) },
    );
  },
  addNote(id: string, body: string) {
    return resolve<AlertEvent>(
      `/alerts/${id}/notes`,
      () => {
        let updated: AlertEvent | undefined;
        mutateDataset((d) => {
          const a = d.alerts.find((x) => x.id === id);
          if (a) {
            a.notes = [
              { id: `n-${Date.now()}`, author: "Current analyst", body, createdAt: new Date().toISOString() },
              ...a.notes,
            ];
            updated = a;
          }
        });
        if (!updated) throw new ApiError(404, "Alert not found.");
        return updated;
      },
      { method: "POST", body: JSON.stringify({ body }) },
    );
  },
};

/* ------------------------------------------------------------- incidents */

const incidents = {
  list(search = ""): Promise<Incident[]> {
    return resolve(`/incidents?search=${encodeURIComponent(search)}`, () =>
      getDemoDataset().incidents.filter((i) =>
        `${i.id} ${i.title} ${i.assignee ?? ""} ${i.status}`.toLowerCase().includes(search.toLowerCase()),
      ),
    );
  },
  get(id: string): Promise<Incident> {
    return resolve(`/incidents/${id}`, () => {
      const found = getDemoDataset().incidents.find((i) => i.id === id);
      if (!found) throw new ApiError(404, "Incident not found.");
      return found;
    });
  },
  update(id: string, patch: Partial<Incident>): Promise<Incident> {
    return resolve(
      `/incidents/${id}`,
      () => {
        let updated: Incident | undefined;
        mutateDataset((d) => {
          const i = d.incidents.find((x) => x.id === id);
          if (i) {
            Object.assign(i, patch, { updatedAt: new Date().toISOString() });
            i.timeline = [
              {
                id: `tl-${Date.now()}`,
                at: new Date().toISOString(),
                actor: "Current analyst",
                action: patch.status ? `Status → ${patch.status}` : "Incident updated",
              },
              ...i.timeline,
            ];
            updated = i;
          }
        });
        if (!updated) throw new ApiError(404, "Incident not found.");
        return updated;
      },
      { method: "PATCH", body: JSON.stringify(patch) },
    );
  },
  createFromAlert(alertId: string): Promise<Incident> {
    return resolve(
      "/incidents",
      () => {
        const d = getDemoDataset();
        const alert = d.alerts.find((a) => a.id === alertId);
        if (!alert) throw new ApiError(404, "Alert not found.");
        const incident: Incident = {
          id: `INC-${2400 + d.incidents.length}`,
          title: `Escalated: ${alert.rule}`,
          severity: alert.severity,
          priority: alert.severity === "critical" ? "P1" : alert.severity === "high" ? "P2" : "P3",
          status: "open",
          assignee: alert.assignee,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          affectedAssets: [alert.host],
          alertIds: [alert.id],
          caseIds: [],
          mitre: [alert.mitreTechnique],
          summary: alert.description,
          resolution: null,
          timeline: [
            {
              id: `tl-${Date.now()}`,
              at: new Date().toISOString(),
              actor: "Current analyst",
              action: "Incident created from alert",
              detail: alert.id,
            },
          ],
          notes: [],
          evidence: [],
        };
        mutateDataset((data) => {
          data.incidents.unshift(incident);
          const a = data.alerts.find((x) => x.id === alertId);
          if (a) {
            a.relatedIncidentId = incident.id;
            a.status = "escalated";
          }
        });
        return incident;
      },
      { method: "POST", body: JSON.stringify({ alert_id: alertId }) },
    );
  },
};

/* ----------------------------------------------------------------- cases */

const cases = {
  list(search = ""): Promise<InvestigationCase[]> {
    return resolve(`/cases?search=${encodeURIComponent(search)}`, () =>
      getDemoDataset().cases.filter((c) =>
        `${c.id} ${c.title} ${c.owner} ${c.status}`.toLowerCase().includes(search.toLowerCase()),
      ),
    );
  },
  get(id: string): Promise<InvestigationCase> {
    return resolve(`/cases/${id}`, () => {
      const found = getDemoDataset().cases.find((c) => c.id === id);
      if (!found) throw new ApiError(404, "Case not found.");
      return found;
    });
  },
  create(input: { title: string; severity: Severity; owner: string; summary: string }) {
    return resolve<InvestigationCase>(
      "/cases",
      () => {
        const d = getDemoDataset();
        const created: InvestigationCase = {
          id: `CASE-${910 + d.cases.length}`,
          title: input.title,
          status: "open",
          severity: input.severity,
          owner: input.owner,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          summary: input.summary,
          tasks: [],
          incidentIds: [],
          alertIds: [],
          evidence: [],
          notes: [],
          timeline: [
            { id: `tl-${Date.now()}`, at: new Date().toISOString(), actor: "Current analyst", action: "Case opened" },
          ],
          attachments: [],
        };
        mutateDataset((data) => data.cases.unshift(created));
        return created;
      },
      { method: "POST", body: JSON.stringify(input) },
    );
  },
  update(id: string, patch: Partial<InvestigationCase>) {
    return resolve<InvestigationCase>(
      `/cases/${id}`,
      () => {
        let updated: InvestigationCase | undefined;
        mutateDataset((d) => {
          const c = d.cases.find((x) => x.id === id);
          if (c) {
            Object.assign(c, patch, { updatedAt: new Date().toISOString() });
            updated = c;
          }
        });
        if (!updated) throw new ApiError(404, "Case not found.");
        return updated;
      },
      { method: "PATCH", body: JSON.stringify(patch) },
    );
  },
  toggleTask(caseId: string, taskId: string) {
    return resolve<InvestigationCase>(
      `/cases/${caseId}/tasks/${taskId}`,
      () => {
        let updated: InvestigationCase | undefined;
        mutateDataset((d) => {
          const c = d.cases.find((x) => x.id === caseId);
          const t = c?.tasks.find((x) => x.id === taskId);
          if (c && t) {
            t.done = !t.done;
            c.updatedAt = new Date().toISOString();
            updated = c;
          }
        });
        if (!updated) throw new ApiError(404, "Case not found.");
        return updated;
      },
      { method: "PATCH" },
    );
  },
};

/* ------------------------------------------------------------------ IOCs */

const iocs = {
  list(search = ""): Promise<Ioc[]> {
    return resolve(`/iocs?search=${encodeURIComponent(search)}`, () =>
      getDemoDataset().iocs.filter((i) =>
        `${i.id} ${i.value} ${i.type} ${i.source} ${i.tags.join(" ")}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    );
  },
  get(id: string): Promise<Ioc> {
    return resolve(`/iocs/${id}`, () => {
      const found = getDemoDataset().iocs.find((i) => i.id === id);
      if (!found) throw new ApiError(404, "Indicator not found.");
      return found;
    });
  },
  create(input: { type: Ioc["type"]; value: string; source: string; tags: string[]; riskScore: number }) {
    return resolve<Ioc>(
      "/iocs",
      () => {
        const d = getDemoDataset();
        const created: Ioc = {
          id: `IOC-${7100 + d.iocs.length}`,
          ...input,
          severity: input.riskScore > 85 ? "critical" : input.riskScore > 65 ? "high" : input.riskScore > 45 ? "medium" : "low",
          firstSeen: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
          matches: 0,
          relatedAlertIds: [],
          relatedIncidentIds: [],
          description: "Manually created indicator pending enrichment.",
        };
        mutateDataset((data) => data.iocs.unshift(created));
        return created;
      },
      { method: "POST", body: JSON.stringify(input) },
    );
  },
  remove(id: string) {
    return resolve<{ ok: true }>(
      `/iocs/${id}`,
      () => {
        mutateDataset((d) => {
          d.iocs = d.iocs.filter((i) => i.id !== id);
        });
        return { ok: true };
      },
      { method: "DELETE" },
    );
  },
};

/* ---------------------------------------------------- threat intelligence */

const intel = {
  feeds(): Promise<ThreatFeed[]> {
    return resolve("/intel/feeds", () => getDemoDataset().feeds);
  },
  toggleFeed(id: string, enabled: boolean) {
    return resolve<ThreatFeed[]>(
      `/intel/feeds/${id}`,
      () => {
        mutateDataset((d) => {
          const f = d.feeds.find((x) => x.id === id);
          if (f) f.enabled = enabled;
        });
        return getDemoDataset().feeds;
      },
      { method: "PATCH", body: JSON.stringify({ enabled }) },
    );
  },
  actors(): Promise<ThreatActor[]> {
    return resolve("/intel/actors", () => getDemoDataset().actors);
  },
  recentMatches(): Promise<Ioc[]> {
    return resolve("/intel/matches", () =>
      [...getDemoDataset().iocs].sort((a, b) => b.matches - a.matches).slice(0, 10),
    );
  },
};

/* --------------------------------------------------------------- hunting */

export interface HuntQuery {
  field: string;
  operator: string;
  value: string;
  hours: number;
}

const hunting = {
  saved(): Promise<SavedHunt[]> {
    return resolve("/hunting/saved", () => getDemoDataset().hunts);
  },
  run(query: HuntQuery): Promise<HuntResult[]> {
    return resolve(
      "/hunting/search",
      () => {
        const v = query.value.trim().toLowerCase();
        const now = Date.now();
        return getDemoDataset().huntResults.filter((r) => {
          if (now - new Date(r.timestamp).getTime() > query.hours * 3600_000) return false;
          if (!v) return true;
          const hay = `${r.host} ${r.user} ${r.process} ${r.commandLine} ${r.sourceIp} ${r.destinationIp} ${r.mitre}`.toLowerCase();
          return query.operator === "not_contains" ? !hay.includes(v) : hay.includes(v);
        });
      },
      { method: "POST", body: JSON.stringify(query) },
    );
  },
  save(input: { name: string; query: string }) {
    return resolve<SavedHunt>(
      "/hunting/saved",
      () => {
        const created: SavedHunt = {
          id: `hunt-${Date.now()}`,
          name: input.name,
          query: input.query,
          createdBy: "Current analyst",
          createdAt: new Date().toISOString(),
          lastRun: new Date().toISOString(),
          results: 0,
        };
        mutateDataset((d) => d.hunts.unshift(created));
        return created;
      },
      { method: "POST", body: JSON.stringify(input) },
    );
  },
};

/* ---------------------------------------------------------------- assets */

const assets = {
  list(search = ""): Promise<Asset[]> {
    return resolve(`/assets?search=${encodeURIComponent(search)}`, () =>
      getDemoDataset().assets.filter((a) =>
        `${a.id} ${a.name} ${a.os} ${a.owner} ${a.ip} ${a.type}`.toLowerCase().includes(search.toLowerCase()),
      ),
    );
  },
  get(id: string): Promise<Asset> {
    return resolve(`/assets/${id}`, () => {
      const found = getDemoDataset().assets.find((a) => a.id === id);
      if (!found) throw new ApiError(404, "Asset not found.");
      return found;
    });
  },
};

/* -------------------------------------------------------- detection rules */

const rules = {
  list(search = ""): Promise<DetectionRule[]> {
    return resolve(`/rules?search=${encodeURIComponent(search)}`, () =>
      getDemoDataset().rules.filter((r) =>
        `${r.id} ${r.name} ${r.mitre} ${r.source}`.toLowerCase().includes(search.toLowerCase()),
      ),
    );
  },
  toggle(id: string, enabled: boolean) {
    return resolve<DetectionRule[]>(
      `/rules/${id}`,
      () => {
        mutateDataset((d) => {
          const r = d.rules.find((x) => x.id === id);
          if (r) r.enabled = enabled;
        });
        return getDemoDataset().rules;
      },
      { method: "PATCH", body: JSON.stringify({ enabled }) },
    );
  },
  test(id: string) {
    return resolve<{ matches: number; sample: HuntResult[] }>(
      `/rules/${id}/test`,
      () => {
        const sample = getDemoDataset().huntResults.slice(0, 5);
        return { matches: sample.length, sample };
      },
      { method: "POST" },
    );
  },
};

/* --------------------------------------------------------------- reports */

const reports = {
  list(): Promise<ReportItem[]> {
    return resolve("/reports", () => getDemoDataset().reports);
  },
  get(id: string): Promise<ReportItem> {
    return resolve(`/reports/${id}`, () => {
      const found = getDemoDataset().reports.find((r) => r.id === id);
      if (!found) throw new ApiError(404, "Report not found.");
      return found;
    });
  },
  /**
   * Downloads a report. Tries GET /reports/{id}/export?format=… on the FastAPI
   * backend first and renders in-browser from the same record if that endpoint
   * is not implemented. See ./report-export.ts.
   */
  export(report: ReportItem, format: ExportFormat) {
    return exportReport(report, format);
  },
  generate(type: ReportItem["type"]) {
    return resolve<ReportItem>(
      "/reports",
      () => {
        const template = getDemoDataset().reports.find((r) => r.type === type);
        const created: ReportItem = {
          ...(template ?? getDemoDataset().reports[0]!),
          id: `rpt-${Date.now()}`,
          generatedAt: new Date().toISOString(),
          generatedBy: "Current analyst",
          status: "ready",
        };
        mutateDataset((d) => d.reports.unshift(created));
        return created;
      },
      { method: "POST", body: JSON.stringify({ type }) },
    );
  },
};

/* --------------------------------------------------------- notifications */

const notifications = {
  list(): Promise<NotificationItem[]> {
    return resolve("/notifications", () => getDemoDataset().notifications);
  },
  markRead(id: string) {
    return resolve<NotificationItem[]>(
      `/notifications/${id}/read`,
      () => {
        mutateDataset((d) => {
          const n = d.notifications.find((x) => x.id === id);
          if (n) n.read = true;
        });
        return getDemoDataset().notifications;
      },
      { method: "POST" },
    );
  },
  markAllRead() {
    return resolve<NotificationItem[]>(
      "/notifications/read-all",
      () => {
        mutateDataset((d) => d.notifications.forEach((n) => (n.read = true)));
        return getDemoDataset().notifications;
      },
      { method: "POST" },
    );
  },
};

/* ----------------------------------------------------------------- admin */

const admin = {
  stats(): Promise<AdminStats> {
    return resolve("/admin/stats", () => {
      const d = getDemoDataset();
      return {
        ...d.adminStats,
        totalUsers: d.users.length,
        activeUsers: d.users.filter((u) => u.status === "active").length,
        pendingApprovals: d.users.filter((u) => u.status === "pending").length,
      };
    });
  },
  users(): Promise<User[]> {
    return resolve("/admin/users", () => getDemoDataset().users);
  },
  updateUser(id: string, patch: Partial<User>) {
    return resolve<User[]>(
      `/admin/users/${id}`,
      () => {
        mutateDataset((d) => {
          const u = d.users.find((x) => x.id === id);
          if (u) Object.assign(u, patch);
          d.auditLogs.unshift({
            id: `aud-${Date.now()}`,
            user: ADMIN_EMAIL,
            action: patch.status ? `user.${patch.status}` : "user.update",
            resource: `users/${id}`,
            timestamp: new Date().toISOString(),
            ip: "10.4.2.19",
            previousValue: null,
            newValue: JSON.stringify(patch),
            result: "success",
          });
        });
        return getDemoDataset().users;
      },
      { method: "PATCH", body: JSON.stringify(patch) },
    );
  },
  auditLogs(search = ""): Promise<AuditLog[]> {
    return resolve(`/admin/audit-logs?search=${encodeURIComponent(search)}`, () =>
      getDemoDataset().auditLogs.filter((l) =>
        `${l.user} ${l.action} ${l.resource} ${l.ip}`.toLowerCase().includes(search.toLowerCase()),
      ),
    );
  },
  sessions(): Promise<Session[]> {
    return resolve("/admin/sessions", () => getDemoDataset().sessions);
  },

  /**
   * Live authenticated sessions. GET /admin/sessions must return one row per
   * *session*, not per login attempt, including last_activity so the UI can
   * derive online / idle / offline.
   */
  activeSessions(): Promise<ActiveSession[]> {
    return resolve("/admin/sessions", () => {
      const d = getDemoDataset();
      const byUser = new Map(d.users.map((u) => [u.id, u]));
      return d.sessions.map<ActiveSession>((s) => {
        const u = byUser.get(s.userId) ?? d.users[0]!;
        return {
          id: s.id,
          userId: s.userId,
          name: u.name,
          email: u.email,
          role: u.role,
          loginAt: s.startedAt,
          lastActivity: s.lastActive,
          ip: s.ip,
          device: s.device,
          location: s.location,
          current: s.current,
        };
      });
    });
  },

  /** Administrative session revocation. DELETE /admin/sessions/{id} */
  revokeSession(id: string) {
    return resolve<{ ok: true }>(
      `/admin/sessions/${id}`,
      () => {
        mutateDataset((d) => {
          const s = d.sessions.find((x) => x.id === id);
          d.sessions = d.sessions.filter((x) => x.id !== id);
          d.auditLogs.unshift({
            id: `aud-${Date.now()}`,
            user: ADMIN_EMAIL,
            action: "session.revoke",
            resource: `sessions/${id}`,
            timestamp: new Date().toISOString(),
            ip: s?.ip ?? "-",
            previousValue: null,
            newValue: null,
            result: "success",
          });
        });
        return { ok: true };
      },
      { method: "DELETE" },
    );
  },
};

export const services = {
  auth,
  dashboard,
  alerts,
  incidents,
  cases,
  iocs,
  intel,
  hunting,
  assets,
  rules,
  reports,
  notifications,
  admin,
};

export type SentinelOpsServices = typeof services;
