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
            referencedRelation: "occupancy_stats"
            referencedColumns: ["tenant_id"]
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
      branding_assets: {
        Row: {
          asset_name: string
          asset_type: string
          created_at: string | null
          file_size: number | null
          file_url: string
          id: string
          is_active: boolean | null
          mime_type: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          asset_name: string
          asset_type: string
          created_at?: string | null
          file_size?: number | null
          file_url: string
          id?: string
          is_active?: boolean | null
          mime_type?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          asset_name?: string
          asset_type?: string
          created_at?: string | null
          file_size?: number | null
          file_url?: string
          id?: string
          is_active?: boolean | null
          mime_type?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      corporate_accounts: {
        Row: {
          address: string | null
          billing_address: string | null
          city: string | null
          company_name: string
          contact_person: string | null
          country: string | null
          created_at: string | null
          credit_limit: number | null
          current_balance: number | null
          discount_rate: number | null
          email: string | null
          id: string
          notes: string | null
          payment_terms: number | null
          phone: string | null
          postal_code: string | null
          status: string | null
          tax_id: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          billing_address?: string | null
          city?: string | null
          company_name: string
          contact_person?: string | null
          country?: string | null
          created_at?: string | null
          credit_limit?: number | null
          current_balance?: number | null
          discount_rate?: number | null
          email?: string | null
          id?: string
          notes?: string | null
          payment_terms?: number | null
          phone?: string | null
          postal_code?: string | null
          status?: string | null
          tax_id?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          billing_address?: string | null
          city?: string | null
          company_name?: string
          contact_person?: string | null
          country?: string | null
          created_at?: string | null
          credit_limit?: number | null
          current_balance?: number | null
          discount_rate?: number | null
          email?: string | null
          id?: string
          notes?: string | null
          payment_terms?: number | null
          phone?: string | null
          postal_code?: string | null
          status?: string | null
          tax_id?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      currency_settings: {
        Row: {
          base_currency: string
          created_at: string | null
          currency_position: string | null
          currency_symbol: string | null
          decimal_places: number | null
          decimal_separator: string | null
          exchange_rates: Json | null
          id: string
          last_updated: string | null
          supported_currencies: Json | null
          tenant_id: string
          thousands_separator: string | null
          updated_at: string | null
        }
        Insert: {
          base_currency?: string
          created_at?: string | null
          currency_position?: string | null
          currency_symbol?: string | null
          decimal_places?: number | null
          decimal_separator?: string | null
          exchange_rates?: Json | null
          id?: string
          last_updated?: string | null
          supported_currencies?: Json | null
          tenant_id: string
          thousands_separator?: string | null
          updated_at?: string | null
        }
        Update: {
          base_currency?: string
          created_at?: string | null
          currency_position?: string | null
          currency_symbol?: string | null
          decimal_places?: number | null
          decimal_separator?: string | null
          exchange_rates?: Json | null
          id?: string
          last_updated?: string | null
          supported_currencies?: Json | null
          tenant_id?: string
          thousands_separator?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      debt_tracking: {
        Row: {
          amount_owed: number
          created_at: string | null
          currency: string | null
          due_date: string | null
          folio_id: string | null
          guest_id: string
          id: string
          notes: string | null
          overdue_days: number | null
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          amount_owed: number
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          folio_id?: string | null
          guest_id: string
          id?: string
          notes?: string | null
          overdue_days?: number | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          amount_owed?: number
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          folio_id?: string | null
          guest_id?: string
          id?: string
          notes?: string | null
          overdue_days?: number | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          content: Json | null
          created_at: string | null
          created_by: string | null
          document_type: string
          file_url: string | null
          id: string
          is_active: boolean | null
          name: string
          tenant_id: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          created_by?: string | null
          document_type: string
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          tenant_id: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          created_by?: string | null
          document_type?: string
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          tenant_id?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: []
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
      financial_transactions: {
        Row: {
          account_code: string | null
          amount: number
          category: string
          created_at: string | null
          created_by: string | null
          currency: string | null
          description: string | null
          id: string
          processed_at: string | null
          reference_id: string | null
          reference_type: string | null
          status: string | null
          tenant_id: string
          transaction_type: string
        }
        Insert: {
          account_code?: string | null
          amount: number
          category: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          processed_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string | null
          tenant_id: string
          transaction_type: string
        }
        Update: {
          account_code?: string | null
          amount?: number
          category?: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          processed_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string | null
          tenant_id?: string
          transaction_type?: string
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
            referencedRelation: "occupancy_stats"
            referencedColumns: ["tenant_id"]
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
            referencedRelation: "occupancy_stats"
            referencedColumns: ["tenant_id"]
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
      fuel_logs: {
        Row: {
          cost_per_liter: number | null
          created_at: string | null
          created_by: string | null
          equipment_id: string | null
          fuel_type: string
          id: string
          log_date: string
          notes: string | null
          odometer_reading: number | null
          purpose: string | null
          quantity_liters: number
          tenant_id: string
          total_cost: number | null
        }
        Insert: {
          cost_per_liter?: number | null
          created_at?: string | null
          created_by?: string | null
          equipment_id?: string | null
          fuel_type: string
          id?: string
          log_date: string
          notes?: string | null
          odometer_reading?: number | null
          purpose?: string | null
          quantity_liters: number
          tenant_id: string
          total_cost?: number | null
        }
        Update: {
          cost_per_liter?: number | null
          created_at?: string | null
          created_by?: string | null
          equipment_id?: string | null
          fuel_type?: string
          id?: string
          log_date?: string
          notes?: string | null
          odometer_reading?: number | null
          purpose?: string | null
          quantity_liters?: number
          tenant_id?: string
          total_cost?: number | null
        }
        Relationships: []
      }
      guest_messages: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          message_type: string | null
          metadata: Json | null
          qr_order_id: string
          sender_id: string | null
          sender_type: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          message_type?: string | null
          metadata?: Json | null
          qr_order_id: string
          sender_id?: string | null
          sender_type: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          message_type?: string | null
          metadata?: Json | null
          qr_order_id?: string
          sender_id?: string | null
          sender_type?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_messages_qr_order_id_fkey"
            columns: ["qr_order_id"]
            isOneToOne: false
            referencedRelation: "qr_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_sessions: {
        Row: {
          created_at: string | null
          device_info: Json | null
          expires_at: string
          guest_email: string | null
          guest_phone: string | null
          id: string
          is_active: boolean | null
          last_activity_at: string | null
          qr_code_id: string | null
          request_count: number | null
          room_id: string | null
          session_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          expires_at: string
          guest_email?: string | null
          guest_phone?: string | null
          id?: string
          is_active?: boolean | null
          last_activity_at?: string | null
          qr_code_id?: string | null
          request_count?: number | null
          room_id?: string | null
          session_id?: string
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          expires_at?: string
          guest_email?: string | null
          guest_phone?: string | null
          id?: string
          is_active?: boolean | null
          last_activity_at?: string | null
          qr_code_id?: string | null
          request_count?: number | null
          room_id?: string | null
          session_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_guest_sessions_qr_code"
            columns: ["qr_code_id"]
            isOneToOne: false
            referencedRelation: "qr_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_guest_sessions_room"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_guest_sessions_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "occupancy_stats"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "fk_guest_sessions_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      guests: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          first_name: string
          guest_id_number: string | null
          id: string
          id_number: string | null
          id_type: string | null
          last_name: string
          last_stay_date: string | null
          nationality: string | null
          notes: string | null
          phone: string | null
          postal_code: string | null
          preferences: Json | null
          tenant_id: string
          total_spent: number | null
          total_stays: number | null
          updated_at: string | null
          vip_status: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name: string
          guest_id_number?: string | null
          id?: string
          id_number?: string | null
          id_type?: string | null
          last_name: string
          last_stay_date?: string | null
          nationality?: string | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          preferences?: Json | null
          tenant_id: string
          total_spent?: number | null
          total_stays?: number | null
          updated_at?: string | null
          vip_status?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name?: string
          guest_id_number?: string | null
          id?: string
          id_number?: string | null
          id_type?: string | null
          last_name?: string
          last_stay_date?: string | null
          nationality?: string | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          preferences?: Json | null
          tenant_id?: string
          total_spent?: number | null
          total_stays?: number | null
          updated_at?: string | null
          vip_status?: string | null
        }
        Relationships: []
      }
      hotel_settings: {
        Row: {
          amenities: Json | null
          cancellation_policy: Json | null
          check_in_time: string | null
          check_out_time: string | null
          contact_info: Json | null
          created_at: string | null
          default_currency: string | null
          early_checkin_fee: number | null
          house_rules: Json | null
          id: string
          late_checkout_fee: number | null
          service_charge_rate: number | null
          tax_rate: number | null
          tenant_id: string
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          amenities?: Json | null
          cancellation_policy?: Json | null
          check_in_time?: string | null
          check_out_time?: string | null
          contact_info?: Json | null
          created_at?: string | null
          default_currency?: string | null
          early_checkin_fee?: number | null
          house_rules?: Json | null
          id?: string
          late_checkout_fee?: number | null
          service_charge_rate?: number | null
          tax_rate?: number | null
          tenant_id: string
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          amenities?: Json | null
          cancellation_policy?: Json | null
          check_in_time?: string | null
          check_out_time?: string | null
          contact_info?: Json | null
          created_at?: string | null
          default_currency?: string | null
          early_checkin_fee?: number | null
          house_rules?: Json | null
          id?: string
          late_checkout_fee?: number | null
          service_charge_rate?: number | null
          tax_rate?: number | null
          tenant_id?: string
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
            referencedRelation: "occupancy_stats"
            referencedColumns: ["tenant_id"]
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
      impersonations: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          impersonated_user_id: string
          original_user_id: string
          reason: string
          session_token: string
          started_at: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          impersonated_user_id: string
          original_user_id: string
          reason: string
          session_token: string
          started_at?: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          impersonated_user_id?: string
          original_user_id?: string
          reason?: string
          session_token?: string
          started_at?: string
        }
        Relationships: []
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
            referencedRelation: "occupancy_stats"
            referencedColumns: ["tenant_id"]
          },
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
            referencedRelation: "occupancy_stats"
            referencedColumns: ["tenant_id"]
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
            referencedRelation: "occupancy_stats"
            referencedColumns: ["tenant_id"]
          },
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
            referencedRelation: "occupancy_stats"
            referencedColumns: ["tenant_id"]
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
            referencedRelation: "occupancy_stats"
            referencedColumns: ["tenant_id"]
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
            referencedRelation: "occupancy_stats"
            referencedColumns: ["tenant_id"]
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
      power_logs: {
        Row: {
          consumption_kwh: number | null
          cost_per_kwh: number | null
          created_at: string | null
          created_by: string | null
          id: string
          meter_id: string | null
          meter_reading: number
          notes: string | null
          reading_date: string
          tenant_id: string
          total_cost: number | null
        }
        Insert: {
          consumption_kwh?: number | null
          cost_per_kwh?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          meter_id?: string | null
          meter_reading: number
          notes?: string | null
          reading_date: string
          tenant_id: string
          total_cost?: number | null
        }
        Update: {
          consumption_kwh?: number | null
          cost_per_kwh?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          meter_id?: string | null
          meter_reading?: number
          notes?: string | null
          reading_date?: string
          tenant_id?: string
          total_cost?: number | null
        }
        Relationships: []
      }
      qr_analytics: {
        Row: {
          created_at: string | null
          id: string
          last_scanned_at: string | null
          meta: Json | null
          period: string
          qr_code_id: string | null
          request_count: number | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_scanned_at?: string | null
          meta?: Json | null
          period: string
          qr_code_id?: string | null
          request_count?: number | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_scanned_at?: string | null
          meta?: Json | null
          period?: string
          qr_code_id?: string | null
          request_count?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_analytics_qr_code_id_fkey"
            columns: ["qr_code_id"]
            isOneToOne: false
            referencedRelation: "qr_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      qr_codes: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          label: string | null
          qr_code_url: string | null
          qr_token: string
          room_id: string | null
          scan_type: string | null
          services: string[]
          slug: string | null
          template_id: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          label?: string | null
          qr_code_url?: string | null
          qr_token: string
          room_id?: string | null
          scan_type?: string | null
          services: string[]
          slug?: string | null
          template_id?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          label?: string | null
          qr_code_url?: string | null
          qr_token?: string
          room_id?: string | null
          scan_type?: string | null
          services?: string[]
          slug?: string | null
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
            referencedRelation: "occupancy_stats"
            referencedColumns: ["tenant_id"]
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
          assigned_team: string | null
          assigned_to: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          created_by_guest: boolean | null
          guest_session_id: string | null
          id: string
          notes: string | null
          priority: number | null
          qr_code_id: string
          request_details: Json | null
          room_id: string | null
          service_type: string
          session_id: string | null
          status: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_team?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          created_by_guest?: boolean | null
          guest_session_id?: string | null
          id?: string
          notes?: string | null
          priority?: number | null
          qr_code_id: string
          request_details?: Json | null
          room_id?: string | null
          service_type: string
          session_id?: string | null
          status?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_team?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          created_by_guest?: boolean | null
          guest_session_id?: string | null
          id?: string
          notes?: string | null
          priority?: number | null
          qr_code_id?: string
          request_details?: Json | null
          room_id?: string | null
          service_type?: string
          session_id?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_qr_orders_session"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "guest_sessions"
            referencedColumns: ["session_id"]
          },
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
            referencedRelation: "occupancy_stats"
            referencedColumns: ["tenant_id"]
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
      qr_request_messages: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          message_payload: Json | null
          request_id: string
          sender_id: string | null
          sender_role: string
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          message_payload?: Json | null
          request_id: string
          sender_id?: string | null
          sender_role: string
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          message_payload?: Json | null
          request_id?: string
          sender_id?: string | null
          sender_role?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_request_messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "qr_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      qr_services: {
        Row: {
          config: Json | null
          created_at: string | null
          default_route: string | null
          display_name: string
          id: string
          is_global: boolean | null
          name: string
          requires_payment: boolean | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          default_route?: string | null
          display_name: string
          id?: string
          is_global?: boolean | null
          name: string
          requires_payment?: boolean | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          default_route?: string | null
          display_name?: string
          id?: string
          is_global?: boolean | null
          name?: string
          requires_payment?: boolean | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      qr_session_settings: {
        Row: {
          allow_session_extension: boolean | null
          created_at: string | null
          enable_session_resume: boolean | null
          id: string
          max_requests_per_hour: number | null
          require_phone_email: boolean | null
          session_lifetime_hours: number
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          allow_session_extension?: boolean | null
          created_at?: string | null
          enable_session_resume?: boolean | null
          id?: string
          max_requests_per_hour?: number | null
          require_phone_email?: boolean | null
          session_lifetime_hours?: number
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          allow_session_extension?: boolean | null
          created_at?: string | null
          enable_session_resume?: boolean | null
          id?: string
          max_requests_per_hour?: number | null
          require_phone_email?: boolean | null
          session_lifetime_hours?: number
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      qr_settings: {
        Row: {
          created_at: string | null
          default_services: string[] | null
          front_desk_phone: string | null
          hotel_logo_url: string | null
          hotel_name: string
          id: string
          primary_color: string | null
          show_logo_on_qr: boolean | null
          tenant_id: string
          theme: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_services?: string[] | null
          front_desk_phone?: string | null
          hotel_logo_url?: string | null
          hotel_name: string
          id?: string
          primary_color?: string | null
          show_logo_on_qr?: boolean | null
          tenant_id: string
          theme?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_services?: string[] | null
          front_desk_phone?: string | null
          hotel_logo_url?: string | null
          hotel_name?: string
          id?: string
          primary_color?: string | null
          show_logo_on_qr?: boolean | null
          tenant_id?: string
          theme?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
            referencedRelation: "occupancy_stats"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "qr_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      rate_plans: {
        Row: {
          adjustment: number
          adjustment_type: string
          advance_booking: number | null
          base_rate: number
          corporate_code: string | null
          created_at: string | null
          description: string | null
          end_date: string
          final_rate: number
          id: string
          is_active: boolean | null
          max_stay: number | null
          min_stay: number | null
          name: string
          restrictions: string[] | null
          room_type_id: string | null
          start_date: string
          tenant_id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          adjustment?: number
          adjustment_type: string
          advance_booking?: number | null
          base_rate: number
          corporate_code?: string | null
          created_at?: string | null
          description?: string | null
          end_date: string
          final_rate: number
          id?: string
          is_active?: boolean | null
          max_stay?: number | null
          min_stay?: number | null
          name: string
          restrictions?: string[] | null
          room_type_id?: string | null
          start_date: string
          tenant_id: string
          type: string
          updated_at?: string | null
        }
        Update: {
          adjustment?: number
          adjustment_type?: string
          advance_booking?: number | null
          base_rate?: number
          corporate_code?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string
          final_rate?: number
          id?: string
          is_active?: boolean | null
          max_stay?: number | null
          min_stay?: number | null
          name?: string
          restrictions?: string[] | null
          room_type_id?: string | null
          start_date?: string
          tenant_id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rate_plans_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
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
          guest_id: string | null
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
          guest_id?: string | null
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
          guest_id?: string | null
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
            foreignKeyName: "reservations_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
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
            referencedRelation: "occupancy_stats"
            referencedColumns: ["tenant_id"]
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
            referencedRelation: "occupancy_stats"
            referencedColumns: ["tenant_id"]
          },
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
            referencedRelation: "occupancy_stats"
            referencedColumns: ["tenant_id"]
          },
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
            referencedRelation: "occupancy_stats"
            referencedColumns: ["tenant_id"]
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
      salary_payments: {
        Row: {
          approved_by: string | null
          created_at: string | null
          deductions: number | null
          gross_amount: number
          id: string
          net_amount: number
          notes: string | null
          paid_by: string | null
          payment_date: string | null
          payment_method: string | null
          payment_period_end: string
          payment_period_start: string
          payment_reference: string | null
          receipt_url: string | null
          status: string | null
          tenant_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string | null
          deductions?: number | null
          gross_amount: number
          id?: string
          net_amount: number
          notes?: string | null
          paid_by?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_period_end: string
          payment_period_start: string
          payment_reference?: string | null
          receipt_url?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string | null
          deductions?: number | null
          gross_amount?: number
          id?: string
          net_amount?: number
          notes?: string | null
          paid_by?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_period_end?: string
          payment_period_start?: string
          payment_reference?: string | null
          receipt_url?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "salary_payments_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_payments_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_financials: {
        Row: {
          account_name: string | null
          account_number: string | null
          annual_salary: number | null
          bank_name: string | null
          created_at: string | null
          created_by: string | null
          effective_date: string | null
          employment_type: string | null
          hourly_rate: number | null
          id: string
          monthly_salary: number | null
          payment_method: string | null
          salary_amount: number | null
          salary_currency: string | null
          salary_grade: string | null
          status: string | null
          tenant_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          annual_salary?: number | null
          bank_name?: string | null
          created_at?: string | null
          created_by?: string | null
          effective_date?: string | null
          employment_type?: string | null
          hourly_rate?: number | null
          id?: string
          monthly_salary?: number | null
          payment_method?: string | null
          salary_amount?: number | null
          salary_currency?: string | null
          salary_grade?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          annual_salary?: number | null
          bank_name?: string | null
          created_at?: string | null
          created_by?: string | null
          effective_date?: string | null
          employment_type?: string | null
          hourly_rate?: number | null
          id?: string
          monthly_salary?: number | null
          payment_method?: string | null
          salary_amount?: number | null
          salary_currency?: string | null
          salary_grade?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_financials_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_financials_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_salary_audit: {
        Row: {
          approval_stage: string | null
          approved_at: string | null
          approved_by: string | null
          change_reason: string | null
          created_at: string | null
          created_by: string | null
          effective_date: string | null
          id: string
          new_salary: number | null
          old_salary: number | null
          tenant_id: string
          user_id: string
        }
        Insert: {
          approval_stage?: string | null
          approved_at?: string | null
          approved_by?: string | null
          change_reason?: string | null
          created_at?: string | null
          created_by?: string | null
          effective_date?: string | null
          id?: string
          new_salary?: number | null
          old_salary?: number | null
          tenant_id: string
          user_id: string
        }
        Update: {
          approval_stage?: string | null
          approved_at?: string | null
          approved_by?: string | null
          change_reason?: string | null
          created_at?: string | null
          created_by?: string | null
          effective_date?: string | null
          id?: string
          new_salary?: number | null
          old_salary?: number | null
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_salary_audit_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_salary_audit_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_salary_audit_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
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
            referencedRelation: "occupancy_stats"
            referencedColumns: ["tenant_id"]
          },
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
            referencedRelation: "occupancy_stats"
            referencedColumns: ["tenant_id"]
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
          account_number: string | null
          address: string | null
          bank_name: string | null
          certifications: Json | null
          created_at: string | null
          date_of_birth: string | null
          department: string | null
          drivers_license: string | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          employee_id: string | null
          employment_type: string | null
          force_reset: boolean | null
          hire_date: string | null
          id: string
          invitation_status: string | null
          invited_at: string | null
          invited_by: string | null
          is_active: boolean | null
          is_platform_owner: boolean | null
          last_login: string | null
          medical_conditions: string | null
          name: string | null
          nationality: string | null
          next_of_kin_name: string | null
          next_of_kin_phone: string | null
          next_of_kin_relationship: string | null
          nin: string | null
          passport_number: string | null
          phone: string | null
          profile_picture_url: string | null
          role: string
          role_id: string | null
          salary_range: string | null
          shift_end: string | null
          shift_start: string | null
          skills: Json | null
          temp_expires: string | null
          temp_password_hash: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          account_number?: string | null
          address?: string | null
          bank_name?: string | null
          certifications?: Json | null
          created_at?: string | null
          date_of_birth?: string | null
          department?: string | null
          drivers_license?: string | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          employee_id?: string | null
          employment_type?: string | null
          force_reset?: boolean | null
          hire_date?: string | null
          id?: string
          invitation_status?: string | null
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          is_platform_owner?: boolean | null
          last_login?: string | null
          medical_conditions?: string | null
          name?: string | null
          nationality?: string | null
          next_of_kin_name?: string | null
          next_of_kin_phone?: string | null
          next_of_kin_relationship?: string | null
          nin?: string | null
          passport_number?: string | null
          phone?: string | null
          profile_picture_url?: string | null
          role: string
          role_id?: string | null
          salary_range?: string | null
          shift_end?: string | null
          shift_start?: string | null
          skills?: Json | null
          temp_expires?: string | null
          temp_password_hash?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          account_number?: string | null
          address?: string | null
          bank_name?: string | null
          certifications?: Json | null
          created_at?: string | null
          date_of_birth?: string | null
          department?: string | null
          drivers_license?: string | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          employee_id?: string | null
          employment_type?: string | null
          force_reset?: boolean | null
          hire_date?: string | null
          id?: string
          invitation_status?: string | null
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          is_platform_owner?: boolean | null
          last_login?: string | null
          medical_conditions?: string | null
          name?: string | null
          nationality?: string | null
          next_of_kin_name?: string | null
          next_of_kin_phone?: string | null
          next_of_kin_relationship?: string | null
          nin?: string | null
          passport_number?: string | null
          phone?: string | null
          profile_picture_url?: string | null
          role?: string
          role_id?: string | null
          salary_range?: string | null
          shift_end?: string | null
          shift_start?: string | null
          skills?: Json | null
          temp_expires?: string | null
          temp_password_hash?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_users_invited_by"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "occupancy_stats"
            referencedColumns: ["tenant_id"]
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
      utility_costs: {
        Row: {
          budget_amount: number | null
          cost_month: string
          created_at: string | null
          electricity_cost: number | null
          fuel_cost: number | null
          gas_cost: number | null
          id: string
          other_utilities: Json | null
          tenant_id: string
          total_cost: number | null
          updated_at: string | null
          variance: number | null
          water_cost: number | null
        }
        Insert: {
          budget_amount?: number | null
          cost_month: string
          created_at?: string | null
          electricity_cost?: number | null
          fuel_cost?: number | null
          gas_cost?: number | null
          id?: string
          other_utilities?: Json | null
          tenant_id: string
          total_cost?: number | null
          updated_at?: string | null
          variance?: number | null
          water_cost?: number | null
        }
        Update: {
          budget_amount?: number | null
          cost_month?: string
          created_at?: string | null
          electricity_cost?: number | null
          fuel_cost?: number | null
          gas_cost?: number | null
          id?: string
          other_utilities?: Json | null
          tenant_id?: string
          total_cost?: number | null
          updated_at?: string | null
          variance?: number | null
          water_cost?: number | null
        }
        Relationships: []
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
            referencedRelation: "occupancy_stats"
            referencedColumns: ["tenant_id"]
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
      guest_stats_monthly: {
        Row: {
          avg_reservation_value: number | null
          avg_stay_length: number | null
          month_year: string | null
          repeat_guests: number | null
          retention_rate: number | null
          tenant_id: string | null
          total_reservations: number | null
          total_revenue: number | null
          unique_guests: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "occupancy_stats"
            referencedColumns: ["tenant_id"]
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
      mv_daily_revenue_by_tenant: {
        Row: {
          avg_revenue_per_reservation: number | null
          reservation_count: number | null
          revenue_date: string | null
          tenant_id: string | null
          total_revenue: number | null
          unique_guests: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "occupancy_stats"
            referencedColumns: ["tenant_id"]
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
      occupancy_stats: {
        Row: {
          month_year: string | null
          occupancy_rate: number | null
          occupied_rooms: number | null
          stat_date: string | null
          tenant_id: string | null
          total_rooms: number | null
          week_start: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_access_tenant: {
        Args: { tenant_uuid: string }
        Returns: boolean
      }
      check_room_availability: {
        Args: {
          p_check_in_date: string
          p_check_out_date: string
          p_exclude_reservation_id?: string
          p_room_id: string
          p_tenant_id: string
        }
        Returns: boolean
      }
      create_default_tenant_roles: {
        Args: { tenant_uuid: string }
        Returns: undefined
      }
      create_guest_session: {
        Args: {
          p_device_info?: Json
          p_qr_code_id: string
          p_room_id?: string
          p_tenant_id: string
        }
        Returns: string
      }
      create_reservation_atomic: {
        Args: {
          p_guest_data: Json
          p_reservation_data: Json
          p_tenant_id: string
        }
        Returns: Json
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
      fn_adr: {
        Args: { end_date?: string; start_date?: string; tenant_uuid: string }
        Returns: number
      }
      fn_daily_revenue: {
        Args: { end_date?: string; start_date?: string; tenant_uuid: string }
        Returns: {
          available_rooms: number
          occupancy_rate: number
          occupied_rooms: number
          payment_revenue: number
          revenue_date: string
          room_revenue: number
          total_revenue: number
        }[]
      }
      fn_revpar: {
        Args: { end_date?: string; start_date?: string; tenant_uuid: string }
        Returns: number
      }
      get_available_rooms: {
        Args: {
          p_check_in_date: string
          p_check_out_date: string
          p_room_type_id?: string
          p_tenant_id: string
        }
        Returns: {
          base_rate: number
          max_occupancy: number
          room_id: string
          room_number: string
          room_type_name: string
        }[]
      }
      get_daily_revenue: {
        Args: {
          p_end_date?: string
          p_start_date?: string
          p_tenant_id: string
        }
        Returns: {
          avg_revenue_per_reservation: number
          reservation_count: number
          revenue_date: string
          total_revenue: number
          unique_guests: number
        }[]
      }
      get_folio_balances: {
        Args: { p_status?: string; p_tenant_id: string }
        Returns: {
          balance: number
          created_at: string
          folio_id: string
          folio_number: string
          guest_name: string
          reservation_id: string
          room_number: string
          status: string
          total_charges: number
          total_payments: number
        }[]
      }
      get_guest_stats: {
        Args: { p_months_back?: number; p_tenant_id: string }
        Returns: {
          avg_reservation_value: number
          avg_stay_length: number
          month_year: string
          repeat_guests: number
          retention_rate: number
          total_reservations: number
          total_revenue: number
          unique_guests: number
        }[]
      }
      get_occupancy_stats: {
        Args: {
          p_end_date?: string
          p_start_date?: string
          p_tenant_id: string
        }
        Returns: {
          occupancy_rate: number
          occupied_rooms: number
          stat_date: string
          total_rooms: number
        }[]
      }
      get_qr_portal_info: {
        Args: { p_tenant_id: string }
        Returns: {
          hotel_logo_url: string
          hotel_name: string
          primary_color: string
          theme: string
        }[]
      }
      get_revenue_by_payment_method: {
        Args: {
          p_end_date?: string
          p_start_date?: string
          p_tenant_id: string
        }
        Returns: {
          avg_transaction_amount: number
          payment_date: string
          payment_method: string
          total_amount: number
          transaction_count: number
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
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_super_admin_direct: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      refresh_reporting_views: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_revenue_views: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      strict_tenant_access: {
        Args: { target_tenant_id: string }
        Returns: boolean
      }
      validate_guest_session: {
        Args: { p_increment_count?: boolean; p_session_id: string }
        Returns: {
          expires_at: string
          guest_email: string
          guest_phone: string
          is_valid: boolean
          qr_code_id: string
          room_id: string
          tenant_id: string
        }[]
      }
      validate_qr_token_public: {
        Args: { token_input: string }
        Returns: {
          hotel_name: string
          is_valid: boolean
          location_type: string
          room_id: string
          services: string[]
          tenant_id: string
        }[]
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
