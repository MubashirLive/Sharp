export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      academic_sessions: {
        Row: {
          academic_year: string
          created_at: string | null
          editor_heartbeat: string | null
          end_date: string
          id: string
          is_current: boolean | null
          school_id: string | null
          start_date: string
          version: number | null
        }
        Insert: {
          academic_year: string
          created_at?: string | null
          editor_heartbeat?: string | null
          end_date: string
          id?: string
          is_current?: boolean | null
          school_id?: string | null
          start_date: string
          version?: number | null
        }
        Update: {
          academic_year?: string
          created_at?: string | null
          editor_heartbeat?: string | null
          end_date?: string
          id?: string
          is_current?: boolean | null
          school_id?: string | null
          start_date?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "academic_sessions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          academic_year_id: string
          class_id: string
          created_at: string | null
          date: string
          id: string
          marked_by: string
          school_id: string
          section_id: string
          updated_at: string | null
        }
        Insert: {
          academic_year_id: string
          class_id: string
          created_at?: string | null
          date: string
          id?: string
          marked_by: string
          school_id: string
          section_id: string
          updated_at?: string | null
        }
        Update: {
          academic_year_id?: string
          class_id?: string
          created_at?: string | null
          date?: string
          id?: string
          marked_by?: string
          school_id?: string
          section_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          attendance_id: string
          created_at: string | null
          id: string
          school_id: string | null
          status: string
          student_id: string
        }
        Insert: {
          attendance_id: string
          created_at?: string | null
          id?: string
          school_id?: string | null
          status: string
          student_id: string
        }
        Update: {
          attendance_id?: string
          created_at?: string | null
          id?: string
          school_id?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_attendance_id_fkey"
            columns: ["attendance_id"]
            isOneToOne: false
            referencedRelation: "attendance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_settings: {
        Row: {
          allow_late_marking: boolean | null
          consecutive_absence_threshold: number | null
          created_at: string | null
          edit_window_hours: number | null
          id: string
          late_marking_threshold_minutes: number | null
          marking_type: string | null
          min_attendance_percentage: number | null
          notify_on_consecutive_absence: boolean | null
          school_id: string
          updated_at: string | null
        }
        Insert: {
          allow_late_marking?: boolean | null
          consecutive_absence_threshold?: number | null
          created_at?: string | null
          edit_window_hours?: number | null
          id?: string
          late_marking_threshold_minutes?: number | null
          marking_type?: string | null
          min_attendance_percentage?: number | null
          notify_on_consecutive_absence?: boolean | null
          school_id: string
          updated_at?: string | null
        }
        Update: {
          allow_late_marking?: boolean | null
          consecutive_absence_threshold?: number | null
          created_at?: string | null
          edit_window_hours?: number | null
          id?: string
          late_marking_threshold_minutes?: number | null
          marking_type?: string | null
          min_attendance_percentage?: number | null
          notify_on_consecutive_absence?: boolean | null
          school_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_settings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          attachment_urls: string[] | null
          calendar_id: string
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string | null
          date: string
          declared_by: string
          detail: string | null
          end_date: string | null
          event_type: string
          exam_id: string | null
          half_day_fraction: number | null
          id: string
          include_students: boolean | null
          is_half_day: boolean | null
          notify: boolean | null
          notify_at: string | null
          published_at: string | null
          scheduled_publish_at: string | null
          school_id: string
          scope: string
          scope_ids: string[] | null
          specific_dates: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          attachment_urls?: string[] | null
          calendar_id: string
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          date: string
          declared_by: string
          detail?: string | null
          end_date?: string | null
          event_type: string
          exam_id?: string | null
          half_day_fraction?: number | null
          id?: string
          include_students?: boolean | null
          is_half_day?: boolean | null
          notify?: boolean | null
          notify_at?: string | null
          published_at?: string | null
          scheduled_publish_at?: string | null
          school_id: string
          scope: string
          scope_ids?: string[] | null
          specific_dates?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          attachment_urls?: string[] | null
          calendar_id?: string
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          date?: string
          declared_by?: string
          detail?: string | null
          end_date?: string | null
          event_type?: string
          exam_id?: string | null
          half_day_fraction?: number | null
          id?: string
          include_students?: boolean | null
          is_half_day?: boolean | null
          notify?: boolean | null
          notify_at?: string | null
          published_at?: string | null
          scheduled_publish_at?: string | null
          school_id?: string
          scope?: string
          scope_ids?: string[] | null
          specific_dates?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "school_calendar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_declared_by_fkey"
            columns: ["declared_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      class_session_dates: {
        Row: {
          academic_year_id: string
          class_id: string
          created_at: string | null
          created_by: string | null
          end_date: string
          id: string
          school_id: string
          start_date: string
        }
        Insert: {
          academic_year_id: string
          class_id: string
          created_at?: string | null
          created_by?: string | null
          end_date: string
          id?: string
          school_id: string
          start_date: string
        }
        Update: {
          academic_year_id?: string
          class_id?: string
          created_at?: string | null
          created_by?: string | null
          end_date?: string
          id?: string
          school_id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_session_dates_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_session_dates_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_session_dates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_session_dates_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      class_teachers: {
        Row: {
          academic_year_id: string
          assigned_at: string | null
          assigned_by: string | null
          class_id: string
          id: string
          school_id: string
          section_id: string
          staff_profile_id: string
          updated_at: string | null
        }
        Insert: {
          academic_year_id: string
          assigned_at?: string | null
          assigned_by?: string | null
          class_id: string
          id?: string
          school_id: string
          section_id: string
          staff_profile_id: string
          updated_at?: string | null
        }
        Update: {
          academic_year_id?: string
          assigned_at?: string | null
          assigned_by?: string | null
          class_id?: string
          id?: string
          school_id?: string
          section_id?: string
          staff_profile_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_teachers_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_teachers_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_teachers_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_teachers_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_teachers_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: true
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_teachers_staff_profile_id_fkey"
            columns: ["staff_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          acronym: string | null
          created_at: string | null
          display_order: number | null
          end_date: string | null
          id: string
          name: string | null
          school_id: string | null
          session_id: string | null
          start_date: string | null
          term_structure: string | null
          wing: string | null
          wing_id: string | null
        }
        Insert: {
          acronym?: string | null
          created_at?: string | null
          display_order?: number | null
          end_date?: string | null
          id?: string
          name?: string | null
          school_id?: string | null
          session_id?: string | null
          start_date?: string | null
          term_structure?: string | null
          wing?: string | null
          wing_id?: string | null
        }
        Update: {
          acronym?: string | null
          created_at?: string | null
          display_order?: number | null
          end_date?: string | null
          id?: string
          name?: string | null
          school_id?: string | null
          session_id?: string | null
          start_date?: string | null
          term_structure?: string | null
          wing?: string | null
          wing_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_wing_id_fkey"
            columns: ["wing_id"]
            isOneToOne: false
            referencedRelation: "wings"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          is_active: boolean
          joined_at: string
          last_read_at: string | null
          profile_id: string
          role_in_chat: Database["public"]["Enums"]["participant_role"]
        }
        Insert: {
          conversation_id: string
          id?: string
          is_active?: boolean
          joined_at?: string
          last_read_at?: string | null
          profile_id: string
          role_in_chat?: Database["public"]["Enums"]["participant_role"]
        }
        Update: {
          conversation_id?: string
          id?: string
          is_active?: boolean
          joined_at?: string
          last_read_at?: string | null
          profile_id?: string
          role_in_chat?: Database["public"]["Enums"]["participant_role"]
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_reads: {
        Row: {
          conversation_id: string
          id: string
          last_read_at: string
          last_read_msg: string | null
          profile_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          last_read_at?: string
          last_read_msg?: string | null
          profile_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          last_read_at?: string
          last_read_msg?: string | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_reads_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_reads_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_archived: boolean
          name: string | null
          school_id: string
          type: Database["public"]["Enums"]["conversation_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_archived?: boolean
          name?: string | null
          school_id: string
          type: Database["public"]["Enums"]["conversation_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_archived?: boolean
          name?: string | null
          school_id?: string
          type?: Database["public"]["Enums"]["conversation_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      department_incharges: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          department_id: string
          id: string
          is_active: boolean | null
          school_id: string
          staff_profile_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          department_id: string
          id?: string
          is_active?: boolean | null
          school_id: string
          staff_profile_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          department_id?: string
          id?: string
          is_active?: boolean | null
          school_id?: string
          staff_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_incharges_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_incharges_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_incharges_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_incharges_staff_profile_id_fkey"
            columns: ["staff_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      department_staff: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          department_id: string
          id: string
          school_id: string
          staff_profile_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          department_id: string
          id?: string
          school_id: string
          staff_profile_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          department_id?: string
          id?: string
          school_id?: string
          staff_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_staff_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_staff_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_staff_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_staff_staff_profile_id_fkey"
            columns: ["staff_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string | null
          created_at: string | null
          editor_heartbeat: string | null
          id: string
          incharges: Json | null
          members: Json | null
          messenger_settings: Json | null
          name: string
          school_id: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          editor_heartbeat?: string | null
          id?: string
          incharges?: Json | null
          members?: Json | null
          messenger_settings?: Json | null
          name: string
          school_id: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          editor_heartbeat?: string | null
          id?: string
          incharges?: Json | null
          members?: Json | null
          messenger_settings?: Json | null
          name?: string
          school_id?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: []
      }
      departments_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          change_summary: string | null
          changed_fields: Json | null
          created_at: string | null
          department_id: string
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          change_summary?: string | null
          changed_fields?: Json | null
          created_at?: string | null
          department_id: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          change_summary?: string | null
          changed_fields?: Json | null
          created_at?: string | null
          department_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_audit_log_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      event_history: {
        Row: {
          action: string
          actor_id: string
          broadcast_message_id: string | null
          changed_fields: Json | null
          created_at: string | null
          event_id: string
          id: string
          school_id: string | null
        }
        Insert: {
          action: string
          actor_id: string
          broadcast_message_id?: string | null
          changed_fields?: Json | null
          created_at?: string | null
          event_id: string
          id?: string
          school_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          broadcast_message_id?: string | null
          changed_fields?: Json | null
          created_at?: string | null
          event_id?: string
          id?: string
          school_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_history_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_history_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_history_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      event_task_completions: {
        Row: {
          done: boolean | null
          done_at: string | null
          event_id: string
          id: string
          school_id: string | null
          staff_id: string
        }
        Insert: {
          done?: boolean | null
          done_at?: string | null
          event_id: string
          id?: string
          school_id?: string | null
          staff_id: string
        }
        Update: {
          done?: boolean | null
          done_at?: string | null
          event_id?: string
          id?: string
          school_id?: string | null
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_task_completions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_task_completions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_task_completions_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      homework: {
        Row: {
          assigned_to_class: string | null
          assigned_to_section: string | null
          attached_file: string | null
          attached_file_name: string | null
          attached_file_size: number | null
          created_at: string | null
          description: string | null
          due_date: string
          id: string
          instructions: string | null
          is_submitted: boolean | null
          school_id: string | null
          status: string | null
          subject_id: string | null
          submitted_by: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to_class?: string | null
          assigned_to_section?: string | null
          attached_file?: string | null
          attached_file_name?: string | null
          attached_file_size?: number | null
          created_at?: string | null
          description?: string | null
          due_date: string
          id?: string
          instructions?: string | null
          is_submitted?: boolean | null
          school_id?: string | null
          status?: string | null
          subject_id?: string | null
          submitted_by?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to_class?: string | null
          assigned_to_section?: string | null
          attached_file?: string | null
          attached_file_name?: string | null
          attached_file_size?: number | null
          created_at?: string | null
          description?: string | null
          due_date?: string
          id?: string
          instructions?: string | null
          is_submitted?: boolean | null
          school_id?: string | null
          status?: string | null
          subject_id?: string | null
          submitted_by?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "homework_assigned_to_class_fkey"
            columns: ["assigned_to_class"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_assigned_to_section_fkey"
            columns: ["assigned_to_section"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      homework_submissions: {
        Row: {
          comments: string | null
          created_at: string | null
          homework_id: string | null
          id: string
          marked_at: string | null
          marked_by: string | null
          marks: number | null
          school_id: string | null
          status: string | null
          student_profile_id: string | null
          submission_photo_bucket: string | null
          submission_photo_name: string | null
          submission_photo_size: number | null
          submission_photo_url: string | null
          submission_text: string | null
          submission_type: string
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          comments?: string | null
          created_at?: string | null
          homework_id?: string | null
          id?: string
          marked_at?: string | null
          marked_by?: string | null
          marks?: number | null
          school_id?: string | null
          status?: string | null
          student_profile_id?: string | null
          submission_photo_bucket?: string | null
          submission_photo_name?: string | null
          submission_photo_size?: number | null
          submission_photo_url?: string | null
          submission_text?: string | null
          submission_type: string
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          comments?: string | null
          created_at?: string | null
          homework_id?: string | null
          id?: string
          marked_at?: string | null
          marked_by?: string | null
          marks?: number | null
          school_id?: string | null
          status?: string | null
          student_profile_id?: string | null
          submission_photo_bucket?: string | null
          submission_photo_name?: string | null
          submission_photo_size?: number | null
          submission_photo_url?: string | null
          submission_text?: string | null
          submission_type?: string
          submitted_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "homework_submissions_homework_id_fkey"
            columns: ["homework_id"]
            isOneToOne: false
            referencedRelation: "homework"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_submissions_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_submissions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_submissions_student_profile_id_fkey"
            columns: ["student_profile_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      house_incharges: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          house_name: string
          id: string
          school_id: string
          staff_profile_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          house_name: string
          id?: string
          school_id: string
          staff_profile_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          house_name?: string
          id?: string
          school_id?: string
          staff_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "house_incharges_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_incharges_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_incharges_staff_profile_id_fkey"
            columns: ["staff_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      house_staff: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          house_name: string
          id: string
          school_id: string
          staff_profile_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          house_name: string
          id?: string
          school_id: string
          staff_profile_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          house_name?: string
          id?: string
          school_id?: string
          staff_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "house_staff_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_staff_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_staff_staff_profile_id_fkey"
            columns: ["staff_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      houses_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string | null
          created_at: string | null
          house_name: string
          id: string
          new_value: string | null
          old_value: string | null
          school_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string | null
          house_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          school_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string | null
          house_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "houses_audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "houses_audit_log_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          attempt_type: string
          created_at: string
          failure_reason: string | null
          id: string
          ip_address: string | null
          school_id: string | null
          success: boolean
          user_id: string | null
        }
        Insert: {
          attempt_type: string
          created_at?: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          school_id?: string | null
          success?: boolean
          user_id?: string | null
        }
        Update: {
          attempt_type?: string
          created_at?: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          school_id?: string | null
          success?: boolean
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "login_attempts_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "login_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reads: {
        Row: {
          id: string
          message_id: string
          profile_id: string
          read_at: string
          school_id: string | null
        }
        Insert: {
          id?: string
          message_id: string
          profile_id: string
          read_at?: string
          school_id?: string | null
        }
        Update: {
          id?: string
          message_id?: string
          profile_id?: string
          read_at?: string
          school_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reads_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reads_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string | null
          content_type: Database["public"]["Enums"]["message_type_enum"]
          conversation_id: string
          created_at: string
          deleted_at: string | null
          id: string
          media_bucket: string | null
          media_name: string | null
          media_size: number | null
          media_url: string | null
          meta: Json | null
          reply_to_id: string | null
          sender_id: string
        }
        Insert: {
          content?: string | null
          content_type?: Database["public"]["Enums"]["message_type_enum"]
          conversation_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          media_bucket?: string | null
          media_name?: string | null
          media_size?: number | null
          media_url?: string | null
          meta?: Json | null
          reply_to_id?: string | null
          sender_id: string
        }
        Update: {
          content?: string | null
          content_type?: Database["public"]["Enums"]["message_type_enum"]
          conversation_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          media_bucket?: string | null
          media_name?: string | null
          media_size?: number | null
          media_url?: string | null
          meta?: Json | null
          reply_to_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      national_holidays: {
        Row: {
          country: string
          date: string
          holiday_type: string | null
          id: string
          school_id: string | null
          state: string | null
          title: string
        }
        Insert: {
          country?: string
          date: string
          holiday_type?: string | null
          id?: string
          school_id?: string | null
          state?: string | null
          title: string
        }
        Update: {
          country?: string
          date?: string
          holiday_type?: string | null
          id?: string
          school_id?: string | null
          state?: string | null
          title?: string
        }
        Relationships: []
      }
      otp_codes: {
        Row: {
          attempts: number
          code: string
          created_at: string
          expires_at: string
          id: string
          purpose: string
          school_id: string | null
          used: boolean
          user_id: string
        }
        Insert: {
          attempts?: number
          code: string
          created_at?: string
          expires_at: string
          id?: string
          purpose: string
          school_id?: string | null
          used?: boolean
          user_id: string
        }
        Update: {
          attempts?: number
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          purpose?: string
          school_id?: string | null
          used?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "otp_codes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "otp_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_principals: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          school_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          school_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          school_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pending_principals_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      principal_profiles: {
        Row: {
          created_at: string | null
          designation: string | null
          dob: string | null
          father_first_name: string | null
          father_last_name: string | null
          father_middle_name: string | null
          father_name: string | null
          full_name: string
          gender: string | null
          id: string
          mobile: string | null
          photo_url: string | null
          profile_id: string | null
          salutation: string | null
          school_id: string
          school_name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          designation?: string | null
          dob?: string | null
          father_first_name?: string | null
          father_last_name?: string | null
          father_middle_name?: string | null
          father_name?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          mobile?: string | null
          photo_url?: string | null
          profile_id?: string | null
          salutation?: string | null
          school_id: string
          school_name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          designation?: string | null
          dob?: string | null
          father_first_name?: string | null
          father_last_name?: string | null
          father_middle_name?: string | null
          father_name?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          mobile?: string | null
          photo_url?: string | null
          profile_id?: string | null
          salutation?: string | null
          school_id?: string
          school_name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "principal_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          device_fingerprint: string | null
          email: string | null
          full_name: string | null
          id: string
          last_login_at: string | null
          login_mobile: string | null
          messenger_tag: string | null
          mobile: string | null
          must_change_password: boolean
          must_change_pin: boolean
          pin_hash: string | null
          role: string | null
          salutation: string | null
          school_id: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          device_fingerprint?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          last_login_at?: string | null
          login_mobile?: string | null
          messenger_tag?: string | null
          mobile?: string | null
          must_change_password?: boolean
          must_change_pin?: boolean
          pin_hash?: string | null
          role?: string | null
          salutation?: string | null
          school_id?: string | null
          status?: string
        }
        Update: {
          created_at?: string | null
          device_fingerprint?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          last_login_at?: string | null
          login_mobile?: string | null
          messenger_tag?: string | null
          mobile?: string | null
          must_change_password?: boolean
          must_change_pin?: boolean
          pin_hash?: string | null
          role?: string | null
          salutation?: string | null
          school_id?: string | null
          status?: string
        }
        Relationships: []
      }
      school_calendar: {
        Row: {
          academic_year_id: string
          created_at: string | null
          created_by: string | null
          id: string
          school_id: string
          updated_at: string | null
          working_days: string[]
        }
        Insert: {
          academic_year_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          school_id: string
          updated_at?: string | null
          working_days?: string[]
        }
        Update: {
          academic_year_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          school_id?: string
          updated_at?: string | null
          working_days?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "school_calendar_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_calendar_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_calendar_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_subjects: {
        Row: {
          category: string | null
          code: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          school_id: string | null
        }
        Insert: {
          category?: string | null
          code?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          school_id?: string | null
        }
        Update: {
          category?: string | null
          code?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          school_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          academic_board: string | null
          acronym: string | null
          address: string | null
          affiliation_number: string | null
          alt_contact_number: string | null
          board: string | null
          city: string | null
          contact_email: string | null
          contact_number: string | null
          contact_phone: string | null
          country: string | null
          created_at: string | null
          departments: Json | null
          email: string | null
          emblem_url: string | null
          houses: Json | null
          id: string
          name: string
          onboarding_complete: boolean | null
          postal_code: string | null
          principal_email: string | null
          principal_mobile: string | null
          principal_name: string | null
          principal_temp_password: string | null
          principal_temp_password_encrypted: string | null
          school_id: string | null
          school_type: string | null
          shifts: Json | null
          slug: string | null
          state: string | null
          status: string | null
          website: string | null
        }
        Insert: {
          academic_board?: string | null
          acronym?: string | null
          address?: string | null
          affiliation_number?: string | null
          alt_contact_number?: string | null
          board?: string | null
          city?: string | null
          contact_email?: string | null
          contact_number?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          departments?: Json | null
          email?: string | null
          emblem_url?: string | null
          houses?: Json | null
          id?: string
          name: string
          onboarding_complete?: boolean | null
          postal_code?: string | null
          principal_email?: string | null
          principal_mobile?: string | null
          principal_name?: string | null
          principal_temp_password?: string | null
          principal_temp_password_encrypted?: string | null
          school_id?: string | null
          school_type?: string | null
          shifts?: Json | null
          slug?: string | null
          state?: string | null
          status?: string | null
          website?: string | null
        }
        Update: {
          academic_board?: string | null
          acronym?: string | null
          address?: string | null
          affiliation_number?: string | null
          alt_contact_number?: string | null
          board?: string | null
          city?: string | null
          contact_email?: string | null
          contact_number?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          departments?: Json | null
          email?: string | null
          emblem_url?: string | null
          houses?: Json | null
          id?: string
          name?: string
          onboarding_complete?: boolean | null
          postal_code?: string | null
          principal_email?: string | null
          principal_mobile?: string | null
          principal_name?: string | null
          principal_temp_password?: string | null
          principal_temp_password_encrypted?: string | null
          school_id?: string | null
          school_type?: string | null
          shifts?: Json | null
          slug?: string | null
          state?: string | null
          status?: string | null
          website?: string | null
        }
        Relationships: []
      }
      section_subjects: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          school_id: string | null
          section_id: string | null
          stream: string | null
          subject_code: string | null
          subject_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          school_id?: string | null
          section_id?: string | null
          stream?: string | null
          subject_code?: string | null
          subject_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          school_id?: string | null
          section_id?: string | null
          stream?: string | null
          subject_code?: string | null
          subject_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "section_subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "section_subjects_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      sections: {
        Row: {
          acronym: string | null
          class_id: string | null
          created_at: string | null
          display_order: number
          id: string
          name: string | null
          school_id: string | null
          session_id: string | null
          stream: string | null
        }
        Insert: {
          acronym?: string | null
          class_id?: string | null
          created_at?: string | null
          display_order?: number
          id?: string
          name?: string | null
          school_id?: string | null
          session_id?: string | null
          stream?: string | null
        }
        Update: {
          acronym?: string | null
          class_id?: string | null
          created_at?: string | null
          display_order?: number
          id?: string
          name?: string | null
          school_id?: string | null
          session_id?: string | null
          stream?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sections_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sections_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sections_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          changed_fields: Json | null
          created_at: string | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string
          id: string
          school_id: string
          session_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          changed_fields?: Json | null
          created_at?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type: string
          id?: string
          school_id: string
          session_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          changed_fields?: Json | null
          created_at?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          school_id?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_audit_log_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_audit_log_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          academic_year: string | null
          created_at: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          school_id: string | null
          start_date: string | null
          terms: string | null
          wings: Json | null
        }
        Insert: {
          academic_year?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          school_id?: string | null
          start_date?: string | null
          terms?: string | null
          wings?: Json | null
        }
        Update: {
          academic_year?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          school_id?: string | null
          start_date?: string | null
          terms?: string | null
          wings?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_bulk_actions: {
        Row: {
          count: number
          created_at: string | null
          details: Json | null
          expires_at: string | null
          id: string
          mode: string
          reverted_at: string | null
          reverted_by: string | null
          school_id: string
          status: string
          user_id: string
        }
        Insert: {
          count: number
          created_at?: string | null
          details?: Json | null
          expires_at?: string | null
          id?: string
          mode: string
          reverted_at?: string | null
          reverted_by?: string | null
          school_id: string
          status?: string
          user_id: string
        }
        Update: {
          count?: number
          created_at?: string | null
          details?: Json | null
          expires_at?: string | null
          id?: string
          mode?: string
          reverted_at?: string | null
          reverted_by?: string | null
          school_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_bulk_actions_reverted_by_fkey"
            columns: ["reverted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_bulk_actions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_bulk_actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_coordinator_assignments: {
        Row: {
          created_at: string | null
          id: string
          mode: string
          school_id: string
          staff_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          mode: string
          school_id: string
          staff_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          mode?: string
          school_id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_coordinator_assignments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_coordinator_assignments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_coordinator_classes: {
        Row: {
          assignment_id: string
          class_id: string
          id: string
          school_id: string
          section_id: string
        }
        Insert: {
          assignment_id: string
          class_id: string
          id?: string
          school_id: string
          section_id: string
        }
        Update: {
          assignment_id?: string
          class_id?: string
          id?: string
          school_id?: string
          section_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_coordinator_classes_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "staff_coordinator_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_coordinator_classes_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_coordinator_classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_coordinator_classes_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_coordinator_wings: {
        Row: {
          assignment_id: string
          id: string
          school_id: string
          wing_id: string
        }
        Insert: {
          assignment_id: string
          id?: string
          school_id: string
          wing_id: string
        }
        Update: {
          assignment_id?: string
          id?: string
          school_id?: string
          wing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_coordinator_wings_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "staff_coordinator_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_coordinator_wings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_coordinator_wings_wing_id_fkey"
            columns: ["wing_id"]
            isOneToOne: false
            referencedRelation: "wings"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_id_sequences: {
        Row: {
          acronym: string
          created_at: string | null
          id: string
          last_assigned: number | null
          prefix: string
          reserved_count: number | null
          school_id: string
          year: number
        }
        Insert: {
          acronym: string
          created_at?: string | null
          id?: string
          last_assigned?: number | null
          prefix?: string
          reserved_count?: number | null
          school_id: string
          year: number
        }
        Update: {
          acronym?: string
          created_at?: string | null
          id?: string
          last_assigned?: number | null
          prefix?: string
          reserved_count?: number | null
          school_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "staff_id_sequences_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_profiles: {
        Row: {
          aadhar_not_available: boolean | null
          aadhar_number_encrypted: string | null
          admin_experience_note: string | null
          area_of_specialization: string | null
          assigned_class_id: string | null
          assigned_section_id: string | null
          assignments_responsibilities: string | null
          bank_account_encrypted: string | null
          bank_branch: string | null
          bank_name: string | null
          bank_passbook_url: string | null
          basic_salary: number | null
          blood_group: string | null
          bus_route: string | null
          bus_stop: string | null
          caste_certificate_number: string | null
          category: string | null
          certifications: Json | null
          children: Json | null
          courses_currently_pursuing: string | null
          created_at: string | null
          da: number | null
          date_of_birth: string | null
          date_of_joining: string | null
          date_of_last_increment: string | null
          date_of_marriage: string | null
          department: string | null
          designation: string | null
          disability_certificate_url: string | null
          disability_percentage: number | null
          disability_specification: string | null
          disability_type: string | null
          dob: string | null
          documents_received: Json | null
          education: Json | null
          emergency_contact_name: string | null
          emergency_contact_number: string | null
          emergency_contact_relation: string | null
          employee_id: string | null
          employment_status: string | null
          employment_type: string | null
          epf_enrolled: boolean | null
          epf_uan: string | null
          esic_number: string | null
          experience: Json | null
          experience_years: number | null
          father_contact: string | null
          father_first_name: string | null
          father_last_name: string | null
          father_middle_name: string | null
          father_name: string | null
          father_occupation: string | null
          full_name: string
          gender: string | null
          grade_level: string | null
          gratuity_eligible: boolean | null
          gross_salary: number | null
          has_children: boolean | null
          house: string | null
          hra: number | null
          husband_contact: string | null
          husband_occupation: string | null
          id: string
          if_selected_joining_date: string | null
          ifsc_code: string | null
          is_class_teacher: boolean | null
          joining_date: string | null
          languages: Json | null
          last_salary_drawn: number | null
          last_salary_year: number | null
          leave_required_studies: boolean | null
          local_address: string | null
          local_address_obj: Json | null
          marital_status: string | null
          minimum_expected_salary: number | null
          minority: boolean | null
          minority_certificate_received: boolean | null
          minority_certificate_url: string | null
          mode_of_last_salary_payment: string | null
          nationality: string | null
          official_email: string | null
          opted_for_transport: boolean | null
          other_allowance: number | null
          pan_card_url: string | null
          pan_number_encrypted: string | null
          pay_scale_grade: string | null
          permanent_address: string | null
          permanent_address_obj: Json | null
          personal_email: string | null
          photo_url: string | null
          profile_id: string | null
          pwd: boolean | null
          qualification: string | null
          references: Json | null
          religion: string | null
          religion_specify: string | null
          salary_certificate_url: string | null
          salary_pattern: string | null
          salutation: string | null
          same_as_local_address: boolean | null
          school_id: string
          secondary_mobile: string | null
          shift: string | null
          skills: Json | null
          special_allowance: number | null
          spouse_contact: string | null
          spouse_name: string | null
          spouse_occupation: string | null
          subcaste: string | null
          tds_applicable: boolean | null
          updated_at: string | null
          whatsapp_mobile: string | null
        }
        Insert: {
          aadhar_not_available?: boolean | null
          aadhar_number_encrypted?: string | null
          admin_experience_note?: string | null
          area_of_specialization?: string | null
          assigned_class_id?: string | null
          assigned_section_id?: string | null
          assignments_responsibilities?: string | null
          bank_account_encrypted?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          bank_passbook_url?: string | null
          basic_salary?: number | null
          blood_group?: string | null
          bus_route?: string | null
          bus_stop?: string | null
          caste_certificate_number?: string | null
          category?: string | null
          certifications?: Json | null
          children?: Json | null
          courses_currently_pursuing?: string | null
          created_at?: string | null
          da?: number | null
          date_of_birth?: string | null
          date_of_joining?: string | null
          date_of_last_increment?: string | null
          date_of_marriage?: string | null
          department?: string | null
          designation?: string | null
          disability_certificate_url?: string | null
          disability_percentage?: number | null
          disability_specification?: string | null
          disability_type?: string | null
          dob?: string | null
          documents_received?: Json | null
          education?: Json | null
          emergency_contact_name?: string | null
          emergency_contact_number?: string | null
          emergency_contact_relation?: string | null
          employee_id?: string | null
          employment_status?: string | null
          employment_type?: string | null
          epf_enrolled?: boolean | null
          epf_uan?: string | null
          esic_number?: string | null
          experience?: Json | null
          experience_years?: number | null
          father_contact?: string | null
          father_first_name?: string | null
          father_last_name?: string | null
          father_middle_name?: string | null
          father_name?: string | null
          father_occupation?: string | null
          full_name?: string
          gender?: string | null
          grade_level?: string | null
          gratuity_eligible?: boolean | null
          gross_salary?: number | null
          has_children?: boolean | null
          house?: string | null
          hra?: number | null
          husband_contact?: string | null
          husband_occupation?: string | null
          id?: string
          if_selected_joining_date?: string | null
          ifsc_code?: string | null
          is_class_teacher?: boolean | null
          joining_date?: string | null
          languages?: Json | null
          last_salary_drawn?: number | null
          last_salary_year?: number | null
          leave_required_studies?: boolean | null
          local_address?: string | null
          local_address_obj?: Json | null
          marital_status?: string | null
          minimum_expected_salary?: number | null
          minority?: boolean | null
          minority_certificate_received?: boolean | null
          minority_certificate_url?: string | null
          mode_of_last_salary_payment?: string | null
          nationality?: string | null
          official_email?: string | null
          opted_for_transport?: boolean | null
          other_allowance?: number | null
          pan_card_url?: string | null
          pan_number_encrypted?: string | null
          pay_scale_grade?: string | null
          permanent_address?: string | null
          permanent_address_obj?: Json | null
          personal_email?: string | null
          photo_url?: string | null
          profile_id?: string | null
          pwd?: boolean | null
          qualification?: string | null
          references?: Json | null
          religion?: string | null
          religion_specify?: string | null
          salary_certificate_url?: string | null
          salary_pattern?: string | null
          salutation?: string | null
          same_as_local_address?: boolean | null
          school_id: string
          secondary_mobile?: string | null
          shift?: string | null
          skills?: Json | null
          special_allowance?: number | null
          spouse_contact?: string | null
          spouse_name?: string | null
          spouse_occupation?: string | null
          subcaste?: string | null
          tds_applicable?: boolean | null
          updated_at?: string | null
          whatsapp_mobile?: string | null
        }
        Update: {
          aadhar_not_available?: boolean | null
          aadhar_number_encrypted?: string | null
          admin_experience_note?: string | null
          area_of_specialization?: string | null
          assigned_class_id?: string | null
          assigned_section_id?: string | null
          assignments_responsibilities?: string | null
          bank_account_encrypted?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          bank_passbook_url?: string | null
          basic_salary?: number | null
          blood_group?: string | null
          bus_route?: string | null
          bus_stop?: string | null
          caste_certificate_number?: string | null
          category?: string | null
          certifications?: Json | null
          children?: Json | null
          courses_currently_pursuing?: string | null
          created_at?: string | null
          da?: number | null
          date_of_birth?: string | null
          date_of_joining?: string | null
          date_of_last_increment?: string | null
          date_of_marriage?: string | null
          department?: string | null
          designation?: string | null
          disability_certificate_url?: string | null
          disability_percentage?: number | null
          disability_specification?: string | null
          disability_type?: string | null
          dob?: string | null
          documents_received?: Json | null
          education?: Json | null
          emergency_contact_name?: string | null
          emergency_contact_number?: string | null
          emergency_contact_relation?: string | null
          employee_id?: string | null
          employment_status?: string | null
          employment_type?: string | null
          epf_enrolled?: boolean | null
          epf_uan?: string | null
          esic_number?: string | null
          experience?: Json | null
          experience_years?: number | null
          father_contact?: string | null
          father_first_name?: string | null
          father_last_name?: string | null
          father_middle_name?: string | null
          father_name?: string | null
          father_occupation?: string | null
          full_name?: string
          gender?: string | null
          grade_level?: string | null
          gratuity_eligible?: boolean | null
          gross_salary?: number | null
          has_children?: boolean | null
          house?: string | null
          hra?: number | null
          husband_contact?: string | null
          husband_occupation?: string | null
          id?: string
          if_selected_joining_date?: string | null
          ifsc_code?: string | null
          is_class_teacher?: boolean | null
          joining_date?: string | null
          languages?: Json | null
          last_salary_drawn?: number | null
          last_salary_year?: number | null
          leave_required_studies?: boolean | null
          local_address?: string | null
          local_address_obj?: Json | null
          marital_status?: string | null
          minimum_expected_salary?: number | null
          minority?: boolean | null
          minority_certificate_received?: boolean | null
          minority_certificate_url?: string | null
          mode_of_last_salary_payment?: string | null
          nationality?: string | null
          official_email?: string | null
          opted_for_transport?: boolean | null
          other_allowance?: number | null
          pan_card_url?: string | null
          pan_number_encrypted?: string | null
          pay_scale_grade?: string | null
          permanent_address?: string | null
          permanent_address_obj?: Json | null
          personal_email?: string | null
          photo_url?: string | null
          profile_id?: string | null
          pwd?: boolean | null
          qualification?: string | null
          references?: Json | null
          religion?: string | null
          religion_specify?: string | null
          salary_certificate_url?: string | null
          salary_pattern?: string | null
          salutation?: string | null
          same_as_local_address?: boolean | null
          school_id?: string
          secondary_mobile?: string | null
          shift?: string | null
          skills?: Json | null
          special_allowance?: number | null
          spouse_contact?: string | null
          spouse_name?: string | null
          spouse_occupation?: string | null
          subcaste?: string | null
          tds_applicable?: boolean | null
          updated_at?: string | null
          whatsapp_mobile?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_roles: {
        Row: {
          academic_year_id: string | null
          assigned_at: string | null
          assigned_by: string | null
          class_id: string
          id: string
          role_type: string
          school_id: string
          section_id: string
          staff_id: string
          subject_id: string | null
        }
        Insert: {
          academic_year_id?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          class_id: string
          id?: string
          role_type: string
          school_id: string
          section_id: string
          staff_id: string
          subject_id?: string | null
        }
        Update: {
          academic_year_id?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          class_id?: string
          id?: string
          role_type?: string
          school_id?: string
          section_id?: string
          staff_id?: string
          subject_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_roles_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_roles_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_roles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_roles_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_roles_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staffs: {
        Row: {
          assigned_class_id: string | null
          assigned_section_id: string | null
          created_at: string | null
          department: string | null
          designation: string | null
          emergency_contact: string | null
          emergency_mobile: string | null
          employee_id: string | null
          experience_years: number | null
          id: string
          is_active: boolean | null
          is_class_teacher: boolean | null
          joining_date: string | null
          profile_id: string
          qualification: string | null
          salary_pattern: string | null
          school_id: string
          updated_at: string | null
        }
        Insert: {
          assigned_class_id?: string | null
          assigned_section_id?: string | null
          created_at?: string | null
          department?: string | null
          designation?: string | null
          emergency_contact?: string | null
          emergency_mobile?: string | null
          employee_id?: string | null
          experience_years?: number | null
          id?: string
          is_active?: boolean | null
          is_class_teacher?: boolean | null
          joining_date?: string | null
          profile_id: string
          qualification?: string | null
          salary_pattern?: string | null
          school_id: string
          updated_at?: string | null
        }
        Update: {
          assigned_class_id?: string | null
          assigned_section_id?: string | null
          created_at?: string | null
          department?: string | null
          designation?: string | null
          emergency_contact?: string | null
          emergency_mobile?: string | null
          employee_id?: string | null
          experience_years?: number | null
          id?: string
          is_active?: boolean | null
          is_class_teacher?: boolean | null
          joining_date?: string | null
          profile_id?: string
          qualification?: string | null
          salary_pattern?: string | null
          school_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staffs_assigned_class_id_fkey"
            columns: ["assigned_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staffs_assigned_section_id_fkey"
            columns: ["assigned_section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staffs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staffs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      student_bulk_actions: {
        Row: {
          created_at: string | null
          filename: string
          id: string
          imported_at: string | null
          imported_by: string
          revert_reason: string | null
          reverted_at: string | null
          reverted_by: string | null
          school_id: string
          status: string
          student_count: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          filename: string
          id?: string
          imported_at?: string | null
          imported_by: string
          revert_reason?: string | null
          reverted_at?: string | null
          reverted_by?: string | null
          school_id: string
          status?: string
          student_count: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          filename?: string
          id?: string
          imported_at?: string | null
          imported_by?: string
          revert_reason?: string | null
          reverted_at?: string | null
          reverted_by?: string | null
          school_id?: string
          status?: string
          student_count?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      student_id_sequences: {
        Row: {
          academic_year: string
          created_at: string | null
          expires_at: string
          id: string
          reserved_at: string | null
          reserved_by: string
          school_id: string
          sequence_from: number
          sequence_to: number
          status: string
          updated_at: string | null
        }
        Insert: {
          academic_year: string
          created_at?: string | null
          expires_at: string
          id?: string
          reserved_at?: string | null
          reserved_by: string
          school_id: string
          sequence_from: number
          sequence_to: number
          status?: string
          updated_at?: string | null
        }
        Update: {
          academic_year?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          reserved_at?: string | null
          reserved_by?: string
          school_id?: string
          sequence_from?: number
          sequence_to?: number
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      student_profiles: {
        Row: {
          admission_no: string | null
          class_id: string | null
          created_at: string | null
          house: string | null
          id: string
          profile_id: string | null
          roll_no: string | null
          school_id: string
          section_id: string | null
          updated_at: string | null
        }
        Insert: {
          admission_no?: string | null
          class_id?: string | null
          created_at?: string | null
          house?: string | null
          id?: string
          profile_id?: string | null
          roll_no?: string | null
          school_id: string
          section_id?: string | null
          updated_at?: string | null
        }
        Update: {
          admission_no?: string | null
          class_id?: string | null
          created_at?: string | null
          house?: string | null
          id?: string
          profile_id?: string | null
          roll_no?: string | null
          school_id?: string
          section_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          aadhar_not_available: boolean | null
          aadhar_number: string | null
          aadhar_number_encrypted: string | null
          admission_date: string | null
          admission_type: string | null
          blood_group: string | null
          bpl_aay_ews_status: string | null
          caste_certificate_number: string | null
          category: string | null
          city_village: string | null
          class_id: string
          created_at: string | null
          date_of_measurement: string | null
          disability_percentage: number | null
          district: string | null
          dob: string | null
          father_first_name: string | null
          father_last_name: string | null
          father_middle_name: string | null
          father_mobile: string | null
          father_name: string | null
          first_name: string | null
          full_name: string
          gender: string | null
          guardian_email: string | null
          guardian_first_name: string | null
          guardian_last_name: string | null
          guardian_middle_name: string | null
          guardian_mobile: string | null
          guardian_photo: string | null
          guardian_relation: string | null
          id: string
          ifsc_code: string | null
          is_minority: boolean | null
          is_only_child: boolean | null
          last_name: string | null
          medium_of_instruction: string | null
          middle_name: string | null
          mother_education_level: string | null
          mother_first_name: string | null
          mother_last_name: string | null
          mother_middle_name: string | null
          mother_mobile: string | null
          mother_name: string | null
          mother_tongue: string | null
          nationality: string | null
          parent_email: string | null
          pin_code: string | null
          previous_school_udise: string | null
          primary_guardian: string | null
          religion: string | null
          roll_no: string
          same_as_local_address: boolean | null
          school_id: string
          school_internal_id: string | null
          section_id: string
          state: string | null
          status: string | null
          student_mobile: string | null
          updated_at: string | null
        }
        Insert: {
          aadhar_not_available?: boolean | null
          aadhar_number?: string | null
          aadhar_number_encrypted?: string | null
          admission_date?: string | null
          admission_type?: string | null
          blood_group?: string | null
          bpl_aay_ews_status?: string | null
          caste_certificate_number?: string | null
          category?: string | null
          city_village?: string | null
          class_id: string
          created_at?: string | null
          date_of_measurement?: string | null
          disability_percentage?: number | null
          district?: string | null
          dob?: string | null
          father_first_name?: string | null
          father_last_name?: string | null
          father_middle_name?: string | null
          father_mobile?: string | null
          father_name?: string | null
          first_name?: string | null
          full_name: string
          gender?: string | null
          guardian_email?: string | null
          guardian_first_name?: string | null
          guardian_last_name?: string | null
          guardian_middle_name?: string | null
          guardian_mobile?: string | null
          guardian_photo?: string | null
          guardian_relation?: string | null
          id?: string
          ifsc_code?: string | null
          is_minority?: boolean | null
          is_only_child?: boolean | null
          last_name?: string | null
          medium_of_instruction?: string | null
          middle_name?: string | null
          mother_education_level?: string | null
          mother_first_name?: string | null
          mother_last_name?: string | null
          mother_middle_name?: string | null
          mother_mobile?: string | null
          mother_name?: string | null
          mother_tongue?: string | null
          nationality?: string | null
          parent_email?: string | null
          pin_code?: string | null
          previous_school_udise?: string | null
          primary_guardian?: string | null
          religion?: string | null
          roll_no: string
          same_as_local_address?: boolean | null
          school_id: string
          school_internal_id?: string | null
          section_id: string
          state?: string | null
          status?: string | null
          student_mobile?: string | null
          updated_at?: string | null
        }
        Update: {
          aadhar_not_available?: boolean | null
          aadhar_number?: string | null
          aadhar_number_encrypted?: string | null
          admission_date?: string | null
          admission_type?: string | null
          blood_group?: string | null
          bpl_aay_ews_status?: string | null
          caste_certificate_number?: string | null
          category?: string | null
          city_village?: string | null
          class_id?: string
          created_at?: string | null
          date_of_measurement?: string | null
          disability_percentage?: number | null
          district?: string | null
          dob?: string | null
          father_first_name?: string | null
          father_last_name?: string | null
          father_middle_name?: string | null
          father_mobile?: string | null
          father_name?: string | null
          first_name?: string | null
          full_name?: string
          gender?: string | null
          guardian_email?: string | null
          guardian_first_name?: string | null
          guardian_last_name?: string | null
          guardian_middle_name?: string | null
          guardian_mobile?: string | null
          guardian_photo?: string | null
          guardian_relation?: string | null
          id?: string
          ifsc_code?: string | null
          is_minority?: boolean | null
          is_only_child?: boolean | null
          last_name?: string | null
          medium_of_instruction?: string | null
          middle_name?: string | null
          mother_education_level?: string | null
          mother_first_name?: string | null
          mother_last_name?: string | null
          mother_middle_name?: string | null
          mother_mobile?: string | null
          mother_name?: string | null
          mother_tongue?: string | null
          nationality?: string | null
          parent_email?: string | null
          pin_code?: string | null
          previous_school_udise?: string | null
          primary_guardian?: string | null
          religion?: string | null
          roll_no?: string
          same_as_local_address?: boolean | null
          school_id?: string
          school_internal_id?: string | null
          section_id?: string
          state?: string | null
          status?: string | null
          student_mobile?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      subject_teachers: {
        Row: {
          academic_year_id: string
          assigned_at: string | null
          assigned_by: string | null
          class_id: string
          id: string
          school_id: string
          section_id: string
          staff_profile_id: string
          subject_code: string | null
          subject_name: string
          updated_at: string | null
        }
        Insert: {
          academic_year_id: string
          assigned_at?: string | null
          assigned_by?: string | null
          class_id: string
          id?: string
          school_id: string
          section_id: string
          staff_profile_id: string
          subject_code?: string | null
          subject_name: string
          updated_at?: string | null
        }
        Update: {
          academic_year_id?: string
          assigned_at?: string | null
          assigned_by?: string | null
          class_id?: string
          id?: string
          school_id?: string
          section_id?: string
          staff_profile_id?: string
          subject_code?: string | null
          subject_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subject_teachers_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subject_teachers_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subject_teachers_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subject_teachers_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subject_teachers_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subject_teachers_staff_profile_id_fkey"
            columns: ["staff_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          class_id: string | null
          code: string | null
          created_at: string | null
          id: string
          name: string | null
          school_id: string | null
          stream: string | null
          subject_code: string | null
        }
        Insert: {
          class_id?: string | null
          code?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          school_id?: string | null
          stream?: string | null
          subject_code?: string | null
        }
        Update: {
          class_id?: string | null
          code?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          school_id?: string | null
          stream?: string | null
          subject_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subjects_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      superadmin_profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          mobile: string | null
          profile_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          mobile?: string | null
          profile_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          mobile?: string | null
          profile_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "superadmin_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          user_id: string
          value: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          user_id: string
          value?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          user_id?: string
          value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wing_staff: {
        Row: {
          assignment_type: string
          created_at: string | null
          id: string
          school_id: string
          source_id: string | null
          staff_id: string
          wing_id: string
        }
        Insert: {
          assignment_type: string
          created_at?: string | null
          id?: string
          school_id: string
          source_id?: string | null
          staff_id: string
          wing_id: string
        }
        Update: {
          assignment_type?: string
          created_at?: string | null
          id?: string
          school_id?: string
          source_id?: string | null
          staff_id?: string
          wing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wing_staff_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wing_staff_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wing_staff_wing_id_fkey"
            columns: ["wing_id"]
            isOneToOne: false
            referencedRelation: "wings"
            referencedColumns: ["id"]
          },
        ]
      }
      wings: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          name: string
          school_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          name: string
          school_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          name?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      wings_activity_staff: {
        Row: {
          assigned_at: string | null
          id: string
          school_id: string
          staff_id: string
          wing_id: string
        }
        Insert: {
          assigned_at?: string | null
          id?: string
          school_id: string
          staff_id: string
          wing_id: string
        }
        Update: {
          assigned_at?: string | null
          id?: string
          school_id?: string
          staff_id?: string
          wing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wings_activity_staff_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wings_activity_staff_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wings_activity_staff_wing_id_fkey"
            columns: ["wing_id"]
            isOneToOne: false
            referencedRelation: "wings"
            referencedColumns: ["id"]
          },
        ]
      }
      wings_audit_log: {
        Row: {
          action: string
          changed_at: string | null
          id: string
          school_id: string
          user_id: string
          user_name: string | null
          what: string | null
          wing_id: string | null
          wing_name: string | null
        }
        Insert: {
          action: string
          changed_at?: string | null
          id?: string
          school_id: string
          user_id: string
          user_name?: string | null
          what?: string | null
          wing_id?: string | null
          wing_name?: string | null
        }
        Update: {
          action?: string
          changed_at?: string | null
          id?: string
          school_id?: string
          user_id?: string
          user_name?: string | null
          what?: string | null
          wing_id?: string | null
          wing_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wings_audit_log_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wings_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wings_audit_log_wing_id_fkey"
            columns: ["wing_id"]
            isOneToOne: false
            referencedRelation: "wings"
            referencedColumns: ["id"]
          },
        ]
      }
      wings_coordinators: {
        Row: {
          assigned_at: string | null
          id: string
          role: string
          school_id: string
          staff_id: string
          wing_id: string
        }
        Insert: {
          assigned_at?: string | null
          id?: string
          role?: string
          school_id: string
          staff_id: string
          wing_id: string
        }
        Update: {
          assigned_at?: string | null
          id?: string
          role?: string
          school_id?: string
          staff_id?: string
          wing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wings_coordinators_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wings_coordinators_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wings_coordinators_wing_id_fkey"
            columns: ["wing_id"]
            isOneToOne: false
            referencedRelation: "wings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auth_user_active_in_school: {
        Args: { p_school_id: string }
        Returns: boolean
      }
      auth_user_has_school_role: {
        Args: { p_roles: string[]; p_school_id: string }
        Returns: boolean
      }
      auth_user_owns_profile: {
        Args: { p_profile_id: string }
        Returns: boolean
      }
      auth_user_school_role_check: {
        Args: { p_allowed_roles: string[]; p_school_id: string }
        Returns: boolean
      }
      build_roll_prefix: {
        Args: { p_class_id: string; p_section_id: string }
        Returns: string
      }
      can_mark_attendance: {
        Args: { p_class_id: string; p_date: string }
        Returns: Json
      }
      can_revert_bulk_action: {
        Args: { p_action_id: string }
        Returns: boolean
      }
      cleanup_expired_student_id_reservations: {
        Args: never
        Returns: undefined
      }
      commit_staff_id: {
        Args: { p_school_id: string; p_year: number }
        Returns: undefined
      }
      commit_student_id: {
        Args: { p_reservation_id: string }
        Returns: undefined
      }
      count_class_students: { Args: { class_id: string }; Returns: number }
      count_wing_students: { Args: { wing_id: string }; Returns: number }
      current_school_id: { Args: never; Returns: string }
      decrypt_text: { Args: { p_encrypted_text: string }; Returns: string }
      encrypt_text: { Args: { p_plain_text: string }; Returns: string }
      release_staff_id: {
        Args: { p_school_id: string; p_staff_id: string; p_year: number }
        Returns: boolean
      }
      release_student_id: {
        Args: { p_reservation_id: string }
        Returns: undefined
      }
      reserve_staff_id: {
        Args: { p_school_id: string; p_year: number }
        Returns: string
      }
      reserve_student_id: {
        Args: {
          p_academic_year: string
          p_count: number
          p_school_id: string
          p_user_id: string
        }
        Returns: {
          sequence_from: number
          sequence_to: number
        }[]
      }
      school_onboarding_complete: {
        Args: { p_school_id: string }
        Returns: boolean
      }
      user_class_ids: { Args: never; Returns: string[] }
      user_department_ids: { Args: never; Returns: string[] }
      user_role: { Args: never; Returns: string }
      user_wing_ids: { Args: never; Returns: string[] }
    }
    Enums: {
      conversation_type: "direct" | "group" | "broadcast"
      message_type_enum: "text" | "image" | "file" | "audio" | "video"
      participant_role: "admin" | "member"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      conversation_type: ["direct", "group", "broadcast"],
      message_type_enum: ["text", "image", "file", "audio", "video"],
      participant_role: ["admin", "member"],
    },
  },
} as const
