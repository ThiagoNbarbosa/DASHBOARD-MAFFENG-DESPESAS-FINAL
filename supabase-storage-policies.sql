-- Políticas RLS para o bucket "receipts" no Supabase Storage
-- Estas políticas permitem que USER e ADMIN façam upload de imagens

-- 1. Política para permitir uploads através do service role
-- (usado pelo backend da aplicação)
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

-- 2. Política para permitir leitura pública dos arquivos
-- (para visualizar as imagens de comprovantes)
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

-- 3. Política para permitir uploads autenticados
-- (backup caso seja necessário acesso direto do frontend)
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

-- 4. Verificar se as políticas foram criadas corretamente
SELECT 
  p.name,
  p.policy_role,
  p.policy,
  p.check_,
  b.name as bucket_name
FROM storage.policies p
JOIN storage.buckets b ON p.bucket_id = b.id
WHERE b.name = 'receipts';

-- 5. Configurar o bucket como público para visualização
-- (deve ser executado via API REST, não SQL)
-- PUT /storage/v1/bucket/receipts
-- {
--   "public": true,
--   "allowed_mime_types": ["image/jpeg", "image/png", "image/gif", "image/webp"],
--   "file_size_limit": 5242880
-- }