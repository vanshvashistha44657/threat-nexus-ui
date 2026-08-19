import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { services } from "@/services";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Request SOC Access — SentinelOps" },
      {
        name: "description",
        content:
          "Request an analyst account for the SentinelOps SOC/XDR platform. All registrations require administrator approval before access is granted.",
      },
      { property: "og:title", content: "Request SOC Access — SentinelOps" },
      { property: "og:description", content: "Analyst account requests are reviewed and approved by a SentinelOps administrator." },
    ],
  }),
  component: RegisterPage,
});

const strong = z
  .string()
  .min(10, "Use at least 10 characters")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[0-9]/, "Include a number")
  .regex(/[^A-Za-z0-9]/, "Include a symbol");

const schema = z
  .object({
    name: z.string().min(2, "Enter your full name"),
    email: z.string().email("Enter a valid work e-mail"),
    department: z.string().min(2, "Enter your department"),
    justification: z.string().min(20, "Provide at least 20 characters of business justification"),
    password: strong,
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords do not match" });

type Values = z.infer<typeof schema>;

function strength(pw: string) {
  let score = 0;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (pw.length >= 16) score++;
  return score;
}

function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", department: "", justification: "", password: "", confirm: "" },
  });
  const pw = form.watch("password");
  const score = strength(pw);
  const labels = ["Very weak", "Weak", "Fair", "Strong", "Excellent"];

  const onSubmit = async (values: Values) => {
    setError(null);
    try {
      await services.auth.register({ name: values.name, email: values.email, password: values.password });
      toast.success("Access request submitted for administrator review");
      void navigate({ to: "/pending-approval" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed.");
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center p-6">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg border border-primary/40 bg-primary/10">
          <Shield className="size-5 text-primary" />
        </span>
        <div>
          <p className="text-base font-semibold">SentinelOps</p>
          <p className="mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">SOC access request</p>
        </div>
      </div>

      <div className="panel p-6">
        <h1 className="text-xl font-semibold tracking-tight">Request analyst access</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          New accounts are created in a <strong className="text-medium">pending</strong> state and remain unable to sign
          in until an administrator approves the request and assigns a role.
        </p>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" {...form.register("name")} placeholder="Jane Okafor" />
            {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="department">Department</Label>
            <Input id="department" {...form.register("department")} placeholder="Security Operations" />
            {form.formState.errors.department && (
              <p className="text-xs text-destructive">{form.formState.errors.department.message}</p>
            )}
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="email">Work e-mail</Label>
            <Input id="email" type="email" {...form.register("email")} placeholder="jane.okafor@company.com" />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={`h-1 flex-1 rounded-full ${
                    i < score ? (score <= 2 ? "bg-critical" : score === 3 ? "bg-medium" : "bg-success") : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">{pw ? labels[Math.max(0, score - 1)] : "Minimum 10 chars, mixed case, number, symbol"}</p>
            {form.formState.errors.password && (
              <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input id="confirm" type="password" autoComplete="new-password" {...form.register("confirm")} />
            {form.formState.errors.confirm && (
              <p className="text-xs text-destructive">{form.formState.errors.confirm.message}</p>
            )}
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="justification">Business justification</Label>
            <textarea
              id="justification"
              rows={3}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
              placeholder="Describe the SOC responsibilities requiring platform access."
              {...form.register("justification")}
            />
            {form.formState.errors.justification && (
              <p className="text-xs text-destructive">{form.formState.errors.justification.message}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Submit access request
            </Button>
          </div>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already approved?{" "}
          <Link to="/" className="text-primary hover:underline">
            Return to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
