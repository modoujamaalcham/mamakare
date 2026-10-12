import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Home, Users, CalendarDays, Menu, LogOut, Moon, Settings, Sun } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "../index";
import { useMe } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // getUser() performs a network request and returns no user while offline.
    // getSession() restores the persisted Supabase session locally, which lets
    // the cached application shell remain available without pretending that
    // clinical data is available offline.
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
  },
  component: Layout,
});

const NAV = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/patients", label: "Patients", icon: Users },
  { to: "/schedule", label: "Schedule", icon: CalendarDays },
  { to: "/more", label: "More", icon: Menu },
] as const;

const ADMIN_NAV = { to: "/staff", label: "Administration", icon: Settings } as const;

function Layout() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const { data: me } = useMe();
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navItems = me?.roles.includes("admin") ? [...NAV, ADMIN_NAV] : NAV;

  async function handleSignOut() {
    await qc.cancelQueries();
    await signOut();
    setLogoutOpen(false);
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background md:flex">
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-4 py-5 md:flex">
        <div className="flex items-center justify-between px-2">
          <Logo />
          <ThemeButton theme={theme} onClick={toggleTheme} />
        </div>
        <div className="mt-10 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Workspace
        </div>
        <nav className="mt-3 flex flex-1 flex-col gap-1">
          {navItems.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
              activeProps={{
                className: "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm",
              }}
            >
              <n.icon className="h-4 w-4 opacity-75 group-hover:opacity-100" /> {n.label}
            </Link>
          ))}
        </nav>
        <div className="rounded-2xl border border-sidebar-border bg-card/60 p-3">
          <p className="truncate px-2 text-sm font-semibold">
            {me?.profile?.full_name || me?.user.email}
          </p>
          <p className="px-2 pt-0.5 text-xs capitalize text-muted-foreground">
            {me?.roles.length ? me.roles.join(", ") : "No staff role assigned"}
          </p>
          <button
            onClick={() => setLogoutOpen(true)}
            className="mt-3 flex w-full items-center gap-3 rounded-xl px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 pb-24 md:pb-8">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/70 bg-background/90 px-4 py-3 backdrop-blur md:hidden">
          <Logo />
          <div className="flex items-center gap-1">
            <ThemeButton theme={theme} onClick={toggleTheme} />
            <button
              onClick={() => setLogoutOpen(true)}
              aria-label="Sign out"
              className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>
        <div className="mx-auto w-full max-w-[1600px] px-4 pt-6 md:px-8 md:pt-10 2xl:px-10">
          <Outlet />
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border/80 bg-card/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-20px_rgba(0,0,0,0.5)] backdrop-blur md:hidden">
        {NAV.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className="flex flex-col items-center gap-1 py-3 text-[11px] font-medium text-muted-foreground transition-colors"
            activeProps={{ className: "text-primary" }}
          >
            <n.icon className="h-5 w-5" /> {n.label}
          </Link>
        ))}
      </nav>

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
            <AlertDialogDescription>
              You will need to sign in again to access Mamakare clinical records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleSignOut()}>Sign out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ThemeButton({ theme, onClick }: { theme: "light" | "dark"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
