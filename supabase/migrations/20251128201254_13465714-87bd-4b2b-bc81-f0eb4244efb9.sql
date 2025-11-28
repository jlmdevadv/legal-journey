-- =====================================================
-- MIGRATION 1: PROFILES TABLE
-- =====================================================

-- Criar tabela de perfis vinculada a auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem ver apenas seu próprio perfil
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Política: usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para criar perfil automaticamente no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Trigger no signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- MIGRATION 2: USER ROLES SYSTEM
-- =====================================================

-- Criar enum de papéis
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Criar tabela de papéis
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem ver apenas seus próprios papéis
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Função segura para verificar papel (evita recursão RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- Função para obter papel do usuário atual
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Atribuir papel 'user' automaticamente no signup
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_default_role();

-- =====================================================
-- MIGRATION 3: SAVED CONTRACTS TABLE
-- =====================================================

-- Criar tabela de contratos salvos
CREATE TABLE public.saved_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  template_id TEXT REFERENCES public.contract_templates(id) ON DELETE SET NULL,
  
  -- Nome personalizado do contrato
  name TEXT NOT NULL,
  
  -- Status do preenchimento
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'archived')),
  
  -- Dados do formulário (JSON)
  form_values JSONB NOT NULL DEFAULT '{}',
  
  -- Dados das partes principais
  parties_data JSONB NOT NULL DEFAULT '[]',
  number_of_parties INTEGER NOT NULL DEFAULT 0,
  
  -- Dados das outras partes
  other_parties_data JSONB NOT NULL DEFAULT '[]',
  number_of_other_parties INTEGER NOT NULL DEFAULT 0,
  has_other_parties BOOLEAN NOT NULL DEFAULT false,
  
  -- Dados de local e data
  location_data JSONB NOT NULL DEFAULT '{"city": "", "state": "", "date": ""}',
  
  -- Campos repetíveis
  repeatable_fields_data JSONB NOT NULL DEFAULT '[]',
  
  -- Índice da pergunta atual (para continuar depois)
  current_question_index INTEGER NOT NULL DEFAULT -1,
  current_party_loop_index INTEGER NOT NULL DEFAULT 0,
  
  -- Documento gerado (cache do texto final)
  generated_document TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_accessed_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_saved_contracts_user_id ON public.saved_contracts(user_id);
CREATE INDEX idx_saved_contracts_status ON public.saved_contracts(status);
CREATE INDEX idx_saved_contracts_updated_at ON public.saved_contracts(updated_at DESC);

-- Habilitar RLS
ALTER TABLE public.saved_contracts ENABLE ROW LEVEL SECURITY;

-- Políticas: usuários só podem ver/editar seus próprios contratos
CREATE POLICY "Users can view own contracts"
  ON public.saved_contracts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contracts"
  ON public.saved_contracts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contracts"
  ON public.saved_contracts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own contracts"
  ON public.saved_contracts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_saved_contracts_updated_at
  BEFORE UPDATE ON public.saved_contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- MIGRATION 4: UPDATE CONTRACT_TEMPLATES RLS
-- =====================================================

-- Remover políticas antigas de acesso público total
DROP POLICY IF EXISTS "Allow public read access" ON public.contract_templates;
DROP POLICY IF EXISTS "Allow public write access" ON public.contract_templates;

-- Política: qualquer um pode ler templates
CREATE POLICY "Anyone can read templates"
  ON public.contract_templates FOR SELECT
  USING (true);

-- Política: apenas admins podem inserir templates
CREATE POLICY "Only admins can insert templates"
  ON public.contract_templates FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Política: apenas admins podem atualizar templates
CREATE POLICY "Only admins can update templates"
  ON public.contract_templates FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Política: apenas admins podem deletar templates
CREATE POLICY "Only admins can delete templates"
  ON public.contract_templates FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));