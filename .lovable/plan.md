

## Fase 1.0.3 - Dashboard do Mestre

### Objetivo
Criar a area exclusiva do mestre (escritorio/advogado) com listagem, criacao, edicao e exclusao de templates vinculados a sua organizacao, com rotas protegidas.

---

### Arquivos a Criar

**1. `src/components/auth/MasterProtectedRoute.tsx`**
- Componente de rota protegida que verifica `user`, `isMaster` e `isLoading` do AuthContext
- Redireciona para `/auth` se nao logado, para `/` se nao for mestre

**2. `src/pages/MasterDashboard.tsx`**
- Header com nome da organizacao
- 3 cards de estatisticas: Templates (X/Y limite), Pendentes (placeholder "Em breve"), Finalizados (placeholder)
- Lista de templates da organizacao com botoes Editar, Gerar Link (desabilitado), Excluir
- Estado vazio com CTA para criar primeiro template
- Aviso de limite quando atingido
- Busca templates via `supabase.from('contract_templates').select(...).eq('organization_id', organization.id)`

**3. `src/pages/MasterTemplateEditor.tsx`**
- Pagina wrapper que carrega/cria template e passa para o `TemplateEditor` existente
- Para novos templates: inicializa objeto vazio com `organization_id`
- Para edicao: carrega template filtrando por `organization_id` (seguranca)
- Funcao `handleSave` faz INSERT ou UPDATE conforme o caso
- Botao "Voltar ao Painel" no topo

---

### Arquivos a Modificar

**4. `src/App.tsx`**
- Importar `MasterProtectedRoute`, `MasterDashboard`, `MasterTemplateEditor`
- Adicionar rotas:
  - `/master` com `MasterProtectedRoute` + `MasterDashboard`
  - `/master/template/:templateId` com `MasterProtectedRoute` + `MasterTemplateEditor`

**5. `src/components/Navbar.tsx`**
- Importar `isMaster` do `useAuth()`
- Adicionar link "Painel do Escritorio" visivel apenas quando `isMaster === true`
- Posicionar antes dos botoes de admin

**6. `src/components/admin/TemplateEditor.tsx`**
- Adaptar a interface `TemplateEditorProps` para aceitar prop opcional `isMasterContext?: boolean`
- Tornar `onCancel` opcional (no contexto master, o MasterTemplateEditor gerencia a navegacao)
- Ajustar o `onSave` para aceitar formato compativel com o handleSave do MasterTemplateEditor

---

### Secao Tecnica

**Fluxo de dados do dashboard:**
1. `MasterDashboard` usa `organization.id` do AuthContext para filtrar templates
2. RLS ja garante isolamento (policies da Fase 1.0.1)
3. INSERT de novos templates inclui `organization_id` automaticamente
4. DELETE filtra por `organization_id` como seguranca extra no client-side

**Reutilizacao do TemplateEditor:**
O editor existente recebe `template`, `onSave` e `onCancel`. A adaptacao sera minima:
- Adicionar `isMasterContext` opcional para ocultar opcoes exclusivas de admin (se houver)
- O `MasterTemplateEditor` faz o wrapper de carregamento/salvamento e passa os dados

**Estrutura de rotas:**
- `/master` - Dashboard principal
- `/master/template/new` - Criar (templateId = "new")
- `/master/template/:id` - Editar existente

**Navbar:** O link "Painel do Escritorio" aparece como `Button variant="ghost"` consistente com o estilo existente de "Meus Contratos".

---

### O que NAO sera implementado

- Funcionalidade "Gerar Link" (Fase 1.5) - botao presente mas desabilitado
- Contagem real de documentos pendentes/finalizados - placeholders zerados
- Enforcement de limites no backend - apenas exibicao visual
- Sistema de notificacoes

