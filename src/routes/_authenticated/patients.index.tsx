import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useState } from "react";
import {
  Plus,
  Search,
  ChevronRight,
  MapPin,
  Phone,
  SlidersHorizontal,
  UsersRound,
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patients"
        subtitle="Manage patient records and follow-up care in one place."
        action={
          <Button asChild className="shrink-0">
            <Link to="/patients/new">
              <Plus className="h-4 w-4" />{" "}
              <span className="hidden sm:inline">Register patient</span>
              <span className="sm:hidden">New</span>
            </Link>
          </Button>
        }
      />
      <div className="card-surface flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={q}
            onChange={(e) =>
              navigate({ search: { q: e.target.value || undefined }, replace: true })
            }
            placeholder="Search by name, phone or patient number"
            className="h-11 border-0 bg-muted/50 pl-10 shadow-none focus-visible:ring-1"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="ml-1 h-4 w-4 text-muted-foreground" />
          <select
            aria-label="Filter patients by status"
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="all">All patients</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
      {!isLoading && !error && data && (
        <p className="text-sm text-muted-foreground">
          {visiblePatients?.length ?? 0} patient{visiblePatients?.length === 1 ? "" : "s"} found
        </p>
      )}
      {isLoading ? (
        <Loading />
      ) : error ? (
        <Empty>Could not load patients: {error.message}</Empty>
      ) : !visiblePatients?.length ? (
        <Empty>
          {q || status !== "all"
            ? "No patients match these filters."
            : "No patients yet. Register your first patient."}
        </Empty>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visiblePatients.map((p) => {
            const preg = p.pregnancies.find((x) => x.status === "active");
            const ga = gestationalAge(preg?.lmp_date);
            return (
              <li key={p.id} className="group">
                <Link
                  to="/patients/$id"
                  params={{ id: p.id }}
                  className="card-surface block h-full p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-sm font-bold text-primary">
                      {p.first_name[0]}
                      {p.last_name[0]}
                    </span>
                    <span className="flex items-center gap-2">
                      <Pill tone={p.status === "active" ? "success" : "neutral"}>{p.status}</Pill>
                      <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </span>
                  <span className="mt-4 block min-w-0">
                    <span className="block truncate text-base font-semibold">
                      {p.first_name} {p.last_name}
                    </span>
                    <span className="mt-1 block truncate text-xs text-muted-foreground">
                      {p.patient_number}
                      {age(p.date_of_birth) != null ? ` · ${age(p.date_of_birth)} years` : ""}
                    </span>
                  </span>
                  <span className="mt-5 grid gap-2 border-t border-border/70 pt-4 text-xs text-muted-foreground">
                    {p.phone && (
                      <span className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5" />
                        {p.phone}
                      </span>
                    )}
                    {p.village_town && (
                      <span className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5" />
                        {p.village_town}
                        {p.region ? `, ${p.region}` : ""}
                      </span>
                    )}
                    {preg ? (
                      <span className="flex items-center gap-2">
                        <UsersRound className="h-3.5 w-3.5" />
                        <Pill tone={riskTone(preg.risk_level)}>
                          {formatGA(ga)} · {preg.risk_level} risk
                        </Pill>
                      </span>
                    ) : (
                      <span className="text-muted-foreground/70">No active pregnancy recorded</span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
