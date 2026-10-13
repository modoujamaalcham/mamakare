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
  Baby,
  Pencil,
  Phone,
  Share2,
  ShieldAlert,
  Trash2,
  UserRound,
  Stethoscope,
} from "lucide-react";
import { Section, Pill, Empty, Loading, riskTone, GestationalTracker, MetricCard } from "@/components/ui-kit";
import { ReportPreview } from "@/components/report-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type {
  Appointment,
  Encounter,
  Investigation,
  Pregnancy,
  Prescription,
  Referral,
} from "@/lib/db";
import { useCompanySettings, usePatient } from "@/lib/db";
import { age, formatDate, formatDateTime, formatGA, gestationalAge } from "@/lib/clinical";
import type { ReportInput } from "@/lib/reports";
import { shareReportImage } from "@/lib/reports";
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

export const Route = createFileRoute("/_authenticated/patients/$id")({
  head: () => ({ meta: [{ title: "Patient — Mamakare" }] }),
  component: PatientDetail,
});

type EditableRecord =
  | { kind: "pregnancy"; record: Pregnancy }
  | { kind: "encounter"; record: Encounter }
  | { kind: "investigation"; record: Investigation }
  | { kind: "appointment"; record: Appointment }
  | { kind: "prescription"; record: Prescription }
  | { kind: "referral"; record: Referral };

type RecordTable = EditableRecord["kind"];

function PatientDetail() {
  const { id } = Route.useParams();
  const { data, isLoading, error } = usePatient(id);
  const { data: company } = useCompanySettings();
  const queryClient = useQueryClient();
  const [activeReport, setActiveReport] = useState<ReportInput | null>(null);
  const [editingRecord, setEditingRecord] = useState<EditableRecord | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "encounters" | "appointments" | "investigations" | "prescriptions" | "info"
  >("overview");

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
      company: company ?? null,
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
    const reportValue = (value: unknown) => {
      if (Array.isArray(value)) return value.length ? value.join(", ") : "None recorded";
      if (typeof value === "boolean") return value ? "Yes" : "No";
      if (value === null || value === undefined || value === "") return "Not recorded";
      return String(value);
    };
    const reportDate = (value: string | null | undefined, withTime = false) =>
      value ? (withTime ? formatDateTime(value) : formatDate(value)) : null;
    const rows = (entries: Array<[string, unknown]>): Array<[string, string]> =>
      entries
        .filter(([, value]) => {
          if (Array.isArray(value)) return value.length > 0;
          return value !== null && value !== undefined && value !== "";
        })
        .map(([label, value]) => [label, reportValue(value)] as [string, string]);

    return {
      title: "Patient care report",
      subtitle: `${reportTitle} · ${patient.patient_number}`,
      company: company ?? null,
      sections: (
        [
          {
            title: "Patient details",
            rows: rows([
              ["Name", reportTitle],
              ["Patient ID", patient.patient_number],
              ["Status", patient.status],
              ["Date of birth", reportDate(patient.date_of_birth)],
              ["Phone", patient.phone],
              ["Address", patient.address],
              ["Village / town", patient.village_town],
              ["Region", patient.region],
              ["Blood group", patient.blood_group],
              ["Allergies", patient.allergies],
              ["Medical history", patient.medical_history],
              ["Notes", patient.notes],
              ["Next of kin", patient.next_of_kin_name],
              ["Next of kin phone", patient.next_of_kin_phone],
              ["Registered", reportDate(patient.created_at, true)],
              ["Last updated", reportDate(patient.updated_at, true)],
            ]),
          },
          {
            title: "Care summary",
            rows: rows([
              ["Encounters", String(encounters.length)],
              ["Pregnancies", String(pregnancies.length)],
              ["Investigations", String(investigations.length)],
              ["Appointments", String(appointments.length)],
              ["Prescriptions", String(prescriptions.length)],
              ["Referrals", String(referrals.length)],
            ]).filter(([, value]) => value !== "0"),
          },
          {
            title: "Pregnancy history",
            rows: pregnancies.length
              ? pregnancies.flatMap((item, index) =>
                  rows([
                    [`Pregnancy ${index + 1} · status`, item.status],
                    [`Pregnancy ${index + 1} · LMP date`, reportDate(item.lmp_date)],
                    [`Pregnancy ${index + 1} · expected due date`, reportDate(item.edd)],
                    [`Pregnancy ${index + 1} · gravida`, item.gravida],
                    [`Pregnancy ${index + 1} · parity`, item.parity],
                    [`Pregnancy ${index + 1} · risk level`, item.risk_level],
                    [`Pregnancy ${index + 1} · risk factors`, item.risk_factors],
                    [`Pregnancy ${index + 1} · outcome date`, reportDate(item.outcome_date)],
                    [`Pregnancy ${index + 1} · outcome notes`, item.outcome_notes],
                  ]),
                )
              : [],
          },
          {
            title: "Clinical encounters and vitals",
            rows: encounters.length
              ? encounters.flatMap((item, index) =>
                  rows([
                    [`Encounter ${index + 1} · date`, reportDate(item.visit_date, true)],
                    [`Encounter ${index + 1} · visit type`, item.visit_type],
                    [`Encounter ${index + 1} · location`, item.location],
                    [`Encounter ${index + 1} · complaints`, item.complaints],
                    [`Encounter ${index + 1} · symptoms`, item.symptoms],
                    [`Encounter ${index + 1} · assessment`, item.assessment],
                    [`Encounter ${index + 1} · plan / treatment`, item.plan],
                    [`Encounter ${index + 1} · danger flags`, item.danger_flags],
                    [
                      `Encounter ${index + 1} · blood pressure`,
                      item.systolic !== null || item.diastolic !== null
                        ? `${item.systolic ?? "—"} / ${item.diastolic ?? "—"} mmHg`
                        : null,
                    ],
                    [`Encounter ${index + 1} · pulse (bpm)`, item.pulse],
                    [`Encounter ${index + 1} · temperature (°C)`, item.temperature],
                    [`Encounter ${index + 1} · weight (kg)`, item.weight_kg],
                    [`Encounter ${index + 1} · respiratory rate`, item.resp_rate],
                    [`Encounter ${index + 1} · oxygen saturation (%)`, item.spo2],
                    [`Encounter ${index + 1} · hemoglobin (g/dL)`, item.hemoglobin],
                    [`Encounter ${index + 1} · fundal height (cm)`, item.fundal_height_cm],
                    [`Encounter ${index + 1} · fetal heart rate (bpm)`, item.fetal_heart_rate],
                    [`Encounter ${index + 1} · edema`, item.edema],
                    [`Encounter ${index + 1} · fetal movement`, item.fetal_movement],
                    [`Encounter ${index + 1} · presentation`, item.presentation],
                    [`Encounter ${index + 1} · urine protein`, item.urine_protein],
                  ]),
                )
              : [],
          },
          {
            title: "Investigations and results",
            rows: investigations.length
              ? investigations.flatMap((item, index) =>
                  rows([
                    [`Investigation ${index + 1} · name`, item.name],
                    [`Investigation ${index + 1} · status`, item.status],
                    [`Investigation ${index + 1} · abnormal`, item.abnormal],
                    [`Investigation ${index + 1} · result`, item.result],
                    [`Investigation ${index + 1} · result date`, reportDate(item.result_date)],
                    [`Investigation ${index + 1} · due date`, reportDate(item.due_date)],
                    [`Investigation ${index + 1} · notes`, item.notes],
                  ]),
                )
              : [],
          },
          {
            title: "Appointments",
            rows: appointments.length
              ? appointments.flatMap((item, index) =>
                  rows([
                    [`Appointment ${index + 1} · scheduled`, reportDate(item.scheduled_at, true)],
                    [`Appointment ${index + 1} · type`, item.appointment_type],
                    [`Appointment ${index + 1} · status`, item.status],
                    [`Appointment ${index + 1} · location`, item.location],
                    [`Appointment ${index + 1} · reason`, item.reason],
                    [`Appointment ${index + 1} · notes`, item.notes],
                  ]),
                )
              : [],
          },
          {
            title: "Prescriptions and medicines",
            rows: prescriptions.length
              ? prescriptions.flatMap((item, index) =>
                  rows([
                    [`Prescription ${index + 1} · medication`, item.medication],
                    [`Prescription ${index + 1} · dose`, item.dose],
                    [`Prescription ${index + 1} · frequency`, item.frequency],
                    [`Prescription ${index + 1} · route`, item.route],
                    [`Prescription ${index + 1} · duration`, item.duration],
                    [`Prescription ${index + 1} · instructions`, item.instructions],
                    [`Prescription ${index + 1} · status`, item.status],
                    [
                      `Prescription ${index + 1} · prescribed`,
                      reportDate(item.prescribed_at, true),
                    ],
                  ]),
                )
              : [],
          },
          {
            title: "Referrals and follow-up",
            rows: referrals.length
              ? referrals.flatMap((item, index) =>
                  rows([
                    [`Referral ${index + 1} · destination`, item.destination],
                    [`Referral ${index + 1} · reason`, item.reason],
                    [`Referral ${index + 1} · urgency`, item.urgency],
                    [`Referral ${index + 1} · status`, item.status],
                    [`Referral ${index + 1} · notes`, item.notes],
                    [`Referral ${index + 1} · referred`, reportDate(item.referred_at, true)],
                  ]),
                )
              : [],
          },
        ] as ReportInput["sections"]
      ).filter((section) => section.rows.length > 0),
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

  async function deleteRecord(kind: RecordTable, recordId: string) {
    const result =
      kind === "pregnancy"
        ? await supabase.from("pregnancies").delete().eq("id", recordId)
        : kind === "encounter"
          ? await supabase.from("encounters").delete().eq("id", recordId)
          : kind === "investigation"
            ? await supabase.from("investigations").delete().eq("id", recordId)
            : kind === "appointment"
              ? await supabase.from("appointments").delete().eq("id", recordId)
              : kind === "prescription"
                ? await supabase.from("prescriptions").delete().eq("id", recordId)
                : await supabase.from("referrals").delete().eq("id", recordId);
    if (result.error) {
      toast.error(result.error.message);
      return;
    }
    toast.success(`${actionLabel(kind)} deleted`);
    await queryClient.invalidateQueries({ queryKey: ["patient", patient.id] });
    await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    await queryClient.invalidateQueries({ queryKey: ["schedule"] });
  }

  return (
    <div className="w-full space-y-6 pb-8">
      {/* Top Navigation & Export Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/patients"
          className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card/60 px-3.5 py-2 text-xs font-semibold text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-95"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to patients
        </Link>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 rounded-xl text-xs font-semibold border-border/70"
            onClick={generatePatientReport}
          >
            <Download className="h-3.5 w-3.5 text-primary" />
            <span className="hidden sm:inline">Clinical PDF</span> Report
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 rounded-xl text-xs font-semibold border-border/70"
            onClick={() => void shareImage(patientReport())}
          >
            <Share2 className="h-3.5 w-3.5 text-emerald-600" /> WhatsApp
          </Button>
        </div>
      </div>

      {/* Patient Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary via-primary/95 to-primary/85 p-6 text-primary-foreground shadow-lg shadow-primary/10 md:p-8">
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start sm:items-center gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/20 text-xl font-bold backdrop-blur-md ring-4 ring-white/10">
              {patient.first_name?.[0] ?? ""}
              {patient.last_name?.[0] ?? ""}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl font-display">
                  {patient.first_name} {patient.last_name}
                </h1>
                <Pill
                  tone={patient.status === "active" ? "success" : "neutral"}
                  className="bg-white/20 text-white border-white/25"
                >
                  {patient.status}
                </Pill>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-primary-foreground/85">
                <span className="font-mono bg-white/15 px-2 py-0.5 rounded-md">
                  ID: {patient.patient_number}
                </span>
                {patient.date_of_birth && (
                  <span>
                    {formatDate(patient.date_of_birth)} ({age(patient.date_of_birth)} yrs)
                  </span>
                )}
                {patient.village_town && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {patient.village_town}
                    {patient.region ? `, ${patient.region}` : ""}
                  </span>
                )}
              </div>
            </div>
          </div>

          {patient.phone ? (
            <div className="flex items-center gap-2">
              <a
                href={`tel:${patient.phone}`}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-primary shadow-sm transition-all hover:bg-white/95 active:scale-95"
              >
                <Phone className="h-4 w-4" /> Call {patient.phone}
              </a>
            </div>
          ) : null}
        </div>
        <HeartPulse
          className="pointer-events-none absolute -bottom-10 -right-4 h-48 w-48 text-white/10"
          strokeWidth={1}
        />
      </div>

      {/* Maternal Gestational Progress Bar (if active pregnancy) */}
      {activePregnancy && (
        <GestationalTracker
          ga={ga}
          riskLevel={activePregnancy.risk_level}
          edd={activePregnancy.edd ? formatDate(activePregnancy.edd) : undefined}
        />
      )}

      {/* Quick Care Actions Toolbar */}
      <CareActions patientId={patient.id} pregnancyId={activePregnancy?.id} />

      {/* Segmented Clinical Tabs Switcher */}
      <div className="border-b border-border/70">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: "overview", label: "Overview", count: null },
            { id: "encounters", label: "Encounters & Vitals", count: encounters.length },
            { id: "appointments", label: "Appointments", count: appointments.length },
            { id: "investigations", label: "Investigations", count: investigations.length },
            {
              id: "prescriptions",
              label: "Prescriptions & Referrals",
              count: prescriptions.length + referrals.length,
            },
            { id: "info", label: "Patient Profile", count: null },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "border border-transparent bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    activeTab === tab.id
                      ? "bg-white/20 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* TAB CONTENT: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MiniStat label="Encounters" value={encounters.length} icon={ClipboardList} />
            <MiniStat label="Appointments" value={appointments.length} icon={CalendarDays} />
            <MiniStat label="Investigations" value={investigations.length} icon={Activity} />
            <MiniStat label="Pregnancies" value={pregnancies.length} icon={HeartPulse} />
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_0.85fr]">
            <div className="space-y-6">
              {/* Latest Encounters Section */}
              <Section
                title="Recent encounters"
                action={
                  <button
                    type="button"
                    onClick={() => setActiveTab("encounters")}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    View all ({encounters.length})
                  </button>
                }
              >
                {encounters.length === 0 ? (
                  <Empty>No clinical encounters recorded yet.</Empty>
                ) : (
                  <ul className="divide-y divide-border/60">
                    {encounters.slice(0, 4).map((encounter) => (
                      <li key={encounter.id} className="flex items-center gap-3 py-3.5">
                        <span
                          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                            (encounter.danger_flags ?? []).length > 0
                              ? "bg-destructive-soft text-destructive"
                              : "bg-primary-soft text-primary"
                          }`}
                        >
                          {(encounter.danger_flags ?? []).length > 0 ? (
                            <ShieldAlert className="h-4 w-4" />
                          ) : (
                            <ClipboardList className="h-4 w-4" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold capitalize text-foreground">
                              {encounter.visit_type}
                            </span>
                            {encounter.systolic && encounter.diastolic && (
                              <span className="text-xs font-mono text-muted-foreground">
                                BP: {encounter.systolic}/{encounter.diastolic}
                              </span>
                            )}
                          </div>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {formatDateTime(encounter.visit_date)} · {encounter.location}
                          </span>
                        </div>
                        {(encounter.danger_flags ?? []).length > 0 && (
                          <Pill tone="urgent">Danger flags</Pill>
                        )}
                        <RecordActions
                          label="clinical encounter"
                          onEdit={() => setEditingRecord({ kind: "encounter", record: encounter })}
                          onDelete={() => void deleteRecord("encounter", encounter.id)}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              {/* Latest Prescriptions Preview */}
              <Section
                title="Active prescriptions"
                action={
                  <button
                    type="button"
                    onClick={() => setActiveTab("prescriptions")}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Manage ({prescriptions.length})
                  </button>
                }
              >
                {prescriptions.length === 0 ? (
                  <Empty>No active prescriptions recorded.</Empty>
                ) : (
                  <ul className="divide-y divide-border/60">
                    {prescriptions.slice(0, 3).map((item) => (
                      <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground text-sm">{item.medication}</p>
                          <p className="text-xs text-muted-foreground">
                            {[item.dose, item.frequency, item.duration].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                        <Pill tone={item.status === "active" ? "success" : "neutral"}>
                          {item.status}
                        </Pill>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </div>

            {/* Sidebar Summary Info */}
            <div className="space-y-6">
              {/* Active Pregnancy details */}
              <Section
                title="Active pregnancy"
                action={
                  activePregnancy ? (
                    <RecordActions
                      label="pregnancy"
                      onEdit={() =>
                        setEditingRecord({ kind: "pregnancy", record: activePregnancy })
                      }
                      onDelete={() => void deleteRecord("pregnancy", activePregnancy.id)}
                    />
                  ) : null
                }
              >
                {activePregnancy ? (
                  <dl className="space-y-3 text-sm">
                    <Detail
                      label="Due date (EDD)"
                      value={activePregnancy.edd ? formatDate(activePregnancy.edd) : "Not recorded"}
                    />
                    <Detail
                      label="LMP Date"
                      value={
                        activePregnancy.lmp_date ? formatDate(activePregnancy.lmp_date) : "Not recorded"
                      }
                    />
                    <Detail label="Gravida" value={String(activePregnancy.gravida ?? "—")} />
                    <Detail label="Parity" value={String(activePregnancy.parity ?? "—")} />
                    <Detail
                      label="Risk level"
                      value={activePregnancy.risk_level || "standard"}
                    />
                    {activePregnancy.risk_factors && (
                      <Detail label="Risk factors" value={activePregnancy.risk_factors} />
                    )}
                  </dl>
                ) : (
                  <Empty>No active pregnancy recorded.</Empty>
                )}
              </Section>

              {/* Patient Demographics summary */}
              <Section
                title="Patient profile preview"
                action={
                  <button
                    type="button"
                    onClick={() => setActiveTab("info")}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Full details
                  </button>
                }
              >
                <dl className="grid gap-3 text-sm">
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
                </dl>
              </Section>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Encounters & Vitals */}
      {activeTab === "encounters" && (
        <div className="space-y-5">
          <Section
            title={`Clinical encounters (${encounters.length})`}
            subtitle="Full consultation history, vitals observations, and danger signs."
            icon={ClipboardList}
          >
            {encounters.length === 0 ? (
              <Empty>No clinical encounters recorded yet. Use 'Add care record' above.</Empty>
            ) : (
              <div className="space-y-4">
                {encounters.map((encounter) => (
                  <div
                    key={encounter.id}
                    className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/50 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-foreground capitalize">
                            {encounter.visit_type} encounter
                          </h3>
                          <Pill tone="primary">{encounter.location}</Pill>
                          {(encounter.danger_flags ?? []).length > 0 && (
                            <Pill tone="urgent" withDot>
                              {(encounter.danger_flags ?? []).length} danger flag(s)
                            </Pill>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDateTime(encounter.visit_date)}
                        </p>
                      </div>
                      <RecordActions
                        label="encounter"
                        onEdit={() => setEditingRecord({ kind: "encounter", record: encounter })}
                        onDelete={() => void deleteRecord("encounter", encounter.id)}
                      />
                    </div>

                    {/* Vitals Badges Grid */}
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6 text-xs">
                      {encounter.systolic && encounter.diastolic && (
                        <div className="rounded-xl border border-border/60 bg-muted/40 p-2">
                          <span className="text-muted-foreground block text-[11px]">BP (mmHg)</span>
                          <span className="font-bold font-mono text-foreground text-sm">
                            {encounter.systolic}/{encounter.diastolic}
                          </span>
                        </div>
                      )}
                      {encounter.pulse && (
                        <div className="rounded-xl border border-border/60 bg-muted/40 p-2">
                          <span className="text-muted-foreground block text-[11px]">Pulse</span>
                          <span className="font-bold font-mono text-foreground text-sm">
                            {encounter.pulse} bpm
                          </span>
                        </div>
                      )}
                      {encounter.temperature && (
                        <div className="rounded-xl border border-border/60 bg-muted/40 p-2">
                          <span className="text-muted-foreground block text-[11px]">Temp</span>
                          <span className="font-bold font-mono text-foreground text-sm">
                            {encounter.temperature}°C
                          </span>
                        </div>
                      )}
                      {encounter.weight_kg && (
                        <div className="rounded-xl border border-border/60 bg-muted/40 p-2">
                          <span className="text-muted-foreground block text-[11px]">Weight</span>
                          <span className="font-bold font-mono text-foreground text-sm">
                            {encounter.weight_kg} kg
                          </span>
                        </div>
                      )}
                      {encounter.fundal_height_cm && (
                        <div className="rounded-xl border border-border/60 bg-muted/40 p-2">
                          <span className="text-muted-foreground block text-[11px]">Fundal Ht</span>
                          <span className="font-bold font-mono text-foreground text-sm">
                            {encounter.fundal_height_cm} cm
                          </span>
                        </div>
                      )}
                      {encounter.fetal_heart_rate && (
                        <div className="rounded-xl border border-border/60 bg-muted/40 p-2">
                          <span className="text-muted-foreground block text-[11px]">FHR</span>
                          <span className="font-bold font-mono text-foreground text-sm">
                            {encounter.fetal_heart_rate} bpm
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Clinical Details: Complaints, Assessment, Plan */}
                    <div className="grid gap-2 pt-2 text-xs text-muted-foreground">
                      {encounter.complaints && (
                        <p>
                          <strong className="text-foreground">Complaints:</strong>{" "}
                          {encounter.complaints}
                        </p>
                      )}
                      {encounter.assessment && (
                        <p>
                          <strong className="text-foreground">Assessment:</strong>{" "}
                          {encounter.assessment}
                        </p>
                      )}
                      {encounter.plan && (
                        <p>
                          <strong className="text-foreground">Treatment Plan:</strong>{" "}
                          {encounter.plan}
                        </p>
                      )}
                      {Boolean(encounter.danger_flags && encounter.danger_flags.length > 0) && (
                        <div className="rounded-xl border border-destructive/20 bg-destructive-soft p-2.5 text-destructive">
                          <strong>Danger Flags:</strong> {encounter.danger_flags?.join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      )}

      {/* TAB CONTENT: Appointments */}
      {activeTab === "appointments" && (
        <div className="space-y-5">
          <Section
            title={`Care Appointments (${appointments.length})`}
            subtitle="Follow-up clinic visits and home outreach visits."
            icon={CalendarDays}
          >
            {appointments.length === 0 ? (
              <Empty>No appointments scheduled. Add one using the care actions bar.</Empty>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-foreground text-sm">
                          {formatDateTime(appointment.scheduled_at)}
                        </span>
                        <div className="flex items-center gap-1.5">
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
                          <RecordActions
                            label="appointment"
                            onEdit={() =>
                              setEditingRecord({ kind: "appointment", record: appointment })
                            }
                            onDelete={() => void deleteRecord("appointment", appointment.id)}
                          />
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground space-y-1">
                        <p className="capitalize">
                          <strong>Type:</strong> {appointment.appointment_type} · {appointment.location}
                        </p>
                        {appointment.reason && (
                          <p>
                            <strong>Reason:</strong> {appointment.reason}
                          </p>
                        )}
                        {appointment.notes && (
                          <p>
                            <strong>Notes:</strong> {appointment.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      )}

      {/* TAB CONTENT: Investigations */}
      {activeTab === "investigations" && (
        <div className="space-y-5">
          <Section
            title={`Investigations & Lab Tests (${investigations.length})`}
            subtitle="Laboratory tests, ultrasound scans, and results."
            icon={Activity}
          >
            {investigations.length === 0 ? (
              <Empty>No investigations recorded.</Empty>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {investigations.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-foreground text-sm">{item.name}</span>
                        <div className="flex items-center gap-1.5">
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
                          <RecordActions
                            label="investigation"
                            onEdit={() => setEditingRecord({ kind: "investigation", record: item })}
                            onDelete={() => void deleteRecord("investigation", item.id)}
                          />
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground space-y-1">
                        {item.result && (
                          <p className="font-medium text-foreground">
                            <strong>Result:</strong> {item.result}
                          </p>
                        )}
                        {item.result_date && (
                          <p>Result date: {formatDate(item.result_date)}</p>
                        )}
                        {item.due_date && <p>Due: {formatDate(item.due_date)}</p>}
                        {item.notes && <p>Notes: {item.notes}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      )}

      {/* TAB CONTENT: Prescriptions & Referrals */}
      {activeTab === "prescriptions" && (
        <div className="space-y-6">
          <Section
            title={`Prescriptions (${prescriptions.length})`}
            icon={FileText}
            action={
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-xl text-xs gap-1.5"
                  onClick={generatePrescriptionReport}
                >
                  <Download className="h-3.5 w-3.5 text-primary" /> Report
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-xl text-xs gap-1.5"
                  onClick={() => void shareImage(prescriptionReport())}
                >
                  <Share2 className="h-3.5 w-3.5 text-emerald-600" /> Share
                </Button>
              </div>
            }
          >
            {prescriptions.length === 0 ? (
              <Empty>No prescriptions recorded for this patient.</Empty>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {prescriptions.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-foreground text-sm">{item.medication}</p>
                      <div className="flex items-center gap-1.5">
                        <Pill tone={item.status === "active" ? "success" : "neutral"}>
                          {item.status}
                        </Pill>
                        <RecordActions
                          label="prescription"
                          onEdit={() => setEditingRecord({ kind: "prescription", record: item })}
                          onDelete={() => void deleteRecord("prescription", item.id)}
                        />
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p>
                        <strong>Dosage:</strong> {[item.dose, item.frequency, item.route].filter(Boolean).join(" · ") || "Not specified"}
                      </p>
                      {item.duration && <p>Duration: {item.duration}</p>}
                      {item.instructions && <p>Instructions: {item.instructions}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title={`Referrals (${referrals.length})`} icon={ArrowLeft}>
            {referrals.length === 0 ? (
              <Empty>No medical referrals recorded.</Empty>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {referrals.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-foreground text-sm">{item.destination}</p>
                      <div className="flex items-center gap-1.5">
                        <Pill tone={item.urgency === "emergency" ? "urgent" : "warning"}>
                          {item.urgency}
                        </Pill>
                        <RecordActions
                          label="referral"
                          onEdit={() => setEditingRecord({ kind: "referral", record: item })}
                          onDelete={() => void deleteRecord("referral", item.id)}
                        />
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p><strong>Reason:</strong> {item.reason}</p>
                      {item.notes && <p>Notes: {item.notes}</p>}
                      {item.referred_at && <p>Referred: {formatDateTime(item.referred_at)}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      )}

      {/* TAB CONTENT: Patient Info & Profile */}
      {activeTab === "info" && (
        <div className="space-y-6">
          <Section title="Demographic & Medical Profile" icon={UserRound}>
            <dl className="grid gap-4 sm:grid-cols-2 text-sm">
              <Detail
                label="Full name"
                value={`${patient.first_name} ${patient.last_name}`}
              />
              <Detail label="Patient ID" value={patient.patient_number} />
              <Detail
                label="Date of birth"
                value={
                  patient.date_of_birth
                    ? `${formatDate(patient.date_of_birth)} (${age(patient.date_of_birth)} years)`
                    : "Not recorded"
                }
              />
              <Detail
                label="Contact phone"
                value={patient.phone || "Not recorded"}
                icon={<Phone className="h-3.5 w-3.5" />}
              />
              <Detail
                label="Village / Town"
                value={patient.village_town || "Not recorded"}
                icon={<MapPin className="h-3.5 w-3.5" />}
              />
              <Detail label="Region" value={patient.region || "Not recorded"} />
              <Detail label="Residential address" value={patient.address || "Not recorded"} />
              <Detail label="Blood group" value={patient.blood_group || "Not recorded"} />
              <Detail label="Known allergies" value={patient.allergies || "None recorded"} />
              <Detail
                label="Medical history"
                value={patient.medical_history || "None recorded"}
              />
              <Detail
                label="Next of kin"
                value={patient.next_of_kin_name || "Not recorded"}
              />
              <Detail
                label="Next of kin phone"
                value={patient.next_of_kin_phone || "Not recorded"}
                icon={<Phone className="h-3.5 w-3.5" />}
              />
              <Detail label="Registered on" value={formatDateTime(patient.created_at)} />
              <Detail label="Last updated" value={formatDateTime(patient.updated_at)} />
            </dl>
          </Section>
        </div>
      )}
      {activeReport && (
        <ReportPreview report={activeReport} onClose={() => setActiveReport(null)} />
      )}
      {editingRecord && (
        <EditRecordDialog
          patientId={patient.id}
          editing={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSaved={async () => {
            setEditingRecord(null);
            await queryClient.invalidateQueries({ queryKey: ["patient", patient.id] });
            await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            await queryClient.invalidateQueries({ queryKey: ["schedule"] });
          }}
        />
      )}
    </div>
  );
}

type CareAction =
  "pregnancy" | "encounter" | "investigation" | "appointment" | "prescription" | "referral";

function RecordActions({
  label,
  onEdit,
  onDelete,
}: {
  label: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <div className="flex shrink-0 items-center gap-0.5">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8 rounded-lg"
          aria-label={`Edit ${label}`}
          title={`Edit ${label}`}
          onClick={onEdit}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8 rounded-lg text-destructive hover:text-destructive"
          aria-label={`Delete ${label}`}
          title={`Delete ${label}`}
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this {label}?</AlertDialogTitle>
            <AlertDialogDescription>
              This record will be permanently removed from the patient file. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={onDelete}
            >
              Delete record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function EditRecordDialog({
  patientId,
  editing,
  onClose,
  onSaved,
}: {
  patientId: string;
  editing: EditableRecord;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const values = new FormData(event.currentTarget);
    let error: { message: string } | null = null;

    if (editing.kind === "pregnancy") {
      const result = await supabase
        .from("pregnancies")
        .update({
          lmp_date: stringOrNull(values.get("lmp_date")),
          edd: stringOrNull(values.get("edd")),
          gravida: numberOrNull(values.get("gravida")),
          parity: numberOrNull(values.get("parity")),
          risk_level: String(values.get("risk_level") || "low"),
          risk_factors: stringOrNull(values.get("risk_factors")),
        })
        .eq("id", editing.record.id)
        .eq("patient_id", patientId);
      error = result.error;
    } else if (editing.kind === "encounter") {
      const vitals = readVitals(values);
      const result = await supabase
        .from("encounters")
        .update({
          visit_date: new Date(String(values.get("visit_date"))).toISOString(),
          visit_type: String(values.get("visit_type") || "general"),
          location: String(values.get("location") || "clinic"),
          complaints: stringOrNull(values.get("complaints")),
          assessment: stringOrNull(values.get("assessment")),
          plan: stringOrNull(values.get("plan")),
          ...vitals,
        })
        .eq("id", editing.record.id)
        .eq("patient_id", patientId);
      error = result.error;
    } else if (editing.kind === "investigation") {
      const result = await supabase
        .from("investigations")
        .update({
          name: String(values.get("name") || "Investigation"),
          status: String(values.get("status") || "recommended"),
          due_date: stringOrNull(values.get("due_date")),
          notes: stringOrNull(values.get("notes")),
        })
        .eq("id", editing.record.id)
        .eq("patient_id", patientId);
      error = result.error;
    } else if (editing.kind === "appointment") {
      const result = await supabase
        .from("appointments")
        .update({
          scheduled_at: new Date(String(values.get("scheduled_at"))).toISOString(),
          appointment_type: String(values.get("appointment_type") || "follow_up"),
          location: String(values.get("location") || "clinic"),
          reason: stringOrNull(values.get("reason")),
          notes: stringOrNull(values.get("notes")),
        })
        .eq("id", editing.record.id)
        .eq("patient_id", patientId);
      error = result.error;
    } else if (editing.kind === "prescription") {
      const result = await supabase
        .from("prescriptions")
        .update({
          medication: String(values.get("medication") || "").trim(),
          dose: stringOrNull(values.get("dose")),
          frequency: stringOrNull(values.get("frequency")),
          route: stringOrNull(values.get("route")),
          duration: stringOrNull(values.get("duration")),
          instructions: stringOrNull(values.get("instructions")),
          status: String(values.get("status") || "active"),
        })
        .eq("id", editing.record.id)
        .eq("patient_id", patientId);
      error = result.error;
    } else {
      const result = await supabase
        .from("referrals")
        .update({
          destination: String(values.get("destination") || "").trim(),
          reason: String(values.get("reason") || "").trim(),
          urgency: String(values.get("urgency") || "routine"),
          status: String(values.get("status") || "pending"),
          notes: stringOrNull(values.get("notes")),
        })
        .eq("id", editing.record.id)
        .eq("patient_id", patientId);
      error = result.error;
    }

    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${actionLabel(editing.kind)} updated`);
    await onSaved();
  }

  const title = `Edit ${actionLabel(editing.kind).toLowerCase()}`;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-background p-5 shadow-2xl sm:rounded-3xl md:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Patient record
            </p>
            <h2 className="mt-1 text-xl font-bold capitalize">{title}</h2>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <form className="space-y-4" onSubmit={save}>
          {editing.kind === "pregnancy" && <EditPregnancyFields record={editing.record} />}
          {editing.kind === "encounter" && <EditEncounterFields record={editing.record} />}
          {editing.kind === "investigation" && <EditInvestigationFields record={editing.record} />}
          {editing.kind === "appointment" && <EditAppointmentFields record={editing.record} />}
          {editing.kind === "prescription" && <EditPrescriptionFields record={editing.record} />}
          {editing.kind === "referral" && <EditReferralFields record={editing.record} />}
          <div className="flex justify-end gap-2 border-t border-border/70 pt-4">
            <Button type="button" variant="outline" className="rounded-xl" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="rounded-xl">
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditPregnancyFields({ record }: { record: Pregnancy }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="LMP date" name="lmp_date" type="date" defaultValue={record.lmp_date || ""} />
      <Field label="Expected due date" name="edd" type="date" defaultValue={record.edd || ""} />
      <Field label="Gravida" name="gravida" type="number" defaultValue={record.gravida ?? ""} />
      <Field label="Parity" name="parity" type="number" defaultValue={record.parity ?? ""} />
      <SelectField
        label="Risk level"
        name="risk_level"
        options={["low", "moderate", "high"]}
        defaultValue={record.risk_level}
      />
      <Field label="Risk factors" name="risk_factors" defaultValue={record.risk_factors || ""} />
    </div>
  );
}

function EditEncounterFields({ record }: { record: Encounter }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field
        label="Visit date and time"
        name="visit_date"
        type="datetime-local"
        defaultValue={toDateTimeInput(record.visit_date)}
      />
      <SelectField
        label="Visit type"
        name="visit_type"
        options={["antenatal", "general", "postnatal", "follow_up"]}
        defaultValue={record.visit_type}
      />
      <SelectField
        label="Location"
        name="location"
        options={["clinic", "home"]}
        defaultValue={record.location}
      />
      <Field label="Main complaint" name="complaints" defaultValue={record.complaints || ""} />
      <TextField
        label="Assessment"
        name="assessment"
        placeholder="Clinical assessment"
        defaultValue={record.assessment || ""}
      />
      <TextField
        label="Plan"
        name="plan"
        placeholder="Treatment, advice, and follow-up"
        defaultValue={record.plan || ""}
      />
      <VitalsFields record={record} />
    </div>
  );
}

function EditInvestigationFields({ record }: { record: Investigation }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Investigation name" name="name" required defaultValue={record.name} />
      <SelectField
        label="Status"
        name="status"
        options={["recommended", "ordered", "completed", "declined"]}
        defaultValue={record.status}
      />
      <Field label="Due date" name="due_date" type="date" defaultValue={record.due_date || ""} />
      <Field label="Notes" name="notes" defaultValue={record.notes || ""} />
    </div>
  );
}

function EditAppointmentFields({ record }: { record: Appointment }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field
        label="Date and time"
        name="scheduled_at"
        type="datetime-local"
        required
        defaultValue={toDateTimeInput(record.scheduled_at)}
      />
      <SelectField
        label="Appointment type"
        name="appointment_type"
        options={["antenatal", "postnatal", "follow_up", "general"]}
        defaultValue={record.appointment_type}
      />
      <SelectField
        label="Location"
        name="location"
        options={["clinic", "home"]}
        defaultValue={record.location}
      />
      <Field label="Reason" name="reason" defaultValue={record.reason || ""} />
      <TextField
        label="Notes"
        name="notes"
        placeholder="Optional appointment notes"
        defaultValue={record.notes || ""}
      />
    </div>
  );
}

function EditPrescriptionFields({ record }: { record: Prescription }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Medicine" name="medication" required defaultValue={record.medication} />
      <Field label="Dose" name="dose" defaultValue={record.dose || ""} />
      <Field label="Frequency" name="frequency" defaultValue={record.frequency || ""} />
      <Field label="Route" name="route" defaultValue={record.route || ""} />
      <Field label="Duration" name="duration" defaultValue={record.duration || ""} />
      <SelectField
        label="Status"
        name="status"
        options={["active", "completed", "stopped"]}
        defaultValue={record.status}
      />
      <TextField
        label="Instructions"
        name="instructions"
        placeholder="Directions and counselling notes"
        defaultValue={record.instructions || ""}
      />
    </div>
  );
}

function EditReferralFields({ record }: { record: Referral }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Destination" name="destination" required defaultValue={record.destination} />
      <SelectField
        label="Urgency"
        name="urgency"
        options={["routine", "urgent", "emergency"]}
        defaultValue={record.urgency}
      />
      <TextField
        label="Reason"
        name="reason"
        placeholder="Reason for referral"
        required
        defaultValue={record.reason}
      />
      <SelectField
        label="Status"
        name="status"
        options={["pending", "accepted", "completed", "cancelled"]}
        defaultValue={record.status}
      />
      <TextField
        label="Notes"
        name="notes"
        placeholder="Handover and follow-up notes"
        defaultValue={record.notes || ""}
      />
    </div>
  );
}

function toDateTimeInput(value: string) {
  return new Date(value).toISOString().slice(0, 16);
}

function CareActions({
  patientId,
  pregnancyId,
}: {
  patientId: string;
  pregnancyId: string | undefined;
}) {
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
      const vitals = readVitals(values);
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
        ...vitals,
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
      <VitalsFields />
    </div>
  );
}

function VitalsFields({ record }: { record?: Encounter }) {
  return (
    <div className="sm:col-span-2 rounded-2xl border border-border/70 bg-primary-soft/30 p-4">
      <div className="mb-3">
        <p className="text-sm font-semibold">Vitals</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Record the measurements taken during this encounter. All fields are optional.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field
          label="Systolic BP (mmHg)"
          name="systolic"
          type="number"
          defaultValue={record?.systolic ?? ""}
        />
        <Field
          label="Diastolic BP (mmHg)"
          name="diastolic"
          type="number"
          defaultValue={record?.diastolic ?? ""}
        />
        <Field label="Pulse (bpm)" name="pulse" type="number" defaultValue={record?.pulse ?? ""} />
        <Field
          label="Temperature (°C)"
          name="temperature"
          type="number"
          step="0.1"
          defaultValue={record?.temperature ?? ""}
        />
        <Field
          label="Weight (kg)"
          name="weight_kg"
          type="number"
          step="0.1"
          defaultValue={record?.weight_kg ?? ""}
        />
        <Field
          label="Respiratory rate"
          name="resp_rate"
          type="number"
          defaultValue={record?.resp_rate ?? ""}
        />
        <Field
          label="Oxygen saturation (%)"
          name="spo2"
          type="number"
          defaultValue={record?.spo2 ?? ""}
        />
        <Field
          label="Hemoglobin (g/dL)"
          name="hemoglobin"
          type="number"
          step="0.1"
          defaultValue={record?.hemoglobin ?? ""}
        />
        <Field
          label="Fundal height (cm)"
          name="fundal_height_cm"
          type="number"
          step="0.1"
          defaultValue={record?.fundal_height_cm ?? ""}
        />
        <Field
          label="Fetal heart rate (bpm)"
          name="fetal_heart_rate"
          type="number"
          defaultValue={record?.fetal_heart_rate ?? ""}
        />
      </div>
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
  defaultValue,
  step,
}: {
  label: string;
  name: string;
  id?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string | number;
  step?: string;
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
        defaultValue={defaultValue}
        step={step}
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
  defaultValue,
}: {
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
  defaultValue?: string;
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
        defaultValue={defaultValue}
        className="rounded-xl bg-background/80"
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: string[];
  defaultValue?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue ?? options[0]}
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

function stringOrNull(value: FormDataEntryValue | null | undefined) {
  const stringValue = String(value || "").trim();
  return stringValue || null;
}

function readVitals(values: FormData) {
  return {
    systolic: numberOrNull(values.get("systolic")),
    diastolic: numberOrNull(values.get("diastolic")),
    pulse: numberOrNull(values.get("pulse")),
    temperature: numberOrNull(values.get("temperature")),
    weight_kg: numberOrNull(values.get("weight_kg")),
    resp_rate: numberOrNull(values.get("resp_rate")),
    spo2: numberOrNull(values.get("spo2")),
    hemoglobin: numberOrNull(values.get("hemoglobin")),
    fundal_height_cm: numberOrNull(values.get("fundal_height_cm")),
    fetal_heart_rate: numberOrNull(values.get("fetal_heart_rate")),
  };
}

function numberOrNull(value: FormDataEntryValue | null | undefined) {
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

function Detail({ label, value, icon }: { label: string; value?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3 last:border-0 last:pb-0">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="max-w-[60%] text-right text-sm font-medium">{value ?? "—"}</dd>
    </div>
  );
}
