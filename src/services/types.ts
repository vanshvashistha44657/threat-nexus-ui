/**
 * SentinelOps domain types.
 * These mirror the intended FastAPI response schemas so the demo service and a
 * future `fastApiService` are interchangeable.
 */

export type Severity = "critical" | "high" | "medium" | "low" | "info";

export type Role = "Administrator" | "SOC Manager" | "SOC Analyst L2" | "SOC Analyst L1";

export type UserStatus = "active" | "pending" | "rejected" | "disabled";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  lastLogin: string | null;
  createdAt: string;
  mfaEnabled: boolean;
  avatarColor?: string | undefined;
}

export interface Session {
  id: string;
  userId: string;
  device: string;
  ip: string;
  location: string;
  startedAt: string;
  lastActive: string;
  current: boolean;
}

export type AlertStatus = "new" | "investigating" | "escalated" | "false_positive" | "closed";

export interface AlertEvent {
  id: string;
  title: string;
  rule: string;
  ruleId: string;
  severity: Severity;
  status: AlertStatus;
  sourceIp: string;
  destinationIp: string;
  host: string;
  user: string;
  mitreTechnique: string;
  mitreName: string;
  tactic: string;
  assignee: string | null;
  timestamp: string;
  description: string;
  rawEvent: Record<string, unknown>;
  relatedIncidentId: string | null;
  notes: NoteEntry[];
  timeline: TimelineEntry[];
  riskScore: number;
}

export type IncidentStatus = "open" | "investigating" | "containment" | "eradication" | "resolved";

export interface Incident {
  id: string;
  title: string;
  severity: Severity;
  priority: "P1" | "P2" | "P3" | "P4";
  status: IncidentStatus;
  assignee: string | null;
  createdAt: string;
  updatedAt: string;
  affectedAssets: string[];
  alertIds: string[];
  caseIds: string[];
  mitre: string[];
  summary: string;
  resolution: string | null;
  timeline: TimelineEntry[];
  notes: NoteEntry[];
  evidence: Evidence[];
}

export type CaseStatus = "open" | "in_progress" | "pending_review" | "closed";

export interface CaseTask {
  id: string;
  title: string;
  done: boolean;
  owner: string;
}

export interface InvestigationCase {
  id: string;
  title: string;
  status: CaseStatus;
  severity: Severity;
  owner: string;
  createdAt: string;
  updatedAt: string;
  summary: string;
  tasks: CaseTask[];
  incidentIds: string[];
  alertIds: string[];
  evidence: Evidence[];
  notes: NoteEntry[];
  timeline: TimelineEntry[];
  attachments: { id: string; name: string; size: string; addedAt: string }[];
}

export interface Evidence {
  id: string;
  name: string;
  type: string;
  hash: string;
  collectedAt: string;
  collectedBy: string;
}

export interface NoteEntry {
  id: string;
  author: string;
  body: string;
  createdAt: string;
}

export interface TimelineEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail?: string | undefined;
  severity?: Severity | undefined;
}

export type IocType =
  | "ip"
  | "domain"
  | "url"
  | "sha256"
  | "md5"
  | "email"
  | "process"
  | "registry_key";

export interface Ioc {
  id: string;
  type: IocType;
  value: string;
  riskScore: number;
  severity: Severity;
  tags: string[];
  source: string;
  firstSeen: string;
  lastSeen: string;
  matches: number;
  relatedAlertIds: string[];
  relatedIncidentIds: string[];
  description: string;
}

export interface ThreatFeed {
  id: string;
  name: string;
  provider: string;
  enabled: boolean;
  indicators: number;
  lastSync: string;
  reliability: "A" | "B" | "C";
}

export interface ThreatActor {
  id: string;
  name: string;
  aliases: string[];
  origin: string;
  motivation: string;
  activity: number;
  lastSeen: string;
  techniques: string[];
  targetSectors: string[];
  summary: string;
}

export type AssetType = "server" | "endpoint" | "user" | "network" | "cloud";

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  os: string;
  ip: string;
  owner: string;
  criticality: "critical" | "high" | "medium" | "low";
  riskScore: number;
  patchStatus: "up_to_date" | "pending" | "outdated";
  lastSeen: string;
  software: { name: string; version: string; vulnerable: boolean }[];
  alertIds: string[];
  incidentIds: string[];
  tags: string[];
}

export interface DetectionRule {
  id: string;
  name: string;
  description: string;
  severity: Severity;
  enabled: boolean;
  mitre: string;
  mitreName: string;
  source: "Sigma" | "Custom" | "Vendor" | "MITRE";
  logic: string;
  lastTriggered: string | null;
  triggers30d: number;
  falsePositiveRate: number;
  author: string;
  updatedAt: string;
}

export interface HuntResult {
  id: string;
  timestamp: string;
  host: string;
  user: string;
  process: string;
  commandLine: string;
  sourceIp: string;
  destinationIp: string;
  mitre: string;
  severity: Severity;
  matchedField: string;
}

export interface SavedHunt {
  id: string;
  name: string;
  query: string;
  createdBy: string;
  createdAt: string;
  lastRun: string;
  results: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  severity: Severity;
  category:
    | "critical_alert"
    | "incident_assignment"
    | "case_update"
    | "ioc_match"
    | "password_change"
    | "admin_action"
    | "system";
  read: boolean;
  createdAt: string;
  link?: string | undefined;
}

export interface AuditLog {
  id: string;
  user: string;
  action: string;
  resource: string;
  timestamp: string;
  ip: string;
  previousValue: string | null;
  newValue: string | null;
  result: "success" | "failure";
}

export interface ReportItem {
  id: string;
  name: string;
  type:
    | "daily_soc"
    | "weekly_soc"
    | "monthly_soc"
    | "incident"
    | "soc_metrics"
    | "analyst_performance"
    | "false_positives";
  period: string;
  generatedAt: string;
  generatedBy: string;
  status: "ready" | "generating" | "failed";
  sizeKb: number;
  summary: { label: string; value: string }[];
}

export interface DashboardMetrics {
  criticalAlerts: number;
  highAlerts: number;
  openIncidents: number;
  activeCases: number;
  iocMatches: number;
  intelMatches: number;
  assetsAtRisk: number;
  securityScore: number;
  systemHealth: number;
  mttrMinutes: number;
  falsePositiveRate: number;
  alertToIncident: number;
  analystWorkload: { analyst: string; open: number; capacity: number }[];
  alertVolume: { time: string; critical: number; high: number; medium: number; low: number }[];
  severityDistribution: { name: string; value: number; severity: Severity }[];
  mitreDistribution: { technique: string; name: string; count: number }[];
  incidentTimeline: { day: string; opened: number; resolved: number }[];
  threatActivity: { time: string; score: number; blocked: number }[];
  topAssets: { asset: string; alerts: number }[];
  topSourceIps: { ip: string; count: number; country: string }[];
  fpTrend: { day: string; rate: number }[];
  /**
   * Period-over-period percentage change per metric key, computed by the
   * backend (or the demo dataset) — never hard-coded in the UI. Keys are
   * DashboardMetrics numeric field names; a missing key hides the trend chip.
   */
  trends?: Partial<Record<
    "criticalAlerts" | "highAlerts" | "openIncidents" | "activeCases" | "iocMatches" | "assetsAtRisk" | "mttrMinutes" | "falsePositiveRate",
    number
  >>;
}

export interface SystemHealthItem {
  name: string;
  status: "healthy" | "degraded" | "down";
  latencyMs: number;
  uptime: number;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  pendingApprovals: number;
  failedLogins24h: number;
  securityEvents24h: number;
  services: SystemHealthItem[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * A live authenticated session as reported by the backend
 * (GET /admin/sessions). `lastActivity` drives the online/idle/offline state
 * shown in the Admin Portal — it is never derived from login attempts.
 */
export interface ActiveSession {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: Role;
  loginAt: string;
  lastActivity: string;
  ip: string;
  device: string;
  location: string;
  current: boolean;
}
