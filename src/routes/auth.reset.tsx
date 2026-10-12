import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "./index";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/reset")({
  head: () => ({ meta: [{ title: "Set new password — Mamakare" }] }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmation) {
      toast.error("Passwords do not match.");
      return;
    }
    setBusy(true);
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setBusy(false);
      toast.error("This recovery link is invalid or has expired.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error("We could not update your password. Please request a new link.");
      return;
    }
    await supabase.auth.signOut();
    toast.success("Password updated. Sign in with your new password.");
    navigate({ to: "/auth", replace: true });
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-5">
      <div className="w-full max-w-sm">
        <Logo />
        <h1 className="mt-8 text-2xl font-bold">Choose a new password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your recovery session is checked before the password is changed.
        </p>
        <form onSubmit={submit} className="card-surface mt-6 space-y-4 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmation">Confirm password</Label>
            <Input
              id="confirmation"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </div>
          <Button type="submit" className="h-11 w-full" disabled={busy}>
            {busy ? "Updating…" : "Update password"}
          </Button>
          <Link
            to="/auth"
            className="block text-center text-sm text-muted-foreground hover:text-foreground"
          >
            Back to sign in
          </Link>
        </form>
      </div>
    </main>
  );
}
