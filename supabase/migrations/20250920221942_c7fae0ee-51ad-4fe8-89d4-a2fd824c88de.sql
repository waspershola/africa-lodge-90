-- Add missing owner_id column to tenants table
ALTER TABLE public.tenants 
ADD COLUMN owner_id UUID REFERENCES auth.users(id);