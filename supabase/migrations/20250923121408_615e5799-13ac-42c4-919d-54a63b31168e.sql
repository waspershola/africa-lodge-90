-- Create storage policies for hotel logo uploads
-- Allow users to upload their own hotel logos

-- Create policy for users to upload their own tenant's logos
CREATE POLICY "Users can upload their own tenant logo" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'hotel-logos' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = (
    SELECT tenant_id::text 
    FROM public.users 
    WHERE id = auth.uid()
  )
);

-- Create policy for users to view their own tenant's logos
CREATE POLICY "Users can view their own tenant logo" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'hotel-logos' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = (
    SELECT tenant_id::text 
    FROM public.users 
    WHERE id = auth.uid()
  )
);

-- Create policy for users to update their own tenant's logos
CREATE POLICY "Users can update their own tenant logo" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'hotel-logos' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = (
    SELECT tenant_id::text 
    FROM public.users 
    WHERE id = auth.uid()
  )
);

-- Create policy for users to delete their own tenant's logos
CREATE POLICY "Users can delete their own tenant logo" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'hotel-logos' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = (
    SELECT tenant_id::text 
    FROM public.users 
    WHERE id = auth.uid()
  )
);

-- Make the hotel-logos bucket publicly accessible for viewing
UPDATE storage.buckets 
SET public = true 
WHERE id = 'hotel-logos';