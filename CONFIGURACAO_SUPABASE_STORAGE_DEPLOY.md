# Configuração Supabase Storage para Deploy

## Problema
No ambiente de produção, as imagens não estão sendo salvas no Supabase Storage.

## Solução Completa

### 1. Verificar Variáveis de Ambiente no Deploy
Certifique-se de que estas variáveis estão configuradas no seu ambiente de deploy:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
```

**IMPORTANTE**: A `SUPABASE_SERVICE_ROLE_KEY` é essencial para o upload funcionar no backend.

### 2. Criar Bucket e Configurar Políticas RLS

Execute estes comandos SQL no Supabase SQL Editor:

```sql
-- 1. Criar bucket público
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts', 
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- 2. Política para permitir uploads através do service role
INSERT INTO storage.policies (name, bucket_id, policy_role, policy, check_)
SELECT 
  'Allow service role uploads', 
  id, 
  'service_role', 
  'true', 
  'true' 
FROM storage.buckets 
WHERE name = 'receipts';

-- 3. Política para permitir leitura pública
INSERT INTO storage.policies (name, bucket_id, policy_role, policy, check_)
SELECT 
  'Allow public read access', 
  id, 
  'public', 
  'true', 
  'true' 
FROM storage.buckets 
WHERE name = 'receipts';

-- 4. Política para permitir uploads autenticados (backup)
INSERT INTO storage.policies (name, bucket_id, policy_role, policy, check_)
SELECT 
  'Allow authenticated uploads', 
  id, 
  'authenticated', 
  'true', 
  'true' 
FROM storage.buckets 
WHERE name = 'receipts';
```

### 3. Verificar Configuração

Execute para verificar se tudo foi criado:

```sql
-- Verificar bucket
SELECT * FROM storage.buckets WHERE name = 'receipts';

-- Verificar políticas
SELECT 
  p.name,
  p.policy_role,
  p.policy,
  p.check_,
  b.name as bucket_name
FROM storage.policies p
JOIN storage.buckets b ON p.bucket_id = b.id
WHERE b.name = 'receipts';
```

### 4. Testar Upload Manualmente

No Supabase Dashboard:
1. Vá para Storage > receipts
2. Tente fazer upload de uma imagem
3. Verifique se ela fica visível publicamente

### 5. Configurações Adicionais no Supabase Dashboard

1. **Storage Settings**:
   - Vá para Settings > Storage
   - Certifique-se de que o Storage está habilitado

2. **Bucket Settings**:
   - No Storage, clique no bucket "receipts"
   - Verifique se está marcado como "Public"
   - File size limit: 5MB
   - Allowed file types: image/*

### 6. Debug no Deploy

Adicione logs temporários no código para debug:

```javascript
// No server/routes.ts, linha de upload
console.log('Supabase URL:', process.env.VITE_SUPABASE_URL);
console.log('Service Key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('Upload attempt for file:', filename);
```

### 7. Checklist de Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] Bucket "receipts" criado e público
- [ ] Políticas RLS configuradas
- [ ] Service role key válida
- [ ] Teste manual de upload funcionando
- [ ] Logs de debug ativados

### 8. URLs de Teste

Após configurar, a URL das imagens deve seguir o padrão:
```
https://seu-projeto.supabase.co/storage/v1/object/public/receipts/nome-do-arquivo.png
```

## Comandos de Emergência

Se as políticas não funcionarem, remova e recrie:

```sql
-- Remover políticas existentes
DELETE FROM storage.policies WHERE bucket_id IN (
  SELECT id FROM storage.buckets WHERE name = 'receipts'
);

-- Recriar com políticas mais permissivas
INSERT INTO storage.policies (name, bucket_id, policy_role, policy, check_)
SELECT 'Allow all operations', id, 'anon', 'true', 'true' 
FROM storage.buckets WHERE name = 'receipts';

INSERT INTO storage.policies (name, bucket_id, policy_role, policy, check_)
SELECT 'Allow all authenticated', id, 'authenticated', 'true', 'true' 
FROM storage.buckets WHERE name = 'receipts';
```