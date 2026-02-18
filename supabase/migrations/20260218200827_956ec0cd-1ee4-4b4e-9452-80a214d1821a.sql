
-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Users can view accessible templates" ON public.contract_templates;

-- Create expanded SELECT policy that includes templates with active share links
CREATE POLICY "Users can view accessible templates"
ON public.contract_templates
FOR SELECT
USING (
  organization_id IS NULL
  OR organization_id IN (SELECT id FROM organizations WHERE owner_user_id = auth.uid())
  OR id IN (
    SELECT template_id FROM share_links
    WHERE is_revoked = false
    AND expires_at > now()
  )
);
