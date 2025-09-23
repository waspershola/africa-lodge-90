-- Phase 1: Enhanced QR Database Schema (Fixed)

-- First, add missing columns to existing qr_codes table
ALTER TABLE qr_codes 
ADD COLUMN IF NOT EXISTS label text,
ADD COLUMN IF NOT EXISTS scan_type text CHECK (scan_type IN ('room', 'location', 'global')) DEFAULT 'room',
ADD COLUMN IF NOT EXISTS slug text,
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- Create unique constraint on slug for scannable tokens
CREATE UNIQUE INDEX IF NOT EXISTS qr_codes_slug_unique ON qr_codes(slug) WHERE slug IS NOT NULL;

-- Create qr_services table for service definitions
CREATE TABLE IF NOT EXISTS qr_services (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    display_name text NOT NULL,
    default_route text,
    requires_payment boolean DEFAULT false,
    config jsonb DEFAULT '{}',
    is_global boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on qr_services
ALTER TABLE qr_services ENABLE ROW LEVEL SECURITY;

-- Create policies for qr_services
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'qr_services' AND policyname = 'QR services accessible by tenant'
    ) THEN
        CREATE POLICY "QR services accessible by tenant" 
        ON qr_services 
        FOR ALL 
        USING (can_access_tenant(tenant_id));
    END IF;
END $$;

-- Create qr_request_messages table for two-way messaging
CREATE TABLE IF NOT EXISTS qr_request_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id uuid NOT NULL REFERENCES qr_orders(id) ON DELETE CASCADE,
    tenant_id uuid NOT NULL,
    sender_id uuid REFERENCES auth.users(id),
    sender_role text NOT NULL CHECK (sender_role IN ('guest', 'staff', 'system')),
    message text NOT NULL,
    message_payload jsonb DEFAULT '{}',
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on qr_request_messages
ALTER TABLE qr_request_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for qr_request_messages
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'qr_request_messages' AND policyname = 'Staff can manage request messages in own tenant'
    ) THEN
        CREATE POLICY "Staff can manage request messages in own tenant" 
        ON qr_request_messages 
        FOR ALL 
        USING (can_access_tenant(tenant_id));
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'qr_request_messages' AND policyname = 'Allow guest messages for valid requests'
    ) THEN
        CREATE POLICY "Allow guest messages for valid requests" 
        ON qr_request_messages 
        FOR INSERT 
        WITH CHECK (
            sender_role = 'guest' AND 
            EXISTS (
                SELECT 1 FROM qr_orders 
                WHERE id = request_id AND tenant_id = qr_request_messages.tenant_id
            )
        );
    END IF;
END $$;

-- Create qr_analytics table for tracking and reporting
CREATE TABLE IF NOT EXISTS qr_analytics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    qr_code_id uuid REFERENCES qr_codes(id) ON DELETE CASCADE,
    request_count integer DEFAULT 0,
    last_scanned_at timestamp with time zone,
    period date NOT NULL,
    meta jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(tenant_id, qr_code_id, period)
);

-- Enable RLS on qr_analytics
ALTER TABLE qr_analytics ENABLE ROW LEVEL SECURITY;

-- Create policy for qr_analytics
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'qr_analytics' AND policyname = 'Analytics accessible by tenant'
    ) THEN
        CREATE POLICY "Analytics accessible by tenant" 
        ON qr_analytics 
        FOR ALL 
        USING (can_access_tenant(tenant_id));
    END IF;
END $$;

-- Add missing columns to qr_orders for enhanced functionality
ALTER TABLE qr_orders 
ADD COLUMN IF NOT EXISTS room_id uuid,
ADD COLUMN IF NOT EXISTS assigned_team text,
ADD COLUMN IF NOT EXISTS priority integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_by_guest boolean DEFAULT true;

-- Update qr_orders status to use proper enum values
ALTER TABLE qr_orders 
DROP CONSTRAINT IF EXISTS qr_orders_status_check;

ALTER TABLE qr_orders 
ADD CONSTRAINT qr_orders_status_check 
CHECK (status IN ('pending', 'assigned', 'accepted', 'preparing', 'on_route', 'delivered', 'completed', 'rejected', 'cancelled'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_qr_codes_tenant_active ON qr_codes(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_qr_orders_tenant_status ON qr_orders(tenant_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_qr_orders_assigned_team ON qr_orders(tenant_id, assigned_team, status);
CREATE INDEX IF NOT EXISTS idx_qr_request_messages_request ON qr_request_messages(request_id, created_at);
CREATE INDEX IF NOT EXISTS idx_qr_analytics_tenant_period ON qr_analytics(tenant_id, period);

-- Enable realtime for tables (skip if already added)
ALTER TABLE qr_orders REPLICA IDENTITY FULL;
ALTER TABLE qr_request_messages REPLICA IDENTITY FULL;