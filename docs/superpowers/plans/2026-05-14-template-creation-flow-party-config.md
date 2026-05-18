# Template Creation Flow & Party Config Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesenhar o fluxo de criação de templates do master (ContentModal → Wizard Typeform → Editor) e implementar configuração de partes, aba "Partes" no editor e Cadastro de Partes acessível a todos os usuários.

**Architecture:** Um `ContentModal` captura o conteúdo (texto/JSON/arquivo), um `TemplateWizard` acumula toda a configuração de partes em memória e cria o template ao final (sem rascunhos órfãos), e o `TemplateEditor` ganha uma aba "Partes" para edição pós-criação. O `Cadastro de Partes` é uma seção no Dashboard disponível para todos os perfis, com compartilhamento opt-in por link.

**Tech Stack:** React 18 + TypeScript, Supabase (PostgreSQL + RLS), shadcn/ui, sonner (toast), react-router-dom, mammoth (novo — parsing .docx)

---

## Mapa de Arquivos

| Arquivo | Ação | Responsabilidade |
|---------|------|-----------------|
| `src/types/template.ts` | Modificar | Adicionar `FixedParty`, `PartyConfig`, `PartyRegistryEntry`; estender `ContractTemplate` |
| `src/integrations/supabase/types.ts` | Modificar | Adicionar tabela `party_registry`, coluna `party_config`, coluna `share_party_registry` |
| `src/hooks/usePartyRegistry.ts` | Criar | CRUD da tabela `party_registry` |
| `src/components/admin/ContentModal.tsx` | Criar | Modal de entrada de conteúdo (3 abas) |
| `src/components/admin/wizard/TemplateWizard.tsx` | Criar | Container do wizard — controla passos e estado acumulado |
| `src/components/admin/wizard/WizardStep1Name.tsx` | Criar | Passo 1: nome do template |
| `src/components/admin/wizard/WizardStep2PartyConfig.tsx` | Criar | Passo 2: min/max partes, tipos aceitos |
| `src/components/admin/wizard/WizardStep3Roles.tsx` | Criar | Passo 3: lista de papéis |
| `src/components/admin/wizard/WizardStep4FixedParties.tsx` | Criar | Passo 4: partes fixas |
| `src/components/admin/wizard/WizardStep5OtherParties.tsx` | Criar | Passo 5: outras partes |
| `src/components/admin/wizard/WizardStep6Summary.tsx` | Criar | Passo 6: resumo + salvar |
| `src/components/admin/PartyRegistryLookup.tsx` | Criar | Modal de busca no Cadastro de Partes |
| `src/components/dashboard/PartyRegistrySection.tsx` | Criar | Seção do Dashboard — CRUD do cadastro |
| `src/components/admin/TemplatePartsTab.tsx` | Criar | Aba "Partes" do editor — espelha partyConfig |
| `src/components/dashboard/sections/MeusModelosSection.tsx` | Modificar | Botão "Novo Modelo" abre ContentModal em vez de navegar |
| `src/pages/MasterTemplateEditor.tsx` | Modificar | Remover path `isNew`; redirecionar `/master/template/new` ao dashboard |
| `src/components/admin/TemplateEditor.tsx` | Modificar | Adicionar aba "Partes" ao toggle de modos |
| `src/pages/Dashboard.tsx` | Modificar | Adicionar `PartyRegistrySection` |
| `src/components/master/GenerateLinkModal.tsx` | Modificar | Adicionar toggle `share_party_registry` |

---

## Task 1: TypeScript Types

**Files:**
- Modify: `src/types/template.ts`

- [ ] **Step 1: Adicionar novos tipos ao final de `src/types/template.ts`**

```typescript
export type PersonType = 'PF' | 'PJ';

export interface FixedParty {
  registryId?: string;
  role: string;
  name: string;
  personType: PersonType;
  document?: string;
  nationality?: string;
  maritalStatus?: string;
  profession?: string;
  address?: string;
  city?: string;
  state?: string;
  email?: string;
}

export interface OtherPartiesConfig {
  acceptedTypes: PersonType[];
  roles: string[];
  fixedParties: FixedParty[];
}

export interface PartyConfig {
  minParties: number;
  maxParties: number;
  acceptedTypes: PersonType[];
  roles: string[];
  allowOtherParties: boolean;
  fixedParties: FixedParty[];
  otherPartiesConfig?: OtherPartiesConfig;
}

export interface PartyRegistryEntry {
  id: string;
  owner_id: string;
  name: string;
  person_type: PersonType;
  document?: string;
  nationality?: string;
  marital_status?: string;
  profession?: string;
  address?: string;
  city?: string;
  state?: string;
  email?: string;
  created_at?: string;
}
```

- [ ] **Step 2: Estender `ContractTemplate` com `partyConfig`**

Localizar a interface `ContractTemplate` em `src/types/template.ts` e adicionar o campo:

```typescript
export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  fields: ContractField[];
  version?: TemplateVersion;
  usePartySystem?: boolean;
  partyConfig?: PartyConfig;   // <- adicionar esta linha
  created_at?: string;
  updated_at?: string;
  is_default?: boolean;
  created_by?: string;
  last_modified_by?: string;
  organization_id?: string | null;
}
```

- [ ] **Step 3: Verificar compilação**

```
npx tsc --noEmit
```

Esperado: sem erros de tipo. Se houver, corrigir antes de continuar.

- [ ] **Step 4: Commit**

```bash
git add src/types/template.ts
git commit -m "feat: adicionar tipos FixedParty, PartyConfig, PartyRegistryEntry e OtherPartiesConfig"
```

---

## Task 2: Migrações Supabase

**Files:**
- Modify: `src/integrations/supabase/types.ts`

- [ ] **Step 1: Executar SQL no Supabase Dashboard (SQL Editor)**

Abrir o projeto no Supabase Dashboard → SQL Editor → executar:

```sql
-- 1. Tabela party_registry
create table if not exists public.party_registry (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  person_type   text not null check (person_type in ('PF', 'PJ')),
  document      text,
  nationality   text,
  marital_status text,
  profession    text,
  address       text,
  city          text,
  state         text,
  email         text,
  created_at    timestamptz not null default now()
);

-- RLS: usuário vê apenas seus próprios registros
alter table public.party_registry enable row level security;

create policy "owner_all" on public.party_registry
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- 2. Coluna party_config em contract_templates
alter table public.contract_templates
  add column if not exists party_config jsonb;

-- 3. Coluna share_party_registry em share_links
alter table public.share_links
  add column if not exists share_party_registry boolean not null default false;
```

- [ ] **Step 2: Atualizar `src/integrations/supabase/types.ts` — adicionar `party_registry`**

Localizar o objeto `Tables` e adicionar antes de `organizations`:

```typescript
party_registry: {
  Row: {
    id: string
    owner_id: string
    name: string
    person_type: string
    document: string | null
    nationality: string | null
    marital_status: string | null
    profession: string | null
    address: string | null
    city: string | null
    state: string | null
    email: string | null
    created_at: string
  }
  Insert: {
    id?: string
    owner_id: string
    name: string
    person_type: string
    document?: string | null
    nationality?: string | null
    marital_status?: string | null
    profession?: string | null
    address?: string | null
    city?: string | null
    state?: string | null
    email?: string | null
    created_at?: string
  }
  Update: {
    id?: string
    owner_id?: string
    name?: string
    person_type?: string
    document?: string | null
    nationality?: string | null
    marital_status?: string | null
    profession?: string | null
    address?: string | null
    city?: string | null
    state?: string | null
    email?: string | null
    created_at?: string
  }
  Relationships: []
}
```

- [ ] **Step 3: Atualizar `contract_templates` Row/Insert/Update em `types.ts` — adicionar `party_config`**

Na definição de `contract_templates`, adicionar em cada seção:

```typescript
// Row:
party_config: Json | null

// Insert:
party_config?: Json | null

// Update:
party_config?: Json | null
```

- [ ] **Step 4: Atualizar `share_links` Row/Insert/Update — adicionar `share_party_registry`**

```typescript
// Row:
share_party_registry: boolean

// Insert:
share_party_registry?: boolean

// Update:
share_party_registry?: boolean
```

- [ ] **Step 5: Verificar compilação**

```
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add src/integrations/supabase/types.ts
git commit -m "feat: atualizar tipos Supabase para party_registry, party_config e share_party_registry"
```

---

## Task 3: Hook `usePartyRegistry`

**Files:**
- Create: `src/hooks/usePartyRegistry.ts`

- [ ] **Step 1: Criar o hook**

```typescript
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PartyRegistryEntry, PersonType } from '@/types/template';
import { toast } from 'sonner';

interface UsePartyRegistryReturn {
  entries: PartyRegistryEntry[];
  loading: boolean;
  add: (entry: Omit<PartyRegistryEntry, 'id' | 'owner_id' | 'created_at'>) => Promise<PartyRegistryEntry | null>;
  update: (id: string, entry: Partial<Omit<PartyRegistryEntry, 'id' | 'owner_id'>>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  reload: () => void;
}

export function usePartyRegistry(): UsePartyRegistryReturn {
  const { user } = useAuth();
  const [entries, setEntries] = useState<PartyRegistryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('party_registry')
      .select('*')
      .eq('owner_id', user.id)
      .order('name');
    if (error) {
      toast.error('Erro ao carregar cadastro de partes: ' + error.message);
    } else {
      setEntries((data ?? []).map(r => ({
        ...r,
        person_type: r.person_type as PersonType,
      })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const add = async (
    entry: Omit<PartyRegistryEntry, 'id' | 'owner_id' | 'created_at'>
  ): Promise<PartyRegistryEntry | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('party_registry')
      .insert({ ...entry, owner_id: user.id })
      .select()
      .single();
    if (error) { toast.error('Erro ao salvar parte: ' + error.message); return null; }
    const saved = { ...data, person_type: data.person_type as PersonType };
    setEntries(prev => [...prev, saved].sort((a, b) => a.name.localeCompare(b.name)));
    return saved;
  };

  const update = async (
    id: string,
    entry: Partial<Omit<PartyRegistryEntry, 'id' | 'owner_id'>>
  ): Promise<void> => {
    const { error } = await supabase
      .from('party_registry')
      .update(entry)
      .eq('id', id);
    if (error) { toast.error('Erro ao atualizar parte: ' + error.message); return; }
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...entry } : e));
  };

  const remove = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('party_registry')
      .delete()
      .eq('id', id);
    if (error) { toast.error('Erro ao remover parte: ' + error.message); return; }
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  return { entries, loading, add, update, remove, reload: load };
}
```

- [ ] **Step 2: Verificar compilação**

```
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/usePartyRegistry.ts
git commit -m "feat: hook usePartyRegistry com CRUD da tabela party_registry"
```

---

## Task 4: PartyRegistryLookup

**Files:**
- Create: `src/components/admin/PartyRegistryLookup.tsx`

Este componente é usado no Passo 4 e 5 do wizard e na aba "Partes" do editor para buscar partes do cadastro.

- [ ] **Step 1: Criar o componente**

```typescript
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, User, Building2 } from 'lucide-react';
import { PartyRegistryEntry } from '@/types/template';
import { usePartyRegistry } from '@/hooks/usePartyRegistry';

interface PartyRegistryLookupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (entry: PartyRegistryEntry) => void;
}

const PartyRegistryLookup = ({ open, onOpenChange, onSelect }: PartyRegistryLookupProps) => {
  const { entries, loading } = usePartyRegistry();
  const [query, setQuery] = useState('');

  const filtered = entries.filter(e =>
    e.name.toLowerCase().includes(query.toLowerCase()) ||
    (e.document ?? '').includes(query)
  );

  const handleSelect = (entry: PartyRegistryEntry) => {
    onSelect(entry);
    onOpenChange(false);
    setQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Buscar no Cadastro de Partes</DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por nome ou documento..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-6">Carregando...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            {entries.length === 0 ? 'Nenhuma parte cadastrada.' : 'Nenhum resultado encontrado.'}
          </p>
        ) : (
          <ul className="divide-y divide-border max-h-72 overflow-y-auto rounded-md border border-border">
            {filtered.map(entry => (
              <li key={entry.id}>
                <button
                  className="w-full text-left px-4 py-3 hover:bg-muted transition-colors flex items-center gap-3"
                  onClick={() => handleSelect(entry)}
                >
                  {entry.person_type === 'PJ'
                    ? <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                    : <User className="w-4 h-4 text-muted-foreground shrink-0" />
                  }
                  <div>
                    <p className="text-sm font-medium">{entry.name}</p>
                    {entry.document && (
                      <p className="text-xs text-muted-foreground">{entry.document}</p>
                    )}
                  </div>
                  <span className="ml-auto text-xs text-muted-foreground">{entry.person_type}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PartyRegistryLookup;
```

- [ ] **Step 2: Verificar compilação**

```
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/PartyRegistryLookup.tsx
git commit -m "feat: componente PartyRegistryLookup para busca no cadastro de partes"
```

---

## Task 5: ContentModal

**Files:**
- Create: `src/components/admin/ContentModal.tsx`

- [ ] **Step 1: Instalar mammoth para parsing de .docx**

```bash
npm install mammoth
```

- [ ] **Step 2: Criar o componente**

```typescript
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileJson, FileText, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import mammoth from 'mammoth';

interface ContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (content: string) => void;
}

const IMPORT_WARNING = 'Não é necessário incluir no texto: qualificação de partes, data e campo de assinatura. Esses elementos são configurados separadamente. Se incluídos, precisarão ser removidos manualmente.';

const ContentModal = ({ open, onOpenChange, onConfirm }: ContentModalProps) => {
  const [pastedText, setPastedText] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [activeTab, setActiveTab] = useState('paste');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    if (file.name.endsWith('.txt')) {
      const text = await file.text();
      setFileContent(text);
    } else if (file.name.endsWith('.docx')) {
      const buffer = await file.arrayBuffer();
      try {
        const result = await mammoth.extractRawValue({ arrayBuffer: buffer });
        setFileContent(result.value);
      } catch {
        toast.error('Erro ao ler arquivo .docx. Verifique se o arquivo não está corrompido.');
      }
    } else {
      toast.error('Formato não suportado. Use .txt ou .docx');
    }

    // reset input so same file can be selected again
    e.target.value = '';
  };

  const extractJsonContent = (raw: string): string => {
    try {
      const parsed = JSON.parse(raw);
      // Accept any string field that looks like document content
      return parsed.template ?? parsed.content ?? parsed.text ?? raw;
    } catch {
      return raw;
    }
  };

  const handleConfirm = () => {
    let content = '';
    if (activeTab === 'paste') content = pastedText.trim();
    else if (activeTab === 'json') content = extractJsonContent(jsonText.trim());
    else if (activeTab === 'file') content = fileContent.trim();

    if (!content) {
      toast.error('Insira ou importe o conteúdo do documento antes de continuar.');
      return;
    }

    onConfirm(content);
    setPastedText('');
    setJsonText('');
    setFileContent('');
    setFileName('');
    setActiveTab('paste');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo Modelo</DialogTitle>
          <DialogDescription>
            Insira o conteúdo do documento. A configuração de partes e campos será feita nas próximas etapas.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 text-sm mb-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{IMPORT_WARNING}</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="paste" className="flex-1">
              <FileText className="w-4 h-4 mr-2" />
              Colar texto
            </TabsTrigger>
            <TabsTrigger value="json" className="flex-1">
              <FileJson className="w-4 h-4 mr-2" />
              Importar JSON
            </TabsTrigger>
            <TabsTrigger value="file" className="flex-1">
              <Upload className="w-4 h-4 mr-2" />
              Upload de arquivo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="mt-4">
            <Textarea
              placeholder="Cole aqui o texto do contrato..."
              className="min-h-[280px] font-mono text-sm"
              value={pastedText}
              onChange={e => setPastedText(e.target.value)}
            />
          </TabsContent>

          <TabsContent value="json" className="mt-4">
            <Textarea
              placeholder="Cole aqui o JSON do template..."
              className="min-h-[280px] font-mono text-sm"
              value={jsonText}
              onChange={e => setJsonText(e.target.value)}
            />
          </TabsContent>

          <TabsContent value="file" className="mt-4">
            <label
              htmlFor="content-file-upload"
              className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border rounded-lg p-10 cursor-pointer hover:border-primary transition-colors"
            >
              <Upload className="w-10 h-10 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {fileName ? fileName : 'Clique para selecionar .txt ou .docx'}
              </span>
            </label>
            <input
              id="content-file-upload"
              type="file"
              accept=".txt,.docx"
              className="sr-only"
              onChange={handleFileUpload}
            />
            {fileContent && (
              <p className="mt-2 text-xs text-muted-foreground">
                {fileContent.length} caracteres extraídos.
              </p>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>
            Continuar →
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContentModal;
```

- [ ] **Step 3: Verificar compilação**

```
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/ContentModal.tsx package.json package-lock.json
git commit -m "feat: ContentModal com três abas de entrada de conteúdo (texto, JSON, arquivo)"
```

---

## Task 6: TemplateWizard — Container e Passo 1

**Files:**
- Create: `src/components/admin/wizard/TemplateWizard.tsx`
- Create: `src/components/admin/wizard/WizardStep1Name.tsx`

- [ ] **Step 1: Criar os tipos compartilhados do wizard**

Adicionar ao topo de `src/components/admin/wizard/TemplateWizard.tsx`:

```typescript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PartyConfig, FixedParty, OtherPartiesConfig, PersonType } from '@/types/template';
import { toast } from 'sonner';
import WizardStep1Name from './WizardStep1Name';
import WizardStep2PartyConfig from './WizardStep2PartyConfig';
import WizardStep3Roles from './WizardStep3Roles';
import WizardStep4FixedParties from './WizardStep4FixedParties';
import WizardStep5OtherParties from './WizardStep5OtherParties';
import WizardStep6Summary from './WizardStep6Summary';

export interface WizardState {
  content: string;
  name: string;
  minParties: number;
  maxParties: number;
  acceptedTypes: PersonType[];
  roles: string[];
  fixedParties: FixedParty[];
  allowOtherParties: boolean;
  otherPartiesConfig: OtherPartiesConfig;
}

interface TemplateWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialContent: string;
}

const TOTAL_STEPS = 6;

const TemplateWizard = ({ open, onOpenChange, initialContent }: TemplateWizardProps) => {
  const { organization, user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<WizardState>({
    content: initialContent,
    name: '',
    minParties: 2,
    maxParties: 2,
    acceptedTypes: ['PF', 'PJ'],
    roles: [],
    fixedParties: [],
    allowOtherParties: false,
    otherPartiesConfig: { acceptedTypes: ['PF', 'PJ'], roles: [], fixedParties: [] },
  });

  const update = (patch: Partial<WizardState>) =>
    setState(prev => ({ ...prev, ...patch }));

  const next = () => setStep(s => Math.min(s + 1, TOTAL_STEPS));
  const back = () => setStep(s => Math.max(s - 1, 1));

  const handleClose = () => {
    setStep(1);
    setState({
      content: '',
      name: '',
      minParties: 2,
      maxParties: 2,
      acceptedTypes: ['PF', 'PJ'],
      roles: [],
      fixedParties: [],
      allowOtherParties: false,
      otherPartiesConfig: { acceptedTypes: ['PF', 'PJ'], roles: [], fixedParties: [] },
    });
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    if (!organization || !user) return;
    setSaving(true);
    try {
      const partyConfig: PartyConfig = {
        minParties: state.minParties,
        maxParties: state.maxParties,
        acceptedTypes: state.acceptedTypes,
        roles: state.roles,
        allowOtherParties: state.allowOtherParties,
        fixedParties: state.fixedParties,
        otherPartiesConfig: state.allowOtherParties ? state.otherPartiesConfig : undefined,
      };

      const { data, error } = await supabase
        .from('contract_templates')
        .insert({
          id: crypto.randomUUID(),
          name: state.name,
          description: '',
          template: state.content,
          fields: [],
          use_party_system: true,
          party_config: partyConfig as any,
          organization_id: organization.id,
          created_by: user.email ?? null,
        })
        .select('id')
        .single();

      if (error) throw error;
      toast.success('Modelo criado! Agora configure os campos e cláusulas.');
      handleClose();
      navigate(`/master/template/${data.id}`);
    } catch (error: any) {
      toast.error('Erro ao criar modelo: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Re-sync content when initialContent changes (new modal open)
  React.useEffect(() => {
    if (open) setState(prev => ({ ...prev, content: initialContent }));
  }, [open, initialContent]);

  if (!open) return null;

  const stepProps = { state, update, onNext: next, onBack: back };

  return (
    <>
      {step === 1 && <WizardStep1Name {...stepProps} onClose={handleClose} />}
      {step === 2 && <WizardStep2PartyConfig {...stepProps} />}
      {step === 3 && <WizardStep3Roles {...stepProps} />}
      {step === 4 && <WizardStep4FixedParties {...stepProps} />}
      {step === 5 && <WizardStep5OtherParties {...stepProps} />}
      {step === 6 && <WizardStep6Summary {...stepProps} onConfirm={handleConfirm} saving={saving} onClose={handleClose} />}
    </>
  );
};

export default TemplateWizard;
```

- [ ] **Step 2: Criar `WizardStep1Name.tsx`**

```typescript
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WizardState } from './TemplateWizard';

interface Props {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

const WizardStep1Name = ({ state, update, onNext, onClose }: Props) => {
  const [error, setError] = useState('');

  const handleNext = () => {
    if (!state.name.trim()) { setError('O nome do modelo é obrigatório.'); return; }
    setError('');
    onNext();
  };

  return (
    <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Passo 1 de 6 — Nome do modelo</DialogTitle>
          <DialogDescription>Como este modelo será identificado no sistema?</DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <Label htmlFor="template-name">Nome do modelo</Label>
          <Input
            id="template-name"
            className="mt-2"
            placeholder="Ex: Contrato de Prestação de Serviços"
            value={state.name}
            onChange={e => { update({ name: e.target.value }); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleNext()}
            autoFocus
          />
          {error && <p className="text-sm text-destructive mt-1">{error}</p>}
        </div>

        <div className="flex justify-between">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleNext}>Próximo →</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WizardStep1Name;
```

- [ ] **Step 3: Verificar compilação**

```
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/wizard/
git commit -m "feat: TemplateWizard container e WizardStep1Name"
```

---

## Task 7: WizardStep2 e WizardStep3

**Files:**
- Create: `src/components/admin/wizard/WizardStep2PartyConfig.tsx`
- Create: `src/components/admin/wizard/WizardStep3Roles.tsx`

- [ ] **Step 1: Criar `WizardStep2PartyConfig.tsx`**

```typescript
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { WizardState } from './TemplateWizard';
import { PersonType } from '@/types/template';

interface Props {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

const WizardStep2PartyConfig = ({ state, update, onNext, onBack }: Props) => {
  const toggleType = (type: PersonType) => {
    const current = state.acceptedTypes;
    const next = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    if (next.length === 0) return; // ao menos um tipo deve estar marcado
    update({ acceptedTypes: next });
  };

  const isValid =
    state.minParties >= 1 &&
    state.maxParties >= state.minParties &&
    state.acceptedTypes.length > 0;

  return (
    <Dialog open>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Passo 2 de 6 — Configuração de partes</DialogTitle>
          <DialogDescription>Defina quantas partes este modelo aceita e quais tipos.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min-parties">Mínimo de partes</Label>
              <Input
                id="min-parties"
                type="number"
                min={1}
                className="mt-2"
                value={state.minParties}
                onChange={e => {
                  const min = Math.max(1, parseInt(e.target.value) || 1);
                  update({ minParties: min, maxParties: Math.max(state.maxParties, min) });
                }}
              />
            </div>
            <div>
              <Label htmlFor="max-parties">Máximo de partes</Label>
              <Input
                id="max-parties"
                type="number"
                min={state.minParties}
                className="mt-2"
                value={state.maxParties}
                onChange={e => {
                  const max = Math.max(state.minParties, parseInt(e.target.value) || state.minParties);
                  update({ maxParties: max });
                }}
              />
            </div>
          </div>

          <div>
            <Label>Tipos de pessoa aceitos</Label>
            <div className="flex gap-6 mt-3">
              {(['PF', 'PJ'] as PersonType[]).map(type => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={state.acceptedTypes.includes(type)}
                    onCheckedChange={() => toggleType(type)}
                  />
                  <span className="text-sm">{type === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>← Voltar</Button>
          <Button onClick={onNext} disabled={!isValid}>Próximo →</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WizardStep2PartyConfig;
```

- [ ] **Step 2: Criar `WizardStep3Roles.tsx`**

```typescript
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { WizardState } from './TemplateWizard';

interface Props {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

const SUGGESTED_ROLES = ['Contratante', 'Contratado', 'Outorgante', 'Outorgado', 'Fiador', 'Interveniente'];

const WizardStep3Roles = ({ state, update, onNext, onBack }: Props) => {
  const [input, setInput] = useState('');

  const addRole = (role: string) => {
    const trimmed = role.trim();
    if (!trimmed || state.roles.includes(trimmed)) return;
    update({ roles: [...state.roles, trimmed] });
    setInput('');
  };

  const removeRole = (role: string) =>
    update({ roles: state.roles.filter(r => r !== role) });

  return (
    <Dialog open>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Passo 3 de 6 — Papéis das partes</DialogTitle>
          <DialogDescription>
            Defina quais papéis existem neste modelo. Os preenchedores escolherão dentre estas opções.
            Pode ter mais ou menos papéis do que o número de partes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex gap-2">
            <Input
              placeholder="Ex: Contratante"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addRole(input)}
            />
            <Button variant="outline" size="icon" onClick={() => addRole(input)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {state.roles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {state.roles.map(role => (
                <Badge key={role} variant="secondary" className="gap-1 pr-1">
                  {role}
                  <button onClick={() => removeRole(role)} className="ml-1 hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <div>
            <p className="text-xs text-muted-foreground mb-2">Sugestões:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_ROLES.filter(r => !state.roles.includes(r)).map(role => (
                <button
                  key={role}
                  onClick={() => addRole(role)}
                  className="text-xs px-2 py-1 rounded border border-border hover:bg-muted transition-colors"
                >
                  + {role}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>← Voltar</Button>
          <Button onClick={onNext}>Próximo →</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WizardStep3Roles;
```

- [ ] **Step 3: Verificar compilação**

```
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/wizard/WizardStep2PartyConfig.tsx src/components/admin/wizard/WizardStep3Roles.tsx
git commit -m "feat: WizardStep2 (configuração de partes) e WizardStep3 (papéis)"
```

---

## Task 8: WizardStep4FixedParties

**Files:**
- Create: `src/components/admin/wizard/WizardStep4FixedParties.tsx`

- [ ] **Step 1: Criar `WizardStep4FixedParties.tsx`**

```typescript
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, BookUser } from 'lucide-react';
import { WizardState } from './TemplateWizard';
import { FixedParty, PartyRegistryEntry, PersonType } from '@/types/template';
import { usePartyRegistry } from '@/hooks/usePartyRegistry';
import PartyRegistryLookup from '../PartyRegistryLookup';

interface Props {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

const emptyFixedParty = (): FixedParty => ({
  role: '',
  name: '',
  personType: 'PF',
});

const WizardStep4FixedParties = ({ state, update, onNext, onBack }: Props) => {
  const { add: addToRegistry } = usePartyRegistry();
  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupTargetIndex, setLookupTargetIndex] = useState<number | null>(null);

  const addFixed = () =>
    update({ fixedParties: [...state.fixedParties, emptyFixedParty()] });

  const removeFixed = (index: number) =>
    update({ fixedParties: state.fixedParties.filter((_, i) => i !== index) });

  const updateFixed = (index: number, patch: Partial<FixedParty>) =>
    update({
      fixedParties: state.fixedParties.map((p, i) => i === index ? { ...p, ...patch } : p),
    });

  const openLookup = (index: number) => {
    setLookupTargetIndex(index);
    setLookupOpen(true);
  };

  const handleRegistrySelect = async (entry: PartyRegistryEntry) => {
    if (lookupTargetIndex === null) return;
    updateFixed(lookupTargetIndex, {
      registryId: entry.id,
      name: entry.name,
      personType: entry.person_type,
      document: entry.document ?? undefined,
      nationality: entry.nationality ?? undefined,
      maritalStatus: entry.marital_status ?? undefined,
      profession: entry.profession ?? undefined,
      address: entry.address ?? undefined,
      city: entry.city ?? undefined,
      state: entry.state ?? undefined,
      email: entry.email ?? undefined,
    });
    setLookupTargetIndex(null);
  };

  const handleSaveToRegistry = async (index: number) => {
    const party = state.fixedParties[index];
    if (!party.name) return;
    const saved = await addToRegistry({
      name: party.name,
      person_type: party.personType,
      document: party.document,
      nationality: party.nationality,
      marital_status: party.maritalStatus,
      profession: party.profession,
      address: party.address,
      city: party.city,
      state: party.state,
      email: party.email,
    });
    if (saved) updateFixed(index, { registryId: saved.id });
  };

  return (
    <Dialog open>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Passo 4 de 6 — Partes fixas</DialogTitle>
          <DialogDescription>
            Partes fixas já vêm preenchidas no modelo. O preenchedor as verá como somente leitura.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {state.fixedParties.map((party, i) => (
            <Card key={i}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Parte fixa {i + 1}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openLookup(i)}>
                      <BookUser className="w-4 h-4 mr-1" />
                      Buscar cadastro
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => removeFixed(i)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Papel</Label>
                    <Select
                      value={party.role}
                      onValueChange={v => updateFixed(i, { role: v })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {state.roles.map(r => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Tipo</Label>
                    <Select
                      value={party.personType}
                      onValueChange={v => updateFixed(i, { personType: v as PersonType })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PF">Pessoa Física</SelectItem>
                        <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Nome</Label>
                  <Input
                    className="mt-1"
                    placeholder="Nome completo ou razão social"
                    value={party.name}
                    onChange={e => updateFixed(i, { name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{party.personType === 'PJ' ? 'CNPJ' : 'CPF'}</Label>
                    <Input
                      className="mt-1"
                      value={party.document ?? ''}
                      onChange={e => updateFixed(i, { document: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>E-mail</Label>
                    <Input
                      className="mt-1"
                      type="email"
                      value={party.email ?? ''}
                      onChange={e => updateFixed(i, { email: e.target.value })}
                    />
                  </div>
                </div>

                {!party.registryId && party.name && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleSaveToRegistry(i)}
                  >
                    + Salvar no Cadastro de Partes
                  </Button>
                )}
                {party.registryId && (
                  <p className="text-xs text-muted-foreground">✓ Vinculado ao Cadastro de Partes</p>
                )}
              </CardContent>
            </Card>
          ))}

          <Button variant="outline" className="w-full" onClick={addFixed}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar parte fixa
          </Button>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>← Voltar</Button>
          <Button onClick={onNext}>Próximo →</Button>
        </div>

        <PartyRegistryLookup
          open={lookupOpen}
          onOpenChange={setLookupOpen}
          onSelect={handleRegistrySelect}
        />
      </DialogContent>
    </Dialog>
  );
};

export default WizardStep4FixedParties;
```

- [ ] **Step 2: Verificar compilação**

```
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/wizard/WizardStep4FixedParties.tsx
git commit -m "feat: WizardStep4 — configuração de partes fixas com lookup no cadastro"
```

---

## Task 9: WizardStep5 e WizardStep6

**Files:**
- Create: `src/components/admin/wizard/WizardStep5OtherParties.tsx`
- Create: `src/components/admin/wizard/WizardStep6Summary.tsx`

- [ ] **Step 1: Criar `WizardStep5OtherParties.tsx`**

```typescript
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { WizardState } from './TemplateWizard';
import { PersonType } from '@/types/template';

interface Props {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

const SUGGESTED_OTHER_ROLES = ['Testemunha', 'Avalista', 'Interveniente', 'Garantidor'];

const WizardStep5OtherParties = ({ state, update, onNext, onBack }: Props) => {
  const [roleInput, setRoleInput] = useState('');
  const cfg = state.otherPartiesConfig;

  const toggleOther = (enabled: boolean) => update({ allowOtherParties: enabled });

  const toggleType = (type: PersonType) => {
    const current = cfg.acceptedTypes;
    const next = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    if (next.length === 0) return;
    update({ otherPartiesConfig: { ...cfg, acceptedTypes: next } });
  };

  const addRole = (role: string) => {
    const trimmed = role.trim();
    if (!trimmed || cfg.roles.includes(trimmed)) return;
    update({ otherPartiesConfig: { ...cfg, roles: [...cfg.roles, trimmed] } });
    setRoleInput('');
  };

  const removeRole = (role: string) =>
    update({ otherPartiesConfig: { ...cfg, roles: cfg.roles.filter(r => r !== role) } });

  return (
    <Dialog open>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Passo 5 de 6 — Outras partes</DialogTitle>
          <DialogDescription>
            Outras partes são testemunhas, avalistas e similares — não os contratantes principais.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox
              checked={state.allowOtherParties}
              onCheckedChange={v => toggleOther(!!v)}
            />
            <span className="text-sm font-medium">Este modelo admite outras partes</span>
          </label>

          {state.allowOtherParties && (
            <>
              <div>
                <Label>Tipos aceitos</Label>
                <div className="flex gap-6 mt-3">
                  {(['PF', 'PJ'] as PersonType[]).map(type => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={cfg.acceptedTypes.includes(type)}
                        onCheckedChange={() => toggleType(type)}
                      />
                      <span className="text-sm">{type === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label>Papéis permitidos</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Ex: Testemunha"
                    value={roleInput}
                    onChange={e => setRoleInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addRole(roleInput)}
                  />
                  <Button variant="outline" size="icon" onClick={() => addRole(roleInput)}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {cfg.roles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {cfg.roles.map(role => (
                      <Badge key={role} variant="secondary" className="gap-1 pr-1">
                        {role}
                        <button onClick={() => removeRole(role)} className="ml-1 hover:text-destructive">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  {SUGGESTED_OTHER_ROLES.filter(r => !cfg.roles.includes(r)).map(role => (
                    <button
                      key={role}
                      onClick={() => addRole(role)}
                      className="text-xs px-2 py-1 rounded border border-border hover:bg-muted transition-colors"
                    >
                      + {role}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>← Voltar</Button>
          <Button onClick={onNext}>Próximo →</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WizardStep5OtherParties;
```

- [ ] **Step 2: Criar `WizardStep6Summary.tsx`**

```typescript
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Check } from 'lucide-react';
import { WizardState } from './TemplateWizard';

interface Props {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
  onConfirm: () => void;
  onClose: () => void;
  saving: boolean;
}

const WizardStep6Summary = ({ state, onBack, onConfirm, saving }: Props) => {
  const rows: [string, string][] = [
    ['Nome', state.name],
    ['Mínimo de partes', String(state.minParties)],
    ['Máximo de partes', String(state.maxParties)],
    ['Tipos aceitos', state.acceptedTypes.join(', ')],
    ['Papéis', state.roles.length > 0 ? state.roles.join(', ') : '(nenhum definido)'],
    ['Partes fixas', state.fixedParties.length > 0
      ? state.fixedParties.map(p => `${p.name} (${p.role || 'sem papel'})`).join('; ')
      : 'Nenhuma'],
    ['Outras partes', state.allowOtherParties
      ? `Sim — papéis: ${state.otherPartiesConfig.roles.join(', ') || 'livre'}`
      : 'Não'],
  ];

  return (
    <Dialog open>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Passo 6 de 6 — Resumo</DialogTitle>
          <DialogDescription>Confirme as configurações antes de criar o modelo.</DialogDescription>
        </DialogHeader>

        <dl className="divide-y divide-border rounded-lg border border-border overflow-hidden">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between px-4 py-3 text-sm">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-medium text-right max-w-[60%]">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="flex justify-between mt-2">
          <Button variant="outline" onClick={onBack} disabled={saving}>← Voltar</Button>
          <Button onClick={onConfirm} disabled={saving}>
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando...</>
            ) : (
              <><Check className="w-4 h-4 mr-2" />Confirmar e criar modelo</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WizardStep6Summary;
```

- [ ] **Step 3: Verificar compilação**

```
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/wizard/WizardStep5OtherParties.tsx src/components/admin/wizard/WizardStep6Summary.tsx
git commit -m "feat: WizardStep5 (outras partes) e WizardStep6 (resumo e confirmação)"
```

---

## Task 10: Integrar ContentModal + Wizard em MeusModelosSection

**Files:**
- Modify: `src/components/dashboard/sections/MeusModelosSection.tsx`

- [ ] **Step 1: Adicionar estado e imports**

Substituir o conteúdo de `MeusModelosSection.tsx` por:

```typescript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { ContractTemplate } from '@/types/template';
import GenerateLinkModal from '@/components/master/GenerateLinkModal';
import ContentModal from '@/components/admin/ContentModal';
import TemplateWizard from '@/components/admin/wizard/TemplateWizard';

interface Props {
  templates: ContractTemplate[];
  onReload: () => void;
}

const MeusModelosSection = ({ templates, onReload }: Props) => {
  const navigate = useNavigate();
  const { organization } = useAuth();
  const [linkModal, setLinkModal] = useState<{ open: boolean; templateId: string; templateName: string }>({
    open: false, templateId: '', templateName: '',
  });
  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [pendingContent, setPendingContent] = useState('');

  const limitReached = organization ? templates.length >= organization.templates_limit : false;

  const handleContentConfirm = (content: string) => {
    setPendingContent(content);
    setContentModalOpen(false);
    setWizardOpen(true);
  };

  const handleDelete = async (templateId: string, templateName: string) => {
    if (!organization) return;
    if (!confirm(`Excluir o modelo "${templateName}"?`)) return;
    const { error } = await supabase
      .from('contract_templates')
      .delete()
      .eq('id', templateId)
      .eq('organization_id', organization.id);
    if (error) { toast.error('Erro ao excluir: ' + error.message); return; }
    toast.success('Modelo excluído.');
    onReload();
  };

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-serif text-xl text-foreground">Meus Modelos</h2>
          <div className="mt-1 h-px w-full bg-border" />
        </div>
        <Button onClick={() => setContentModalOpen(true)} disabled={limitReached}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Modelo
        </Button>
      </div>

      {limitReached && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-sm">
            Limite de {organization?.templates_limit} modelos atingido. Entre em contato para ampliar seu plano.
          </p>
        </div>
      )}

      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center border border-dashed border-border rounded-lg">
          <p className="text-sm text-muted-foreground mb-4">Nenhum modelo criado ainda.</p>
          <Button onClick={() => setContentModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeiro Modelo
          </Button>
        </div>
      ) : (
        <div className="rounded-md border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Campos</TableHead>
                <TableHead>Versão</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="text-muted-foreground">{t.fields.length}</TableCell>
                  <TableCell className="text-muted-foreground">{(t.version as any)?.version ?? '1.0'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/master/template/${t.id}`)}>
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLinkModal({ open: true, templateId: t.id, templateName: t.name })}
                      >
                        Gerar Link
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(t.id, t.name)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <GenerateLinkModal
        open={linkModal.open}
        onOpenChange={open => setLinkModal(prev => ({ ...prev, open }))}
        templateId={linkModal.templateId}
        templateName={linkModal.templateName}
      />

      <ContentModal
        open={contentModalOpen}
        onOpenChange={setContentModalOpen}
        onConfirm={handleContentConfirm}
      />

      <TemplateWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        initialContent={pendingContent}
      />
    </section>
  );
};

export default MeusModelosSection;
```

- [ ] **Step 2: Verificar compilação**

```
npx tsc --noEmit
```

- [ ] **Step 3: Testar manualmente**

1. `npm run dev`
2. Logar como master
3. Acessar Dashboard
4. Clicar em "Novo Modelo"
5. Verificar que o ContentModal abre (3 abas: Colar texto, Importar JSON, Upload)
6. Colar um texto qualquer e clicar "Continuar →"
7. Verificar que o Wizard abre no Passo 1 (nome)
8. Preencher nome → Próximo → configurar partes → ... → Confirmar
9. Verificar que o template é criado e o editor abre

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/sections/MeusModelosSection.tsx
git commit -m "feat: botão 'Novo Modelo' abre ContentModal + TemplateWizard em vez de navegar direto"
```

---

## Task 11: MasterTemplateEditor — remover path isNew

**Files:**
- Modify: `src/pages/MasterTemplateEditor.tsx`

- [ ] **Step 1: Substituir o `useEffect` que tratava `isNew`**

No arquivo `src/pages/MasterTemplateEditor.tsx`, substituir o `useEffect` existente:

```typescript
useEffect(() => {
  if (!organization) return;
  if (isNew) {
    // Rota /master/template/new não é mais um ponto de entrada válido.
    // A criação acontece via ContentModal + TemplateWizard no Dashboard.
    navigate('/dashboard', { replace: true });
    return;
  }
  loadTemplate();
}, [templateId, organization]);
```

E remover a constante `isNew` ou ajustá-la (já que agora só é usada no `handleSave`). No `handleSave`, remover o branch `if (isNew)` — o template sempre existirá quando o editor abrir:

```typescript
const handleSave = async (updatedTemplate: ContractTemplate) => {
  if (!organization || !user) return;

  try {
    const record = {
      name: updatedTemplate.name,
      description: updatedTemplate.description || null,
      template: updatedTemplate.template,
      fields: updatedTemplate.fields as any,
      use_party_system: updatedTemplate.usePartySystem ?? true,
      party_config: updatedTemplate.partyConfig as any ?? null,
      version: updatedTemplate.version as any,
      organization_id: organization.id,
      last_modified_by: user.email || null,
    };

    const { error } = await supabase
      .from('contract_templates')
      .update(record)
      .eq('id', updatedTemplate.id)
      .eq('organization_id', organization.id);

    if (error) throw error;
    toast.success('Modelo salvo com sucesso!');
  } catch (error: any) {
    toast.error('Erro ao salvar: ' + error.message);
  }
};
```

Também atualizar o `loadTemplate` para mapear `party_config`:

```typescript
setTemplate({
  id: data.id,
  name: data.name,
  description: data.description || '',
  template: data.template,
  fields: Array.isArray(data.fields) ? (data.fields as any[]) : [],
  usePartySystem: data.use_party_system ?? true,
  partyConfig: data.party_config as any ?? undefined,
  version: data.version as any,
  organization_id: data.organization_id,
});
```

- [ ] **Step 2: Verificar compilação**

```
npx tsc --noEmit
```

- [ ] **Step 3: Testar**

Navegar para `/master/template/new` diretamente — verificar que redireciona para `/dashboard`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/MasterTemplateEditor.tsx
git commit -m "feat: remover path isNew do MasterTemplateEditor; criação passa pelo wizard"
```

---

## Task 12: TemplatePartsTab

**Files:**
- Create: `src/components/admin/TemplatePartsTab.tsx`

Este componente é a aba "Partes" do editor — espelha e edita o `partyConfig` do template.

- [ ] **Step 1: Criar `TemplatePartsTab.tsx`**

```typescript
import React, { useState } from 'react';
import { ContractTemplate, PartyConfig, FixedParty, PersonType } from '@/types/template';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Trash2, BookUser } from 'lucide-react';
import PartyRegistryLookup from './PartyRegistryLookup';
import { PartyRegistryEntry } from '@/types/template';

interface TemplatePartsTabProps {
  template: ContractTemplate;
  onChange: (config: PartyConfig) => void;
}

const defaultConfig = (): PartyConfig => ({
  minParties: 2,
  maxParties: 2,
  acceptedTypes: ['PF', 'PJ'],
  roles: [],
  allowOtherParties: false,
  fixedParties: [],
});

const TemplatePartsTab = ({ template, onChange }: TemplatePartsTabProps) => {
  const config: PartyConfig = template.partyConfig ?? defaultConfig();
  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupTarget, setLookupTarget] = useState<{ section: 'main' | 'other'; index: number } | null>(null);
  const [roleInput, setRoleInput] = useState('');
  const [otherRoleInput, setOtherRoleInput] = useState('');

  const update = (patch: Partial<PartyConfig>) => onChange({ ...config, ...patch });

  const toggleType = (type: PersonType) => {
    const next = config.acceptedTypes.includes(type)
      ? config.acceptedTypes.filter(t => t !== type)
      : [...config.acceptedTypes, type];
    if (next.length === 0) return;
    update({ acceptedTypes: next });
  };

  const addRole = (role: string) => {
    const trimmed = role.trim();
    if (!trimmed || config.roles.includes(trimmed)) return;
    update({ roles: [...config.roles, trimmed] });
    setRoleInput('');
  };

  const removeRole = (role: string) => update({ roles: config.roles.filter(r => r !== role) });

  const updateFixed = (index: number, patch: Partial<FixedParty>) =>
    update({ fixedParties: config.fixedParties.map((p, i) => i === index ? { ...p, ...patch } : p) });

  const removeFixed = (index: number) =>
    update({ fixedParties: config.fixedParties.filter((_, i) => i !== index) });

  const addFixed = () =>
    update({ fixedParties: [...config.fixedParties, { role: '', name: '', personType: 'PF' }] });

  const otherCfg = config.otherPartiesConfig ?? { acceptedTypes: ['PF', 'PJ'], roles: [], fixedParties: [] };

  const updateOtherCfg = (patch: Partial<typeof otherCfg>) =>
    update({ otherPartiesConfig: { ...otherCfg, ...patch } });

  const handleRegistrySelect = (entry: PartyRegistryEntry) => {
    if (!lookupTarget) return;
    const mapped: Partial<FixedParty> = {
      registryId: entry.id,
      name: entry.name,
      personType: entry.person_type,
      document: entry.document ?? undefined,
      email: entry.email ?? undefined,
    };
    if (lookupTarget.section === 'main') {
      updateFixed(lookupTarget.index, mapped);
    } else {
      const fixed = [...(otherCfg.fixedParties ?? [])];
      fixed[lookupTarget.index] = { ...fixed[lookupTarget.index], ...mapped };
      updateOtherCfg({ fixedParties: fixed });
    }
    setLookupTarget(null);
  };

  return (
    <div className="space-y-8 py-4">
      {/* Configuração geral */}
      <Card>
        <CardHeader><CardTitle className="text-base">Configuração geral</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Mínimo de partes</Label>
              <Input
                type="number" min={1} className="mt-1"
                value={config.minParties}
                onChange={e => {
                  const min = Math.max(1, parseInt(e.target.value) || 1);
                  update({ minParties: min, maxParties: Math.max(config.maxParties, min) });
                }}
              />
            </div>
            <div>
              <Label>Máximo de partes</Label>
              <Input
                type="number" min={config.minParties} className="mt-1"
                value={config.maxParties}
                onChange={e => {
                  const max = Math.max(config.minParties, parseInt(e.target.value) || config.minParties);
                  update({ maxParties: max });
                }}
              />
            </div>
          </div>
          <div>
            <Label>Tipos aceitos</Label>
            <div className="flex gap-6 mt-2">
              {(['PF', 'PJ'] as PersonType[]).map(type => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={config.acceptedTypes.includes(type)} onCheckedChange={() => toggleType(type)} />
                  <span className="text-sm">{type === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}</span>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Papéis */}
      <Card>
        <CardHeader><CardTitle className="text-base">Papéis das partes</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Adicionar papel..." value={roleInput}
              onChange={e => setRoleInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addRole(roleInput)}
            />
            <Button variant="outline" size="icon" onClick={() => addRole(roleInput)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {config.roles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {config.roles.map(role => (
                <Badge key={role} variant="secondary" className="gap-1 pr-1">
                  {role}
                  <button onClick={() => removeRole(role)} className="ml-1 hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Partes fixas */}
      <Card>
        <CardHeader><CardTitle className="text-base">Partes fixas</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {config.fixedParties.map((party, i) => (
            <div key={i} className="border border-border rounded-lg p-3 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Parte fixa {i + 1}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setLookupTarget({ section: 'main', index: i }); setLookupOpen(true); }}>
                    <BookUser className="w-4 h-4 mr-1" />Cadastro
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => removeFixed(i)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Papel</Label>
                  <Select value={party.role} onValueChange={v => updateFixed(i, { role: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                    <SelectContent>
                      {config.roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select value={party.personType} onValueChange={v => updateFixed(i, { personType: v as PersonType })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PF">Pessoa Física</SelectItem>
                      <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Nome</Label>
                <Input className="mt-1" value={party.name} onChange={e => updateFixed(i, { name: e.target.value })} />
              </div>
            </div>
          ))}
          <Button variant="outline" className="w-full" onClick={addFixed}>
            <Plus className="w-4 h-4 mr-2" />Adicionar parte fixa
          </Button>
        </CardContent>
      </Card>

      {/* Outras partes */}
      <Card>
        <CardHeader><CardTitle className="text-base">Outras partes</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox
              checked={config.allowOtherParties}
              onCheckedChange={v => update({ allowOtherParties: !!v })}
            />
            <span className="text-sm">Este modelo admite testemunhas, avalistas e similares</span>
          </label>

          {config.allowOtherParties && (
            <>
              <div>
                <Label>Tipos aceitos</Label>
                <div className="flex gap-6 mt-2">
                  {(['PF', 'PJ'] as PersonType[]).map(type => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={otherCfg.acceptedTypes.includes(type)}
                        onCheckedChange={() => {
                          const next = otherCfg.acceptedTypes.includes(type)
                            ? otherCfg.acceptedTypes.filter(t => t !== type)
                            : [...otherCfg.acceptedTypes, type];
                          if (next.length > 0) updateOtherCfg({ acceptedTypes: next });
                        }}
                      />
                      <span className="text-sm">{type === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label>Papéis permitidos</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Ex: Testemunha" value={otherRoleInput}
                    onChange={e => setOtherRoleInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const trimmed = otherRoleInput.trim();
                        if (trimmed && !otherCfg.roles.includes(trimmed)) {
                          updateOtherCfg({ roles: [...otherCfg.roles, trimmed] });
                          setOtherRoleInput('');
                        }
                      }
                    }}
                  />
                  <Button variant="outline" size="icon" onClick={() => {
                    const trimmed = otherRoleInput.trim();
                    if (trimmed && !otherCfg.roles.includes(trimmed)) {
                      updateOtherCfg({ roles: [...otherCfg.roles, trimmed] });
                      setOtherRoleInput('');
                    }
                  }}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {otherCfg.roles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {otherCfg.roles.map(role => (
                      <Badge key={role} variant="secondary" className="gap-1 pr-1">
                        {role}
                        <button onClick={() => updateOtherCfg({ roles: otherCfg.roles.filter(r => r !== role) })} className="ml-1 hover:text-destructive">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <PartyRegistryLookup
        open={lookupOpen}
        onOpenChange={open => { setLookupOpen(open); if (!open) setLookupTarget(null); }}
        onSelect={handleRegistrySelect}
      />
    </div>
  );
};

export default TemplatePartsTab;
```

- [ ] **Step 2: Verificar compilação**

```
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/TemplatePartsTab.tsx
git commit -m "feat: TemplatePartsTab — aba de edição de partyConfig no editor"
```

---

## Task 13: Integrar TemplatePartsTab no TemplateEditor

**Files:**
- Modify: `src/components/admin/TemplateEditor.tsx`

- [ ] **Step 1: Estender o tipo `editMode`**

Localizar a linha:

```typescript
const [editMode, setEditMode] = useState<'edit' | 'preview'>('edit');
```

Substituir por:

```typescript
const [editMode, setEditMode] = useState<'edit' | 'partes' | 'preview'>('edit');
```

- [ ] **Step 2: Adicionar import do TemplatePartsTab**

Adicionar ao bloco de imports:

```typescript
import TemplatePartsTab from './TemplatePartsTab';
import { PartyConfig } from '../../types/template';
```

- [ ] **Step 3: Adicionar handler para salvar partyConfig**

Dentro do componente, após os handlers existentes, adicionar:

```typescript
const handlePartsChange = (config: PartyConfig) => {
  setEditingTemplate(prev => ({ ...prev, partyConfig: config }));
};
```

- [ ] **Step 4: Adicionar o botão "Partes" ao toggle**

Localizar o bloco de toggle de modos (o `div` com `className="flex gap-1 p-1 bg-gray-100 rounded-lg"`) e adicionar o botão "Partes" entre "Editar" e "Preview":

```typescript
<Button
  variant={editMode === 'partes' ? 'default' : 'ghost'}
  size="sm"
  onClick={() => setEditMode('partes')}
  className="flex items-center gap-1"
>
  <Users className="w-3 h-3" />
  Partes
</Button>
```

Também adicionar `Users` ao import de `lucide-react`.

- [ ] **Step 5: Renderizar a aba Partes**

Localizar onde o editor renderiza o conteúdo baseado em `editMode`. Após o bloco de `editMode === 'edit'` e antes/junto de `editMode === 'preview'`, adicionar:

```typescript
{editMode === 'partes' && (
  <div className="max-w-2xl mx-auto">
    <TemplatePartsTab
      template={editingTemplate}
      onChange={handlePartsChange}
    />
  </div>
)}
```

- [ ] **Step 6: Verificar compilação**

```
npx tsc --noEmit
```

- [ ] **Step 7: Testar manualmente**

1. Criar um modelo via wizard
2. No editor, clicar na aba "Partes"
3. Verificar que exibe as configurações do wizard
4. Editar uma configuração (ex: adicionar papel)
5. Clicar em Salvar
6. Recarregar a página — verificar que a configuração persiste

- [ ] **Step 8: Commit**

```bash
git add src/components/admin/TemplateEditor.tsx
git commit -m "feat: adicionar aba Partes ao TemplateEditor para edição pós-criação do partyConfig"
```

---

## Task 14: PartyRegistrySection no Dashboard

**Files:**
- Create: `src/components/dashboard/PartyRegistrySection.tsx`

- [ ] **Step 1: Criar o componente**

```typescript
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { usePartyRegistry } from '@/hooks/usePartyRegistry';
import { PartyRegistryEntry, PersonType } from '@/types/template';
import { toast } from 'sonner';

type FormState = Omit<PartyRegistryEntry, 'id' | 'owner_id' | 'created_at'>;

const emptyForm = (): FormState => ({
  name: '',
  person_type: 'PF',
});

const PartyRegistrySection = () => {
  const { entries, loading, add, update, remove } = usePartyRegistry();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PartyRegistryEntry | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormOpen(true);
  };

  const openEdit = (entry: PartyRegistryEntry) => {
    setEditing(entry);
    setForm({
      name: entry.name,
      person_type: entry.person_type,
      document: entry.document,
      nationality: entry.nationality,
      marital_status: entry.marital_status,
      profession: entry.profession,
      address: entry.address,
      city: entry.city,
      state: entry.state,
      email: entry.email,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Nome é obrigatório.'); return; }
    setSaving(true);
    if (editing) {
      await update(editing.id, form);
      toast.success('Parte atualizada.');
    } else {
      await add(form);
      toast.success('Parte adicionada ao cadastro.');
    }
    setSaving(false);
    setFormOpen(false);
  };

  const handleRemove = async (entry: PartyRegistryEntry) => {
    if (!confirm(`Remover "${entry.name}" do cadastro?`)) return;
    await remove(entry.id);
    toast.success('Parte removida.');
  };

  const setField = (key: keyof FormState, value: string) =>
    setForm(prev => ({ ...prev, [key]: value || undefined }));

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-serif text-xl text-foreground">Cadastro de Partes</h2>
          <div className="mt-1 h-px w-full bg-border" />
        </div>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Parte
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center border border-dashed border-border rounded-lg">
          <p className="text-sm text-muted-foreground mb-4">Nenhuma parte cadastrada ainda.</p>
          <Button variant="outline" onClick={openAdd}>
            <Plus className="w-4 h-4 mr-2" />Adicionar primeira parte
          </Button>
        </div>
      ) : (
        <div className="rounded-md border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map(entry => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.name}</TableCell>
                  <TableCell className="text-muted-foreground">{entry.person_type}</TableCell>
                  <TableCell className="text-muted-foreground">{entry.document ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(entry)}>
                        <Pencil className="w-3 h-3 mr-1" />Editar
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRemove(entry)}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />Remover
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar parte' : 'Nova parte'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome *</Label>
                <Input className="mt-1" value={form.name} onChange={e => setField('name', e.target.value)} />
              </div>
              <div>
                <Label>Tipo *</Label>
                <Select value={form.person_type} onValueChange={v => setField('person_type', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PF">Pessoa Física</SelectItem>
                    <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{form.person_type === 'PJ' ? 'CNPJ' : 'CPF'}</Label>
                <Input className="mt-1" value={form.document ?? ''} onChange={e => setField('document', e.target.value)} />
              </div>
              <div>
                <Label>E-mail</Label>
                <Input className="mt-1" type="email" value={form.email ?? ''} onChange={e => setField('email', e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Endereço</Label>
              <Input className="mt-1" value={form.address ?? ''} onChange={e => setField('address', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cidade</Label>
                <Input className="mt-1" value={form.city ?? ''} onChange={e => setField('city', e.target.value)} />
              </div>
              <div>
                <Label>Estado (UF)</Label>
                <Input className="mt-1" maxLength={2} value={form.state ?? ''} onChange={e => setField('state', e.target.value)} />
              </div>
            </div>
            {form.person_type === 'PF' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nacionalidade</Label>
                    <Input className="mt-1" value={form.nationality ?? ''} onChange={e => setField('nationality', e.target.value)} />
                  </div>
                  <div>
                    <Label>Estado civil</Label>
                    <Input className="mt-1" value={form.marital_status ?? ''} onChange={e => setField('marital_status', e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Profissão</Label>
                  <Input className="mt-1" value={form.profession ?? ''} onChange={e => setField('profession', e.target.value)} />
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default PartyRegistrySection;
```

- [ ] **Step 2: Verificar compilação**

```
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/PartyRegistrySection.tsx
git commit -m "feat: PartyRegistrySection — CRUD do cadastro de partes no Dashboard"
```

---

## Task 15: Adicionar PartyRegistrySection ao Dashboard

**Files:**
- Modify: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Adicionar import e render**

No arquivo `src/pages/Dashboard.tsx`, adicionar o import:

```typescript
import PartyRegistrySection from '@/components/dashboard/PartyRegistrySection';
```

E adicionar o componente no JSX, após `DocumentosRecebidosSection` (visível para todos os usuários):

```typescript
<PartyRegistrySection />
```

A ordem sugerida na página:
1. StatsBar
2. ContratosPropriosSection
3. MeusModelosSection (master only)
4. DocumentosRecebidosSection
5. **PartyRegistrySection** ← inserir aqui (todos os usuários)
6. DocumentosCompartilhadosSection (master only)

- [ ] **Step 2: Verificar compilação**

```
npx tsc --noEmit
```

- [ ] **Step 3: Testar manualmente**

1. Logar como master — verificar que a seção aparece
2. Logar como preenchedor — verificar que a seção aparece
3. Adicionar uma parte — verificar que aparece na lista
4. Editar — verificar que os dados atualizam
5. Remover — verificar que some da lista

- [ ] **Step 4: Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat: adicionar PartyRegistrySection ao Dashboard para todos os perfis"
```

---

## Task 16: GenerateLinkModal — compartilhamento do cadastro

**Files:**
- Modify: `src/components/master/GenerateLinkModal.tsx`

- [ ] **Step 1: Adicionar estado para o toggle**

No componente `GenerateLinkModal`, adicionar após o estado `copied`:

```typescript
const [sharePartyRegistry, setSharePartyRegistry] = useState(false);
```

- [ ] **Step 2: Adicionar o toggle na UI**

Antes do botão "Gerar Link", adicionar:

```typescript
import { Switch } from '@/components/ui/switch';

// Dentro do JSX, antes do botão:
<div className="flex items-center justify-between rounded-lg border border-border p-3">
  <div>
    <p className="text-sm font-medium">Compartilhar Cadastro de Partes</p>
    <p className="text-xs text-muted-foreground mt-0.5">
      Os destinatários poderão buscar partes do seu cadastro ao preencher.
    </p>
  </div>
  <Switch
    checked={sharePartyRegistry}
    onCheckedChange={setSharePartyRegistry}
  />
</div>
```

- [ ] **Step 3: Passar o valor no insert**

No `handleGenerate`, adicionar `share_party_registry: sharePartyRegistry` ao objeto de insert:

```typescript
const { data, error } = await supabase
  .from('share_links')
  .insert({
    template_id: templateId,
    organization_id: organization.id,
    created_by_user_id: user.id,
    share_party_registry: sharePartyRegistry,
  })
  .select('token')
  .single();
```

- [ ] **Step 4: Resetar o estado no handleClose**

Adicionar `setSharePartyRegistry(false)` dentro de `handleClose` quando `!open`.

- [ ] **Step 5: Verificar compilação**

```
npx tsc --noEmit
```

- [ ] **Step 6: Testar manualmente**

1. Clicar em "Gerar Link" em um modelo
2. Verificar que o toggle aparece
3. Ativar o toggle e gerar o link
4. Verificar no Supabase que `share_party_registry = true` na tabela `share_links`

- [ ] **Step 7: Commit**

```bash
git add src/components/master/GenerateLinkModal.tsx
git commit -m "feat: toggle de compartilhamento do cadastro de partes no GenerateLinkModal"
```

---

## Self-Review

**Cobertura da spec:**

| Requisito | Task |
|-----------|------|
| Modal de conteúdo (3 abas) | Task 5 |
| Aviso sobre partes/data/assinatura | Task 5 (IMPORT_WARNING) |
| Wizard 6 passos | Tasks 6, 7, 8, 9 |
| Min/max partes (total incluindo fixas) | Task 7 (WizardStep2) |
| Papéis independentes da quantidade | Task 7 (WizardStep3) |
| Partes fixas com lookup no cadastro | Task 8 |
| Salvar nova parte no cadastro durante wizard | Task 8 (handleSaveToRegistry) |
| Outras partes (testemunhas, avalistas) | Task 9 |
| Resumo e criação do template | Task 9 (WizardStep6) |
| Editor nunca acessado via `/master/template/new` | Task 11 |
| `partyConfig` persistido e lido no editor | Task 11 (MasterTemplateEditor) |
| Aba "Partes" no editor | Tasks 12 e 13 |
| Cadastro de Partes — CRUD | Task 3 (hook) + Task 14 |
| Cadastro no Dashboard para todos | Task 15 |
| Compartilhamento opt-in por link | Task 16 |
| Migrations Supabase | Task 2 |
| TypeScript types | Task 1 |

**Consistência de tipos:**
- `FixedParty`, `PartyConfig`, `OtherPartiesConfig`, `PersonType` definidos em Task 1 e usados consistentemente em Tasks 3–16
- `WizardState` definido em `TemplateWizard.tsx` e importado em todos os steps
- `PartyRegistryEntry` usado no hook (Task 3), lookup (Task 4), steps (Tasks 8, 12) e section (Task 14)

**Sem placeholders:** todas as tasks têm código completo.
