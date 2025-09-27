-- Phase 1: Enhanced Database Schema for African Hotel PMS (Fixed)

-- Add room type inventory tracking
ALTER TABLE room_types ADD COLUMN IF NOT EXISTS available_count INTEGER DEFAULT 0;
ALTER TABLE room_types ADD COLUMN IF NOT EXISTS total_count INTEGER DEFAULT 0;
ALTER TABLE room_types ADD COLUMN IF NOT EXISTS reserved_count INTEGER DEFAULT 0;
ALTER TABLE room_types ADD COLUMN IF NOT EXISTS auto_assign_hours INTEGER DEFAULT 24;
ALTER TABLE room_types ADD COLUMN IF NOT EXISTS grace_period_hours INTEGER DEFAULT 3;

-- Create room type availability tracking for date-specific inventory
CREATE TABLE IF NOT EXISTS room_type_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  room_type_id UUID NOT NULL,
  availability_date DATE NOT NULL,
  available_count INTEGER NOT NULL DEFAULT 0,
  reserved_count INTEGER NOT NULL DEFAULT 0,
  blocked_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tenant_id, room_type_id, availability_date)
);

-- Enable RLS for room type availability
ALTER TABLE room_type_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Room availability accessible by tenant" ON room_type_availability
FOR ALL USING (can_access_tenant(tenant_id));

-- Enhance reservations table for soft hold → hard assignment flow
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS booking_source TEXT DEFAULT 'online' CHECK (booking_source IN ('online', 'walk_in', 'phone', 'email'));
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS room_assignment_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS grace_period_hours INTEGER DEFAULT 3;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS requires_verification BOOLEAN DEFAULT false;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS verification_deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS is_soft_hold BOOLEAN DEFAULT true;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS payment_deadline TIMESTAMP WITH TIME ZONE;

-- Add constraint to status field to include new status options
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_status_check;
ALTER TABLE reservations ADD CONSTRAINT reservations_status_check 
  CHECK (status IN ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'soft_hold', 'hard_assigned', 'no_show', 'expired'));

-- Create reservation status log for audit trail
CREATE TABLE IF NOT EXISTS reservation_status_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  reservation_id UUID NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID,
  change_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for reservation status log
ALTER TABLE reservation_status_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reservation status log accessible by tenant" ON reservation_status_log
FOR ALL USING (can_access_tenant(tenant_id));

-- Enhance guests table for reliability scoring
ALTER TABLE guests ADD COLUMN IF NOT EXISTS reliability_score INTEGER DEFAULT 100 CHECK (reliability_score >= 0 AND reliability_score <= 100);
ALTER TABLE guests ADD COLUMN IF NOT EXISTS no_show_count INTEGER DEFAULT 0;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS late_arrival_count INTEGER DEFAULT 0;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS successful_stays INTEGER DEFAULT 0;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS requires_verification BOOLEAN DEFAULT false;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS is_blacklisted BOOLEAN DEFAULT false;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS blacklist_reason TEXT;

-- Create booking verification table
CREATE TABLE IF NOT EXISTS booking_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  reservation_id UUID NOT NULL,
  guest_id UUID NOT NULL,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('sms', 'call', 'email', 'id_verification')),
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed', 'expired')),
  verification_code TEXT,
  attempts_count INTEGER DEFAULT 0,
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for booking verification
ALTER TABLE booking_verification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Booking verification accessible by tenant" ON booking_verification
FOR ALL USING (can_access_tenant(tenant_id));

-- Create auto cancellation policies table
CREATE TABLE IF NOT EXISTS auto_cancel_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  room_type_id UUID,
  policy_name TEXT NOT NULL,
  applies_to TEXT[] DEFAULT ARRAY['online'], -- booking sources this applies to
  unpaid_cancel_hours INTEGER DEFAULT 6,
  unverified_cancel_hours INTEGER DEFAULT 2,
  no_show_grace_hours INTEGER DEFAULT 3,
  requires_deposit BOOLEAN DEFAULT false,
  deposit_percentage NUMERIC DEFAULT 30.0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for auto cancel policies  
ALTER TABLE auto_cancel_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auto cancel policies accessible by tenant" ON auto_cancel_policies
FOR ALL USING (can_access_tenant(tenant_id));

-- Add room type ID to reservations for soft holds (nullable for backward compatibility)
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS room_type_id UUID;

-- Create function to update room type counts
CREATE OR REPLACE FUNCTION update_room_type_counts(p_tenant_id UUID, p_room_type_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_rooms INTEGER;
  available_rooms INTEGER;
  reserved_rooms INTEGER;
BEGIN
  -- Count total rooms of this type
  SELECT COUNT(*) INTO total_rooms
  FROM rooms 
  WHERE tenant_id = p_tenant_id 
    AND room_type_id = p_room_type_id
    AND status != 'out_of_order';
    
  -- Count reserved rooms (both hard assigned and soft holds)
  SELECT COUNT(*) INTO reserved_rooms
  FROM reservations r
  WHERE r.tenant_id = p_tenant_id
    AND (
      -- Hard assigned rooms
      (r.room_id IN (
        SELECT id FROM rooms 
        WHERE tenant_id = p_tenant_id 
          AND room_type_id = p_room_type_id
      ))
      -- Soft holds for this room type
      OR (r.room_type_id = p_room_type_id AND r.room_id IS NULL)
    )
    AND r.status IN ('confirmed', 'checked_in', 'soft_hold', 'hard_assigned')
    AND r.check_in_date <= CURRENT_DATE + INTERVAL '7 days'
    AND r.check_out_date > CURRENT_DATE;
    
  -- Update room type counts
  UPDATE room_types 
  SET 
    total_count = total_rooms,
    reserved_count = reserved_rooms,
    available_count = GREATEST(0, total_rooms - reserved_rooms),
    updated_at = now()
  WHERE tenant_id = p_tenant_id AND id = p_room_type_id;
END;
$$;

-- Create function to check room type availability for booking
CREATE OR REPLACE FUNCTION check_room_type_availability(
  p_tenant_id UUID,
  p_room_type_id UUID,
  p_check_in_date DATE,
  p_check_out_date DATE,
  p_exclude_reservation_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_rooms INTEGER;
  conflicting_reservations INTEGER;
BEGIN
  -- Get total rooms of this type (excluding out of order)
  SELECT COUNT(*) INTO total_rooms
  FROM rooms 
  WHERE tenant_id = p_tenant_id 
    AND room_type_id = p_room_type_id
    AND status != 'out_of_order';
    
  -- Count conflicting reservations in the date range
  SELECT COUNT(*) INTO conflicting_reservations
  FROM reservations r
  WHERE r.tenant_id = p_tenant_id
    AND (
      -- Either has specific room of this type assigned
      (r.room_id IN (
        SELECT id FROM rooms 
        WHERE tenant_id = p_tenant_id 
          AND room_type_id = p_room_type_id
      ))
      -- Or is soft hold for this room type
      OR (r.room_type_id = p_room_type_id)
    )
    AND r.status IN ('confirmed', 'checked_in', 'soft_hold', 'hard_assigned')
    AND (r.id != p_exclude_reservation_id OR p_exclude_reservation_id IS NULL)
    AND (
      (p_check_in_date >= r.check_in_date AND p_check_in_date < r.check_out_date) OR
      (p_check_out_date > r.check_in_date AND p_check_out_date <= r.check_out_date) OR
      (p_check_in_date <= r.check_in_date AND p_check_out_date >= r.check_out_date)
    );
    
  RETURN conflicting_reservations < total_rooms;
END;
$$;

-- Create function to auto-expire reservations
CREATE OR REPLACE FUNCTION auto_expire_reservations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_reservation RECORD;
BEGIN
  -- Find expired reservations
  FOR expired_reservation IN
    SELECT r.*, g.reliability_score
    FROM reservations r
    LEFT JOIN guests g ON g.id = r.guest_id
    WHERE r.status IN ('pending', 'soft_hold', 'confirmed')
      AND (
        -- Payment deadline passed
        (r.payment_deadline IS NOT NULL AND r.payment_deadline < now())
        -- Or verification deadline passed
        OR (r.verification_deadline IS NOT NULL AND r.verification_deadline < now())
        -- Or general expiry passed
        OR (r.expires_at IS NOT NULL AND r.expires_at < now())
        -- Or no-show (check-in date + grace period passed)
        OR (r.check_in_date < CURRENT_DATE 
            AND now() > (r.check_in_date + interval '1 day' + (COALESCE(r.grace_period_hours, 3) || ' hours')::interval))
      )
  LOOP
    -- Log the status change
    INSERT INTO reservation_status_log (
      tenant_id, reservation_id, old_status, new_status, 
      change_reason, metadata
    ) VALUES (
      expired_reservation.tenant_id,
      expired_reservation.id,
      expired_reservation.status,
      CASE 
        WHEN expired_reservation.check_in_date < CURRENT_DATE THEN 'no_show'
        ELSE 'expired'
      END,
      'Auto-expired by system',
      jsonb_build_object('expired_at', now(), 'original_status', expired_reservation.status)
    );
    
    -- Update reservation status
    UPDATE reservations 
    SET 
      status = CASE 
        WHEN expired_reservation.check_in_date < CURRENT_DATE THEN 'no_show'
        ELSE 'expired'
      END,
      updated_at = now()
    WHERE id = expired_reservation.id;
    
    -- Update guest reliability score if no-show
    IF expired_reservation.check_in_date < CURRENT_DATE AND expired_reservation.guest_id IS NOT NULL THEN
      UPDATE guests 
      SET 
        no_show_count = no_show_count + 1,
        reliability_score = GREATEST(0, reliability_score - 10),
        updated_at = now()
      WHERE id = expired_reservation.guest_id;
    END IF;
    
    -- Update room type counts
    IF expired_reservation.room_type_id IS NOT NULL THEN
      PERFORM update_room_type_counts(expired_reservation.tenant_id, expired_reservation.room_type_id);
    END IF;
  END LOOP;
END;
$$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_room_type_availability_date ON room_type_availability(tenant_id, room_type_id, availability_date);
CREATE INDEX IF NOT EXISTS idx_reservations_soft_hold ON reservations(tenant_id, status) WHERE status IN ('soft_hold', 'hard_assigned');
CREATE INDEX IF NOT EXISTS idx_reservations_expires_at ON reservations(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reservations_room_type ON reservations(tenant_id, room_type_id) WHERE room_type_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_guest_reliability ON guests(tenant_id, reliability_score);
CREATE INDEX IF NOT EXISTS idx_booking_verification_expires ON booking_verification(expires_at) WHERE verification_status = 'pending';