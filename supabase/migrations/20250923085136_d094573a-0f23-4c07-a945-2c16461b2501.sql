-- Add remaining tables to realtime publication (only ones not already added)
DO $$
BEGIN
    -- Try to add tables to realtime publication, ignore if already exists
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
    EXCEPTION WHEN duplicate_object THEN
        NULL; -- Ignore if already exists
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE payments;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE work_orders;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE housekeeping_tasks;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE qr_orders;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;