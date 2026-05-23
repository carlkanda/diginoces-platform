export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      app_users: {
        Row: {
          created_at: string;
          display_name: string | null;
          email: string;
          id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string | null;
          email: string;
          id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          email?: string;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
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
        Insert: {
          action: string;
          actor_user_id?: string | null;
          created_at?: string;
          id?: string;
          new_value?: Json | null;
          object_id?: string | null;
          object_type: string;
          old_value?: Json | null;
          reason?: string | null;
          source: Database["public"]["Enums"]["audit_source"];
        };
        Update: {
          action?: string;
          actor_user_id?: string | null;
          created_at?: string;
          id?: string;
          new_value?: Json | null;
          object_id?: string | null;
          object_type?: string;
          old_value?: Json | null;
          reason?: string | null;
          source?: Database["public"]["Enums"]["audit_source"];
        };
        Relationships: [];
      };
      event_members: {
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
        Insert: {
          assigned_at?: string;
          assigned_by?: string | null;
          created_at?: string;
          event_id: string;
          id?: string;
          role_id: string;
          status?: Database["public"]["Enums"]["membership_status"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          assigned_at?: string;
          assigned_by?: string | null;
          created_at?: string;
          event_id?: string;
          id?: string;
          role_id?: string;
          status?: Database["public"]["Enums"]["membership_status"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
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
        ];
      };
      events: {
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
          rsvp_deadline_at: string | null;
          starts_at: string | null;
          status: Database["public"]["Enums"]["event_lifecycle_status"];
          updated_at: string;
          updated_by: string | null;
          venue_address: string | null;
          venue_name: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          ends_at?: string | null;
          event_code: string;
          event_date?: string | null;
          event_type: Database["public"]["Enums"]["event_type"];
          id?: string;
          name: string;
          project_id: string;
          rsvp_deadline_at?: string | null;
          starts_at?: string | null;
          status?: Database["public"]["Enums"]["event_lifecycle_status"];
          updated_at?: string;
          updated_by?: string | null;
          venue_address?: string | null;
          venue_name?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          ends_at?: string | null;
          event_code?: string;
          event_date?: string | null;
          event_type?: Database["public"]["Enums"]["event_type"];
          id?: string;
          name?: string;
          project_id?: string;
          rsvp_deadline_at?: string | null;
          starts_at?: string | null;
          status?: Database["public"]["Enums"]["event_lifecycle_status"];
          updated_at?: string;
          updated_by?: string | null;
          venue_address?: string | null;
          venue_name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "events_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "wedding_projects";
            referencedColumns: ["id"];
          },
        ];
      };
      files: {
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
        Insert: {
          bucket: string;
          category: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          scope_id?: string | null;
          scope_type: Database["public"]["Enums"]["file_scope_type"];
          storage_path: string;
          version?: number;
        };
        Update: {
          bucket?: string;
          category?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          scope_id?: string | null;
          scope_type?: Database["public"]["Enums"]["file_scope_type"];
          storage_path?: string;
          version?: number;
        };
        Relationships: [];
      };
      guest_duplicate_candidates: {
        Row: {
          created_at: string;
          id: string;
          matched_guest_id: string;
          project_id: string;
          reason: Database["public"]["Enums"]["guest_duplicate_reason"];
          source_guest_id: string;
          status: Database["public"]["Enums"]["guest_duplicate_status"];
        };
        Insert: {
          created_at?: string;
          id?: string;
          matched_guest_id: string;
          project_id: string;
          reason: Database["public"]["Enums"]["guest_duplicate_reason"];
          source_guest_id: string;
          status?: Database["public"]["Enums"]["guest_duplicate_status"];
        };
        Update: {
          created_at?: string;
          id?: string;
          matched_guest_id?: string;
          project_id?: string;
          reason?: Database["public"]["Enums"]["guest_duplicate_reason"];
          source_guest_id?: string;
          status?: Database["public"]["Enums"]["guest_duplicate_status"];
        };
        Relationships: [
          {
            foreignKeyName: "guest_duplicate_candidates_match_project_match";
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
            foreignKeyName: "guest_duplicate_candidates_source_project_match";
            columns: ["source_guest_id", "project_id"];
            isOneToOne: false;
            referencedRelation: "guests";
            referencedColumns: ["id", "project_id"];
          },
        ];
      };
      guest_event_assignments: {
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
        Insert: {
          created_at?: string;
          created_by?: string | null;
          event_id: string;
          guest_id: string;
          id?: string;
          invited?: boolean;
          project_id: string;
          status?: Database["public"]["Enums"]["guest_event_assignment_status"];
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          event_id?: string;
          guest_id?: string;
          id?: string;
          invited?: boolean;
          project_id?: string;
          status?: Database["public"]["Enums"]["guest_event_assignment_status"];
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "guest_event_assignments_event_project_match";
            columns: ["event_id", "project_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id", "project_id"];
          },
          {
            foreignKeyName: "guest_event_assignments_guest_project_match";
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
        ];
      };
      guest_import_mappings: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          import_session_id: string;
          project_id: string;
          source_headers: Json;
          target_mapping: Json;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          import_session_id: string;
          project_id: string;
          source_headers?: Json;
          target_mapping?: Json;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          import_session_id?: string;
          project_id?: string;
          source_headers?: Json;
          target_mapping?: Json;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "guest_import_mappings_session_project_match";
            columns: ["import_session_id", "project_id"];
            isOneToOne: false;
            referencedRelation: "guest_import_sessions";
            referencedColumns: ["id", "project_id"];
          },
        ];
      };
      guest_import_rows: {
        Row: {
          approval_status: Database["public"]["Enums"]["guest_import_row_approval_status"];
          created_at: string;
          duplicate_severity: Database["public"]["Enums"]["guest_import_duplicate_severity"];
          duplicate_warnings: Json;
          id: string;
          import_session_id: string;
          linked_guest_id: string | null;
          mapped_fields: Json;
          project_id: string;
          raw_row_data: Json;
          review_notes: string | null;
          row_number: number;
          updated_at: string;
          validation_errors: Json;
          validation_status: Database["public"]["Enums"]["guest_import_row_validation_status"];
        };
        Insert: {
          approval_status?: Database["public"]["Enums"]["guest_import_row_approval_status"];
          created_at?: string;
          duplicate_severity?: Database["public"]["Enums"]["guest_import_duplicate_severity"];
          duplicate_warnings?: Json;
          id?: string;
          import_session_id: string;
          linked_guest_id?: string | null;
          mapped_fields?: Json;
          project_id: string;
          raw_row_data?: Json;
          review_notes?: string | null;
          row_number: number;
          updated_at?: string;
          validation_errors?: Json;
          validation_status?: Database["public"]["Enums"]["guest_import_row_validation_status"];
        };
        Update: {
          approval_status?: Database["public"]["Enums"]["guest_import_row_approval_status"];
          created_at?: string;
          duplicate_severity?: Database["public"]["Enums"]["guest_import_duplicate_severity"];
          duplicate_warnings?: Json;
          id?: string;
          import_session_id?: string;
          linked_guest_id?: string | null;
          mapped_fields?: Json;
          project_id?: string;
          raw_row_data?: Json;
          review_notes?: string | null;
          row_number?: number;
          updated_at?: string;
          validation_errors?: Json;
          validation_status?: Database["public"]["Enums"]["guest_import_row_validation_status"];
        };
        Relationships: [
          {
            foreignKeyName: "guest_import_rows_linked_guest_project_match";
            columns: ["linked_guest_id", "project_id"];
            isOneToOne: false;
            referencedRelation: "guests";
            referencedColumns: ["id", "project_id"];
          },
          {
            foreignKeyName: "guest_import_rows_session_project_match";
            columns: ["import_session_id", "project_id"];
            isOneToOne: false;
            referencedRelation: "guest_import_sessions";
            referencedColumns: ["id", "project_id"];
          },
        ];
      };
      guest_import_sessions: {
        Row: {
          applied_at: string | null;
          applied_by: string | null;
          approved_row_count: number;
          created_at: string;
          created_by: string | null;
          created_guest_count: number;
          duplicate_warning_count: number;
          id: string;
          import_side: Database["public"]["Enums"]["guest_side"];
          invalid_row_count: number;
          project_id: string;
          rejected_row_count: number;
          review_notes: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          row_count: number;
          source_file_type: string;
          source_filename: string;
          status: Database["public"]["Enums"]["guest_import_session_status"];
          submitted_at: string | null;
          updated_at: string;
          updated_by: string | null;
          uploaded_by: string | null;
          valid_row_count: number;
        };
        Insert: {
          applied_at?: string | null;
          applied_by?: string | null;
          approved_row_count?: number;
          created_at?: string;
          created_by?: string | null;
          created_guest_count?: number;
          duplicate_warning_count?: number;
          id?: string;
          import_side: Database["public"]["Enums"]["guest_side"];
          invalid_row_count?: number;
          project_id: string;
          rejected_row_count?: number;
          review_notes?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          row_count?: number;
          source_file_type?: string;
          source_filename: string;
          status?: Database["public"]["Enums"]["guest_import_session_status"];
          submitted_at?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          uploaded_by?: string | null;
          valid_row_count?: number;
        };
        Update: {
          applied_at?: string | null;
          applied_by?: string | null;
          approved_row_count?: number;
          created_at?: string;
          created_by?: string | null;
          created_guest_count?: number;
          duplicate_warning_count?: number;
          id?: string;
          import_side?: Database["public"]["Enums"]["guest_side"];
          invalid_row_count?: number;
          project_id?: string;
          rejected_row_count?: number;
          review_notes?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          row_count?: number;
          source_file_type?: string;
          source_filename?: string;
          status?: Database["public"]["Enums"]["guest_import_session_status"];
          submitted_at?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          uploaded_by?: string | null;
          valid_row_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "guest_import_sessions_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "wedding_projects";
            referencedColumns: ["id"];
          },
        ];
      };
      guest_public_tokens: {
        Row: {
          created_at: string;
          created_by: string | null;
          expires_at: string | null;
          guest_id: string;
          id: string;
          last_used_at: string | null;
          project_id: string;
          regenerated_from_token_id: string | null;
          revoked_at: string | null;
          revoked_by: string | null;
          status: Database["public"]["Enums"]["guest_public_token_status"];
          token_hash: string;
          token_preview: string;
          token_type: Database["public"]["Enums"]["guest_public_token_type"];
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          expires_at?: string | null;
          guest_id: string;
          id?: string;
          last_used_at?: string | null;
          project_id: string;
          regenerated_from_token_id?: string | null;
          revoked_at?: string | null;
          revoked_by?: string | null;
          status?: Database["public"]["Enums"]["guest_public_token_status"];
          token_hash: string;
          token_preview: string;
          token_type?: Database["public"]["Enums"]["guest_public_token_type"];
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          expires_at?: string | null;
          guest_id?: string;
          id?: string;
          last_used_at?: string | null;
          project_id?: string;
          regenerated_from_token_id?: string | null;
          revoked_at?: string | null;
          revoked_by?: string | null;
          status?: Database["public"]["Enums"]["guest_public_token_status"];
          token_hash?: string;
          token_preview?: string;
          token_type?: Database["public"]["Enums"]["guest_public_token_type"];
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "guest_public_tokens_guest_project_match";
            columns: ["guest_id", "project_id"];
            isOneToOne: false;
            referencedRelation: "guests";
            referencedColumns: ["id", "project_id"];
          },
          {
            foreignKeyName: "guest_public_tokens_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "wedding_projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "guest_public_tokens_regenerated_from_token_id_fkey";
            columns: ["regenerated_from_token_id"];
            isOneToOne: false;
            referencedRelation: "guest_public_tokens";
            referencedColumns: ["id"];
          },
        ];
      };
      guest_tag_assignments: {
        Row: {
          created_at: string;
          created_by: string | null;
          guest_id: string;
          id: string;
          project_id: string;
          tag_id: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          guest_id: string;
          id?: string;
          project_id: string;
          tag_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          guest_id?: string;
          id?: string;
          project_id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "guest_tag_assignments_guest_project_match";
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
            foreignKeyName: "guest_tag_assignments_tag_project_match";
            columns: ["tag_id", "project_id"];
            isOneToOne: false;
            referencedRelation: "guest_tags";
            referencedColumns: ["id", "project_id"];
          },
        ];
      };
      guest_tags: {
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
        Insert: {
          color?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_internal?: boolean;
          name: string;
          project_id: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          color?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_internal?: boolean;
          name?: string;
          project_id?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [
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
        Insert: {
          created_at?: string;
          created_by?: string | null;
          default_guest_count?: number;
          id?: string;
          is_system_default?: boolean;
          label: string;
          project_id: string;
          requires_admin_approval?: boolean;
          slug: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          default_guest_count?: number;
          id?: string;
          is_system_default?: boolean;
          label?: string;
          project_id?: string;
          requires_admin_approval?: boolean;
          slug?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [
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
          normalized_name: string | null;
          normalized_whatsapp: string | null;
          preferred_language: string | null;
          project_id: string;
          updated_at: string;
          updated_by: string | null;
          whatsapp_number: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          display_name: string;
          guest_side: Database["public"]["Enums"]["guest_side"];
          guest_title_type_id?: string | null;
          id?: string;
          internal_notes?: string | null;
          is_active?: boolean;
          is_printed_only?: boolean;
          normalized_name?: string | null;
          normalized_whatsapp?: string | null;
          preferred_language?: string | null;
          project_id: string;
          updated_at?: string;
          updated_by?: string | null;
          whatsapp_number?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          display_name?: string;
          guest_side?: Database["public"]["Enums"]["guest_side"];
          guest_title_type_id?: string | null;
          id?: string;
          internal_notes?: string | null;
          is_active?: boolean;
          is_printed_only?: boolean;
          normalized_name?: string | null;
          normalized_whatsapp?: string | null;
          preferred_language?: string | null;
          project_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          whatsapp_number?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "guests_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "wedding_projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "guests_title_type_project_match";
            columns: ["guest_title_type_id", "project_id"];
            isOneToOne: false;
            referencedRelation: "guest_title_types";
            referencedColumns: ["id", "project_id"];
          },
        ];
      };
      permissions: {
        Row: {
          created_at: string;
          description: string;
          requirement_ids: string[];
          slug: string;
        };
        Insert: {
          created_at?: string;
          description: string;
          requirement_ids?: string[];
          slug: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          requirement_ids?: string[];
          slug?: string;
        };
        Relationships: [];
      };
      project_members: {
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
        Insert: {
          assigned_at?: string;
          assigned_by?: string | null;
          created_at?: string;
          id?: string;
          project_id: string;
          role_id: string;
          status?: Database["public"]["Enums"]["membership_status"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          assigned_at?: string;
          assigned_by?: string | null;
          created_at?: string;
          id?: string;
          project_id?: string;
          role_id?: string;
          status?: Database["public"]["Enums"]["membership_status"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
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
        ];
      };
      role_assignments: {
        Row: {
          assigned_at: string;
          assigned_by: string | null;
          expires_at: string | null;
          id: string;
          role_id: string;
          scope: Database["public"]["Enums"]["role_scope_type"];
          scope_id: string | null;
          user_id: string;
        };
        Insert: {
          assigned_at?: string;
          assigned_by?: string | null;
          expires_at?: string | null;
          id?: string;
          role_id: string;
          scope: Database["public"]["Enums"]["role_scope_type"];
          scope_id?: string | null;
          user_id: string;
        };
        Update: {
          assigned_at?: string;
          assigned_by?: string | null;
          expires_at?: string | null;
          id?: string;
          role_id?: string;
          scope?: Database["public"]["Enums"]["role_scope_type"];
          scope_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "role_assignments_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
        ];
      };
      role_permissions: {
        Row: {
          created_at: string;
          permission_slug: string;
          role_id: string;
        };
        Insert: {
          created_at?: string;
          permission_slug: string;
          role_id: string;
        };
        Update: {
          created_at?: string;
          permission_slug?: string;
          role_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_slug_fkey";
            columns: ["permission_slug"];
            isOneToOne: false;
            referencedRelation: "permissions";
            referencedColumns: ["slug"];
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
        ];
      };
      roles: {
        Row: {
          created_at: string;
          description: string;
          id: string;
          is_system: boolean;
          name: string;
          requirement_ids: string[];
          requires_mfa: boolean;
          scope: Database["public"]["Enums"]["role_scope_type"];
          slug: string;
        };
        Insert: {
          created_at?: string;
          description: string;
          id?: string;
          is_system?: boolean;
          name: string;
          requirement_ids?: string[];
          requires_mfa?: boolean;
          scope: Database["public"]["Enums"]["role_scope_type"];
          slug: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: string;
          is_system?: boolean;
          name?: string;
          requirement_ids?: string[];
          requires_mfa?: boolean;
          scope?: Database["public"]["Enums"]["role_scope_type"];
          slug?: string;
        };
        Relationships: [];
      };
      rsvp_records: {
        Row: {
          created_at: string;
          created_by: string | null;
          deadline_state: Database["public"]["Enums"]["rsvp_deadline_state"];
          event_id: string;
          guest_id: string;
          id: string;
          last_changed_at: string | null;
          manual_review_required: boolean;
          project_id: string;
          public_token_id: string | null;
          source: Database["public"]["Enums"]["rsvp_source"];
          status: Database["public"]["Enums"]["rsvp_status"];
          submitted_at: string | null;
          submitted_by_user_id: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          deadline_state?: Database["public"]["Enums"]["rsvp_deadline_state"];
          event_id: string;
          guest_id: string;
          id?: string;
          last_changed_at?: string | null;
          manual_review_required?: boolean;
          project_id: string;
          public_token_id?: string | null;
          source?: Database["public"]["Enums"]["rsvp_source"];
          status?: Database["public"]["Enums"]["rsvp_status"];
          submitted_at?: string | null;
          submitted_by_user_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          deadline_state?: Database["public"]["Enums"]["rsvp_deadline_state"];
          event_id?: string;
          guest_id?: string;
          id?: string;
          last_changed_at?: string | null;
          manual_review_required?: boolean;
          project_id?: string;
          public_token_id?: string | null;
          source?: Database["public"]["Enums"]["rsvp_source"];
          status?: Database["public"]["Enums"]["rsvp_status"];
          submitted_at?: string | null;
          submitted_by_user_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "rsvp_records_event_project_match";
            columns: ["event_id", "project_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id", "project_id"];
          },
          {
            foreignKeyName: "rsvp_records_guest_project_match";
            columns: ["guest_id", "project_id"];
            isOneToOne: false;
            referencedRelation: "guests";
            referencedColumns: ["id", "project_id"];
          },
          {
            foreignKeyName: "rsvp_records_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "wedding_projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rsvp_records_public_token_id_fkey";
            columns: ["public_token_id"];
            isOneToOne: false;
            referencedRelation: "guest_public_tokens";
            referencedColumns: ["id"];
          },
        ];
      };
      wedding_projects: {
        Row: {
          bride_name: string;
          couple_photo_url: string | null;
          created_at: string;
          created_by: string | null;
          groom_name: string;
          guest_page_access_status: Database["public"]["Enums"]["guest_page_access_status"];
          guest_page_access_unlocked_at: string | null;
          guest_page_access_unlocked_by: string | null;
          guest_page_payment_exception_reason: string | null;
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
        Insert: {
          bride_name: string;
          couple_photo_url?: string | null;
          created_at?: string;
          created_by?: string | null;
          groom_name: string;
          guest_page_access_status?: Database["public"]["Enums"]["guest_page_access_status"];
          guest_page_access_unlocked_at?: string | null;
          guest_page_access_unlocked_by?: string | null;
          guest_page_payment_exception_reason?: string | null;
          id?: string;
          internal_notes?: string | null;
          preferred_language?: string | null;
          primary_contact_email?: string | null;
          primary_contact_name?: string | null;
          primary_contact_phone?: string | null;
          project_code: string;
          project_year?: number;
          status?: Database["public"]["Enums"]["project_lifecycle_status"];
          timeline_notes?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          workflow_template_version?: number;
        };
        Update: {
          bride_name?: string;
          couple_photo_url?: string | null;
          created_at?: string;
          created_by?: string | null;
          groom_name?: string;
          guest_page_access_status?: Database["public"]["Enums"]["guest_page_access_status"];
          guest_page_access_unlocked_at?: string | null;
          guest_page_access_unlocked_by?: string | null;
          guest_page_payment_exception_reason?: string | null;
          id?: string;
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
        Relationships: [];
      };
      workflow_tasks: {
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
        Insert: {
          created_at?: string;
          created_by?: string | null;
          event_id?: string | null;
          id?: string;
          project_id: string;
          requirement_ids?: string[];
          scope: Database["public"]["Enums"]["workflow_task_scope"];
          sort_order?: number;
          status?: Database["public"]["Enums"]["workflow_task_status"];
          task_key: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          event_id?: string | null;
          id?: string;
          project_id?: string;
          requirement_ids?: string[];
          scope?: Database["public"]["Enums"]["workflow_task_scope"];
          sort_order?: number;
          status?: Database["public"]["Enums"]["workflow_task_status"];
          task_key?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
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
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      apply_guest_import_approved_rows: {
        Args: { p_import_session_id: string };
        Returns: number;
      };
      create_guest_import_session: {
        Args: {
          p_import_side: Database["public"]["Enums"]["guest_side"];
          p_project_id: string;
          p_rows: Json;
          p_source_file_type: string;
          p_source_filename: string;
          p_source_headers: Json;
          p_target_mapping: Json;
        };
        Returns: {
          applied_at: string | null;
          applied_by: string | null;
          approved_row_count: number;
          created_at: string;
          created_by: string | null;
          created_guest_count: number;
          duplicate_warning_count: number;
          id: string;
          import_side: Database["public"]["Enums"]["guest_side"];
          invalid_row_count: number;
          project_id: string;
          rejected_row_count: number;
          review_notes: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          row_count: number;
          source_file_type: string;
          source_filename: string;
          status: Database["public"]["Enums"]["guest_import_session_status"];
          submitted_at: string | null;
          updated_at: string;
          updated_by: string | null;
          uploaded_by: string | null;
          valid_row_count: number;
        };
        SetofOptions: {
          from: "*";
          to: "guest_import_sessions";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      create_guest_public_token: {
        Args: { p_expires_at?: string; p_guest_id: string };
        Returns: {
          expires_at: string | null;
          guest_id: string;
          project_id: string;
          token: string;
          token_id: string;
          token_preview: string;
        }[];
      };
      current_user_can_access_event: {
        Args: { p_event_id: string; p_permission?: string };
        Returns: boolean;
      };
      current_user_can_access_project: {
        Args: { p_permission?: string; p_project_id: string };
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
          p_scope_id?: string;
        };
        Returns: boolean;
      };
      get_project_rsvp_summary: {
        Args: { p_project_id: string };
        Returns: Json;
      };
      preview_guest_public_page: {
        Args: { p_guest_id: string };
        Returns: Json;
      };
      replace_guest_foundation_assignments: {
        Args: {
          p_event_ids?: string[];
          p_guest_id: string;
          p_tag_ids?: string[];
        };
        Returns: undefined;
      };
      resolve_guest_public_page: { Args: { p_token: string }; Returns: Json };
      review_guest_import_rows: {
        Args: {
          p_approved_row_ids?: string[];
          p_held_row_ids?: string[];
          p_import_session_id: string;
          p_rejected_row_ids?: string[];
          p_review_notes?: string;
        };
        Returns: undefined;
      };
      revoke_guest_public_token: {
        Args: { p_token_id: string };
        Returns: undefined;
      };
      save_guest_import_preview: {
        Args: {
          p_import_session_id: string;
          p_project_id: string;
          p_rows: Json;
          p_source_headers: Json;
          p_summary: Json;
          p_target_mapping: Json;
        };
        Returns: undefined;
      };
      submit_guest_import_session: {
        Args: { p_import_session_id: string };
        Returns: undefined;
      };
      submit_public_rsvp: {
        Args: {
          p_event_id: string;
          p_preferred_language?: string;
          p_response: Database["public"]["Enums"]["rsvp_status"];
          p_token: string;
        };
        Returns: Json;
      };
    };
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
      file_scope_type:
        | "platform"
        | "project"
        | "event"
        | "guest"
        | "invitation";
      guest_duplicate_reason:
        | "normalized_name"
        | "title_and_name"
        | "whatsapp_number";
      guest_duplicate_status: "open" | "dismissed" | "confirmed";
      guest_event_assignment_status: "assigned" | "not_invited" | "removed";
      guest_import_duplicate_severity:
        | "clear"
        | "warning"
        | "needs_review"
        | "blocked";
      guest_import_row_approval_status:
        | "pending"
        | "approved"
        | "rejected"
        | "held"
        | "applied";
      guest_import_row_validation_status:
        | "pending"
        | "valid"
        | "warning"
        | "blocked";
      guest_import_session_status:
        | "draft"
        | "mapping_saved"
        | "previewed"
        | "validation_failed"
        | "ready_for_review"
        | "partially_approved"
        | "approved"
        | "rejected"
        | "applied"
        | "cancelled"
        | "failed";
      guest_page_access_status:
        | "locked"
        | "payment_confirmed"
        | "exception_override";
      guest_public_token_status: "active" | "revoked" | "expired";
      guest_public_token_type: "guest_public_page" | "check_in";
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
      rsvp_deadline_state: "open" | "manual_review";
      rsvp_source:
        | "public_guest_page"
        | "manual"
        | "phone_call"
        | "whatsapp"
        | "in_person"
        | "family_confirmation";
      rsvp_status:
        | "pending"
        | "yes"
        | "no"
        | "maybe"
        | "manual_review"
        | "locked";
      workflow_task_scope: "project" | "event";
      workflow_task_status:
        | "not_started"
        | "in_progress"
        | "blocked"
        | "done"
        | "not_applicable";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      audit_source: ["api", "auth", "system", "storage"],
      event_lifecycle_status: [
        "draft",
        "scheduled",
        "ready",
        "in_progress",
        "completed",
        "cancelled",
        "archived",
      ],
      event_type: [
        "civil",
        "customary",
        "religious",
        "reception",
        "brunch",
        "other",
      ],
      file_scope_type: ["platform", "project", "event", "guest"],
      guest_duplicate_reason: [
        "normalized_name",
        "title_and_name",
        "whatsapp_number",
      ],
      guest_duplicate_status: ["open", "dismissed", "confirmed"],
      guest_event_assignment_status: ["assigned", "not_invited", "removed"],
      guest_import_duplicate_severity: [
        "clear",
        "warning",
        "needs_review",
        "blocked",
      ],
      guest_import_row_approval_status: [
        "pending",
        "approved",
        "rejected",
        "held",
        "applied",
      ],
      guest_import_row_validation_status: [
        "pending",
        "valid",
        "warning",
        "blocked",
      ],
      guest_import_session_status: [
        "draft",
        "mapping_saved",
        "previewed",
        "validation_failed",
        "ready_for_review",
        "partially_approved",
        "approved",
        "rejected",
        "applied",
        "cancelled",
        "failed",
      ],
      guest_page_access_status: [
        "locked",
        "payment_confirmed",
        "exception_override",
      ],
      guest_public_token_status: ["active", "revoked", "expired"],
      guest_public_token_type: ["guest_public_page", "check_in"],
      guest_side: ["bride", "groom", "both"],
      membership_status: ["active", "invited", "suspended", "removed"],
      project_lifecycle_status: [
        "lead",
        "draft",
        "submitted",
        "approved",
        "active",
        "ready_for_invitations",
        "event_operations",
        "completed",
        "archived",
      ],
      role_scope_type: ["global", "project", "event", "custom"],
      rsvp_deadline_state: ["open", "manual_review"],
      rsvp_source: [
        "public_guest_page",
        "manual",
        "phone_call",
        "whatsapp",
        "in_person",
        "family_confirmation",
      ],
      rsvp_status: ["pending", "yes", "no", "maybe", "manual_review", "locked"],
      workflow_task_scope: ["project", "event"],
      workflow_task_status: [
        "not_started",
        "in_progress",
        "blocked",
        "done",
        "not_applicable",
      ],
    },
  },
} as const;
