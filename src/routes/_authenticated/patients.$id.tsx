import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  Download,
  FileText,
  HeartPulse,
  MapPin,
  Phone,
  Share2,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import { Section, Pill, Empty, Loading, riskTone } from "@/components/ui-kit";
import { ReportPreview } from "@/components/report-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useCompanySettings, usePatient } from "@/lib/db";
import { formatDate, formatDateTime, formatGA, gestationalAge } from "@/lib/clinical";
import type { ReportInput } from "@/lib/reports";
import { shareReportImage } from "@/lib/reports";

export const Route = createFileRoute("/_authenticated/patients/$id")({
  head: () => ({ meta: [{ title: "Patient — Mamakare" }] }),
  component: PatientDetail,
});

function PatientDetail() {
  const { id } = Route.useParams();
  const { data, isLoading, error } = usePatient(id);
  const { data: company } = useCompanySettings();
  const [activeReport, setActiveReport] = useState<ReportInput | null>(null);

  if (isLoading) return <Loading />;
  if (error || !data) return <Empty>Could not load this patient record.</Empty>;

  const {
    patient,
    pregnancies,
    encounters,
    investigations,
    appointments,
    prescriptions,
    referrals,
  } = data;
  const activePregnancy = pregnancies.find((pregnancy) => pregnancy.status === "active");
  const ga = gestationalAge(activePregnancy?.lmp_date);
  const reportTitle = `${patient.first_name} ${patient.last_name}`;
  const reportShareText = `Mamakare patient report\n${reportTitle}\nPatient ID: ${patient.patient_number}\nEncounters: ${encounters.length}\nPregnancies: ${pregnancies.length}\nPrescriptions: ${prescriptions.length}\nReferrals: ${referrals.length}`;

  function prescriptionReport(): ReportInput {
    return {
      title: "Prescription report",
      subtitle: `${reportTitle} · ${patient.patient_number}`,
      company,
      sections: [
        {
          title: "Medication items",
          rows: prescriptions.length
            ? prescriptions.map((item) => [
                item.medication,
                [item.dose, item.frequency, item.route, item.duration, item.status]
                  .filter(Boolean)
                  .join(" · "),
              ])
            : [["Status", "No prescriptions recorded"]],
        },
      ],
    };
  }

  function patientReport(): ReportInput {
    return {
      title: "Patient care report",
      subtitle: `${reportTitle} · ${patient.patient_number}`,
      company,
      sections: [
        {
          title: "Patient details",
          rows: [
            ["Name", reportTitle],
            ["Patient ID", patient.patient_number],
            [
              "Date of birth",
              patient.date_of_birth ? formatDate(patient.date_of_birth) : "Not recorded",
            ],
            ["Phone", patient.phone || "Not recorded"],
            [
              "Location",
              [patient.village_town, patient.region].filter(Boolean).join(", ") || "Not recorded",
            ],
            ["Allergies", patient.allergies || "None recorded"],
          ],
        },
        {
          title: "Care summary",
          rows: [
            ["Encounters", String(encounters.length)],
            ["Pregnancies", String(pregnancies.length)],
            ["Investigations", String(investigations.length)],
            ["Appointments", String(appointments.length)],
            ["Prescriptions", String(prescriptions.length)],
            ["Referrals", String(referrals.length)],
          ],
        },
        {
          title: "Prescriptions",
          rows: prescriptions.length
            ? prescriptions.map((item) => [
                item.medication,
                [item.dose, item.frequency, item.duration, item.status].filter(Boolean).join(" · "),
              ])
            : [["Status", "No prescriptions recorded"]],
        },
        {
          title: "Referrals",
          rows: referrals.length
            ? referrals.map((item) => [
                item.destination,
                `${item.urgency} · ${item.status} · ${item.reason}`,
              ])
            : [["Status", "No referrals recorded"]],
        },
      ],
      shareText: reportShareText,
    };
  }

  function generatePrescriptionReport() {
    setActiveReport(prescriptionReport());
  }

  function generatePatientReport() {
    setActiveReport(patientReport());
  }

  async function shareImage(report: ReportInput) {
    try {
      const result = await shareReportImage(report);
      toast.success(
        result === "shared" ? "Report image ready to share" : "Report image downloaded",
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error(error instanceof Error ? error.message : "Unable to create report image");
    }
  }

  return (
    <div className="w-full space-y-5 pb-8">
      <Link
        to="/patients"
        className="inline-flex items-center gap-2 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to patients
      </Link>

      <div className="relative overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground shadow-lg shadow-primary/10 md:p-8">
        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/15 text-xl font-bold">
              {patient.first_name[0]}
              {patient.last_name[0]}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                  {patient.first_name} {patient.last_name}
                </h1>
                <Pill
                  tone={patient.status === "active" ? "success" : "neutral"}
                  className="bg-white/15 text-primary-foreground"
                >
                  {patient.status}
                </Pill>
              </div>
              <p className="mt-1 text-sm text-primary-foreground/75">
                Patient ID · {patient.patient_number}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {patient.phone ? (
              <a
                href={`tel:${patient.phone}`}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white/15 px-4 text-sm font-semibold transition-colors hover:bg-white/25"
              >
                <Phone className="h-4 w-4" /> Call patient
              </a>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              className="h-11 rounded-xl bg-white text-primary hover:bg-white/90"
              onClick={generatePatientReport}
            >
              <Download className="h-4 w-4" /> PDF report
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-11 rounded-xl bg-white/15 text-primary-foreground hover:bg-white/25"
              onClick={() => void shareImage(patientReport())}
            >
              <Share2 className="h-4 w-4" /> WhatsApp
            </Button>
          </div>
        </div>
        <HeartPulse
          className="absolute -bottom-10 -right-2 h-48 w-48 text-white/10"
          strokeWidth={1}
        />
      </div>

      <CareActions patientId={patient.id} pregnancyId={activePregnancy?.id} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniStat label="Encounters" value={encounters.length} icon={ClipboardList} />
        <MiniStat label="Appointments" value={appointments.length} icon={CalendarDays} />
        <MiniStat label="Investigations" value={investigations.length} icon={Activity} />
        <MiniStat label="Pregnancies" value={pregnancies.length} icon={HeartPulse} />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Section
            title="Recent encounters"
            action={
              <Link to="/schedule" className="text-sm font-medium text-primary">
                View schedule
              </Link>
            }
            className="overflow-hidden"
          >
            {encounters.length === 0 ? (
              <Empty>No encounters recorded.</Empty>
            ) : (
              <ul className="divide-y divide-border/70">
                {encounters.slice(0, 10).map((encounter) => (
                  <li key={encounter.id} className="flex items-center gap-3 py-4">
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${encounter.danger_flags.length > 0 ? "bg-destructive-soft text-destructive" : "bg-primary-soft text-primary"}`}
                    >
                      {encounter.danger_flags.length > 0 ? (
                        <ShieldAlert className="h-4 w-4" />
                      ) : (
                        <ClipboardList className="h-4 w-4" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold capitalize">{encounter.visit_type}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {formatDateTime(encounter.visit_date)}
                      </span>
                    </span>
                    {encounter.danger_flags.length > 0 && (
                      <Pill tone="urgent">Needs attention</Pill>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <div className="grid gap-5 md:grid-cols-2">
            <Section title="Investigations" action={<FileText className="h-4 w-4 text-primary" />}>
              {investigations.length === 0 ? (
                <Empty>No investigations recorded.</Empty>
              ) : (
                <ul className="divide-y divide-border/70">
                  {investigations.slice(0, 8).map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 py-3 text-sm"
                    >
                      <span className="min-w-0 truncate font-medium">{item.name}</span>
                      <Pill
                        tone={
                          item.abnormal
                            ? "urgent"
                            : item.status === "completed"
                              ? "success"
                              : "warning"
                        }
                      >
                        {item.status}
                      </Pill>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
            <Section
              title="Appointments"
              action={<CalendarDays className="h-4 w-4 text-primary" />}
            >
              {appointments.length === 0 ? (
                <Empty>No appointments recorded.</Empty>
              ) : (
                <ul className="divide-y divide-border/70">
                  {appointments.slice(0, 8).map((appointment) => (
                    <li
                      key={appointment.id}
                      className="flex items-center justify-between gap-3 py-3 text-sm"
                    >
                      <span className="min-w-0">
                        <span className="block font-medium">
                          {formatDateTime(appointment.scheduled_at)}
                        </span>
                        <span className="mt-0.5 block text-xs capitalize text-muted-foreground">
                          {appointment.appointment_type} · {appointment.location}
                        </span>
                      </span>
                      <Pill>{appointment.status}</Pill>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Section
              title="Prescriptions"
              action={
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={generatePrescriptionReport}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => void shareImage(prescriptionReport())}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              }
            >
              {prescriptions.length === 0 ? (
                <Empty>No prescriptions recorded.</Empty>
              ) : (
                <ul className="divide-y divide-border/70">
                  {prescriptions.slice(0, 8).map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 py-3 text-sm"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{item.medication}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {[item.dose, item.frequency, item.duration].filter(Boolean).join(" · ") ||
                            "Details not recorded"}
                        </span>
                      </span>
                      <Pill tone={item.status === "active" ? "success" : "neutral"}>
                        {item.status}
                      </Pill>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
            <Section
              title="Referrals"
              action={
                <Button type="button" size="icon" variant="ghost" onClick={generatePatientReport}>
                  <Download className="h-4 w-4" />
                </Button>
              }
            >
              {referrals.length === 0 ? (
                <Empty>No referrals recorded.</Empty>
              ) : (
                <ul className="divide-y divide-border/70">
                  {referrals.slice(0, 8).map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 py-3 text-sm"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{item.destination}</span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {item.reason}
                        </span>
                      </span>
                      <Pill tone={item.urgency === "emergency" ? "urgent" : "warning"}>
                        {item.urgency}
                      </Pill>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-24">
          <Section
            title="Active pregnancy"
            action={<HeartPulse className="h-4 w-4 text-primary" />}
            className="overflow-hidden"
          >
            {activePregnancy ? (
              <div className="space-y-4">
                <div className="rounded-2xl bg-primary-soft p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                    Current gestation
                  </p>
                  <div className="mt-2 flex items-end justify-between gap-3">
                    <p className="font-display text-3xl font-bold text-primary">{formatGA(ga)}</p>
                    <Pill tone={riskTone(activePregnancy.risk_level)}>
                      {activePregnancy.risk_level} risk
                    </Pill>
                  </div>
                </div>
                <dl className="space-y-3 text-sm">
                  <Detail
                    label="Due date"
                    value={activePregnancy.edd ? formatDate(activePregnancy.edd) : "Not recorded"}
                  />
                  <Detail
                    label="Last menstrual period"
                    value={
                      activePregnancy.lmp_date
                        ? formatDate(activePregnancy.lmp_date)
                        : "Not recorded"
                    }
                  />
                </dl>
              </div>
            ) : (
              <Empty>No active pregnancy recorded.</Empty>
            )}
          </Section>

          <Section
            title="Patient information"
            action={<UserRound className="h-4 w-4 text-primary" />}
          >
            <dl className="grid gap-4 text-sm">
              <Detail
                label="Date of birth"
                value={patient.date_of_birth ? formatDate(patient.date_of_birth) : "Not recorded"}
              />
              <Detail
                label="Location"
                value={
                  [patient.village_town, patient.region].filter(Boolean).join(", ") ||
                  "Not recorded"
                }
                icon={<MapPin className="h-3.5 w-3.5" />}
              />
              <Detail label="Blood group" value={patient.blood_group || "Not recorded"} />
              <Detail label="Allergies" value={patient.allergies || "None recorded"} />
              <Detail label="Next of kin" value={patient.next_of_kin_name || "Not recorded"} />
              {patient.next_of_kin_phone && (
                <Detail
                  label="Next of kin phone"
                  value={patient.next_of_kin_phone}
                  icon={<Phone className="h-3.5 w-3.5" />}
                />
              )}
            </dl>
          </Section>
        </aside>
      </div>
      {activeReport && (
        <ReportPreview report={activeReport} onClose={() => setActiveReport(null)} />
      )}
    </div>
  );
}

type CareAction =
  "pregnancy" | "encounter" | "investigation" | "appointment" | "prescription" | "referral";

function CareActions({ patientId, pregnancyId }: { patientId: string; pregnancyId?: string }) {
  const [active, setActive] = useState<CareAction | null>(null);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  async function save(action: CareAction, form: HTMLFormElement) {
    setSaving(true);
    const values = new FormData(form);
    let error: { message: string } | null = null;

    if (action === "pregnancy") {
      const result = await supabase.from("pregnancies").insert({
        patient_id: patientId,
        lmp_date: stringOrNull(values.get("lmp_date")),
        edd: stringOrNull(values.get("edd")),
        gravida: numberOrNull(values.get("gravida")),
        parity: numberOrNull(values.get("parity")),
        risk_level: String(values.get("risk_level") || "low"),
        risk_factors: stringOrNull(values.get("risk_factors")),
      });
      error = result.error;
    } else if (action === "encounter") {
      const result = await supabase.from("encounters").insert({
        patient_id: patientId,
        pregnancy_id: pregnancyId ?? null,
        visit_date: new Date(
          String(values.get("visit_date") || new Date().toISOString()),
        ).toISOString(),
        visit_type: String(values.get("visit_type") || "general"),
        location: String(values.get("location") || "clinic"),
        complaints: stringOrNull(values.get("complaints")),
        assessment: stringOrNull(values.get("assessment")),
        plan: stringOrNull(values.get("plan")),
      });
      error = result.error;
    } else if (action === "investigation") {
      const result = await supabase.from("investigations").insert({
        patient_id: patientId,
        pregnancy_id: pregnancyId ?? null,
        name: String(values.get("name") || "Investigation"),
        status: String(values.get("status") || "recommended"),
        due_date: stringOrNull(values.get("due_date")),
        notes: stringOrNull(values.get("notes")),
      });
      error = result.error;
    } else if (action === "appointment") {
      const result = await supabase.from("appointments").insert({
        patient_id: patientId,
        scheduled_at: new Date(String(values.get("scheduled_at"))).toISOString(),
        appointment_type: String(values.get("appointment_type") || "follow_up"),
        location: String(values.get("location") || "clinic"),
        reason: stringOrNull(values.get("reason")),
        notes: stringOrNull(values.get("notes")),
      });
      error = result.error;
    } else if (action === "prescription") {
      const groupId = crypto.randomUUID();
      const medications = values
        .getAll("medication")
        .map((value) => String(value).trim())
        .filter(Boolean);
      const doses = values.getAll("dose");
      const frequencies = values.getAll("frequency");
      const routes = values.getAll("route");
      const durations = values.getAll("duration");
      const result = await supabase.from("prescriptions").insert(
        medications.map((medication, index) => ({
          patient_id: patientId,
          pregnancy_id: pregnancyId ?? null,
          prescription_group_id: groupId,
          medication,
          dose: stringOrNull(doses[index]),
          frequency: stringOrNull(frequencies[index]),
          route: stringOrNull(routes[index]),
          duration: stringOrNull(durations[index]),
          instructions: stringOrNull(values.get("instructions")),
          status: String(values.get("status") || "active"),
        })),
      );
      error = result.error;
    } else {
      const result = await supabase.from("referrals").insert({
        patient_id: patientId,
        pregnancy_id: pregnancyId ?? null,
        destination: String(values.get("destination") || "").trim(),
        reason: String(values.get("reason") || "").trim(),
        urgency: String(values.get("urgency") || "routine"),
        notes: stringOrNull(values.get("notes")),
      });
      error = result.error;
    }

    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${actionLabel(action)} saved`);
    setActive(null);
    await queryClient.invalidateQueries({ queryKey: ["patient", patientId] });
    await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    await queryClient.invalidateQueries({ queryKey: ["schedule"] });
  }

  return (
    <section className="card-surface overflow-hidden">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between md:p-5">
        <div>
          <p className="text-sm font-semibold">Add care record</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Capture the next clinical action for this patient.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {(
            [
              "pregnancy",
              "encounter",
              "investigation",
              "appointment",
              "prescription",
              "referral",
            ] as CareAction[]
          ).map((action) => (
            <Button
              key={action}
              type="button"
              variant={active === action ? "default" : "outline"}
              size="sm"
              className="rounded-xl"
              onClick={() => setActive(active === action ? null : action)}
            >
              {actionLabel(action)}
            </Button>
          ))}
        </div>
      </div>
      {active && (
        <div className="border-t border-border/70 bg-muted/20 p-4 md:p-5">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void save(active, event.currentTarget);
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">{actionLabel(active)}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Required fields are marked with an asterisk.
                </p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setActive(null)}>
                Close
              </Button>
            </div>
            {active === "pregnancy" && <PregnancyFields />}
            {active === "encounter" && <EncounterFields />}
            {active === "investigation" && <InvestigationFields />}
            {active === "appointment" && <AppointmentFields />}
            {active === "prescription" && <PrescriptionFields />}
            {active === "referral" && <ReferralFields />}
            <div className="flex justify-end border-t border-border/70 pt-4">
              <Button type="submit" disabled={saving} className="rounded-xl">
                {saving ? "Saving…" : `Save ${actionLabel(active).toLowerCase()}`}
              </Button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

function PregnancyFields() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="LMP date" name="lmp_date" type="date" />
      <Field label="Expected due date" name="edd" type="date" />
      <Field label="Gravida" name="gravida" type="number" />
      <Field label="Parity" name="parity" type="number" />
      <SelectField label="Risk level" name="risk_level" options={["low", "moderate", "high"]} />
      <Field label="Risk factors" name="risk_factors" placeholder="Optional" />
    </div>
  );
}

function EncounterFields() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Visit date and time" name="visit_date" type="datetime-local" />
      <SelectField
        label="Visit type"
        name="visit_type"
        options={["antenatal", "general", "postnatal", "follow_up"]}
      />
      <SelectField label="Location" name="location" options={["clinic", "home"]} />
      <Field label="Main complaint" name="complaints" placeholder="What brought the patient in?" />
      <TextField label="Assessment" name="assessment" placeholder="Clinical assessment" />
      <TextField label="Plan" name="plan" placeholder="Treatment, advice, and follow-up" />
    </div>
  );
}

function InvestigationFields() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Investigation name *" name="name" placeholder="e.g. Hemoglobin" required />
      <SelectField
        label="Status"
        name="status"
        options={["recommended", "ordered", "completed", "declined"]}
      />
      <Field label="Due date" name="due_date" type="date" />
      <Field label="Notes" name="notes" placeholder="Optional" />
    </div>
  );
}

function AppointmentFields() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Date and time *" name="scheduled_at" type="datetime-local" required />
      <SelectField
        label="Appointment type"
        name="appointment_type"
        options={["antenatal", "postnatal", "follow_up", "general"]}
      />
      <SelectField label="Location" name="location" options={["clinic", "home"]} />
      <Field label="Reason" name="reason" placeholder="Reason for visit" />
      <TextField label="Notes" name="notes" placeholder="Optional appointment notes" />
    </div>
  );
}

function PrescriptionFields() {
  const [items, setItems] = useState([0]);

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div
          key={item}
          className="grid gap-4 rounded-2xl border border-border/70 bg-background/50 p-4 sm:grid-cols-2"
        >
          <Field
            id={`medication-${item}`}
            label={`Medicine ${index + 1} *`}
            name="medication"
            placeholder="e.g. Ferrous sulfate"
            required
          />
          <Field id={`dose-${item}`} label="Dose" name="dose" placeholder="e.g. 200 mg" />
          <Field
            id={`frequency-${item}`}
            label="Frequency"
            name="frequency"
            placeholder="e.g. Once daily"
          />
          <Field id={`route-${item}`} label="Route" name="route" placeholder="e.g. Oral" />
          <Field
            id={`duration-${item}`}
            label="Duration"
            name="duration"
            placeholder="e.g. 30 days"
          />
          {items.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              className="justify-self-start rounded-xl text-destructive"
              onClick={() => setItems((current) => current.filter((value) => value !== item))}
            >
              Remove medicine
            </Button>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        className="rounded-xl"
        onClick={() => setItems((current) => [...current, Math.max(...current) + 1])}
      >
        Add another medicine
      </Button>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Status" name="status" options={["active", "completed", "stopped"]} />
      </div>
      <TextField
        label="Instructions"
        name="instructions"
        placeholder="Directions and counselling notes"
      />
    </div>
  );
}

function ReferralFields() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field
        label="Destination *"
        name="destination"
        placeholder="Facility or specialist"
        required
      />
      <SelectField label="Urgency" name="urgency" options={["routine", "urgent", "emergency"]} />
      <TextField label="Reason *" name="reason" placeholder="Reason for referral" required />
      <TextField label="Notes" name="notes" placeholder="Handover and follow-up notes" />
    </div>
  );
}

function Field({
  label,
  name,
  id,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  name: string;
  id?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id ?? name}>{label}</Label>
      <Input
        id={id ?? name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="h-11 rounded-xl bg-background/80"
      />
    </div>
  );
}

function TextField({
  label,
  name,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2 sm:col-span-2">
      <Label htmlFor={name}>{label}</Label>
      <Textarea
        id={name}
        name={name}
        rows={3}
        placeholder={placeholder}
        required={required}
        className="rounded-xl bg-background/80"
      />
    </div>
  );
}

function SelectField({ label, name, options }: { label: string; name: string; options: string[] }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        defaultValue={options[0]}
        className="h-11 w-full rounded-xl border border-input bg-background/80 px-3 text-sm capitalize focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option.replace("_", " ")}
          </option>
        ))}
      </select>
    </div>
  );
}

function stringOrNull(value: FormDataEntryValue | null) {
  const stringValue = String(value || "").trim();
  return stringValue || null;
}

function numberOrNull(value: FormDataEntryValue | null) {
  const stringValue = String(value || "").trim();
  return stringValue ? Number(stringValue) : null;
}

function actionLabel(action: CareAction) {
  return action === "pregnancy"
    ? "Pregnancy"
    : action === "encounter"
      ? "Clinical encounter"
      : action === "investigation"
        ? "Investigation"
        : action === "appointment"
          ? "Appointment"
          : action === "prescription"
            ? "Prescription"
            : "Referral";
}

function MiniStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Activity;
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

function Detail({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3 last:border-0 last:pb-0">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="max-w-[60%] text-right text-sm font-medium">{value}</dd>
    </div>
  );
}
