# SOLUÇÃO DEFINITIVA - Políticas RLS Supabase Storage

## Passos para Resolver o Erro de Upload

### 1. Acesse o Console do Supabase
- Vá para: https://supabase.com/dashboard
- Selecione seu projeto
- Clique em "SQL Editor" no menu lateral

### 2. Execute os SQLs na Ordem Exata

**COMANDO 1 - Limpar políticas antigas:**
```sql
DELETE FROM storage.policies 
WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'receipts');
```

**COMANDO 2 - Criar política INSERT para service role:**
```sql
INSERT INTO storage.policies (name, bucket_id, policy_role, policy, check_)
VALUES (
    'Allow service role INSERT',
    (SELECT id FROM storage.buckets WHERE name = 'receipts'),
    'service_role',
    'true',
    'true'
);
```

**COMANDO 3 - Criar política SELECT para service role:**
```sql
INSERT INTO storage.policies (name, bucket_id, policy_role, policy, check_)
VALUES (
    'Allow service role SELECT',
    (SELECT id FROM storage.buckets WHERE name = 'receipts'),
    'service_role',
    'true',
    'true'
);
```

**COMANDO 4 - Criar política SELECT pública (visualizar imagens):**
```sql
INSERT INTO storage.policies (name, bucket_id, policy_role, policy, check_)
VALUES (
    'Allow public SELECT',
    (SELECT id FROM storage.buckets WHERE name = 'receipts'),
    'public',
    'true',
    'true'
);
```

**COMANDO 5 - Verificar se funcionou:**
```sql
SELECT 
    p.name as politica_nome,
    p.policy_role as perfil,
    b.name as bucket_nome
FROM storage.policies p
JOIN storage.buckets b ON p.bucket_id = b.id
WHERE b.name = 'receipts';
```

### 3. Configurar Bucket como Público

Execute este comando no terminal ou API client:

```bash
curl -X PUT "https://[SEU_PROJETO].supabase.co/storage/v1/bucket/receipts" \
  -H "Authorization: Bearer [SUPABASE_SERVICE_ROLE_KEY]" \
  -H "Content-Type: application/json" \
  -d '{
    "public": true,
    "allowed_mime_types": ["image/jpeg", "image/png", "image/gif", "image/webp"],
    "file_size_limit": 5242880
  }'
```

### 4. Resultado Esperado

Após executar os comandos, você deve ver 3 políticas criadas:
- `Allow service role INSERT` (perfil: service_role)
- `Allow service role SELECT` (perfil: service_role)  
- `Allow public SELECT` (perfil: public)

### 5. Teste

Agora teste fazer upload de uma imagem no modal de nova despesa. O erro "new row violates row-level security policy" deve estar resolvido.

## Por que Isso Resolve o Problema?

1. **Service Role**: O backend usa service role key que precisa de políticas específicas
2. **INSERT Policy**: Permite que o backend faça upload de arquivos
3. **SELECT Policy**: Permite que o backend e usuários visualizem as imagens
4. **Public Bucket**: Permite acesso direto às URLs das imagens

## Arquitetura Final

- **Frontend** → envia base64 para backend
- **Backend** → usa service role key para upload no Supabase
- **Políticas RLS** → permitem INSERT/SELECT via service role
- **Bucket Público** → permite visualização das imagens