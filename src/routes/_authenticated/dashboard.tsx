import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Search,
  Plus,
  Home as HomeIcon,
  Building2,
  AlertTriangle,
  BarChart3,
  FlaskConical,
  Activity,
  CalendarCheck2,
  ChevronRight,
  Clock3,
  MapPin,
  ShieldAlert,
  Stethoscope,
} from "lucide-react";
import {
  Bar,
  BarChart as RechartsBarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader, Section, Pill, Empty, Loading } from "@/components/ui-kit";
import { formatTime, formatDate, formatGA, gestationalAge } from "@/lib/clinical";
import { useMe } from "@/lib/db";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Today — Mamakare" }] }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const { data: me } = useMe();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const since = new Date(Date.now() - 14 * 864e5).toISOString();
      const [today, overdue, flagged, pending, active] = await Promise.all([
        supabase
          .from("appointments")
          .select("*, patients(id,first_name,last_name,village_town)")
          .eq("status", "scheduled")
          .gte("scheduled_at", start.toISOString())
          .lt("scheduled_at", end.toISOString())
          .order("scheduled_at"),
        supabase
          .from("appointments")
          .select("*, patients(id,first_name,last_name)")
          .eq("status", "scheduled")
          .lt("scheduled_at", start.toISOString())
          .order("scheduled_at")
          .limit(20),
        supabase
          .from("encounters")
          .select("id,visit_date,danger_flags,patients(id,first_name,last_name)")
          .gte("visit_date", since)
          .filter("danger_flags", "neq", "{}")
          .order("visit_date", { ascending: false })
          .limit(10),
        supabase
          .from("investigations")
          .select("id,name,status,due_date,abnormal,patients(id,first_name,last_name)")
          .in("status", ["recommended", "ordered", "completed"])
          .order("due_date", { nullsFirst: false })
          .limit(15),
        supabase
          .from("pregnancies")
          .select("id,lmp_date,risk_level", { count: "exact" })
          .eq("status", "active"),
      ]);
      return {
        today: today.data ?? [],
        overdue: overdue.data ?? [],
        flagged: flagged.data ?? [],
        pending: pending.data ?? [],
        activeCount: active.count ?? 0,
        highRisk: (active.data ?? []).filter((p) => p.risk_level === "high").length,
        nearTerm: (active.data ?? []).filter((p) => (gestationalAge(p.lmp_date)?.weeks ?? 0) >= 36)
          .length,
        riskBreakdown: ["low", "moderate", "high"].map((risk) => ({
          name: risk === "low" ? "Low risk" : risk === "moderate" ? "Moderate risk" : "High risk",
          value: (active.data ?? []).filter((p) => p.risk_level === risk).length,
          tone: risk,
        })),
      };
    },
  });

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const name = me?.profile?.full_name?.split(" ")[0];

  return (
    <div className="space-y-6 pb-8">
      <div className="relative overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground shadow-lg shadow-primary/10 md:p-8">
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium text-primary-foreground/70">
              {new Intl.DateTimeFormat("en-GB", {
                timeZone: "Africa/Banjul",
                dateStyle: "full",
              }).format(new Date())}
            </p>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              {greet}
              {name ? `, ${name}` : ""}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-primary-foreground/75">
              Keep today’s care work moving with a quick view of visits, follow-ups, and patient
              safety signals.
            </p>
          </div>
          <Button
            asChild
            variant="secondary"
            className="h-11 rounded-xl bg-white/15 text-primary-foreground shadow-none hover:bg-white/25"
          >
            <Link to="/patients/new">
              <Plus className="h-4 w-4" /> New patient
            </Link>
          </Button>
        </div>
        <Activity
          className="absolute -bottom-10 -right-3 h-48 w-48 text-white/10"
          strokeWidth={1}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ to: "/patients", search: { q } });
          }}
          className="relative"
        >
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search patient by name, phone or patient number"
            className="h-12 rounded-xl border-border/80 bg-card pl-11 shadow-sm"
          />
        </form>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="h-12 flex-1 rounded-xl bg-card sm:flex-none">
            <Link to="/patients">
              <Stethoscope className="h-4 w-4" /> Patients
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-12 flex-1 rounded-xl bg-card sm:flex-none">
            <Link to="/schedule">
              <CalendarCheck2 className="h-4 w-4" /> Schedule
            </Link>
          </Button>
        </div>
      </div>

      {isLoading || !data ? (
        <Loading />
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat
              label="Today's visits"
              value={data.today.length}
              icon={CalendarCheck2}
              hint="Scheduled today"
            />
            <Stat
              label="Overdue"
              value={data.overdue.length}
              tone={data.overdue.length ? "warning" : undefined}
              icon={Clock3}
              hint={data.overdue.length ? "Needs follow-up" : "All caught up"}
            />
            <Stat
              label="Active pregnancies"
              value={data.activeCount}
              icon={Activity}
              hint="Currently enrolled"
            />
            <Stat
              label="High risk"
              value={data.highRisk}
              tone={data.highRisk ? "urgent" : undefined}
              icon={ShieldAlert}
              hint={`${data.nearTerm} at 36+ weeks`}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <Section
              title="Workload overview"
              action={<BarChart3 className="h-4 w-4 text-primary" />}
            >
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={[
                      { name: "Visits", value: data.today.length, fill: "var(--chart-primary)" },
                      { name: "Overdue", value: data.overdue.length, fill: "var(--chart-warning)" },
                      { name: "Alerts", value: data.flagged.length, fill: "var(--chart-danger)" },
                      { name: "Tests", value: data.pending.length, fill: "var(--chart-secondary)" },
                    ]}
                    margin={{ top: 12, right: 8, left: -18, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                    />
                    <YAxis
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                    />
                    <Tooltip
                      cursor={{ fill: "var(--muted)", opacity: 0.5 }}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid var(--border)",
                        background: "var(--card)",
                        color: "var(--foreground)",
                        boxShadow: "var(--shadow-card)",
                      }}
                      labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={42} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Current clinical workload across today’s key queues.
              </p>
            </Section>

            <Section
              title="Pregnancy risk mix"
              action={<Activity className="h-4 w-4 text-primary" />}
            >
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
                <div className="h-52 w-full max-w-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.riskBreakdown}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={58}
                        outerRadius={82}
                        paddingAngle={4}
                        stroke="var(--card)"
                        strokeWidth={4}
                      >
                        {data.riskBreakdown.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={
                              entry.tone === "high"
                                ? "var(--chart-danger)"
                                : entry.tone === "moderate"
                                  ? "var(--chart-warning)"
                                  : "var(--chart-primary)"
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid var(--border)",
                          background: "var(--card)",
                          color: "var(--foreground)",
                          boxShadow: "var(--shadow-card)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full space-y-3">
                  {data.riskBreakdown.map((entry) => (
                    <div
                      key={entry.name}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${entry.tone === "high" ? "bg-destructive" : entry.tone === "moderate" ? "bg-warning" : "bg-primary"}`}
                        />
                        {entry.name}
                      </span>
                      <span className="font-semibold">{entry.value}</span>
                    </div>
                  ))}
                  <div className="border-t border-border/70 pt-3 text-xs text-muted-foreground">
                    {data.activeCount} active {data.activeCount === 1 ? "pregnancy" : "pregnancies"}{" "}
                    tracked
                  </div>
                </div>
              </div>
            </Section>
          </div>

          {data.flagged.length > 0 && (
            <Section
              title="Needs attention"
              action={<AlertTriangle className="h-4 w-4 text-destructive" />}
              className="border-destructive/20 bg-destructive-soft/20"
            >
              <ul className="divide-y divide-destructive/10">
                {data.flagged.map((e) => (
                  <li key={e.id}>
                    <Link
                      to="/patients/$id"
                      params={{ id: e.patients!.id }}
                      className="group flex flex-col gap-2 rounded-xl py-3 transition-colors hover:bg-destructive-soft/40 sm:flex-row sm:items-center sm:justify-between sm:px-2"
                    >
                      <span>
                        <span className="block font-semibold">
                          {e.patients?.first_name} {e.patients?.last_name}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          Visit recorded {formatDate(e.visit_date)}
                        </span>
                      </span>
                      <span className="flex items-center justify-between gap-3">
                        <span className="flex flex-wrap gap-1">
                          {e.danger_flags.map((f) => (
                            <Pill key={f} tone="urgent">
                              {f}
                            </Pill>
                          ))}
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <Section
              title="Today's schedule"
              action={
                <Link to="/schedule" className="text-sm text-primary">
                  View all
                </Link>
              }
            >
              {data.today.length === 0 ? (
                <Empty>No visits scheduled today.</Empty>
              ) : (
                <ul className="divide-y divide-border/70">
                  {data.today.map((a) => (
                    <li key={a.id}>
                      <Link
                        to="/patients/$id"
                        params={{ id: a.patient_id }}
                        className="group flex items-center gap-3 rounded-xl py-3 transition-colors hover:bg-muted/50 sm:px-2"
                      >
                        <span className="grid h-11 w-14 shrink-0 place-items-center rounded-xl bg-primary-soft text-xs font-bold text-primary">
                          {formatTime(a.scheduled_at)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">
                            {a.patients?.first_name} {a.patients?.last_name}
                          </span>
                          <span className="block truncate text-xs capitalize text-muted-foreground">
                            {a.appointment_type}
                            {a.location === "home" && a.patients?.village_town
                              ? ` · ${a.patients.village_town}`
                              : ""}
                          </span>
                        </span>
                        <span className="flex items-center gap-2">
                          {a.location === "home" ? (
                            <HomeIcon className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                          )}
                          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title="Overdue follow-ups">
              {data.overdue.length === 0 ? (
                <Empty>Nobody is overdue. </Empty>
              ) : (
                <ul className="divide-y divide-border/70">
                  {data.overdue.map((a) => (
                    <li key={a.id}>
                      <Link
                        to="/patients/$id"
                        params={{ id: a.patient_id }}
                        className="group flex items-center justify-between gap-3 rounded-xl py-3 transition-colors hover:bg-muted/50 sm:px-2"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">
                            {a.patients?.first_name} {a.patients?.last_name}
                          </span>
                          <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" /> Follow-up visit
                          </span>
                        </span>
                        <span className="flex items-center gap-2">
                          <Pill tone="warning">{formatDate(a.scheduled_at)}</Pill>
                          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
            <Section
              title="Outstanding investigations"
              action={<FlaskConical className="h-4 w-4 text-primary" />}
            >
              {data.pending.length === 0 ? (
                <Empty>All investigations are up to date.</Empty>
              ) : (
                <ul className="divide-y divide-border/70">
                  {data.pending.map((i) => (
                    <li key={i.id}>
                      <Link
                        to="/patients/$id"
                        params={{ id: i.patients!.id }}
                        className="group flex items-center justify-between gap-2 rounded-xl py-3 transition-colors hover:bg-muted/50 sm:px-2"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{i.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {i.patients?.first_name} {i.patients?.last_name}
                          </span>
                        </span>
                        <span className="flex items-center gap-2">
                          <Pill
                            tone={
                              i.status === "completed"
                                ? i.abnormal
                                  ? "urgent"
                                  : "primary"
                                : "warning"
                            }
                          >
                            {i.status === "completed" ? "Awaiting review" : i.status}
                          </Pill>
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
            <Section title="Care pulse" action={<Activity className="h-4 w-4 text-primary" />}>
              <div className="space-y-5">
                <Pulse
                  label="Active pregnancies"
                  value={data.activeCount}
                  max={Math.max(data.activeCount, 1)}
                  tone="primary"
                />
                <Pulse
                  label="High-risk cases"
                  value={data.highRisk}
                  max={Math.max(data.activeCount, 1)}
                  tone="urgent"
                />
                <Pulse
                  label="Near term · 36+ weeks"
                  value={data.nearTerm}
                  max={Math.max(data.activeCount, 1)}
                  tone="warning"
                />
                <p className="border-t border-border/70 pt-4 text-xs leading-5 text-muted-foreground">
                  Overview of the active maternity caseload from the latest records.
                </p>
              </div>
            </Section>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  icon: Icon,
  hint,
}: {
  label: string;
  value: number;
  tone?: "warning" | "urgent" | undefined;
  icon: typeof Activity;
  hint?: string | undefined;
}) {
  const color =
    tone === "urgent"
      ? "text-destructive"
      : tone === "warning"
        ? "text-warning"
        : "text-foreground";
  return (
    <div className="card-surface p-4 md:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <span
          className={`rounded-lg p-2 ${tone === "urgent" ? "bg-destructive-soft text-destructive" : tone === "warning" ? "bg-warning-soft text-warning" : "bg-primary-soft text-primary"}`}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className={`mt-3 font-display text-3xl font-bold ${color}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Pulse({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  tone: "primary" | "urgent" | "warning";
}) {
  const fill =
    tone === "urgent" ? "bg-destructive" : tone === "warning" ? "bg-warning" : "bg-primary";
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${fill} transition-all`}
          style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
        />
      </div>
    </div>
  );
}

export { formatGA };
