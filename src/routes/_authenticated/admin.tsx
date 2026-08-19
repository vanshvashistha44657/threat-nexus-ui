import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, ShieldCheck, UserCog, Users, X } from "lucide-react";
import { PageHeader, Panel, MetricCard } from "@/components/soc/panels";
import { DataTable, type Column } from "@/components/soc/data-table";
import { StatusBadge, Chip } from "@/components/soc/badges";
import { relativeTime } from "@/components/soc/timeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ForbiddenState, LoadingSkeleton } from "@/components/soc/states";
import { useAdminStats, useAdminUsers, useAuditLogs, useDebounced, useUserAdminActions } from "@/hooks/use-soc-data";
import { useAuthStore } from "@/stores/auth-store";
import type { AuditLog, Role, User } from "@/services";

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
          <MetricCard label="Security events 24h" value={stats.data.securityEvents24h} icon={ShieldCheck} tone="high" />
        </div>
      )}

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="approvals">Approvals {pending.length ? `(${pending.length})` : ""}</TabsTrigger>
          <TabsTrigger value="audit">Audit log</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <DataTable columns={userColumns} rows={users.data} rowKey={(r) => r.id} isLoading={users.isLoading} error={users.error} emptyTitle="No users" emptyDescription="No accounts exist yet." />
        </TabsContent>
        <TabsContent value="approvals">
          <DataTable columns={userColumns} rows={pending} rowKey={(r) => r.id} isLoading={users.isLoading} emptyTitle="No pending approvals" emptyDescription="All access requests have been reviewed." />
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
