-- Create function to generate short codes using safe alphabet
-- Safe alphabet excludes confusing characters: 0/O, I/l, 1/i
-- Uses: a-z (lowercase), 2-9, h-k, m-n, p-z (avoiding confusing chars)
CREATE OR REPLACE FUNCTION generate_short_code(length INTEGER DEFAULT 6)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  -- Safe alphabet: 30 characters (no 0, O, I, l, 1, i for clarity)
  alphabet TEXT := 'abcdefghjkmnpqrstuvwxyz23456789';
  result TEXT := '';
  i INTEGER;
  random_index INTEGER;
BEGIN
  -- Validate length
  IF length < 4 OR length > 12 THEN
    RAISE EXCEPTION 'Short code length must be between 4 and 12 characters';
  END IF;

  -- Generate random code
  FOR i IN 1..length LOOP
    random_index := floor(random() * length(alphabet))::INTEGER + 1;
    result := result || substring(alphabet FROM random_index FOR 1);
  END LOOP;

  RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION generate_short_code(INTEGER) TO authenticated, anon, service_role;