/**
 * SentinelOps RBAC map.
 *
 * This is the single source of truth for *client-side* module visibility and
 * route authorisation. It intentionally mirrors the role matrix enforced by the
 * FastAPI backend — the frontend map is a usability layer only. Every protected
 * FastAPI endpoint must independently return 403 for a role that is not listed
 * here; the UI never grants access on its own.
 */
import type { Role } from "@/services";

export type ModuleKey =
  | "dashboard"
  | "alerts"
  | "incidents"
  | "cases"
  | "threat-hunting"
  | "detection-rules"
  | "ioc"
  | "threat-intelligence"
  | "assets"
  | "reports"
  | "notifications"
  | "admin"
  | "settings"
  | "profile";

/** Modules every authenticated principal may reach regardless of role. */
const ALWAYS: ModuleKey[] = ["profile"];

export const ROLE_MODULES: Record<Role, ModuleKey[]> = {
  Administrator: [
    "dashboard",
    "alerts",
    "incidents",
    "cases",
    "threat-hunting",
    "detection-rules",
    "ioc",
    "threat-intelligence",
    "assets",
    "reports",
    "notifications",
    "admin",
    "settings",
    "profile",
  ],
  "SOC Manager": [
    "dashboard",
    "alerts",
    "incidents",
    "cases",
    "threat-hunting",
    "detection-rules",
    "ioc",
    "threat-intelligence",
    "assets",
    "reports",
    "notifications",
    ...ALWAYS,
  ],
  "SOC Analyst L2": [
    "dashboard",
    "alerts",
    "incidents",
    "cases",
    "threat-hunting",
    "ioc",
    "threat-intelligence",
    "assets",
    "notifications",
    ...ALWAYS,
  ],
  "SOC Analyst L1": ["dashboard", "alerts", "incidents", "cases", "notifications", ...ALWAYS],
};

/** Maps a router pathname to the module that guards it. */
export function moduleForPath(pathname: string): ModuleKey | null {
  const seg = pathname.replace(/^\/+/, "").split("/")[0] ?? "";
  const known: ModuleKey[] = [
    "dashboard",
    "alerts",
    "incidents",
    "cases",
    "threat-hunting",
    "detection-rules",
    "ioc",
    "threat-intelligence",
    "assets",
    "reports",
    "notifications",
    "admin",
    "settings",
    "profile",
  ];
  return known.includes(seg as ModuleKey) ? (seg as ModuleKey) : null;
}

export function canAccessModule(role: Role | undefined, module: ModuleKey | null): boolean {
  if (!module) return true;
  if (!role) return false;
  return ROLE_MODULES[role].includes(module);
}
