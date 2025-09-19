-- Enable RLS on global tables and add appropriate policies

-- Enable RLS on plans table
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Plans policies - everyone can read, only super admin can modify
CREATE POLICY "Everyone can view plans" ON plans
  FOR SELECT USING (true);

CREATE POLICY "Super admin can manage plans" ON plans
  FOR ALL USING (is_super_admin());

-- Enable RLS on feature_flags table  
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Feature flags policies - everyone can read, only super admin can modify
CREATE POLICY "Everyone can view feature flags" ON feature_flags
  FOR SELECT USING (true);

CREATE POLICY "Super admin can manage feature flags" ON feature_flags
  FOR ALL USING (is_super_admin());