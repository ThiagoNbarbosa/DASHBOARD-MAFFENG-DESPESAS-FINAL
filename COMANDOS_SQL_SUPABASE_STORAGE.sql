-- COMANDOS SQL PARA CONFIGURAR SUPABASE STORAGE NO DEPLOY
-- Execute estes comandos no Supabase SQL Editor do seu projeto

-- 1. CRIAR BUCKET "receipts" PÚBLICO
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts', 
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- 2. REMOVER POLÍTICAS EXISTENTES (caso existam)
DELETE FROM storage.policies WHERE bucket_id IN (
  SELECT id FROM storage.buckets WHERE name = 'receipts'
);

-- 3. CRIAR POLÍTICA PARA SERVICE ROLE (BACKEND)
INSERT INTO storage.policies (name, bucket_id, policy_role, policy, check_)
SELECT 
  'Allow service role all operations', 
  id, 
  'service_role', 
  'true', 
  'true' 
FROM storage.buckets 
WHERE name = 'receipts';

-- 4. CRIAR POLÍTICA PARA LEITURA PÚBLICA
INSERT INTO storage.policies (name, bucket_id, policy_role, policy, check_)
SELECT 
  'Allow public read access', 
  id, 
  'public', 
  'true', 
  'true' 
FROM storage.buckets 
WHERE name = 'receipts';

-- 5. CRIAR POLÍTICA PARA USUÁRIOS AUTENTICADOS (BACKUP)
INSERT INTO storage.policies (name, bucket_id, policy_role, policy, check_)
SELECT 
  'Allow authenticated all operations', 
  id, 
  'authenticated', 
  'true', 
  'true' 
FROM storage.buckets 
WHERE name = 'receipts';

-- 6. VERIFICAR SE TUDO FOI CRIADO CORRETAMENTE
SELECT 
  'BUCKET' as tipo,
  name as nome,
  public as publico,
  file_size_limit as tamanho_max,
  allowed_mime_types as tipos_permitidos
FROM storage.buckets 
WHERE name = 'receipts'

UNION ALL

SELECT 
  'POLÍTICA' as tipo,
  p.name as nome,
  p.policy_role as publico,
  p.policy as tamanho_max,
  p.check_ as tipos_permitidos
FROM storage.policies p
JOIN storage.buckets b ON p.bucket_id = b.id
WHERE b.name = 'receipts';

-- 7. TESTAR ACESSO (OPCIONAL)
-- Este comando deve retornar o bucket sem erro
SELECT * FROM storage.buckets WHERE name = 'receipts';