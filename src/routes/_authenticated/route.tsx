import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Home,
  Users,
  CalendarDays,
  LogOut,
  Moon,
  Settings,
  Sun,
  UserPlus,
  Shield,
  Activity,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "../index";
import { useMe } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { OfflineIndicator } from "@/lib/pwa";
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
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
  },
  component: Layout,
});

const NAV = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/patients", label: "Patients", icon: Users },
  { to: "/schedule", label: "Schedule", icon: CalendarDays },
  { to: "/more", label: "Settings", icon: Settings },
] as const;

const ADMIN_NAV = { to: "/staff", label: "Staff & Access", icon: Shield } as const;

function Layout() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("mamakare_sidebar_collapsed") === "true";
    }
    return false;
  });
  const { data: me } = useMe();
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isAdmin = me?.roles.includes("admin");
  const navItems = isAdmin ? [...NAV, ADMIN_NAV] : NAV;

  function toggleCollapse() {
    setCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("mamakare_sidebar_collapsed", String(next));
      }
      return next;
    });
  }

  async function handleSignOut() {
    await qc.cancelQueries();
    await signOut();
    setLogoutOpen(false);
    navigate({ to: "/auth", replace: true });
  }

  const userInitials = me?.profile?.full_name
    ? me.profile.full_name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : (me?.user.email?.[0] ?? "U").toUpperCase();

  return (
    <div className="min-h-screen bg-background md:flex text-foreground selection:bg-primary/20">
      {/* Desktop Collapsible Sidebar */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar/95 backdrop-blur-md py-5 md:flex z-30 transition-[width,padding] duration-300 ease-in-out ${
          collapsed ? "w-[76px] px-2.5 items-center" : "w-68 px-4"
        }`}
      >
        {/* Header Branding & Collapse Toggle */}
        {collapsed ? (
          <div className="flex flex-col items-center gap-2.5 w-full">
            <div className="flex items-center justify-center">
              <Logo showText={false} />
            </div>
            <button
              type="button"
              onClick={toggleCollapse}
              title="Expand sidebar"
              aria-label="Expand sidebar"
              className="grid h-8 w-8 place-items-center rounded-xl border border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-95"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between px-1 w-full">
            <Logo showText={true} />
            <div className="flex items-center gap-1">
              <OfflineIndicator />
              <ThemeButton theme={theme} onClick={toggleTheme} />
              <button
                type="button"
                onClick={toggleCollapse}
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
                className="grid h-8 w-8 place-items-center rounded-xl border border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-95"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Register Patient Shortcut */}
        {collapsed ? (
          <div className="mt-4 flex justify-center w-full relative group">
            <Link
              to="/patients/new"
              aria-label="Register patient"
              className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/25 transition-all hover:bg-primary/90 hover:scale-105 active:scale-95"
            >
              <Plus className="h-5 w-5" />
            </Link>
            <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden rounded-xl border border-border/80 bg-popover px-3 py-1.5 text-xs font-bold text-popover-foreground shadow-xl z-50 whitespace-nowrap group-hover:block animate-in fade-in zoom-in-95 duration-150">
              Register patient
            </div>
          </div>
        ) : (
          <div className="mt-6 px-1 w-full">
            <Link
              to="/patients/new"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3.5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-md active:scale-95"
            >
              <UserPlus className="h-4 w-4" /> Register patient
            </Link>
          </div>
        )}

        {/* Section Divider / Label */}
        {collapsed ? (
          <div className="my-3 w-8 border-t border-border/60" />
        ) : (
          <div className="mt-6 px-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">
            Clinical Workspace
          </div>
        )}

        {/* Nav Items with Active Highlight & Tooltip on Hover */}
        {collapsed ? (
          <nav className="mt-1 flex flex-1 flex-col items-center gap-2 w-full">
            {navItems.map((n) => (
              <div key={n.to} className="relative group flex justify-center w-full">
                <Link
                  to={n.to}
                  aria-label={n.label}
                  className="relative flex h-11 w-11 items-center justify-center rounded-xl text-sidebar-foreground/80 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:scale-95"
                  activeProps={{
                    className:
                      "bg-primary-soft text-primary font-bold shadow-xs ring-1 ring-primary/25 [&>svg]:text-primary [&>.active-bar]:block",
                  }}
                >
                  <span className="active-bar absolute -left-2 top-2 bottom-2 w-1 rounded-r-full bg-primary hidden" />
                  <n.icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                </Link>
                <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden rounded-xl border border-border/80 bg-popover px-3 py-1.5 text-xs font-bold text-popover-foreground shadow-xl z-50 whitespace-nowrap group-hover:block animate-in fade-in zoom-in-95 duration-150">
                  {n.label}
                </div>
              </div>
            ))}
          </nav>
        ) : (
          <nav className="mt-2 flex flex-1 flex-col gap-1.5 w-full">
            {navItems.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-sidebar-foreground/80 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                activeProps={{
                  className:
                    "bg-primary-soft text-primary font-bold shadow-xs [&>svg]:text-primary",
                }}
              >
                <n.icon className="h-4.5 w-4.5 transition-transform group-hover:scale-105" />
                <span className="truncate">{n.label}</span>
              </Link>
            ))}
          </nav>
        )}

        {/* Footer: Theme, User & Sign Out */}
        {collapsed ? (
          <div className="mt-auto flex flex-col items-center gap-2.5 w-full pb-1">
            <div className="relative group">
              <ThemeButton theme={theme} onClick={toggleTheme} />
              <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden rounded-xl border border-border/80 bg-popover px-3 py-1.5 text-xs font-bold text-popover-foreground shadow-xl z-50 whitespace-nowrap group-hover:block animate-in fade-in zoom-in-95 duration-150">
                Switch to {theme === "dark" ? "light" : "dark"} mode
              </div>
            </div>

            <div className="relative group">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-xs font-extrabold text-primary ring-1 ring-primary/20 cursor-default transition-transform hover:scale-105">
                {userInitials}
              </div>
              <div className="pointer-events-none absolute left-full ml-3 bottom-0 hidden rounded-xl border border-border/80 bg-popover p-2.5 text-xs font-semibold text-popover-foreground shadow-xl z-50 whitespace-nowrap group-hover:block animate-in fade-in zoom-in-95 duration-150">
                <p className="font-bold text-foreground">
                  {me?.profile?.full_name || "Staff Member"}
                </p>
                <p className="text-[11px] text-muted-foreground">{me?.user.email}</p>
                <p className="mt-1 text-[10px] font-bold uppercase text-primary">
                  {isAdmin ? "Admin" : "Staff"}
                </p>
              </div>
            </div>

            <div className="relative group">
              <button
                type="button"
                onClick={() => setLogoutOpen(true)}
                aria-label="Sign out"
                className="grid h-10 w-10 place-items-center rounded-xl border border-border/60 bg-muted/40 text-muted-foreground hover:bg-destructive-soft hover:border-destructive/20 hover:text-destructive transition-all active:scale-95"
              >
                <LogOut className="h-4 w-4" />
              </button>
              <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden rounded-xl border border-border/80 bg-popover px-3 py-1.5 text-xs font-bold text-destructive shadow-xl z-50 whitespace-nowrap group-hover:block animate-in fade-in zoom-in-95 duration-150">
                Sign out
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-auto rounded-2xl border border-sidebar-border/80 bg-card/75 p-3.5 shadow-xs w-full">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-xs font-bold text-primary ring-1 ring-primary/20">
                {userInitials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-foreground">
                  {me?.profile?.full_name || me?.user.email}
                </p>
                <div className="flex items-center gap-1 text-[11px] font-medium capitalize text-muted-foreground">
                  {isAdmin ? (
                    <span className="flex items-center gap-1 text-primary font-semibold">
                      <Shield className="h-3 w-3" /> Admin
                    </span>
                  ) : (
                    <span>{me?.roles.length ? me.roles.join(", ") : "Staff"}</span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setLogoutOpen(true)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border/60 bg-muted/40 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:bg-destructive-soft hover:border-destructive/20 hover:text-destructive active:scale-95"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        )}
      </aside>

      {/* Main Container */}
      <main className="min-w-0 flex-1 pb-28 md:pb-12">
        {/* Mobile Header (PWA native style) */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/70 bg-background/85 px-4 py-3 backdrop-blur-xl md:hidden">
          <Logo />
          <div className="flex items-center gap-1.5">
            <OfflineIndicator />
            <ThemeButton theme={theme} onClick={toggleTheme} />
            <button
              onClick={() => setLogoutOpen(true)}
              aria-label="Account & Sign out"
              className="grid h-9 w-9 place-items-center rounded-xl bg-muted/60 text-muted-foreground transition-colors hover:bg-destructive-soft hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Content Viewport */}
        <div className="mx-auto w-full max-w-[1440px] px-4 pt-5 sm:px-6 md:pt-7 lg:px-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation Dock (PWA App feel) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/90 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-8px_25px_-10px_rgba(0,0,0,0.12)] backdrop-blur-xl md:hidden">
        <div className={`grid ${isAdmin ? "grid-cols-5" : "grid-cols-4"} px-2 py-1`}>
          {navItems.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="group flex flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium text-muted-foreground transition-all active:scale-95"
              activeProps={{
                className: "text-primary font-bold [&>span]:scale-105",
              }}
            >
              <span className="grid h-7 w-7 place-items-center rounded-xl transition-colors group-active:bg-muted">
                <n.icon className="h-5 w-5 transition-transform" />
              </span>
              <span className="truncate max-w-[64px] text-center">{n.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Sign Out Confirmation Dialog */}
      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent className="rounded-3xl border-border bg-card p-6 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Sign out of Mamakare?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              You will need your staff email and password to access clinical patient records again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void handleSignOut()}
            >
              Sign out
            </AlertDialogAction>
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
      className="grid h-9 w-9 place-items-center rounded-xl border border-border/50 bg-card/60 text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-95"
    >
      {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
