-- Enable Supabase Realtime for core tables with REPLICA IDENTITY FULL
-- This ensures all row data is captured during updates

-- Enable REPLICA IDENTITY FULL for qr_orders table
ALTER TABLE public.qr_orders REPLICA IDENTITY FULL;

-- Enable REPLICA IDENTITY FULL for pos_orders table  
ALTER TABLE public.pos_orders REPLICA IDENTITY FULL;

-- Enable REPLICA IDENTITY FULL for rooms table
ALTER TABLE public.rooms REPLICA IDENTITY FULL;

-- Enable REPLICA IDENTITY FULL for housekeeping_tasks table
ALTER TABLE public.housekeeping_tasks REPLICA IDENTITY FULL;

-- Enable REPLICA IDENTITY FULL for work_orders table (corrected table name)
ALTER TABLE public.work_orders REPLICA IDENTITY FULL;

-- Enable REPLICA IDENTITY FULL for reservations table
ALTER TABLE public.reservations REPLICA IDENTITY FULL;

-- Enable REPLICA IDENTITY FULL for audit_log table for real-time monitoring
ALTER TABLE public.audit_log REPLICA IDENTITY FULL;

-- Add all these tables to the supabase_realtime publication
-- This activates real-time functionality for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.qr_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pos_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.housekeeping_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.work_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_log;