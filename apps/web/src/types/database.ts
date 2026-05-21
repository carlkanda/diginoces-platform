export type Json =
  | boolean
  | null
  | number
  | string
  | Json[]
  | {
      [key: string]: Json | undefined;
    };

export type Database = {
  public: {
    Enums: {
      audit_source: "api" | "auth" | "system" | "storage";
      file_scope_type: "platform" | "project" | "event" | "guest";
      role_scope_type: "global" | "project" | "event" | "custom";
    };
    Tables: {
      app_users: {
        Insert: {
          display_name?: string | null;
          email: string;
          id: string;
        };
        Row: {
          created_at: string;
          display_name: string | null;
          email: string;
          id: string;
          updated_at: string;
        };
        Update: {
          display_name?: string | null;
          email?: string;
          updated_at?: string;
        };
      };
      audit_logs: {
        Insert: {
          action: string;
          actor_user_id?: string | null;
          new_value?: Json | null;
          object_id?: string | null;
          object_type: string;
          old_value?: Json | null;
          reason?: string | null;
          source: Database["public"]["Enums"]["audit_source"];
        };
        Row: {
          action: string;
          actor_user_id: string | null;
          created_at: string;
          id: string;
          new_value: Json | null;
          object_id: string | null;
          object_type: string;
          old_value: Json | null;
          reason: string | null;
          source: Database["public"]["Enums"]["audit_source"];
        };
        Update: never;
      };
      files: {
        Insert: {
          bucket: string;
          category: string;
          created_by?: string | null;
          scope_id?: string | null;
          scope_type: Database["public"]["Enums"]["file_scope_type"];
          storage_path: string;
          version?: number;
        };
        Row: {
          bucket: string;
          category: string;
          created_at: string;
          created_by: string | null;
          id: string;
          is_active: boolean;
          scope_id: string | null;
          scope_type: Database["public"]["Enums"]["file_scope_type"];
          storage_path: string;
          version: number;
        };
        Update: {
          is_active?: boolean;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
