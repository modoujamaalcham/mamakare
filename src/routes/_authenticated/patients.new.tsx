import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, ClipboardPlus, FileText, LockKeyhole, UserRound } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, Section } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/patients/new")({
  head: () => ({ meta: [{ title: "New patient — Mamakare" }] }),
  component: NewPatient,
});

const opt = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null));
const schema = z.object({
  first_name: z.string().trim().min(1, "Required").max(80),
  last_name: z.string().trim().min(1, "Required").max(80),
  date_of_birth: opt,
  phone: opt,
  address: opt,
  village_town: opt,
  region: opt,
  next_of_kin_name: opt,
  next_of_kin_phone: opt,
  blood_group: opt,
  allergies: opt,
  medical_history: opt,
});
type Form = z.input<typeof schema>;

function NewPatient() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form, unknown, z.output<typeof schema>>({ resolver: zodResolver(schema) });

  async function onSubmit(data: z.output<typeof schema>) {
    const { data: row, error } = await supabase.from("patients").insert(data).select("id").single();
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Patient registered");
    qc.invalidateQueries({ queryKey: ["patients"] });
    navigate({ to: "/patients/$id", params: { id: row.id } });
  }

  const F = ({
    name,
    label,
    type = "text",
    span,
    hint,
  }: {
    name: keyof Form;
    label: string;
    type?: string;
    span?: boolean;
    hint?: string;
  }) => (
    <div className={`space-y-2 ${span ? "sm:col-span-2" : ""}`}>
      <Label htmlFor={name} className="text-[13px] font-semibold text-foreground/85">
        {label}
      </Label>
      <Input
        id={name}
        type={type}
        {...register(name)}
        className="h-12 rounded-xl border-border/80 bg-background/80 px-4 shadow-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10"
      />
      {hint && !errors[name] && <p className="text-xs text-muted-foreground">{hint}</p>}
      {errors[name] && <p className="text-xs text-destructive">{errors[name]?.message}</p>}
    </div>
  );

  return (
    <div className="w-full space-y-6 pb-12">
      <Link
        to="/patients"
        className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card/60 px-3.5 py-2 text-xs font-semibold text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-95"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to patients
      </Link>

      <PageHeader
        title="Register a patient"
        subtitle="Create a comprehensive, secure health record with essential details for ongoing maternal care."
        action={
          <div className="hidden rounded-2xl bg-primary-soft p-3 text-primary shadow-xs sm:block">
            <ClipboardPlus className="h-6 w-6" />
          </div>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Section
            title="Personal details"
            action={<UserRound className="h-4 w-4 text-primary" />}
            className="overflow-hidden p-0"
          >
            <div className="border-t border-border/70 bg-muted/20 p-5 md:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Start with the patient’s identity and contact details.
                </p>
                <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                  * Required
                </span>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <F name="first_name" label="First name *" />
                <F name="last_name" label="Last name *" />
                <F name="date_of_birth" label="Date of birth" type="date" />
                <F name="phone" label="Phone number" type="tel" />
              </div>
            </div>
          </Section>

          <Section
            title="Address & next of kin"
            action={<FileText className="h-4 w-4 text-primary" />}
            className="overflow-hidden p-0"
          >
            <div className="border-t border-border/70 bg-muted/20 p-5 md:p-6">
              <div className="mb-5">
                <p className="text-sm text-muted-foreground">
                  Add enough information to support follow-up and communication.
                </p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <F name="address" label="Address / directions" span />
                <F name="village_town" label="Village / town" />
                <F name="region" label="Region" />
                <F name="next_of_kin_name" label="Next of kin" />
                <F name="next_of_kin_phone" label="Next of kin phone" type="tel" />
              </div>
            </div>
          </Section>

          <Section
            title="Medical background"
            action={<ClipboardPlus className="h-4 w-4 text-primary" />}
            className="overflow-hidden p-0"
          >
            <div className="border-t border-border/70 bg-muted/20 p-5 md:p-6">
              <div className="mb-5">
                <p className="text-sm text-muted-foreground">
                  These details help the care team prepare for future visits.
                </p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <F name="blood_group" label="Blood group" hint="Optional" />
                <F name="allergies" label="Allergies" hint="List any known allergies" />
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="mh" className="text-[13px] font-semibold text-foreground/85">
                    Medical history
                  </Label>
                  <Textarea
                    id="mh"
                    rows={4}
                    {...register("medical_history")}
                    placeholder="Chronic conditions, surgeries, previous complications"
                    className="resize-y rounded-xl border-border/80 bg-background/80 px-4 py-3 shadow-none placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10"
                  />
                </div>
              </div>
            </div>
          </Section>

          <div className="flex flex-col-reverse gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <p className="hidden text-xs text-muted-foreground sm:block">
              You can add pregnancy details after registration.
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => history.back()}
                className="h-11 sm:px-5"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="h-11 min-w-40 rounded-xl">
                {isSubmitting ? "Saving…" : "Save patient"}
              </Button>
            </div>
          </div>
        </form>

        <aside className="order-first space-y-4 lg:order-last lg:sticky lg:top-24">
          <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary via-primary/95 to-primary/85 p-6 text-primary-foreground shadow-lg shadow-primary/10">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
              <ClipboardPlus className="h-5 w-5" />
            </div>
            <p className="text-base font-bold font-display">New patient record</p>
            <p className="mt-1.5 text-xs leading-5 text-primary-foreground/85">
              Accurate registration data ensures safer antenatal, labor, and postnatal continuity of care.
            </p>
          </div>
          <div className="card-surface p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Registration steps
            </p>
            <div className="mt-5 space-y-4">
              {[
                ["Personal details", "Name and contact information"],
                ["Address & next of kin", "Follow-up and emergency contact"],
                ["Medical background", "Relevant clinical context"],
              ].map(([title, description], index) => (
                <div key={title} className="flex gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-3 rounded-2xl border border-border/70 bg-card p-4 text-sm text-muted-foreground">
            <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>Patient information is protected and only visible to authorized staff.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
