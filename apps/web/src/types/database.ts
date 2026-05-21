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
      event_lifecycle_status:
        | "draft"
        | "scheduled"
        | "ready"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "archived";
      event_type:
        | "civil"
        | "customary"
        | "religious"
        | "reception"
        | "brunch"
        | "other";
      file_scope_type: "platform" | "project" | "event" | "guest";
      membership_status: "active" | "invited" | "suspended" | "removed";
      project_lifecycle_status:
        | "lead"
        | "draft"
        | "submitted"
        | "approved"
        | "active"
        | "ready_for_invitations"
        | "event_operations"
        | "completed"
        | "archived";
      role_scope_type: "global" | "project" | "event" | "custom";
      workflow_task_scope: "project" | "event";
      workflow_task_status:
        | "not_started"
        | "in_progress"
        | "blocked"
        | "done"
        | "not_applicable";
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
        Relationships: [];
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
        Relationships: [];
      };
      event_members: {
        Insert: {
          assigned_by?: string | null;
          event_id: string;
          role_id: string;
          status?: Database["public"]["Enums"]["membership_status"];
          user_id: string;
        };
        Row: {
          assigned_at: string;
          assigned_by: string | null;
          created_at: string;
          event_id: string;
          id: string;
          role_id: string;
          status: Database["public"]["Enums"]["membership_status"];
          updated_at: string;
          user_id: string;
        };
        Update: {
          assigned_by?: string | null;
          role_id?: string;
          status?: Database["public"]["Enums"]["membership_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_members_assigned_by_fkey";
            columns: ["assigned_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_members_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_members_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Insert: {
          created_by?: string | null;
          ends_at?: string | null;
          event_code?: string;
          event_date?: string | null;
          event_type: Database["public"]["Enums"]["event_type"];
          name: string;
          project_id: string;
          starts_at?: string | null;
          status?: Database["public"]["Enums"]["event_lifecycle_status"];
          updated_by?: string | null;
          venue_address?: string | null;
          venue_name?: string | null;
        };
        Row: {
          created_at: string;
          created_by: string | null;
          ends_at: string | null;
          event_code: string;
          event_date: string | null;
          event_type: Database["public"]["Enums"]["event_type"];
          id: string;
          name: string;
          project_id: string;
          starts_at: string | null;
          status: Database["public"]["Enums"]["event_lifecycle_status"];
          updated_at: string;
          updated_by: string | null;
          venue_address: string | null;
          venue_name: string | null;
        };
        Update: {
          ends_at?: string | null;
          event_code?: string;
          event_date?: string | null;
          event_type?: Database["public"]["Enums"]["event_type"];
          name?: string;
          starts_at?: string | null;
          status?: Database["public"]["Enums"]["event_lifecycle_status"];
          updated_at?: string;
          updated_by?: string | null;
          venue_address?: string | null;
          venue_name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "events_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "wedding_projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "events_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [];
      };
      project_members: {
        Insert: {
          assigned_by?: string | null;
          project_id: string;
          role_id: string;
          status?: Database["public"]["Enums"]["membership_status"];
          user_id: string;
        };
        Row: {
          assigned_at: string;
          assigned_by: string | null;
          created_at: string;
          id: string;
          project_id: string;
          role_id: string;
          status: Database["public"]["Enums"]["membership_status"];
          updated_at: string;
          user_id: string;
        };
        Update: {
          assigned_by?: string | null;
          role_id?: string;
          status?: Database["public"]["Enums"]["membership_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_members_assigned_by_fkey";
            columns: ["assigned_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_members_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "wedding_projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_members_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      wedding_projects: {
        Insert: {
          bride_name: string;
          created_by?: string | null;
          groom_name: string;
          internal_notes?: string | null;
          preferred_language?: string;
          primary_contact_email?: string | null;
          primary_contact_name?: string | null;
          primary_contact_phone?: string | null;
          project_code?: string;
          project_year?: number;
          status?: Database["public"]["Enums"]["project_lifecycle_status"];
          timeline_notes?: string | null;
          updated_by?: string | null;
          workflow_template_version?: number;
        };
        Row: {
          bride_name: string;
          created_at: string;
          created_by: string | null;
          groom_name: string;
          id: string;
          internal_notes: string | null;
          preferred_language: string;
          primary_contact_email: string | null;
          primary_contact_name: string | null;
          primary_contact_phone: string | null;
          project_code: string;
          project_year: number;
          status: Database["public"]["Enums"]["project_lifecycle_status"];
          timeline_notes: string | null;
          updated_at: string;
          updated_by: string | null;
          workflow_template_version: number;
        };
        Update: {
          bride_name?: string;
          groom_name?: string;
          internal_notes?: string | null;
          preferred_language?: string;
          primary_contact_email?: string | null;
          primary_contact_name?: string | null;
          primary_contact_phone?: string | null;
          project_code?: string;
          project_year?: number;
          status?: Database["public"]["Enums"]["project_lifecycle_status"];
          timeline_notes?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          workflow_template_version?: number;
        };
        Relationships: [];
      };
      workflow_tasks: {
        Insert: {
          created_by?: string | null;
          event_id?: string | null;
          project_id: string;
          requirement_ids?: string[];
          scope: Database["public"]["Enums"]["workflow_task_scope"];
          sort_order?: number;
          status?: Database["public"]["Enums"]["workflow_task_status"];
          task_key: string;
          title: string;
          updated_by?: string | null;
        };
        Row: {
          created_at: string;
          created_by: string | null;
          event_id: string | null;
          id: string;
          project_id: string;
          requirement_ids: string[];
          scope: Database["public"]["Enums"]["workflow_task_scope"];
          sort_order: number;
          status: Database["public"]["Enums"]["workflow_task_status"];
          task_key: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Update: {
          requirement_ids?: string[];
          sort_order?: number;
          status?: Database["public"]["Enums"]["workflow_task_status"];
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "workflow_tasks_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_tasks_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_tasks_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "wedding_projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_tasks_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_user_can_access_event: {
        Args: {
          p_event_id: string;
          p_permission?: string;
        };
        Returns: boolean;
      };
      current_user_can_access_project: {
        Args: {
          p_permission?: string;
          p_project_id: string;
        };
        Returns: boolean;
      };
      current_user_has_permission: {
        Args: {
          p_permission: string;
          p_scope?: Database["public"]["Enums"]["role_scope_type"];
          p_scope_id?: string | null;
        };
        Returns: boolean;
      };
    };
  };
};
