import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/soc/app-shell";
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
      <Outlet />
    </AppShell>
  );
}
