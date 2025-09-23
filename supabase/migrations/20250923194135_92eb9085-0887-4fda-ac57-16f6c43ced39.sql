-- Create trigger for analytics updates
DROP TRIGGER IF EXISTS trigger_update_qr_analytics ON qr_orders;
CREATE TRIGGER trigger_update_qr_analytics
    AFTER INSERT ON qr_orders
    FOR EACH ROW EXECUTE FUNCTION update_qr_analytics();