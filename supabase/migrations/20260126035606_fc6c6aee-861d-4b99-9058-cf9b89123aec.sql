-- ============================================================
-- FASE 1.0.1 - MIGRATION 2: Estruturas B2B2C
-- ============================================================

-- 2. Criar Tabela organizations
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  templates_limit INTEGER DEFAULT 5,
  UNIQUE(owner_user_id)
);

CREATE INDEX idx_organizations_owner ON public.organizations(owner_user_id);

CREATE TRIGGER update_organizations_updated_at 
  BEFORE UPDATE ON public.organizations 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. RLS para organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own organization" 
  ON public.organizations FOR SELECT 
  USING (owner_user_id = auth.uid());

CREATE POLICY "Users can update own organization" 
  ON public.organizations FOR UPDATE 
  USING (owner_user_id = auth.uid());

CREATE POLICY "System can insert organizations" 
  ON public.organizations FOR INSERT 
  WITH CHECK (owner_user_id = auth.uid());

-- 4. Adicionar organization_id aos templates
ALTER TABLE public.contract_templates 
  ADD COLUMN IF NOT EXISTS organization_id UUID 
  REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_templates_organization 
  ON public.contract_templates(organization_id);

-- 5. Atualizar RLS dos templates (remover antigas, criar novas)
DROP POLICY IF EXISTS "Anyone can read templates" ON public.contract_templates;
DROP POLICY IF EXISTS "Only admins can insert templates" ON public.contract_templates;
DROP POLICY IF EXISTS "Only admins can update templates" ON public.contract_templates;
DROP POLICY IF EXISTS "Only admins can delete templates" ON public.contract_templates;

CREATE POLICY "Users can view accessible templates" 
  ON public.contract_templates FOR SELECT 
  USING (
    organization_id IS NULL 
    OR organization_id IN (
      SELECT id FROM public.organizations WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Authorized users can create templates" 
  ON public.contract_templates FOR INSERT 
  WITH CHECK (
    (organization_id IS NULL AND public.has_role(auth.uid(), 'admin'))
    OR (organization_id IN (
      SELECT id FROM public.organizations WHERE owner_user_id = auth.uid()
    ))
  );

CREATE POLICY "Authorized users can update templates" 
  ON public.contract_templates FOR UPDATE 
  USING (
    (organization_id IS NULL AND public.has_role(auth.uid(), 'admin'))
    OR (organization_id IN (
      SELECT id FROM public.organizations WHERE owner_user_id = auth.uid()
    ))
  );

CREATE POLICY "Authorized users can delete templates" 
  ON public.contract_templates FOR DELETE 
  USING (
    (organization_id IS NULL AND public.has_role(auth.uid(), 'admin'))
    OR (organization_id IN (
      SELECT id FROM public.organizations WHERE owner_user_id = auth.uid()
    ))
  );

-- 6. Funções Auxiliares

-- 6.1 Verificar se usuário é master
CREATE OR REPLACE FUNCTION public.is_master(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'master'
  );
$$;

-- 6.2 Criar conta de mestre
CREATE OR REPLACE FUNCTION public.create_master_account(
  _user_email TEXT,
  _organization_name TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _org_id UUID;
BEGIN
  SELECT id INTO _user_id FROM auth.users WHERE email = _user_email;
  
  IF _user_id IS NULL THEN
    RETURN 'Error: User not found with email ' || _user_email;
  END IF;
  
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'master') THEN
    RETURN 'Error: User is already a master';
  END IF;
  
  IF EXISTS (SELECT 1 FROM public.organizations WHERE owner_user_id = _user_id) THEN
    RETURN 'Error: User already has an organization';
  END IF;
  
  INSERT INTO public.organizations (name, owner_user_id)
  VALUES (_organization_name, _user_id)
  RETURNING id INTO _org_id;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'master')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN 'Success: User promoted to master of "' || _organization_name || '"';
END;
$$;

-- 6.3 Obter organização do usuário
CREATE OR REPLACE FUNCTION public.get_user_organization()
RETURNS TABLE (
  id UUID,
  name TEXT,
  templates_limit INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.id, o.name, o.templates_limit, o.created_at
  FROM public.organizations o
  WHERE o.owner_user_id = auth.uid()
  LIMIT 1;
$$;