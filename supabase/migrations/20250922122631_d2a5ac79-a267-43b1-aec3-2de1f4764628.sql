-- Clean up duplicate sales roles (remove lowercase 'sales', keep 'Sales')
DELETE FROM roles WHERE name = 'sales' AND scope = 'global';