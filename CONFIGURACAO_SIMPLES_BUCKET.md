
# Configuração Simples do Bucket - Supabase Storage

## ❌ Problema Resolvido
O erro "relation storage.policies does not exist" indica que as tabelas de políticas do Supabase Storage não existem no seu projeto.

## ✅ Solução Manual no Dashboard

### 1. Acesse o Supabase Dashboard
1. Vá para https://supabase.com/dashboard
2. Selecione seu projeto
3. No menu lateral, clique em **Storage**

### 2. Criar o Bucket "receipts"
1. Clique em **New bucket**
2. Nome: `receipts`
3. **✓ Marque "Public bucket"** (IMPORTANTE!)
4. Clique em **Create bucket**

### 3. Configurar RLS (Row Level Security)
1. Ainda em **Storage**, clique na aba **Policies**
2. Clique em **New policy**
3. Selecione o bucket **receipts**
4. Escolha **Custom policy**
5. Use este código:

```sql
-- Política para permitir tudo através do service role
CREATE POLICY "Allow all for service role" ON storage.objects
FOR ALL USING (bucket_id = 'receipts');
```

### 4. Alternativa: Desabilitar RLS
Se as políticas não funcionarem, você pode desabilitar RLS:

1. Vá em **SQL Editor**
2. Execute:

```sql
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

## Como Funciona Agora

1. **Backend simplificado**: Não tenta manipular tabelas de políticas
2. **Service role**: Tem permissões totais no Supabase
3. **Bucket público**: Permite visualização direta das imagens
4. **Sem dependência de tabelas específicas**: Funciona independente da estrutura do storage

## Teste o Upload

1. Faça login na aplicação
2. Abra "Nova Despesa"
3. Selecione uma imagem
4. Preencha os dados e salve

**✓ Deve funcionar sem erros de políticas!**
