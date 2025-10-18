-- Create contract_templates table
CREATE TABLE public.contract_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  template TEXT NOT NULL,
  fields JSONB NOT NULL,
  version JSONB,
  use_party_system BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access (anyone can view templates)
CREATE POLICY "Allow public read access" 
ON public.contract_templates 
FOR SELECT 
USING (true);

-- Policy: Allow public write access (anyone can create/update/delete templates)
CREATE POLICY "Allow public write access" 
ON public.contract_templates 
FOR ALL 
USING (true);

-- Create trigger for automatic updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_contract_templates_updated_at
BEFORE UPDATE ON public.contract_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();