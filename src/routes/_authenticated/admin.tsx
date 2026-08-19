import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, LogOut, RadioTower, ShieldCheck, UserCog, Users, X } from "lucide-react";
import { PageHeader, Panel, MetricCard } from "@/components/soc/panels";
import { DataTable, type Column } from "@/components/soc/data-table";
import { StatusBadge, Chip } from "@/components/soc/badges";
import { relativeTime } from "@/components/soc/timeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ForbiddenState, LoadingSkeleton } from "@/components/soc/states";
import {
  useActiveSessions,
  useAdminSessionActions,
  useAdminStats,
  useAdminUsers,
  useAuditLogs,
  useDebounced,
  useUserAdminActions,
} from "@/hooks/use-soc-data";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import type { ActiveSession, AuditLog, Role, User } from "@/services";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Portal — SentinelOps" },
      { name: "description", content: "Administer SentinelOps users, approve access requests, assign RBAC roles and review the security audit log." },
      { property: "og:title", content: "Admin Portal — SentinelOps" },
      { property: "og:description", content: "User approval, RBAC role assignment and audit logging." },
    ],
  }),
  component: AdminPage,
});

const ROLES: Role[] = ["Administrator", "SOC Manager", "SOC Analyst L2", "SOC Analyst L1"];

function AdminPage() {
  const isAdmin = useAuthStore((s) => s.has("admin:access"));
  const stats = useAdminStats();
  const users = useAdminUsers();
  const [search, setSearch] = useState("");
  const debounced = useDebounced(search, 250);
  const logs = useAuditLogs(debounced);
  const { update } = useUserAdminActions();

  if (!isAdmin) {
    return (
      <>
        <PageHeader eyebrow="Administration" title="Admin Portal" />
        <ForbiddenState description="Administrator privileges are required. Access is enforced server-side by the SentinelOps API." />
      </>
    );
  }

  const pending = users.data?.filter((u) => u.status === "pending") ?? [];

  const userColumns: Column<User>[] = [
    { key: "name", header: "User", className: "min-w-[240px]", render: (r) => (
      <div className="min-w-0"><p className="truncate font-medium text-foreground">{r.name}</p><p className="mono truncate text-[11px] text-muted-foreground">{r.email}</p></div>
    ) },
    { key: "role", header: "Role", render: (r) => (
      <span onClick={(e) => e.stopPropagation()}>
        <Select value={r.role} onValueChange={(v) => update.mutate({ id: r.id, patch: { role: v as Role }, message: `Role updated to ${v}` })}>
          <SelectTrigger className="h-8 w-[170px]"><SelectValue /></SelectTrigger>
          <SelectContent>{ROLES.map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}</SelectContent>
        </Select>
      </span>
    ) },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "mfa", header: "MFA", render: (r) => <Chip tone={r.mfaEnabled ? "success" : "medium"}>{r.mfaEnabled ? "enabled" : "disabled"}</Chip> },
    { key: "login", header: "Last login", render: (r) => <span className="mono text-[11px] text-muted-foreground">{r.lastLogin ? relativeTime(r.lastLogin) : "never"}</span> },
    { key: "act", header: "", render: (r) => (
      <span className="flex gap-1" onClick={(e) => e.stopPropagation()}>
        {r.status !== "active" && (
          <Button size="sm" variant="outline" className="h-7" onClick={() => update.mutate({ id: r.id, patch: { status: "active" }, message: "User approved" })}>
            <Check className="size-3.5" /> Approve
          </Button>
        )}
        {r.status === "active" && (
          <Button size="sm" variant="ghost" className="h-7 text-destructive" onClick={() => update.mutate({ id: r.id, patch: { status: "disabled" }, message: "User disabled" })}>
            <X className="size-3.5" /> Disable
          </Button>
        )}
      </span>
    ) },
  ];

  const sessions = useActiveSessions();
  const liveCount = sessions.data?.filter((s) => sessionState(s.lastActivity) !== "offline").length ?? 0;

  const logColumns: Column<AuditLog>[] = [
    { key: "ts", header: "Time", render: (r) => <span className="mono text-[11px] text-muted-foreground">{relativeTime(r.timestamp)}</span> },
    { key: "user", header: "Actor", render: (r) => <span className="mono text-xs">{r.user}</span> },
    { key: "action", header: "Action", render: (r) => <Chip tone="info">{r.action}</Chip> },
    { key: "resource", header: "Resource", render: (r) => <span className="mono text-xs text-muted-foreground">{r.resource}</span> },
    { key: "ip", header: "Source IP", render: (r) => <span className="mono text-xs text-muted-foreground">{r.ip}</span> },
    { key: "result", header: "Result", render: (r) => <StatusBadge status={r.result} /> },
  ];

  return (
    <>
      <PageHeader eyebrow="Administration" title="Admin Portal" description="User lifecycle, RBAC role assignment, approvals and immutable audit logging." />
      {stats.isLoading && <LoadingSkeleton rows={2} />}
      {stats.data && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total users" value={stats.data.totalUsers} icon={Users} />
          <MetricCard label="Pending approvals" value={stats.data.pendingApprovals} icon={UserCog} tone="medium" />
          <MetricCard label="Failed logins 24h" value={stats.data.failedLogins24h} icon={ShieldCheck} tone="critical" />
          <MetricCard label="Active sessions now" value={liveCount} icon={RadioTower} tone="success" />
        </div>
      )}

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="approvals">Approvals {pending.length ? `(${pending.length})` : ""}</TabsTrigger>
          <TabsTrigger value="active">Active users {liveCount ? `(${liveCount})` : ""}</TabsTrigger>
          <TabsTrigger value="audit">Audit log</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <DataTable columns={userColumns} rows={users.data} rowKey={(r) => r.id} isLoading={users.isLoading} error={users.error} emptyTitle="No users" emptyDescription="No accounts exist yet." />
        </TabsContent>
        <TabsContent value="approvals">
          <DataTable columns={userColumns} rows={pending} rowKey={(r) => r.id} isLoading={users.isLoading} emptyTitle="No pending approvals" emptyDescription="All access requests have been reviewed." />
        </TabsContent>
        <TabsContent value="active">
          <ActiveUsers />
        </TabsContent>
        <TabsContent value="audit" className="space-y-3">
          <Panel className="p-3">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter audit log by actor, action, resource or IP…" className="h-9" />
          </Panel>
          <DataTable columns={logColumns} rows={logs.data} rowKey={(r) => r.id} isLoading={logs.isLoading} error={logs.error} emptyTitle="No audit entries" emptyDescription="No activity matches the current filter." />
        </TabsContent>
      </Tabs>
    </>
  );
}

/* ------------------------------------------------------- live active users */

type LiveState = "online" | "idle" | "offline";

/** Derived purely from the backend-reported last_activity timestamp. */
function sessionState(lastActivity: string): LiveState {
  const age = Date.now() - new Date(lastActivity).getTime();
  if (age < 2 * 60_000) return "online";
  if (age < 15 * 60_000) return "idle";
  return "offline";
}

const STATE_TONE: Record<LiveState, string> = {
  online: "border-success/40 bg-success/10 text-success",
  idle: "border-warning/40 bg-warning/10 text-warning",
  offline: "border-border bg-surface-2 text-muted-foreground",
};

function ActiveUsers() {
  const { data, isLoading, error, refetch, isFetching } = useActiveSessions();
  const { revoke } = useAdminSessionActions();
  const [onlyLive, setOnlyLive] = useState(true);

  const rows = (data ?? [])
    .filter((s) => (onlyLive ? sessionState(s.lastActivity) !== "offline" : true))
    .sort((a, b) => +new Date(b.lastActivity) - +new Date(a.lastActivity));

  const columns: Column<ActiveSession>[] = [
    {
      key: "user",
      header: "User",
      render: (r) => {
        const state = sessionState(r.lastActivity);
        return (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "size-2 shrink-0 rounded-full",
                state === "online" && "bg-success live-dot",
                state === "idle" && "bg-warning",
                state === "offline" && "bg-muted-foreground/50",
              )}
            />
            <span className="min-w-0">
              <span className="block truncate text-xs font-medium text-foreground">{r.name}</span>
              <span className="mono block truncate text-[10px] text-muted-foreground">{r.email}</span>
            </span>
          </div>
        );
      },
    },
    { key: "role", header: "Role", render: (r) => <Chip tone="info">{r.role}</Chip> },
    {
      key: "state",
      header: "State",
      render: (r) => {
        const state = sessionState(r.lastActivity);
        return (
          <span className={cn("mono inline-flex rounded border px-1.5 py-0.5 text-[10px] uppercase", STATE_TONE[state])}>
            {state}
          </span>
        );
      },
    },
    { key: "activity", header: "Last activity", render: (r) => <span className="mono text-[11px] text-muted-foreground">{relativeTime(r.lastActivity)}</span> },
    { key: "login", header: "Signed in", render: (r) => <span className="mono text-[11px] text-muted-foreground">{relativeTime(r.loginAt)}</span> },
    { key: "device", header: "Device", render: (r) => <span className="truncate text-xs text-muted-foreground">{r.device}</span> },
    { key: "ip", header: "IP / location", render: (r) => <span className="mono text-[11px] text-muted-foreground">{r.ip} · {r.location}</span> },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          disabled={r.current || revoke.isPending}
          onClick={() => revoke.mutate(r.id)}
          title={r.current ? "This is your own session" : "Force sign-out"}
        >
          <LogOut className="size-3.5" /> Revoke
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <Panel className="flex flex-wrap items-center justify-between gap-2 p-3">
        <p className="text-xs text-muted-foreground">
          Live sessions reported by the SentinelOps API, refreshed every 20s and on session heartbeats.
        </p>
        <div className="flex items-center gap-2">
          <Button size="sm" variant={onlyLive ? "default" : "outline"} onClick={() => setOnlyLive((v) => !v)}>
            {onlyLive ? "Showing online + idle" : "Showing all sessions"}
          </Button>
          <Button size="sm" variant="outline" disabled={isFetching} onClick={() => void refetch()}>
            <RadioTower className={cn("size-3.5", isFetching && "animate-pulse")} /> Refresh
          </Button>
        </div>
      </Panel>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        isLoading={isLoading}
        error={error}
        emptyTitle="No active sessions"
        emptyDescription="Nobody is currently signed in to SentinelOps."
      />
    </div>
  );
}
