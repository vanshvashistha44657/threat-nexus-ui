import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Activity, Eye, EyeOff, Loader2, Lock, Mail, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuthStore } from "@/stores/auth-store";
import { ADMIN_EMAIL, ApiError, IS_LIVE_BACKEND } from "@/services";
import { Chip } from "@/components/soc/badges";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SentinelOps — SOC/XDR Command Center Sign In" },
      {
        name: "description",
        content:
          "Sign in to SentinelOps, the enterprise Security Operations Center platform for monitoring, detecting, investigating and responding to threats.",
      },
      { property: "og:title", content: "SentinelOps — Enterprise SOC/XDR Platform" },
      {
        property: "og:description",
        content: "Monitor. Detect. Investigate. Respond. Enterprise-grade security operations in one console.",
      },
    ],
  }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().email("Enter a valid corporate e-mail address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  remember: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const [error, setError] = useState<string | null>(null);
  const [show, setShow] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", remember: true },
  });

  useEffect(() => {
    if (hydrated && user) void navigate({ to: "/dashboard", replace: true });
  }, [hydrated, user, navigate]);

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      const authed = await login(values.email, values.password, values.remember);
      toast.success(`Welcome back, ${authed.name}`);
      void navigate({ to: "/dashboard", replace: true });
    } catch (e) {
      if (e instanceof ApiError && e.message === "PENDING_APPROVAL") {
        void navigate({ to: "/pending-approval" });
        return;
      }
      setError(e instanceof Error ? e.message : "Authentication failed.");
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-border p-10 lg:flex">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg border border-primary/40 bg-primary/10">
            <Shield className="size-5 text-primary" />
          </span>
          <div>
            <p className="text-lg font-semibold tracking-tight">SentinelOps</p>
            <p className="mono text-[11px] uppercase tracking-[0.2em] text-primary">
              Monitor · Detect · Investigate · Respond
            </p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-lg space-y-6"
        >
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-foreground">
            Enterprise <span className="text-gradient">SOC / XDR</span> command center
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Unified detection, investigation and response across endpoints, identity, network and cloud telemetry —
            correlated with MITRE ATT&amp;CK coverage, threat intelligence and full case management.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["24/7", "Continuous monitoring"],
              ["MITRE", "ATT&CK aligned detections"],
              ["RBAC", "Four-tier analyst model"],
              ["Realtime", "WebSocket event stream"],
            ].map(([k, v]) => (
              <div key={k} className="panel p-3">
                <p className="mono text-sm font-semibold text-primary">{k}</p>
                <p className="text-xs text-muted-foreground">{v}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Activity className="size-3.5 text-success" />
          {IS_LIVE_BACKEND ? "Connected to the configured FastAPI backend" : "Demonstration build · seeded SOC dataset"}
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <span className="flex size-9 items-center justify-center rounded-lg border border-primary/40 bg-primary/10">
              <Shield className="size-4 text-primary" />
            </span>
            <p className="text-base font-semibold">SentinelOps</p>
          </div>

          <h2 className="text-xl font-semibold tracking-tight">Sign in to the console</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Authenticate with your SOC account. Access is governed by role-based permissions.
          </p>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-1.5">
              <Label htmlFor="email">Work e-mail</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" autoComplete="email" className="pl-8" placeholder="analyst@sentinelops.io" {...form.register("email")} />
              </div>
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  className="px-8"
                  placeholder="••••••••"
                  {...form.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox
                  checked={form.watch("remember")}
                  onCheckedChange={(v) => form.setValue("remember", Boolean(v))}
                />
                Remember session
              </label>
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Sign in
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Need an account?{" "}
            <Link to="/register" className="text-primary hover:underline">
              Request SOC access
            </Link>
          </p>

          <div className="mt-6 rounded-md border border-border bg-surface-2/40 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-foreground">Administrator account</p>
              <Chip tone="info">RBAC</Chip>
            </div>
            <p className="mono mt-1 break-all text-[11px] text-muted-foreground">{ADMIN_EMAIL}</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
              The administrator credential is provisioned through secure server-side configuration
              (ADMIN_EMAIL / ADMIN_PASSWORD) and is never stored, displayed or shipped in client code.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
