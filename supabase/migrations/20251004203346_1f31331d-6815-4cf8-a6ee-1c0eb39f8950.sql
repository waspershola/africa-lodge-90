-- Add RLS policies for OWNER/MANAGER to manage staff

-- Allow OWNER and MANAGER to update staff in their tenant
CREATE POLICY "owner_manager_update_staff"
ON public.users
FOR UPDATE
USING (
  get_user_role() IN ('OWNER', 'MANAGER')
  AND get_user_tenant_id() = tenant_id
  AND tenant_id IS NOT NULL
)
WITH CHECK (
  get_user_role() IN ('OWNER', 'MANAGER')
  AND get_user_tenant_id() = tenant_id
  AND tenant_id IS NOT NULL
);

-- Allow OWNER to delete staff in their tenant
CREATE POLICY "owner_delete_staff"
ON public.users
FOR DELETE
USING (
  get_user_role() = 'OWNER'
  AND get_user_tenant_id() = tenant_id
  AND tenant_id IS NOT NULL
);

-- Add audit logging for staff management actions
CREATE OR REPLACE FUNCTION audit_staff_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (
      action,
      resource_type,
      resource_id,
      actor_id,
      tenant_id,
      description,
      metadata,
      old_values,
      new_values
    ) VALUES (
      'STAFF_UPDATE',
      'USER',
      NEW.id,
      auth.uid(),
      NEW.tenant_id,
      'Staff member updated',
      jsonb_build_object(
        'email', NEW.email,
        'role', NEW.role,
        'is_active', NEW.is_active
      ),
      jsonb_build_object(
        'is_active', OLD.is_active,
        'role', OLD.role,
        'department', OLD.department
      ),
      jsonb_build_object(
        'is_active', NEW.is_active,
        'role', NEW.role,
        'department', NEW.department
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (
      action,
      resource_type,
      resource_id,
      actor_id,
      tenant_id,
      description,
      metadata
    ) VALUES (
      'STAFF_DELETE',
      'USER',
      OLD.id,
      auth.uid(),
      OLD.tenant_id,
      'Staff member deleted',
      jsonb_build_object(
        'email', OLD.email,
        'role', OLD.role,
        'name', OLD.name
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for staff management audit
DROP TRIGGER IF EXISTS audit_staff_management ON public.users;
CREATE TRIGGER audit_staff_management
AFTER UPDATE OR DELETE ON public.users
FOR EACH ROW
EXECUTE FUNCTION audit_staff_changes();