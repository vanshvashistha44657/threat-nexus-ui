import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound, Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { services } from "@/services";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — SentinelOps" },
      {
        name: "description",
        content: "Request a secure password reset link for your SentinelOps SOC analyst account.",
      },
      { property: "og:title", content: "Reset Password — SentinelOps" },
      { property: "og:description", content: "Secure password recovery for SentinelOps SOC accounts." },
    ],
  }),
  component: ForgotPasswordPage,
});

const schema = z.object({ email: z.string().email("Enter a valid work e-mail") });

function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="panel w-full max-w-md p-7">
        {sent ? (
          <div className="text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full border border-success/40 bg-success/10">
              <MailCheck className="size-6 text-success" />
            </span>
            <h1 className="mt-4 text-lg font-semibold">Check your inbox</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              If an active SentinelOps account exists for that address, a single-use reset link valid for 30 minutes has
              been sent. For security, the response is identical whether or not the account exists.
            </p>
            <Button asChild className="mt-6 w-full">
              <Link to="/">Back to sign in</Link>
            </Button>
          </div>
        ) : (
          <>
            <span className="flex size-10 items-center justify-center rounded-lg border border-primary/40 bg-primary/10">
              <KeyRound className="size-5 text-primary" />
            </span>
            <h1 className="mt-4 text-lg font-semibold tracking-tight">Reset your password</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your work e-mail and we will send a secure, single-use recovery link.
            </p>
            <form
              className="mt-5 space-y-4"
              onSubmit={form.handleSubmit(async (v) => {
                await services.auth.requestPasswordReset(v.email);
                setSent(true);
              })}
            >
              <div className="space-y-1.5">
                <Label htmlFor="email">Work e-mail</Label>
                <Input id="email" type="email" placeholder="analyst@company.com" {...form.register("email")} />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
                Send recovery link
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              <Link to="/" className="text-primary hover:underline">
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
