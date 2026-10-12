import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Eye, EyeOff, Moon, ShieldCheck, Sun } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "./index";
import { useTheme } from "@/lib/theme";

export const Route = createFileRoute("/auth")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Sign in — Mamakare" },
      { name: "description", content: "Sign in to Mamakare with your email." },
      { property: "og:title", content: "Sign in — Mamakare" },
      {
        property: "og:description",
        content: "Sign in to Mamakare with your email.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const { theme, toggleTheme } = useTheme();

  if (pathname !== "/auth") return <Outlet />;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: identifier.trim(),
        password,
      });
      if (error) throw error;
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message.toLowerCase() : "";
      if (message.includes("invalid login credentials")) {
        toast.error(
          "Invalid email or password. Confirm that this staff account exists in Supabase Auth.",
        );
      } else if (message.includes("email not confirmed")) {
        toast.error(
          "This email is not confirmed yet. Ask an administrator to confirm the account.",
        );
      } else if (message.includes("rate limit") || message.includes("too many")) {
        toast.error("Too many sign-in attempts. Wait a few minutes and try again.");
      } else if (
        message.includes("fetch") ||
        message.includes("network") ||
        message.includes("failed to fetch")
      ) {
        toast.error(
          "Mamakare could not reach Supabase. Check your internet connection and try again.",
        );
      } else {
        toast.error("Sign-in failed. Check your details or contact your administrator.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-background lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-primary p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/10" />
        <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full border-[48px] border-white/10" />
        <Logo />
        <div className="relative max-w-xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-primary-foreground/70">
            Mamakare care workspace
          </p>
          <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight xl:text-6xl">
            Better care, connected from first visit to follow-up.
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-primary-foreground/75">
            A focused workspace for maternal and patient care teams in The Gambia.
          </p>
          <div className="mt-10 space-y-3 text-sm text-primary-foreground/90">
            {["Secure clinical records", "Clear visit planning", "Built for mobile teams"].map(
              (item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> {item}
                </div>
              ),
            )}
          </div>
        </div>
        <p className="relative text-xs text-primary-foreground/60">
          Mamakare · Secure care coordination
        </p>
      </section>
      <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center justify-between lg:justify-end">
            <div className="lg:hidden">
              <Logo />
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              className="grid h-10 w-10 place-items-center rounded-xl border border-border text-muted-foreground hover:bg-muted"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
          <div className="mb-7">
            <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
            <p className="mt-2 text-muted-foreground">Sign in to your secure care workspace.</p>
          </div>
          <form onSubmit={submit} className="card-surface space-y-5 p-5 sm:p-6">
            <div className="space-y-1.5">
              <Label htmlFor="id">Email address</Label>
              <Input
                id="id"
                required
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                type="email"
                inputMode="email"
                placeholder="you@clinic.gm"
                className="h-12"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw">Password</Label>
              <Input
                id="pw"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                autoComplete="current-password"
                className="h-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? (
                  <EyeOff className="mr-1 inline h-3.5 w-3.5" />
                ) : (
                  <Eye className="mr-1 inline h-3.5 w-3.5" />
                )}
                {showPassword ? "Hide password" : "Show password"}
              </button>
            </div>
            <Button type="submit" className="h-11 w-full" disabled={busy}>
              {busy ? "Please wait…" : "Sign in"}
            </Button>
            <Link
              to="/auth/recover"
              className="block text-center text-sm text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </form>
          <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">
            Accounts are created by an authorized Mamakare administrator.
          </p>
        </div>
      </section>
    </main>
  );
}
