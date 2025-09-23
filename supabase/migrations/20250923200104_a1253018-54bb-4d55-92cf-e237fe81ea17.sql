-- Make room_id nullable in qr_codes table to support non-room-specific QR codes
ALTER TABLE qr_codes ALTER COLUMN room_id DROP NOT NULL;