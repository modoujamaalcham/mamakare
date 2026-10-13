import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useState } from "react";
import {
  Plus,
  Search,
  ChevronRight,
  MapPin,
  Phone,
  UsersRound,
  X,
  Baby,
  UserCheck,
  HeartPulse,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader, Pill, Empty, Loading, riskTone } from "@/components/ui-kit";
import { usePatients } from "@/lib/db";
import { age, formatGA, gestationalAge } from "@/lib/clinical";

export const Route = createFileRoute("/_authenticated/patients/")({
  validateSearch: z.object({ q: z.string().optional() }),
  head: () => ({ meta: [{ title: "Patients — Mamakare" }] }),
  component: Patients,
});

function Patients() {
  const { q = "" } = Route.useSearch();
  const navigate = useNavigate({ from: "/patients/" });
  const { data, isLoading, error } = usePatients(q);
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const visiblePatients = data?.filter((patient) => status === "all" || patient.status === status);

  const activeCount = data?.filter((p) => p.status === "active").length ?? 0;
  const pregnantCount =
    data?.filter((p) => p.pregnancies.some((preg) => preg.status === "active")).length ?? 0;

  return (
    <div className="space-y-6 pb-6">
      <PageHeader
        title="Patients"
        subtitle="Manage patient clinical records, maternal care progress, and follow-up in one place."
        badge={
          data ? (
            <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
              {data.length} registered
            </span>
          ) : null
        }
        action={
          <Button asChild size="default" className="gap-2 rounded-xl shadow-xs">
            <Link to="/patients/new">
              <Plus className="h-4 w-4" />
              <span>Register patient</span>
            </Link>
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="card-surface p-3 sm:p-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) =>
                navigate({ search: { q: e.target.value || undefined }, replace: true })
              }
              placeholder="Search by patient name, phone, or ID (e.g. MK-2610)..."
              className="h-11 rounded-xl border-border/70 bg-muted/40 pl-10 pr-9 text-sm shadow-none focus-visible:bg-background"
            />
            {q && (
              <button
                type="button"
                onClick={() => navigate({ search: { q: undefined }, replace: true })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(["all", "active", "inactive"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold capitalize transition-all ${
                  status === s
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "border border-border/60 bg-card/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {s === "all" ? "All Patients" : s}
              </button>
            ))}
          </div>
        </div>

        {/* Quick summary strip */}
        {!isLoading && !error && data && (
          <div className="flex flex-wrap items-center justify-between border-t border-border/50 pt-2.5 text-xs text-muted-foreground">
            <p>
              Showing <strong className="text-foreground">{visiblePatients?.length ?? 0}</strong> of{" "}
              {data.length} patients
            </p>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <UserCheck className="h-3.5 w-3.5 text-success" />
                {activeCount} active
              </span>
              <span className="flex items-center gap-1">
                <HeartPulse className="h-3.5 w-3.5 text-primary" />
                {pregnantCount} pregnant
              </span>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <Loading count={4} />
      ) : error ? (
        <Empty>Could not load patients: {error.message}</Empty>
      ) : !visiblePatients?.length ? (
        <Empty icon={UsersRound}>
          {q || status !== "all"
            ? "No patients match these search filters. Try clearing your query."
            : "No patients registered yet. Start by creating the first patient record."}
        </Empty>
      ) : (
        <div className="grid gap-4.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {visiblePatients.map((p) => {
            const preg = p.pregnancies.find((x) => x.status === "active");
            const ga = gestationalAge(preg?.lmp_date);
            const initials = `${p.first_name?.[0] || ""}${p.last_name?.[0] || ""}`.toUpperCase();

            return (
              <div key={p.id} className="group">
                <Link
                  to="/patients/$id"
                  params={{ id: p.id }}
                  className="card-interactive flex h-full flex-col justify-between p-5 rounded-2xl border border-border/70 bg-card hover:border-primary/40 hover:shadow-elevated transition-all"
                >
                  <div className="space-y-3.5">
                    {/* Top Row: Avatar & Status Pill */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 text-base font-extrabold text-primary ring-1 ring-primary/20 shadow-xs">
                        {initials}
                      </div>
                      <div className="flex items-center gap-2">
                        <Pill tone={p.status === "active" ? "success" : "neutral"} withDot>
                          {p.status}
                        </Pill>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/60 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                      </div>
                    </div>

                    {/* Patient Name & Clinical Metadata */}
                    <div>
                      <h3 className="truncate text-base font-bold text-foreground group-hover:text-primary transition-colors tracking-tight">
                        {p.first_name} {p.last_name}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="font-mono bg-muted/70 text-muted-foreground px-1.5 py-0.5 rounded text-[11px] font-semibold">
                          {p.patient_number}
                        </span>
                        {age(p.date_of_birth) != null && (
                          <>
                            <span>·</span>
                            <span className="font-medium">{age(p.date_of_birth)} yrs</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Maternal Care & Gestational Strip */}
                    {preg ? (
                      <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary-soft/40 to-primary-soft/10 p-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 font-bold text-primary">
                            <Baby className="h-4 w-4" />
                            {formatGA(ga)}
                          </span>
                          <Pill tone={riskTone(preg.risk_level)} withDot>
                            {preg.risk_level} risk
                          </Pill>
                        </div>
                        {ga && (
                          <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-[10px] font-semibold text-muted-foreground">
                              <span>Week {ga.weeks} of 40</span>
                              <span>{Math.round((ga.weeks / 40) * 100)}%</span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary/20">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-300"
                                style={{
                                  width: `${Math.min(Math.max((ga.weeks / 40) * 100, 5), 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                            <HeartPulse className="h-3.5 w-3.5 text-primary/70" />
                            Routine Care
                          </span>
                          <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Non-pregnant
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground/75 truncate">
                          General patient wellness & clinical follow-up
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Contact Footer */}
                  <div className="mt-4 grid gap-1.5 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                    {p.phone && (
                      <div className="flex items-center gap-2 truncate">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <span className="truncate font-medium">{p.phone}</span>
                      </div>
                    )}
                    {p.village_town && (
                      <div className="flex items-center gap-2 truncate">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                        <span className="truncate">
                          {p.village_town}
                          {p.region ? `, ${p.region}` : ""}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
