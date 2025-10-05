-- Sprint 3: Short URL Service Table (Fixed)
CREATE TABLE IF NOT EXISTS public.short_urls (
  short_code text PRIMARY KEY,
  target_url text NOT NULL,
  tenant_id uuid REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
  click_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES public.users(id),
  expires_at timestamptz,
  metadata jsonb DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_short_urls_tenant ON public.short_urls(tenant_id);
CREATE INDEX IF NOT EXISTS idx_short_urls_created ON public.short_urls(created_at);

-- RLS Policies
ALTER TABLE public.short_urls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Short URLs accessible by tenant"
  ON public.short_urls
  FOR ALL
  USING (can_access_tenant(tenant_id));

CREATE POLICY "Public can access short URLs"
  ON public.short_urls
  FOR SELECT
  USING (true);

-- Function to generate short codes
CREATE OR REPLACE FUNCTION generate_short_code(length integer DEFAULT 8)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;