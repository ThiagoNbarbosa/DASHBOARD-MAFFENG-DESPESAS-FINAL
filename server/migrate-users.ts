
import { storage } from "./storage-pg";
import { supabase } from "./supabase";

async function migrateUsersToSupabaseAuth() {
  console.log("Iniciando migração dos usuários para Supabase Auth...");

  try {
    // Buscar todos os usuários que não têm authUid (usuários tradicionais)
    const traditionalUsers = await storage.getTraditionalUsers();
    
    console.log(`Encontrados ${traditionalUsers.length} usuários tradicionais para migrar`);

    for (const user of traditionalUsers) {
      console.log(`Migrando usuário: ${user.email}`);

      try {
        // Criar usuário no Supabase Auth com senha padrão
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: "senha123", // Senha padrão - usuário pode trocar depois
          email_confirm: true
        });

        if (authError) {
          // Se o usuário já existe no Supabase Auth, buscar o authUid
          if (authError.message.includes("already been registered")) {
            const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
            if (listError) {
              console.error(`Erro ao listar usuários: ${listError.message}`);
              continue;
            }
            
            const existingAuthUser = listData.users.find(u => u.email === user.email);
            if (existingAuthUser) {
              // Atualizar o registro na nossa tabela com o authUid existente
              await storage.updateUserAuthUid(user.id, existingAuthUser.id);
              console.log(`✓ Usuário ${user.email} vinculado ao Supabase Auth existente`);
            }
          } else {
            console.error(`Erro ao criar usuário ${user.email}: ${authError.message}`);
          }
          continue;
        }

        if (authData.user) {
          // Atualizar o registro na nossa tabela com o novo authUid
          await storage.updateUserAuthUid(user.id, authData.user.id);
          console.log(`✓ Usuário ${user.email} migrado com sucesso`);
        }

      } catch (error) {
        console.error(`Erro ao migrar usuário ${user.email}:`, error);
      }
    }

    console.log("Migração concluída!");

  } catch (error) {
    console.error("Erro durante a migração:", error);
  }
}

// Executar migração se chamado diretamente
if (require.main === module) {
  migrateUsersToSupabaseAuth();
}

export { migrateUsersToSupabaseAuth };
