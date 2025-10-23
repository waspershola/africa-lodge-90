-- Fix the foreign key constraint for guest_messages
-- The constraint name suggests it references qr_orders but the column is qr_request_id
-- and should reference qr_requests table

-- Drop the old foreign key
ALTER TABLE guest_messages 
DROP CONSTRAINT IF EXISTS guest_messages_qr_order_id_fkey;

-- Add the correct foreign key to qr_requests
ALTER TABLE guest_messages 
ADD CONSTRAINT guest_messages_qr_request_id_fkey 
FOREIGN KEY (qr_request_id) 
REFERENCES qr_requests(id) 
ON DELETE CASCADE;