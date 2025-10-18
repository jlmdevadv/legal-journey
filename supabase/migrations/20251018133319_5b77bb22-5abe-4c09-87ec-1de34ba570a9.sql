-- Add new fields to contract_templates table
ALTER TABLE contract_templates
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS created_by TEXT,
ADD COLUMN IF NOT EXISTS last_modified_by TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_contract_templates_is_default 
ON contract_templates(is_default);

-- Add comment for documentation
COMMENT ON COLUMN contract_templates.is_default IS 'Indicates if this is a default/system template';
COMMENT ON COLUMN contract_templates.created_by IS 'User or system that created the template';
COMMENT ON COLUMN contract_templates.last_modified_by IS 'User or system that last modified the template';