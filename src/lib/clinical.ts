import { addDays, differenceInCalendarDays, parseISO } from "date-fns";

export const TZ = "Africa/Banjul";

/** EDD by Naegele's rule: LMP + 280 days. Returns ISO yyyy-mm-dd. */
export function eddFromLmp(lmp: string): string {
  return addDays(parseISO(lmp), 280).toISOString().slice(0, 10);
}

/** Gestational age in weeks + days on a given date (defaults to today). */
export function gestationalAge(lmp: string | null | undefined, on: Date = new Date()) {
  if (!lmp) return null;
  const days = differenceInCalendarDays(on, parseISO(lmp));
  if (days < 0) return null;
  return { weeks: Math.floor(days / 7), days: days % 7, totalDays: days };
}

export function formatGA(ga: ReturnType<typeof gestationalAge>) {
  return ga ? `${ga.weeks}w ${ga.days}d` : "—";
}

export function trimester(weeks: number) {
  return weeks < 14 ? 1 : weeks < 28 ? 2 : 3;
}

export type Vitals = {
  systolic?: number | null;
  diastolic?: number | null;
  temperature?: number | null;
  pulse?: number | null;
  fetal_heart_rate?: number | null;
  hemoglobin?: number | null;
  spo2?: number | null;
  urine_protein?: string | null;
  symptoms?: string[];
};

export type Flag = { level: "urgent" | "warning"; message: string };

export const DANGER_SYMPTOMS = [
  "Vaginal bleeding",
  "Severe headache",
  "Blurred vision",
  "Convulsions",
  "Severe abdominal pain",
  "Reduced fetal movement",
  "Leaking fluid",
  "Fever",
  "Difficulty breathing",
  "Swelling of face/hands",
];

export const OTHER_SYMPTOMS = [
  "Nausea/vomiting",
  "Back pain",
  "Dizziness",
  "Painful urination",
  "Fatigue",
  "Heartburn",
];

/** Clinical decision support only — flags values for review, never a diagnosis. */
export function evaluateFlags(v: Vitals): Flag[] {
  const flags: Flag[] = [];
  const s = v.systolic ?? 0;
  const d = v.diastolic ?? 0;
  if (s >= 160 || d >= 110)
    flags.push({ level: "urgent", message: `Severe hypertension (${s}/${d})` });
  else if (s >= 140 || d >= 90)
    flags.push({ level: "warning", message: `Raised blood pressure (${s}/${d})` });
  if (v.temperature != null && v.temperature >= 38)
    flags.push({ level: "warning", message: `Fever ${v.temperature}°C` });
  if (v.fetal_heart_rate != null && (v.fetal_heart_rate < 110 || v.fetal_heart_rate > 160))
    flags.push({
      level: "urgent",
      message: `Abnormal fetal heart rate (${v.fetal_heart_rate} bpm)`,
    });
  if (v.hemoglobin != null) {
    if (v.hemoglobin < 7)
      flags.push({ level: "urgent", message: `Severe anaemia (Hb ${v.hemoglobin})` });
    else if (v.hemoglobin < 11)
      flags.push({ level: "warning", message: `Anaemia (Hb ${v.hemoglobin})` });
  }
  if (v.spo2 != null && v.spo2 < 94)
    flags.push({ level: "urgent", message: `Low oxygen saturation (${v.spo2}%)` });
  if (v.pulse != null && v.pulse > 110)
    flags.push({ level: "warning", message: `Tachycardia (${v.pulse} bpm)` });
  if (v.urine_protein && /\+\+|\+\+\+|2\+|3\+/.test(v.urine_protein) && (s >= 140 || d >= 90))
    flags.push({
      level: "urgent",
      message: "Raised BP with proteinuria — assess for pre-eclampsia",
    });
  for (const sym of v.symptoms ?? []) {
    if (DANGER_SYMPTOMS.includes(sym))
      flags.push({ level: "urgent", message: `Danger sign: ${sym}` });
  }
  return flags;
}

/** Default antenatal investigation schedule (editable per practice later). */
export const ANC_PROTOCOL: { name: string; fromWeek: number; toWeek: number }[] = [
  { name: "Haemoglobin / FBC", fromWeek: 0, toWeek: 16 },
  { name: "Blood group & Rhesus", fromWeek: 0, toWeek: 16 },
  { name: "HIV test", fromWeek: 0, toWeek: 16 },
  { name: "Syphilis (VDRL/RPR)", fromWeek: 0, toWeek: 16 },
  { name: "Hepatitis B (HBsAg)", fromWeek: 0, toWeek: 16 },
  { name: "Urinalysis", fromWeek: 0, toWeek: 16 },
  { name: "Malaria test", fromWeek: 0, toWeek: 42 },
  { name: "Dating ultrasound", fromWeek: 8, toWeek: 14 },
  { name: "Anomaly ultrasound", fromWeek: 18, toWeek: 22 },
  { name: "Glucose screening", fromWeek: 24, toWeek: 28 },
  { name: "Repeat haemoglobin", fromWeek: 28, toWeek: 32 },
  { name: "Growth ultrasound", fromWeek: 32, toWeek: 36 },
];

/** Protocol items due at or before this gestational week that are not yet recorded. */
export function recommendedInvestigations(weeks: number, existing: string[]) {
  const have = new Set(existing.map((n) => n.toLowerCase()));
  return ANC_PROTOCOL.filter((p) => p.fromWeek <= weeks && !have.has(p.name.toLowerCase()));
}

export function age(dob: string | null | undefined) {
  if (!dob) return null;
  return Math.floor(differenceInCalendarDays(new Date(), parseISO(dob)) / 365.25);
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}
export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, dateStyle: "medium" }).format(
    new Date(iso),
  );
}
export function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, timeStyle: "short" }).format(
    new Date(iso),
  );
}
