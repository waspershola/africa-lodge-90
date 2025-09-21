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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_role: string | null
          created_at: string | null
          description: string | null
          id: string
          ip_address: unknown | null
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          resource_id: string | null
          resource_type: string
          tenant_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type: string
          tenant_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string
          tenant_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          config: Json | null
          created_at: string | null
          description: string | null
          flag_name: string
          id: string
          is_enabled: boolean | null
          target_plans: string[] | null
          target_tenants: string[] | null
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          description?: string | null
          flag_name: string
          id?: string
          is_enabled?: boolean | null
          target_plans?: string[] | null
          target_tenants?: string[] | null
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          description?: string | null
          flag_name?: string
          id?: string
          is_enabled?: boolean | null
          target_plans?: string[] | null
          target_tenants?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      folio_charges: {
        Row: {
          amount: number
          charge_type: string
          created_at: string | null
          description: string
          folio_id: string
          id: string
          posted_by: string | null
          reference_id: string | null
          reference_type: string | null
          tenant_id: string
        }
        Insert: {
          amount: number
          charge_type: string
          created_at?: string | null
          description: string
          folio_id: string
          id?: string
          posted_by?: string | null
          reference_id?: string | null
          reference_type?: string | null
          tenant_id: string
        }
        Update: {
          amount?: number
          charge_type?: string
          created_at?: string | null
          description?: string
          folio_id?: string
          id?: string
          posted_by?: string | null
          reference_id?: string | null
          reference_type?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "folio_charges_folio_id_fkey"
            columns: ["folio_id"]
            isOneToOne: false
            referencedRelation: "folios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folio_charges_posted_by_fkey"
            columns: ["posted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folio_charges_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      folios: {
        Row: {
          balance: number | null
          closed_at: string | null
          closed_by: string | null
          created_at: string | null
          folio_number: string
          id: string
          reservation_id: string
          status: string
          tenant_id: string
          total_charges: number | null
          total_payments: number | null
          updated_at: string | null
        }
        Insert: {
          balance?: number | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string | null
          folio_number: string
          id?: string
          reservation_id: string
          status?: string
          tenant_id: string
          total_charges?: number | null
          total_payments?: number | null
          updated_at?: string | null
        }
        Update: {
          balance?: number | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string | null
          folio_number?: string
          id?: string
          reservation_id?: string
          status?: string
          tenant_id?: string
          total_charges?: number | null
          total_payments?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "folios_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folios_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folios_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      housekeeping_tasks: {
        Row: {
          actual_minutes: number | null
          assigned_at: string | null
          assigned_to: string | null
          checklist: Json | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          estimated_minutes: number | null
          id: string
          priority: string | null
          qr_order_id: string | null
          room_id: string | null
          started_at: string | null
          status: string
          task_type: string
          tenant_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          actual_minutes?: number | null
          assigned_at?: string | null
          assigned_to?: string | null
          checklist?: Json | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          priority?: string | null
          qr_order_id?: string | null
          room_id?: string | null
          started_at?: string | null
          status?: string
          task_type: string
          tenant_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          actual_minutes?: number | null
          assigned_at?: string | null
          assigned_to?: string | null
          checklist?: Json | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          priority?: string | null
          qr_order_id?: string | null
          room_id?: string | null
          started_at?: string | null
          status?: string
          task_type?: string
          tenant_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "housekeeping_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "housekeeping_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "housekeeping_tasks_qr_order_id_fkey"
            columns: ["qr_order_id"]
            isOneToOne: false
            referencedRelation: "qr_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "housekeeping_tasks_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "housekeeping_tasks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      menu_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      menu_items: {
        Row: {
          category_id: string
          created_at: string | null
          description: string | null
          dietary_info: string[] | null
          id: string
          image_url: string | null
          is_available: boolean | null
          name: string
          preparation_time: number | null
          price: number
          tags: string[] | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          description?: string | null
          dietary_info?: string[] | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name: string
          preparation_time?: number | null
          price: number
          tags?: string[] | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          description?: string | null
          dietary_info?: string[] | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name?: string
          preparation_time?: number | null
          price?: number
          tags?: string[] | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      offline_actions: {
        Row: {
          action_type: string
          client_id: string | null
          client_timestamp: string
          created_at: string | null
          data: Json
          error_message: string | null
          id: string
          record_id: string | null
          sync_attempted_at: string | null
          sync_status: string | null
          table_name: string
          tenant_id: string
        }
        Insert: {
          action_type: string
          client_id?: string | null
          client_timestamp: string
          created_at?: string | null
          data: Json
          error_message?: string | null
          id?: string
          record_id?: string | null
          sync_attempted_at?: string | null
          sync_status?: string | null
          table_name: string
          tenant_id: string
        }
        Update: {
          action_type?: string
          client_id?: string | null
          client_timestamp?: string
          created_at?: string | null
          data?: Json
          error_message?: string | null
          id?: string
          record_id?: string | null
          sync_attempted_at?: string | null
          sync_status?: string | null
          table_name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offline_actions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          card_last_four: string | null
          created_at: string | null
          folio_id: string
          id: string
          payment_method: string
          processed_by: string | null
          reference: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          amount: number
          card_last_four?: string | null
          created_at?: string | null
          folio_id: string
          id?: string
          payment_method: string
          processed_by?: string | null
          reference?: string | null
          status?: string
          tenant_id: string
        }
        Update: {
          amount?: number
          card_last_four?: string | null
          created_at?: string | null
          folio_id?: string
          id?: string
          payment_method?: string
          processed_by?: string | null
          reference?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_folio_id_fkey"
            columns: ["folio_id"]
            isOneToOne: false
            referencedRelation: "folios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string
          created_at: string | null
          description: string | null
          id: string
          module: string
          name: string
        }
        Insert: {
          action: string
          created_at?: string | null
          description?: string | null
          id?: string
          module: string
          name: string
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string | null
          id?: string
          module?: string
          name?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          created_at: string | null
          features: Json
          id: string
          max_rooms: number
          max_staff: number
          name: string
          price_annual: number | null
          price_monthly: number
          trial_days: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          features?: Json
          id?: string
          max_rooms: number
          max_staff: number
          name: string
          price_annual?: number | null
          price_monthly: number
          trial_days?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          features?: Json
          id?: string
          max_rooms?: number
          max_staff?: number
          name?: string
          price_annual?: number | null
          price_monthly?: number
          trial_days?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pos_order_items: {
        Row: {
          created_at: string | null
          id: string
          item_name: string
          item_price: number
          line_total: number | null
          menu_item_id: string
          order_id: string
          quantity: number
          special_requests: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_name: string
          item_price: number
          line_total?: number | null
          menu_item_id: string
          order_id: string
          quantity?: number
          special_requests?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          item_name?: string
          item_price?: number
          line_total?: number | null
          menu_item_id?: string
          order_id?: string
          quantity?: number
          special_requests?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "pos_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_order_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      pos_orders: {
        Row: {
          completed_time: string | null
          created_at: string | null
          folio_id: string | null
          id: string
          order_number: string
          order_time: string | null
          order_type: string
          prepared_by: string | null
          promised_time: string | null
          room_id: string | null
          served_by: string | null
          service_charge: number | null
          special_instructions: string | null
          status: string
          subtotal: number
          taken_by: string | null
          tax_amount: number | null
          tenant_id: string
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          completed_time?: string | null
          created_at?: string | null
          folio_id?: string | null
          id?: string
          order_number: string
          order_time?: string | null
          order_type: string
          prepared_by?: string | null
          promised_time?: string | null
          room_id?: string | null
          served_by?: string | null
          service_charge?: number | null
          special_instructions?: string | null
          status?: string
          subtotal?: number
          taken_by?: string | null
          tax_amount?: number | null
          tenant_id: string
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          completed_time?: string | null
          created_at?: string | null
          folio_id?: string | null
          id?: string
          order_number?: string
          order_time?: string | null
          order_type?: string
          prepared_by?: string | null
          promised_time?: string | null
          room_id?: string | null
          served_by?: string | null
          service_charge?: number | null
          special_instructions?: string | null
          status?: string
          subtotal?: number
          taken_by?: string | null
          tax_amount?: number | null
          tenant_id?: string
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_orders_folio_id_fkey"
            columns: ["folio_id"]
            isOneToOne: false
            referencedRelation: "folios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_orders_prepared_by_fkey"
            columns: ["prepared_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_orders_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_orders_served_by_fkey"
            columns: ["served_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_orders_taken_by_fkey"
            columns: ["taken_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      qr_codes: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          qr_code_url: string | null
          qr_token: string
          room_id: string
          services: string[]
          template_id: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          qr_code_url?: string | null
          qr_token: string
          room_id: string
          services: string[]
          template_id?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          qr_code_url?: string | null
          qr_token?: string
          room_id?: string
          services?: string[]
          template_id?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qr_codes_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_codes_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "qr_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_codes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      qr_orders: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          guest_session_id: string | null
          id: string
          notes: string | null
          qr_code_id: string
          request_details: Json | null
          service_type: string
          status: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          guest_session_id?: string | null
          id?: string
          notes?: string | null
          qr_code_id: string
          request_details?: Json | null
          service_type: string
          status?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          guest_session_id?: string | null
          id?: string
          notes?: string | null
          qr_code_id?: string
          request_details?: Json | null
          service_type?: string
          status?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qr_orders_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_orders_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_orders_qr_code_id_fkey"
            columns: ["qr_code_id"]
            isOneToOne: false
            referencedRelation: "qr_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      qr_templates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          services: string[]
          template_data: Json | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          services: string[]
          template_data?: Json | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          services?: string[]
          template_data?: Json | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      reservations: {
        Row: {
          adults: number | null
          check_in_date: string
          check_out_date: string
          checked_in_at: string | null
          checked_in_by: string | null
          checked_out_at: string | null
          checked_out_by: string | null
          children: number | null
          created_at: string | null
          created_by: string | null
          guest_email: string | null
          guest_id_number: string | null
          guest_name: string
          guest_phone: string | null
          id: string
          reservation_number: string
          room_id: string
          room_rate: number
          status: string
          tenant_id: string
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          adults?: number | null
          check_in_date: string
          check_out_date: string
          checked_in_at?: string | null
          checked_in_by?: string | null
          checked_out_at?: string | null
          checked_out_by?: string | null
          children?: number | null
          created_at?: string | null
          created_by?: string | null
          guest_email?: string | null
          guest_id_number?: string | null
          guest_name: string
          guest_phone?: string | null
          id?: string
          reservation_number: string
          room_id: string
          room_rate: number
          status?: string
          tenant_id: string
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          adults?: number | null
          check_in_date?: string
          check_out_date?: string
          checked_in_at?: string | null
          checked_in_by?: string | null
          checked_out_at?: string | null
          checked_out_by?: string | null
          children?: number | null
          created_at?: string | null
          created_by?: string | null
          guest_email?: string | null
          guest_id_number?: string | null
          guest_name?: string
          guest_phone?: string | null
          id?: string
          reservation_number?: string
          room_id?: string
          room_rate?: number
          status?: string
          tenant_id?: string
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_checked_in_by_fkey"
            columns: ["checked_in_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_checked_out_by_fkey"
            columns: ["checked_out_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission_id: string | null
          role_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission_id?: string | null
          role_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          permission_id?: string | null
          role_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_system: boolean | null
          name: string
          scope: Database["public"]["Enums"]["role_scope"]
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          scope?: Database["public"]["Enums"]["role_scope"]
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          scope?: Database["public"]["Enums"]["role_scope"]
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      room_types: {
        Row: {
          amenities: string[] | null
          base_rate: number
          created_at: string | null
          description: string | null
          id: string
          max_occupancy: number | null
          name: string
          tenant_id: string
        }
        Insert: {
          amenities?: string[] | null
          base_rate: number
          created_at?: string | null
          description?: string | null
          id?: string
          max_occupancy?: number | null
          name: string
          tenant_id: string
        }
        Update: {
          amenities?: string[] | null
          base_rate?: number
          created_at?: string | null
          description?: string | null
          id?: string
          max_occupancy?: number | null
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_types_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      rooms: {
        Row: {
          created_at: string | null
          floor: number | null
          id: string
          last_cleaned: string | null
          notes: string | null
          room_number: string
          room_type_id: string
          status: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          floor?: number | null
          id?: string
          last_cleaned?: string | null
          notes?: string | null
          room_number: string
          room_type_id: string
          status?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          floor?: number | null
          id?: string
          last_cleaned?: string | null
          notes?: string | null
          room_number?: string
          room_type_id?: string
          status?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      supplies: {
        Row: {
          category: string
          created_at: string | null
          current_stock: number | null
          id: string
          is_active: boolean | null
          maximum_stock: number | null
          minimum_stock: number | null
          name: string
          tenant_id: string
          unit: string
          unit_cost: number | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          current_stock?: number | null
          id?: string
          is_active?: boolean | null
          maximum_stock?: number | null
          minimum_stock?: number | null
          name: string
          tenant_id: string
          unit: string
          unit_cost?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          current_stock?: number | null
          id?: string
          is_active?: boolean | null
          maximum_stock?: number | null
          minimum_stock?: number | null
          name?: string
          tenant_id?: string
          unit?: string
          unit_cost?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      supply_usage: {
        Row: {
          created_at: string | null
          id: string
          quantity_used: number
          room_id: string | null
          supply_id: string
          task_id: string | null
          tenant_id: string
          used_by: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          quantity_used: number
          room_id?: string | null
          supply_id: string
          task_id?: string | null
          tenant_id: string
          used_by?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          quantity_used?: number
          room_id?: string | null
          supply_id?: string
          task_id?: string | null
          tenant_id?: string
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supply_usage_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_usage_supply_id_fkey"
            columns: ["supply_id"]
            isOneToOne: false
            referencedRelation: "supplies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_usage_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "housekeeping_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_usage_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "supply_usage_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          address: string | null
          brand_colors: Json | null
          city: string | null
          country: string | null
          created_at: string | null
          currency: string | null
          email: string | null
          hotel_name: string
          hotel_slug: string
          logo_url: string | null
          onboarding_step: string | null
          owner_id: string | null
          phone: string | null
          plan_id: string
          receipt_template: string | null
          settings: Json | null
          setup_completed: boolean | null
          subscription_status: string
          tenant_id: string
          timezone: string | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          brand_colors?: Json | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          email?: string | null
          hotel_name: string
          hotel_slug: string
          logo_url?: string | null
          onboarding_step?: string | null
          owner_id?: string | null
          phone?: string | null
          plan_id: string
          receipt_template?: string | null
          settings?: Json | null
          setup_completed?: boolean | null
          subscription_status?: string
          tenant_id?: string
          timezone?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          brand_colors?: Json | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          email?: string | null
          hotel_name?: string
          hotel_slug?: string
          logo_url?: string | null
          onboarding_step?: string | null
          owner_id?: string | null
          phone?: string | null
          plan_id?: string
          receipt_template?: string | null
          settings?: Json | null
          setup_completed?: boolean | null
          subscription_status?: string
          tenant_id?: string
          timezone?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenants_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          department: string | null
          email: string
          force_reset: boolean | null
          id: string
          is_active: boolean | null
          is_platform_owner: boolean | null
          last_login: string | null
          name: string | null
          phone: string | null
          role: string
          role_id: string | null
          shift_end: string | null
          shift_start: string | null
          temp_expires: string | null
          temp_password_hash: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          email: string
          force_reset?: boolean | null
          id?: string
          is_active?: boolean | null
          is_platform_owner?: boolean | null
          last_login?: string | null
          name?: string | null
          phone?: string | null
          role: string
          role_id?: string | null
          shift_end?: string | null
          shift_start?: string | null
          temp_expires?: string | null
          temp_password_hash?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          email?: string
          force_reset?: boolean | null
          id?: string
          is_active?: boolean | null
          is_platform_owner?: boolean | null
          last_login?: string | null
          name?: string | null
          phone?: string | null
          role?: string
          role_id?: string | null
          shift_end?: string | null
          shift_start?: string | null
          temp_expires?: string | null
          temp_password_hash?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      work_orders: {
        Row: {
          actual_cost: number | null
          actual_hours: number | null
          assigned_at: string | null
          assigned_to: string | null
          category: string
          completed_at: string | null
          completion_notes: string | null
          created_at: string | null
          created_by: string | null
          description: string
          estimated_cost: number | null
          estimated_hours: number | null
          id: string
          priority: string | null
          qr_order_id: string | null
          room_id: string | null
          status: string
          tenant_id: string
          title: string
          updated_at: string | null
          work_order_number: string
        }
        Insert: {
          actual_cost?: number | null
          actual_hours?: number | null
          assigned_at?: string | null
          assigned_to?: string | null
          category: string
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string | null
          created_by?: string | null
          description: string
          estimated_cost?: number | null
          estimated_hours?: number | null
          id?: string
          priority?: string | null
          qr_order_id?: string | null
          room_id?: string | null
          status?: string
          tenant_id: string
          title: string
          updated_at?: string | null
          work_order_number: string
        }
        Update: {
          actual_cost?: number | null
          actual_hours?: number | null
          assigned_at?: string | null
          assigned_to?: string | null
          category?: string
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          estimated_cost?: number | null
          estimated_hours?: number | null
          id?: string
          priority?: string | null
          qr_order_id?: string | null
          room_id?: string | null
          status?: string
          tenant_id?: string
          title?: string
          updated_at?: string | null
          work_order_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_qr_order_id_fkey"
            columns: ["qr_order_id"]
            isOneToOne: false
            referencedRelation: "qr_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_tenant: {
        Args: { tenant_uuid: string }
        Returns: boolean
      }
      create_default_tenant_roles: {
        Args: { tenant_uuid: string }
        Returns: undefined
      }
      custom_access_token_hook: {
        Args: { event: Json }
        Returns: Json
      }
      debug_auth_context: {
        Args: Record<PropertyKey, never>
        Returns: {
          auth_uid_result: string
          debug_message: string
          user_exists: boolean
          user_role: string
        }[]
      }
      get_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_permissions: {
        Args: { user_uuid: string }
        Returns: {
          permission_name: string
        }[]
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_super_admin_direct: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      strict_tenant_access: {
        Args: { target_tenant_id: string }
        Returns: boolean
      }
    }
    Enums: {
      role_scope: "global" | "tenant"
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
      role_scope: ["global", "tenant"],
    },
  },
} as const
