import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage-pg";
import { billingStorage } from "./billing-storage";
import { insertExpenseSchema, loginSchema, signUpSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import { supabase } from "./supabase";
import session from "express-session";
import { z } from "zod";
import multer from "multer";
import * as XLSX from "xlsx";

declare module "express-session" {
  interface SessionData {
    userId?: number;
    userRole?: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Configurar multer para upload de arquivos
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Apenas arquivos Excel são permitidos'));
      }
    },
  });

  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Always false to work in dev and production
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax',
    },
  }));

  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.session.userId || req.session.userRole !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  };

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      // Todos os usuários agora usam Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      // Se o usuário tem authUid, verificar correspondência
      if (user.authUid && authData.user.id !== user.authUid) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      // Se o usuário não tem authUid (usuários tradicionais migrados), atualizar com o authUid do Supabase
      if (!user.authUid) {
        await storage.updateUserAuthUid(user.id, authData.user.id);
      }

      req.session.userId = user.id;
      req.session.userRole = user.role;

      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Dados de requisição inválidos" });
    }
  });

  app.post("/api/auth/signup", requireAdmin, async (req, res) => {
    try {
      const { email, password, name, role } = signUpSchema.parse(req.body);

      // Verificar se já existe usuário na nossa tabela
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email já está em uso" });
      }

      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

      if (authError) {
        console.error("Erro detalhado do Supabase Auth:", authError);

        // Se o erro for de email já existente, vamos buscar o usuário existente
        if (authError.message.includes("already been registered")) {
          // Obter lista de usuários para encontrar o authUid
          const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
          if (listError) {
            return res.status(400).json({ message: "Erro ao verificar usuários existentes" });
          }

          const existingAuthUser = listData.users.find(u => u.email === email);
          if (!existingAuthUser) {
            return res.status(400).json({ message: "Erro de consistência: usuário existe no auth mas não foi encontrado" });
          }

          // Criar apenas o registro na nossa tabela usando o authUid existente
          const user = await storage.createUserWithAuth({
            authUid: existingAuthUser.id,
            email,
            name,
            role,
          });

          return res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            authUid: user.authUid,
          });
        }

        return res.status(400).json({ message: `Erro no Supabase Auth: ${authError.message}` });
      }

      if (!authData.user) {
        return res.status(400).json({ message: "Falha ao criar usuário no Supabase Auth" });
      }

      // 2. Criar registro na tabela users com o auth_uid
      const user = await storage.createUserWithAuth({
        authUid: authData.user.id,
        email,
        name,
        role,
      });

      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        authUid: user.authUid,
      });
    } catch (error: any) {
      console.error("Signup error:", error);
      if (error.code === "23505") { // Unique constraint violation
        return res.status(400).json({ message: "Email já está em uso" });
      }
      if (error.code === "23502") { // Not null constraint violation
        return res.status(400).json({ message: "Erro de configuração do banco de dados" });
      }
      res.status(400).json({ message: "Dados de requisição inválidos" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get user by ID route
  app.get("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "ID de usuário inválido" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Retornar apenas dados necessários (sem senha)
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      });
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Image upload route - Supabase Storage
  app.post("/api/upload", requireAuth, async (req, res) => {
    try {
      console.log('=== DEBUG UPLOAD ===');
      console.log('Usuário ID:', req.session.userId);
      console.log('Função do usuário:', req.session.userRole);
      console.log('Body recebido:', req.body ? 'Presente' : 'Ausente');
      
      if (!req.body || !req.body.file || !req.body.filename) {
        console.log('Erro: Dados faltando no body');
        return res.status(400).json({ message: "Arquivo e nome do arquivo são obrigatórios" });
      }

      const { file: fileData, filename } = req.body;
      const userId = req.session.userId;

      if (!userId) {
        console.log('Erro: Usuário não autenticado');
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      // Converter base64 para buffer
      const base64Data = fileData.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const fileExt = filename.split('.').pop();
      const fileName = `${userId}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Verificar/criar bucket usando apenas a API de Storage
      try {
        const { data: buckets } = await supabase.storage.listBuckets();
        const receiptsBucket = buckets?.find(bucket => bucket.name === 'receipts');

        if (!receiptsBucket) {
          await supabase.storage.createBucket('receipts', { 
            public: true,
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            fileSizeLimit: 5242880
          });
        }
      } catch (bucketError) {
        // Continue com upload mesmo se verificação do bucket falhar
      }

      // Verificar se o usuário existe no sistema
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        console.log('Erro: Usuário não encontrado');
        return res.status(400).json({ message: "Usuário não encontrado" });
      }
      
      // Log para debug - não bloquear upload se authUid não existir
      if (!currentUser.authUid) {
        console.log('Aviso: Usuário não tem authUid - upload pode falhar por políticas RLS');
      }

      console.log('AuthUid do usuário:', currentUser.authUid);

      // Corrigir MIME type para JPG
      let contentType = `image/${fileExt}`;
      if (fileExt === 'jpg') {
        contentType = 'image/jpeg';
      }

      // Upload com service role (deve bypassar RLS)
      const { data, error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, buffer, {
          contentType,
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Erro no upload para Supabase:', uploadError);
        return res.status(500).json({ 
          message: `Erro no upload: ${uploadError.message}`
        });
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(filePath);
      
      res.json({ url: publicUrl });
    } catch (error: any) {
      console.error("Erro no upload:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Expense routes
  app.get("/api/expenses", requireAuth, async (req, res) => {
    try {
      const { year, month, category, contractNumber, paymentMethod } = req.query;

      const filters: any = {};

      // Administradores podem ver despesas de todos os usuários
      // Usuários regulares veem apenas suas próprias despesas
      if (req.session.userRole !== "admin") {
        filters.userId = req.session.userId;
      }
      // Para admins, não definimos userId no filtro, permitindo ver todas as despesas

      if (year && year !== "all") filters.year = year as string;
      if (month && month !== "all") filters.month = month as string;
      if (category && category !== "all") filters.category = category as string;
      if (contractNumber) filters.contractNumber = contractNumber as string;
      if (paymentMethod && paymentMethod !== "all") filters.paymentMethod = paymentMethod as string;

      const expenses = await storage.getExpenses(filters);
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/expenses", requireAuth, async (req, res) => {
    try {
      console.log('Dados recebidos para criação de despesa:', req.body);

      // Converter paymentDate de string para Date
      const bodyWithDate = {
        ...req.body,
        paymentDate: new Date(req.body.paymentDate)
      };

      const expenseData = insertExpenseSchema.parse(bodyWithDate);
      console.log('Dados validados:', expenseData);
      const expense = await storage.createExpense({
        ...expenseData,
        userId: req.session.userId!,
      });
      res.json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Erro de validação Zod:', error.errors);
        return res.status(400).json({ message: "Invalid expense data", errors: error.errors });
      }
      console.error('Erro no servidor:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Função para normalizar categorias com inteligência
  function normalizeCategory(rawCategory: string, existingCategories: string[]): string {
    const category = String(rawCategory).trim().toLowerCase();
    
    // Mapeamento inteligente de categorias comuns
    const categoryMappings: { [key: string]: string } = {
      'alimentacao': 'Alimentação',
      'alimentação': 'Alimentação',
      'comida': 'Alimentação',
      'refeicao': 'Alimentação',
      'refeição': 'Alimentação',
      'restaurante': 'Alimentação',
      'lanche': 'Alimentação',
      
      'transporte': 'Transporte',
      'combustivel': 'Transporte',
      'combustível': 'Transporte',
      'gasolina': 'Transporte',
      'uber': 'Transporte',
      'taxi': 'Transporte',
      'onibus': 'Transporte',
      'ônibus': 'Transporte',
      
      'material': 'Material',
      'materiais': 'Material',
      'suprimentos': 'Material',
      'escritorio': 'Material',
      'escritório': 'Material',
      
      'servicos': 'Serviços',
      'serviços': 'Serviços',
      'manutencao': 'Serviços',
      'manutenção': 'Serviços',
      'reparo': 'Serviços',
      
      'tecnologia': 'Tecnologia',
      'software': 'Tecnologia',
      'hardware': 'Tecnologia',
      'computador': 'Tecnologia',
      'internet': 'Tecnologia',
      
      'marketing': 'Marketing',
      'publicidade': 'Marketing',
      'propaganda': 'Marketing',
      
      'outros': 'Outros',
      'diversos': 'Outros',
      'geral': 'Outros'
    };

    // Procurar correspondência direta
    if (categoryMappings[category]) {
      return categoryMappings[category];
    }

    // Procurar correspondência parcial
    for (const [key, value] of Object.entries(categoryMappings)) {
      if (category.includes(key) || key.includes(category)) {
        return value;
      }
    }

    // Se não encontrar, capitalizar a primeira letra
    return rawCategory.charAt(0).toUpperCase() + rawCategory.slice(1).toLowerCase();
  }

  // Função para normalizar métodos de pagamento
  function normalizePaymentMethod(rawMethod: string): string {
    const method = String(rawMethod).trim().toLowerCase();
    
    const methodMappings: { [key: string]: string } = {
      'dinheiro': 'Dinheiro',
      'cash': 'Dinheiro',
      'especie': 'Dinheiro',
      'espécie': 'Dinheiro',
      
      'cartao': 'Cartão',
      'cartão': 'Cartão',
      'card': 'Cartão',
      'credito': 'Cartão',
      'crédito': 'Cartão',
      'debito': 'Cartão',
      'débito': 'Cartão',
      
      'pix': 'PIX',
      'transferencia': 'PIX',
      'transferência': 'PIX',
      
      'boleto': 'Boleto',
      'bancario': 'Boleto',
      'bancário': 'Boleto',
      
      'cheque': 'Cheque'
    };

    if (methodMappings[method]) {
      return methodMappings[method];
    }

    // Procurar correspondência parcial
    for (const [key, value] of Object.entries(methodMappings)) {
      if (method.includes(key) || key.includes(method)) {
        return value;
      }
    }

    return rawMethod.charAt(0).toUpperCase() + rawMethod.slice(1).toLowerCase();
  }

  // Função para validar e corrigir números de contrato
  function normalizeContractNumber(rawContract: string): string {
    const contract = String(rawContract).trim();
    
    // Se for um número, adicionar prefixo padrão
    if (/^\d+$/.test(contract)) {
      return `CONT-${contract.padStart(4, '0')}`;
    }
    
    // Se já tem formato de contrato, manter
    if (/^(CONT|CONTRACT|CTR)-\d+/.test(contract.toUpperCase())) {
      return contract.toUpperCase();
    }
    
    return contract.toUpperCase();
  }

  // Endpoint para importação de Excel com inteligência
  app.post("/api/expenses/import-excel", requireAuth, upload.single('excel'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo fornecido" });
      }

      console.log('Iniciando importação inteligente de Excel...');

      // Obter despesas existentes para análise de padrões
      const existingExpenses = await storage.getExpenses({ userId: req.session.userId });
      const categorySet = new Set(existingExpenses.map(e => e.category));
      const methodSet = new Set(existingExpenses.map(e => e.paymentMethod));
      const existingCategories: string[] = [];
      const existingPaymentMethods: string[] = [];
      
      categorySet.forEach(cat => existingCategories.push(cat));
      methodSet.forEach(method => existingPaymentMethods.push(method));

      // Ler arquivo Excel
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Converter para JSON
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      if (data.length < 2) {
        return res.status(400).json({ message: "Arquivo deve conter pelo menos uma linha de cabeçalho e uma linha de dados" });
      }

      // Analisar cabeçalho para detecção inteligente de colunas
      const headers = data[0].map((h: any) => String(h).toLowerCase().trim());
      console.log('Cabeçalhos detectados:', headers);

      // Mapear colunas automaticamente
      const columnMapping = {
        item: -1,
        value: -1,
        paymentMethod: -1,
        category: -1,
        contractNumber: -1,
        paymentDate: -1
      };

      // Detectar colunas por padrões inteligentes
      headers.forEach((header, index) => {
        if (header.includes('item') || header.includes('descri') || header.includes('produto')) {
          columnMapping.item = index;
        } else if (header.includes('valor') || header.includes('preco') || header.includes('price') || header.includes('amount')) {
          columnMapping.value = index;
        } else if (header.includes('pagamento') || header.includes('payment') || header.includes('método') || header.includes('metodo')) {
          columnMapping.paymentMethod = index;
        } else if (header.includes('categoria') || header.includes('category') || header.includes('tipo')) {
          columnMapping.category = index;
        } else if (header.includes('contrato') || header.includes('contract') || header.includes('numero')) {
          columnMapping.contractNumber = index;
        } else if (header.includes('data') || header.includes('date') || header.includes('quando')) {
          columnMapping.paymentDate = index;
        }
      });

      // Fallback para ordem padrão se não detectar
      if (columnMapping.item === -1) columnMapping.item = 0;
      if (columnMapping.value === -1) columnMapping.value = 1;
      if (columnMapping.paymentMethod === -1) columnMapping.paymentMethod = 2;
      if (columnMapping.category === -1) columnMapping.category = 3;
      if (columnMapping.contractNumber === -1) columnMapping.contractNumber = 4;
      if (columnMapping.paymentDate === -1) columnMapping.paymentDate = 5;

      console.log('Mapeamento de colunas:', columnMapping);

      // Processar dados
      const rows = data.slice(1);
      let imported = 0;
      let enhanced = 0;
      const errors: string[] = [];
      const insights: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        if (!row || row.length < 3) {
          errors.push(`Linha ${i + 2}: dados insuficientes`);
          continue;
        }

        try {
          // Extrair dados usando mapeamento inteligente
          const rawItem = row[columnMapping.item];
          const rawValue = row[columnMapping.value];
          const rawPaymentMethod = row[columnMapping.paymentMethod];
          const rawCategory = row[columnMapping.category];
          const rawContract = row[columnMapping.contractNumber];
          const rawDate = row[columnMapping.paymentDate];
          
          if (!rawItem || !rawValue) {
            errors.push(`Linha ${i + 2}: item ou valor em branco`);
            continue;
          }

          // Processar valor com múltiplos formatos
          let value: number;
          if (typeof rawValue === 'number') {
            value = rawValue;
          } else {
            const cleanValue = String(rawValue)
              .replace(/[^\d,.-]/g, '')
              .replace(',', '.');
            value = parseFloat(cleanValue);
            if (isNaN(value)) {
              errors.push(`Linha ${i + 2}: valor inválido (${rawValue})`);
              continue;
            }
          }

          // Processar data com múltiplos formatos
          let paymentDate: Date;
          if (typeof rawDate === 'number') {
            // Excel serializa datas como números
            paymentDate = new Date((rawDate - 25569) * 86400 * 1000);
          } else if (rawDate) {
            const dateStr = String(rawDate);
            if (dateStr.includes('/')) {
              const parts = dateStr.split('/');
              if (parts.length === 3) {
                // Tentar DD/MM/YYYY e MM/DD/YYYY
                const [first, second, third] = parts.map(p => parseInt(p));
                if (third > 31) {
                  // Ano está no final
                  paymentDate = new Date(third, second - 1, first);
                } else {
                  paymentDate = new Date(first, second - 1, third);
                }
              } else {
                paymentDate = new Date(dateStr);
              }
            } else {
              paymentDate = new Date(dateStr);
            }
            
            if (isNaN(paymentDate.getTime())) {
              paymentDate = new Date(); // Data atual como fallback
              insights.push(`Linha ${i + 2}: data inválida, usando data atual`);
            }
          } else {
            paymentDate = new Date(); // Data atual se não informada
            insights.push(`Linha ${i + 2}: sem data, usando data atual`);
          }

          // Aplicar inteligência nos dados
          const intelligentCategory = rawCategory ? 
            normalizeCategory(rawCategory, existingCategories) : 'Outros';
          
          const intelligentPaymentMethod = rawPaymentMethod ? 
            normalizePaymentMethod(rawPaymentMethod) : 'Não especificado';
          
          const intelligentContract = rawContract ? 
            normalizeContractNumber(rawContract) : `AUTO-${Date.now().toString().slice(-6)}`;

          // Verificar se houve melhorias nos dados
          if (intelligentCategory !== rawCategory || 
              intelligentPaymentMethod !== rawPaymentMethod ||
              intelligentContract !== rawContract) {
            enhanced++;
          }

          // Criar despesa com dados inteligentes
          const expenseData = {
            item: String(rawItem).trim(),
            value: value.toString(),
            totalValue: value.toString(),
            paymentMethod: intelligentPaymentMethod,
            category: intelligentCategory,
            contractNumber: intelligentContract,
            paymentDate,
            imageUrl: '', // Imagem não obrigatória para importação
          };

          await storage.createExpense({
            ...expenseData,
            userId: req.session.userId!,
          });

          imported++;
        } catch (error) {
          errors.push(`Linha ${i + 2}: erro ao processar - ${error instanceof Error ? error.message : 'erro desconhecido'}`);
        }
      }

      console.log(`Importação concluída: ${imported} importadas, ${enhanced} melhoradas`);

      res.json({
        imported,
        enhanced,
        total: rows.length,
        insights: insights.slice(0, 5), // Primeiros 5 insights
        errors: errors.length > 0 ? errors.slice(0, 10) : [], // Primeiros 10 erros
        intelligence: {
          categoriesDetected: existingCategories.length,
          paymentMethodsDetected: existingPaymentMethods.length,
          columnsAutoMapped: Object.values(columnMapping).filter(v => v !== -1).length
        }
      });

    } catch (error) {
      console.error('Erro na importação Excel:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.put("/api/expenses/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const expenseData = insertExpenseSchema.partial().parse(req.body);

      const expense = await storage.updateExpense(id, expenseData);
      res.json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid expense data", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/expenses/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteExpense(id);
      res.json({ message: "Expense deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/expenses/:id/cancel", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if user has permission to cancel this expense
      const expense = await storage.getExpense(id);
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }

      // Regular users can only cancel their own expenses
      if (req.session.userRole !== "admin" && expense.userId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to cancel this expense" });
      }

      // Cancelar despesa adicionando prefixo [CANCELADA] na categoria
      const cancelledCategory = expense.category.startsWith('[CANCELADA]') 
        ? expense.category 
        : `[CANCELADA] ${expense.category}`;
      
      const updatedExpense = await storage.updateExpense(id, { 
        category: cancelledCategory 
      });
      res.json(updatedExpense);
    } catch (error) {
      console.error("Error cancelling expense:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Stats routes
  app.get("/api/stats", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userRole === "admin" ? undefined : req.session.userId;
      const stats = await storage.getExpenseStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/stats/categories", requireAuth, async (req, res) => {
    try {
      const { month, contractNumber } = req.query;
      const filters: any = {};

      if (month && month !== "all") filters.month = month as string;
      if (contractNumber) filters.contractNumber = contractNumber as string;

      const stats = await storage.getCategoryStats(filters);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/stats/payment-methods", requireAuth, async (req, res) => {
    try {
      const { month, contractNumber } = req.query;
      const filters: any = {};

      if (month && month !== "all") filters.month = month as string;
      if (contractNumber) filters.contractNumber = contractNumber as string;

      const stats = await storage.getPaymentMethodStats(filters);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/stats/monthly", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getMonthlyTrends();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Billing routes (Auth required, admin for some operations)
  app.get("/api/billing", requireAuth, async (req, res) => {
    try {
      const { year, month, status, contractNumber } = req.query;
      const filters: any = {};

      // Usuários com mesma função podem ver dados uns dos outros
      if (req.session.userRole !== "admin") {
        // Para usuários não-admin, mostrar apenas seus próprios dados
        filters.userId = req.session.userId;
      }

      if (year) filters.year = year as string;
      if (month && month !== "all") filters.month = month as string;
      if (status && status !== "all") filters.status = status as string;
      if (contractNumber) filters.contractNumber = contractNumber as string;

      const billing = await billingStorage.getBilling(filters);
      res.json(billing);
    } catch (error) {
      console.error("Error fetching billing:", error);
      res.status(500).json({ message: "Erro ao carregar faturamento" });
    }
  });

  app.post("/api/billing", requireAuth, async (req, res) => {
    try {
      const billingData = req.body;
      const newBilling = await billingStorage.createBilling({
        ...billingData,
        userId: req.session.userId!,
      });
      res.status(201).json(newBilling);
    } catch (error) {
      console.error("Error creating billing:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/billing/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updatedBilling = await billingStorage.updateBilling(id, updates);
      res.json(updatedBilling);
    } catch (error) {
      console.error("Error updating billing:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/billing/:id/cancel", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updatedBilling = await billingStorage.updateBilling(id, { status: 'cancelado' });
      res.json(updatedBilling);
    } catch (error) {
      console.error("Error cancelling billing:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/billing/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await billingStorage.deleteBilling(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting billing:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/billing/stats", requireAdmin, async (req, res) => {
    try {
      const stats = await billingStorage.getBillingStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching billing stats:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}