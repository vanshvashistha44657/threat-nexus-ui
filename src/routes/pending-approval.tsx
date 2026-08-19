import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ADMIN_EMAIL } from "@/services";

export const Route = createFileRoute("/pending-approval")({
  head: () => ({
    meta: [
      { title: "Account Pending Approval — SentinelOps" },
      {
        name: "description",
        content: "Your SentinelOps SOC access request is awaiting administrator review and role assignment.",
      },
      { property: "og:title", content: "Account Pending Approval — SentinelOps" },
      { property: "og:description", content: "Access requests are reviewed by a SentinelOps administrator." },
    ],
  }),
  component: PendingApprovalPage,
});

function PendingApprovalPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="panel w-full max-w-lg p-8 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full border border-medium/40 bg-medium/10">
          <Clock className="size-6 text-medium" />
        </span>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">Access request pending approval</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Your SentinelOps account has been created in a <strong className="text-medium">pending</strong> state. A
          platform administrator must approve the request and assign an RBAC role before you can sign in to the
          console.
        </p>

        <div className="mt-5 space-y-2 rounded-md border border-border bg-surface-2/40 p-4 text-left">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 text-primary" /> Role assignment: SOC Analyst L1 → L2 → Manager →
            Administrator
          </p>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Mail className="size-3.5 text-primary" /> Approval notifications are sent to your registered work e-mail
          </p>
          <p className="mono break-all text-[11px] text-muted-foreground">Approver: {ADMIN_EMAIL}</p>
        </div>

        <Button asChild className="mt-6 w-full">
          <Link to="/">Return to sign in</Link>
        </Button>
      </div>
    </div>
  );
}
