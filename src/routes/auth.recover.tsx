import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "./index";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/recover")({
  head: () => ({ meta: [{ title: "Recover password — Mamakare" }] }),
  component: RecoverPassword,
});

function RecoverPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    setBusy(false);
    if (error) {
      toast.error("We could not start password recovery. Contact your administrator.");
      return;
    }
    setSent(true);
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-5">
      <div className="w-full max-w-sm">
        <Logo />
        <h1 className="mt-8 text-2xl font-bold">Reset your password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your work email and we will send a secure recovery link.
        </p>
        {sent ? (
          <div className="card-surface mt-6 space-y-4 p-5 text-sm">
            <p>
              Check your email for the recovery link. If you do not receive it, contact your
              Mamakare administrator.
            </p>
            <Link to="/auth" className="block text-center text-primary hover:underline">
              Return to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="card-surface mt-6 space-y-4 p-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <Button type="submit" className="h-11 w-full" disabled={busy}>
              {busy ? "Sending…" : "Send recovery link"}
            </Button>
            <Link
              to="/auth"
              className="block text-center text-sm text-muted-foreground hover:text-foreground"
            >
              Back to sign in
            </Link>
          </form>
        )}
      </div>
    </main>
  );
}
