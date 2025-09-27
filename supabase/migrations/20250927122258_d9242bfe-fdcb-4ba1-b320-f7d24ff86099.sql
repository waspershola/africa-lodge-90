-- Create plan_addons junction table to link plans with included add-ons
CREATE TABLE public.plan_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  addon_id uuid NOT NULL REFERENCES addons(id) ON DELETE CASCADE,
  is_included boolean DEFAULT true,
  quantity integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  UNIQUE(plan_id, addon_id)
);

-- Enable RLS on plan_addons
ALTER TABLE public.plan_addons ENABLE ROW LEVEL SECURITY;

-- Create policies for plan_addons
CREATE POLICY "Super admin can manage plan addons"
  ON public.plan_addons
  FOR ALL
  USING (is_super_admin());

CREATE POLICY "Authenticated users can view plan addons"
  ON public.plan_addons
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Add room capacity min/max to plans table for better room limits
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS room_capacity_min integer DEFAULT 1;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS room_capacity_max integer DEFAULT NULL;

-- Update existing plans to have room_capacity_max based on max_rooms
UPDATE public.plans SET room_capacity_max = max_rooms WHERE room_capacity_max IS NULL;