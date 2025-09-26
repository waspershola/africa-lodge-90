-- Create SUPPORT_ADMIN role if it doesn't exist
DO $$
DECLARE
  support_admin_role_id UUID;
BEGIN
  -- Check if Support Admin role already exists
  SELECT id INTO support_admin_role_id 
  FROM public.roles 
  WHERE name = 'Support Admin' AND scope = 'global' AND tenant_id IS NULL;

  -- Create the role if it doesn't exist
  IF support_admin_role_id IS NULL THEN
    INSERT INTO public.roles (name, description, scope, tenant_id, is_system) 
    VALUES (
      'Support Admin', 
      'Global support administrator with controlled cross-tenant access',
      'global', 
      NULL, 
      true
    ) RETURNING id INTO support_admin_role_id;
  END IF;

  -- Assign permissions to SUPPORT_ADMIN role
  IF support_admin_role_id IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT support_admin_role_id, p.id
    FROM public.permissions p
    WHERE p.name IN (
      'dashboard.read',
      'tenants.read', 'tenants.write',
      'users.read', 'users.write',
      'support.read', 'support.write', 'support.manage',
      'billing.read', 'billing.write',
      'plans.read', 'plans.write',
      'reports.read', 'reports.export'
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.role_permissions rp 
      WHERE rp.role_id = support_admin_role_id AND rp.permission_id = p.id
    );
  END IF;
END $$;

-- Create support admin tables
CREATE TABLE IF NOT EXISTS public.impersonation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  impersonator_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  target_tenant_id UUID,
  session_token TEXT NOT NULL UNIQUE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  reason TEXT,
  ip_address INET,
  user_agent TEXT,
  actions_performed JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.global_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT NOT NULL UNIQUE,
  tenant_id UUID,
  submitter_id UUID,
  assigned_to UUID,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting', 'resolved', 'closed')),
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('technical', 'billing', 'feature', 'bug', 'general')),
  tags TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on new tables
ALTER TABLE public.impersonation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_tickets ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Super admin can manage impersonation logs"
ON public.impersonation_logs
FOR ALL
USING (is_super_admin());

CREATE POLICY "Support staff can manage all tickets"
ON public.global_tickets
FOR ALL
USING (get_user_role() IN ('SUPER_ADMIN', 'Support Admin'));