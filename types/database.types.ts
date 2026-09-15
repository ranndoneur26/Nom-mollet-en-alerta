export type IncidentStatus =
  | "moderacio"
  | "pendent"
  | "estudi"
  | "assignada"
  | "tramitacio"
  | "resolta"
  | "tancada"
  | "fora"
  | "duplicada"
  | "rebutjada";

export type UrgencyLevel = "normal" | "important" | "urgent" | "risc";

export type UserRole =
  | "citizen"
  | "moderator"
  | "gestor"
  | "regidor"
  | "tecnic"
  | "consulta"
  | "admin"
  | "superadmin";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          alias: string;
          role: UserRole;
          blocked: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          alias: string;
          role?: UserRole;
          blocked?: boolean;
        };
        Update: Partial<{
          alias: string;
          role: UserRole;
          blocked: boolean;
        }>;
      };
      neighborhoods: {
        Row: { id: string; name: string; lat: number | null; lng: number | null };
        Insert: { id: string; name: string; lat?: number; lng?: number };
        Update: Partial<{ name: string; lat: number; lng: number }>;
      };
      municipal_areas: {
        Row: { id: number; name: string };
        Insert: { id?: number; name: string };
        Update: Partial<{ name: string }>;
      };
      councillors: {
        Row: {
          id: number;
          full_name: string;
          party: string | null;
          role_title: string | null;
          areas: string[];
          neighborhoods: string[];
          official_email: string | null;
          official_url: string | null;
        };
        Insert: Partial<Councillors_Row_Insert>;
        Update: Partial<Councillors_Row_Insert>;
      };
      categories: {
        Row: {
          id: number;
          name: string;
          default_area_id: number | null;
          default_councillor_id: number | null;
        };
        Insert: {
          id?: number;
          name: string;
          default_area_id?: number | null;
          default_councillor_id?: number | null;
        };
        Update: Partial<{
          name: string;
          default_area_id: number | null;
          default_councillor_id: number | null;
        }>;
      };
      subcategories: {
        Row: { id: number; category_id: number; name: string };
        Insert: { id?: number; category_id: number; name: string };
        Update: Partial<{ category_id: number; name: string }>;
      };
      incidents: {
        Row: {
          id: string;
          public_id: string;
          title: string;
          description: string;
          category_id: number | null;
          subcategory_id: number | null;
          latitude: number;
          longitude: number;
          address: string;
          neighborhood_id: string | null;
          status: IncidentStatus;
          urgency: UrgencyLevel;
          priority: string;
          author_id: string | null;
          assigned_area_id: number | null;
          assigned_councillor_id: number | null;
          support_count: number;
          duplicate_of: string | null;
          resolution_date: string | null;
          resolution_description: string | null;
          admin_response: string | null;
          estimated_resolution_date: string | null;
          out_of_scope_body: string | null;
          is_demo: boolean;
          demo_author_alias: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          title: string;
          description?: string;
          category_id?: number | null;
          subcategory_id?: number | null;
          latitude: number;
          longitude: number;
          address?: string;
          neighborhood_id?: string | null;
          urgency?: UrgencyLevel;
          author_id?: string | null;
        };
        Update: Partial<{
          title: string;
          description: string;
          status: IncidentStatus;
          urgency: UrgencyLevel;
          priority: string;
          assigned_area_id: number | null;
          assigned_councillor_id: number | null;
          duplicate_of: string | null;
          resolution_date: string | null;
          resolution_description: string | null;
          admin_response: string | null;
          estimated_resolution_date: string | null;
          out_of_scope_body: string | null;
        }>;
      };
      photos: {
        Row: { id: string; incident_id: string; url: string; is_primary: boolean; created_at: string };
        Insert: { incident_id: string; url: string; is_primary?: boolean };
        Update: Partial<{ url: string; is_primary: boolean }>;
      };
      comments: {
        Row: {
          id: string;
          incident_id: string;
          author_id: string | null;
          body: string;
          is_official: boolean;
          created_at: string;
        };
        Insert: { incident_id: string; author_id?: string | null; body: string; is_official?: boolean };
        Update: Partial<{ body: string }>;
      };
      supports: {
        Row: { incident_id: string; user_id: string; created_at: string };
        Insert: { incident_id: string; user_id: string };
        Update: never;
      };
      status_history: {
        Row: {
          id: number;
          incident_id: string;
          old_status: IncidentStatus | null;
          new_status: IncidentStatus;
          note: string | null;
          changed_by: string | null;
          changed_at: string;
        };
        Insert: {
          incident_id: string;
          old_status?: IncidentStatus | null;
          new_status: IncidentStatus;
          note?: string | null;
          changed_by?: string | null;
        };
        Update: never;
      };
      notifications: {
        Row: {
          id: number;
          user_id: string;
          incident_id: string | null;
          message: string;
          read: boolean;
          created_at: string;
        };
        Insert: { user_id: string; incident_id?: string | null; message: string };
        Update: Partial<{ read: boolean }>;
      };
      audit_log: {
        Row: {
          id: number;
          actor_id: string | null;
          action: string;
          entity: string;
          entity_id: string | null;
          old_value: unknown;
          new_value: unknown;
          created_at: string;
        };
        Insert: never;
        Update: never;
      };
    };
  };
}

interface Councillors_Row_Insert {
  id: number;
  full_name: string;
  party: string | null;
  role_title: string | null;
  areas: string[];
  neighborhoods: string[];
  official_email: string | null;
  official_url: string | null;
}
