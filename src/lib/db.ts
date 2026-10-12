import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Patient = Database["public"]["Tables"]["patients"]["Row"];
export type Pregnancy = Database["public"]["Tables"]["pregnancies"]["Row"];
export type Encounter = Database["public"]["Tables"]["encounters"]["Row"];
export type Investigation = Database["public"]["Tables"]["investigations"]["Row"];
export type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
export type Prescription = Database["public"]["Tables"]["prescriptions"]["Row"];
export type Referral = Database["public"]["Tables"]["referrals"]["Row"];
export type CompanySettings = Database["public"]["Tables"]["company_settings"]["Row"];

function unwrap<T>(r: { data: T | null; error: { message: string } | null }): T {
  if (r.error) throw new Error(r.error.message);
  return r.data as T;
}

export function usePatients(search: string) {
  return useQuery({
    queryKey: ["patients", search],
    queryFn: async () => {
      let q = supabase
        .from("patients")
        .select("*, pregnancies(id,status,lmp_date,edd,risk_level)")
        .order("updated_at", { ascending: false })
        .limit(100);
      const s = search.trim().replace(/[,()]/g, "");
      if (s)
        q = q.or(
          `first_name.ilike.%${s}%,last_name.ilike.%${s}%,phone.ilike.%${s}%,patient_number.ilike.%${s}%`,
        );
      return unwrap(await q);
    },
  });
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: ["patient", id],
    queryFn: async () => {
      const [p, preg, enc, inv, appt, prescriptions, referrals] = await Promise.all([
        supabase.from("patients").select("*").eq("id", id).single(),
        supabase
          .from("pregnancies")
          .select("*")
          .eq("patient_id", id)
          .order("created_at", { ascending: false }),
        supabase
          .from("encounters")
          .select("*")
          .eq("patient_id", id)
          .order("visit_date", { ascending: false }),
        supabase
          .from("investigations")
          .select("*")
          .eq("patient_id", id)
          .order("created_at", { ascending: false }),
        supabase
          .from("appointments")
          .select("*")
          .eq("patient_id", id)
          .order("scheduled_at", { ascending: false }),
        supabase
          .from("prescriptions")
          .select("*")
          .eq("patient_id", id)
          .order("prescribed_at", { ascending: false }),
        supabase
          .from("referrals")
          .select("*")
          .eq("patient_id", id)
          .order("referred_at", { ascending: false }),
      ]);
      return {
        patient: unwrap(p),
        pregnancies: unwrap(preg),
        encounters: unwrap(enc),
        investigations: unwrap(inv),
        appointments: unwrap(appt),
        prescriptions: unwrap(prescriptions),
        referrals: unwrap(referrals),
      };
    },
  });
}

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      // Read the persisted session locally so the authenticated shell does not
      // disappear merely because the device temporarily lost connectivity.
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user.id;
      if (!uid) return null;
      const [prof, roles] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", uid),
      ]);
      return {
        user: data.session!.user,
        profile: prof.data,
        roles: (roles.data ?? []).map((r) => r.role),
      };
    },
  });
}

export function useCompanySettings() {
  return useQuery({
    queryKey: ["company-settings"],
    queryFn: async () => {
      const result = await supabase
        .from("company_settings")
        .select("*")
        .eq("singleton", true)
        .maybeSingle();
      return unwrap(result);
    },
    staleTime: 5 * 60 * 1000,
  });
}
