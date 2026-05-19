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
      approval_actions: {
        Row: {
          action_type: Database["public"]["Enums"]["approval_action_type"]
          actor_id: string | null
          approval_instance_id: string
          approval_step_id: string | null
          comment: string | null
          created_at: string
          from_status: string | null
          id: string
          metadata: Json
          to_status: string | null
        }
        Insert: {
          action_type: Database["public"]["Enums"]["approval_action_type"]
          actor_id?: string | null
          approval_instance_id: string
          approval_step_id?: string | null
          comment?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          metadata?: Json
          to_status?: string | null
        }
        Update: {
          action_type?: Database["public"]["Enums"]["approval_action_type"]
          actor_id?: string | null
          approval_instance_id?: string
          approval_step_id?: string | null
          comment?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          metadata?: Json
          to_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approval_actions_approval_instance_id_fkey"
            columns: ["approval_instance_id"]
            isOneToOne: false
            referencedRelation: "approval_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_actions_approval_step_id_fkey"
            columns: ["approval_step_id"]
            isOneToOne: false
            referencedRelation: "approval_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_instances: {
        Row: {
          completed_at: string | null
          created_at: string
          current_step_order: number | null
          due_at: string | null
          entity_id: string
          entity_type: string
          id: string
          metadata: Json
          module_code: string
          project_id: string | null
          requested_by: string | null
          status: Database["public"]["Enums"]["approval_instance_status"]
          submitted_at: string | null
          template_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_step_order?: number | null
          due_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json
          module_code: string
          project_id?: string | null
          requested_by?: string | null
          status?: Database["public"]["Enums"]["approval_instance_status"]
          submitted_at?: string | null
          template_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_step_order?: number | null
          due_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json
          module_code?: string
          project_id?: string | null
          requested_by?: string | null
          status?: Database["public"]["Enums"]["approval_instance_status"]
          submitted_at?: string | null
          template_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_instances_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_instances_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "approval_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_steps: {
        Row: {
          acted_at: string | null
          acted_by: string | null
          action: string
          approval_instance_id: string
          assignee_role: string | null
          assignee_user_id: string | null
          comment: string | null
          created_at: string
          due_at: string | null
          id: string
          status: Database["public"]["Enums"]["approval_step_status"]
          step_name: string
          step_order: number
          updated_at: string
        }
        Insert: {
          acted_at?: string | null
          acted_by?: string | null
          action?: string
          approval_instance_id: string
          assignee_role?: string | null
          assignee_user_id?: string | null
          comment?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["approval_step_status"]
          step_name: string
          step_order: number
          updated_at?: string
        }
        Update: {
          acted_at?: string | null
          acted_by?: string | null
          action?: string
          approval_instance_id?: string
          assignee_role?: string | null
          assignee_user_id?: string | null
          comment?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["approval_step_status"]
          step_name?: string
          step_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_steps_approval_instance_id_fkey"
            columns: ["approval_instance_id"]
            isOneToOne: false
            referencedRelation: "approval_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_templates: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          module: string
          name: string
          steps: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          module: string
          name: string
          steps?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          module?: string
          name?: string
          steps?: Json
          updated_at?: string
        }
        Relationships: []
      }
      architecture_door_schedule: {
        Row: {
          created_at: string
          door_type: string | null
          fire_rating: string | null
          hardware_set: string | null
          height_mm: number | null
          id: string
          mark_number: string
          thickness_mm: number | null
          updated_at: string
          wbs_node_id: string
          width_mm: number | null
        }
        Insert: {
          created_at?: string
          door_type?: string | null
          fire_rating?: string | null
          hardware_set?: string | null
          height_mm?: number | null
          id?: string
          mark_number: string
          thickness_mm?: number | null
          updated_at?: string
          wbs_node_id: string
          width_mm?: number | null
        }
        Update: {
          created_at?: string
          door_type?: string | null
          fire_rating?: string | null
          hardware_set?: string | null
          height_mm?: number | null
          id?: string
          mark_number?: string
          thickness_mm?: number | null
          updated_at?: string
          wbs_node_id?: string
          width_mm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "architecture_door_schedule_wbs_node_id_fkey"
            columns: ["wbs_node_id"]
            isOneToOne: false
            referencedRelation: "wbs_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      architecture_drawings: {
        Row: {
          created_at: string | null
          created_by: string | null
          drawing_number: string
          file_url: string | null
          id: string
          project_id: string | null
          revision: string | null
          status: string | null
          title: string
          updated_at: string | null
          wbs_node_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          drawing_number: string
          file_url?: string | null
          id?: string
          project_id?: string | null
          revision?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          wbs_node_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          drawing_number?: string
          file_url?: string | null
          id?: string
          project_id?: string | null
          revision?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          wbs_node_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "architecture_drawings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "architecture_drawings_wbs_node_id_fkey"
            columns: ["wbs_node_id"]
            isOneToOne: false
            referencedRelation: "wbs_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      architecture_material_boards: {
        Row: {
          category: string
          created_at: string | null
          id: string
          material_name: string
          photo_url: string | null
          project_id: string | null
          sample_reference: string | null
          status: string | null
          updated_at: string | null
          wbs_node_id: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          material_name: string
          photo_url?: string | null
          project_id?: string | null
          sample_reference?: string | null
          status?: string | null
          updated_at?: string | null
          wbs_node_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          material_name?: string
          photo_url?: string | null
          project_id?: string | null
          sample_reference?: string | null
          status?: string | null
          updated_at?: string | null
          wbs_node_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "architecture_material_boards_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "architecture_material_boards_wbs_node_id_fkey"
            columns: ["wbs_node_id"]
            isOneToOne: false
            referencedRelation: "wbs_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      architecture_room_data: {
        Row: {
          acoustic_rating: string | null
          ceiling_finish: string | null
          cornice_finish: string | null
          created_at: string
          floor_finish: string | null
          id: string
          ironmongery_set: string | null
          mep_requirements: Json | null
          remarks: string | null
          sanitary_fixtures: string | null
          skirting_finish: string | null
          updated_at: string
          wall_finish: string | null
          wbs_node_id: string
        }
        Insert: {
          acoustic_rating?: string | null
          ceiling_finish?: string | null
          cornice_finish?: string | null
          created_at?: string
          floor_finish?: string | null
          id?: string
          ironmongery_set?: string | null
          mep_requirements?: Json | null
          remarks?: string | null
          sanitary_fixtures?: string | null
          skirting_finish?: string | null
          updated_at?: string
          wall_finish?: string | null
          wbs_node_id: string
        }
        Update: {
          acoustic_rating?: string | null
          ceiling_finish?: string | null
          cornice_finish?: string | null
          created_at?: string
          floor_finish?: string | null
          id?: string
          ironmongery_set?: string | null
          mep_requirements?: Json | null
          remarks?: string | null
          sanitary_fixtures?: string | null
          skirting_finish?: string | null
          updated_at?: string
          wall_finish?: string | null
          wbs_node_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "architecture_room_data_wbs_node_id_fkey"
            columns: ["wbs_node_id"]
            isOneToOne: true
            referencedRelation: "wbs_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      architecture_window_schedule: {
        Row: {
          created_at: string
          glazing_type: string | null
          height_mm: number | null
          id: string
          mark_number: string
          remarks: string | null
          updated_at: string
          wbs_node_id: string
          width_mm: number | null
          window_type: string | null
        }
        Insert: {
          created_at?: string
          glazing_type?: string | null
          height_mm?: number | null
          id?: string
          mark_number: string
          remarks?: string | null
          updated_at?: string
          wbs_node_id: string
          width_mm?: number | null
          window_type?: string | null
        }
        Update: {
          created_at?: string
          glazing_type?: string | null
          height_mm?: number | null
          id?: string
          mark_number?: string
          remarks?: string | null
          updated_at?: string
          wbs_node_id?: string
          width_mm?: number | null
          window_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "architecture_window_schedule_wbs_node_id_fkey"
            columns: ["wbs_node_id"]
            isOneToOne: false
            referencedRelation: "wbs_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          clock_in: string | null
          clock_out: string | null
          created_at: string | null
          date: string
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          action_label: string | null
          action_type: string | null
          after_data: Json | null
          before_data: Json | null
          changed_fields: Json | null
          comment: string | null
          correlation_id: string | null
          created_at: string
          device_type: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          is_system_generated: boolean
          module_code: string | null
          project_id: string | null
          reason_code: string | null
          severity: string | null
          source_channel: string | null
          status_from: string | null
          status_to: string | null
          user_agent: string | null
          user_id: string | null
          wbs_node_id: string | null
        }
        Insert: {
          action: string
          action_label?: string | null
          action_type?: string | null
          after_data?: Json | null
          before_data?: Json | null
          changed_fields?: Json | null
          comment?: string | null
          correlation_id?: string | null
          created_at?: string
          device_type?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          is_system_generated?: boolean
          module_code?: string | null
          project_id?: string | null
          reason_code?: string | null
          severity?: string | null
          source_channel?: string | null
          status_from?: string | null
          status_to?: string | null
          user_agent?: string | null
          user_id?: string | null
          wbs_node_id?: string | null
        }
        Update: {
          action?: string
          action_label?: string | null
          action_type?: string | null
          after_data?: Json | null
          before_data?: Json | null
          changed_fields?: Json | null
          comment?: string | null
          correlation_id?: string | null
          created_at?: string
          device_type?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          is_system_generated?: boolean
          module_code?: string | null
          project_id?: string | null
          reason_code?: string | null
          severity?: string | null
          source_channel?: string | null
          status_from?: string | null
          status_to?: string | null
          user_agent?: string | null
          user_id?: string | null
          wbs_node_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_wbs_node_id_fkey"
            columns: ["wbs_node_id"]
            isOneToOne: false
            referencedRelation: "wbs_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action_label: string
          action_type: string
          changed_fields: Json
          comment: string | null
          correlation_id: string | null
          created_at: string
          department_snapshot: string | null
          device_type: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          is_system_generated: boolean
          module_code: string
          new_values: Json | null
          old_values: Json | null
          project_id: string | null
          reason_code: string | null
          severity: Database["public"]["Enums"]["audit_severity"]
          source_channel: Database["public"]["Enums"]["audit_source_channel"]
          status_from: string | null
          status_to: string | null
          tenant_id: string | null
          user_agent: string | null
          user_id: string | null
          user_name_snapshot: string | null
          user_role_snapshot: string | null
          wbs_node_id: string | null
        }
        Insert: {
          action_label: string
          action_type: string
          changed_fields?: Json
          comment?: string | null
          correlation_id?: string | null
          created_at?: string
          department_snapshot?: string | null
          device_type?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          is_system_generated?: boolean
          module_code: string
          new_values?: Json | null
          old_values?: Json | null
          project_id?: string | null
          reason_code?: string | null
          severity?: Database["public"]["Enums"]["audit_severity"]
          source_channel?: Database["public"]["Enums"]["audit_source_channel"]
          status_from?: string | null
          status_to?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          user_name_snapshot?: string | null
          user_role_snapshot?: string | null
          wbs_node_id?: string | null
        }
        Update: {
          action_label?: string
          action_type?: string
          changed_fields?: Json
          comment?: string | null
          correlation_id?: string | null
          created_at?: string
          department_snapshot?: string | null
          device_type?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          is_system_generated?: boolean
          module_code?: string
          new_values?: Json | null
          old_values?: Json | null
          project_id?: string | null
          reason_code?: string | null
          severity?: Database["public"]["Enums"]["audit_severity"]
          source_channel?: Database["public"]["Enums"]["audit_source_channel"]
          status_from?: string | null
          status_to?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          user_name_snapshot?: string | null
          user_role_snapshot?: string | null
          wbs_node_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_wbs_node_id_fkey"
            columns: ["wbs_node_id"]
            isOneToOne: false
            referencedRelation: "wbs_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      boq_items: {
        Row: {
          created_at: string
          id: string
          material_name: string
          planned_qty: number
          project_id: string
          task_id: string | null
          total_cost: number | null
          unit_cost: number
          uom: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          material_name: string
          planned_qty?: number
          project_id: string
          task_id?: string | null
          total_cost?: number | null
          unit_cost?: number
          uom: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          material_name?: string
          planned_qty?: number
          project_id?: string
          task_id?: string | null
          total_cost?: number | null
          unit_cost?: number
          uom?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "boq_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boq_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_cost_summaries"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "boq_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_line_items: {
        Row: {
          actual_amount: number
          budget_id: string
          committed_amount: number
          cost_code: string | null
          created_at: string
          description: string
          id: string
          planned_amount: number
          updated_at: string
          variance: number | null
          wbs_node_id: string | null
        }
        Insert: {
          actual_amount?: number
          budget_id: string
          committed_amount?: number
          cost_code?: string | null
          created_at?: string
          description: string
          id?: string
          planned_amount?: number
          updated_at?: string
          variance?: number | null
          wbs_node_id?: string | null
        }
        Update: {
          actual_amount?: number
          budget_id?: string
          committed_amount?: number
          cost_code?: string | null
          created_at?: string
          description?: string
          id?: string
          planned_amount?: number
          updated_at?: string
          variance?: number | null
          wbs_node_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_line_items_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "project_budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_line_items_wbs_node_id_fkey"
            columns: ["wbs_node_id"]
            isOneToOne: false
            referencedRelation: "wbs_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_exceptions: {
        Row: {
          calendar_id: string
          created_at: string
          exception_date: string
          hours: number | null
          id: string
          is_working: boolean
          label: string | null
        }
        Insert: {
          calendar_id: string
          created_at?: string
          exception_date: string
          hours?: number | null
          id?: string
          is_working?: boolean
          label?: string | null
        }
        Update: {
          calendar_id?: string
          created_at?: string
          exception_date?: string
          hours?: number | null
          id?: string
          is_working?: boolean
          label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_exceptions_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "calendars"
            referencedColumns: ["id"]
          },
        ]
      }
      calendars: {
        Row: {
          created_at: string
          created_by: string | null
          hours_per_day: number
          id: string
          is_default: boolean
          name: string
          project_id: string
          timezone: string
          updated_at: string
          working_days: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          hours_per_day?: number
          id?: string
          is_default?: boolean
          name: string
          project_id: string
          timezone?: string
          updated_at?: string
          working_days?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          hours_per_day?: number
          id?: string
          is_default?: boolean
          name?: string
          project_id?: string
          timezone?: string
          updated_at?: string
          working_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "calendars_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_templates: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean
          items: Json
          name: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_active?: boolean
          items?: Json
          name: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          items?: Json
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      claim_items: {
        Row: {
          certified_qty: number | null
          claim_id: string
          curr_qty: number | null
          description: string | null
          id: string
          planned_qty: number | null
          prev_qty: number | null
          total_to_date_qty: number | null
          unit_rate: number | null
          uom: string | null
          wbs_node_id: string
        }
        Insert: {
          certified_qty?: number | null
          claim_id: string
          curr_qty?: number | null
          description?: string | null
          id?: string
          planned_qty?: number | null
          prev_qty?: number | null
          total_to_date_qty?: number | null
          unit_rate?: number | null
          uom?: string | null
          wbs_node_id: string
        }
        Update: {
          certified_qty?: number | null
          claim_id?: string
          curr_qty?: number | null
          description?: string | null
          id?: string
          planned_qty?: number | null
          prev_qty?: number | null
          total_to_date_qty?: number | null
          unit_rate?: number | null
          uom?: string | null
          wbs_node_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "claim_items_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "progress_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_items_wbs_node_id_fkey"
            columns: ["wbs_node_id"]
            isOneToOne: false
            referencedRelation: "wbs_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          legal_name: string | null
          logo_url: string | null
          name: string
          phone: string | null
          registration_number: string | null
          settings: Json | null
          tax_id: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          name: string
          phone?: string | null
          registration_number?: string | null
          settings?: Json | null
          tax_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          registration_number?: string | null
          settings?: Json | null
          tax_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      concrete_pour_records: {
        Row: {
          ambient_temperature: number | null
          concrete_grade: Database["public"]["Enums"]["concrete_grade"]
          construction_task_id: string | null
          created_at: string
          created_by: string | null
          custom_grade: string | null
          cylinder_count: number | null
          cylinder_ids: string[] | null
          id: string
          notes: string | null
          pour_date: string
          pour_number: string
          project_id: string
          quantity_m3: number | null
          slump_mm: number | null
          supervised_by: string | null
          temperature_celsius: number | null
          updated_at: string
          wbs_node_id: string | null
          weather_condition: string | null
        }
        Insert: {
          ambient_temperature?: number | null
          concrete_grade?: Database["public"]["Enums"]["concrete_grade"]
          construction_task_id?: string | null
          created_at?: string
          created_by?: string | null
          custom_grade?: string | null
          cylinder_count?: number | null
          cylinder_ids?: string[] | null
          id?: string
          notes?: string | null
          pour_date: string
          pour_number: string
          project_id: string
          quantity_m3?: number | null
          slump_mm?: number | null
          supervised_by?: string | null
          temperature_celsius?: number | null
          updated_at?: string
          wbs_node_id?: string | null
          weather_condition?: string | null
        }
        Update: {
          ambient_temperature?: number | null
          concrete_grade?: Database["public"]["Enums"]["concrete_grade"]
          construction_task_id?: string | null
          created_at?: string
          created_by?: string | null
          custom_grade?: string | null
          cylinder_count?: number | null
          cylinder_ids?: string[] | null
          id?: string
          notes?: string | null
          pour_date?: string
          pour_number?: string
          project_id?: string
          quantity_m3?: number | null
          slump_mm?: number | null
          supervised_by?: string | null
          temperature_celsius?: number | null
          updated_at?: string
          wbs_node_id?: string | null
          weather_condition?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "concrete_pour_records_construction_task_id_fkey"
            columns: ["construction_task_id"]
            isOneToOne: false
            referencedRelation: "construction_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concrete_pour_records_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concrete_pour_records_wbs_node_id_fkey"
            columns: ["wbs_node_id"]
            isOneToOne: false
            referencedRelation: "wbs_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      construction_material_usage: {
        Row: {
          construction_task_id: string | null
          created_at: string
          daily_report_id: string | null
          grn_id: string | null
          id: string
          material_name: string
          notes: string | null
          po_id: string | null
          project_id: string
          quantity: number
          stock_issue_id: string | null
          uom: string
          updated_at: string
          usage_date: string
          used_by: string | null
          wbs_node_id: string | null
        }
        Insert: {
          construction_task_id?: string | null
          created_at?: string
          daily_report_id?: string | null
          grn_id?: string | null
          id?: string
          material_name: string
          notes?: string | null
          po_id?: string | null
          project_id: string
          quantity: number
          stock_issue_id?: string | null
          uom: string
          updated_at?: string
          usage_date?: string
          used_by?: string | null
          wbs_node_id?: string | null
        }
        Update: {
          construction_task_id?: string | null
          created_at?: string
          daily_report_id?: string | null
          grn_id?: string | null
          id?: string
          material_name?: string
          notes?: string | null
          po_id?: string | null
          project_id?: string
          quantity?: number
          stock_issue_id?: string | null
          uom?: string
          updated_at?: string
          usage_date?: string
          used_by?: string | null
          wbs_node_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "construction_material_usage_construction_task_id_fkey"
            columns: ["construction_task_id"]
            isOneToOne: false
            referencedRelation: "construction_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "construction_material_usage_daily_report_id_fkey"
            columns: ["daily_report_id"]
            isOneToOne: false
            referencedRelation: "daily_site_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "construction_material_usage_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "construction_material_usage_wbs_node_id_fkey"
            columns: ["wbs_node_id"]
            isOneToOne: false
            referencedRelation: "wbs_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      construction_tasks: {
        Row: {
          actual_finish: string | null
          actual_start: string | null
          approved_at: string | null
          approved_by: string | null
          assigned_at: string | null
          assigned_by: string | null
          assigned_to: string | null
          created_at: string
          created_by: string | null
          depends_on_task_id: string | null
          description: string | null
          id: string
          planned_finish: string | null
          planned_start: string | null
          priority: Database["public"]["Enums"]["construction_task_priority"]
          progress_pct: number | null
          project_id: string
          rejection_reason: string | null
          status: Database["public"]["Enums"]["construction_task_status"]
          submitted_at: string | null
          submitted_by: string | null
          task_code: string
          title: string
          updated_at: string
          wbs_node_id: string | null
        }
        Insert: {
          actual_finish?: string | null
          actual_start?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          depends_on_task_id?: string | null
          description?: string | null
          id?: string
          planned_finish?: string | null
          planned_start?: string | null
          priority?: Database["public"]["Enums"]["construction_task_priority"]
          progress_pct?: number | null
          project_id: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["construction_task_status"]
          submitted_at?: string | null
          submitted_by?: string | null
          task_code: string
          title: string
          updated_at?: string
          wbs_node_id?: string | null
        }
        Update: {
          actual_finish?: string | null
          actual_start?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          depends_on_task_id?: string | null
          description?: string | null
          id?: string
          planned_finish?: string | null
          planned_start?: string | null
          priority?: Database["public"]["Enums"]["construction_task_priority"]
          progress_pct?: number | null
          project_id?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["construction_task_status"]
          submitted_at?: string | null
          submitted_by?: string | null
          task_code?: string
          title?: string
          updated_at?: string
          wbs_node_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "construction_tasks_depends_on_task_id_fkey"
            columns: ["depends_on_task_id"]
            isOneToOne: false
            referencedRelation: "construction_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "construction_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "construction_tasks_wbs_node_id_fkey"
            columns: ["wbs_node_id"]
            isOneToOne: false
            referencedRelation: "wbs_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cost_codes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "cost_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_delays: {
        Row: {
          category: Database["public"]["Enums"]["dsr_delay_category"]
          created_at: string
          description: string
          dsr_id: string
          id: string
          impacted_task_id: string | null
          lost_hours: number
          severity: Database["public"]["Enums"]["dsr_severity"]
        }
        Insert: {
          category?: Database["public"]["Enums"]["dsr_delay_category"]
          created_at?: string
          description: string
          dsr_id: string
          id?: string
          impacted_task_id?: string | null
          lost_hours?: number
          severity?: Database["public"]["Enums"]["dsr_severity"]
        }
        Update: {
          category?: Database["public"]["Enums"]["dsr_delay_category"]
          created_at?: string
          description?: string
          dsr_id?: string
          id?: string
          impacted_task_id?: string | null
          lost_hours?: number
          severity?: Database["public"]["Enums"]["dsr_severity"]
        }
        Relationships: [
          {
            foreignKeyName: "daily_delays_dsr_id_fkey"
            columns: ["dsr_id"]
            isOneToOne: false
            referencedRelation: "daily_site_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_equipment: {
        Row: {
          created_at: string
          dsr_id: string
          equipment_name: string
          hours_operated: number
          id: string
          idle_hours: number
          idle_reason: string | null
          quantity: number
        }
        Insert: {
          created_at?: string
          dsr_id: string
          equipment_name: string
          hours_operated?: number
          id?: string
          idle_hours?: number
          idle_reason?: string | null
          quantity?: number
        }
        Update: {
          created_at?: string
          dsr_id?: string
          equipment_name?: string
          hours_operated?: number
          id?: string
          idle_hours?: number
          idle_reason?: string | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_equipment_dsr_id_fkey"
            columns: ["dsr_id"]
            isOneToOne: false
            referencedRelation: "daily_site_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_manpower: {
        Row: {
          actual_count: number
          created_at: string
          department: Database["public"]["Enums"]["department"] | null
          dsr_id: string
          id: string
          notes: string | null
          planned_count: number
          trade_label: string | null
        }
        Insert: {
          actual_count?: number
          created_at?: string
          department?: Database["public"]["Enums"]["department"] | null
          dsr_id: string
          id?: string
          notes?: string | null
          planned_count?: number
          trade_label?: string | null
        }
        Update: {
          actual_count?: number
          created_at?: string
          department?: Database["public"]["Enums"]["department"] | null
          dsr_id?: string
          id?: string
          notes?: string | null
          planned_count?: number
          trade_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_manpower_dsr_id_fkey"
            columns: ["dsr_id"]
            isOneToOne: false
            referencedRelation: "daily_site_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_progress_entries: {
        Row: {
          created_at: string
          cumulative_pct: number
          description: string | null
          dsr_id: string
          hours_spent: number
          id: string
          manpower_count: number
          notes: string | null
          progress_pct_today: number
          qty_today: number
          qty_unit: string | null
          task_id: string | null
          wbs_node_id: string | null
        }
        Insert: {
          created_at?: string
          cumulative_pct?: number
          description?: string | null
          dsr_id: string
          hours_spent?: number
          id?: string
          manpower_count?: number
          notes?: string | null
          progress_pct_today?: number
          qty_today?: number
          qty_unit?: string | null
          task_id?: string | null
          wbs_node_id?: string | null
        }
        Update: {
          created_at?: string
          cumulative_pct?: number
          description?: string | null
          dsr_id?: string
          hours_spent?: number
          id?: string
          manpower_count?: number
          notes?: string | null
          progress_pct_today?: number
          qty_today?: number
          qty_unit?: string | null
          task_id?: string | null
          wbs_node_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_progress_entries_dsr_id_fkey"
            columns: ["dsr_id"]
            isOneToOne: false
            referencedRelation: "daily_site_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_site_reports: {
        Row: {
          created_at: string
          created_by: string | null
          general_notes: string | null
          id: string
          project_id: string
          rejection_reason: string | null
          report_date: string
          reviewed_at: string | null
          reviewed_by: string | null
          site_status: Database["public"]["Enums"]["dsr_site_status"]
          status: Database["public"]["Enums"]["dsr_status"]
          submitted_at: string | null
          submitted_by: string | null
          temperature_c: number | null
          updated_at: string
          weather: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          general_notes?: string | null
          id?: string
          project_id: string
          rejection_reason?: string | null
          report_date: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          site_status?: Database["public"]["Enums"]["dsr_site_status"]
          status?: Database["public"]["Enums"]["dsr_status"]
          submitted_at?: string | null
          submitted_by?: string | null
          temperature_c?: number | null
          updated_at?: string
          weather?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          general_notes?: string | null
          id?: string
          project_id?: string
          rejection_reason?: string | null
          report_date?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          site_status?: Database["public"]["Enums"]["dsr_site_status"]
          status?: Database["public"]["Enums"]["dsr_status"]
          submitted_at?: string | null
          submitted_by?: string | null
          temperature_c?: number | null
          updated_at?: string
          weather?: string | null
        }
        Relationships: []
      }
      daily_visitors: {
        Row: {
          created_at: string
          dsr_id: string
          id: string
          organization: string | null
          purpose: string | null
          time_in: string | null
          time_out: string | null
          visitor_name: string
        }
        Insert: {
          created_at?: string
          dsr_id: string
          id?: string
          organization?: string | null
          purpose?: string | null
          time_in?: string | null
          time_out?: string | null
          visitor_name: string
        }
        Update: {
          created_at?: string
          dsr_id?: string
          id?: string
          organization?: string | null
          purpose?: string | null
          time_in?: string | null
          time_out?: string | null
          visitor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_visitors_dsr_id_fkey"
            columns: ["dsr_id"]
            isOneToOne: false
            referencedRelation: "daily_site_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      department_members: {
        Row: {
          created_at: string
          created_by: string | null
          department: Database["public"]["Enums"]["department"]
          id: string
          role_in_dept: Database["public"]["Enums"]["dept_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department: Database["public"]["Enums"]["department"]
          id?: string
          role_in_dept?: Database["public"]["Enums"]["dept_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department?: Database["public"]["Enums"]["department"]
          id?: string
          role_in_dept?: Database["public"]["Enums"]["dept_role"]
          user_id?: string
        }
        Relationships: []
      }
      design_review_comments: {
        Row: {
          author_id: string | null
          comment: string
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          project_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          comment: string
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          project_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          comment?: string
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          project_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "design_review_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      disciplines: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      dlp_defects: {
        Row: {
          contractor_id: string | null
          created_at: string | null
          description: string
          due_date: string | null
          file_url: string | null
          fixed_at: string | null
          id: string
          priority: string | null
          project_id: string | null
          reported_by: string | null
          status: string | null
          updated_at: string | null
          verified_at: string | null
          wbs_node_id: string | null
        }
        Insert: {
          contractor_id?: string | null
          created_at?: string | null
          description: string
          due_date?: string | null
          file_url?: string | null
          fixed_at?: string | null
          id?: string
          priority?: string | null
          project_id?: string | null
          reported_by?: string | null
          status?: string | null
          updated_at?: string | null
          verified_at?: string | null
          wbs_node_id?: string | null
        }
        Update: {
          contractor_id?: string | null
          created_at?: string | null
          description?: string
          due_date?: string | null
          file_url?: string | null
          fixed_at?: string | null
          id?: string
          priority?: string | null
          project_id?: string | null
          reported_by?: string | null
          status?: string | null
          updated_at?: string | null
          verified_at?: string | null
          wbs_node_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dlp_defects_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "stakeholders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dlp_defects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dlp_defects_wbs_node_id_fkey"
            columns: ["wbs_node_id"]
            isOneToOne: false
            referencedRelation: "wbs_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      document_types: {
        Row: {
          category: string | null
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      document_versions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          change_note: string | null
          document_id: string
          file_name: string
          id: string
          mime_type: string | null
          revision_code: string | null
          size_bytes: number | null
          status: Database["public"]["Enums"]["document_status"]
          storage_path: string
          uploaded_at: string
          uploaded_by: string | null
          version: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          change_note?: string | null
          document_id: string
          file_name: string
          id?: string
          mime_type?: string | null
          revision_code?: string | null
          size_bytes?: number | null
          status?: Database["public"]["Enums"]["document_status"]
          storage_path: string
          uploaded_at?: string
          uploaded_by?: string | null
          version: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          change_note?: string | null
          document_id?: string
          file_name?: string
          id?: string
          mime_type?: string | null
          revision_code?: string | null
          size_bytes?: number | null
          status?: Database["public"]["Enums"]["document_status"]
          storage_path?: string
          uploaded_at?: string
          uploaded_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          current_version: number
          description: string | null
          discipline: string | null
          discipline_id: string | null
          document_number: string | null
          document_type_id: string | null
          id: string
          project_id: string
          revision: string | null
          status: Database["public"]["Enums"]["document_status"]
          title: string
          updated_at: string
          wbs_node_id: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          current_version?: number
          description?: string | null
          discipline?: string | null
          discipline_id?: string | null
          document_number?: string | null
          document_type_id?: string | null
          id?: string
          project_id: string
          revision?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          title: string
          updated_at?: string
          wbs_node_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          current_version?: number
          description?: string | null
          discipline?: string | null
          discipline_id?: string | null
          document_number?: string | null
          document_type_id?: string | null
          id?: string
          project_id?: string
          revision?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          title?: string
          updated_at?: string
          wbs_node_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_wbs_node_id_fkey"
            columns: ["wbs_node_id"]
            isOneToOne: false
            referencedRelation: "wbs_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      dsr_attachments: {
        Row: {
          caption: string | null
          created_at: string
          dsr_id: string
          file_name: string
          id: string
          mime_type: string | null
          related_task_id: string | null
          size_bytes: number | null
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          dsr_id: string
          file_name: string
          id?: string
          mime_type?: string | null
          related_task_id?: string | null
          size_bytes?: number | null
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          dsr_id?: string
          file_name?: string
          id?: string
          mime_type?: string | null
          related_task_id?: string | null
          size_bytes?: number | null
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dsr_attachments_dsr_id_fkey"
            columns: ["dsr_id"]
            isOneToOne: false
            referencedRelation: "daily_site_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_types: {
        Row: {
          category: string | null
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      grn_items: {
        Row: {
          accepted_qty: number
          grn_id: string
          id: string
          material_name: string
          notes: string | null
          po_item_id: string | null
          po_quantity: number | null
          quality_status: string | null
          quantity_match_status: string | null
          received_qty: number
          rejected_qty: number
          rejected_reason: string | null
          uom: string
        }
        Insert: {
          accepted_qty: number
          grn_id: string
          id?: string
          material_name: string
          notes?: string | null
          po_item_id?: string | null
          po_quantity?: number | null
          quality_status?: string | null
          quantity_match_status?: string | null
          received_qty: number
          rejected_qty?: number
          rejected_reason?: string | null
          uom: string
        }
        Update: {
          accepted_qty?: number
          grn_id?: string
          id?: string
          material_name?: string
          notes?: string | null
          po_item_id?: string | null
          po_quantity?: number | null
          quality_status?: string | null
          quantity_match_status?: string | null
          received_qty?: number
          rejected_qty?: number
          rejected_reason?: string | null
          uom?: string
        }
        Relationships: [
          {
            foreignKeyName: "grn_items_grn_id_fkey"
            columns: ["grn_id"]
            isOneToOne: false
            referencedRelation: "grns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grn_items_po_item_id_fkey"
            columns: ["po_item_id"]
            isOneToOne: false
            referencedRelation: "purchase_order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      grns: {
        Row: {
          actual_delivery_date: string | null
          created_at: string
          delivery_date: string
          delivery_note_number: string | null
          delivery_note_ref: string | null
          delivery_status: string | null
          driver_name: string | null
          driver_phone: string | null
          grn_number: string
          id: string
          inspection_notes: string | null
          inspection_passed: boolean | null
          inspection_required: boolean | null
          po_id: string | null
          po_match_status: string | null
          project_id: string
          received_by: string
          vehicle_number: string | null
        }
        Insert: {
          actual_delivery_date?: string | null
          created_at?: string
          delivery_date?: string
          delivery_note_number?: string | null
          delivery_note_ref?: string | null
          delivery_status?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          grn_number: string
          id?: string
          inspection_notes?: string | null
          inspection_passed?: boolean | null
          inspection_required?: boolean | null
          po_id?: string | null
          po_match_status?: string | null
          project_id: string
          received_by: string
          vehicle_number?: string | null
        }
        Update: {
          actual_delivery_date?: string | null
          created_at?: string
          delivery_date?: string
          delivery_note_number?: string | null
          delivery_note_ref?: string | null
          delivery_status?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          grn_number?: string
          id?: string
          inspection_notes?: string | null
          inspection_passed?: boolean | null
          inspection_required?: boolean | null
          po_id?: string | null
          po_match_status?: string | null
          project_id?: string
          received_by?: string
          vehicle_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grns_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grns_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grns_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      handover_items: {
        Row: {
          created_at: string | null
          file_url: string | null
          id: string
          item_type: string
          package_id: string | null
          reference_id: string | null
          remarks: string | null
          status: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          file_url?: string | null
          id?: string
          item_type: string
          package_id?: string | null
          reference_id?: string | null
          remarks?: string | null
          status?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          file_url?: string | null
          id?: string
          item_type?: string
          package_id?: string | null
          reference_id?: string | null
          remarks?: string | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "handover_items_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "handover_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      handover_packages: {
        Row: {
          approved_at: string | null
          created_at: string | null
          description: string | null
          id: string
          project_id: string | null
          status: string | null
          submitted_at: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          project_id?: string | null
          status?: string | null
          submitted_at?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          project_id?: string | null
          status?: string | null
          submitted_at?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "handover_packages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      holidays: {
        Row: {
          created_at: string | null
          date: string
          id: string
          is_recurring: boolean | null
          name: string
          project_id: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          is_recurring?: boolean | null
          name: string
          project_id?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          is_recurring?: boolean | null
          name?: string
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "holidays_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_checklist_items: {
        Row: {
          checklist_id: string
          created_at: string
          id: string
          is_required: boolean
          item_text: string
          order_index: number
        }
        Insert: {
          checklist_id: string
          created_at?: string
          id?: string
          is_required?: boolean
          item_text: string
          order_index?: number
        }
        Update: {
          checklist_id?: string
          created_at?: string
          id?: string
          is_required?: boolean
          item_text?: string
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "inspection_checklist_items_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "inspection_checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_checklists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          project_id: string
          task_type: Database["public"]["Enums"]["task_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          project_id: string
          task_type: Database["public"]["Enums"]["task_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          project_id?: string
          task_type?: Database["public"]["Enums"]["task_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_checklists_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_requests: {
        Row: {
          created_at: string
          id: string
          inspected_by: string | null
          inspection_date: string | null
          location: string | null
          project_id: string
          remarks: string | null
          request_number: string
          requested_by: string | null
          requested_date: string
          status: Database["public"]["Enums"]["ir_status"]
          task_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          inspected_by?: string | null
          inspection_date?: string | null
          location?: string | null
          project_id: string
          remarks?: string | null
          request_number: string
          requested_by?: string | null
          requested_date?: string
          status?: Database["public"]["Enums"]["ir_status"]
          task_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          inspected_by?: string | null
          inspection_date?: string | null
          location?: string | null
          project_id?: string
          remarks?: string | null
          request_number?: string
          requested_by?: string | null
          requested_date?: string
          status?: Database["public"]["Enums"]["ir_status"]
          task_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_requests_inspected_by_fkey"
            columns: ["inspected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_requests_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_cost_summaries"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "inspection_requests_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_results: {
        Row: {
          checklist_item_id: string
          comments: string | null
          created_at: string
          id: string
          inspection_request_id: string
          status: Database["public"]["Enums"]["checklist_result"] | null
          updated_at: string
        }
        Insert: {
          checklist_item_id: string
          comments?: string | null
          created_at?: string
          id?: string
          inspection_request_id: string
          status?: Database["public"]["Enums"]["checklist_result"] | null
          updated_at?: string
        }
        Update: {
          checklist_item_id?: string
          comments?: string | null
          created_at?: string
          id?: string
          inspection_request_id?: string
          status?: Database["public"]["Enums"]["checklist_result"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_results_checklist_item_id_fkey"
            columns: ["checklist_item_id"]
            isOneToOne: false
            referencedRelation: "inspection_checklist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_results_inspection_request_id_fkey"
            columns: ["inspection_request_id"]
            isOneToOne: false
            referencedRelation: "inspection_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          match_status: string | null
          po_item_id: string | null
          quantity: number
          total_price: number | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          match_status?: string | null
          po_item_id?: string | null
          quantity?: number
          total_price?: number | null
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          match_status?: string | null
          po_item_id?: string | null
          quantity?: number
          total_price?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "supplier_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_po_item_id_fkey"
            columns: ["po_item_id"]
            isOneToOne: false
            referencedRelation: "po_items"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_alert_events: {
        Row: {
          actual_value: number
          created_at: string
          id: string
          kpi_category: string
          kpi_name: string
          message: string
          operator: string
          project_id: string
          read_at: string | null
          severity: string
          threshold_value: number
        }
        Insert: {
          actual_value: number
          created_at?: string
          id?: string
          kpi_category: string
          kpi_name: string
          message: string
          operator: string
          project_id: string
          read_at?: string | null
          severity: string
          threshold_value: number
        }
        Update: {
          actual_value?: number
          created_at?: string
          id?: string
          kpi_category?: string
          kpi_name?: string
          message?: string
          operator?: string
          project_id?: string
          read_at?: string | null
          severity?: string
          threshold_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "kpi_alert_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_alert_thresholds: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          kpi_category: string
          kpi_name: string
          label: string
          operator: string
          project_id: string
          severity: string
          threshold_value: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          kpi_category: string
          kpi_name: string
          label: string
          operator: string
          project_id: string
          severity: string
          threshold_value: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          kpi_category?: string
          kpi_name?: string
          label?: string
          operator?: string
          project_id?: string
          severity?: string
          threshold_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kpi_alert_thresholds_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      labor_catalogs: {
        Row: {
          created_at: string
          description: string | null
          id: string
          project_id: string
          role_name: string
          standard_rate: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          project_id: string
          role_name: string
          standard_rate?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          project_id?: string
          role_name?: string
          standard_rate?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "labor_catalogs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      labor_rates: {
        Row: {
          created_at: string
          currency: string
          hourly_rate: number
          id: string
          is_active: boolean
          labor_code: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          hourly_rate?: number
          id?: string
          is_active?: boolean
          labor_code: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          hourly_rate?: number
          id?: string
          is_active?: boolean
          labor_code?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      leave_balances: {
        Row: {
          carried_over_days: number
          created_at: string | null
          id: string
          leave_type_id: string
          pending_days: number
          total_days: number
          updated_at: string | null
          used_days: number
          user_id: string
          year: number
        }
        Insert: {
          carried_over_days?: number
          created_at?: string | null
          id?: string
          leave_type_id: string
          pending_days?: number
          total_days?: number
          updated_at?: string | null
          used_days?: number
          user_id: string
          year?: number
        }
        Update: {
          carried_over_days?: number
          created_at?: string | null
          id?: string
          leave_type_id?: string
          pending_days?: number
          total_days?: number
          updated_at?: string | null
          used_days?: number
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "leave_balances_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          attachment_url: string | null
          created_at: string | null
          end_date: string
          id: string
          leave_type_id: string
          notes: string | null
          reason: string
          rejection_reason: string | null
          start_date: string
          status: Database["public"]["Enums"]["leave_status"]
          total_days: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          attachment_url?: string | null
          created_at?: string | null
          end_date: string
          id?: string
          leave_type_id: string
          notes?: string | null
          reason: string
          rejection_reason?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["leave_status"]
          total_days: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          attachment_url?: string | null
          created_at?: string | null
          end_date?: string
          id?: string
          leave_type_id?: string
          notes?: string | null
          reason?: string
          rejection_reason?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["leave_status"]
          total_days?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_types: {
        Row: {
          code: Database["public"]["Enums"]["leave_type_code"]
          created_at: string | null
          default_days_per_year: number | null
          description: string | null
          id: string
          is_active: boolean | null
          is_paid: boolean | null
          max_consecutive_days: number | null
          min_days: number | null
          name: string
          requires_approval: boolean | null
          requires_attachment: boolean | null
          sort_order: number | null
        }
        Insert: {
          code: Database["public"]["Enums"]["leave_type_code"]
          created_at?: string | null
          default_days_per_year?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_paid?: boolean | null
          max_consecutive_days?: number | null
          min_days?: number | null
          name: string
          requires_approval?: boolean | null
          requires_attachment?: boolean | null
          sort_order?: number | null
        }
        Update: {
          code?: Database["public"]["Enums"]["leave_type_code"]
          created_at?: string | null
          default_days_per_year?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_paid?: boolean | null
          max_consecutive_days?: number | null
          min_days?: number | null
          name?: string
          requires_approval?: boolean | null
          requires_attachment?: boolean | null
          sort_order?: number | null
        }
        Relationships: []
      }
      material_catalog: {
        Row: {
          category: string
          code: string
          created_at: string
          default_price: number | null
          description: string | null
          id: string
          name: string
          unit: string
          updated_at: string
        }
        Insert: {
          category: string
          code: string
          created_at?: string
          default_price?: number | null
          description?: string | null
          id?: string
          name: string
          unit: string
          updated_at?: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          default_price?: number | null
          description?: string | null
          id?: string
          name?: string
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      material_codes: {
        Row: {
          category: string | null
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      material_issues: {
        Row: {
          id: string
          issue_date: string
          issued_by: string
          material_name: string
          notes: string | null
          project_id: string
          qty_issued: number
          task_id: string
          unit_cost_at_issue: number
        }
        Insert: {
          id?: string
          issue_date?: string
          issued_by: string
          material_name: string
          notes?: string | null
          project_id: string
          qty_issued: number
          task_id: string
          unit_cost_at_issue?: number
        }
        Update: {
          id?: string
          issue_date?: string
          issued_by?: string
          material_name?: string
          notes?: string | null
          project_id?: string
          qty_issued?: number
          task_id?: string
          unit_cost_at_issue?: number
        }
        Relationships: [
          {
            foreignKeyName: "material_issues_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_issues_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_issues_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_cost_summaries"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "material_issues_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      material_request_items: {
        Row: {
          approved_qty: number | null
          boq_id: string | null
          id: string
          material_name: string
          mr_id: string
          notes: string | null
          requested_qty: number
          task_id: string | null
          uom: string
        }
        Insert: {
          approved_qty?: number | null
          boq_id?: string | null
          id?: string
          material_name: string
          mr_id: string
          notes?: string | null
          requested_qty: number
          task_id?: string | null
          uom: string
        }
        Update: {
          approved_qty?: number | null
          boq_id?: string | null
          id?: string
          material_name?: string
          mr_id?: string
          notes?: string | null
          requested_qty?: number
          task_id?: string | null
          uom?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_request_items_boq_id_fkey"
            columns: ["boq_id"]
            isOneToOne: false
            referencedRelation: "boq_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_request_items_mr_id_fkey"
            columns: ["mr_id"]
            isOneToOne: false
            referencedRelation: "material_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_request_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_cost_summaries"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "material_request_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      material_requests: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          project_id: string
          request_date: string
          request_number: string
          requested_by: string
          required_date: string
          status: Database["public"]["Enums"]["mr_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          project_id: string
          request_date?: string
          request_number: string
          requested_by: string
          required_date: string
          status?: Database["public"]["Enums"]["mr_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          project_id?: string
          request_date?: string
          request_number?: string
          requested_by?: string
          required_date?: string
          status?: Database["public"]["Enums"]["mr_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mep_drawings: {
        Row: {
          created_at: string
          discipline: string
          drawing_number: string
          file_url: string | null
          id: string
          project_id: string
          revision: string
          status: string
          title: string
          updated_at: string
          wbs_node_id: string | null
        }
        Insert: {
          created_at?: string
          discipline?: string
          drawing_number: string
          file_url?: string | null
          id?: string
          project_id: string
          revision?: string
          status?: string
          title: string
          updated_at?: string
          wbs_node_id?: string | null
        }
        Update: {
          created_at?: string
          discipline?: string
          drawing_number?: string
          file_url?: string | null
          id?: string
          project_id?: string
          revision?: string
          status?: string
          title?: string
          updated_at?: string
          wbs_node_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mep_drawings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mep_drawings_wbs_node_id_fkey"
            columns: ["wbs_node_id"]
            isOneToOne: false
            referencedRelation: "wbs_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      mep_equipment_schedules: {
        Row: {
          capacity: string | null
          created_at: string
          description: string
          discipline: string
          duty: string | null
          id: string
          make_model: string | null
          project_id: string
          status: string
          tag_number: string
          updated_at: string
          wbs_node_id: string | null
        }
        Insert: {
          capacity?: string | null
          created_at?: string
          description: string
          discipline?: string
          duty?: string | null
          id?: string
          make_model?: string | null
          project_id: string
          status?: string
          tag_number: string
          updated_at?: string
          wbs_node_id?: string | null
        }
        Update: {
          capacity?: string | null
          created_at?: string
          description?: string
          discipline?: string
          duty?: string | null
          id?: string
          make_model?: string | null
          project_id?: string
          status?: string
          tag_number?: string
          updated_at?: string
          wbs_node_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mep_equipment_schedules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mep_equipment_schedules_wbs_node_id_fkey"
            columns: ["wbs_node_id"]
            isOneToOne: false
            referencedRelation: "wbs_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      mep_load_schedules: {
        Row: {
          board_reference: string
          connected_load_kw: number | null
          created_at: string | null
          discipline: string
          id: string
          project_id: string | null
          status: string | null
          total_load_kw: number | null
          wbs_node_id: string | null
        }
        Insert: {
          board_reference: string
          connected_load_kw?: number | null
          created_at?: string | null
          discipline: string
          id?: string
          project_id?: string | null
          status?: string | null
          total_load_kw?: number | null
          wbs_node_id?: string | null
        }
        Update: {
          board_reference?: string
          connected_load_kw?: number | null
          created_at?: string | null
          discipline?: string
          id?: string
          project_id?: string | null
          status?: string | null
          total_load_kw?: number | null
          wbs_node_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mep_load_schedules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mep_load_schedules_wbs_node_id_fkey"
            columns: ["wbs_node_id"]
            isOneToOne: false
            referencedRelation: "wbs_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      mep_material_submittals: {
        Row: {
          created_at: string | null
          discipline: string
          id: string
          item_description: string
          manufacturer: string | null
          model_number: string | null
          project_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          discipline: string
          id?: string
          item_description: string
          manufacturer?: string | null
          model_number?: string | null
          project_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          discipline?: string
          id?: string
          item_description?: string
          manufacturer?: string | null
          model_number?: string | null
          project_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mep_material_submittals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      mep_sleeve_openings: {
        Row: {
          arc_approved: boolean
          comments: string | null
          coordination_status: string
          created_at: string
          discipline: string
          element_type: string
          id: string
          location_description: string
          project_id: string
          reference_no: string
          size_mm: string | null
          str_approved: boolean
          updated_at: string
          wbs_node_id: string | null
        }
        Insert: {
          arc_approved?: boolean
          comments?: string | null
          coordination_status?: string
          created_at?: string
          discipline?: string
          element_type?: string
          id?: string
          location_description: string
          project_id: string
          reference_no: string
          size_mm?: string | null
          str_approved?: boolean
          updated_at?: string
          wbs_node_id?: string | null
        }
        Update: {
          arc_approved?: boolean
          comments?: string | null
          coordination_status?: string
          created_at?: string
          discipline?: string
          element_type?: string
          id?: string
          location_description?: string
          project_id?: string
          reference_no?: string
          size_mm?: string | null
          str_approved?: boolean
          updated_at?: string
          wbs_node_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mep_sleeve_openings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mep_sleeve_openings_wbs_node_id_fkey"
            columns: ["wbs_node_id"]
            isOneToOne: false
            referencedRelation: "wbs_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      mep_system_schematics: {
        Row: {
          created_at: string | null
          id: string
          project_id: string | null
          reference_number: string
          revision: string | null
          status: string | null
          system_type: string
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id?: string | null
          reference_number: string
          revision?: string | null
          status?: string | null
          system_type: string
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string | null
          reference_number?: string
          revision?: string | null
          status?: string | null
          system_type?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "mep_system_schematics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ncrs: {
        Row: {
          assigned_to: string | null
          corrective_action: string | null
          created_at: string
          id: string
          inspection_request_id: string | null
          issue_description: string
          ncr_number: string
          project_id: string
          reported_by: string | null
          severity: Database["public"]["Enums"]["ncr_severity"]
          status: Database["public"]["Enums"]["ncr_status"]
          task_id: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          corrective_action?: string | null
          created_at?: string
          id?: string
          inspection_request_id?: string | null
          issue_description: string
          ncr_number: string
          project_id: string
          reported_by?: string | null
          severity?: Database["public"]["Enums"]["ncr_severity"]
          status?: Database["public"]["Enums"]["ncr_status"]
          task_id?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          corrective_action?: string | null
          created_at?: string
          id?: string
          inspection_request_id?: string | null
          issue_description?: string
          ncr_number?: string
          project_id?: string
          reported_by?: string | null
          severity?: Database["public"]["Enums"]["ncr_severity"]
          status?: Database["public"]["Enums"]["ncr_status"]
          task_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ncrs_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ncrs_inspection_request_id_fkey"
            columns: ["inspection_request_id"]
            isOneToOne: false
            referencedRelation: "inspection_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ncrs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ncrs_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ncrs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_cost_summaries"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "ncrs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_delivery_logs: {
        Row: {
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          delivery_status: Database["public"]["Enums"]["notification_delivery_status"]
          failed_reason: string | null
          id: string
          notification_id: string
          provider_response: Json | null
          retry_count: number
          sent_at: string | null
          updated_at: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          delivery_status?: Database["public"]["Enums"]["notification_delivery_status"]
          failed_reason?: string | null
          id?: string
          notification_id: string
          provider_response?: Json | null
          retry_count?: number
          sent_at?: string | null
          updated_at?: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          delivery_status?: Database["public"]["Enums"]["notification_delivery_status"]
          failed_reason?: string | null
          id?: string
          notification_id?: string
          provider_response?: Json | null
          retry_count?: number
          sent_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_delivery_logs_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_rules: {
        Row: {
          channels: string
          created_at: string
          delay_minutes: number
          digest_enabled: boolean
          escalation_after_hours: number | null
          escalation_enabled: boolean
          escalation_roles: string | null
          event_code: string
          event_label: string | null
          id: string
          is_active: boolean
          module_code: string | null
          priority: string
          project_id: string | null
          quiet_hours_enabled: boolean
          recipient_roles: string[] | null
          recipient_strategy: string
          recipient_users: string[] | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          channels?: string
          created_at?: string
          delay_minutes?: number
          digest_enabled?: boolean
          escalation_after_hours?: number | null
          escalation_enabled?: boolean
          escalation_roles?: string | null
          event_code: string
          event_label?: string | null
          id?: string
          is_active?: boolean
          module_code?: string | null
          priority?: string
          project_id?: string | null
          quiet_hours_enabled?: boolean
          recipient_roles?: string[] | null
          recipient_strategy: string
          recipient_users?: string[] | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          channels?: string
          created_at?: string
          delay_minutes?: number
          digest_enabled?: boolean
          escalation_after_hours?: number | null
          escalation_enabled?: boolean
          escalation_roles?: string | null
          event_code?: string
          event_label?: string | null
          id?: string
          is_active?: boolean
          module_code?: string | null
          priority?: string
          project_id?: string | null
          quiet_hours_enabled?: boolean
          recipient_roles?: string[] | null
          recipient_strategy?: string
          recipient_users?: string[] | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_rules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          created_at: string
          default_priority: Database["public"]["Enums"]["notification_priority"]
          event_code: string
          id: string
          is_active: boolean
          message_template: string
          module_code: string
          supported_channels: Database["public"]["Enums"]["notification_channel"][]
          template_code: string
          title_template: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_priority?: Database["public"]["Enums"]["notification_priority"]
          event_code: string
          id?: string
          is_active?: boolean
          message_template: string
          module_code: string
          supported_channels?: Database["public"]["Enums"]["notification_channel"][]
          template_code: string
          title_template: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_priority?: Database["public"]["Enums"]["notification_priority"]
          event_code?: string
          id?: string
          is_active?: boolean
          message_template?: string
          module_code?: string
          supported_channels?: Database["public"]["Enums"]["notification_channel"][]
          template_code?: string
          title_template?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          actioned_at: string | null
          actor_id: string | null
          body: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          event_code: string | null
          id: string
          metadata: Json
          module_code: string | null
          notification_kind: Database["public"]["Enums"]["notification_kind"]
          priority: Database["public"]["Enums"]["notification_priority"]
          project_id: string | null
          read_at: string | null
          snoozed_until: string | null
          status: Database["public"]["Enums"]["notification_status"]
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          action_url?: string | null
          actioned_at?: string | null
          actor_id?: string | null
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_code?: string | null
          id?: string
          metadata?: Json
          module_code?: string | null
          notification_kind?: Database["public"]["Enums"]["notification_kind"]
          priority?: Database["public"]["Enums"]["notification_priority"]
          project_id?: string | null
          read_at?: string | null
          snoozed_until?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          action_url?: string | null
          actioned_at?: string | null
          actor_id?: string | null
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_code?: string | null
          id?: string
          metadata?: Json
          module_code?: string | null
          notification_kind?: Database["public"]["Enums"]["notification_kind"]
          priority?: Database["public"]["Enums"]["notification_priority"]
          project_id?: string | null
          read_at?: string | null
          snoozed_until?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      org_departments: {
        Row: {
          color_token: string
          created_at: string
          icon_key: string
          id: string
          is_active: boolean
          key: string
          label: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color_token?: string
          created_at?: string
          icon_key?: string
          id?: string
          is_active?: boolean
          key: string
          label: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color_token?: string
          created_at?: string
          icon_key?: string
          id?: string
          is_active?: boolean
          key?: string
          label?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      pay_rates: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          effective_from: string
          effective_to: string | null
          hourly_rate: number
          id: string
          overtime_multiplier: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          effective_from?: string
          effective_to?: string | null
          hourly_rate: number
          id?: string
          overtime_multiplier?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          effective_from?: string
          effective_to?: string | null
          hourly_rate?: number
          id?: string
          overtime_multiplier?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payroll_lines: {
        Row: {
          created_at: string
          currency: string
          hourly_rate: number
          id: string
          overtime_hours: number
          overtime_multiplier: number
          overtime_pay: number
          period_id: string
          regular_hours: number
          regular_pay: number
          total_pay: number
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          hourly_rate?: number
          id?: string
          overtime_hours?: number
          overtime_multiplier?: number
          overtime_pay?: number
          period_id: string
          regular_hours?: number
          regular_pay?: number
          total_pay?: number
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          hourly_rate?: number
          id?: string
          overtime_hours?: number
          overtime_multiplier?: number
          overtime_pay?: number
          period_id?: string
          regular_hours?: number
          regular_pay?: number
          total_pay?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_lines_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "payroll_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_periods: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          locked_at: string | null
          locked_by: string | null
          name: string
          notes: string | null
          paid_at: string | null
          period_end: string
          period_start: string
          status: Database["public"]["Enums"]["payroll_period_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          name: string
          notes?: string | null
          paid_at?: string | null
          period_end: string
          period_start: string
          status?: Database["public"]["Enums"]["payroll_period_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          name?: string
          notes?: string | null
          paid_at?: string | null
          period_end?: string
          period_start?: string
          status?: Database["public"]["Enums"]["payroll_period_status"]
          updated_at?: string
        }
        Relationships: []
      }
      po_items: {
        Row: {
          created_at: string
          delivered_quantity: number | null
          description: string
          id: string
          po_id: string
          pr_item_id: string | null
          quantity: number
          quotation_item_id: string | null
          total_price: number | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          delivered_quantity?: number | null
          description: string
          id?: string
          po_id: string
          pr_item_id?: string | null
          quantity?: number
          quotation_item_id?: string | null
          total_price?: number | null
          unit_price?: number
        }
        Update: {
          created_at?: string
          delivered_quantity?: number | null
          description?: string
          id?: string
          po_id?: string
          pr_item_id?: string | null
          quantity?: number
          quotation_item_id?: string | null
          total_price?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "po_items_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_items_pr_item_id_fkey"
            columns: ["pr_item_id"]
            isOneToOne: false
            referencedRelation: "pr_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_items_quotation_item_id_fkey"
            columns: ["quotation_item_id"]
            isOneToOne: false
            referencedRelation: "quotation_items"
            referencedColumns: ["id"]
          },
        ]
      }
      pr_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          material_id: string | null
          pr_id: string
          quantity: number
          total_price: number | null
          unit_price: number
          wbs_node_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          material_id?: string | null
          pr_id: string
          quantity: number
          total_price?: number | null
          unit_price: number
          wbs_node_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          material_id?: string | null
          pr_id?: string
          quantity?: number
          total_price?: number | null
          unit_price?: number
          wbs_node_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pr_items_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "material_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pr_items_pr_id_fkey"
            columns: ["pr_id"]
            isOneToOne: false
            referencedRelation: "purchase_requisitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pr_items_wbs_node_id_fkey"
            columns: ["wbs_node_id"]
            isOneToOne: false
            referencedRelation: "wbs_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bank_account: string | null
          bank_name: string | null
          company_id: string | null
          created_at: string
          department: string | null
          email: string | null
          emergency_contact: string | null
          emergency_phone: string | null
          employee_id: string | null
          employment_status:
            | Database["public"]["Enums"]["employment_status"]
            | null
          full_name: string
          hire_date: string | null
          id: string
          job_title: string | null
          level: string | null
          phone: string | null
          report_to_employee_id: string | null
          reports_to: string | null
          telegram_chat_id: number | null
          telegram_linked_at: string | null
          telegram_username: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bank_account?: string | null
          bank_name?: string | null
          company_id?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          employee_id?: string | null
          employment_status?:
            | Database["public"]["Enums"]["employment_status"]
            | null
          full_name?: string
          hire_date?: string | null
          id: string
          job_title?: string | null
          level?: string | null
          phone?: string | null
          report_to_employee_id?: string | null
          reports_to?: string | null
          telegram_chat_id?: number | null
          telegram_linked_at?: string | null
          telegram_username?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bank_account?: string | null
          bank_name?: string | null
          company_id?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          employee_id?: string | null
          employment_status?:
            | Database["public"]["Enums"]["employment_status"]
            | null
          full_name?: string
          hire_date?: string | null
          id?: string
          job_title?: string | null
          level?: string | null
          phone?: string | null
          report_to_employee_id?: string | null
          reports_to?: string | null
          telegram_chat_id?: number | null
          telegram_linked_at?: string | null
          telegram_username?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_reports_to_fkey"
            columns: ["reports_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      progress_claims: {
        Row: {
          claim_number: string
          created_at: string | null
          id: string
          period_end: string
          period_start: string
          project_id: string
          remarks: string | null
          retention_pct: number | null
          status: Database["public"]["Enums"]["claim_status"] | null
          total_amount_certified: number | null
          total_amount_claimed: number | null
          updated_at: string | null
        }
        Insert: {
          claim_number: string
          created_at?: string | null
          id?: string
          period_end: string
          period_start: string
          project_id: string
          remarks?: string | null
          retention_pct?: number | null
          status?: Database["public"]["Enums"]["claim_status"] | null
          total_amount_certified?: number | null
          total_amount_claimed?: number | null
          updated_at?: string | null
        }
        Update: {
          claim_number?: string
          created_at?: string | null
          id?: string
          period_end?: string
          period_start?: string
          project_id?: string
          remarks?: string | null
          retention_pct?: number | null
          status?: Database["public"]["Enums"]["claim_status"] | null
          total_amount_certified?: number | null
          total_amount_claimed?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progress_claims_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_budgets: {
        Row: {
          budget_code: string
          budget_name: string
          committed_amount: number
          created_at: string
          currency: string | null
          fiscal_year: number | null
          id: string
          notes: string | null
          project_id: string
          spent_amount: number
          total_budget: number
          updated_at: string
        }
        Insert: {
          budget_code: string
          budget_name: string
          committed_amount?: number
          created_at?: string
          currency?: string | null
          fiscal_year?: number | null
          id?: string
          notes?: string | null
          project_id: string
          spent_amount?: number
          total_budget?: number
          updated_at?: string
        }
        Update: {
          budget_code?: string
          budget_name?: string
          committed_amount?: number
          created_at?: string
          currency?: string | null
          fiscal_year?: number | null
          id?: string
          notes?: string | null
          project_id?: string
          spent_amount?: number
          total_budget?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_budgets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_holidays: {
        Row: {
          created_at: string
          created_by: string | null
          holiday_date: string
          id: string
          label: string | null
          project_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          holiday_date: string
          id?: string
          label?: string | null
          project_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          holiday_date?: string
          id?: string
          label?: string | null
          project_id?: string
        }
        Relationships: []
      }
      project_members: {
        Row: {
          added_at: string
          id: string
          project_id: string
          project_role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          project_id: string
          project_role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          added_at?: string
          id?: string
          project_id?: string
          project_role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_stakeholders: {
        Row: {
          access_level: string | null
          added_at: string
          approval_authority: boolean
          approval_level: string | null
          discipline: string | null
          id: string
          project_id: string
          project_role: string | null
          responsibilities: Json | null
          restricted_wbs_ids: string[] | null
          stakeholder_id: string
        }
        Insert: {
          access_level?: string | null
          added_at?: string
          approval_authority?: boolean
          approval_level?: string | null
          discipline?: string | null
          id?: string
          project_id: string
          project_role?: string | null
          responsibilities?: Json | null
          restricted_wbs_ids?: string[] | null
          stakeholder_id: string
        }
        Update: {
          access_level?: string | null
          added_at?: string
          approval_authority?: boolean
          approval_level?: string | null
          discipline?: string | null
          id?: string
          project_id?: string
          project_role?: string | null
          responsibilities?: Json | null
          restricted_wbs_ids?: string[] | null
          stakeholder_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_stakeholders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_stakeholders_stakeholder_id_fkey"
            columns: ["stakeholder_id"]
            isOneToOne: false
            referencedRelation: "stakeholders"
            referencedColumns: ["id"]
          },
        ]
      }
      project_types: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          budget: number | null
          client_id: string | null
          client_name: string | null
          code: string
          company_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          location: string | null
          name: string
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          budget?: number | null
          client_id?: string | null
          client_name?: string | null
          code: string
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          name: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          budget?: number | null
          client_id?: string | null
          client_name?: string | null
          code?: string
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          name?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "stakeholders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      public_holidays: {
        Row: {
          created_at: string
          holiday_date: string
          id: string
          is_active: boolean
          is_recurring_yearly: boolean
          label: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          holiday_date: string
          id?: string
          is_active?: boolean
          is_recurring_yearly?: boolean
          label: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          holiday_date?: string
          id?: string
          is_active?: boolean
          is_recurring_yearly?: boolean
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      punch_list_items: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          id: string
          inspection_request_id: string | null
          location: string | null
          project_id: string
          resolved_by: string | null
          status: Database["public"]["Enums"]["punch_list_status"]
          task_id: string | null
          updated_at: string
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          inspection_request_id?: string | null
          location?: string | null
          project_id: string
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["punch_list_status"]
          task_id?: string | null
          updated_at?: string
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          inspection_request_id?: string | null
          location?: string | null
          project_id?: string
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["punch_list_status"]
          task_id?: string | null
          updated_at?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "punch_list_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "punch_list_items_inspection_request_id_fkey"
            columns: ["inspection_request_id"]
            isOneToOne: false
            referencedRelation: "inspection_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "punch_list_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "punch_list_items_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "punch_list_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_cost_summaries"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "punch_list_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "punch_list_items_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          id: string
          material_name: string
          mr_item_id: string | null
          order_qty: number
          po_id: string
          total_price: number | null
          unit_price: number
          uom: string
        }
        Insert: {
          id?: string
          material_name: string
          mr_item_id?: string | null
          order_qty: number
          po_id: string
          total_price?: number | null
          unit_price?: number
          uom: string
        }
        Update: {
          id?: string
          material_name?: string
          mr_item_id?: string | null
          order_qty?: number
          po_id?: string
          total_price?: number | null
          unit_price?: number
          uom?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_mr_item_id_fkey"
            columns: ["mr_item_id"]
            isOneToOne: false
            referencedRelation: "material_request_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          actual_delivery: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          delivery_terms: string | null
          expected_delivery: string | null
          id: string
          notes: string | null
          payment_terms: string | null
          po_date: string
          po_number: string
          project_id: string
          quotation_id: string | null
          rfq_id: string | null
          status: Database["public"]["Enums"]["po_status"]
          supplier_id: string
          supplier_name: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          actual_delivery?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          delivery_terms?: string | null
          expected_delivery?: string | null
          id?: string
          notes?: string | null
          payment_terms?: string | null
          po_date?: string
          po_number: string
          project_id: string
          quotation_id?: string | null
          rfq_id?: string | null
          status?: Database["public"]["Enums"]["po_status"]
          supplier_id: string
          supplier_name: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          actual_delivery?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          delivery_terms?: string | null
          expected_delivery?: string | null
          id?: string
          notes?: string | null
          payment_terms?: string | null
          po_date?: string
          po_number?: string
          project_id?: string
          quotation_id?: string | null
          rfq_id?: string | null
          status?: Database["public"]["Enums"]["po_status"]
          supplier_id?: string
          supplier_name?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "supplier_quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfq"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_requisitions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          budget_code: string | null
          created_at: string
          description: string | null
          id: string
          pr_number: string
          project_id: string
          requested_by: string | null
          required_date: string | null
          status: Database["public"]["Enums"]["pr_status"]
          subject: string
          total_estimate: number | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          budget_code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          pr_number: string
          project_id: string
          requested_by?: string | null
          required_date?: string | null
          status?: Database["public"]["Enums"]["pr_status"]
          subject: string
          total_estimate?: number | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          budget_code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          pr_number?: string
          project_id?: string
          requested_by?: string | null
          required_date?: string | null
          status?: Database["public"]["Enums"]["pr_status"]
          subject?: string
          total_estimate?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_requisitions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_items: {
        Row: {
          created_at: string
          id: string
          item_description: string
          pr_item_id: string | null
          quantity: number
          quotation_id: string
          technical_compliance: string | null
          total_price: number | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          item_description: string
          pr_item_id?: string | null
          quantity?: number
          quotation_id: string
          technical_compliance?: string | null
          total_price?: number | null
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          item_description?: string
          pr_item_id?: string | null
          quantity?: number
          quotation_id?: string
          technical_compliance?: string | null
          total_price?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_pr_item_id_fkey"
            columns: ["pr_item_id"]
            isOneToOne: false
            referencedRelation: "pr_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "supplier_quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      rds_material_takeoffs: {
        Row: {
          created_at: string
          id: string
          linked_pr_id: string | null
          material_id: string
          project_id: string
          quantity: number
          status: string | null
          wbs_node_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          linked_pr_id?: string | null
          material_id: string
          project_id: string
          quantity: number
          status?: string | null
          wbs_node_id: string
        }
        Update: {
          created_at?: string
          id?: string
          linked_pr_id?: string | null
          material_id?: string
          project_id?: string
          quantity?: number
          status?: string | null
          wbs_node_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rds_material_takeoffs_linked_pr_id_fkey"
            columns: ["linked_pr_id"]
            isOneToOne: false
            referencedRelation: "purchase_requisitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rds_material_takeoffs_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "material_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rds_material_takeoffs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rds_material_takeoffs_wbs_node_id_fkey"
            columns: ["wbs_node_id"]
            isOneToOne: false
            referencedRelation: "wbs_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      report_schedules: {
        Row: {
          created_at: string
          day_of_month: number | null
          day_of_week: number | null
          enabled: boolean
          format: string
          frequency: string
          id: string
          label: string
          last_sent_at: string | null
          project_id: string
          recipients: string[]
          report_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_month?: number | null
          day_of_week?: number | null
          enabled?: boolean
          format: string
          frequency: string
          id?: string
          label: string
          last_sent_at?: string | null
          project_id: string
          recipients?: string[]
          report_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_month?: number | null
          day_of_week?: number | null
          enabled?: boolean
          format?: string
          frequency?: string
          id?: string
          label?: string
          last_sent_at?: string | null
          project_id?: string
          recipients?: string[]
          report_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_schedules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_rates: {
        Row: {
          created_at: string | null
          hourly_rate: number
          id: string
          project_id: string
          resource_name: string
        }
        Insert: {
          created_at?: string | null
          hourly_rate?: number
          id?: string
          project_id: string
          resource_name: string
        }
        Update: {
          created_at?: string | null
          hourly_rate?: number
          id?: string
          project_id?: string
          resource_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_rates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      rfi_attachments: {
        Row: {
          created_at: string
          file_name: string
          id: string
          mime_type: string | null
          rfi_id: string
          size_bytes: number | null
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          id?: string
          mime_type?: string | null
          rfi_id: string
          size_bytes?: number | null
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          id?: string
          mime_type?: string | null
          rfi_id?: string
          size_bytes?: number | null
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rfi_attachments_rfi_id_fkey"
            columns: ["rfi_id"]
            isOneToOne: false
            referencedRelation: "rfis"
            referencedColumns: ["id"]
          },
        ]
      }
      rfi_responses: {
        Row: {
          created_at: string
          id: string
          is_official_answer: boolean | null
          responded_by: string | null
          response: string
          rfi_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_official_answer?: boolean | null
          responded_by?: string | null
          response: string
          rfi_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_official_answer?: boolean | null
          responded_by?: string | null
          response?: string
          rfi_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfi_responses_rfi_id_fkey"
            columns: ["rfi_id"]
            isOneToOne: false
            referencedRelation: "rfis"
            referencedColumns: ["id"]
          },
        ]
      }
      rfis: {
        Row: {
          assigned_to_stakeholder_id: string | null
          closed_at: string | null
          closed_by: string | null
          cost_impact: boolean | null
          created_at: string
          created_by: string | null
          discipline: string
          due_date: string | null
          id: string
          priority: Database["public"]["Enums"]["rfi_priority"]
          project_id: string
          question: string
          rfi_number: string
          schedule_impact: boolean | null
          status: Database["public"]["Enums"]["rfi_status"]
          subject: string
          suggested_solution: string | null
          updated_at: string
          wbs_node_id: string | null
        }
        Insert: {
          assigned_to_stakeholder_id?: string | null
          closed_at?: string | null
          closed_by?: string | null
          cost_impact?: boolean | null
          created_at?: string
          created_by?: string | null
          discipline: string
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["rfi_priority"]
          project_id: string
          question: string
          rfi_number: string
          schedule_impact?: boolean | null
          status?: Database["public"]["Enums"]["rfi_status"]
          subject: string
          suggested_solution?: string | null
          updated_at?: string
          wbs_node_id?: string | null
        }
        Update: {
          assigned_to_stakeholder_id?: string | null
          closed_at?: string | null
          closed_by?: string | null
          cost_impact?: boolean | null
          created_at?: string
          created_by?: string | null
          discipline?: string
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["rfi_priority"]
          project_id?: string
          question?: string
          rfi_number?: string
          schedule_impact?: boolean | null
          status?: Database["public"]["Enums"]["rfi_status"]
          subject?: string
          suggested_solution?: string | null
          updated_at?: string
          wbs_node_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rfis_assigned_to_stakeholder_id_fkey"
            columns: ["assigned_to_stakeholder_id"]
            isOneToOne: false
            referencedRelation: "stakeholders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfis_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfis_wbs_node_id_fkey"
            columns: ["wbs_node_id"]
            isOneToOne: false
            referencedRelation: "wbs_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      rfq: {
        Row: {
          created_at: string
          created_by: string | null
          due_date: string
          id: string
          issue_date: string
          pr_id: string | null
          project_id: string
          rfq_number: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          due_date: string
          id?: string
          issue_date?: string
          pr_id?: string | null
          project_id: string
          rfq_number?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          due_date?: string
          id?: string
          issue_date?: string
          pr_id?: string | null
          project_id?: string
          rfq_number?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfq_pr_id_fkey"
            columns: ["pr_id"]
            isOneToOne: false
            referencedRelation: "purchase_requisitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      rfq_suppliers: {
        Row: {
          created_at: string
          id: string
          invitation_date: string | null
          notes: string | null
          response_status: string
          rfq_id: string
          supplier_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invitation_date?: string | null
          notes?: string | null
          response_status?: string
          rfq_id: string
          supplier_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invitation_date?: string | null
          notes?: string | null
          response_status?: string
          rfq_id?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfq_suppliers_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfq"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_suppliers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          action: string
          created_at: string
          id: string
          is_allowed: boolean | null
          module: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          is_allowed?: boolean | null
          module: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          is_allowed?: boolean | null
          module?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      safety_incidents: {
        Row: {
          created_at: string
          description: string
          id: string
          immediate_action_taken: string | null
          incident_date: string
          incident_number: string
          project_id: string
          reported_by: string | null
          severity: Database["public"]["Enums"]["incident_severity"]
          status: string
          subject: string
          type: Database["public"]["Enums"]["incident_type"]
          updated_at: string
          wbs_node_id: string | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          immediate_action_taken?: string | null
          incident_date?: string
          incident_number: string
          project_id: string
          reported_by?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"]
          status?: string
          subject: string
          type: Database["public"]["Enums"]["incident_type"]
          updated_at?: string
          wbs_node_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          immediate_action_taken?: string | null
          incident_date?: string
          incident_number?: string
          project_id?: string
          reported_by?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"]
          status?: string
          subject?: string
          type?: Database["public"]["Enums"]["incident_type"]
          updated_at?: string
          wbs_node_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "safety_incidents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_incidents_wbs_node_id_fkey"
            columns: ["wbs_node_id"]
            isOneToOne: false
            referencedRelation: "wbs_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_permits: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          description: string | null
          id: string
          permit_number: string
          project_id: string
          requested_by: string | null
          status: Database["public"]["Enums"]["safety_status"]
          subject: string
          type: Database["public"]["Enums"]["permit_type"]
          updated_at: string
          valid_from: string
          valid_until: string
          wbs_node_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          description?: string | null
          id?: string
          permit_number: string
          project_id: string
          requested_by?: string | null
          status?: Database["public"]["Enums"]["safety_status"]
          subject: string
          type?: Database["public"]["Enums"]["permit_type"]
          updated_at?: string
          valid_from: string
          valid_until: string
          wbs_node_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          description?: string | null
          id?: string
          permit_number?: string
          project_id?: string
          requested_by?: string | null
          status?: Database["public"]["Enums"]["safety_status"]
          subject?: string
          type?: Database["public"]["Enums"]["permit_type"]
          updated_at?: string
          valid_from?: string
          valid_until?: string
          wbs_node_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "safety_permits_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_permits_wbs_node_id_fkey"
            columns: ["wbs_node_id"]
            isOneToOne: false
            referencedRelation: "wbs_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_toolbox_talks: {
        Row: {
          attendee_count: number | null
          conducted_at: string
          conducted_by: string | null
          created_at: string
          id: string
          notes: string | null
          project_id: string
          subject: string
          topic: string
          wbs_node_id: string | null
        }
        Insert: {
          attendee_count?: number | null
          conducted_at?: string
          conducted_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          project_id: string
          subject: string
          topic: string
          wbs_node_id?: string | null
        }
        Update: {
          attendee_count?: number | null
          conducted_at?: string
          conducted_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          project_id?: string
          subject?: string
          topic?: string
          wbs_node_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "safety_toolbox_talks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_toolbox_talks_wbs_node_id_fkey"
            columns: ["wbs_node_id"]
            isOneToOne: false
            referencedRelation: "wbs_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_calculation_logs: {
        Row: {
          affected_count: number
          created_at: string
          id: string
          payload: Json
          project_id: string
          trigger_reason: string | null
          triggered_by_task_id: string | null
          triggered_by_user: string | null
        }
        Insert: {
          affected_count?: number
          created_at?: string
          id?: string
          payload?: Json
          project_id: string
          trigger_reason?: string | null
          triggered_by_task_id?: string | null
          triggered_by_user?: string | null
        }
        Update: {
          affected_count?: number
          created_at?: string
          id?: string
          payload?: Json
          project_id?: string
          trigger_reason?: string | null
          triggered_by_task_id?: string | null
          triggered_by_user?: string | null
        }
        Relationships: []
      }
      site_issue_logs: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string
          id: string
          issue_number: string
          project_id: string
          qaqc_ncr_id: string | null
          related_inspection_id: string | null
          related_task_id: string | null
          reported_at: string
          reported_by: string | null
          resolution_notes: string | null
          resolved_at: string | null
          severity: Database["public"]["Enums"]["site_issue_severity"]
          status: Database["public"]["Enums"]["site_issue_status"]
          title: string
          updated_at: string
          wbs_node_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description: string
          id?: string
          issue_number: string
          project_id: string
          qaqc_ncr_id?: string | null
          related_inspection_id?: string | null
          related_task_id?: string | null
          reported_at?: string
          reported_by?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["site_issue_severity"]
          status?: Database["public"]["Enums"]["site_issue_status"]
          title: string
          updated_at?: string
          wbs_node_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string
          id?: string
          issue_number?: string
          project_id?: string
          qaqc_ncr_id?: string | null
          related_inspection_id?: string | null
          related_task_id?: string | null
          reported_at?: string
          reported_by?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["site_issue_severity"]
          status?: Database["public"]["Enums"]["site_issue_status"]
          title?: string
          updated_at?: string
          wbs_node_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_issue_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_issue_logs_related_task_id_fkey"
            columns: ["related_task_id"]
            isOneToOne: false
            referencedRelation: "construction_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_issue_logs_wbs_node_id_fkey"
            columns: ["wbs_node_id"]
            isOneToOne: false
            referencedRelation: "wbs_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      site_photo_logs: {
        Row: {
          construction_task_id: string | null
          created_at: string
          daily_report_id: string | null
          description: string | null
          file_name: string
          file_path: string
          file_size_bytes: number | null
          id: string
          inspection_id: string | null
          mime_type: string | null
          photo_date: string
          pour_id: string | null
          project_id: string
          tags: string[] | null
          uploaded_by: string | null
          wbs_node_id: string | null
        }
        Insert: {
          construction_task_id?: string | null
          created_at?: string
          daily_report_id?: string | null
          description?: string | null
          file_name: string
          file_path: string
          file_size_bytes?: number | null
          id?: string
          inspection_id?: string | null
          mime_type?: string | null
          photo_date?: string
          pour_id?: string | null
          project_id: string
          tags?: string[] | null
          uploaded_by?: string | null
          wbs_node_id?: string | null
        }
        Update: {
          construction_task_id?: string | null
          created_at?: string
          daily_report_id?: string | null
          description?: string | null
          file_name?: string
          file_path?: string
          file_size_bytes?: number | null
          id?: string
          inspection_id?: string | null
          mime_type?: string | null
          photo_date?: string
          pour_id?: string | null
          project_id?: string
          tags?: string[] | null
          uploaded_by?: string | null
          wbs_node_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_photo_logs_construction_task_id_fkey"
            columns: ["construction_task_id"]
            isOneToOne: false
            referencedRelation: "construction_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_photo_logs_daily_report_id_fkey"
            columns: ["daily_report_id"]
            isOneToOne: false
            referencedRelation: "daily_site_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_photo_logs_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "work_inspection_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_photo_logs_pour_id_fkey"
            columns: ["pour_id"]
            isOneToOne: false
            referencedRelation: "concrete_pour_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_photo_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_photo_logs_wbs_node_id_fkey"
            columns: ["wbs_node_id"]
            isOneToOne: false
            referencedRelation: "wbs_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      stakeholder_contacts: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_primary: boolean
          job_title: string | null
          phone: string | null
          stakeholder_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_primary?: boolean
          job_title?: string | null
          phone?: string | null
          stakeholder_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_primary?: boolean
          job_title?: string | null
          phone?: string | null
          stakeholder_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stakeholder_contacts_stakeholder_id_fkey"
            columns: ["stakeholder_id"]
            isOneToOne: false
            referencedRelation: "stakeholders"
            referencedColumns: ["id"]
          },
        ]
      }
      stakeholders: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          notes: string | null
          organization_name: string
          phone: string | null
          status: string
          type: Database["public"]["Enums"]["stakeholder_type"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          notes?: string | null
          organization_name: string
          phone?: string | null
          status?: string
          type: Database["public"]["Enums"]["stakeholder_type"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          notes?: string | null
          organization_name?: string
          phone?: string | null
          status?: string
          type?: Database["public"]["Enums"]["stakeholder_type"]
          updated_at?: string
        }
        Relationships: []
      }
      stock_balances: {
        Row: {
          avg_unit_cost: number
          id: string
          last_updated: string
          material_name: string
          project_id: string
          qty_on_hand: number
          uom: string
        }
        Insert: {
          avg_unit_cost?: number
          id?: string
          last_updated?: string
          material_name: string
          project_id: string
          qty_on_hand?: number
          uom: string
        }
        Update: {
          avg_unit_cost?: number
          id?: string
          last_updated?: string
          material_name?: string
          project_id?: string
          qty_on_hand?: number
          uom?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_balances_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      structural_calculation_notes: {
        Row: {
          author: string | null
          created_at: string | null
          file_url: string | null
          id: string
          project_id: string | null
          reference_number: string
          revision: string | null
          status: string | null
          title: string
          updated_at: string | null
          wbs_node_id: string | null
        }
        Insert: {
          author?: string | null
          created_at?: string | null
          file_url?: string | null
          id?: string
          project_id?: string | null
          reference_number: string
          revision?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          wbs_node_id?: string | null
        }
        Update: {
          author?: string | null
          created_at?: string | null
          file_url?: string | null
          id?: string
          project_id?: string | null
          reference_number?: string
          revision?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          wbs_node_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "structural_calculation_notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "structural_calculation_notes_wbs_node_id_fkey"
            columns: ["wbs_node_id"]
            isOneToOne: false
            referencedRelation: "wbs_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      structural_design_criteria: {
        Row: {
          created_at: string | null
          id: string
          parameter_name: string
          parameter_value: string
          project_id: string | null
          source: string | null
          unit: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          parameter_name: string
          parameter_value: string
          project_id?: string | null
          source?: string | null
          unit?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          parameter_name?: string
          parameter_value?: string
          project_id?: string | null
          source?: string | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "structural_design_criteria_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      structural_drawings: {
        Row: {
          created_at: string
          drawing_number: string
          file_url: string | null
          id: string
          project_id: string
          revision: string
          status: string
          title: string
          updated_at: string
          wbs_node_id: string | null
        }
        Insert: {
          created_at?: string
          drawing_number: string
          file_url?: string | null
          id?: string
          project_id: string
          revision?: string
          status?: string
          title: string
          updated_at?: string
          wbs_node_id?: string | null
        }
        Update: {
          created_at?: string
          drawing_number?: string
          file_url?: string | null
          id?: string
          project_id?: string
          revision?: string
          status?: string
          title?: string
          updated_at?: string
          wbs_node_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "structural_drawings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "structural_drawings_wbs_node_id_fkey"
            columns: ["wbs_node_id"]
            isOneToOne: false
            referencedRelation: "wbs_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      structural_inspections: {
        Row: {
          comments: string | null
          created_at: string
          id: string
          inspected_at: string | null
          inspected_by: string | null
          photo_urls: string[] | null
          project_id: string
          result: string
          subject: string
          type: Database["public"]["Enums"]["inspection_type"]
          updated_at: string
          wbs_node_id: string
        }
        Insert: {
          comments?: string | null
          created_at?: string
          id?: string
          inspected_at?: string | null
          inspected_by?: string | null
          photo_urls?: string[] | null
          project_id: string
          result?: string
          subject: string
          type: Database["public"]["Enums"]["inspection_type"]
          updated_at?: string
          wbs_node_id: string
        }
        Update: {
          comments?: string | null
          created_at?: string
          id?: string
          inspected_at?: string | null
          inspected_by?: string | null
          photo_urls?: string[] | null
          project_id?: string
          result?: string
          subject?: string
          type?: Database["public"]["Enums"]["inspection_type"]
          updated_at?: string
          wbs_node_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "structural_inspections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "structural_inspections_wbs_node_id_fkey"
            columns: ["wbs_node_id"]
            isOneToOne: false
            referencedRelation: "wbs_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      structural_load_summaries: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          load_case: string
          magnitude_kn_m2: number | null
          project_id: string | null
          wbs_node_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          load_case: string
          magnitude_kn_m2?: number | null
          project_id?: string | null
          wbs_node_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          load_case?: string
          magnitude_kn_m2?: number | null
          project_id?: string | null
          wbs_node_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "structural_load_summaries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "structural_load_summaries_wbs_node_id_fkey"
            columns: ["wbs_node_id"]
            isOneToOne: false
            referencedRelation: "wbs_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      structural_model_register: {
        Row: {
          created_at: string | null
          file_url: string | null
          id: string
          last_run_date: string | null
          model_name: string
          project_id: string | null
          software: string
          status: string | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          created_at?: string | null
          file_url?: string | null
          id?: string
          last_run_date?: string | null
          model_name: string
          project_id?: string | null
          software: string
          status?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          created_at?: string | null
          file_url?: string | null
          id?: string
          last_run_date?: string | null
          model_name?: string
          project_id?: string | null
          software?: string
          status?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "structural_model_register_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      structural_rebar_reviews: {
        Row: {
          created_at: string | null
          drawing_reference: string | null
          id: string
          project_id: string | null
          status: string | null
          submittal_number: string
          wbs_node_id: string | null
        }
        Insert: {
          created_at?: string | null
          drawing_reference?: string | null
          id?: string
          project_id?: string | null
          status?: string | null
          submittal_number: string
          wbs_node_id?: string | null
        }
        Update: {
          created_at?: string | null
          drawing_reference?: string | null
          id?: string
          project_id?: string | null
          status?: string | null
          submittal_number?: string
          wbs_node_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "structural_rebar_reviews_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "structural_rebar_reviews_wbs_node_id_fkey"
            columns: ["wbs_node_id"]
            isOneToOne: false
            referencedRelation: "wbs_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      structural_rebar_schedules: {
        Row: {
          bar_mark: string
          created_at: string
          diameter_mm: number
          drawing_id: string | null
          id: string
          member_mark: string
          project_id: string
          quantity: number
          shape_code: string
          total_length_mm: number
          total_weight_kg: number | null
          wbs_node_id: string
        }
        Insert: {
          bar_mark: string
          created_at?: string
          diameter_mm: number
          drawing_id?: string | null
          id?: string
          member_mark: string
          project_id: string
          quantity?: number
          shape_code: string
          total_length_mm: number
          total_weight_kg?: number | null
          wbs_node_id: string
        }
        Update: {
          bar_mark?: string
          created_at?: string
          diameter_mm?: number
          drawing_id?: string | null
          id?: string
          member_mark?: string
          project_id?: string
          quantity?: number
          shape_code?: string
          total_length_mm?: number
          total_weight_kg?: number | null
          wbs_node_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "structural_rebar_schedules_drawing_id_fkey"
            columns: ["drawing_id"]
            isOneToOne: false
            referencedRelation: "structural_drawings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "structural_rebar_schedules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "structural_rebar_schedules_wbs_node_id_fkey"
            columns: ["wbs_node_id"]
            isOneToOne: false
            referencedRelation: "wbs_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      structural_technical_queries: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          project_id: string | null
          query_number: string
          response: string | null
          status: string | null
          subject: string
          updated_at: string | null
          wbs_node_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          project_id?: string | null
          query_number: string
          response?: string | null
          status?: string | null
          subject: string
          updated_at?: string | null
          wbs_node_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          project_id?: string | null
          query_number?: string
          response?: string | null
          status?: string | null
          subject?: string
          updated_at?: string | null
          wbs_node_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "structural_technical_queries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "structural_technical_queries_wbs_node_id_fkey"
            columns: ["wbs_node_id"]
            isOneToOne: false
            referencedRelation: "wbs_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontract_claims: {
        Row: {
          certified_amount: number | null
          certified_at: string | null
          certified_by: string | null
          claim_number: string
          claimed_amount: number
          contract_id: string
          created_at: string
          id: string
          net_payable: number | null
          notes: string | null
          period_end: string
          period_start: string
          retention_deducted: number | null
          status: Database["public"]["Enums"]["subcontract_claim_status"]
          updated_at: string
        }
        Insert: {
          certified_amount?: number | null
          certified_at?: string | null
          certified_by?: string | null
          claim_number: string
          claimed_amount?: number
          contract_id: string
          created_at?: string
          id?: string
          net_payable?: number | null
          notes?: string | null
          period_end: string
          period_start: string
          retention_deducted?: number | null
          status?: Database["public"]["Enums"]["subcontract_claim_status"]
          updated_at?: string
        }
        Update: {
          certified_amount?: number | null
          certified_at?: string | null
          certified_by?: string | null
          claim_number?: string
          claimed_amount?: number
          contract_id?: string
          created_at?: string
          id?: string
          net_payable?: number | null
          notes?: string | null
          period_end?: string
          period_start?: string
          retention_deducted?: number | null
          status?: Database["public"]["Enums"]["subcontract_claim_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcontract_claims_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "subcontract_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontract_contracts: {
        Row: {
          contract_number: string
          created_at: string
          end_date: string | null
          id: string
          project_id: string
          retention_percentage: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["contract_status"]
          subcontractor_id: string
          subject: string
          total_value: number
          updated_at: string
        }
        Insert: {
          contract_number: string
          created_at?: string
          end_date?: string | null
          id?: string
          project_id: string
          retention_percentage?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          subcontractor_id: string
          subject: string
          total_value?: number
          updated_at?: string
        }
        Update: {
          contract_number?: string
          created_at?: string
          end_date?: string | null
          id?: string
          project_id?: string
          retention_percentage?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          subcontractor_id?: string
          subject?: string
          total_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcontract_contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcontract_contracts_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontract_items: {
        Row: {
          agreed_value: number
          contract_id: string
          created_at: string
          description: string | null
          id: string
          wbs_node_id: string
        }
        Insert: {
          agreed_value?: number
          contract_id: string
          created_at?: string
          description?: string | null
          id?: string
          wbs_node_id: string
        }
        Update: {
          agreed_value?: number
          contract_id?: string
          created_at?: string
          description?: string | null
          id?: string
          wbs_node_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcontract_items_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "subcontract_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcontract_items_wbs_node_id_fkey"
            columns: ["wbs_node_id"]
            isOneToOne: false
            referencedRelation: "wbs_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontractors: {
        Row: {
          address: string | null
          company_name: string
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          phone: string | null
          rating: number | null
          specialization: string
          tax_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          company_name: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          phone?: string | null
          rating?: number | null
          specialization: string
          tax_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          company_name?: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          phone?: string | null
          rating?: number | null
          specialization?: string
          tax_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      supplier_invoices: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          attachment_url: string | null
          created_at: string
          due_date: string | null
          grn_match_status: string | null
          id: string
          invoice_date: string
          invoice_number: string
          notes: string | null
          paid_amount: number | null
          payment_status: string | null
          po_id: string
          po_match_status: string | null
          project_id: string
          status: Database["public"]["Enums"]["invoice_status"]
          submitted_by: string | null
          supplier_id: string | null
          tax_amount: number | null
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          attachment_url?: string | null
          created_at?: string
          due_date?: string | null
          grn_match_status?: string | null
          id?: string
          invoice_date: string
          invoice_number: string
          notes?: string | null
          paid_amount?: number | null
          payment_status?: string | null
          po_id: string
          po_match_status?: string | null
          project_id: string
          status?: Database["public"]["Enums"]["invoice_status"]
          submitted_by?: string | null
          supplier_id?: string | null
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          attachment_url?: string | null
          created_at?: string
          due_date?: string | null
          grn_match_status?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          notes?: string | null
          paid_amount?: number | null
          payment_status?: string | null
          po_id?: string
          po_match_status?: string | null
          project_id?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          submitted_by?: string | null
          supplier_id?: string | null
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_invoices_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_invoices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_quotations: {
        Row: {
          attachment_url: string | null
          created_at: string
          id: string
          notes: string | null
          quotation_date: string
          quotation_number: string | null
          rfq_id: string
          status: string
          supplier_id: string
          total_amount: number
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          quotation_date: string
          quotation_number?: string | null
          rfq_id: string
          status?: string
          supplier_id: string
          total_amount?: number
        }
        Update: {
          attachment_url?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          quotation_date?: string
          quotation_number?: string | null
          rfq_id?: string
          status?: string
          supplier_id?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "supplier_quotations_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfq"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_quotations_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      task_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          reason: string | null
          task_id: string
          unassigned_at: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          reason?: string | null
          task_id: string
          unassigned_at?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          reason?: string | null
          task_id?: string
          unassigned_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_cost_summaries"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "task_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_attachments: {
        Row: {
          created_at: string
          file_name: string
          id: string
          mime_type: string | null
          size_bytes: number | null
          storage_path: string
          task_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path: string
          task_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path?: string
          task_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_cost_summaries"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_constraints: {
        Row: {
          calendar_id: string | null
          constraint_date: string | null
          constraint_type: Database["public"]["Enums"]["schedule_constraint_type"]
          deadline_date: string | null
          task_id: string
          updated_at: string
        }
        Insert: {
          calendar_id?: string | null
          constraint_date?: string | null
          constraint_type?: Database["public"]["Enums"]["schedule_constraint_type"]
          deadline_date?: string | null
          task_id: string
          updated_at?: string
        }
        Update: {
          calendar_id?: string | null
          constraint_date?: string | null
          constraint_type?: Database["public"]["Enums"]["schedule_constraint_type"]
          deadline_date?: string | null
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_constraints_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "calendars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_constraints_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: true
            referencedRelation: "project_cost_summaries"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "task_constraints_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: true
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_predecessors: {
        Row: {
          id: string
          is_hard_block: boolean
          lag_days: number
          note: string | null
          predecessor_id: string
          relation_type: Database["public"]["Enums"]["dep_relation_type"]
          task_id: string
        }
        Insert: {
          id?: string
          is_hard_block?: boolean
          lag_days?: number
          note?: string | null
          predecessor_id: string
          relation_type?: Database["public"]["Enums"]["dep_relation_type"]
          task_id: string
        }
        Update: {
          id?: string
          is_hard_block?: boolean
          lag_days?: number
          note?: string | null
          predecessor_id?: string
          relation_type?: Database["public"]["Enums"]["dep_relation_type"]
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_predecessors_predecessor_id_fkey"
            columns: ["predecessor_id"]
            isOneToOne: false
            referencedRelation: "project_cost_summaries"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "task_predecessors_predecessor_id_fkey"
            columns: ["predecessor_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_predecessors_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_cost_summaries"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "task_predecessors_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_resources: {
        Row: {
          actual_man_hours: number
          created_at: string
          id: string
          labor_role_id: string
          notes: string | null
          planned_count: number
          planned_man_hours: number
          task_id: string
          updated_at: string
        }
        Insert: {
          actual_man_hours?: number
          created_at?: string
          id?: string
          labor_role_id: string
          notes?: string | null
          planned_count?: number
          planned_man_hours?: number
          task_id: string
          updated_at?: string
        }
        Update: {
          actual_man_hours?: number
          created_at?: string
          id?: string
          labor_role_id?: string
          notes?: string | null
          planned_count?: number
          planned_man_hours?: number
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_resources_labor_role_id_fkey"
            columns: ["labor_role_id"]
            isOneToOne: false
            referencedRelation: "labor_catalogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_resources_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_cost_summaries"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "task_resources_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_schedule_calc: {
        Row: {
          calculated_at: string
          early_finish: string | null
          early_start: string | null
          free_float: number | null
          is_critical: boolean
          late_finish: string | null
          late_start: string | null
          project_id: string
          task_id: string
          total_float: number | null
        }
        Insert: {
          calculated_at?: string
          early_finish?: string | null
          early_start?: string | null
          free_float?: number | null
          is_critical?: boolean
          late_finish?: string | null
          late_start?: string | null
          project_id: string
          task_id: string
          total_float?: number | null
        }
        Update: {
          calculated_at?: string
          early_finish?: string | null
          early_start?: string | null
          free_float?: number | null
          is_critical?: boolean
          late_finish?: string | null
          late_start?: string | null
          project_id?: string
          task_id?: string
          total_float?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "task_schedule_calc_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_schedule_calc_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: true
            referencedRelation: "project_cost_summaries"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "task_schedule_calc_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: true
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["task_status"] | null
          id: string
          reason: string | null
          task_id: string
          to_status: Database["public"]["Enums"]["task_status"]
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["task_status"] | null
          id?: string
          reason?: string | null
          task_id: string
          to_status: Database["public"]["Enums"]["task_status"]
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["task_status"] | null
          id?: string
          reason?: string | null
          task_id?: string
          to_status?: Database["public"]["Enums"]["task_status"]
        }
        Relationships: [
          {
            foreignKeyName: "task_status_history_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_cost_summaries"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "task_status_history_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_updates: {
        Row: {
          created_at: string
          hours_worked: number | null
          id: string
          is_blocker: boolean
          note: string | null
          progress_pct: number | null
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hours_worked?: number | null
          id?: string
          is_blocker?: boolean
          note?: string | null
          progress_pct?: number | null
          task_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          hours_worked?: number | null
          id?: string
          is_blocker?: boolean
          note?: string | null
          progress_pct?: number | null
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_updates_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_cost_summaries"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "task_updates_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_end: string | null
          actual_hours: number | null
          actual_start: string | null
          approved_at: string | null
          approved_by: string | null
          baseline_end: string | null
          baseline_start: string | null
          category: Database["public"]["Enums"]["task_category"] | null
          code: string | null
          constraint_date: string | null
          constraint_type:
            | Database["public"]["Enums"]["schedule_constraint_type"]
            | null
          created_at: string
          created_by: string | null
          deadline_date: string | null
          department: Database["public"]["Enums"]["department"] | null
          dept_status: Database["public"]["Enums"]["dept_status"] | null
          description: string | null
          discipline_meta: Json
          estimated_hours: number | null
          id: string
          location_zone: string | null
          planned_end: string | null
          planned_start: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          progress_pct: number
          project_id: string
          rejection_reason: string | null
          status: Database["public"]["Enums"]["task_status"]
          task_type: Database["public"]["Enums"]["task_type"]
          title: string
          updated_at: string
          wbs_node_id: string | null
          workflow_type:
            | Database["public"]["Enums"]["task_workflow_type"]
            | null
        }
        Insert: {
          actual_end?: string | null
          actual_hours?: number | null
          actual_start?: string | null
          approved_at?: string | null
          approved_by?: string | null
          baseline_end?: string | null
          baseline_start?: string | null
          category?: Database["public"]["Enums"]["task_category"] | null
          code?: string | null
          constraint_date?: string | null
          constraint_type?:
            | Database["public"]["Enums"]["schedule_constraint_type"]
            | null
          created_at?: string
          created_by?: string | null
          deadline_date?: string | null
          department?: Database["public"]["Enums"]["department"] | null
          dept_status?: Database["public"]["Enums"]["dept_status"] | null
          description?: string | null
          discipline_meta?: Json
          estimated_hours?: number | null
          id?: string
          location_zone?: string | null
          planned_end?: string | null
          planned_start?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          progress_pct?: number
          project_id: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          task_type?: Database["public"]["Enums"]["task_type"]
          title: string
          updated_at?: string
          wbs_node_id?: string | null
          workflow_type?:
            | Database["public"]["Enums"]["task_workflow_type"]
            | null
        }
        Update: {
          actual_end?: string | null
          actual_hours?: number | null
          actual_start?: string | null
          approved_at?: string | null
          approved_by?: string | null
          baseline_end?: string | null
          baseline_start?: string | null
          category?: Database["public"]["Enums"]["task_category"] | null
          code?: string | null
          constraint_date?: string | null
          constraint_type?:
            | Database["public"]["Enums"]["schedule_constraint_type"]
            | null
          created_at?: string
          created_by?: string | null
          deadline_date?: string | null
          department?: Database["public"]["Enums"]["department"] | null
          dept_status?: Database["public"]["Enums"]["dept_status"] | null
          description?: string | null
          discipline_meta?: Json
          estimated_hours?: number | null
          id?: string
          location_zone?: string | null
          planned_end?: string | null
          planned_start?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          progress_pct?: number
          project_id?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          task_type?: Database["public"]["Enums"]["task_type"]
          title?: string
          updated_at?: string
          wbs_node_id?: string | null
          workflow_type?:
            | Database["public"]["Enums"]["task_workflow_type"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_wbs_node_id_fkey"
            columns: ["wbs_node_id"]
            isOneToOne: false
            referencedRelation: "wbs_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_conversation_state: {
        Row: {
          card_message_id: number | null
          chat_id: number
          expires_at: string
          progress_pct: number | null
          status: string | null
          step: string
          task_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          card_message_id?: number | null
          chat_id: number
          expires_at?: string
          progress_pct?: number | null
          status?: string | null
          step: string
          task_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          card_message_id?: number | null
          chat_id?: number
          expires_at?: string
          progress_pct?: number | null
          status?: string | null
          step?: string
          task_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      telegram_link_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      telegram_outbox: {
        Row: {
          chat_id: number | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          error: string | null
          message_id: number | null
          message_text: string | null
          notification_id: string
          sent_at: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          chat_id?: number | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          error?: string | null
          message_id?: number | null
          message_text?: string | null
          notification_id: string
          sent_at?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          chat_id?: number | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          error?: string | null
          message_id?: number | null
          message_text?: string | null
          notification_id?: string
          sent_at?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      timesheet_entries: {
        Row: {
          afternoon_end: string | null
          afternoon_non_work: boolean | null
          afternoon_start: string | null
          afternoon_task_id: string | null
          attachments: Json | null
          break_end: string | null
          break_non_work: boolean | null
          break_start: string | null
          break_task_id: string | null
          created_at: string
          end_time: string | null
          flags: Json
          id: string
          is_public_holiday: boolean | null
          is_sunday: boolean | null
          morning_end: string | null
          morning_non_work: boolean | null
          morning_start: string | null
          morning_task_id: string | null
          notes: string | null
          ot_end: string | null
          ot_non_work: boolean | null
          ot_start: string | null
          ot_task_id: string | null
          overtime_hours: number
          project_id: string
          regular_hours: number
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["timesheet_status"]
          submitted_at: string | null
          task_id: string | null
          ticked_task_ids: string[] | null
          updated_at: string
          user_id: string
          work_date: string
        }
        Insert: {
          afternoon_end?: string | null
          afternoon_non_work?: boolean | null
          afternoon_start?: string | null
          afternoon_task_id?: string | null
          attachments?: Json | null
          break_end?: string | null
          break_non_work?: boolean | null
          break_start?: string | null
          break_task_id?: string | null
          created_at?: string
          end_time?: string | null
          flags?: Json
          id?: string
          is_public_holiday?: boolean | null
          is_sunday?: boolean | null
          morning_end?: string | null
          morning_non_work?: boolean | null
          morning_start?: string | null
          morning_task_id?: string | null
          notes?: string | null
          ot_end?: string | null
          ot_non_work?: boolean | null
          ot_start?: string | null
          ot_task_id?: string | null
          overtime_hours?: number
          project_id: string
          regular_hours?: number
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["timesheet_status"]
          submitted_at?: string | null
          task_id?: string | null
          ticked_task_ids?: string[] | null
          updated_at?: string
          user_id: string
          work_date: string
        }
        Update: {
          afternoon_end?: string | null
          afternoon_non_work?: boolean | null
          afternoon_start?: string | null
          afternoon_task_id?: string | null
          attachments?: Json | null
          break_end?: string | null
          break_non_work?: boolean | null
          break_start?: string | null
          break_task_id?: string | null
          created_at?: string
          end_time?: string | null
          flags?: Json
          id?: string
          is_public_holiday?: boolean | null
          is_sunday?: boolean | null
          morning_end?: string | null
          morning_non_work?: boolean | null
          morning_start?: string | null
          morning_task_id?: string | null
          notes?: string | null
          ot_end?: string | null
          ot_non_work?: boolean | null
          ot_start?: string | null
          ot_task_id?: string | null
          overtime_hours?: number
          project_id?: string
          regular_hours?: number
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["timesheet_status"]
          submitted_at?: string | null
          task_id?: string | null
          ticked_task_ids?: string[] | null
          updated_at?: string
          user_id?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "timesheet_entries_afternoon_task_id_fkey"
            columns: ["afternoon_task_id"]
            isOneToOne: false
            referencedRelation: "project_cost_summaries"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "timesheet_entries_afternoon_task_id_fkey"
            columns: ["afternoon_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheet_entries_break_task_id_fkey"
            columns: ["break_task_id"]
            isOneToOne: false
            referencedRelation: "project_cost_summaries"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "timesheet_entries_break_task_id_fkey"
            columns: ["break_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheet_entries_morning_task_id_fkey"
            columns: ["morning_task_id"]
            isOneToOne: false
            referencedRelation: "project_cost_summaries"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "timesheet_entries_morning_task_id_fkey"
            columns: ["morning_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheet_entries_ot_task_id_fkey"
            columns: ["ot_task_id"]
            isOneToOne: false
            referencedRelation: "project_cost_summaries"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "timesheet_entries_ot_task_id_fkey"
            columns: ["ot_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheet_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheet_entries_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_cost_summaries"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "timesheet_entries_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      transmittal_items: {
        Row: {
          document_id: string
          id: string
          purpose: string | null
          transmittal_id: string
          version_id: string
        }
        Insert: {
          document_id: string
          id?: string
          purpose?: string | null
          transmittal_id: string
          version_id: string
        }
        Update: {
          document_id?: string
          id?: string
          purpose?: string | null
          transmittal_id?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transmittal_items_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transmittal_items_transmittal_id_fkey"
            columns: ["transmittal_id"]
            isOneToOne: false
            referencedRelation: "transmittals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transmittal_items_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      transmittals: {
        Row: {
          created_at: string
          due_at: string | null
          id: string
          metadata: Json
          notes: string | null
          project_id: string
          recipient_id: string
          sender_id: string
          sent_at: string
          status: string
          subject: string
          transmittal_number: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          due_at?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          project_id: string
          recipient_id: string
          sender_id: string
          sent_at?: string
          status?: string
          subject: string
          transmittal_number: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          due_at?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          project_id?: string
          recipient_id?: string
          sender_id?: string
          sent_at?: string
          status?: string
          subject?: string
          transmittal_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transmittals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transmittals_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "stakeholders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      warranty_register: {
        Row: {
          certificate_url: string | null
          created_at: string | null
          duration_months: number | null
          end_date: string | null
          id: string
          item_name: string
          project_id: string | null
          provider_id: string | null
          remarks: string | null
          start_date: string | null
          status: string | null
        }
        Insert: {
          certificate_url?: string | null
          created_at?: string | null
          duration_months?: number | null
          end_date?: string | null
          id?: string
          item_name: string
          project_id?: string | null
          provider_id?: string | null
          remarks?: string | null
          start_date?: string | null
          status?: string | null
        }
        Update: {
          certificate_url?: string | null
          created_at?: string | null
          duration_months?: number | null
          end_date?: string | null
          id?: string
          item_name?: string
          project_id?: string | null
          provider_id?: string | null
          remarks?: string | null
          start_date?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warranty_register_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranty_register_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "stakeholders"
            referencedColumns: ["id"]
          },
        ]
      }
      wbs_assignments: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          permission: Database["public"]["Enums"]["wbs_permission"]
          user_id: string
          wbs_node_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          permission: Database["public"]["Enums"]["wbs_permission"]
          user_id: string
          wbs_node_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          permission?: Database["public"]["Enums"]["wbs_permission"]
          user_id?: string
          wbs_node_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wbs_assignments_wbs_node_id_fkey"
            columns: ["wbs_node_id"]
            isOneToOne: false
            referencedRelation: "wbs_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      wbs_baseline_tasks: {
        Row: {
          baseline_id: string
          estimated_hours: number | null
          id: string
          planned_end: string | null
          planned_start: string | null
          progress_pct: number | null
          task_id: string
        }
        Insert: {
          baseline_id: string
          estimated_hours?: number | null
          id?: string
          planned_end?: string | null
          planned_start?: string | null
          progress_pct?: number | null
          task_id: string
        }
        Update: {
          baseline_id?: string
          estimated_hours?: number | null
          id?: string
          planned_end?: string | null
          planned_start?: string | null
          progress_pct?: number | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wbs_baseline_tasks_baseline_id_fkey"
            columns: ["baseline_id"]
            isOneToOne: false
            referencedRelation: "wbs_baselines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wbs_baseline_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_cost_summaries"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "wbs_baseline_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      wbs_baselines: {
        Row: {
          captured_at: string
          captured_by: string | null
          id: string
          is_active: boolean
          label: string
          notes: string | null
          project_id: string
        }
        Insert: {
          captured_at?: string
          captured_by?: string | null
          id?: string
          is_active?: boolean
          label: string
          notes?: string | null
          project_id: string
        }
        Update: {
          captured_at?: string
          captured_by?: string | null
          id?: string
          is_active?: boolean
          label?: string
          notes?: string | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wbs_baselines_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      wbs_node_types: {
        Row: {
          code: string
          created_at: string
          icon: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      wbs_nodes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          depth: number
          description: string | null
          id: string
          name: string
          node_type: Database["public"]["Enums"]["wbs_node_type"]
          parent_id: string | null
          path: string[]
          path_text: string
          progress_pct: number | null
          project_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          depth?: number
          description?: string | null
          id?: string
          name: string
          node_type?: Database["public"]["Enums"]["wbs_node_type"]
          parent_id?: string | null
          path?: string[]
          path_text?: string
          progress_pct?: number | null
          project_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          depth?: number
          description?: string | null
          id?: string
          name?: string
          node_type?: Database["public"]["Enums"]["wbs_node_type"]
          parent_id?: string | null
          path?: string[]
          path_text?: string
          progress_pct?: number | null
          project_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wbs_nodes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "wbs_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wbs_nodes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      wbs_saved_views: {
        Row: {
          columns: Json
          created_at: string
          filters: Json
          id: string
          is_shared: boolean
          name: string
          project_id: string
          updated_at: string
          user_id: string
          zoom: string | null
        }
        Insert: {
          columns?: Json
          created_at?: string
          filters?: Json
          id?: string
          is_shared?: boolean
          name: string
          project_id: string
          updated_at?: string
          user_id: string
          zoom?: string | null
        }
        Update: {
          columns?: Json
          created_at?: string
          filters?: Json
          id?: string
          is_shared?: boolean
          name?: string
          project_id?: string
          updated_at?: string
          user_id?: string
          zoom?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wbs_saved_views_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      work_inspection_requests: {
        Row: {
          construction_task_id: string | null
          created_at: string
          description: string | null
          id: string
          inspected_at: string | null
          inspection_notes: string | null
          inspection_number: string
          inspector_id: string | null
          project_id: string
          qaqc_itp_id: string | null
          qaqc_ncr_id: string | null
          requested_at: string
          requested_by: string | null
          result: Database["public"]["Enums"]["inspection_result"] | null
          scheduled_date: string | null
          status: string
          title: string
          updated_at: string
          wbs_node_id: string | null
        }
        Insert: {
          construction_task_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          inspected_at?: string | null
          inspection_notes?: string | null
          inspection_number: string
          inspector_id?: string | null
          project_id: string
          qaqc_itp_id?: string | null
          qaqc_ncr_id?: string | null
          requested_at?: string
          requested_by?: string | null
          result?: Database["public"]["Enums"]["inspection_result"] | null
          scheduled_date?: string | null
          status?: string
          title: string
          updated_at?: string
          wbs_node_id?: string | null
        }
        Update: {
          construction_task_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          inspected_at?: string | null
          inspection_notes?: string | null
          inspection_number?: string
          inspector_id?: string | null
          project_id?: string
          qaqc_itp_id?: string | null
          qaqc_ncr_id?: string | null
          requested_at?: string
          requested_by?: string | null
          result?: Database["public"]["Enums"]["inspection_result"] | null
          scheduled_date?: string | null
          status?: string
          title?: string
          updated_at?: string
          wbs_node_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_inspection_requests_construction_task_id_fkey"
            columns: ["construction_task_id"]
            isOneToOne: false
            referencedRelation: "construction_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_inspection_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_inspection_requests_wbs_node_id_fkey"
            columns: ["wbs_node_id"]
            isOneToOne: false
            referencedRelation: "wbs_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      project_cost_summaries: {
        Row: {
          ac_labor: number | null
          ac_materials: number | null
          ac_total: number | null
          bac: number | null
          cpi: number | null
          ev: number | null
          project_id: string | null
          task_id: string | null
          task_title: string | null
          wbs_node_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_wbs_node_id_fkey"
            columns: ["wbs_node_id"]
            isOneToOne: false
            referencedRelation: "wbs_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_working_days: {
        Args: { _calendar_id: string; _days: number; _start: string }
        Returns: string
      }
      capture_baseline: {
        Args: { _label: string; _notes?: string; _project_id: string }
        Returns: string
      }
      check_budget_available: {
        Args: {
          p_budget_code: string
          p_project_id: string
          p_requested_amount: number
        }
        Returns: {
          available_amount: number
          budget_total: number
          committed_total: number
          is_available: boolean
          spent_total: number
        }[]
      }
      check_permission: {
        Args: { v_action: string; v_module: string; v_user_id: string }
        Returns: boolean
      }
      compute_payroll_lines: {
        Args: { _period_id: string }
        Returns: undefined
      }
      cpm_recalc: { Args: { _project_id: string }; Returns: undefined }
      create_notification: {
        Args: {
          _actor_id?: string
          _body: string
          _entity_id: string
          _entity_type: string
          _metadata?: Json
          _priority?: Database["public"]["Enums"]["notification_priority"]
          _project_id: string
          _title: string
          _type: Database["public"]["Enums"]["notification_type"]
          _user_id: string
        }
        Returns: undefined
      }
      generate_document_number: {
        Args: {
          _discipline_code: string
          _project_id: string
          _sequence: number
          _type_code: string
          _wbs_code: string
        }
        Returns: string
      }
      get_module_approvers: {
        Args: { _project_id: string; _roles: string[] }
        Returns: string[]
      }
      get_project_planners: { Args: { _project_id: string }; Returns: string[] }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_dept_member: {
        Args: {
          _dept: Database["public"]["Enums"]["department"]
          _min_role?: Database["public"]["Enums"]["dept_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_dsr_approver: { Args: { _uid: string }; Returns: boolean }
      is_dsr_editor: { Args: { _uid: string }; Returns: boolean }
      is_working_day: {
        Args: { _calendar_id: string; _d: string }
        Returns: boolean
      }
      post_task_progress_update: {
        Args: {
          _hours_worked: number
          _is_blocker: boolean
          _note: string
          _progress_pct: number
          _task_id: string
        }
        Returns: {
          actual_end: string | null
          actual_hours: number | null
          actual_start: string | null
          approved_at: string | null
          approved_by: string | null
          baseline_end: string | null
          baseline_start: string | null
          category: Database["public"]["Enums"]["task_category"] | null
          code: string | null
          constraint_date: string | null
          constraint_type:
            | Database["public"]["Enums"]["schedule_constraint_type"]
            | null
          created_at: string
          created_by: string | null
          deadline_date: string | null
          department: Database["public"]["Enums"]["department"] | null
          dept_status: Database["public"]["Enums"]["dept_status"] | null
          description: string | null
          discipline_meta: Json
          estimated_hours: number | null
          id: string
          location_zone: string | null
          planned_end: string | null
          planned_start: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          progress_pct: number
          project_id: string
          rejection_reason: string | null
          status: Database["public"]["Enums"]["task_status"]
          task_type: Database["public"]["Enums"]["task_type"]
          title: string
          updated_at: string
          wbs_node_id: string | null
          workflow_type:
            | Database["public"]["Enums"]["task_workflow_type"]
            | null
        }
        SetofOptions: {
          from: "*"
          to: "tasks"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      record_audit_event: {
        Args: {
          _action_label: string
          _action_type: string
          _changed_fields?: Json
          _comment?: string
          _correlation_id?: string
          _entity_id: string
          _entity_type: string
          _is_system_generated?: boolean
          _module_code: string
          _new_values?: Json
          _old_values?: Json
          _project_id?: string
          _reason_code?: string
          _severity?: Database["public"]["Enums"]["audit_severity"]
          _source_channel?: Database["public"]["Enums"]["audit_source_channel"]
          _status_from?: string
          _status_to?: string
          _wbs_node_id?: string
        }
        Returns: string
      }
      seed_demo_run: { Args: never; Returns: Json }
      set_active_baseline: {
        Args: { _baseline_id: string }
        Returns: undefined
      }
      sync_all_wbs_progress: {
        Args: { v_project_id: string }
        Returns: undefined
      }
      update_assigned_task_limited:
        | {
            Args: {
              _description: string
              _estimated_hours: number
              _planned_end: string
              _priority: Database["public"]["Enums"]["task_priority"]
              _progress_pct: number
              _task_id: string
              _title: string
            }
            Returns: {
              actual_end: string | null
              actual_hours: number | null
              actual_start: string | null
              approved_at: string | null
              approved_by: string | null
              baseline_end: string | null
              baseline_start: string | null
              category: Database["public"]["Enums"]["task_category"] | null
              code: string | null
              constraint_date: string | null
              constraint_type:
                | Database["public"]["Enums"]["schedule_constraint_type"]
                | null
              created_at: string
              created_by: string | null
              deadline_date: string | null
              department: Database["public"]["Enums"]["department"] | null
              dept_status: Database["public"]["Enums"]["dept_status"] | null
              description: string | null
              discipline_meta: Json
              estimated_hours: number | null
              id: string
              location_zone: string | null
              planned_end: string | null
              planned_start: string | null
              priority: Database["public"]["Enums"]["task_priority"]
              progress_pct: number
              project_id: string
              rejection_reason: string | null
              status: Database["public"]["Enums"]["task_status"]
              task_type: Database["public"]["Enums"]["task_type"]
              title: string
              updated_at: string
              wbs_node_id: string | null
              workflow_type:
                | Database["public"]["Enums"]["task_workflow_type"]
                | null
            }
            SetofOptions: {
              from: "*"
              to: "tasks"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: {
              _description: string
              _estimated_hours: number
              _planned_end: string
              _planned_start: string
              _priority: Database["public"]["Enums"]["task_priority"]
              _progress_pct: number
              _task_id: string
              _title: string
            }
            Returns: {
              actual_end: string | null
              actual_hours: number | null
              actual_start: string | null
              approved_at: string | null
              approved_by: string | null
              baseline_end: string | null
              baseline_start: string | null
              category: Database["public"]["Enums"]["task_category"] | null
              code: string | null
              constraint_date: string | null
              constraint_type:
                | Database["public"]["Enums"]["schedule_constraint_type"]
                | null
              created_at: string
              created_by: string | null
              deadline_date: string | null
              department: Database["public"]["Enums"]["department"] | null
              dept_status: Database["public"]["Enums"]["dept_status"] | null
              description: string | null
              discipline_meta: Json
              estimated_hours: number | null
              id: string
              location_zone: string | null
              planned_end: string | null
              planned_start: string | null
              priority: Database["public"]["Enums"]["task_priority"]
              progress_pct: number
              project_id: string
              rejection_reason: string | null
              status: Database["public"]["Enums"]["task_status"]
              task_type: Database["public"]["Enums"]["task_type"]
              title: string
              updated_at: string
              wbs_node_id: string | null
              workflow_type:
                | Database["public"]["Enums"]["task_workflow_type"]
                | null
            }
            SetofOptions: {
              from: "*"
              to: "tasks"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      wbs_roll_up_node_progress: {
        Args: { v_node_id: string }
        Returns: undefined
      }
      wbs_user_can: {
        Args: {
          _node_id: string
          _perm: Database["public"]["Enums"]["wbs_permission"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "project_manager"
        | "engineer"
        | "supervisor"
        | "worker"
        | "qaqc_inspector"
        | "accountant"
      approval_action_type:
        | "submit"
        | "approve"
        | "reject"
        | "delegate"
        | "comment"
        | "cancel"
        | "close"
      approval_instance_status:
        | "draft"
        | "submitted"
        | "in_review"
        | "approved"
        | "rejected"
        | "cancelled"
        | "closed"
      approval_step_status:
        | "pending"
        | "active"
        | "approved"
        | "rejected"
        | "skipped"
        | "cancelled"
      attendance_status:
        | "present"
        | "absent"
        | "late"
        | "half_day"
        | "holiday"
        | "on_leave"
      audit_severity: "low" | "medium" | "high" | "critical"
      audit_source_channel: "web" | "mobile" | "system" | "api" | "telegram"
      checklist_result: "pass" | "fail" | "n/a"
      claim_status: "draft" | "submitted" | "certified" | "paid" | "rejected"
      concrete_grade:
        | "C20"
        | "C25"
        | "C30"
        | "C35"
        | "C40"
        | "C45"
        | "C50"
        | "Other"
      construction_task_priority: "low" | "medium" | "high" | "critical"
      construction_task_status:
        | "open"
        | "assigned"
        | "in_progress"
        | "completed"
        | "submitted_for_approval"
        | "approved"
        | "closed"
        | "rejected"
        | "on_hold"
      contract_status:
        | "draft"
        | "active"
        | "suspended"
        | "completed"
        | "terminated"
      dep_relation_type: "FS" | "SS" | "FF" | "SF"
      department:
        | "architecture"
        | "structure"
        | "mep"
        | "procurement"
        | "construction"
        | "accounting"
      dept_role: "member" | "reviewer" | "approver"
      dept_status:
        | "draft"
        | "internal_review"
        | "coordination"
        | "dept_approved"
        | "issued"
        | "request"
        | "rfq"
        | "quotation_received"
        | "evaluation"
        | "po_issued"
        | "delivered"
        | "assigned"
        | "in_progress"
        | "inspection"
        | "site_approved"
        | "completed"
        | "rejected"
        | "cancelled"
      document_status:
        | "draft"
        | "submitted"
        | "reviewing"
        | "approved"
        | "for_construction"
        | "superseded"
        | "rejected"
        | "approved_with_comment"
        | "archived"
      dsr_delay_category:
        | "weather"
        | "material"
        | "inspection"
        | "design"
        | "labor"
        | "equipment"
        | "other"
      dsr_severity: "low" | "med" | "high"
      dsr_site_status: "working" | "partial" | "closed"
      dsr_status: "draft" | "submitted" | "approved" | "rejected"
      employment_status:
        | "active"
        | "probation"
        | "inactive"
        | "terminated"
        | "resigned"
      incident_severity: "low" | "medium" | "high" | "critical"
      incident_type:
        | "near_miss"
        | "first_aid"
        | "lost_time_injury"
        | "property_damage"
        | "environmental"
      inspection_result: "pass" | "fail" | "conditional_pass"
      inspection_type: "rebar" | "formwork" | "pre_pour" | "concrete_cube_test"
      invoice_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "approved_for_payment"
        | "rejected"
        | "paid"
        | "cancelled"
      ir_status:
        | "draft"
        | "requested"
        | "scheduled"
        | "passed"
        | "failed"
        | "passed_with_remarks"
      leave_status: "draft" | "pending" | "approved" | "rejected" | "cancelled"
      leave_type_code:
        | "annual"
        | "sick"
        | "personal"
        | "maternity"
        | "paternity"
        | "bereavement"
        | "compassionate"
        | "study"
        | "unpaid"
        | "other"
      mr_status:
        | "draft"
        | "pending_approval"
        | "approved"
        | "rejected"
        | "ordered"
        | "fulfilled"
      ncr_severity: "low" | "medium" | "high" | "critical"
      ncr_status: "open" | "in_progress" | "resolved" | "closed"
      notification_channel: "in_app" | "email" | "telegram" | "push" | "sms"
      notification_delivery_status:
        | "pending"
        | "sent"
        | "failed"
        | "retried"
        | "failed_permanently"
      notification_kind:
        | "information"
        | "action_required"
        | "reminder"
        | "escalation"
        | "system_alert"
        | "digest"
      notification_priority: "low" | "normal" | "high" | "critical"
      notification_status:
        | "generated"
        | "queued"
        | "sent"
        | "delivered"
        | "read"
        | "actioned"
        | "failed"
        | "cancelled"
      notification_type:
        | "task_assigned"
        | "task_unassigned"
        | "task_started"
        | "task_submitted_for_approval"
        | "task_approved"
        | "task_rejected"
        | "task_completed"
        | "task_closed"
        | "task_reopened"
        | "task_blocker_reported"
        | "timesheet_submitted"
        | "timesheet_approved"
        | "timesheet_rejected"
        | "timesheet_flagged"
        | "task_submitted_for_review"
        | "task_overdue"
        | "document_submitted_for_review"
        | "document_approved"
        | "document_rejected"
        | "rfi_created"
        | "rfi_overdue"
        | "pr_approval_required"
        | "po_approved"
        | "ncr_created"
        | "ncr_overdue"
        | "safety_incident_reported"
        | "failed_login_repeated"
        | "role_permission_changed"
        | "approval_required"
        | "approval_overdue"
      payroll_period_status: "open" | "locked" | "paid"
      permit_type:
        | "hot_work"
        | "working_at_height"
        | "excavation"
        | "confined_space"
        | "electrical"
        | "lifting"
        | "general"
      po_status:
        | "draft"
        | "issued"
        | "partially_received"
        | "completed"
        | "cancelled"
      pr_status:
        | "draft"
        | "submitted"
        | "approved"
        | "rejected"
        | "ordered"
        | "received"
        | "cancelled"
      project_status:
        | "planning"
        | "active"
        | "on_hold"
        | "completed"
        | "cancelled"
      punch_list_status: "open" | "resolved" | "verified"
      rfi_priority: "low" | "medium" | "high" | "urgent"
      rfi_status: "draft" | "open" | "answered" | "closed" | "void"
      safety_status:
        | "draft"
        | "pending"
        | "approved"
        | "rejected"
        | "expired"
        | "closed"
      schedule_constraint_type:
        | "ASAP"
        | "ALAP"
        | "SNET"
        | "SNLT"
        | "FNET"
        | "FNLT"
        | "MSO"
        | "MFO"
      site_issue_severity: "low" | "medium" | "high" | "critical"
      site_issue_status: "open" | "in_progress" | "resolved" | "closed"
      stakeholder_type:
        | "client"
        | "project_manager"
        | "contractor"
        | "architect"
        | "subcontractor"
        | "supplier"
        | "authority"
        | "consultant"
        | "other"
      subcontract_claim_status:
        | "draft"
        | "submitted"
        | "certified"
        | "paid"
        | "rejected"
      task_category:
        | "design_log_report"
        | "design_summary_report"
        | "calculation_note"
        | "technical_evaluation"
        | "technical_comparison"
        | "cut_sheet"
        | "design_coordination_circulation"
        | "material_coordination_circulation"
        | "budget_coordination_circulation"
        | "eoi"
        | "tender_evaluation"
        | "tender_interview"
        | "po_award"
        | "kick_off"
        | "daily_report"
        | "weekly_report"
        | "ncr"
        | "instruction"
        | "delay_notice"
        | "claim_notice"
        | "as_built_drawing_rfa"
        | "test_report_rfa"
        | "material_rfa"
        | "method_statement_rfa"
      task_priority: "low" | "medium" | "high" | "critical"
      task_status:
        | "open"
        | "assigned"
        | "in_progress"
        | "pending_approval"
        | "approved"
        | "rejected"
        | "completed"
        | "closed"
        | "blocked"
      task_type:
        | "concrete"
        | "steel"
        | "mep"
        | "finishing"
        | "excavation"
        | "inspection"
        | "other"
      task_workflow_type:
        | "design"
        | "coordination"
        | "procurement"
        | "execution"
        | "approval"
      timesheet_status: "draft" | "submitted" | "approved" | "rejected"
      wbs_node_type:
        | "building"
        | "level"
        | "zone"
        | "sub_zone"
        | "area"
        | "system"
        | "package"
        | "other"
        | "room"
        | "element"
      wbs_permission: "view" | "edit" | "manage"
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
      app_role: [
        "admin",
        "project_manager",
        "engineer",
        "supervisor",
        "worker",
        "qaqc_inspector",
        "accountant",
      ],
      approval_action_type: [
        "submit",
        "approve",
        "reject",
        "delegate",
        "comment",
        "cancel",
        "close",
      ],
      approval_instance_status: [
        "draft",
        "submitted",
        "in_review",
        "approved",
        "rejected",
        "cancelled",
        "closed",
      ],
      approval_step_status: [
        "pending",
        "active",
        "approved",
        "rejected",
        "skipped",
        "cancelled",
      ],
      attendance_status: [
        "present",
        "absent",
        "late",
        "half_day",
        "holiday",
        "on_leave",
      ],
      audit_severity: ["low", "medium", "high", "critical"],
      audit_source_channel: ["web", "mobile", "system", "api", "telegram"],
      checklist_result: ["pass", "fail", "n/a"],
      claim_status: ["draft", "submitted", "certified", "paid", "rejected"],
      concrete_grade: [
        "C20",
        "C25",
        "C30",
        "C35",
        "C40",
        "C45",
        "C50",
        "Other",
      ],
      construction_task_priority: ["low", "medium", "high", "critical"],
      construction_task_status: [
        "open",
        "assigned",
        "in_progress",
        "completed",
        "submitted_for_approval",
        "approved",
        "closed",
        "rejected",
        "on_hold",
      ],
      contract_status: [
        "draft",
        "active",
        "suspended",
        "completed",
        "terminated",
      ],
      dep_relation_type: ["FS", "SS", "FF", "SF"],
      department: [
        "architecture",
        "structure",
        "mep",
        "procurement",
        "construction",
        "accounting",
      ],
      dept_role: ["member", "reviewer", "approver"],
      dept_status: [
        "draft",
        "internal_review",
        "coordination",
        "dept_approved",
        "issued",
        "request",
        "rfq",
        "quotation_received",
        "evaluation",
        "po_issued",
        "delivered",
        "assigned",
        "in_progress",
        "inspection",
        "site_approved",
        "completed",
        "rejected",
        "cancelled",
      ],
      document_status: [
        "draft",
        "submitted",
        "reviewing",
        "approved",
        "for_construction",
        "superseded",
        "rejected",
        "approved_with_comment",
        "archived",
      ],
      dsr_delay_category: [
        "weather",
        "material",
        "inspection",
        "design",
        "labor",
        "equipment",
        "other",
      ],
      dsr_severity: ["low", "med", "high"],
      dsr_site_status: ["working", "partial", "closed"],
      dsr_status: ["draft", "submitted", "approved", "rejected"],
      employment_status: [
        "active",
        "probation",
        "inactive",
        "terminated",
        "resigned",
      ],
      incident_severity: ["low", "medium", "high", "critical"],
      incident_type: [
        "near_miss",
        "first_aid",
        "lost_time_injury",
        "property_damage",
        "environmental",
      ],
      inspection_result: ["pass", "fail", "conditional_pass"],
      inspection_type: ["rebar", "formwork", "pre_pour", "concrete_cube_test"],
      invoice_status: [
        "draft",
        "submitted",
        "under_review",
        "approved_for_payment",
        "rejected",
        "paid",
        "cancelled",
      ],
      ir_status: [
        "draft",
        "requested",
        "scheduled",
        "passed",
        "failed",
        "passed_with_remarks",
      ],
      leave_status: ["draft", "pending", "approved", "rejected", "cancelled"],
      leave_type_code: [
        "annual",
        "sick",
        "personal",
        "maternity",
        "paternity",
        "bereavement",
        "compassionate",
        "study",
        "unpaid",
        "other",
      ],
      mr_status: [
        "draft",
        "pending_approval",
        "approved",
        "rejected",
        "ordered",
        "fulfilled",
      ],
      ncr_severity: ["low", "medium", "high", "critical"],
      ncr_status: ["open", "in_progress", "resolved", "closed"],
      notification_channel: ["in_app", "email", "telegram", "push", "sms"],
      notification_delivery_status: [
        "pending",
        "sent",
        "failed",
        "retried",
        "failed_permanently",
      ],
      notification_kind: [
        "information",
        "action_required",
        "reminder",
        "escalation",
        "system_alert",
        "digest",
      ],
      notification_priority: ["low", "normal", "high", "critical"],
      notification_status: [
        "generated",
        "queued",
        "sent",
        "delivered",
        "read",
        "actioned",
        "failed",
        "cancelled",
      ],
      notification_type: [
        "task_assigned",
        "task_unassigned",
        "task_started",
        "task_submitted_for_approval",
        "task_approved",
        "task_rejected",
        "task_completed",
        "task_closed",
        "task_reopened",
        "task_blocker_reported",
        "timesheet_submitted",
        "timesheet_approved",
        "timesheet_rejected",
        "timesheet_flagged",
        "task_submitted_for_review",
        "task_overdue",
        "document_submitted_for_review",
        "document_approved",
        "document_rejected",
        "rfi_created",
        "rfi_overdue",
        "pr_approval_required",
        "po_approved",
        "ncr_created",
        "ncr_overdue",
        "safety_incident_reported",
        "failed_login_repeated",
        "role_permission_changed",
        "approval_required",
        "approval_overdue",
      ],
      payroll_period_status: ["open", "locked", "paid"],
      permit_type: [
        "hot_work",
        "working_at_height",
        "excavation",
        "confined_space",
        "electrical",
        "lifting",
        "general",
      ],
      po_status: [
        "draft",
        "issued",
        "partially_received",
        "completed",
        "cancelled",
      ],
      pr_status: [
        "draft",
        "submitted",
        "approved",
        "rejected",
        "ordered",
        "received",
        "cancelled",
      ],
      project_status: [
        "planning",
        "active",
        "on_hold",
        "completed",
        "cancelled",
      ],
      punch_list_status: ["open", "resolved", "verified"],
      rfi_priority: ["low", "medium", "high", "urgent"],
      rfi_status: ["draft", "open", "answered", "closed", "void"],
      safety_status: [
        "draft",
        "pending",
        "approved",
        "rejected",
        "expired",
        "closed",
      ],
      schedule_constraint_type: [
        "ASAP",
        "ALAP",
        "SNET",
        "SNLT",
        "FNET",
        "FNLT",
        "MSO",
        "MFO",
      ],
      site_issue_severity: ["low", "medium", "high", "critical"],
      site_issue_status: ["open", "in_progress", "resolved", "closed"],
      stakeholder_type: [
        "client",
        "project_manager",
        "contractor",
        "architect",
        "subcontractor",
        "supplier",
        "authority",
        "consultant",
        "other",
      ],
      subcontract_claim_status: [
        "draft",
        "submitted",
        "certified",
        "paid",
        "rejected",
      ],
      task_category: [
        "design_log_report",
        "design_summary_report",
        "calculation_note",
        "technical_evaluation",
        "technical_comparison",
        "cut_sheet",
        "design_coordination_circulation",
        "material_coordination_circulation",
        "budget_coordination_circulation",
        "eoi",
        "tender_evaluation",
        "tender_interview",
        "po_award",
        "kick_off",
        "daily_report",
        "weekly_report",
        "ncr",
        "instruction",
        "delay_notice",
        "claim_notice",
        "as_built_drawing_rfa",
        "test_report_rfa",
        "material_rfa",
        "method_statement_rfa",
      ],
      task_priority: ["low", "medium", "high", "critical"],
      task_status: [
        "open",
        "assigned",
        "in_progress",
        "pending_approval",
        "approved",
        "rejected",
        "completed",
        "closed",
        "blocked",
      ],
      task_type: [
        "concrete",
        "steel",
        "mep",
        "finishing",
        "excavation",
        "inspection",
        "other",
      ],
      task_workflow_type: [
        "design",
        "coordination",
        "procurement",
        "execution",
        "approval",
      ],
      timesheet_status: ["draft", "submitted", "approved", "rejected"],
      wbs_node_type: [
        "building",
        "level",
        "zone",
        "sub_zone",
        "area",
        "system",
        "package",
        "other",
        "room",
        "element",
      ],
      wbs_permission: ["view", "edit", "manage"],
    },
  },
} as const
