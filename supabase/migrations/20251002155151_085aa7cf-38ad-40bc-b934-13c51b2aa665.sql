-- Phase 1: Database Schema Enhancement for VAT & Service Charge

-- 1. Extend hotel_settings table with applicability arrays
ALTER TABLE hotel_settings 
ADD COLUMN IF NOT EXISTS vat_applicable_to TEXT[] DEFAULT ARRAY['room', 'food', 'beverage', 'laundry', 'spa']::TEXT[],
ADD COLUMN IF NOT EXISTS service_applicable_to TEXT[] DEFAULT ARRAY['room', 'food', 'beverage', 'spa']::TEXT[],
ADD COLUMN IF NOT EXISTS show_tax_breakdown BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS zero_rate_hidden BOOLEAN DEFAULT true;

-- 2. Enhance folio_charges table with tax tracking
ALTER TABLE folio_charges
ADD COLUMN IF NOT EXISTS is_taxable BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_service_chargeable BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS base_amount NUMERIC,
ADD COLUMN IF NOT EXISTS vat_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS service_charge_amount NUMERIC DEFAULT 0;

-- Backfill existing data
UPDATE folio_charges 
SET base_amount = amount,
    vat_amount = 0,
    service_charge_amount = 0
WHERE base_amount IS NULL;

-- 3. Add guest tax exemption support
ALTER TABLE guests
ADD COLUMN IF NOT EXISTS tax_exempt BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tax_exempt_reason TEXT;

-- 4. Add corporate account tax exemption
ALTER TABLE corporate_accounts
ADD COLUMN IF NOT EXISTS tax_exempt BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tax_exempt_reason TEXT;

-- 5. Create function to calculate charges with taxes
CREATE OR REPLACE FUNCTION calculate_charge_with_taxes(
  p_base_amount NUMERIC,
  p_charge_type TEXT,
  p_tenant_id UUID,
  p_is_taxable BOOLEAN DEFAULT true,
  p_is_service_chargeable BOOLEAN DEFAULT true,
  p_guest_tax_exempt BOOLEAN DEFAULT false
) RETURNS TABLE(
  base_amount NUMERIC,
  vat_amount NUMERIC,
  service_charge_amount NUMERIC,
  total_amount NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vat_rate NUMERIC := 0;
  v_service_rate NUMERIC := 0;
  v_tax_inclusive BOOLEAN := false;
  v_service_inclusive BOOLEAN := false;
  v_vat_applicable_to TEXT[];
  v_service_applicable_to TEXT[];
  v_calculated_vat NUMERIC := 0;
  v_calculated_service NUMERIC := 0;
  v_calculated_base NUMERIC := p_base_amount;
BEGIN
  -- Get hotel settings
  SELECT 
    COALESCE(tax_rate, 7.5),
    COALESCE(service_charge_rate, 10.0),
    COALESCE((email_settings->>'tax_inclusive')::boolean, false),
    COALESCE((email_settings->>'service_charge_inclusive')::boolean, false),
    COALESCE(vat_applicable_to, ARRAY['room', 'food', 'beverage', 'laundry', 'spa']::TEXT[]),
    COALESCE(service_applicable_to, ARRAY['room', 'food', 'beverage', 'spa']::TEXT[])
  INTO 
    v_vat_rate, v_service_rate, v_tax_inclusive, v_service_inclusive,
    v_vat_applicable_to, v_service_applicable_to
  FROM hotel_settings
  WHERE tenant_id = p_tenant_id
  LIMIT 1;

  -- Check if guest is tax exempt
  IF p_guest_tax_exempt THEN
    RETURN QUERY SELECT p_base_amount, 0::NUMERIC, 0::NUMERIC, p_base_amount;
    RETURN;
  END IF;

  -- Check if charge type is applicable for VAT
  IF p_is_taxable AND p_charge_type = ANY(v_vat_applicable_to) THEN
    IF v_tax_inclusive THEN
      -- Reverse calculate: base = amount / (1 + rate/100)
      v_calculated_base := p_base_amount / (1 + v_vat_rate / 100);
      v_calculated_vat := p_base_amount - v_calculated_base;
    ELSE
      -- Add on top
      v_calculated_vat := p_base_amount * v_vat_rate / 100;
    END IF;
  END IF;

  -- Check if charge type is applicable for Service Charge
  IF p_is_service_chargeable AND p_charge_type = ANY(v_service_applicable_to) THEN
    IF v_service_inclusive THEN
      -- Reverse calculate from remaining base
      IF v_tax_inclusive THEN
        v_calculated_base := v_calculated_base / (1 + v_service_rate / 100);
        v_calculated_service := (p_base_amount - v_calculated_vat) - v_calculated_base;
      ELSE
        v_calculated_base := p_base_amount / (1 + v_service_rate / 100);
        v_calculated_service := p_base_amount - v_calculated_base;
      END IF;
    ELSE
      -- Add on top
      v_calculated_service := v_calculated_base * v_service_rate / 100;
    END IF;
  END IF;

  -- Return breakdown
  RETURN QUERY SELECT 
    v_calculated_base,
    ROUND(v_calculated_vat, 2),
    ROUND(v_calculated_service, 2),
    ROUND(v_calculated_base + v_calculated_vat + v_calculated_service, 2);
END;
$$;

-- 6. Update atomic_checkin_guest to use tax calculation
CREATE OR REPLACE FUNCTION atomic_checkin_guest(
  p_tenant_id uuid,
  p_guest_data jsonb,
  p_reservation_data jsonb,
  p_room_id uuid,
  p_charges jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_guest_id uuid;
  v_reservation_id uuid;
  v_folio_id uuid;
  v_reservation_number text;
  v_folio_number text;
  v_charge jsonb;
  v_tax_breakdown RECORD;
  v_guest_tax_exempt BOOLEAN := false;
BEGIN
  -- Get or create guest
  INSERT INTO guests (
    tenant_id, first_name, last_name, email, phone, 
    guest_id_number, nationality, address
  ) VALUES (
    p_tenant_id,
    p_guest_data->>'first_name',
    p_guest_data->>'last_name',
    p_guest_data->>'email',
    p_guest_data->>'phone',
    p_guest_data->>'guest_id_number',
    p_guest_data->>'nationality',
    p_guest_data->>'address'
  )
  ON CONFLICT (tenant_id, email)
  DO UPDATE SET
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    updated_at = now()
  RETURNING id, COALESCE(tax_exempt, false) INTO v_guest_id, v_guest_tax_exempt;

  -- Generate reservation number
  v_reservation_number := 'RES-' || to_char(now(), 'YYYYMMDD') || '-' || LPAD(floor(random() * 10000)::text, 4, '0');

  -- Create reservation
  INSERT INTO reservations (
    tenant_id, guest_id, guest_name, guest_email, guest_phone,
    room_id, check_in_date, check_out_date, adults, children,
    room_rate, total_amount, reservation_number, status, checked_in_at
  ) VALUES (
    p_tenant_id,
    v_guest_id,
    (p_guest_data->>'first_name') || ' ' || (p_guest_data->>'last_name'),
    p_guest_data->>'email',
    p_guest_data->>'phone',
    p_room_id,
    (p_reservation_data->>'check_in_date')::date,
    (p_reservation_data->>'check_out_date')::date,
    (p_reservation_data->>'adults')::integer,
    (p_reservation_data->>'children')::integer,
    (p_reservation_data->>'room_rate')::numeric,
    (p_reservation_data->>'total_amount')::numeric,
    v_reservation_number,
    'checked_in',
    now()
  ) RETURNING id INTO v_reservation_id;

  -- Update room status
  UPDATE rooms
  SET status = 'occupied',
      reservation_id = v_reservation_id,
      updated_at = now()
  WHERE id = p_room_id AND tenant_id = p_tenant_id;

  -- Create or get folio
  v_folio_number := 'FOL-' || to_char(now(), 'YYYYMMDD') || '-' || LPAD(v_reservation_id::text, 6, '0');
  
  INSERT INTO folios (
    tenant_id, reservation_id, folio_number, status
  ) VALUES (
    p_tenant_id, v_reservation_id, v_folio_number, 'open'
  )
  ON CONFLICT (reservation_id) 
  DO UPDATE SET updated_at = now()
  RETURNING id INTO v_folio_id;

  -- Add charges with tax calculation
  FOR v_charge IN SELECT * FROM jsonb_array_elements(p_charges)
  LOOP
    -- Calculate taxes for this charge
    SELECT * INTO v_tax_breakdown
    FROM calculate_charge_with_taxes(
      (v_charge->>'amount')::numeric,
      v_charge->>'charge_type',
      p_tenant_id,
      COALESCE((v_charge->>'is_taxable')::boolean, true),
      COALESCE((v_charge->>'is_service_chargeable')::boolean, true),
      v_guest_tax_exempt
    );

    INSERT INTO folio_charges (
      tenant_id, folio_id, charge_type, description,
      base_amount, vat_amount, service_charge_amount, amount,
      is_taxable, is_service_chargeable
    ) VALUES (
      p_tenant_id,
      v_folio_id,
      v_charge->>'charge_type',
      v_charge->>'description',
      v_tax_breakdown.base_amount,
      v_tax_breakdown.vat_amount,
      v_tax_breakdown.service_charge_amount,
      v_tax_breakdown.total_amount,
      COALESCE((v_charge->>'is_taxable')::boolean, true),
      COALESCE((v_charge->>'is_service_chargeable')::boolean, true)
    );
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'guest_id', v_guest_id,
    'reservation_id', v_reservation_id,
    'folio_id', v_folio_id,
    'reservation_number', v_reservation_number
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;