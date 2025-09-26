-- Delete the unused Sales role and clean up orphaned permissions
DELETE FROM public.role_permissions 
WHERE role_id IN (
  SELECT id FROM public.roles 
  WHERE name = 'Sales' AND scope = 'global'
);

DELETE FROM public.roles 
WHERE name = 'Sales' AND scope = 'global';