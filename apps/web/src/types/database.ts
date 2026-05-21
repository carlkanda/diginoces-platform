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
      guest_duplicate_reason:
        | "normalized_name"
        | "title_and_name"
        | "whatsapp_number";
      guest_duplicate_status: "open" | "dismissed" | "confirmed";
      guest_event_assignment_status: "assigned" | "not_invited" | "removed";
      guest_side: "bride" | "groom" | "both";
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
      guest_duplicate_candidates: {
        Insert: {
          matched_guest_id: string;
          project_id: string;
          reason: Database["public"]["Enums"]["guest_duplicate_reason"];
          source_guest_id: string;
          status?: Database["public"]["Enums"]["guest_duplicate_status"];
        };
        Row: {
          created_at: string;
          id: string;
          matched_guest_id: string;
          project_id: string;
          reason: Database["public"]["Enums"]["guest_duplicate_reason"];
          source_guest_id: string;
          status: Database["public"]["Enums"]["guest_duplicate_status"];
        };
        Update: {
          status?: Database["public"]["Enums"]["guest_duplicate_status"];
        };
        Relationships: [
          {
            foreignKeyName: "guest_duplicate_candidates_matched_guest_id_project_id_fkey";
            columns: ["matched_guest_id", "project_id"];
            isOneToOne: false;
            referencedRelation: "guests";
            referencedColumns: ["id", "project_id"];
          },
          {
            foreignKeyName: "guest_duplicate_candidates_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "wedding_projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "guest_duplicate_candidates_source_guest_id_project_id_fkey";
            columns: ["source_guest_id", "project_id"];
            isOneToOne: false;
            referencedRelation: "guests";
            referencedColumns: ["id", "project_id"];
          },
        ];
      };
      guest_event_assignments: {
        Insert: {
          created_by?: string | null;
          event_id: string;
          guest_id: string;
          invited?: boolean;
          project_id: string;
          status?: Database["public"]["Enums"]["guest_event_assignment_status"];
          updated_by?: string | null;
        };
        Row: {
          created_at: string;
          created_by: string | null;
          event_id: string;
          guest_id: string;
          id: string;
          invited: boolean;
          project_id: string;
          status: Database["public"]["Enums"]["guest_event_assignment_status"];
          updated_at: string;
          updated_by: string | null;
        };
        Update: {
          invited?: boolean;
          status?: Database["public"]["Enums"]["guest_event_assignment_status"];
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "guest_event_assignments_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "guest_event_assignments_event_id_project_id_fkey";
            columns: ["event_id", "project_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id", "project_id"];
          },
          {
            foreignKeyName: "guest_event_assignments_guest_id_project_id_fkey";
            columns: ["guest_id", "project_id"];
            isOneToOne: false;
            referencedRelation: "guests";
            referencedColumns: ["id", "project_id"];
          },
          {
            foreignKeyName: "guest_event_assignments_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "wedding_projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "guest_event_assignments_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      guest_tag_assignments: {
        Insert: {
          created_by?: string | null;
          guest_id: string;
          project_id: string;
          tag_id: string;
        };
        Row: {
          created_at: string;
          created_by: string | null;
          guest_id: string;
          id: string;
          project_id: string;
          tag_id: string;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "guest_tag_assignments_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "guest_tag_assignments_guest_id_project_id_fkey";
            columns: ["guest_id", "project_id"];
            isOneToOne: false;
            referencedRelation: "guests";
            referencedColumns: ["id", "project_id"];
          },
          {
            foreignKeyName: "guest_tag_assignments_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "wedding_projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "guest_tag_assignments_tag_id_project_id_fkey";
            columns: ["tag_id", "project_id"];
            isOneToOne: false;
            referencedRelation: "guest_tags";
            referencedColumns: ["id", "project_id"];
          },
        ];
      };
      guest_tags: {
        Insert: {
          color?: string | null;
          created_by?: string | null;
          is_internal?: boolean;
          name: string;
          project_id: string;
          slug: string;
        };
        Row: {
          color: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          is_internal: boolean;
          name: string;
          project_id: string;
          slug: string;
          updated_at: string;
        };
        Update: {
          color?: string | null;
          is_internal?: boolean;
          name?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "guest_tags_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "guest_tags_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "wedding_projects";
            referencedColumns: ["id"];
          },
        ];
      };
      guest_title_types: {
        Insert: {
          created_by?: string | null;
          default_guest_count?: number;
          is_system_default?: boolean;
          label: string;
          project_id: string;
          requires_admin_approval?: boolean;
          slug: string;
          sort_order?: number;
        };
        Row: {
          created_at: string;
          created_by: string | null;
          default_guest_count: number;
          id: string;
          is_system_default: boolean;
          label: string;
          project_id: string;
          requires_admin_approval: boolean;
          slug: string;
          sort_order: number;
          updated_at: string;
        };
        Update: {
          default_guest_count?: number;
          label?: string;
          requires_admin_approval?: boolean;
          slug?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "guest_title_types_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "guest_title_types_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "wedding_projects";
            referencedColumns: ["id"];
          },
        ];
      };
      guests: {
        Insert: {
          created_by?: string | null;
          display_name: string;
          guest_side: Database["public"]["Enums"]["guest_side"];
          guest_title_type_id?: string | null;
          internal_notes?: string | null;
          is_active?: boolean;
          is_printed_only?: boolean;
          preferred_language?: string | null;
          project_id: string;
          updated_by?: string | null;
          whatsapp_number?: string | null;
        };
        Row: {
          created_at: string;
          created_by: string | null;
          display_name: string;
          guest_side: Database["public"]["Enums"]["guest_side"];
          guest_title_type_id: string | null;
          id: string;
          internal_notes: string | null;
          is_active: boolean;
          is_printed_only: boolean;
          normalized_name: string;
          normalized_whatsapp: string | null;
          preferred_language: string | null;
          project_id: string;
          updated_at: string;
          updated_by: string | null;
          whatsapp_number: string | null;
        };
        Update: {
          display_name?: string;
          guest_side?: Database["public"]["Enums"]["guest_side"];
          guest_title_type_id?: string | null;
          internal_notes?: string | null;
          is_active?: boolean;
          is_printed_only?: boolean;
          preferred_language?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          whatsapp_number?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "guests_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "guests_guest_title_type_id_project_id_fkey";
            columns: ["guest_title_type_id", "project_id"];
            isOneToOne: false;
            referencedRelation: "guest_title_types";
            referencedColumns: ["id", "project_id"];
          },
          {
            foreignKeyName: "guests_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "wedding_projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "guests_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
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
          preferred_language?: string | null;
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
          preferred_language: string | null;
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
          preferred_language?: string | null;
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
        Relationships: [
          {
            foreignKeyName: "wedding_projects_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wedding_projects_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
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
            foreignKeyName: "workflow_tasks_event_matches_project";
            columns: ["event_id", "project_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id", "project_id"];
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
      current_user_can_manage_guest_side: {
        Args: {
          p_guest_side: Database["public"]["Enums"]["guest_side"];
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
