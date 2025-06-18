
import { supabase } from "./supabase";

async function setupStoragePolicies() {
  console.log("Configurando políticas RLS para o Supabase Storage...");

  try {
    // 1. Verificar se o bucket 'receipts' existe, se não, criar
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error("Erro ao listar buckets:", listError);
      return;
    }

    const receiptsBucket = buckets.find(bucket => bucket.name === 'receipts');
    
    if (!receiptsBucket) {
      console.log("Criando bucket 'receipts'...");
      const { error: createError } = await supabase.storage.createBucket('receipts', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 10485760 // 10MB
      });
      
      if (createError) {
        console.error("Erro ao criar bucket:", createError);
        return;
      }
      console.log("✓ Bucket 'receipts' criado com sucesso");
    } else {
      console.log("✓ Bucket 'receipts' já existe");
    }

    // 2. Configurar políticas RLS usando SQL direto
    const policies = [
      // Política para usuários fazerem upload de suas próprias imagens
      {
        name: "Users can upload their own receipts",
        sql: `
          DROP POLICY IF EXISTS "Users can upload their own receipts" ON storage.objects;
          CREATE POLICY "Users can upload their own receipts" ON storage.objects
          FOR INSERT WITH CHECK (
            bucket_id = 'receipts' AND 
            auth.uid()::text = (storage.foldername(name))[1]
          );
        `
      },
      
      // Política para admins fazerem upload de qualquer imagem
      {
        name: "Admins can upload any receipts",
        sql: `
          DROP POLICY IF EXISTS "Admins can upload any receipts" ON storage.objects;
          CREATE POLICY "Admins can upload any receipts" ON storage.objects
          FOR INSERT WITH CHECK (
            bucket_id = 'receipts' AND 
            EXISTS (
              SELECT 1 FROM users 
              WHERE auth_uid = auth.uid()::text 
              AND role = 'admin'
            )
          );
        `
      },
      
      // Usuários podem ver suas próprias imagens
      {
        name: "Users can view their own receipts",
        sql: `
          DROP POLICY IF EXISTS "Users can view their own receipts" ON storage.objects;
          CREATE POLICY "Users can view their own receipts" ON storage.objects
          FOR SELECT USING (
            bucket_id = 'receipts' AND 
            auth.uid()::text = (storage.foldername(name))[1]
          );
        `
      },
      
      // Admins podem ver todas as imagens
      {
        name: "Admins can view all receipts",
        sql: `
          DROP POLICY IF EXISTS "Admins can view all receipts" ON storage.objects;
          CREATE POLICY "Admins can view all receipts" ON storage.objects
          FOR SELECT USING (
            bucket_id = 'receipts' AND 
            EXISTS (
              SELECT 1 FROM users 
              WHERE auth_uid = auth.uid()::text 
              AND role = 'admin'
            )
          );
        `
      },
      
      // Apenas admins podem editar
      {
        name: "Only admins can update receipts",
        sql: `
          DROP POLICY IF EXISTS "Only admins can update receipts" ON storage.objects;
          CREATE POLICY "Only admins can update receipts" ON storage.objects
          FOR UPDATE USING (
            bucket_id = 'receipts' AND 
            EXISTS (
              SELECT 1 FROM users 
              WHERE auth_uid = auth.uid()::text 
              AND role = 'admin'
            )
          );
        `
      },
      
      // Apenas admins podem deletar
      {
        name: "Only admins can delete receipts",
        sql: `
          DROP POLICY IF EXISTS "Only admins can delete receipts" ON storage.objects;
          CREATE POLICY "Only admins can delete receipts" ON storage.objects
          FOR DELETE USING (
            bucket_id = 'receipts' AND 
            EXISTS (
              SELECT 1 FROM users 
              WHERE auth_uid = auth.uid()::text 
              AND role = 'admin'
            )
          );
        `
      }
    ];

    // 3. Executar cada política
    for (const policy of policies) {
      console.log(`Configurando política: ${policy.name}...`);
      
      const { error } = await supabase.rpc('exec_sql', { 
        sql_query: policy.sql 
      });
      
      if (error) {
        console.error(`Erro ao criar política ${policy.name}:`, error);
        // Tentar método alternativo se a função RPC não existir
        console.log("Tentando método alternativo...");
        console.log(`Execute manualmente no SQL Editor do Supabase:`);
        console.log(policy.sql);
        console.log("---");
      } else {
        console.log(`✓ Política ${policy.name} configurada com sucesso`);
      }
    }

    console.log("\n=== CONFIGURAÇÃO CONCLUÍDA ===");
    console.log("Se houver erros acima, execute os SQLs manualmente no Supabase Dashboard:");
    console.log("1. Acesse o Supabase Dashboard");
    console.log("2. Vá em SQL Editor");
    console.log("3. Execute cada SQL mostrado acima");

  } catch (error) {
    console.error("Erro durante a configuração:", error);
    
    console.log("\n=== SQLs PARA EXECUÇÃO MANUAL ===");
    console.log("Execute estes comandos no SQL Editor do Supabase Dashboard:\n");
    
    console.log(`-- 1. Política para usuários fazerem upload de suas próprias imagens
DROP POLICY IF EXISTS "Users can upload their own receipts" ON storage.objects;
CREATE POLICY "Users can upload their own receipts" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'receipts' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 2. Política para admins fazerem upload de qualquer imagem
DROP POLICY IF EXISTS "Admins can upload any receipts" ON storage.objects;
CREATE POLICY "Admins can upload any receipts" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'receipts' AND 
  EXISTS (
    SELECT 1 FROM users 
    WHERE auth_uid = auth.uid()::text 
    AND role = 'admin'
  )
);

-- 3. Usuários podem ver suas próprias imagens
DROP POLICY IF EXISTS "Users can view their own receipts" ON storage.objects;
CREATE POLICY "Users can view their own receipts" ON storage.objects
FOR SELECT USING (
  bucket_id = 'receipts' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Admins podem ver todas as imagens
DROP POLICY IF EXISTS "Admins can view all receipts" ON storage.objects;
CREATE POLICY "Admins can view all receipts" ON storage.objects
FOR SELECT USING (
  bucket_id = 'receipts' AND 
  EXISTS (
    SELECT 1 FROM users 
    WHERE auth_uid = auth.uid()::text 
    AND role = 'admin'
  )
);

-- 5. Apenas admins podem editar
DROP POLICY IF EXISTS "Only admins can update receipts" ON storage.objects;
CREATE POLICY "Only admins can update receipts" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'receipts' AND 
  EXISTS (
    SELECT 1 FROM users 
    WHERE auth_uid = auth.uid()::text 
    AND role = 'admin'
  )
);

-- 6. Apenas admins podem deletar
DROP POLICY IF EXISTS "Only admins can delete receipts" ON storage.objects;
CREATE POLICY "Only admins can delete receipts" ON storage.objects
FOR DELETE USING (
  bucket_id = 'receipts' AND 
  EXISTS (
    SELECT 1 FROM users 
    WHERE auth_uid = auth.uid()::text 
    AND role = 'admin'
  )
);

-- 7. Habilitar RLS na tabela storage.objects (caso não esteja habilitado)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;`);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  setupStoragePolicies();
}

export { setupStoragePolicies };
