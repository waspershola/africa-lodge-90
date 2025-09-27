-- Add source tracking columns to sms_templates table
ALTER TABLE public.sms_templates 
ADD COLUMN IF NOT EXISTS source_template_id UUID,
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE;

-- Add foreign key constraint (only if column was added)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'sms_templates' 
    AND constraint_name = 'fk_source_template'
  ) THEN
    ALTER TABLE public.sms_templates 
    ADD CONSTRAINT fk_source_template 
    FOREIGN KEY (source_template_id) REFERENCES public.sms_templates(id);
  END IF;
END $$;