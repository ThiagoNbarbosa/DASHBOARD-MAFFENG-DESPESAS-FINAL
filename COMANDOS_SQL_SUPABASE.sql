-- ================================================================
-- COMANDOS SQL PARA EXECUTAR NO CONSOLE DO SUPABASE
-- ================================================================
-- Execute estes comandos no SQL Editor do console do Supabase
-- Dashboard > SQL Editor > New Query

-- 1. PRIMEIRO: Limpar políticas existentes do bucket receipts
DELETE FROM storage.policies 
WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'receipts');

-- 2. Criar política para permitir INSERT via service role
INSERT INTO storage.policies (
    name,
    bucket_id,
    policy_role,
    policy,
    check_
) VALUES (
    'Allow service role INSERT',
    (SELECT id FROM storage.buckets WHERE name = 'receipts'),
    'service_role',
    'true',
    'true'
);

-- 3. Criar política para permitir SELECT via service role  
INSERT INTO storage.policies (
    name,
    bucket_id,
    policy_role,
    policy,
    check_
) VALUES (
    'Allow service role SELECT',
    (SELECT id FROM storage.buckets WHERE name = 'receipts'),
    'service_role', 
    'true',
    'true'
);

-- 4. Criar política para leitura pública (visualizar imagens)
INSERT INTO storage.policies (
    name,
    bucket_id,
    policy_role,
    policy,
    check_
) VALUES (
    'Allow public SELECT',
    (SELECT id FROM storage.buckets WHERE name = 'receipts'),
    'public',
    'true', 
    'true'
);

-- 5. VERIFICAR se as políticas foram criadas
SELECT 
    p.name as politica_nome,
    p.policy_role as perfil,
    p.policy as condicao_policy,
    p.check_ as condicao_check,
    b.name as bucket_nome
FROM storage.policies p
JOIN storage.buckets b ON p.bucket_id = b.id
WHERE b.name = 'receipts'
ORDER BY p.policy_role;

-- 6. VERIFICAR configuração do bucket
SELECT 
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE name = 'receipts';