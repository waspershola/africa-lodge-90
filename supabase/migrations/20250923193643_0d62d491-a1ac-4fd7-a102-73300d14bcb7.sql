-- Seed default qr_services for all existing tenants
INSERT INTO qr_services (tenant_id, name, display_name, default_route, requires_payment, is_global) 
SELECT DISTINCT 
    tenant_id,
    'room_service',
    'Room Service',
    'kitchen',
    true,
    false
FROM tenants
WHERE NOT EXISTS (
    SELECT 1 FROM qr_services 
    WHERE name = 'room_service' AND qr_services.tenant_id = tenants.tenant_id
);

INSERT INTO qr_services (tenant_id, name, display_name, default_route, requires_payment, is_global) 
SELECT DISTINCT 
    tenant_id,
    'housekeeping',
    'Housekeeping',
    'housekeeping',
    false,
    false
FROM tenants
WHERE NOT EXISTS (
    SELECT 1 FROM qr_services 
    WHERE name = 'housekeeping' AND qr_services.tenant_id = tenants.tenant_id
);

INSERT INTO qr_services (tenant_id, name, display_name, default_route, requires_payment, is_global) 
SELECT DISTINCT 
    tenant_id,
    'maintenance',
    'Maintenance',
    'maintenance',
    false,
    false
FROM tenants
WHERE NOT EXISTS (
    SELECT 1 FROM qr_services 
    WHERE name = 'maintenance' AND qr_services.tenant_id = tenants.tenant_id
);

INSERT INTO qr_services (tenant_id, name, display_name, default_route, requires_payment, is_global) 
SELECT DISTINCT 
    tenant_id,
    'feedback',
    'Feedback',
    'management',
    false,
    false
FROM tenants
WHERE NOT EXISTS (
    SELECT 1 FROM qr_services 
    WHERE name = 'feedback' AND qr_services.tenant_id = tenants.tenant_id
);

-- Create function to update qr_analytics
CREATE OR REPLACE FUNCTION update_qr_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update analytics when a new request is created
    IF TG_OP = 'INSERT' THEN
        INSERT INTO qr_analytics (tenant_id, qr_code_id, request_count, last_scanned_at, period)
        VALUES (
            NEW.tenant_id,
            NEW.qr_code_id,
            1,
            now(),
            CURRENT_DATE
        )
        ON CONFLICT (tenant_id, qr_code_id, period)
        DO UPDATE SET
            request_count = qr_analytics.request_count + 1,
            last_scanned_at = now();
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;