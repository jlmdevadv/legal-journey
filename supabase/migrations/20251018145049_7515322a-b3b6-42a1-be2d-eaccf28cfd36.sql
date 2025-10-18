-- Criar tabela para tipos de partes customizáveis
CREATE TABLE IF NOT EXISTS party_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('main', 'other')),
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE party_types ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read
CREATE POLICY "Allow public read access"
ON party_types FOR SELECT
USING (true);

-- Policy: Everyone can write (para permitir modo admin adicionar tipos)
CREATE POLICY "Allow public write access"
ON party_types FOR ALL
USING (true);

-- Seed dados padrão
INSERT INTO party_types (name, category, description, is_default, display_order) VALUES
  ('Contratante', 'main', 'Parte principal que contrata', true, 1),
  ('Contratado', 'main', 'Parte principal que é contratada', true, 2),
  ('Credor', 'main', 'Parte principal credora', true, 3),
  ('Devedor', 'main', 'Parte principal devedora', true, 4),
  ('Notificante', 'main', 'Parte que notifica', true, 5),
  ('Notificado', 'main', 'Parte notificada', true, 6),
  ('Anuente', 'other', 'Parte que concorda com o contrato', true, 7),
  ('Fiador', 'other', 'Parte que garante o cumprimento', true, 8),
  ('Avalista', 'other', 'Parte que avaliza operações', true, 9),
  ('Testemunha', 'other', 'Parte que testemunha o acordo', true, 10);

-- Trigger para updated_at
CREATE TRIGGER update_party_types_updated_at
  BEFORE UPDATE ON party_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();