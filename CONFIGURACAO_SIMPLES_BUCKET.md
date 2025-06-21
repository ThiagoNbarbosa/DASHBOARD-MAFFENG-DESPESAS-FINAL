# Guia Simples: Configurar Upload de Imagens no Deploy

## Problema
As fotos não estão sendo salvas no ambiente de produção (deploy).

## Solução em 3 Passos

### Passo 1: Configurar Variáveis de Ambiente no Deploy
No painel de deploy do Replit, adicione estas variáveis:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
```

**Onde encontrar estas chaves:**
1. Acesse seu projeto no Supabase
2. Vá em Settings > API
3. Copie as chaves

### Passo 2: Executar SQL no Supabase
1. Acesse o Supabase Dashboard
2. Vá em SQL Editor
3. Cole e execute este comando:

```sql
-- Criar bucket público para imagens
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts', 
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Criar políticas de acesso
DELETE FROM storage.policies WHERE bucket_id IN (
  SELECT id FROM storage.buckets WHERE name = 'receipts'
);

INSERT INTO storage.policies (name, bucket_id, policy_role, policy, check_)
SELECT 'Allow service role all operations', id, 'service_role', 'true', 'true' 
FROM storage.buckets WHERE name = 'receipts';

INSERT INTO storage.policies (name, bucket_id, policy_role, policy, check_)
SELECT 'Allow public read access', id, 'public', 'true', 'true' 
FROM storage.buckets WHERE name = 'receipts';
```

### Passo 3: Testar
1. Faça o deploy da aplicação
2. Acesse a aplicação
3. Tente fazer upload de uma imagem
4. Verifique se ela aparece na lista

## Verificação
Se ainda não funcionar, verifique:

1. **No Supabase Dashboard > Storage:**
   - O bucket "receipts" deve estar visível
   - Deve estar marcado como "Public"

2. **Logs do Deploy:**
   - Procure por mensagens de erro relacionadas ao upload
   - Verifique se as variáveis de ambiente estão configuradas

3. **Teste Manual:**
   - No Supabase Storage, tente fazer upload manual de uma imagem
   - Se não funcionar, o problema está na configuração do Supabase

## Comandos de Debug
Execute no SQL Editor para verificar:

```sql
-- Verificar bucket
SELECT * FROM storage.buckets WHERE name = 'receipts';

-- Verificar políticas
SELECT p.name, p.policy_role, b.name as bucket_name
FROM storage.policies p
JOIN storage.buckets b ON p.bucket_id = b.id
WHERE b.name = 'receipts';
```

## Contato
Se ainda não funcionar, verifique:
- As chaves do Supabase estão corretas?
- O bucket foi criado corretamente?
- As variáveis de ambiente estão no deploy?