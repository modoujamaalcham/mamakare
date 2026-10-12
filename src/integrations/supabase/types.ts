export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      company_settings: {
        Row: {
          address: string | null;
          created_at: string;
          email: string | null;
          id: string;
          logo_url: string | null;
          name: string;
          phone: string | null;
          singleton: boolean;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          logo_url?: string | null;
          name?: string;
          phone?: string | null;
          singleton?: boolean;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          logo_url?: string | null;
          name?: string;
          phone?: string | null;
          singleton?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      appointments: {
        Row: {
          appointment_type: string;
          created_at: string;
          created_by: string | null;
          id: string;
          location: string;
          notes: string | null;
          patient_id: string;
          reason: string | null;
          scheduled_at: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          appointment_type?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          location?: string;
          notes?: string | null;
          patient_id: string;
          reason?: string | null;
          scheduled_at: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          appointment_type?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          location?: string;
          notes?: string | null;
          patient_id?: string;
          reason?: string | null;
          scheduled_at?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: string;
          actor: string | null;
          at: string;
          id: number;
          record_id: string | null;
          table_name: string;
        };
        Insert: {
          action: string;
          actor?: string | null;
          at?: string;
          id?: number;
          record_id?: string | null;
          table_name: string;
        };
        Update: {
          action?: string;
          actor?: string | null;
          at?: string;
          id?: number;
          record_id?: string | null;
          table_name?: string;
        };
        Relationships: [];
      };
      encounters: {
        Row: {
          assessment: string | null;
          complaints: string | null;
          created_at: string;
          created_by: string | null;
          danger_flags: string[];
          diastolic: number | null;
          edema: string | null;
          fetal_heart_rate: number | null;
          fetal_movement: string | null;
          fundal_height_cm: number | null;
          hemoglobin: number | null;
          id: string;
          location: string;
          patient_id: string;
          plan: string | null;
          pregnancy_id: string | null;
          presentation: string | null;
          pulse: number | null;
          resp_rate: number | null;
          spo2: number | null;
          symptoms: string[];
          systolic: number | null;
          temperature: number | null;
          updated_at: string;
          urine_protein: string | null;
          visit_date: string;
          visit_type: string;
          weight_kg: number | null;
        };
        Insert: {
          assessment?: string | null;
          complaints?: string | null;
          created_at?: string;
          created_by?: string | null;
          danger_flags?: string[];
          diastolic?: number | null;
          edema?: string | null;
          fetal_heart_rate?: number | null;
          fetal_movement?: string | null;
          fundal_height_cm?: number | null;
          hemoglobin?: number | null;
          id?: string;
          location?: string;
          patient_id: string;
          plan?: string | null;
          pregnancy_id?: string | null;
          presentation?: string | null;
          pulse?: number | null;
          resp_rate?: number | null;
          spo2?: number | null;
          symptoms?: string[];
          systolic?: number | null;
          temperature?: number | null;
          updated_at?: string;
          urine_protein?: string | null;
          visit_date?: string;
          visit_type?: string;
          weight_kg?: number | null;
        };
        Update: {
          assessment?: string | null;
          complaints?: string | null;
          created_at?: string;
          created_by?: string | null;
          danger_flags?: string[];
          diastolic?: number | null;
          edema?: string | null;
          fetal_heart_rate?: number | null;
          fetal_movement?: string | null;
          fundal_height_cm?: number | null;
          hemoglobin?: number | null;
          id?: string;
          location?: string;
          patient_id?: string;
          plan?: string | null;
          pregnancy_id?: string | null;
          presentation?: string | null;
          pulse?: number | null;
          resp_rate?: number | null;
          spo2?: number | null;
          symptoms?: string[];
          systolic?: number | null;
          temperature?: number | null;
          updated_at?: string;
          urine_protein?: string | null;
          visit_date?: string;
          visit_type?: string;
          weight_kg?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "encounters_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "encounters_pregnancy_id_fkey";
            columns: ["pregnancy_id"];
            isOneToOne: false;
            referencedRelation: "pregnancies";
            referencedColumns: ["id"];
          },
        ];
      };
      investigations: {
        Row: {
          abnormal: boolean;
          created_at: string;
          created_by: string | null;
          due_date: string | null;
          encounter_id: string | null;
          id: string;
          name: string;
          notes: string | null;
          patient_id: string;
          pregnancy_id: string | null;
          result: string | null;
          result_date: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          abnormal?: boolean;
          created_at?: string;
          created_by?: string | null;
          due_date?: string | null;
          encounter_id?: string | null;
          id?: string;
          name: string;
          notes?: string | null;
          patient_id: string;
          pregnancy_id?: string | null;
          result?: string | null;
          result_date?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          abnormal?: boolean;
          created_at?: string;
          created_by?: string | null;
          due_date?: string | null;
          encounter_id?: string | null;
          id?: string;
          name?: string;
          notes?: string | null;
          patient_id?: string;
          pregnancy_id?: string | null;
          result?: string | null;
          result_date?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "investigations_encounter_id_fkey";
            columns: ["encounter_id"];
            isOneToOne: false;
            referencedRelation: "encounters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "investigations_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "investigations_pregnancy_id_fkey";
            columns: ["pregnancy_id"];
            isOneToOne: false;
            referencedRelation: "pregnancies";
            referencedColumns: ["id"];
          },
        ];
      };
      patients: {
        Row: {
          address: string | null;
          allergies: string | null;
          blood_group: string | null;
          created_at: string;
          created_by: string | null;
          date_of_birth: string | null;
          first_name: string;
          id: string;
          last_name: string;
          medical_history: string | null;
          next_of_kin_name: string | null;
          next_of_kin_phone: string | null;
          notes: string | null;
          patient_number: string;
          phone: string | null;
          region: string | null;
          status: string;
          updated_at: string;
          village_town: string | null;
        };
        Insert: {
          address?: string | null;
          allergies?: string | null;
          blood_group?: string | null;
          created_at?: string;
          created_by?: string | null;
          date_of_birth?: string | null;
          first_name: string;
          id?: string;
          last_name: string;
          medical_history?: string | null;
          next_of_kin_name?: string | null;
          next_of_kin_phone?: string | null;
          notes?: string | null;
          patient_number?: string;
          phone?: string | null;
          region?: string | null;
          status?: string;
          updated_at?: string;
          village_town?: string | null;
        };
        Update: {
          address?: string | null;
          allergies?: string | null;
          blood_group?: string | null;
          created_at?: string;
          created_by?: string | null;
          date_of_birth?: string | null;
          first_name?: string;
          id?: string;
          last_name?: string;
          medical_history?: string | null;
          next_of_kin_name?: string | null;
          next_of_kin_phone?: string | null;
          notes?: string | null;
          patient_number?: string;
          phone?: string | null;
          region?: string | null;
          status?: string;
          updated_at?: string;
          village_town?: string | null;
        };
        Relationships: [];
      };
      prescriptions: {
        Row: {
          created_at: string;
          created_by: string | null;
          dose: string | null;
          duration: string | null;
          encounter_id: string | null;
          frequency: string | null;
          id: string;
          instructions: string | null;
          medication: string;
          patient_id: string;
          pregnancy_id: string | null;
          prescription_group_id: string;
          prescribed_at: string;
          route: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          dose?: string | null;
          duration?: string | null;
          encounter_id?: string | null;
          frequency?: string | null;
          id?: string;
          instructions?: string | null;
          medication: string;
          patient_id: string;
          pregnancy_id?: string | null;
          prescription_group_id?: string;
          prescribed_at?: string;
          route?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          dose?: string | null;
          duration?: string | null;
          encounter_id?: string | null;
          frequency?: string | null;
          id?: string;
          instructions?: string | null;
          medication?: string;
          patient_id?: string;
          pregnancy_id?: string | null;
          prescription_group_id?: string;
          prescribed_at?: string;
          route?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "prescriptions_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "prescriptions_pregnancy_id_fkey";
            columns: ["pregnancy_id"];
            isOneToOne: false;
            referencedRelation: "pregnancies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "prescriptions_encounter_id_fkey";
            columns: ["encounter_id"];
            isOneToOne: false;
            referencedRelation: "encounters";
            referencedColumns: ["id"];
          },
        ];
      };
      referrals: {
        Row: {
          created_at: string;
          created_by: string | null;
          encounter_id: string | null;
          id: string;
          notes: string | null;
          patient_id: string;
          pregnancy_id: string | null;
          reason: string;
          referred_at: string;
          status: string;
          destination: string;
          updated_at: string;
          urgency: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          encounter_id?: string | null;
          id?: string;
          notes?: string | null;
          patient_id: string;
          pregnancy_id?: string | null;
          reason: string;
          referred_at?: string;
          status?: string;
          destination: string;
          updated_at?: string;
          urgency?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          encounter_id?: string | null;
          id?: string;
          notes?: string | null;
          patient_id?: string;
          pregnancy_id?: string | null;
          reason?: string;
          referred_at?: string;
          status?: string;
          destination?: string;
          updated_at?: string;
          urgency?: string;
        };
        Relationships: [
          {
            foreignKeyName: "referrals_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "referrals_pregnancy_id_fkey";
            columns: ["pregnancy_id"];
            isOneToOne: false;
            referencedRelation: "pregnancies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "referrals_encounter_id_fkey";
            columns: ["encounter_id"];
            isOneToOne: false;
            referencedRelation: "encounters";
            referencedColumns: ["id"];
          },
        ];
      };
      pregnancies: {
        Row: {
          created_at: string;
          created_by: string | null;
          edd: string | null;
          gravida: number | null;
          id: string;
          lmp_date: string | null;
          outcome_date: string | null;
          outcome_notes: string | null;
          parity: number | null;
          patient_id: string;
          risk_factors: string | null;
          risk_level: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          edd?: string | null;
          gravida?: number | null;
          id?: string;
          lmp_date?: string | null;
          outcome_date?: string | null;
          outcome_notes?: string | null;
          parity?: number | null;
          patient_id: string;
          risk_factors?: string | null;
          risk_level?: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          edd?: string | null;
          gravida?: number | null;
          id?: string;
          lmp_date?: string | null;
          outcome_date?: string | null;
          outcome_notes?: string | null;
          parity?: number | null;
          patient_id?: string;
          risk_factors?: string | null;
          risk_level?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pregnancies_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string;
          id: string;
          phone: string | null;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id: string;
          phone?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id?: string;
          phone?: string | null;
        };
        Relationships: [];
      };
      staff_invites: {
        Row: {
          accepted_at: string | null;
          accepted_user_id: string | null;
          created_at: string;
          email: string;
          expires_at: string;
          id: string;
          invited_by: string;
          role: Database["public"]["Enums"]["app_role"];
        };
        Insert: {
          accepted_at?: string | null;
          accepted_user_id?: string | null;
          created_at?: string;
          email: string;
          expires_at: string;
          id?: string;
          invited_by: string;
          role: Database["public"]["Enums"]["app_role"];
        };
        Update: {
          accepted_at?: string | null;
          accepted_user_id?: string | null;
          created_at?: string;
          email?: string;
          expires_at?: string;
          id?: string;
          invited_by?: string;
          role?: Database["public"]["Enums"]["app_role"];
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_staff: { Args: { _user_id: string }; Returns: boolean };
    };
    Enums: {
      app_role: "admin" | "doctor" | "nurse";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "doctor", "nurse"],
    },
  },
} as const;
