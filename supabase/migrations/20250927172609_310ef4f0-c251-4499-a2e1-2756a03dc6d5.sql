-- Create function to auto-seed SMS templates for new tenants
CREATE OR REPLACE FUNCTION seed_tenant_sms_templates(p_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    template_record RECORD;
BEGIN
    -- Insert global templates for the tenant if they don't exist
    FOR template_record IN 
        SELECT * FROM sms_templates WHERE tenant_id IS NULL
    LOOP
        INSERT INTO sms_templates (
            tenant_id,
            template_name,
            event_type,
            message_template,
            variables,
            is_active,
            estimated_sms_count,
            character_count_warning,
            created_at,
            updated_at
        )
        SELECT 
            p_tenant_id,
            template_record.template_name,
            template_record.event_type,
            template_record.message_template,
            template_record.variables,
            template_record.is_active,
            template_record.estimated_sms_count,
            template_record.character_count_warning,
            now(),
            now()
        WHERE NOT EXISTS (
            SELECT 1 FROM sms_templates 
            WHERE tenant_id = p_tenant_id 
            AND event_type = template_record.event_type
        );
    END LOOP;
END;
$$;

-- Create function to get hotel SMS stats
CREATE OR REPLACE FUNCTION get_hotel_sms_stats(p_tenant_id uuid)
RETURNS TABLE(
    total_sent bigint,
    total_failed bigint,
    credit_balance integer,
    this_month_sent bigint,
    success_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    WITH sms_stats AS (
        SELECT 
            COUNT(*) FILTER (WHERE status = 'sent') as sent_count,
            COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
            COUNT(*) FILTER (
                WHERE status = 'sent' 
                AND created_at >= date_trunc('month', CURRENT_DATE)
            ) as month_sent
        FROM sms_logs 
        WHERE tenant_id = p_tenant_id
    ),
    credit_info AS (
        SELECT balance FROM sms_credits WHERE tenant_id = p_tenant_id
    )
    SELECT 
        s.sent_count,
        s.failed_count,
        COALESCE(c.balance, 0),
        s.month_sent,
        CASE 
            WHEN (s.sent_count + s.failed_count) > 0 
            THEN ROUND((s.sent_count::numeric / (s.sent_count + s.failed_count)) * 100, 2)
            ELSE 0
        END as success_rate
    FROM sms_stats s
    CROSS JOIN credit_info c;
END;
$$;

-- Create function for credit usage forecast
CREATE OR REPLACE FUNCTION get_credit_usage_forecast(p_tenant_id uuid)
RETURNS TABLE(
    current_balance integer,
    daily_usage_avg numeric,
    estimated_days_remaining integer,
    recommended_topup integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_balance_val integer;
    daily_avg numeric;
BEGIN
    -- Get current balance
    SELECT balance INTO current_balance_val 
    FROM sms_credits 
    WHERE tenant_id = p_tenant_id;
    
    -- Calculate daily average usage over last 30 days
    SELECT COALESCE(AVG(daily_usage), 0) INTO daily_avg
    FROM (
        SELECT DATE(created_at) as usage_date, SUM(credits_used) as daily_usage
        FROM sms_logs 
        WHERE tenant_id = p_tenant_id 
        AND created_at >= CURRENT_DATE - INTERVAL '30 days'
        AND status = 'sent'
        GROUP BY DATE(created_at)
    ) daily_stats;
    
    RETURN QUERY
    SELECT 
        COALESCE(current_balance_val, 0),
        COALESCE(daily_avg, 0),
        CASE 
            WHEN daily_avg > 0 THEN (current_balance_val / daily_avg)::integer
            ELSE 999
        END as days_remaining,
        CASE 
            WHEN daily_avg > 0 THEN (daily_avg * 30)::integer
            ELSE 100
        END as recommended_topup;
END;
$$;