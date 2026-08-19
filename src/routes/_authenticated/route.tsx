import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { ShieldX } from "lucide-react";
import { AppShell } from "@/components/soc/app-shell";
import { Button } from "@/components/ui/button";
import { canAccessModule, moduleForPath } from "@/lib/rbac";
import { useAuthStore } from "@/stores/auth-store";
import { LoadingSkeleton } from "@/components/soc/states";


export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const navigate = useNavigate();

  useEffect(() => {
    if (hydrated && !user) void navigate({ to: "/", replace: true });
  }, [hydrated, user, navigate]);

  if (!hydrated || !user) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-3 p-8">
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  return (
    <AppShell>
      <ModuleGuard>
        <Outlet />
      </ModuleGuard>
    </AppShell>
  );
}

/**
 * Blocks direct URL access to modules the signed-in role may not use.
 * This mirrors — and never replaces — the backend's 403 responses.
 */
function ModuleGuard({ children }: { children: React.ReactNode }) {
  const role = useAuthStore((s) => s.user?.role);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const module = moduleForPath(pathname);

  if (!canAccessModule(role, module)) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-4 px-6 py-24 text-center">
        <span className="flex size-12 items-center justify-center rounded-full border border-destructive/40 bg-destructive/10 text-destructive">
          <ShieldX className="size-6" />
        </span>
        <div className="space-y-1">
          <h1 className="text-lg font-semibold text-foreground">403 — Access denied</h1>
          <p className="text-sm text-muted-foreground">
            The <span className="mono text-foreground">{role}</span> role is not authorised for the{" "}
            <span className="mono text-foreground">{module}</span> module. Contact a SentinelOps administrator if
            you require elevated access.
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link to="/dashboard">Return to dashboard</Link>
        </Button>
      </div>
    );
  }
  return <>{children}</>;
}

