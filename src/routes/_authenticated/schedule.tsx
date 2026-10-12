import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2,
  CalendarCheck2,
  CalendarDays,
  Clock3,
  Home,
  MapPin,
  UsersRound,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Empty, Loading, Pill, Section } from "@/components/ui-kit";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatDateTime, formatTime } from "@/lib/clinical";

export const Route = createFileRoute("/_authenticated/schedule")({
  head: () => ({ meta: [{ title: "Schedule — Mamakare" }] }),
  component: Schedule,
});

function Schedule() {
  const [status, setStatus] = useState<"all" | "scheduled" | "completed" | "cancelled">("all");
  const { data, isLoading } = useQuery({
    queryKey: ["schedule"],
    queryFn: async () => {
      const result = await supabase
        .from("appointments")
        .select("*, patients(id,first_name,last_name,village_town)")
        .order("scheduled_at", { ascending: true })
        .limit(100);
      if (result.error) throw new Error(result.error.message);
      return result.data ?? [];
    },
  });

  const visibleAppointments = useMemo(
    () => data?.filter((appointment) => status === "all" || appointment.status === status) ?? [],
    [data, status],
  );
  const grouped = useMemo(() => {
    return visibleAppointments.reduce<Record<string, typeof visibleAppointments>>(
      (groups, appointment) => {
        const key = new Date(appointment.scheduled_at).toDateString();
        (groups[key] ??= []).push(appointment);
        return groups;
      },
      {},
    );
  }, [visibleAppointments]);
  const todayKey = new Date().toDateString();
  const todayCount =
    data?.filter((appointment) => new Date(appointment.scheduled_at).toDateString() === todayKey)
      .length ?? 0;
  const homeVisits = data?.filter((appointment) => appointment.location === "home").length ?? 0;
  const scheduledCount =
    data?.filter((appointment) => appointment.status === "scheduled").length ?? 0;

  return (
    <div className="w-full space-y-6 pb-8">
      <div className="relative overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground shadow-lg shadow-primary/10 md:p-8">
        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium text-primary-foreground/70">Care coordination</p>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Schedule</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-primary-foreground/75">
              Keep clinic appointments and home visits organized, visible, and easy to act on.
            </p>
          </div>
          <CalendarDays className="hidden h-16 w-16 text-white/15 sm:block" strokeWidth={1} />
        </div>
        <CalendarCheck2
          className="absolute -bottom-8 -right-2 h-44 w-44 text-white/10"
          strokeWidth={1}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniStat label="Today" value={todayCount} icon={CalendarCheck2} />
        <MiniStat label="Scheduled" value={scheduledCount} icon={Clock3} />
        <MiniStat label="Home visits" value={homeVisits} icon={Home} />
        <MiniStat label="All appointments" value={data?.length ?? 0} icon={UsersRound} />
      </div>

      <Section title="Appointment list" action={<CalendarDays className="h-4 w-4 text-primary" />}>
        <div className="mb-5 flex gap-2 overflow-x-auto border-b border-border/70 pb-4">
          {(["all", "scheduled", "completed", "cancelled"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setStatus(item)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${status === item ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}
            >
              {item === "all" ? "All appointments" : item}
            </button>
          ))}
        </div>
        {isLoading ? (
          <Loading />
        ) : !data?.length ? (
          <Empty>No appointments recorded.</Empty>
        ) : !visibleAppointments.length ? (
          <Empty>No {status} appointments found.</Empty>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([day, appointments]) => {
              const isToday = day === todayKey;
              return (
                <section key={day}>
                  <div className="mb-3 flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${isToday ? "bg-primary" : "bg-border"}`}
                    />
                    <h2 className="text-sm font-bold">{isToday ? "Today" : formatDate(day)}</h2>
                    <span className="text-xs text-muted-foreground">
                      {appointments.length} appointment{appointments.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {appointments.map((appointment) => (
                      <li key={appointment.id}>
                        <Link
                          to="/patients/$id"
                          params={{ id: appointment.patient_id }}
                          className="group flex flex-col gap-3 rounded-2xl border border-border/70 bg-muted/20 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card hover:shadow-md sm:flex-row sm:items-center"
                        >
                          <span className="flex shrink-0 items-center gap-3 sm:w-28">
                            <span className="grid h-11 w-14 place-items-center rounded-xl bg-primary-soft text-xs font-bold text-primary">
                              {formatTime(appointment.scheduled_at)}
                            </span>
                            <span className="hidden text-xs text-muted-foreground sm:block">
                              {appointment.appointment_type}
                            </span>
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-semibold">
                              {appointment.patients?.first_name} {appointment.patients?.last_name}
                            </span>
                            <span className="mt-1 flex items-center gap-1 text-xs capitalize text-muted-foreground">
                              {appointment.location === "home" ? (
                                <Home className="h-3.5 w-3.5" />
                              ) : (
                                <Building2 className="h-3.5 w-3.5" />
                              )}
                              {appointment.location === "home" ? "Home visit" : "Facility visit"}
                              {appointment.location === "home" && appointment.patients?.village_town
                                ? ` · ${appointment.patients.village_town}`
                                : ""}
                            </span>
                          </span>
                          <span className="flex items-center justify-between gap-3 sm:justify-end">
                            <Pill
                              tone={
                                appointment.status === "completed"
                                  ? "success"
                                  : appointment.status === "cancelled"
                                    ? "urgent"
                                    : "primary"
                              }
                            >
                              {appointment.status}
                            </Pill>
                            <MapPin className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </Section>
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
  icon: typeof CalendarDays;
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
