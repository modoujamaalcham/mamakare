import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock3,
  KeyRound,
  MailPlus,
  ShieldCheck,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Section, Empty, Loading, Pill, MetricCard } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/staff")({
  ssr: false,
  beforeLoad: async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) throw redirect({ to: "/auth" });
    const { data: admin } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.session.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!admin) throw redirect({ to: "/dashboard" });
  },
  head: () => ({ meta: [{ title: "Staff & access — Mamakare" }] }),
  component: StaffAdministration,
});

function StaffAdministration() {
  const qc = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "doctor" | "nurse">("nurse");
  const [busy, setBusy] = useState(false);
  const [resetTarget, setResetTarget] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const invites = useQuery({
    queryKey: ["staff-invites"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_invites")
        .select("id,email,role,expires_at,accepted_at,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const members = useQuery({
    queryKey: ["staff-members"],
    queryFn: async () => {
      const [profiles, roles] = await Promise.all([
        supabase.from("profiles").select("id,full_name,email,phone").order("full_name"),
        supabase.from("user_roles").select("user_id,role"),
      ]);
      if (profiles.error) throw profiles.error;
      if (roles.error) throw roles.error;
      return (profiles.data ?? []).map((profile) => ({
        ...profile,
        role: roles.data?.find((item) => item.user_id === profile.id)?.role ?? "unassigned",
      }));
    },
  });

  async function createStaff(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.functions.invoke("admin-create-staff", {
      body: { full_name: fullName.trim(), email: email.trim().toLowerCase(), password, role },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setFullName("");
    setEmail("");
    setPassword("");
    toast.success("Staff account created. They can sign in immediately.");
    await qc.invalidateQueries({ queryKey: ["staff-members"] });
  }

  async function resetStaffPassword(event: React.FormEvent) {
    event.preventDefault();
    if (!resetTarget) return;
    setBusy(true);
    const { error } = await supabase.functions.invoke("admin-reset-password", {
      body: { user_id: resetTarget, password: resetPassword },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setResetTarget(null);
    setResetPassword("");
    toast.success("Staff password reset successfully.");
  }

  const accepted = invites.data?.filter((invite) => invite.accepted_at).length ?? 0;
  const pending =
    invites.data?.filter(
      (invite) => !invite.accepted_at && new Date(invite.expires_at) >= new Date(),
    ).length ?? 0;
  const expired =
    invites.data?.filter(
      (invite) => !invite.accepted_at && new Date(invite.expires_at) < new Date(),
    ).length ?? 0;

  return (
    <div className="w-full space-y-6 pb-8">
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary via-primary/95 to-primary/85 p-6 text-primary-foreground shadow-lg shadow-primary/10 md:p-8">
        <div className="relative z-10 flex items-end justify-between gap-5">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary-foreground/80">
              Healthcare Team Access
            </p>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl font-display">
              Staff & Access
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-primary-foreground/85">
              Manage verified clinical staff accounts, permissions, and credential access controls.
            </p>
          </div>
          <UsersRound className="hidden h-16 w-16 text-white/15 sm:block" strokeWidth={1} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <MetricCard
          label="Accepted"
          value={accepted}
          icon={CheckCircle2}
          tone="success"
          hint="Active staff"
        />
        <MetricCard
          label="Pending"
          value={pending}
          icon={Clock3}
          tone="warning"
          hint="Awaiting setup"
        />
        <MetricCard
          label="Expired"
          value={expired}
          icon={MailPlus}
          tone="neutral"
          hint="Past 7 days"
        />
      </div>

      <Section title="Staff accounts" action={<UsersRound className="h-4 w-4 text-primary" />}>
        {members.isLoading ? (
          <Loading />
        ) : members.data?.length ? (
          <ul className="divide-y divide-border/70">
            {members.data.map((member) => (
              <li
                key={member.id}
                className="flex flex-wrap items-center justify-between gap-3 py-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                    <UsersRound className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {member.full_name?.trim() ||
                        member.email ||
                        `Staff account · ${member.id.slice(0, 8)}`}
                    </p>
                    <p className="mt-1 text-xs capitalize text-muted-foreground">{member.role}</p>
                  </div>
                </div>
                {resetTarget === member.id ? (
                  <form onSubmit={resetStaffPassword} className="flex w-full gap-2 sm:w-auto">
                    <Input
                      type="password"
                      minLength={8}
                      required
                      value={resetPassword}
                      onChange={(event) => setResetPassword(event.target.value)}
                      placeholder="New password"
                      className="h-9 w-full rounded-lg sm:w-40"
                    />
                    <Button type="submit" size="sm" disabled={busy} className="rounded-lg">
                      Save
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setResetTarget(null)}
                    >
                      Cancel
                    </Button>
                  </form>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-lg"
                    onClick={() => setResetTarget(member.id)}
                  >
                    <KeyRound className="h-4 w-4" /> Reset password
                  </Button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <Empty>No staff accounts found.</Empty>
        )}
      </Section>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Section title="Recent invitations" action={<MailPlus className="h-4 w-4 text-primary" />}>
          {invites.isLoading ? (
            <Loading />
          ) : invites.data?.length ? (
            <ul className="divide-y divide-border/70">
              {invites.data.map((invite) => {
                const expiredInvite =
                  !invite.accepted_at && new Date(invite.expires_at) < new Date();
                return (
                  <li
                    key={invite.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                        <MailPlus className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{invite.email}</p>
                        <p className="mt-1 text-xs capitalize text-muted-foreground">
                          {invite.role} · Expires{" "}
                          {new Date(invite.expires_at).toLocaleDateString("en-GB")}
                        </p>
                      </div>
                    </div>
                    <Pill
                      tone={invite.accepted_at ? "success" : expiredInvite ? "warning" : "primary"}
                    >
                      {invite.accepted_at ? "Accepted" : expiredInvite ? "Expired" : "Pending"}
                    </Pill>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Empty>No staff invitations yet.</Empty>
          )}
        </Section>

        <Section
          title="Create staff account"
          action={<UserPlus className="h-4 w-4 text-primary" />}
        >
          <form onSubmit={createStaff} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="staff-name">Full name</Label>
              <Input
                id="staff-name"
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Kemo Ceesay"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-email">Email address</Label>
              <Input
                id="staff-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="clinician@clinic.gm"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-password">Temporary password</Label>
              <Input
                id="staff-password"
                type="password"
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-role">Role</Label>
              <select
                id="staff-role"
                value={role}
                onChange={(event) => setRole(event.target.value as "admin" | "doctor" | "nurse")}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm capitalize"
              >
                <option value="admin">Administrator</option>
                <option value="nurse">Nurse</option>
                <option value="doctor">Doctor</option>
              </select>
            </div>
            <Button type="submit" disabled={busy} className="h-11 w-full rounded-xl">
              <UserPlus className="h-4 w-4" /> {busy ? "Creating…" : "Create staff account"}
            </Button>
          </form>
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-primary-soft/60 p-3 text-xs leading-5 text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Accounts are created as
            confirmed Supabase users. Only administrators can create accounts or reset passwords.
          </p>
        </Section>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof MailPlus;
}) {
  return (
    <div className="card-surface p-4 md:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <span className="rounded-lg bg-primary-soft p-2 text-primary">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}
