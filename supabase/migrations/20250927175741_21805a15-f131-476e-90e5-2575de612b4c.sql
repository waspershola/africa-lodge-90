-- Create trigger function to auto-seed templates for new tenants
CREATE OR REPLACE FUNCTION public.auto_seed_tenant_templates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Seed SMS templates for the new tenant
  PERFORM seed_tenant_sms_templates(NEW.id);
  RETURN NEW;
END;
$function$;

-- Create trigger to auto-seed when new tenant is created
DROP TRIGGER IF EXISTS trigger_auto_seed_tenant_templates ON public.tenants;
CREATE TRIGGER trigger_auto_seed_tenant_templates
  AFTER INSERT ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION auto_seed_tenant_templates();