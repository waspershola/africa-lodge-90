-- First create the function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create guest-staff messages table for real-time communication
CREATE TABLE IF NOT EXISTS public.guest_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  qr_order_id UUID NOT NULL REFERENCES public.qr_orders(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('guest', 'staff')),
  sender_id UUID, -- staff user id when sender_type = 'staff', null for guests
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'menu_suggestion', 'order_confirmation', 'order_modification')),
  metadata JSONB DEFAULT '{}', -- for storing additional data like suggested items, pricing, etc
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.guest_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for guest messages
CREATE POLICY "Users can view their tenant messages" 
ON public.guest_messages 
FOR SELECT 
USING (
  tenant_id = get_user_tenant_id() OR 
  is_super_admin()
);

CREATE POLICY "Staff can create messages" 
ON public.guest_messages 
FOR INSERT 
WITH CHECK (
  sender_type = 'staff' AND 
  sender_id = auth.uid() AND
  (tenant_id = get_user_tenant_id() OR is_super_admin())
);

-- Guests can create messages through the edge function (no auth required)
CREATE POLICY "Allow guest messages through service role" 
ON public.guest_messages 
FOR INSERT 
WITH CHECK (sender_type = 'guest');

-- Add indexes for performance
CREATE INDEX idx_guest_messages_qr_order_id ON public.guest_messages(qr_order_id);
CREATE INDEX idx_guest_messages_tenant_id ON public.guest_messages(tenant_id);
CREATE INDEX idx_guest_messages_created_at ON public.guest_messages(created_at);

-- Add updated_at trigger
CREATE TRIGGER update_guest_messages_updated_at
BEFORE UPDATE ON public.guest_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for guest messages
ALTER TABLE public.guest_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.guest_messages;