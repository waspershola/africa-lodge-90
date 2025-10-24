-- Fix RLS policies to unblock app functionality and improve performance

-- 1. Allow public read access to feature flags (enabled flags only)
CREATE POLICY "Public can read enabled feature flags"
ON feature_flags
FOR SELECT
TO public
USING (is_enabled = true);

-- 2. Allow public read access to subscription plans (pricing is public info)
CREATE POLICY "Public can read subscription plans"
ON plans
FOR SELECT
TO public
USING (true);

-- 3. CRITICAL SECURITY FIX: Restrict short_urls to prevent enumeration attacks
DROP POLICY IF EXISTS "Anyone can read short URLs" ON short_urls;

-- Allow public to lookup short URLs but only when authenticated users can see their tenant's URLs
CREATE POLICY "Users can read their tenant's short URLs"
ON short_urls
FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  )
);

-- 4. Restrict SMS templates to authenticated tenant users only
DROP POLICY IF EXISTS "Anyone can read SMS templates" ON sms_templates;

CREATE POLICY "Authenticated users can read their tenant's SMS templates"
ON sms_templates
FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  )
);

-- 5. Keep demo_config public for marketing (it's already working correctly)
-- No changes needed

-- 6. Restrict sounds table to authenticated users
DROP POLICY IF EXISTS "Anyone can read sounds" ON sounds;

CREATE POLICY "Authenticated users can read sounds"
ON sounds
FOR SELECT
TO authenticated
USING (true);