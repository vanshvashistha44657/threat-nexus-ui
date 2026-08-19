import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, MonitorSmartphone } from "lucide-react";
import { PageHeader, Panel, KeyValue } from "@/components/soc/panels";
import { Chip } from "@/components/soc/badges";
import { relativeTime } from "@/components/soc/timeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSkeleton } from "@/components/soc/states";
import { useSessions, useUserAdminActions } from "@/hooks/use-soc-data";
import { useAuthStore } from "@/stores/auth-store";
import { services } from "@/services";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Analyst Profile — SentinelOps" },
      { name: "description", content: "Review your SentinelOps analyst profile, RBAC permissions, active sessions and change your password." },
      { property: "og:title", content: "Analyst Profile — SentinelOps" },
      { property: "og:description", content: "Profile, permissions and session security for SOC analysts." },
    ],
  }),
  component: ProfilePage,
});

const schema = z
  .object({
    current: z.string().min(6, "Enter your current password"),
    next: z.string().min(10, "Use at least 10 characters"),
    confirm: z.string(),
  })
  .refine((v) => v.next === v.confirm, { path: ["confirm"], message: "Passwords do not match" });

function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const sessions = useSessions();
  const { revokeSession } = useUserAdminActions();
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { current: "", next: "", confirm: "" } });

  return (
    <>
      <PageHeader eyebrow="Account" title="Analyst Profile" description="Identity, effective permissions and session security." />
      <div className="grid gap-3 xl:grid-cols-2">
        <Panel className="p-4">
          <h3 className="mb-3 text-sm font-semibold">Identity</h3>
          <div className="grid grid-cols-2 gap-x-4 rounded-md border border-border p-3">
            <KeyValue label="Name" value={user?.name} />
            <KeyValue label="E-mail" value={user?.email} mono />
            <KeyValue label="Role" value={user?.role} />
            <KeyValue label="Status" value={user?.status} />
            <KeyValue label="MFA" value={user?.mfaEnabled ? "Enabled" : "Disabled"} />
            <KeyValue label="Last login" value={user?.lastLogin ? relativeTime(user.lastLogin) : "—"} mono />
          </div>
          <p className="mb-2 mt-4 text-xs uppercase tracking-wider text-muted-foreground">Effective permissions</p>
          <div className="flex flex-wrap gap-1.5">
            {user?.permissions.map((p) => <Chip key={p} tone="info">{p}</Chip>)}
          </div>
        </Panel>

        <Panel className="p-4">
          <h3 className="mb-3 text-sm font-semibold">Change password</h3>
          <form
            className="space-y-3"
            onSubmit={form.handleSubmit(async (v) => {
              await services.auth.changePassword({ current: v.current, next: v.next });
              toast.success("Password changed — all other sessions were signed out");
              form.reset();
            })}
          >
            <div className="space-y-1.5">
              <Label htmlFor="current">Current password</Label>
              <Input id="current" type="password" autoComplete="current-password" {...form.register("current")} />
              {form.formState.errors.current && <p className="text-xs text-destructive">{form.formState.errors.current.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="next">New password</Label>
              <Input id="next" type="password" autoComplete="new-password" {...form.register("next")} />
              {form.formState.errors.next && <p className="text-xs text-destructive">{form.formState.errors.next.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirm new password</Label>
              <Input id="confirm" type="password" autoComplete="new-password" {...form.register("confirm")} />
              {form.formState.errors.confirm && <p className="text-xs text-destructive">{form.formState.errors.confirm.message}</p>}
            </div>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />} Update password
            </Button>
          </form>
        </Panel>

        <Panel className="p-4 xl:col-span-2">
          <h3 className="mb-3 text-sm font-semibold">Active sessions</h3>
          {sessions.isLoading && <LoadingSkeleton rows={3} />}
          <ul className="space-y-2">
            {sessions.data?.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <MonitorSmartphone className="size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-sm text-foreground">{s.device} {s.current && <Chip tone="success">current</Chip>}</p>
                    <p className="mono truncate text-[11px] text-muted-foreground">{s.ip} · {s.location} · active {relativeTime(s.lastActive)}</p>
                  </div>
                </div>
                {!s.current && (
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => revokeSession.mutate(s.id)}>Revoke</Button>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
