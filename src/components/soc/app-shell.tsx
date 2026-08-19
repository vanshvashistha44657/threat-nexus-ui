import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  Bell,
  Bug,
  ChevronsLeft,
  Crosshair,
  FileText,
  Fingerprint,
  Gauge,
  LayoutDashboard,
  LogOut,
  Menu,
  Radar,
  Search,
  Server,
  Settings,
  Shield,
  ShieldAlert,
  Siren,
  UserCog,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useRealtimeStore } from "@/stores/realtime-store";
import { useUiStore } from "@/stores/ui-store";
import { connectRealtime } from "@/services/realtime";
import { IS_LIVE_BACKEND } from "@/services";
import { NotificationCenter } from "./notification-center";
import { Chip } from "./badges";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/alerts", label: "Alerts", icon: Siren },
  { to: "/incidents", label: "Incidents", icon: ShieldAlert },
  { to: "/cases", label: "Cases", icon: FileText },
  { to: "/threat-hunting", label: "Threat Hunting", icon: Crosshair },
  { to: "/detection-rules", label: "Detection Rules", icon: Bug },
  { to: "/ioc", label: "IOC Management", icon: Fingerprint },
  { to: "/threat-intelligence", label: "Threat Intelligence", icon: Radar },
  { to: "/assets", label: "Asset Management", icon: Server },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/admin", label: "Admin Portal", icon: UserCog, permission: "admin:access" },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/profile", label: "Profile", icon: UserIcon },
] as const;

function Brand({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-4">
      <span className="relative flex size-8 shrink-0 items-center justify-center rounded-md border border-primary/40 bg-primary/10">
        <Shield className="size-4 text-primary" />
      </span>
      {!collapsed && (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight text-foreground">SentinelOps</p>
          <p className="mono truncate text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Monitor · Detect · Respond
          </p>
        </div>
      )}
    </div>
  );
}

function NavList({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const has = useAuthStore((s) => s.has);
  return (
    <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
      {NAV_ITEMS.map((item) => {
        const locked = "permission" in item && item.permission && !has(item.permission);
        if (locked) return null;
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            activeProps={{ "data-active": "true" }}
            className={cn(
              "group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-sidebar-foreground/80 transition-colors",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              "data-[active=true]:bg-primary/12 data-[active=true]:text-primary data-[active=true]:font-medium",
            )}
          >
            <span className="absolute left-0 h-5 w-0.5 rounded-r bg-primary opacity-0 transition-opacity group-data-[active=true]:opacity-100" />
            <Icon className="size-4 shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function ConnectionPill() {
  const status = useRealtimeStore((s) => s.status);
  const label = status === "connected" ? "LIVE SOC" : status === "reconnecting" ? "RECONNECTING" : "DISCONNECTED";
  const tone =
    status === "connected"
      ? "border-success/40 bg-success/10 text-success"
      : status === "reconnecting"
        ? "border-medium/40 bg-medium/10 text-medium"
        : "border-critical/40 bg-critical/10 text-critical";
  return (
    <span
      className={cn(
        "mono inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-semibold tracking-[0.14em]",
        tone,
      )}
      title={`WebSocket ${status}`}
    >
      <span className={cn("size-1.5 rounded-full bg-current", status === "connected" && "live-dot")} />
      {label}
    </span>
  );
}

function GlobalSearch() {
  const navigate = useNavigate();
  const setGlobalSearch = useUiStore((s) => s.setGlobalSearch);
  const [q, setQ] = useState("");
  return (
    <form
      className="relative hidden max-w-md flex-1 md:block"
      onSubmit={(e) => {
        e.preventDefault();
        if (!q.trim()) return;
        setGlobalSearch(q.trim());
        void navigate({ to: "/alerts" });
      }}
    >
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search alerts, hosts, IPs, indicators…"
        className="h-9 border-border bg-surface-2/60 pl-8 text-sm"
        aria-label="Global search"
      />
    </form>
  );
}

function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const qc = useQueryClient();
  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-md border border-border bg-surface-2/60 px-2 py-1.5 text-left transition-colors hover:border-primary/40">
          <span className="mono flex size-7 items-center justify-center rounded bg-primary/15 text-[11px] font-semibold text-primary">
            {initials}
          </span>
          <span className="hidden min-w-0 sm:block">
            <span className="block truncate text-xs font-medium text-foreground">{user.name}</span>
            <span className="block truncate text-[10px] text-muted-foreground">{user.role}</span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs">
          <p className="font-semibold">{user.name}</p>
          <p className="font-normal text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void navigate({ to: "/profile" })}>
          <UserIcon className="size-4" /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void navigate({ to: "/settings" })}>
          <Settings className="size-4" /> Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={async () => {
            await qc.cancelQueries();
            qc.clear();
            logout();
            toast.success("Signed out of SentinelOps");
            void navigate({ to: "/", replace: true });
          }}
        >
          <LogOut className="size-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Boots the realtime transport and keeps server state fresh. */
function useRealtimeBridge() {
  const setStatus = useRealtimeStore((s) => s.setStatus);
  const push = useRealtimeStore((s) => s.push);
  const qc = useQueryClient();

  useEffect(() => {
    const stop = connectRealtime({
      onStatus: setStatus,
      onEvent: (event) => {
        push(event);
        if (event.kind === "alert") {
          void qc.invalidateQueries({ queryKey: ["alerts"] });
          void qc.invalidateQueries({ queryKey: ["notifications"] });
          void qc.invalidateQueries({ queryKey: ["dashboard"] });
          if (event.severity === "critical") {
            toast.error(`Critical: ${event.message}`, { description: event.detail });
          }
        }
        if (event.kind === "ioc") void qc.invalidateQueries({ queryKey: ["iocs"] });
        if (event.kind === "incident") void qc.invalidateQueries({ queryKey: ["incidents"] });
      },
    });
    return stop;
  }, [setStatus, push, qc]);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useRealtimeBridge();

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-screen w-full">
        {/* Desktop sidebar */}
        <aside
          className={cn(
            "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl transition-[width] duration-200 lg:flex",
            collapsed ? "w-[68px]" : "w-[240px]",
          )}
        >
          <Brand collapsed={collapsed} />
          <NavList collapsed={collapsed} />
          <div className="border-t border-sidebar-border p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground"
              onClick={() => setCollapsed((c) => !c)}
            >
              <ChevronsLeft className={cn("size-4 transition-transform", collapsed && "rotate-180")} />
              {!collapsed && "Collapse"}
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
            <div className="flex h-14 items-center gap-2 px-3 sm:px-4">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
                    <Menu className="size-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[260px] border-sidebar-border bg-sidebar p-0">
                  <SheetTitle className="sr-only">Navigation</SheetTitle>
                  <Brand />
                  <NavList onNavigate={() => setMobileOpen(false)} />
                </SheetContent>
              </Sheet>

              <GlobalSearch />

              <div className="ml-auto flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="hidden sm:inline-flex">
                      <Chip tone="info" className="mono">
                        <Gauge className="size-3" /> {IS_LIVE_BACKEND ? "PRODUCTION" : "DEMO MODE"}
                      </Chip>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {IS_LIVE_BACKEND
                      ? "Connected to the configured SentinelOps FastAPI backend."
                      : "Seeded demonstration dataset — no live backend configured (VITE_API_BASE_URL)."}
                  </TooltipContent>
                </Tooltip>
                <ConnectionPill />
                <NotificationCenter />
                {user && (
                  <Chip tone="neutral" className="hidden md:inline-flex">
                    <Activity className="size-3 text-primary" /> {user.role}
                  </Chip>
                )}
                <UserMenu />
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-3 py-4 sm:px-5 sm:py-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="mx-auto w-full max-w-[1600px] space-y-5"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
