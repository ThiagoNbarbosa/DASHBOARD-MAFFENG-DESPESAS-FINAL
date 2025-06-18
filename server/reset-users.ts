
import { storage } from "./storage-pg";
import { supabase } from "./supabase";

async function resetAndCreateUsers() {
  console.log("Iniciando reset dos usuários...");

  try {
    // 1. Limpar usuários do Supabase Auth
    console.log("Removendo usuários existentes do Supabase Auth...");
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error("Erro ao listar usuários:", listError);
    } else {
      for (const user of existingUsers.users) {
        const { error } = await supabase.auth.admin.deleteUser(user.id);
        if (error) {
          console.error(`Erro ao deletar usuário ${user.email}:`, error);
        } else {
          console.log(`✓ Usuário ${user.email} removido do Supabase Auth`);
        }
      }
    }

    // 2. Limpar usuários da nossa tabela
    console.log("Removendo usuários da tabela local...");
    await storage.clearAllUsers();

    // 3. Criar novos usuários no Supabase Auth
    console.log("Criando novos usuários...");

    // Criar thiago@maffeng.com (ADMIN)
    const { data: thiagAuth, error: thiagError } = await supabase.auth.admin.createUser({
      email: "thiago@maffeng.com",
      password: "senha123",
      email_confirm: true
    });

    if (thiagError) {
      console.error("Erro ao criar thiago@maffeng.com:", thiagError);
    } else {
      // Criar registro na nossa tabela
      await storage.createUserWithAuth({
        authUid: thiagAuth.user.id,
        email: "thiago@maffeng.com",
        name: "Thiago",
        role: "admin"
      });
      console.log("✓ Usuário thiago@maffeng.com criado com sucesso");
    }

    // Criar mikaelly@maffeng.com (USER)
    const { data: mikaAuth, error: mikaError } = await supabase.auth.admin.createUser({
      email: "mikaelly@maffeng.com",
      password: "senha123",
      email_confirm: true
    });

    if (mikaError) {
      console.error("Erro ao criar mikaelly@maffeng.com:", mikaError);
    } else {
      // Criar registro na nossa tabela
      await storage.createUserWithAuth({
        authUid: mikaAuth.user.id,
        email: "mikaelly@maffeng.com",
        name: "Mikaelly",
        role: "user"
      });
      console.log("✓ Usuário mikaelly@maffeng.com criado com sucesso");
    }

    console.log("\n✅ Reset concluído com sucesso!");
    console.log("Usuários criados:");
    console.log("- thiago@maffeng.com (ADMIN) - senha: senha123");
    console.log("- mikaelly@maffeng.com (USER) - senha: senha123");

  } catch (error) {
    console.error("Erro durante o reset:", error);
  }
}

// Executar reset se chamado diretamente
if (require.main === module) {
  resetAndCreateUsers();
}

export { resetAndCreateUsers };
