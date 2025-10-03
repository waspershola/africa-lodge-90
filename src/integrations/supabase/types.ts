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
      addons: {
        Row: {
          addon_type: string
          billing_interval: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_recurring: boolean | null
          metadata: Json | null
          name: string
          price: number
          sms_credits_bonus: number | null
          updated_at: string | null
        }
        Insert: {
          addon_type: string
          billing_interval?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_recurring?: boolean | null
          metadata?: Json | null
          name: string
          price: number
          sms_credits_bonus?: number | null
          updated_at?: string | null
        }
        Update: {
          addon_type?: string
          billing_interval?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_recurring?: boolean | null
          metadata?: Json | null
          name?: string
          price?: number
          sms_credits_bonus?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      audio_preferences: {
        Row: {
          created_at: string | null
          id: string
          notification_sounds: boolean | null
          payment_sound: boolean | null
          qr_request_sound: boolean | null
          sound_theme: string | null
          tenant_id: string
          updated_at: string | null
          urgent_alert_sound: boolean | null
          user_id: string
          volume_level: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notification_sounds?: boolean | null
          payment_sound?: boolean | null
          qr_request_sound?: boolean | null
          sound_theme?: string | null
          tenant_id: string
          updated_at?: string | null
          urgent_alert_sound?: boolean | null
          user_id: string
          volume_level?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notification_sounds?: boolean | null
          payment_sound?: boolean | null
          qr_request_sound?: boolean | null
          sound_theme?: string | null
          tenant_id?: string
          updated_at?: string | null
          urgent_alert_sound?: boolean | null
          user_id?: string
          volume_level?: number | null
        }
        Relationships: []
      }
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
      auto_cancel_policies: {
        Row: {
          applies_to: string[] | null
          created_at: string | null
          deposit_percentage: number | null
          id: string
          is_active: boolean | null
          no_show_grace_hours: number | null
          policy_name: string
          requires_deposit: boolean | null
          room_type_id: string | null
          tenant_id: string
          unpaid_cancel_hours: number | null
          unverified_cancel_hours: number | null
          updated_at: string | null
        }
        Insert: {
          applies_to?: string[] | null
          created_at?: string | null
          deposit_percentage?: number | null
          id?: string
          is_active?: boolean | null
          no_show_grace_hours?: number | null
          policy_name: string
          requires_deposit?: boolean | null
          room_type_id?: string | null
          tenant_id: string
          unpaid_cancel_hours?: number | null
          unverified_cancel_hours?: number | null
          updated_at?: string | null
        }
        Update: {
          applies_to?: string[] | null
          created_at?: string | null
          deposit_percentage?: number | null
          id?: string
          is_active?: boolean | null
          no_show_grace_hours?: number | null
          policy_name?: string
          requires_deposit?: boolean | null
          room_type_id?: string | null
          tenant_id?: string
          unpaid_cancel_hours?: number | null
          unverified_cancel_hours?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      background_job_logs: {
        Row: {
          completed_at: string | null
          error_message: string | null
          execution_time_ms: number | null
          id: string
          job_name: string
          metadata: Json | null
          rows_affected: number | null
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          job_name: string
          metadata?: Json | null
          rows_affected?: number | null
          started_at?: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          job_name?: string
          metadata?: Json | null
          rows_affected?: number | null
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      billing_ledger: {
        Row: {
          amount: number
          created_at: string
          description: string
          folio_id: string
          id: string
          metadata: Json | null
          reference_id: string | null
          reference_type: string | null
          tenant_id: string
          transaction_type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          folio_id: string
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          tenant_id: string
          transaction_type: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          folio_id?: string
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          tenant_id?: string
          transaction_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_ledger_folio_id_fkey"
            columns: ["folio_id"]
            isOneToOne: false
            referencedRelation: "folio_balances"
            referencedColumns: ["folio_id"]
          },
          {
            foreignKeyName: "billing_ledger_folio_id_fkey"
            columns: ["folio_id"]
            isOneToOne: false
            referencedRelation: "folios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_ledger_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "occupancy_stats"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "billing_ledger_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "billing_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_verification: {
        Row: {
          attempts_count: number | null
          created_at: string | null
          expires_at: string
          guest_id: string
          id: string
          metadata: Json | null
          reservation_id: string
          tenant_id: string
          updated_at: string | null
          verification_code: string | null
          verification_status: string | null
          verification_type: string
          verified_at: string | null
        }
        Insert: {
          attempts_count?: number | null
          created_at?: string | null
          expires_at: string
          guest_id: string
          id?: string
          metadata?: Json | null
          reservation_id: string
          tenant_id: string
          updated_at?: string | null
          verification_code?: string | null
          verification_status?: string | null
          verification_type: string
          verified_at?: string | null
        }
        Update: {
          attempts_count?: number | null
          created_at?: string | null
          expires_at?: string
          guest_id?: string
          id?: string
          metadata?: Json | null
          reservation_id?: string
          tenant_id?: string
          updated_at?: string | null
          verification_code?: string | null
          verification_status?: string | null
          verification_type?: string
          verified_at?: string | null
        }
        Relationships: []
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
          tax_exempt: boolean | null
          tax_exempt_reason: string | null
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
          tax_exempt?: boolean | null
          tax_exempt_reason?: string | null
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
          tax_exempt?: boolean | null
          tax_exempt_reason?: string | null
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
      demo_config: {
        Row: {
          created_at: string
          cta_text: string
          description: string
          enabled: boolean
          id: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string
        }
        Insert: {
          created_at?: string
          cta_text?: string
          description?: string
          enabled?: boolean
          id?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string
        }
        Update: {
          created_at?: string
          cta_text?: string
          description?: string
          enabled?: boolean
          id?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string
        }
        Relationships: []
      }
      devices: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          location: string | null
          metadata: Json | null
          slug: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          metadata?: Json | null
          slug: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          metadata?: Json | null
          slug?: string
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
      dynamic_pricing_settings: {
        Row: {
          competitor_sync: boolean
          created_at: string
          demand_forecast: boolean
          event_integration: boolean
          id: string
          is_enabled: boolean
          max_price_decrease: number
          max_price_increase: number
          tenant_id: string
          update_frequency: number
          updated_at: string
        }
        Insert: {
          competitor_sync?: boolean
          created_at?: string
          demand_forecast?: boolean
          event_integration?: boolean
          id?: string
          is_enabled?: boolean
          max_price_decrease?: number
          max_price_increase?: number
          tenant_id: string
          update_frequency?: number
          updated_at?: string
        }
        Update: {
          competitor_sync?: boolean
          created_at?: string
          demand_forecast?: boolean
          event_integration?: boolean
          id?: string
          is_enabled?: boolean
          max_price_decrease?: number
          max_price_increase?: number
          tenant_id?: string
          update_frequency?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_provider_logs: {
        Row: {
          created_at: string
          email_type: string
          error_message: string | null
          id: string
          metadata: Json | null
          provider: string
          recipient_email: string
          sent_at: string | null
          status: string
          subject: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          email_type: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          provider: string
          recipient_email: string
          sent_at?: string | null
          status?: string
          subject?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          email_type?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          provider?: string
          recipient_email?: string
          sent_at?: string | null
          status?: string
          subject?: string | null
          tenant_id?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          created_at: string | null
          html_template: string
          id: string
          is_active: boolean | null
          subject_template: string
          template_type: string
          tenant_id: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          created_at?: string | null
          html_template: string
          id?: string
          is_active?: boolean | null
          subject_template: string
          template_type: string
          tenant_id: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          created_at?: string | null
          html_template?: string
          id?: string
          is_active?: boolean | null
          subject_template?: string
          template_type?: string
          tenant_id?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      emergency_access_attempts: {
        Row: {
          attempt_type: string
          created_at: string | null
          device_fingerprint: Json | null
          failure_reason: string | null
          id: string
          ip_address: unknown | null
          success: boolean
          user_agent: string | null
          user_id: string | null
          verification_data: Json | null
        }
        Insert: {
          attempt_type: string
          created_at?: string | null
          device_fingerprint?: Json | null
          failure_reason?: string | null
          id?: string
          ip_address?: unknown | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
          verification_data?: Json | null
        }
        Update: {
          attempt_type?: string
          created_at?: string | null
          device_fingerprint?: Json | null
          failure_reason?: string | null
          id?: string
          ip_address?: unknown | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
          verification_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "emergency_access_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
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
          base_amount: number | null
          charge_type: string
          created_at: string | null
          description: string
          folio_id: string
          id: string
          is_service_chargeable: boolean | null
          is_taxable: boolean | null
          posted_by: string | null
          reference_id: string | null
          reference_type: string | null
          service_charge_amount: number | null
          tenant_id: string
          vat_amount: number | null
        }
        Insert: {
          amount: number
          base_amount?: number | null
          charge_type: string
          created_at?: string | null
          description: string
          folio_id: string
          id?: string
          is_service_chargeable?: boolean | null
          is_taxable?: boolean | null
          posted_by?: string | null
          reference_id?: string | null
          reference_type?: string | null
          service_charge_amount?: number | null
          tenant_id: string
          vat_amount?: number | null
        }
        Update: {
          amount?: number
          base_amount?: number | null
          charge_type?: string
          created_at?: string | null
          description?: string
          folio_id?: string
          id?: string
          is_service_chargeable?: boolean | null
          is_taxable?: boolean | null
          posted_by?: string | null
          reference_id?: string | null
          reference_type?: string | null
          service_charge_amount?: number | null
          tenant_id?: string
          vat_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "folio_charges_folio_id_fkey"
            columns: ["folio_id"]
            isOneToOne: false
            referencedRelation: "folio_balances"
            referencedColumns: ["folio_id"]
          },
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
      global_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          closed_at: string | null
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          priority: string
          resolved_at: string | null
          status: string
          submitter_id: string | null
          tags: string[] | null
          tenant_id: string | null
          ticket_number: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          closed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          priority?: string
          resolved_at?: string | null
          status?: string
          submitter_id?: string | null
          tags?: string[] | null
          tenant_id?: string | null
          ticket_number: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string
          closed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          priority?: string
          resolved_at?: string | null
          status?: string
          submitter_id?: string | null
          tags?: string[] | null
          tenant_id?: string | null
          ticket_number?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      group_reservations: {
        Row: {
          balance_due: number | null
          check_in_date: string
          check_out_date: string
          created_at: string
          created_by: string | null
          deposit_amount: number | null
          group_code: string | null
          group_name: string
          id: string
          organizer_email: string | null
          organizer_name: string
          organizer_phone: string | null
          payment_mode: string
          special_requests: string | null
          status: string
          tenant_id: string
          total_amount: number
          total_guests: number
          total_rooms: number
          updated_at: string
        }
        Insert: {
          balance_due?: number | null
          check_in_date: string
          check_out_date: string
          created_at?: string
          created_by?: string | null
          deposit_amount?: number | null
          group_code?: string | null
          group_name: string
          id?: string
          organizer_email?: string | null
          organizer_name: string
          organizer_phone?: string | null
          payment_mode?: string
          special_requests?: string | null
          status?: string
          tenant_id: string
          total_amount?: number
          total_guests?: number
          total_rooms?: number
          updated_at?: string
        }
        Update: {
          balance_due?: number | null
          check_in_date?: string
          check_out_date?: string
          created_at?: string
          created_by?: string | null
          deposit_amount?: number | null
          group_code?: string | null
          group_name?: string
          id?: string
          organizer_email?: string | null
          organizer_name?: string
          organizer_phone?: string | null
          payment_mode?: string
          special_requests?: string | null
          status?: string
          tenant_id?: string
          total_amount?: number
          total_guests?: number
          total_rooms?: number
          updated_at?: string
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
          blacklist_reason: string | null
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
          is_blacklisted: boolean | null
          last_name: string
          last_stay_date: string | null
          late_arrival_count: number | null
          nationality: string | null
          no_show_count: number | null
          notes: string | null
          phone: string | null
          postal_code: string | null
          preferences: Json | null
          reliability_score: number | null
          requires_verification: boolean | null
          successful_stays: number | null
          tax_exempt: boolean | null
          tax_exempt_reason: string | null
          tenant_id: string
          total_spent: number | null
          total_stays: number | null
          updated_at: string | null
          vip_status: string | null
        }
        Insert: {
          address?: string | null
          blacklist_reason?: string | null
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
          is_blacklisted?: boolean | null
          last_name: string
          last_stay_date?: string | null
          late_arrival_count?: number | null
          nationality?: string | null
          no_show_count?: number | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          preferences?: Json | null
          reliability_score?: number | null
          requires_verification?: boolean | null
          successful_stays?: number | null
          tax_exempt?: boolean | null
          tax_exempt_reason?: string | null
          tenant_id: string
          total_spent?: number | null
          total_stays?: number | null
          updated_at?: string | null
          vip_status?: string | null
        }
        Update: {
          address?: string | null
          blacklist_reason?: string | null
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
          is_blacklisted?: boolean | null
          last_name?: string
          last_stay_date?: string | null
          late_arrival_count?: number | null
          nationality?: string | null
          no_show_count?: number | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          preferences?: Json | null
          reliability_score?: number | null
          requires_verification?: boolean | null
          successful_stays?: number | null
          tax_exempt?: boolean | null
          tax_exempt_reason?: string | null
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
          email_provider_config: Json | null
          email_settings: Json | null
          front_desk_phone: string | null
          house_rules: Json | null
          id: string
          late_checkout_fee: number | null
          notification_preferences: Json | null
          service_applicable_to: string[] | null
          service_charge_inclusive: boolean | null
          service_charge_rate: number | null
          show_tax_breakdown: boolean | null
          system_provider_id: string | null
          tax_inclusive: boolean | null
          tax_rate: number | null
          tenant_id: string
          timezone: string | null
          updated_at: string | null
          use_system_email: boolean | null
          vat_applicable_to: string[] | null
          zero_rate_hidden: boolean | null
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
          email_provider_config?: Json | null
          email_settings?: Json | null
          front_desk_phone?: string | null
          house_rules?: Json | null
          id?: string
          late_checkout_fee?: number | null
          notification_preferences?: Json | null
          service_applicable_to?: string[] | null
          service_charge_inclusive?: boolean | null
          service_charge_rate?: number | null
          show_tax_breakdown?: boolean | null
          system_provider_id?: string | null
          tax_inclusive?: boolean | null
          tax_rate?: number | null
          tenant_id: string
          timezone?: string | null
          updated_at?: string | null
          use_system_email?: boolean | null
          vat_applicable_to?: string[] | null
          zero_rate_hidden?: boolean | null
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
          email_provider_config?: Json | null
          email_settings?: Json | null
          front_desk_phone?: string | null
          house_rules?: Json | null
          id?: string
          late_checkout_fee?: number | null
          notification_preferences?: Json | null
          service_applicable_to?: string[] | null
          service_charge_inclusive?: boolean | null
          service_charge_rate?: number | null
          show_tax_breakdown?: boolean | null
          system_provider_id?: string | null
          tax_inclusive?: boolean | null
          tax_rate?: number | null
          tenant_id?: string
          timezone?: string | null
          updated_at?: string | null
          use_system_email?: boolean | null
          vat_applicable_to?: string[] | null
          zero_rate_hidden?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "hotel_settings_system_provider_id_fkey"
            columns: ["system_provider_id"]
            isOneToOne: false
            referencedRelation: "system_email_providers"
            referencedColumns: ["id"]
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
      impersonation_logs: {
        Row: {
          actions_performed: Json | null
          created_at: string | null
          ended_at: string | null
          id: string
          impersonator_id: string
          ip_address: unknown | null
          reason: string | null
          session_token: string
          started_at: string
          target_tenant_id: string | null
          target_user_id: string
          user_agent: string | null
        }
        Insert: {
          actions_performed?: Json | null
          created_at?: string | null
          ended_at?: string | null
          id?: string
          impersonator_id: string
          ip_address?: unknown | null
          reason?: string | null
          session_token: string
          started_at?: string
          target_tenant_id?: string | null
          target_user_id: string
          user_agent?: string | null
        }
        Update: {
          actions_performed?: Json | null
          created_at?: string | null
          ended_at?: string | null
          id?: string
          impersonator_id?: string
          ip_address?: unknown | null
          reason?: string | null
          session_token?: string
          started_at?: string
          target_tenant_id?: string | null
          target_user_id?: string
          user_agent?: string | null
        }
        Relationships: []
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
      notification_channels: {
        Row: {
          channel_type: string
          config: Json | null
          created_at: string | null
          error_count: number | null
          id: string
          is_enabled: boolean | null
          last_test_at: string | null
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          channel_type: string
          config?: Json | null
          created_at?: string | null
          error_count?: number | null
          id?: string
          is_enabled?: boolean | null
          last_test_at?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          channel_type?: string
          config?: Json | null
          created_at?: string | null
          error_count?: number | null
          id?: string
          is_enabled?: boolean | null
          last_test_at?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notification_events: {
        Row: {
          channels: string[]
          created_at: string | null
          delivery_results: Json | null
          event_source: string
          event_type: string
          id: string
          max_retries: number | null
          metadata: Json | null
          priority: string
          processed_at: string | null
          recipients: Json
          retry_count: number | null
          scheduled_at: string
          source_id: string | null
          status: string
          template_data: Json
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          channels?: string[]
          created_at?: string | null
          delivery_results?: Json | null
          event_source: string
          event_type: string
          id?: string
          max_retries?: number | null
          metadata?: Json | null
          priority?: string
          processed_at?: string | null
          recipients?: Json
          retry_count?: number | null
          scheduled_at?: string
          source_id?: string | null
          status?: string
          template_data?: Json
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          channels?: string[]
          created_at?: string | null
          delivery_results?: Json | null
          event_source?: string
          event_type?: string
          id?: string
          max_retries?: number | null
          metadata?: Json | null
          priority?: string
          processed_at?: string | null
          recipients?: Json
          retry_count?: number | null
          scheduled_at?: string
          source_id?: string | null
          status?: string
          template_data?: Json
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notification_rules: {
        Row: {
          conditions: Json | null
          created_at: string | null
          event_type: string
          id: string
          is_active: boolean | null
          priority: number | null
          routing_config: Json
          rule_name: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          conditions?: Json | null
          created_at?: string | null
          event_type: string
          id?: string
          is_active?: boolean | null
          priority?: number | null
          routing_config: Json
          rule_name: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          conditions?: Json | null
          created_at?: string | null
          event_type?: string
          id?: string
          is_active?: boolean | null
          priority?: number | null
          routing_config?: Json
          rule_name?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
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
      payment_methods: {
        Row: {
          config: Json | null
          created_at: string | null
          display_order: number | null
          enabled: boolean
          fees: Json | null
          icon: string
          id: string
          name: string
          tenant_id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          display_order?: number | null
          enabled?: boolean
          fees?: Json | null
          icon?: string
          id?: string
          name: string
          tenant_id: string
          type: string
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          display_order?: number | null
          enabled?: boolean
          fees?: Json | null
          icon?: string
          id?: string
          name?: string
          tenant_id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "occupancy_stats"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "payment_methods_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      payment_policies: {
        Row: {
          auto_cancel_hours: number | null
          created_at: string
          deposit_percentage: number
          id: string
          is_default: boolean
          late_payment_fee: number | null
          payment_methods_accepted: Json
          payment_timing: string
          policy_name: string
          requires_deposit: boolean
          tenant_id: string
          updated_at: string
        }
        Insert: {
          auto_cancel_hours?: number | null
          created_at?: string
          deposit_percentage?: number
          id?: string
          is_default?: boolean
          late_payment_fee?: number | null
          payment_methods_accepted?: Json
          payment_timing?: string
          policy_name?: string
          requires_deposit?: boolean
          tenant_id: string
          updated_at?: string
        }
        Update: {
          auto_cancel_hours?: number | null
          created_at?: string
          deposit_percentage?: number
          id?: string
          is_default?: boolean
          late_payment_fee?: number | null
          payment_methods_accepted?: Json
          payment_timing?: string
          policy_name?: string
          requires_deposit?: boolean
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          card_last_four: string | null
          created_at: string | null
          folio_id: string
          id: string
          payment_method: string
          payment_method_id: string | null
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
          payment_method_id?: string | null
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
          payment_method_id?: string | null
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
            referencedRelation: "folio_balances"
            referencedColumns: ["folio_id"]
          },
          {
            foreignKeyName: "payments_folio_id_fkey"
            columns: ["folio_id"]
            isOneToOne: false
            referencedRelation: "folios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
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
      plan_addons: {
        Row: {
          addon_id: string
          created_at: string | null
          id: string
          is_included: boolean | null
          plan_id: string
          quantity: number | null
        }
        Insert: {
          addon_id: string
          created_at?: string | null
          id?: string
          is_included?: boolean | null
          plan_id: string
          quantity?: number | null
        }
        Update: {
          addon_id?: string
          created_at?: string | null
          id?: string
          is_included?: boolean | null
          plan_id?: string
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_addons_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "addons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_addons_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string | null
          features: Json
          id: string
          included_sms_credits: number | null
          max_rooms: number
          max_staff: number
          name: string
          price_annual: number | null
          price_monthly: number
          room_capacity_max: number | null
          room_capacity_min: number | null
          sms_rate_per_credit: number | null
          trial_days: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          features?: Json
          id?: string
          included_sms_credits?: number | null
          max_rooms: number
          max_staff: number
          name: string
          price_annual?: number | null
          price_monthly: number
          room_capacity_max?: number | null
          room_capacity_min?: number | null
          sms_rate_per_credit?: number | null
          trial_days?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          features?: Json
          id?: string
          included_sms_credits?: number | null
          max_rooms?: number
          max_staff?: number
          name?: string
          price_annual?: number | null
          price_monthly?: number
          room_capacity_max?: number | null
          room_capacity_min?: number | null
          sms_rate_per_credit?: number | null
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
            referencedRelation: "folio_balances"
            referencedColumns: ["folio_id"]
          },
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
      pricing_rules: {
        Row: {
          adjustment_type: string
          adjustment_value: number
          created_at: string
          id: string
          is_active: boolean
          max_decrease: number
          max_increase: number
          name: string
          priority: number
          room_categories: string[]
          tenant_id: string
          trigger_condition: string
          trigger_operator: string
          trigger_value: number
          type: string
          updated_at: string
        }
        Insert: {
          adjustment_type: string
          adjustment_value: number
          created_at?: string
          id?: string
          is_active?: boolean
          max_decrease?: number
          max_increase?: number
          name: string
          priority?: number
          room_categories?: string[]
          tenant_id: string
          trigger_condition: string
          trigger_operator: string
          trigger_value: number
          type: string
          updated_at?: string
        }
        Update: {
          adjustment_type?: string
          adjustment_value?: number
          created_at?: string
          id?: string
          is_active?: boolean
          max_decrease?: number
          max_increase?: number
          name?: string
          priority?: number
          room_categories?: string[]
          tenant_id?: string
          trigger_condition?: string
          trigger_operator?: string
          trigger_value?: number
          type?: string
          updated_at?: string
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
      recovery_codes: {
        Row: {
          code_hash: string
          created_at: string | null
          expires_at: string | null
          id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          code_hash: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          code_hash?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      recovery_sessions: {
        Row: {
          completed: boolean | null
          created_at: string | null
          expires_at: string
          id: string
          ip_address: unknown | null
          required_steps: Json
          session_token: string
          steps_completed: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          required_steps?: Json
          session_token: string
          steps_completed?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          required_steps?: Json
          session_token?: string
          steps_completed?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recovery_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reservation_communications: {
        Row: {
          communication_type: string
          content: string | null
          created_at: string
          created_by: string | null
          delivered_at: string | null
          group_reservation_id: string | null
          id: string
          recipient_email: string
          reservation_id: string | null
          sent_at: string | null
          status: string
          subject: string
          tenant_id: string
        }
        Insert: {
          communication_type: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          delivered_at?: string | null
          group_reservation_id?: string | null
          id?: string
          recipient_email: string
          reservation_id?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          tenant_id: string
        }
        Update: {
          communication_type?: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          delivered_at?: string | null
          group_reservation_id?: string | null
          id?: string
          recipient_email?: string
          reservation_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          tenant_id?: string
        }
        Relationships: []
      }
      reservation_invoices: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          due_date: string | null
          id: string
          invoice_number: string
          invoice_type: string
          paid_at: string | null
          payment_instructions: string | null
          reservation_id: string
          sent_at: string | null
          sent_to_email: string | null
          service_charge: number | null
          status: string
          tax_amount: number | null
          tenant_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          invoice_type?: string
          paid_at?: string | null
          payment_instructions?: string | null
          reservation_id: string
          sent_at?: string | null
          sent_to_email?: string | null
          service_charge?: number | null
          status?: string
          tax_amount?: number | null
          tenant_id: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          invoice_type?: string
          paid_at?: string | null
          payment_instructions?: string | null
          reservation_id?: string
          sent_at?: string | null
          sent_to_email?: string | null
          service_charge?: number | null
          status?: string
          tax_amount?: number | null
          tenant_id?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      reservation_status_log: {
        Row: {
          change_reason: string | null
          changed_by: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          new_status: string
          old_status: string | null
          reservation_id: string
          tenant_id: string
        }
        Insert: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          new_status: string
          old_status?: string | null
          reservation_id: string
          tenant_id: string
        }
        Update: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          new_status?: string
          old_status?: string | null
          reservation_id?: string
          tenant_id?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          adults: number | null
          balance_due: number | null
          booking_source: string | null
          cancellation_notes: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          check_in_date: string
          check_out_date: string
          checked_in_at: string | null
          checked_in_by: string | null
          checked_out_at: string | null
          checked_out_by: string | null
          children: number | null
          confirmation_sent_at: string | null
          created_at: string | null
          created_by: string | null
          deposit_amount: number | null
          expires_at: string | null
          grace_period_hours: number | null
          group_reservation_id: string | null
          guest_email: string | null
          guest_id: string | null
          guest_id_number: string | null
          guest_name: string
          guest_phone: string | null
          id: string
          invoice_number: string | null
          is_soft_hold: boolean | null
          payment_deadline: string | null
          payment_due_date: string | null
          payment_policy_id: string | null
          payment_status: string
          refund_amount: number | null
          requires_verification: boolean | null
          reservation_number: string
          room_assignment_at: string | null
          room_id: string
          room_rate: number
          room_type_id: string | null
          special_requests: string | null
          status: string
          tenant_id: string
          total_amount: number | null
          updated_at: string | null
          verification_deadline: string | null
        }
        Insert: {
          adults?: number | null
          balance_due?: number | null
          booking_source?: string | null
          cancellation_notes?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          check_in_date: string
          check_out_date: string
          checked_in_at?: string | null
          checked_in_by?: string | null
          checked_out_at?: string | null
          checked_out_by?: string | null
          children?: number | null
          confirmation_sent_at?: string | null
          created_at?: string | null
          created_by?: string | null
          deposit_amount?: number | null
          expires_at?: string | null
          grace_period_hours?: number | null
          group_reservation_id?: string | null
          guest_email?: string | null
          guest_id?: string | null
          guest_id_number?: string | null
          guest_name: string
          guest_phone?: string | null
          id?: string
          invoice_number?: string | null
          is_soft_hold?: boolean | null
          payment_deadline?: string | null
          payment_due_date?: string | null
          payment_policy_id?: string | null
          payment_status?: string
          refund_amount?: number | null
          requires_verification?: boolean | null
          reservation_number: string
          room_assignment_at?: string | null
          room_id: string
          room_rate: number
          room_type_id?: string | null
          special_requests?: string | null
          status?: string
          tenant_id: string
          total_amount?: number | null
          updated_at?: string | null
          verification_deadline?: string | null
        }
        Update: {
          adults?: number | null
          balance_due?: number | null
          booking_source?: string | null
          cancellation_notes?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          check_in_date?: string
          check_out_date?: string
          checked_in_at?: string | null
          checked_in_by?: string | null
          checked_out_at?: string | null
          checked_out_by?: string | null
          children?: number | null
          confirmation_sent_at?: string | null
          created_at?: string | null
          created_by?: string | null
          deposit_amount?: number | null
          expires_at?: string | null
          grace_period_hours?: number | null
          group_reservation_id?: string | null
          guest_email?: string | null
          guest_id?: string | null
          guest_id_number?: string | null
          guest_name?: string
          guest_phone?: string | null
          id?: string
          invoice_number?: string | null
          is_soft_hold?: boolean | null
          payment_deadline?: string | null
          payment_due_date?: string | null
          payment_policy_id?: string | null
          payment_status?: string
          refund_amount?: number | null
          requires_verification?: boolean | null
          reservation_number?: string
          room_assignment_at?: string | null
          room_id?: string
          room_rate?: number
          room_type_id?: string | null
          special_requests?: string | null
          status?: string
          tenant_id?: string
          total_amount?: number | null
          updated_at?: string | null
          verification_deadline?: string | null
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
      room_type_availability: {
        Row: {
          availability_date: string
          available_count: number
          blocked_count: number
          created_at: string | null
          id: string
          reserved_count: number
          room_type_id: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          availability_date: string
          available_count?: number
          blocked_count?: number
          created_at?: string | null
          id?: string
          reserved_count?: number
          room_type_id: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          availability_date?: string
          available_count?: number
          blocked_count?: number
          created_at?: string | null
          id?: string
          reserved_count?: number
          room_type_id?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      room_types: {
        Row: {
          amenities: string[] | null
          auto_assign_hours: number | null
          available_count: number | null
          base_rate: number
          created_at: string | null
          description: string | null
          grace_period_hours: number | null
          id: string
          max_occupancy: number | null
          name: string
          reserved_count: number | null
          tenant_id: string
          total_count: number | null
        }
        Insert: {
          amenities?: string[] | null
          auto_assign_hours?: number | null
          available_count?: number | null
          base_rate: number
          created_at?: string | null
          description?: string | null
          grace_period_hours?: number | null
          id?: string
          max_occupancy?: number | null
          name: string
          reserved_count?: number | null
          tenant_id: string
          total_count?: number | null
        }
        Update: {
          amenities?: string[] | null
          auto_assign_hours?: number | null
          available_count?: number | null
          base_rate?: number
          created_at?: string | null
          description?: string | null
          grace_period_hours?: number | null
          id?: string
          max_occupancy?: number | null
          name?: string
          reserved_count?: number | null
          tenant_id?: string
          total_count?: number | null
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
          reservation_id: string | null
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
          reservation_id?: string | null
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
          reservation_id?: string | null
          room_number?: string
          room_type_id?: string
          status?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
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
      shift_sessions: {
        Row: {
          authorized_by: string | null
          cash_total: number | null
          created_at: string | null
          device_id: string | null
          end_time: string | null
          handover_notes: string | null
          id: string
          pos_total: number | null
          role: string
          staff_id: string
          start_time: string
          status: string
          tenant_id: string
          unresolved_items: Json | null
          updated_at: string | null
        }
        Insert: {
          authorized_by?: string | null
          cash_total?: number | null
          created_at?: string | null
          device_id?: string | null
          end_time?: string | null
          handover_notes?: string | null
          id?: string
          pos_total?: number | null
          role: string
          staff_id: string
          start_time?: string
          status?: string
          tenant_id: string
          unresolved_items?: Json | null
          updated_at?: string | null
        }
        Update: {
          authorized_by?: string | null
          cash_total?: number | null
          created_at?: string | null
          device_id?: string | null
          end_time?: string | null
          handover_notes?: string | null
          id?: string
          pos_total?: number | null
          role?: string
          staff_id?: string
          start_time?: string
          status?: string
          tenant_id?: string
          unresolved_items?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shift_sessions_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_credits: {
        Row: {
          balance: number | null
          created_at: string | null
          id: string
          last_topup_at: string | null
          tenant_id: string
          total_purchased: number | null
          total_used: number | null
          updated_at: string | null
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          id?: string
          last_topup_at?: string | null
          tenant_id: string
          total_purchased?: number | null
          total_used?: number | null
          updated_at?: string | null
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          id?: string
          last_topup_at?: string | null
          tenant_id?: string
          total_purchased?: number | null
          total_used?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_credits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "occupancy_stats"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "sms_credits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      sms_logs: {
        Row: {
          cost_per_credit: number | null
          created_at: string | null
          credits_used: number
          delivered_at: string | null
          delivery_status: string | null
          error_code: string | null
          event_type: string | null
          id: string
          message_preview: string | null
          provider_id: string | null
          purpose: string | null
          recipient_phone: string | null
          retry_count: number | null
          sent_at: string | null
          source_id: string | null
          source_type: string
          status: string | null
          template_id: string | null
          tenant_id: string
        }
        Insert: {
          cost_per_credit?: number | null
          created_at?: string | null
          credits_used: number
          delivered_at?: string | null
          delivery_status?: string | null
          error_code?: string | null
          event_type?: string | null
          id?: string
          message_preview?: string | null
          provider_id?: string | null
          purpose?: string | null
          recipient_phone?: string | null
          retry_count?: number | null
          sent_at?: string | null
          source_id?: string | null
          source_type: string
          status?: string | null
          template_id?: string | null
          tenant_id: string
        }
        Update: {
          cost_per_credit?: number | null
          created_at?: string | null
          credits_used?: number
          delivered_at?: string | null
          delivery_status?: string | null
          error_code?: string | null
          event_type?: string | null
          id?: string
          message_preview?: string | null
          provider_id?: string | null
          purpose?: string | null
          recipient_phone?: string | null
          retry_count?: number | null
          sent_at?: string | null
          source_id?: string | null
          source_type?: string
          status?: string | null
          template_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_logs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "sms_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "sms_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "occupancy_stats"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "sms_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      sms_notifications_settings: {
        Row: {
          conditions: Json | null
          created_at: string
          delay_minutes: number | null
          event_type: string
          id: string
          is_enabled: boolean
          send_to_guest: boolean
          send_to_staff: boolean
          template_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          conditions?: Json | null
          created_at?: string
          delay_minutes?: number | null
          event_type: string
          id?: string
          is_enabled?: boolean
          send_to_guest?: boolean
          send_to_staff?: boolean
          template_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          conditions?: Json | null
          created_at?: string
          delay_minutes?: number | null
          event_type?: string
          id?: string
          is_enabled?: boolean
          send_to_guest?: boolean
          send_to_staff?: boolean
          template_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_notifications_settings_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "sms_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_providers: {
        Row: {
          api_key: string | null
          api_secret: string | null
          base_url: string | null
          config: Json | null
          cost_per_sms: number | null
          created_at: string
          delivery_rate: number | null
          failover_provider_id: string | null
          health_status: string | null
          id: string
          is_default: boolean
          is_enabled: boolean
          last_health_check: string | null
          name: string
          priority: number
          provider_type: string
          sender_id: string | null
          updated_at: string
        }
        Insert: {
          api_key?: string | null
          api_secret?: string | null
          base_url?: string | null
          config?: Json | null
          cost_per_sms?: number | null
          created_at?: string
          delivery_rate?: number | null
          failover_provider_id?: string | null
          health_status?: string | null
          id?: string
          is_default?: boolean
          is_enabled?: boolean
          last_health_check?: string | null
          name: string
          priority?: number
          provider_type: string
          sender_id?: string | null
          updated_at?: string
        }
        Update: {
          api_key?: string | null
          api_secret?: string | null
          base_url?: string | null
          config?: Json | null
          cost_per_sms?: number | null
          created_at?: string
          delivery_rate?: number | null
          failover_provider_id?: string | null
          health_status?: string | null
          id?: string
          is_default?: boolean
          is_enabled?: boolean
          last_health_check?: string | null
          name?: string
          priority?: number
          provider_type?: string
          sender_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_providers_failover_provider_id_fkey"
            columns: ["failover_provider_id"]
            isOneToOne: false
            referencedRelation: "sms_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_staff_alerts: {
        Row: {
          alert_types: string[] | null
          created_at: string
          id: string
          is_active: boolean
          is_on_duty: boolean
          night_shift: boolean
          phone_number: string
          role: string | null
          shift_end: string | null
          shift_start: string | null
          staff_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          alert_types?: string[] | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_on_duty?: boolean
          night_shift?: boolean
          phone_number: string
          role?: string | null
          shift_end?: string | null
          shift_start?: string | null
          staff_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          alert_types?: string[] | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_on_duty?: boolean
          night_shift?: boolean
          phone_number?: string
          role?: string | null
          shift_end?: string | null
          shift_start?: string | null
          staff_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      sms_templates: {
        Row: {
          allow_tenant_override: boolean
          character_count_warning: boolean | null
          created_at: string
          created_by: string | null
          estimated_sms_count: number | null
          event_type: string
          id: string
          is_active: boolean
          is_global: boolean
          last_synced_at: string | null
          message_template: string
          source_template_id: string | null
          template_name: string
          tenant_id: string | null
          updated_at: string
          variables: Json | null
        }
        Insert: {
          allow_tenant_override?: boolean
          character_count_warning?: boolean | null
          created_at?: string
          created_by?: string | null
          estimated_sms_count?: number | null
          event_type: string
          id?: string
          is_active?: boolean
          is_global?: boolean
          last_synced_at?: string | null
          message_template: string
          source_template_id?: string | null
          template_name: string
          tenant_id?: string | null
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          allow_tenant_override?: boolean
          character_count_warning?: boolean | null
          created_at?: string
          created_by?: string | null
          estimated_sms_count?: number | null
          event_type?: string
          id?: string
          is_active?: boolean
          is_global?: boolean
          last_synced_at?: string | null
          message_template?: string
          source_template_id?: string | null
          template_name?: string
          tenant_id?: string | null
          updated_at?: string
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_source_template"
            columns: ["source_template_id"]
            isOneToOne: false
            referencedRelation: "sms_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_alert_configs: {
        Row: {
          alert_name: string
          alert_type: string
          channels: string[]
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          priority: string
          tenant_id: string
          trigger_conditions: Json | null
          updated_at: string | null
        }
        Insert: {
          alert_name: string
          alert_type: string
          channels?: string[]
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          priority?: string
          tenant_id: string
          trigger_conditions?: Json | null
          updated_at?: string | null
        }
        Update: {
          alert_name?: string
          alert_type?: string
          channels?: string[]
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          priority?: string
          tenant_id?: string
          trigger_conditions?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      staff_alert_subscriptions: {
        Row: {
          alert_type: string
          channels: string[]
          created_at: string | null
          id: string
          is_active: boolean | null
          preferences: Json | null
          tenant_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alert_type: string
          channels?: string[]
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          preferences?: Json | null
          tenant_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alert_type?: string
          channels?: string[]
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          preferences?: Json | null
          tenant_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      staff_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          channels: string[]
          config_id: string | null
          created_at: string | null
          delivery_status: Json | null
          id: string
          message: string
          metadata: Json | null
          priority: string
          resolved_at: string | null
          resolved_by: string | null
          source_id: string | null
          source_type: string | null
          status: string
          tenant_id: string
          title: string
          triggered_by: string | null
          updated_at: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          channels?: string[]
          config_id?: string | null
          created_at?: string | null
          delivery_status?: Json | null
          id?: string
          message: string
          metadata?: Json | null
          priority?: string
          resolved_at?: string | null
          resolved_by?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string
          tenant_id: string
          title: string
          triggered_by?: string | null
          updated_at?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          channels?: string[]
          config_id?: string | null
          created_at?: string | null
          delivery_status?: Json | null
          id?: string
          message?: string
          metadata?: Json | null
          priority?: string
          resolved_at?: string | null
          resolved_by?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string
          tenant_id?: string
          title?: string
          triggered_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_alerts_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "staff_alert_configs"
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
      staff_shifts: {
        Row: {
          created_at: string | null
          end_time: string
          handover_by: string | null
          handover_completed: boolean | null
          handover_notes: string | null
          handover_to: string | null
          id: string
          shift_type: string
          start_time: string
          status: string
          tenant_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          end_time: string
          handover_by?: string | null
          handover_completed?: boolean | null
          handover_notes?: string | null
          handover_to?: string | null
          id?: string
          shift_type: string
          start_time: string
          status?: string
          tenant_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          end_time?: string
          handover_by?: string | null
          handover_completed?: boolean | null
          handover_notes?: string | null
          handover_to?: string | null
          id?: string
          shift_type?: string
          start_time?: string
          status?: string
          tenant_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      system_email_providers: {
        Row: {
          config: Json
          created_at: string | null
          id: string
          is_default: boolean | null
          is_enabled: boolean | null
          provider_name: string
          provider_type: string
          updated_at: string | null
        }
        Insert: {
          config: Json
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          is_enabled?: boolean | null
          provider_name: string
          provider_type: string
          updated_at?: string | null
        }
        Update: {
          config?: Json
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          is_enabled?: boolean | null
          provider_name?: string
          provider_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      system_owner_contacts: {
        Row: {
          backup_email: string | null
          created_at: string | null
          emergency_phone: string | null
          id: string
          phone_number: string | null
          primary_email: string
          recovery_contact_email: string | null
          recovery_contact_name: string | null
          recovery_contact_phone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          backup_email?: string | null
          created_at?: string | null
          emergency_phone?: string | null
          id?: string
          phone_number?: string | null
          primary_email: string
          recovery_contact_email?: string | null
          recovery_contact_name?: string | null
          recovery_contact_phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          backup_email?: string | null
          created_at?: string | null
          emergency_phone?: string | null
          id?: string
          phone_number?: string | null
          primary_email?: string
          recovery_contact_email?: string | null
          recovery_contact_name?: string | null
          recovery_contact_phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_owner_contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_addons: {
        Row: {
          addon_id: string
          auto_renew: boolean | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          purchased_at: string | null
          quantity: number | null
          tenant_id: string
        }
        Insert: {
          addon_id: string
          auto_renew?: boolean | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          purchased_at?: string | null
          quantity?: number | null
          tenant_id: string
        }
        Update: {
          addon_id?: string
          auto_renew?: boolean | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          purchased_at?: string | null
          quantity?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_addons_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "addons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_addons_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "occupancy_stats"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_addons_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
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
      user_sessions: {
        Row: {
          browser_name: string | null
          browser_version: string | null
          created_at: string
          device_fingerprint: Json | null
          device_name: string | null
          device_type: string | null
          expires_at: string
          heartbeat_count: number
          id: string
          ip_address: unknown | null
          is_active: boolean
          last_activity_at: string
          max_idle_hours: number
          metadata: Json | null
          os_name: string | null
          os_version: string | null
          refresh_token_id: string | null
          revocation_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          session_token: string
          tenant_id: string | null
          user_agent: string | null
          user_id: string
          user_role: string
        }
        Insert: {
          browser_name?: string | null
          browser_version?: string | null
          created_at?: string
          device_fingerprint?: Json | null
          device_name?: string | null
          device_type?: string | null
          expires_at: string
          heartbeat_count?: number
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          last_activity_at?: string
          max_idle_hours?: number
          metadata?: Json | null
          os_name?: string | null
          os_version?: string | null
          refresh_token_id?: string | null
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          session_token: string
          tenant_id?: string | null
          user_agent?: string | null
          user_id: string
          user_role: string
        }
        Update: {
          browser_name?: string | null
          browser_version?: string | null
          created_at?: string
          device_fingerprint?: Json | null
          device_name?: string | null
          device_type?: string | null
          expires_at?: string
          heartbeat_count?: number
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          last_activity_at?: string
          max_idle_hours?: number
          metadata?: Json | null
          os_name?: string | null
          os_version?: string | null
          refresh_token_id?: string | null
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          session_token?: string
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string
          user_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "occupancy_stats"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "user_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      users: {
        Row: {
          account_number: string | null
          address: string | null
          backup_email: string | null
          backup_phone: string | null
          bank_name: string | null
          certifications: Json | null
          created_at: string | null
          date_of_birth: string | null
          department: string | null
          drivers_license: string | null
          email: string
          emergency_contact_info: Json | null
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
          last_password_change: string | null
          medical_conditions: string | null
          name: string | null
          nationality: string | null
          next_of_kin_name: string | null
          next_of_kin_phone: string | null
          next_of_kin_relationship: string | null
          nin: string | null
          passport_number: string | null
          password_reset_required: boolean | null
          phone: string | null
          profile_picture_url: string | null
          recovery_codes: string[] | null
          role: string
          role_id: string | null
          salary_range: string | null
          security_questions: Json | null
          shift_end: string | null
          shift_start: string | null
          skills: Json | null
          temp_expires: string | null
          temp_password_hash: string | null
          tenant_id: string | null
          totp_secret: string | null
          two_factor_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          account_number?: string | null
          address?: string | null
          backup_email?: string | null
          backup_phone?: string | null
          bank_name?: string | null
          certifications?: Json | null
          created_at?: string | null
          date_of_birth?: string | null
          department?: string | null
          drivers_license?: string | null
          email: string
          emergency_contact_info?: Json | null
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
          last_password_change?: string | null
          medical_conditions?: string | null
          name?: string | null
          nationality?: string | null
          next_of_kin_name?: string | null
          next_of_kin_phone?: string | null
          next_of_kin_relationship?: string | null
          nin?: string | null
          passport_number?: string | null
          password_reset_required?: boolean | null
          phone?: string | null
          profile_picture_url?: string | null
          recovery_codes?: string[] | null
          role: string
          role_id?: string | null
          salary_range?: string | null
          security_questions?: Json | null
          shift_end?: string | null
          shift_start?: string | null
          skills?: Json | null
          temp_expires?: string | null
          temp_password_hash?: string | null
          tenant_id?: string | null
          totp_secret?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          account_number?: string | null
          address?: string | null
          backup_email?: string | null
          backup_phone?: string | null
          bank_name?: string | null
          certifications?: Json | null
          created_at?: string | null
          date_of_birth?: string | null
          department?: string | null
          drivers_license?: string | null
          email?: string
          emergency_contact_info?: Json | null
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
          last_password_change?: string | null
          medical_conditions?: string | null
          name?: string | null
          nationality?: string | null
          next_of_kin_name?: string | null
          next_of_kin_phone?: string | null
          next_of_kin_relationship?: string | null
          nin?: string | null
          passport_number?: string | null
          password_reset_required?: boolean | null
          phone?: string | null
          profile_picture_url?: string | null
          recovery_codes?: string[] | null
          role?: string
          role_id?: string | null
          salary_range?: string | null
          security_questions?: Json | null
          shift_end?: string | null
          shift_start?: string | null
          skills?: Json | null
          temp_expires?: string | null
          temp_password_hash?: string | null
          tenant_id?: string | null
          totp_secret?: string | null
          two_factor_enabled?: boolean | null
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
      folio_balances: {
        Row: {
          balance: number | null
          check_in_date: string | null
          check_out_date: string | null
          folio_id: string | null
          folio_number: string | null
          guest_name: string | null
          reservation_id: string | null
          room_id: string | null
          status: string | null
          tenant_id: string | null
          total_charges: number | null
          total_payments: number | null
        }
        Relationships: [
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
          {
            foreignKeyName: "reservations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
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
      apply_rate_plan_bulk: {
        Args: {
          p_end_date: string
          p_rate_plan_id: string
          p_room_type_ids: string[]
          p_start_date: string
          p_tenant_id: string
        }
        Returns: number
      }
      atomic_checkin_guest: {
        Args: {
          p_guest_data?: Json
          p_initial_charges?: Json
          p_reservation_id: string
          p_room_id: string
          p_tenant_id: string
        }
        Returns: Json
      }
      atomic_checkout: {
        Args: { p_reservation_id: string; p_tenant_id: string }
        Returns: {
          folio_id: string
          message: string
          room_id: string
          success: boolean
        }[]
      }
      atomic_checkout_v2: {
        Args: { p_reservation_id: string; p_tenant_id: string }
        Returns: {
          folio_id: string
          message: string
          room_id: string
          success: boolean
        }[]
      }
      atomic_checkout_v3: {
        Args: { p_reservation_id: string; p_tenant_id: string }
        Returns: {
          final_balance: number
          folio_id: string
          message: string
          room_id: string
          success: boolean
        }[]
      }
      auto_expire_reservations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      bulk_seed_existing_tenants: {
        Args: Record<PropertyKey, never>
        Returns: {
          seeded_count: number
          tenant_id: string
          tenant_name: string
        }[]
      }
      calculate_charge_with_taxes: {
        Args: {
          p_base_amount: number
          p_charge_type: string
          p_guest_tax_exempt?: boolean
          p_is_service_chargeable?: boolean
          p_is_taxable?: boolean
          p_tenant_id: string
        }
        Returns: {
          base_amount: number
          service_charge_amount: number
          total_amount: number
          vat_amount: number
        }[]
      }
      calculate_charges_with_tax: {
        Args: {
          p_base_amount: number
          p_charge_type: string
          p_tenant_id: string
        }
        Returns: {
          base_amount: number
          service_charge_amount: number
          total_amount: number
          vat_amount: number
        }[]
      }
      calculate_reservation_overstay: {
        Args: { p_reservation_id: string }
        Returns: boolean
      }
      can_access_tenant: {
        Args: { tenant_uuid: string }
        Returns: boolean
      }
      cancel_reservation_atomic: {
        Args: {
          p_cancelled_by?: string
          p_notes?: string
          p_payment_action?: string
          p_reason?: string
          p_refund_amount?: number
          p_reservation_id: string
          p_tenant_id: string
        }
        Returns: Json
      }
      check_reservation_conflict: {
        Args: {
          p_check_in_date: string
          p_check_out_date: string
          p_exclude_reservation_id?: string
          p_room_id: string
          p_tenant_id: string
        }
        Returns: {
          conflict_details: string
          conflicting_reservation_id: string
          has_conflict: boolean
        }[]
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
      check_room_type_availability: {
        Args: {
          p_check_in_date: string
          p_check_out_date: string
          p_exclude_reservation_id?: string
          p_room_type_id: string
          p_tenant_id: string
        }
        Returns: boolean
      }
      cleanup_old_sessions: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      consume_sms_credits: {
        Args: {
          p_credits: number
          p_message_preview?: string
          p_purpose?: string
          p_recipient_phone?: string
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
      debug_auth_context: {
        Args: Record<PropertyKey, never>
        Returns: {
          auth_uid_result: string
          debug_message: string
          user_exists: boolean
          user_role: string
        }[]
      }
      debug_auth_state: {
        Args: Record<PropertyKey, never>
        Returns: {
          current_auth_uid: string
          is_super_admin_result: boolean
          session_info: string
          user_exists: boolean
          user_role: string
        }[]
      }
      detect_overstays: {
        Args: { p_grace_hours?: number; p_tenant_id: string }
        Returns: {
          expected_checkout: string
          folio_balance: number
          guest_name: string
          hours_overdue: number
          reservation_id: string
          room_id: string
          severity: string
        }[]
      }
      ensure_feature_flag_exists: {
        Args: {
          p_config?: Json
          p_description?: string
          p_flag_name: string
          p_is_enabled?: boolean
        }
        Returns: string
      }
      expire_stale_sessions: {
        Args: Record<PropertyKey, never>
        Returns: number
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
      fn_get_availability: {
        Args: {
          p_check_in_date: string
          p_check_out_date: string
          p_room_type_id?: string
          p_tenant_id: string
        }
        Returns: {
          available_rate: number
          base_rate: number
          is_available: boolean
          max_occupancy: number
          room_id: string
          room_number: string
          room_type_name: string
        }[]
      }
      fn_revpar: {
        Args: { end_date?: string; start_date?: string; tenant_uuid: string }
        Returns: number
      }
      generate_recovery_codes: {
        Args: { user_uuid: string }
        Returns: string[]
      }
      get_active_session_count: {
        Args: { p_user_id: string }
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
      get_credit_usage_forecast: {
        Args: { p_tenant_id: string }
        Returns: {
          current_balance: number
          daily_usage_avg: number
          estimated_days_remaining: number
          recommended_topup: number
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
      get_folio_balance: {
        Args: { p_folio_id: string; p_tenant_id: string }
        Returns: {
          balance: number
          folio_id: string
          folio_number: string
          guest_name: string
          room_number: string
          status: string
          tax_amount: number
          total_charges: number
          total_payments: number
        }[]
      }
      get_folio_balances: {
        Args: { p_folio_id?: string; p_status?: string; p_tenant_id: string }
        Returns: {
          balance: number
          balance_status: string
          created_at: string
          days_old: number
          folio_id: string
          folio_number: string
          folio_status: string
          guest_name: string
          reservation_id: string
          reservation_status: string
          room_number: string
          total_charges: number
          total_payments: number
          updated_at: string
        }[]
      }
      get_folio_with_breakdown: {
        Args: { p_folio_id: string }
        Returns: {
          balance: number
          charges: Json
          credit_amount: number
          folio_id: string
          folio_number: string
          payment_status: string
          payments: Json
          reservation_id: string
          tax_breakdown: Json
          total_charges: number
          total_payments: number
        }[]
      }
      get_guest_analytics: {
        Args: {
          p_end_date?: string
          p_guest_id?: string
          p_start_date?: string
          p_tenant_id: string
        }
        Returns: {
          avg_stay_length: number
          guest_id: string
          guest_name: string
          guest_tier: string
          is_repeat_guest: boolean
          last_stay_date: string
          lifetime_value: number
          preferred_room_type: string
          total_spent: number
          total_stays: number
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
      get_guest_stats_secure: {
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
      get_hotel_sms_stats: {
        Args: { p_tenant_id: string }
        Returns: {
          credit_balance: number
          success_rate: number
          this_month_sent: number
          total_failed: number
          total_sent: number
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
      get_occupancy_stats_secure: {
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
      get_or_create_folio: {
        Args: { p_reservation_id: string; p_tenant_id: string }
        Returns: string
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
      get_recovery_codes_count: {
        Args: { user_uuid: string }
        Returns: number
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
      get_sms_credits_balance: {
        Args: { p_tenant_id: string }
        Returns: number
      }
      get_system_default_email_provider: {
        Args: Record<PropertyKey, never>
        Returns: {
          config: Json
          provider_type: string
        }[]
      }
      get_tenant_staff_safe: {
        Args: { target_tenant_id: string }
        Returns: {
          department: string
          email: string
          employee_id: string
          employment_type: string
          hire_date: string
          id: string
          invitation_status: string
          is_active: boolean
          last_login: string
          name: string
          role: string
        }[]
      }
      get_tenant_users_safe: {
        Args: { target_tenant_id: string }
        Returns: {
          department: string
          email: string
          employee_id: string
          employment_type: string
          hire_date: string
          id: string
          invitation_status: string
          is_active: boolean
          last_login: string
          name: string
          role: string
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
      get_user_role_secure: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_tenant_id_secure: {
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
      handle_multiple_folios: {
        Args: { p_reservation_id: string }
        Returns: string
      }
      increment_session_heartbeat: {
        Args: { p_session_id: string }
        Returns: undefined
      }
      is_background_jobs_enabled: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_super_admin_direct: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_super_admin_with_session: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_system_owner: {
        Args: { user_uuid?: string }
        Returns: boolean
      }
      log_security_event: {
        Args: { event_description: string; event_type: string; metadata?: Json }
        Returns: undefined
      }
      map_payment_method_canonical: {
        Args: { p_method_type: string }
        Returns: string
      }
      monitor_sms_credits: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      process_auto_checkouts: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      process_trial_expiry: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      provision_sms_credits: {
        Args: {
          p_credits: number
          p_purpose?: string
          p_source_id?: string
          p_source_type: string
          p_tenant_id: string
        }
        Returns: undefined
      }
      recalculate_all_folios: {
        Args: { p_tenant_id?: string }
        Returns: {
          folios_checked: number
          folios_corrected: number
          total_charge_diff: number
          total_payment_diff: number
        }[]
      }
      recalculate_folio_balance: {
        Args: { p_folio_id: string }
        Returns: {
          folio_id: string
          new_balance: number
          new_total_charges: number
          new_total_payments: number
          old_balance: number
          old_total_charges: number
          old_total_payments: number
          was_corrected: boolean
        }[]
      }
      refresh_reporting_views: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_revenue_views: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_revenue_views_safe: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      revoke_all_user_sessions: {
        Args: { p_reason?: string; p_user_id: string }
        Returns: number
      }
      seed_tenant_sms_templates: {
        Args: { p_tenant_id: string }
        Returns: number
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
      sync_global_template_to_tenants: {
        Args: { p_global_template_id: string }
        Returns: number
      }
      try_advisory_lock_with_timeout: {
        Args: { lock_key: number; timeout_seconds?: number }
        Returns: boolean
      }
      update_room_type_counts: {
        Args: { p_room_type_id: string; p_tenant_id: string }
        Returns: undefined
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
      validate_payment_method: {
        Args: {
          p_payment_method: string
          p_payment_method_id?: string
          p_tenant_id: string
        }
        Returns: Json
      }
      validate_qr_token_public: {
        Args: { token_input: string }
        Returns: {
          hotel_name: string
          is_valid: boolean
          label: string
          location_type: string
          room_id: string
          services: string[]
          tenant_id: string
        }[]
      }
      validate_recovery_code: {
        Args: { input_code: string; user_uuid: string }
        Returns: boolean
      }
      validate_security_answer: {
        Args: { answer_text: string; question_text: string; user_uuid: string }
        Returns: boolean
      }
      validate_security_definer_functions: {
        Args: Record<PropertyKey, never>
        Returns: {
          function_name: string
          is_secure: boolean
          purpose: string
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
