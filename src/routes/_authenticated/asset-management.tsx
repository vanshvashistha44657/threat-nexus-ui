import { createFileRoute, redirect } from "@tanstack/react-router";

// Alias route: /asset-management -> /assets (canonical Asset Management module).
export const Route = createFileRoute("/_authenticated/asset-management")({
  beforeLoad: () => {
    throw redirect({ to: "/assets", replace: true });
  },
});
