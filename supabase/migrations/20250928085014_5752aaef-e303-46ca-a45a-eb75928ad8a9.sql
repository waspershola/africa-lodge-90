-- Phase 1: Update database constraint to allow all required room statuses
-- First, let's check current constraint and then update it

-- Update the rooms status check constraint to include all frontend status values
ALTER TABLE public.rooms DROP CONSTRAINT IF EXISTS rooms_status_check;

-- Add new constraint that includes all status values used by frontend
ALTER TABLE public.rooms ADD CONSTRAINT rooms_status_check 
CHECK (status IN (
  'available', 
  'occupied', 
  'reserved', 
  'out_of_service',  -- Database standard
  'oos',             -- Frontend alias for out_of_service
  'overstay', 
  'dirty', 
  'clean', 
  'maintenance',
  'checkout'
));