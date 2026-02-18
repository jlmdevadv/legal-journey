
-- ============================================================
-- SUB-FASE 1.5.1: Compartilhamento e Revisão - Infraestrutura
-- ============================================================

-- 1. Criar tabela share_links
CREATE TABLE public.share_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id TEXT NOT NULL REFERENCES public.contract_templates(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by_user_id UUID NOT NULL,
  token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex') UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '10 days'),
  is_revoked BOOLEAN NOT NULL DEFAULT false,
  revoked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Masters can view org share links"
ON public.share_links FOR SELECT TO authenticated
USING (
  organization_id IN (
    SELECT o.id FROM public.organizations o WHERE o.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Masters can create org share links"
ON public.share_links FOR INSERT TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT o.id FROM public.organizations o WHERE o.owner_user_id = auth.uid()
  )
  AND created_by_user_id = auth.uid()
);

CREATE POLICY "Masters can update org share links"
ON public.share_links FOR UPDATE TO authenticated
USING (
  organization_id IN (
    SELECT o.id FROM public.organizations o WHERE o.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can read by token"
ON public.share_links FOR SELECT TO authenticated
USING (true);

-- 2. Expandir saved_contracts
ALTER TABLE public.saved_contracts
  ADD COLUMN organization_id UUID REFERENCES public.organizations(id),
  ADD COLUMN share_link_id UUID REFERENCES public.share_links(id),
  ADD COLUMN reviewed_by_user_id UUID,
  ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN review_notes TEXT,
  ADD COLUMN submitted_for_review_at TIMESTAMP WITH TIME ZONE;

-- 3. RLS: masters podem ver e atualizar documentos da sua org
CREATE POLICY "Masters can view org documents"
ON public.saved_contracts FOR SELECT TO authenticated
USING (
  organization_id IS NOT NULL
  AND organization_id IN (
    SELECT o.id FROM public.organizations o WHERE o.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Masters can update org document status"
ON public.saved_contracts FOR UPDATE TO authenticated
USING (
  organization_id IS NOT NULL
  AND organization_id IN (
    SELECT o.id FROM public.organizations o WHERE o.owner_user_id = auth.uid()
  )
);

-- 4. Função validate_share_link
CREATE OR REPLACE FUNCTION public.validate_share_link(link_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _link RECORD;
  _template RECORD;
  _org RECORD;
BEGIN
  SELECT * INTO _link
  FROM public.share_links
  WHERE token = link_token;

  IF _link IS NULL THEN
    RETURN json_build_object('valid', false, 'error', 'Link não encontrado');
  END IF;

  IF _link.is_revoked THEN
    RETURN json_build_object('valid', false, 'error', 'Link foi revogado');
  END IF;

  IF _link.expires_at < now() THEN
    RETURN json_build_object('valid', false, 'error', 'Link expirado');
  END IF;

  SELECT id, name INTO _template
  FROM public.contract_templates
  WHERE id = _link.template_id;

  IF _template IS NULL THEN
    RETURN json_build_object('valid', false, 'error', 'Template não encontrado');
  END IF;

  SELECT id, name INTO _org
  FROM public.organizations
  WHERE id = _link.organization_id;

  RETURN json_build_object(
    'valid', true,
    'template_id', _link.template_id,
    'organization_id', _link.organization_id,
    'template_name', _template.name,
    'organization_name', _org.name,
    'share_link_id', _link.id
  );
END;
$$;

-- 5. Índices
CREATE INDEX idx_share_links_token ON public.share_links(token);
CREATE INDEX idx_share_links_org ON public.share_links(organization_id);
CREATE INDEX idx_saved_contracts_org ON public.saved_contracts(organization_id);
CREATE INDEX idx_saved_contracts_share_link ON public.saved_contracts(share_link_id);
