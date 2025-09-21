-- Create storage bucket for hotel logos
INSERT INTO storage.buckets (id, name, public) VALUES ('hotel-logos', 'hotel-logos', true);

-- Create policies for hotel logos bucket
CREATE POLICY "Users can view hotel logos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'hotel-logos');

CREATE POLICY "Owners can upload hotel logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'hotel-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owners can update hotel logos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'hotel-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owners can delete hotel logos"
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'hotel-logos' AND auth.uid()::text = (storage.foldername(name))[1]);