import { createFileRoute, redirect } from "@tanstack/react-router";

// Alias route: /ioc-management -> /ioc (canonical IOC Management module).
export const Route = createFileRoute("/_authenticated/ioc-management")({
  beforeLoad: () => {
    throw redirect({ to: "/ioc", replace: true });
  },
});
