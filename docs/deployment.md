# Guia de Deploy

## Visão Geral

Este projeto utiliza duas plataformas principais:

- **Vercel** — hospedagem do front-end (React + Vite). O deploy é feito automaticamente a partir do repositório Git.
- **Supabase** — banco de dados PostgreSQL, autenticação de usuários (Auth) e armazenamento de arquivos. O projeto Supabase é gerenciado pelo Supabase Dashboard.

A arquitetura é de SPA (Single Page Application): o Vite gera arquivos estáticos que são servidos pela Vercel, e o front-end se comunica diretamente com a API do Supabase via SDK JavaScript.

---

## Variáveis de Ambiente

O projeto requer duas variáveis de ambiente para conectar ao Supabase. Ambas são **públicas** (prefixo `VITE_`) e seguras para uso no front-end, pois o Supabase usa Row Level Security (RLS) para controlar o acesso aos dados.

| Variável                       | Descrição                                                      | Obrigatória |
|-------------------------------|----------------------------------------------------------------|-------------|
| `VITE_SUPABASE_URL`           | URL do projeto Supabase (ex: `https://xyz.supabase.co`)       | Sim         |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave anônima pública do projeto Supabase (anon key)         | Sim         |

### Como obter os valores no Supabase Dashboard

1. Acesse [supabase.com](https://supabase.com) e faça login.
2. Selecione o projeto desejado.
3. No menu lateral, vá em **Settings > API**.
4. Copie os valores:
   - **Project URL** → use como `VITE_SUPABASE_URL`
   - **Project API Keys > anon (public)** → use como `VITE_SUPABASE_PUBLISHABLE_KEY`

> **Atenção:** nunca use a chave `service_role` no front-end. Ela concede acesso irrestrito ao banco de dados e deve ser mantida apenas em servidores seguros.

### Configuração para desenvolvimento local

Crie um arquivo `.env.local` na raiz do projeto (ele é ignorado pelo Git):

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-anonima-aqui
```

### Configuração na Vercel

1. Acesse o projeto no [Vercel Dashboard](https://vercel.com).
2. Vá em **Settings > Environment Variables**.
3. Adicione cada variável com o respectivo valor.
4. Selecione os ambientes em que ela deve estar disponível: **Production**, **Preview**, **Development**.
5. Faça um novo deploy para que as variáveis entrem em vigor.

---

## Deploy Automático (Vercel)

O projeto está integrado ao repositório Git. Todo push para a branch `main` dispara automaticamente um novo deploy de produção na Vercel via CI/CD.

**Fluxo automático:**

1. `git push origin main`
2. A Vercel detecta o push e inicia o processo de build.
3. Build executado com o comando: `npm run build` (`vite build`)
4. Arquivos gerados no diretório: `dist/`
5. A Vercel publica os arquivos estáticos e o deploy entra em produção.

Pushes para outras branches (incluindo `desenvolvimento`) geram deploys de **Preview** automaticamente, com URL temporária para revisão.

---

## vercel.json — Roteamento SPA

O arquivo `vercel.json` na raiz do projeto configura uma regra de reescrita de URLs necessária para o funcionamento correto do React Router em produção.

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Por que isso é necessário?**

Em uma SPA, todas as rotas (ex: `/contratos`, `/admin`, `/login`) são gerenciadas pelo React Router no navegador. Quando o usuário acessa ou recarrega uma URL diretamente, o servidor precisa servir sempre o `index.html` — caso contrário, retornaria um erro 404. A regra acima garante que qualquer requisição seja redirecionada para o `index.html`, deixando o roteamento para o React.

---

## Deploy Manual (Vercel CLI)

Para realizar deploys manualmente via terminal, instale e configure a Vercel CLI:

```bash
# 1. Instalar a Vercel CLI globalmente
npm i -g vercel

# 2. Fazer login na sua conta Vercel
vercel login

# 3. Na raiz do projeto, fazer deploy para produção
vercel --prod
```

Na primeira execução, a CLI perguntará se deseja vincular o diretório a um projeto Vercel existente. Selecione o projeto correto (`contrato-completo-facil-02`).

Para gerar um deploy de preview (sem publicar em produção):

```bash
vercel
```

---

## Banco de Dados (Supabase)

### Migrations

As migrations do banco de dados ficam em `supabase/migrations/`. Cada arquivo `.sql` representa uma alteração incremental no esquema, nomeado com timestamp para garantir a ordem de execução.

**Para aplicar as migrations em um projeto Supabase existente:**

```bash
# 1. Instalar a Supabase CLI (se ainda não tiver)
npm install -g supabase

# 2. Fazer login
supabase login

# 3. Vincular ao projeto remoto (use o ID do projeto)
supabase link --project-ref <project-id>

# 4. Aplicar as migrations pendentes
supabase db push
```

Também é possível aplicar as migrations diretamente pelo SQL Editor no Supabase Dashboard, executando os arquivos `.sql` na ordem cronológica do nome.

### Tabelas Principais

| Tabela               | Descrição                                                                 |
|----------------------|---------------------------------------------------------------------------|
| `contract_templates` | Templates de contratos (criados por admins ou usuários master)           |
| `saved_contracts`    | Contratos preenchidos e salvos pelos usuários                            |
| `user_roles`         | Papéis dos usuários (`user`, `admin`, `master`)                          |
| `profiles`           | Perfis dos usuários vinculados ao sistema de autenticação (auth.users)   |
| `organizations`      | Organizações para o modelo B2B2C (usuários master)                       |
| `party_types`        | Tipos de partes contratuais (Contratante, Contratado, etc.)              |
| `share_links`        | Links de compartilhamento de templates entre organizações e usuários      |

### Funções SQL Importantes

| Função                                          | Descrição                                                                    |
|-------------------------------------------------|------------------------------------------------------------------------------|
| `update_updated_at_column()`                    | Trigger function para atualizar automaticamente o campo `updated_at`        |
| `handle_new_user()`                             | Cria o perfil do usuário automaticamente após o cadastro                    |
| `assign_default_role()`                         | Atribui o papel `user` automaticamente no cadastro                          |
| `has_role(_user_id, _role)`                     | Verifica se um usuário possui determinado papel (usado nas políticas RLS)   |
| `get_user_role()`                               | Retorna o papel do usuário autenticado atual                                |
| `promote_user_to_admin(user_email)`             | Promove um usuário ao papel `admin` via SQL Editor                          |
| `is_master(_user_id)`                           | Verifica se um usuário possui o papel `master`                              |
| `create_master_account(_user_email, _org_name)` | Cria uma conta master vinculada a uma organização                          |
| `get_user_organization()`                       | Retorna os dados da organização do usuário autenticado atual                |
| `validate_share_link(link_token)`               | Valida um token de link de compartilhamento e retorna os dados do template  |

### Segurança — Row Level Security (RLS)

Todas as tabelas têm RLS habilitado. As políticas garantem que:

- Usuários comuns (`user`) acessam apenas seus próprios contratos e perfis.
- Usuários `admin` podem gerenciar todos os templates globais.
- Usuários `master` gerenciam templates e contratos da sua organização.
- Templates sem `organization_id` são globais e visíveis a todos.

---

## Ambientes

| Ambiente   | Branch         | URL                                      | Observações                          |
|------------|----------------|------------------------------------------|---------------------------------------|
| Produção   | `main`         | URL configurada no projeto Vercel        | Deploy automático no push para `main` |
| Preview    | `desenvolvimento` e PRs | URL temporária gerada pela Vercel | Deploy automático por push           |
| Local      | qualquer       | `http://localhost:8080`                  | `npm run dev` (porta padrão do Vite) |

> **Nota:** todos os ambientes podem compartilhar o mesmo projeto Supabase ou usar projetos separados. Para isolar dados entre produção e desenvolvimento, configure variáveis de ambiente diferentes para cada ambiente na Vercel.

---

## Solução de Problemas

### Variáveis de ambiente ausentes

**Sintoma:** A aplicação carrega em branco, sem dados, ou o console exibe erros como `supabaseUrl is required` ou `Invalid API key`.

**Solução:**
1. Verifique se `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` estão definidas no ambiente correto na Vercel.
2. Para desenvolvimento local, confirme que o arquivo `.env.local` existe na raiz do projeto.
3. Após adicionar ou alterar variáveis na Vercel, faça um novo deploy (as variáveis não são aplicadas ao deploy existente automaticamente).

---

### Erros 404 em rotas do React Router (página não encontrada ao recarregar)

**Sintoma:** Ao acessar diretamente uma URL como `https://seu-site.vercel.app/contratos`, o servidor retorna 404.

**Solução:**
Confirme que o arquivo `vercel.json` existe na raiz do projeto com a regra de reescrita correta:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Sem essa configuração, a Vercel tenta encontrar um arquivo estático correspondente à rota e retorna 404 quando não encontra.

---

### Erros de CORS nas requisições ao Supabase

**Sintoma:** O console do navegador exibe erros como `Access to fetch at 'https://xyz.supabase.co' from origin '...' has been blocked by CORS policy`.

**Solução:**
1. Acesse o Supabase Dashboard e vá em **Settings > API**.
2. Verifique se a URL do seu domínio está na lista de URLs permitidas (allowed origins).
3. Adicione a URL de produção (ex: `https://seu-site.vercel.app`) e a URL local (`http://localhost:8080`) nas configurações de CORS/Auth do Supabase.
4. Para autenticação, acesse **Authentication > URL Configuration** e configure:
   - **Site URL**: URL principal de produção
   - **Redirect URLs**: URLs permitidas para redirecionamento após login (inclua URLs de preview se necessário)

---

### Build falha na Vercel

**Sintoma:** O deploy falha com erros de TypeScript ou dependências.

**Solução:**
1. Execute `npm run build` localmente para reproduzir o erro.
2. Confirme que o Node.js usado localmente é compatível com o configurado na Vercel (**Settings > General > Node.js Version**).
3. Verifique se o `package.json` lista todas as dependências necessárias em `dependencies` (não apenas em `devDependencies`).
