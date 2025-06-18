# Configuração das Políticas RLS do Supabase Storage - RECEIPTS BUCKET

## Problema Identificado
O erro "new row violates row-level security policy" ocorre porque:
1. O bucket "receipts" tem RLS habilitado
2. Não existem políticas que permitam uploads através do service role
3. O backend usa service role key mas as políticas não permitem inserção

## IMPORTANTE: Execute no Console do Supabase
Acesse: https://supabase.com/dashboard → Seu Projeto → SQL Editor

Execute os seguintes comandos SQL no **SQL Editor**:

### 1. Criar política para service role (backend)
```sql
INSERT INTO storage.policies (
  name, 
  bucket_id, 
  policy_role, 
  policy, 
  check_
) 
SELECT 
  'Allow service role uploads', 
  id, 
  'service_role', 
  'true', 
  'true' 
FROM storage.buckets 
WHERE name = 'receipts';
```

### 2. Criar política para leitura pública
```sql
INSERT INTO storage.policies (
  name, 
  bucket_id, 
  policy_role, 
  policy, 
  check_
) 
SELECT 
  'Allow public read access', 
  id, 
  'public', 
  'true', 
  'true' 
FROM storage.buckets 
WHERE name = 'receipts';
```

### 3. Criar política para usuários autenticados (backup)
```sql
INSERT INTO storage.policies (
  name, 
  bucket_id, 
  policy_role, 
  policy, 
  check_
) 
SELECT 
  'Allow authenticated uploads', 
  id, 
  'authenticated', 
  'true', 
  'true' 
FROM storage.buckets 
WHERE name = 'receipts';
```

### 4. Verificar políticas criadas
```sql
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

### 5. Remover políticas antigas (se necessário)
```sql
DELETE FROM storage.policies 
WHERE bucket_id IN (
  SELECT id FROM storage.buckets WHERE name = 'receipts'
);
```

## Configuração do Bucket via API

Após executar os SQLs, configure o bucket via API REST:

```bash
curl -X PUT "https://inukzizxxsvnlydkitle.supabase.co/storage/v1/bucket/receipts" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "public": true,
    "allowed_mime_types": ["image/jpeg", "image/png", "image/gif", "image/webp"],
    "file_size_limit": 5242880
  }'
```

## Notas Importantes

1. **Service Role Key**: O backend usa service role key que deve ter permissões totais
2. **RLS Policies**: As políticas criadas permitem uploads através do service role
3. **Bucket Público**: O bucket deve ser público para visualização das imagens
4. **USER e ADMIN**: Ambos os perfis podem fazer upload pois passam pelo backend

## Teste

1. Execute os SQLs no console do Supabase
2. Configure o bucket como público via API
3. Teste o upload no modal de nova despesa
4. Verifique se a imagem aparece corretamente