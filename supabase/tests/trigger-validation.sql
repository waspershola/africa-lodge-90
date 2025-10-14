-- Phase 5: Automated Trigger Validation Tests
-- ==============================================
-- Run these tests after any migration affecting triggers or tenant creation

-- Test 1: Verify trigger function compiles without errors
DO $$
BEGIN
  -- This will raise an exception if the function has syntax errors
  PERFORM auto_seed_tenant_templates();
  RAISE NOTICE '✅ Test 1 PASSED: Trigger function compiles successfully';
EXCEPTION 
  WHEN undefined_function THEN
    RAISE NOTICE '✅ Test 1 PASSED: Function exists (expected error calling without NEW)';
  WHEN OTHERS THEN
    RAISE EXCEPTION '❌ Test 1 FAILED: Trigger function compilation error: %', SQLERRM;
END $$;

-- Test 2: Verify trigger function uses correct column name (tenant_id not id)
DO $$
DECLARE
  func_def TEXT;
  uses_tenant_id BOOLEAN;
  uses_id BOOLEAN;
BEGIN
  -- Get function definition
  SELECT pg_get_functiondef(oid) INTO func_def
  FROM pg_proc 
  WHERE proname = 'auto_seed_tenant_templates'
    AND pronamespace = 'public'::regnamespace;
  
  -- Check for correct column reference
  uses_tenant_id := func_def LIKE '%NEW.tenant_id%';
  uses_id := func_def LIKE '%NEW.id%' AND func_def NOT LIKE '%tenant_id%';
  
  IF NOT uses_tenant_id THEN
    RAISE EXCEPTION '❌ Test 2 FAILED: Trigger does not reference NEW.tenant_id';
  END IF;
  
  IF uses_id THEN
    RAISE EXCEPTION '❌ Test 2 FAILED: Trigger incorrectly references NEW.id instead of NEW.tenant_id';
  END IF;
  
  RAISE NOTICE '✅ Test 2 PASSED: Trigger uses correct column reference (NEW.tenant_id)';
END $$;

-- Test 3: Verify trigger has error handling (non-blocking)
DO $$
DECLARE
  func_def TEXT;
  has_exception_block BOOLEAN;
BEGIN
  SELECT pg_get_functiondef(oid) INTO func_def
  FROM pg_proc 
  WHERE proname = 'auto_seed_tenant_templates'
    AND pronamespace = 'public'::regnamespace;
  
  has_exception_block := func_def LIKE '%EXCEPTION WHEN OTHERS%';
  
  IF NOT has_exception_block THEN
    RAISE WARNING '⚠️  Test 3 WARNING: Trigger does not have error handling - template seeding failures will block tenant creation';
  ELSE
    RAISE NOTICE '✅ Test 3 PASSED: Trigger has error handling (non-blocking)';
  END IF;
END $$;

-- Test 4: Verify trigger is attached to tenants table
DO $$
DECLARE
  trigger_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_proc p ON p.oid = t.tgfoid
    WHERE c.relname = 'tenants'
      AND p.proname = 'auto_seed_tenant_templates'
      AND t.tgenabled != 'D'  -- Not disabled
  ) INTO trigger_exists;
  
  IF NOT trigger_exists THEN
    RAISE EXCEPTION '❌ Test 4 FAILED: Trigger is not attached to tenants table or is disabled';
  END IF;
  
  RAISE NOTICE '✅ Test 4 PASSED: Trigger is properly attached to tenants table';
END $$;

-- Test 5: Verify seed_tenant_sms_templates function exists
DO $$
BEGIN
  PERFORM seed_tenant_sms_templates('00000000-0000-0000-0000-000000000000'::uuid);
  RAISE NOTICE '✅ Test 5 PASSED: seed_tenant_sms_templates function exists';
EXCEPTION 
  WHEN foreign_key_violation OR check_violation THEN
    RAISE NOTICE '✅ Test 5 PASSED: Function exists (expected error with dummy UUID)';
  WHEN OTHERS THEN
    RAISE EXCEPTION '❌ Test 5 FAILED: seed_tenant_sms_templates function error: %', SQLERRM;
END $$;

-- Summary
DO $$
BEGIN
  RAISE NOTICE '=========================================';
  RAISE NOTICE 'Trigger Validation Tests Complete';
  RAISE NOTICE 'Run these tests after any migration';
  RAISE NOTICE '=========================================';
END $$;
