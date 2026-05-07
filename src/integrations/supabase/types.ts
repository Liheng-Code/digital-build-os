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
      architecture_room_data: {
        Row: {
          ceiling_finish: string | null
          cornice_finish: string | null
          created_at: string
          floor_finish: string | null
          id: string
          mep_requirements: Json | null
          remarks: string | null
          skirting_finish: string | null
          updated_at: string
          wall_finish: string | null
          wbs_node_id: string
        }
        Insert: {
          ceiling_finish?: string | null
          cornice_finish?: string | null
          created_at?: string
          floor_finish?: string | null
          id?: string
          mep_requirements?: Json | null
          remarks?: string | null
          skirting_finish?: string | null
          updated_at?: string
          wall_finish?: string | null
          wbs_node_id: string
        }
        Update: {
          ceiling_finish?: string | null
          cornice_finish?: string | null
          created_at?: string
          floor_finish?: string | null
          id?: string
          mep_requirements?: Json | null
          remarks?: string | null
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
      audit_log: {
        Row: {
          action: string
          after_data: Json | null
          before_data: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: []
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
      document_versions: {
        Row: {
          change_note: string | null
          document_id: string
          file_name: string
          id: string
          mime_type: string | null
          size_bytes: number | null
          storage_path: string
          uploaded_at: string
          uploaded_by: string | null
          version: number
        }
        Insert: {
          change_note?: string | null
          document_id: string
          file_name: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path: string
          uploaded_at?: string
          uploaded_by?: string | null
          version: number
        }
        Update: {
          change_note?: string | null
          document_id?: string
          file_name?: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
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
          document_number: string | null
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
          document_number?: string | null
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
          document_number?: string | null
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
      grn_items: {
        Row: {
          accepted_qty: number
          grn_id: string
          id: string
          material_name: string
          notes: string | null
          po_item_id: string | null
          received_qty: number
          rejected_qty: number
          uom: string
        }
        Insert: {
          accepted_qty: number
          grn_id: string
          id?: string
          material_name: string
          notes?: string | null
          po_item_id?: string | null
          received_qty: number
          rejected_qty?: number
          uom: string
        }
        Update: {
          accepted_qty?: number
          grn_id?: string
          id?: string
          material_name?: string
          notes?: string | null
          po_item_id?: string | null
          received_qty?: number
          rejected_qty?: number
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
          created_at: string
          delivery_date: string
          delivery_note_ref: string | null
          grn_number: string
          id: string
          po_id: string | null
          project_id: string
          received_by: string
        }
        Insert: {
          created_at?: string
          delivery_date?: string
          delivery_note_ref?: string | null
          grn_number: string
          id?: string
          po_id?: string | null
          project_id: string
          received_by: string
        }
        Update: {
          created_at?: string
          delivery_date?: string
          delivery_note_ref?: string | null
          grn_number?: string
          id?: string
          po_id?: string | null
          project_id?: string
          received_by?: string
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
      notifications: {
        Row: {
          actor_id: string | null
          body: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json
          priority: Database["public"]["Enums"]["notification_priority"]
          project_id: string | null
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
          priority?: Database["public"]["Enums"]["notification_priority"]
          project_id?: string | null
          read_at?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
          priority?: Database["public"]["Enums"]["notification_priority"]
          project_id?: string | null
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
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
          company_id: string | null
          created_at: string
          employee_id: string | null
          full_name: string
          id: string
          job_title: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          employee_id?: string | null
          full_name?: string
          id: string
          job_title?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          employee_id?: string | null
          full_name?: string
          id?: string
          job_title?: string | null
          phone?: string | null
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
          added_at: string
          approval_authority: boolean
          id: string
          project_id: string
          project_role: string | null
          stakeholder_id: string
        }
        Insert: {
          added_at?: string
          approval_authority?: boolean
          id?: string
          project_id: string
          project_role?: string | null
          stakeholder_id: string
        }
        Update: {
          added_at?: string
          approval_authority?: boolean
          id?: string
          project_id?: string
          project_role?: string | null
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
          created_at: string
          id: string
          po_date: string
          po_number: string
          project_id: string
          status: Database["public"]["Enums"]["po_status"]
          supplier_name: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          po_date?: string
          po_number: string
          project_id: string
          status?: Database["public"]["Enums"]["po_status"]
          supplier_name: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          po_date?: string
          po_number?: string
          project_id?: string
          status?: Database["public"]["Enums"]["po_status"]
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
        ]
      }
      purchase_requisitions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
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
          created_at: string
          created_by: string | null
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
          created_at?: string
          created_by?: string | null
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
          created_at?: string
          created_by?: string | null
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
      check_permission: {
        Args: { v_action: string; v_module: string; v_user_id: string }
        Returns: boolean
      }
      compute_payroll_lines: {
        Args: { _period_id: string }
        Returns: undefined
      }
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
          created_at: string
          created_by: string | null
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
      seed_demo_run: { Args: never; Returns: Json }
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
              created_at: string
              created_by: string | null
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
              created_at: string
              created_by: string | null
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
      checklist_result: "pass" | "fail" | "n/a"
      claim_status: "draft" | "submitted" | "certified" | "paid" | "rejected"
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
      incident_severity: "low" | "medium" | "high" | "critical"
      incident_type:
        | "near_miss"
        | "first_aid"
        | "lost_time_injury"
        | "property_damage"
        | "environmental"
      inspection_type: "rebar" | "formwork" | "pre_pour" | "concrete_cube_test"
      ir_status:
        | "draft"
        | "requested"
        | "scheduled"
        | "passed"
        | "failed"
        | "passed_with_remarks"
      mr_status:
        | "draft"
        | "pending_approval"
        | "approved"
        | "rejected"
        | "ordered"
        | "fulfilled"
      ncr_severity: "low" | "medium" | "high" | "critical"
      ncr_status: "open" | "in_progress" | "resolved" | "closed"
      notification_priority: "low" | "normal" | "high" | "critical"
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
      checklist_result: ["pass", "fail", "n/a"],
      claim_status: ["draft", "submitted", "certified", "paid", "rejected"],
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
      incident_severity: ["low", "medium", "high", "critical"],
      incident_type: [
        "near_miss",
        "first_aid",
        "lost_time_injury",
        "property_damage",
        "environmental",
      ],
      inspection_type: ["rebar", "formwork", "pre_pour", "concrete_cube_test"],
      ir_status: [
        "draft",
        "requested",
        "scheduled",
        "passed",
        "failed",
        "passed_with_remarks",
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
      notification_priority: ["low", "normal", "high", "critical"],
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
