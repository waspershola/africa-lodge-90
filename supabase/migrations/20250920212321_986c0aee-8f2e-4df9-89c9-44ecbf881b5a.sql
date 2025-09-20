-- Ensure all existing tenants have proper onboarding_step defaults
-- This migration ensures backward compatibility with existing tenants

UPDATE tenants 
SET 
  onboarding_step = 'hotel_information'
WHERE 
  onboarding_step IS NULL OR onboarding_step = '';

-- Ensure setup_completed defaults to false for tenants that don't have it set
UPDATE tenants 
SET 
  setup_completed = false
WHERE 
  setup_completed IS NULL;