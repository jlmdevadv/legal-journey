# Guia de Configuração de Admin

Este documento explica como promover um usuário a administrador no sistema.

> **Contexto:** Este projeto usa o Supabase como banco de dados. Para executar comandos SQL, acesse o [Supabase Dashboard](https://supabase.com/dashboard) e selecione o projeto.

## Pré-requisitos

1. O usuário deve estar cadastrado no sistema (ter criado uma conta via página de cadastro)
2. Você precisa ter acesso ao [Supabase Dashboard](https://supabase.com/dashboard) do projeto

## Passo a Passo

### 1. Cadastrar o Usuário

Primeiro, faça o cadastro normal pela página `/auth`:
- Acesse a aplicação
- Clique em "Entrar" no menu
- Vá para a aba "Cadastrar"
- Preencha o email e senha
- Clique em "Cadastrar"

### 2. Promover a Admin

Após o cadastro, você precisa executar uma função SQL no backend:

1. **Acesse o Backend:**
   - Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
   - Selecione o projeto → vá em **SQL Editor** (menu lateral)

2. **Execute o Comando SQL:**
   ```sql
   SELECT promote_user_to_admin('seu-email@exemplo.com');
   ```
   
   **Substitua** `seu-email@exemplo.com` pelo email do usuário que você quer promover.

3. **Verifique o Resultado:**
   - Se bem-sucedido, você verá a mensagem: "User email@exemplo.com promoted to admin successfully"
   - Se o usuário já for admin, verá: "User email@exemplo.com is already an admin"
   - Se o email não existir, verá: "Error: User not found with email ..."

### 3. Faça Logout e Login

Para que as mudanças tenham efeito:
1. Faça logout da aplicação (clique no avatar no menu > Sair)
2. Faça login novamente com o mesmo email e senha

Agora o usuário terá acesso às funcionalidades de administrador:
- Botão "Adicionar Modelo" no menu
- Botão "Importar JSON" no menu
- Botões de edição nos modelos de contrato
- Acesso à edição de campos durante o questionário

## Verificando Permissões de Admin

Para verificar se um usuário é admin:

```sql
SELECT * FROM user_roles WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'email@exemplo.com'
);
```

## Remover Permissões de Admin

Para remover permissões de admin de um usuário:

```sql
DELETE FROM user_roles 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'email@exemplo.com'
) 
AND role = 'admin';
```

## Troubleshooting

### "User not found"
- Verifique se o email está correto (case-sensitive)
- Confirme que o usuário completou o cadastro
- Verifique na tabela `auth.users` se o usuário existe

### Permissões não aparecem após login
- Certifique-se de fazer logout completo
- Limpe o cache do navegador (Ctrl+Shift+Delete)
- Verifique na tabela `user_roles` se o role 'admin' foi inserido

### Erro ao executar SQL
- Verifique se a migration foi executada corretamente
- Confirme que a função `promote_user_to_admin` existe no banco
