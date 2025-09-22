-- Ensure Starter plan exists in plans table with proper structure
INSERT INTO public.plans (id, name, price_monthly, price_annual, max_rooms, max_staff, features, trial_days) 
VALUES (
  'b4446069-cc8c-4457-b540-9dc35e01d480'::uuid,
  'Starter',
  35000.00,
  350000.00,
  25,
  10,
  '{"frontDesk": true, "basicReports": true}'::jsonb,
  14
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_monthly = EXCLUDED.price_monthly,
  price_annual = EXCLUDED.price_annual,
  max_rooms = EXCLUDED.max_rooms,
  max_staff = EXCLUDED.max_staff,
  features = EXCLUDED.features,
  trial_days = EXCLUDED.trial_days;