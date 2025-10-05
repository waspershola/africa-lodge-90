-- Fix security issue: Remove the view that caused the SECURITY DEFINER warning
DROP VIEW IF EXISTS v_suspicious_charges;

-- The fix_double_taxed_charges function is sufficient for the cleanup task