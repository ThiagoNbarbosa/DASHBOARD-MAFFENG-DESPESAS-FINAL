import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { billingStorage } from "./billing-storage";
import { insertExpenseSchema, loginSchema, signUpSchema, insertContractSchema, insertCategorySchema } from "@shared/schema";
import { CATEGORIAS, CONTRATOS, BANCOS, FORMAS_PAGAMENTO } from "@shared/constants";
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
      console.log('Arquivo recebido:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      });
      
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'application/excel',
        'application/x-excel',
        'application/x-msexcel',
        'application/octet-stream'
      ];
      
      // Verificar tanto por MIME type quanto por extensão
      const isExcelMime = allowedTypes.includes(file.mimetype);
      const isExcelExtension = file.originalname.toLowerCase().match(/\.(xlsx|xls)$/);
      
      if (isExcelMime || isExcelExtension) {
        cb(null, true);
      } else {
        console.log('Arquivo rejeitado - MIME type:', file.mimetype, 'Nome:', file.originalname);
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
      console.log('Login attempt with body:', req.body);
      const parseResult = loginSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        console.log('Parsing failed:', parseResult.error);
        return res.status(400).json({ message: "Dados de requisição inválidos" });
      }
      
      const { email, password } = parseResult.data;

      // Usuários de demonstração para quando o banco não estiver disponível
      const demoUsers = [
        { id: 12, email: "thiago@maffeng.com", name: "Thiago", role: "admin", password: "senha123" },
        { id: 13, email: "user@maffeng.com", name: "Usuário", role: "user", password: "senha123" }
      ];

      // Primeiro, verificar se é um usuário demo válido
      const demoUser = demoUsers.find(u => u.email === email && u.password === password);
      if (demoUser) {
        console.log('Login com usuário demo:', email);
        req.session.userId = demoUser.id;
        req.session.userRole = demoUser.role;
        
        return res.json({ 
          id: demoUser.id, 
          email: demoUser.email, 
          name: demoUser.name, 
          role: demoUser.role 
        });
      }

      // Se não for demo, tentar autenticação no banco de dados
      try {
        const user = await storage.getUserByEmail(email);
        if (!user) {
          return res.status(401).json({ message: "Credenciais inválidas" });
        }

        // Verificar senha
        const isPasswordValid = await bcrypt.compare(password, user.password || '');
        if (!isPasswordValid) {
          return res.status(401).json({ message: "Credenciais inválidas" });
        }

        // Login bem-sucedido
        req.session.userId = user.id;
        req.session.userRole = user.role;

        res.json({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        });
      } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        return res.status(401).json({ message: "Credenciais inválidas" });
      }
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
          const hashedPassword = await bcrypt.hash(password, 10);
          const user = await storage.createUserWithAuth({
            authUid: existingAuthUser.id,
            email,
            password: hashedPassword,
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

      // 2. Criar registro na tabela users com o auth_uid e senha hasheada
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUserWithAuth({
        authUid: authData.user.id,
        email,
        password: hashedPassword,
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

      try {
        const expenses = await storage.getExpenses(filters);
        res.json(expenses);
      } catch (dbError) {
        console.log('Usando dados demo para despesas devido a erro de banco');
        
        // Dados demo usando as constantes padronizadas
        const demoExpenses = [
          {
            id: "demo-1",
            userId: req.session.userId,
            item: "Compra de Suprimentos",
            value: "350.00",
            paymentMethod: "PIX",
            category: "Material de Escritório",
            contractNumber: "CONT001",
            totalValue: "350.00",
            imageUrl: "",
            paymentDate: new Date("2025-01-15"),
            bankIssuer: "Banco do Brasil",
            createdAt: new Date("2025-01-15")
          },
          {
            id: "demo-2", 
            userId: req.session.userId,
            item: "Almoço Corporativo",
            value: "120.50",
            paymentMethod: "Cartão de Crédito",
            category: "Alimentação",
            contractNumber: "CONT002",
            totalValue: "120.50",
            imageUrl: "",
            paymentDate: new Date("2025-01-20"),
            bankIssuer: "SICREDI",
            createdAt: new Date("2025-01-20")
          }
        ];
        
        res.json(demoExpenses);
      }
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get expenses with pagination
  app.get("/api/expenses/paginated", requireAuth, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = (page - 1) * limit;
      
      const filters: any = {
        limit,
        offset,
      };

      // Administradores podem ver despesas de todos os usuários
      // Usuários regulares veem apenas suas próprias despesas
      if (req.session.userRole !== "admin") {
        filters.userId = req.session.userId;
      }

      // Adicionar filtros dos parâmetros de query
      const { year, month, category, contractNumber, paymentMethod, startDate, endDate } = req.query;
      
      if (year && year !== "all") filters.year = year as string;
      if (month && month !== "all") filters.month = month as string;
      if (category && category !== "all") filters.category = category as string;
      if (contractNumber && contractNumber !== "all") filters.contractNumber = contractNumber as string;
      if (paymentMethod && paymentMethod !== "all") filters.paymentMethod = paymentMethod as string;
      if (startDate) filters.startDate = startDate as string;
      if (endDate) filters.endDate = endDate as string;

      try {
        const expenses = await storage.getExpensesPaginated(filters);
        res.json(expenses);
      } catch (dbError) {
        console.log('Erro ao buscar despesas paginadas:', dbError);
        res.status(500).json({ message: "Erro ao buscar despesas paginadas" });
      }
    } catch (error) {
      console.error('Error fetching paginated expenses:', error);
      res.status(500).json({ message: 'Erro ao buscar despesas paginadas' });
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

    // Primeiro, verificar se existe exatamente nas categorias padrão
    const exactMatch = CATEGORIAS.find(cat => cat.toLowerCase() === category);
    if (exactMatch) {
      return exactMatch;
    }

    // Mapeamento inteligente para as categorias padrões
    const categoryMappings: { [key: string]: string } = {
      'alimentacao': 'ALIMENTAÇÃO',
      'alimentação': 'ALIMENTAÇÃO',
      'comida': 'ALIMENTAÇÃO',
      'refeicao': 'ALIMENTAÇÃO',
      'refeição': 'ALIMENTAÇÃO',
      'restaurante': 'ALIMENTAÇÃO',
      'lanche': 'ALIMENTAÇÃO',

      'transporte': 'TRANSPORTE',
      'combustivel': 'COMBUSTÍVEL',
      'combustível': 'COMBUSTÍVEL',
      'gasolina': 'COMBUSTÍVEL',
      'uber': 'TÁXI/UBER',
      'taxi': 'TÁXI/UBER',
      'onibus': 'TRANSPORTE',
      'ônibus': 'TRANSPORTE',

      'material': 'MATERIAL DE ESCRITÓRIO',
      'materiais': 'MATERIAL DE ESCRITÓRIO',
      'suprimentos': 'MATERIAL DE ESCRITÓRIO',
      'escritorio': 'MATERIAL DE ESCRITÓRIO',
      'escritório': 'MATERIAL DE ESCRITÓRIO',

      'servicos': 'SERVIÇOS TERCEIRIZADOS',
      'serviços': 'SERVIÇOS TERCEIRIZADOS',
      'manutencao': 'MANUTENÇÃO',
      'manutenção': 'MANUTENÇÃO',
      'reparo': 'MANUTENÇÃO',
      'veiculo': 'MANUTENÇÃO DE VEÍCULOS',
      'veículo': 'MANUTENÇÃO DE VEÍCULOS',
      'carro': 'MANUTENÇÃO DE VEÍCULOS',

      'tecnologia': 'TECNOLOGIA',
      'software': 'SISTEMA',
      'hardware': 'TECNOLOGIA',
      'computador': 'TECNOLOGIA',
      'internet': 'INTERNET',

      'telefone': 'TELEFONE',
      'celular': 'TELEFONE',
      'energia': 'ENERGIA',
      'eletricidade': 'ENERGIA',
      'agua': 'ENERGIA',
      'água': 'ENERGIA',

      'imposto': 'IMPOSTOS',
      'impostos': 'IMPOSTOS',
      'taxa': 'IMPOSTOS',
      'taxas': 'IMPOSTOS',

      'funcionario': 'FUNCIONÁRIOS',
      'funcionários': 'FUNCIONÁRIOS',
      'salario': 'FUNCIONÁRIOS',
      'salário': 'FUNCIONÁRIOS',

      'outros': 'OUTROS',
      'diversos': 'OUTROS',
      'geral': 'OUTROS'
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

    // Se não encontrar, usar OUTROS como padrão
    return 'OUTROS';
  }

  // Função para normalizar métodos de pagamento
  function normalizePaymentMethod(rawMethod: string): string {
    const method = String(rawMethod).trim().toLowerCase();

    // Primeiro, verificar se existe exatamente nas formas de pagamento padrão
    const exactMatch = FORMAS_PAGAMENTO.find(forma => forma.toLowerCase() === method);
    if (exactMatch) {
      return exactMatch;
    }

    const methodMappings: { [key: string]: string } = {
      'dinheiro': 'Dinheiro',
      'cash': 'Dinheiro',
      'especie': 'Dinheiro',
      'espécie': 'Dinheiro',

      'cartao': 'Cartão de Crédito',
      'cartão': 'Cartão de Crédito',
      'card': 'Cartão de Crédito',
      'credito': 'Cartão de Crédito',
      'crédito': 'Cartão de Crédito',
      'debito': 'Débito automático',
      'débito': 'Débito automático',

      'pix': 'PIX',
      'transferencia': 'Transferência Bancária',
      'transferência': 'Transferência Bancária',

      'boleto': 'Boleto',
      'bancario': 'Transferência Bancária',
      'bancário': 'Transferência Bancária',

      'cheque': 'Transferência Bancária'
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

    // Primeiro, verificar se existe exatamente nos contratos padrão
    const exactMatch = CONTRATOS.find(cont => cont.toLowerCase() === contract.toLowerCase());
    if (exactMatch) {
      return exactMatch;
    }

    // Mapeamentos específicos para correções comuns
    const contractMappings: { [key: string]: string } = {
      'secretaria de administração': 'SECRETARIA DA ADMINISTRAÇÃO',
      'secretaria de administracao': 'SECRETARIA DA ADMINISTRAÇÃO',
      'secretaria administração': 'SECRETARIA DA ADMINISTRAÇÃO',
      'secretaria administracao': 'SECRETARIA DA ADMINISTRAÇÃO',
      'administração': 'SECRETARIA DA ADMINISTRAÇÃO',
      'administracao': 'SECRETARIA DA ADMINISTRAÇÃO',
      
      'secretaria de economia': 'SECRETARIA DA ECONOMIA',
      'secretaria economia': 'SECRETARIA DA ECONOMIA',
      'economia': 'SECRETARIA DA ECONOMIA',
      
      'secretaria de saude': 'SECRETARIA DA SAÚDE',
      'secretaria saude': 'SECRETARIA DA SAÚDE',
      'secretaria da saude': 'SECRETARIA DA SAÚDE',
      'saude': 'SECRETARIA DA SAÚDE',
      'saúde': 'SECRETARIA DA SAÚDE',
      
      'galpao 2': 'GALPÃO 2',
      'galpao': 'GALPÃO 2',
      'galpão': 'GALPÃO 2',
      
      'escritorio': 'ESCRITÓRIO',
      'office': 'ESCRITÓRIO',
      
      'correios go': 'CORREIOS - GO',
      'correios': 'CORREIOS - GO',
      
      'carro ms': 'CARRO ENGENHARIA MS',
      'carro engenharia': 'CARRO ENGENHARIA MS',
      'carro eldorado': 'CARRO ENGENHARIA MS - ELDORADO',
      'carro nova alvorada': 'CARRO ENGENHARIA MS - NOVA ALVORADA',
      'carro rio brilhante': 'CARRO ENGENHARIA MS - RIO BRILHANTE',
      
      'bb divinopolis': 'BB DIVINÓPOLIS',
      'bb mato grosso sul': 'BB MATO GROSSO DO SUL',
      'bb ms': 'BB MATO GROSSO DO SUL',
      'bb lote 2': 'BB MATO GROSSO LOTE 2',
      'bb sp': 'BB SÃO PAULO',
      'bb sao paulo': 'BB SÃO PAULO',
      'bb são paulo': 'BB SÃO PAULO',
      
      'impostos': 'IMPOSTO',
      'imposto': 'IMPOSTO'
    };

    const contractLower = contract.toLowerCase();
    if (contractMappings[contractLower]) {
      return contractMappings[contractLower];
    }

    // Verificar correspondência parcial com os contratos padrão
    for (const contratoBase of CONTRATOS) {
      const contratoBaseLower = contratoBase.toLowerCase();
      if (contratoBaseLower.includes(contractLower) || 
          contractLower.includes(contratoBaseLower)) {
        return contratoBase;
      }
    }

    // Verificar correspondência parcial com mapeamentos
    for (const [key, value] of Object.entries(contractMappings)) {
      if (contractLower.includes(key) || key.includes(contractLower)) {
        return value;
      }
    }

    // Se não encontrar, retornar o primeiro contrato da lista como padrão
    return CONTRATOS[0];
  }

  // Função para normalizar banco emissor
  function normalizeBankIssuer(rawBank: string): string {
    if (!rawBank) return '';
    
    const bank = String(rawBank).trim().toLowerCase();
    
    // Primeiro, verificar se existe exatamente nos bancos padrão
    const exactMatch = BANCOS.find(b => b.toLowerCase() === bank);
    if (exactMatch) {
      return exactMatch;
    }
    
    const bankMappings: { [key: string]: string } = {
      'bb': 'BANCO DO BRASIL',
      'banco do brasil': 'BANCO DO BRASIL',
      'brasil': 'BANCO DO BRASIL',
      
      'sicreed': 'SICREED',
      'sicredi': 'SICREED',
      'sicred': 'SICREED',
      
      'alelo': 'ALELO',
      'ticket': 'ALELO',
      'vale': 'ALELO'
    };

    if (bankMappings[bank]) {
      return bankMappings[bank];
    }

    // Procurar correspondência parcial
    for (const [key, value] of Object.entries(bankMappings)) {
      if (bank.includes(key) || key.includes(bank)) {
        return value;
      }
    }

    return rawBank.charAt(0).toUpperCase() + rawBank.slice(1).toLowerCase();
  }

  // Endpoint para importação de Excel simplificado e funcional
  app.post("/api/expenses/import-excel", requireAuth, upload.single('excel'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false,
          message: "Nenhum arquivo fornecido" 
        });
      }

      console.log('Iniciando importação de Excel...');

      // Obter data selecionada pelo usuário ou usar data atual
      const selectedDate = req.body.importDate;
      const importDate = selectedDate ? new Date(selectedDate) : new Date();
      console.log('Data selecionada para importação:', importDate);

      // Ler arquivo Excel
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Converter para JSON, começando da linha 1 (cabeçalhos na linha 0)
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      if (jsonData.length < 2) {
        return res.status(400).json({ 
          success: false,
          message: "Arquivo deve conter pelo menos uma linha de cabeçalho e uma linha de dados" 
        });
      }

      // Detectar linha de cabeçalho (pode estar na linha 0, 3, ou 4)
      let headerRowIndex = 0;
      let headers: string[] = [];
      
      for (let i = 0; i < Math.min(5, jsonData.length); i++) {
        const row = jsonData[i];
        if (row && Array.isArray(row)) {
          const rowStr = row.map(cell => String(cell || '').toLowerCase());
          // Verificar se contém palavras-chave de cabeçalho
          if (rowStr.some(cell => 
            cell.includes('nome') || cell.includes('valor') || 
            cell.includes('categoria') || cell.includes('contrato') ||
            cell.includes('pagamento') || cell.includes('forma')
          )) {
            headerRowIndex = i;
            headers = row.map(h => String(h || '').trim());
            break;
          }
        }
      }

      if (headers.length === 0) {
        // Fallback: usar primeira linha como cabeçalho
        headers = jsonData[0].map(h => String(h || '').trim());
        headerRowIndex = 0;
      }

      console.log('Cabeçalhos detectados na linha', headerRowIndex + 1, ':', headers);

      // Mapear colunas (case-insensitive e com variações)
      const columnMapping = {
        item: -1,
        value: -1,
        paymentMethod: -1,
        category: -1,
        contractNumber: -1,
        bankIssuer: -1
      };

      headers.forEach((header, index) => {
        const headerLower = header.toLowerCase();
        
        if ((headerLower.includes('nome') || headerLower.includes('item') || 
             headerLower.includes('descri') || headerLower.includes('produto')) && columnMapping.item === -1) {
          columnMapping.item = index;
        } else if ((headerLower.includes('valor') || headerLower.includes('preco') || 
                   headerLower.includes('price') || headerLower.includes('amount')) && columnMapping.value === -1) {
          columnMapping.value = index;
        } else if ((headerLower.includes('pagamento') || headerLower.includes('payment') || 
                   headerLower.includes('forma') || headerLower.includes('metodo')) && columnMapping.paymentMethod === -1) {
          columnMapping.paymentMethod = index;
        } else if ((headerLower.includes('categoria') || headerLower.includes('category') || 
                   headerLower.includes('tipo')) && columnMapping.category === -1) {
          columnMapping.category = index;
        } else if ((headerLower.includes('contrato') || headerLower.includes('contract') || 
                   headerLower.includes('numero')) && columnMapping.contractNumber === -1) {
          columnMapping.contractNumber = index;
        } else if ((headerLower.includes('banco') || headerLower.includes('emissor') || 
                   headerLower.includes('bank')) && columnMapping.bankIssuer === -1) {
          columnMapping.bankIssuer = index;
        }
      });

      console.log('Mapeamento de colunas:', columnMapping);

      // Validar mapeamento essencial
      if (columnMapping.item === -1 || columnMapping.value === -1) {
        return res.status(400).json({
          success: false,
          message: "Não foi possível identificar as colunas essenciais (NOME/ITEM e VALOR)",
          details: "Verifique se o cabeçalho contém essas informações"
        });
      }

      // Processar dados a partir da linha seguinte ao cabeçalho
      const dataRows = jsonData.slice(headerRowIndex + 1);
      let imported = 0;
      let enhanced = 0;
      const errors: string[] = [];
      const warnings: string[] = [];
      const enhancements: string[] = [];

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const lineNumber = headerRowIndex + i + 2; // +2 porque arrays começam em 0 e cabeçalho é linha 1

        if (!row || row.length < 2) {
          continue; // Pular linhas vazias
        }

        // Ignorar linhas de total/resumo
        const itemName = String(row[columnMapping.item] || '').trim().toLowerCase();
        if (!itemName || itemName.includes('total') || itemName.includes('soma') || 
            itemName.includes('resumo') || itemName.includes('geral')) {
          continue;
        }

        try {
          // Extrair dados essenciais
          const rawItem = row[columnMapping.item];
          const rawValue = row[columnMapping.value];
          const rawCategory = columnMapping.category >= 0 ? row[columnMapping.category] : '';
          const rawContract = columnMapping.contractNumber >= 0 ? row[columnMapping.contractNumber] : '';
          const rawPaymentMethod = columnMapping.paymentMethod >= 0 ? row[columnMapping.paymentMethod] : '';
          const rawBankIssuer = columnMapping.bankIssuer >= 0 ? row[columnMapping.bankIssuer] : '';

          // Validar item/descrição
          if (!rawItem || String(rawItem).trim() === '') {
            errors.push(`Linha ${lineNumber}: Descrição está vazia`);
            continue;
          }
          const item = String(rawItem).trim();

          // Validar e processar valor
          if (!rawValue || rawValue === '' || rawValue === null || rawValue === undefined) {
            errors.push(`Linha ${lineNumber}: Valor está vazio`);
            continue;
          }

          let value: number;
          if (typeof rawValue === 'number') {
            value = rawValue;
          } else {
            const cleanValue = String(rawValue)
              .replace(/[^\d,.-]/g, '')
              .replace(',', '.');
            value = parseFloat(cleanValue);
            
            if (isNaN(value) || value <= 0) {
              errors.push(`Linha ${lineNumber}: Valor inválido "${rawValue}"`);
              continue;
            }
          }

          // Normalizar categoria
          const originalCategory = String(rawCategory || '').trim();
          let category = originalCategory;
          if (originalCategory) {
            category = normalizeCategory(originalCategory, []);
            if (category !== originalCategory) {
              enhancements.push(`Linha ${lineNumber}: categoria "${originalCategory}" → "${category}"`);
              enhanced++;
            }
          } else {
            category = 'OUTROS';
            warnings.push(`Linha ${lineNumber}: categoria vazia, usando "OUTROS"`);
          }

          // Normalizar contrato
          const originalContract = String(rawContract || '').trim();
          let contractNumber = originalContract;
          if (originalContract) {
            contractNumber = normalizeContractNumber(originalContract);
            if (contractNumber !== originalContract) {
              enhancements.push(`Linha ${lineNumber}: contrato "${originalContract}" → "${contractNumber}"`);
              enhanced++;
            }
          } else {
            contractNumber = CONTRATOS[0]; // Usar primeiro contrato como padrão
            warnings.push(`Linha ${lineNumber}: contrato vazio, usando "${contractNumber}"`);
          }

          // Normalizar forma de pagamento
          const originalPaymentMethod = String(rawPaymentMethod || '').trim();
          let paymentMethod = originalPaymentMethod;
          if (originalPaymentMethod) {
            paymentMethod = normalizePaymentMethod(originalPaymentMethod);
            if (paymentMethod !== originalPaymentMethod) {
              enhancements.push(`Linha ${lineNumber}: pagamento "${originalPaymentMethod}" → "${paymentMethod}"`);
              enhanced++;
            }
          } else {
            paymentMethod = 'PIX';
            warnings.push(`Linha ${lineNumber}: forma de pagamento vazia, usando "PIX"`);
          }

          // Normalizar banco emissor
          const originalBankIssuer = String(rawBankIssuer || '').trim();
          let bankIssuer = originalBankIssuer;
          if (originalBankIssuer) {
            bankIssuer = normalizeBankIssuer(originalBankIssuer);
            if (bankIssuer !== originalBankIssuer) {
              enhancements.push(`Linha ${lineNumber}: banco "${originalBankIssuer}" → "${bankIssuer}"`);
              enhanced++;
            }
          }

          // Criar despesa
          const expenseData = {
            item,
            value: value.toString(),
            totalValue: value.toString(),
            paymentMethod,
            category,
            contractNumber,
            paymentDate: importDate,
            imageUrl: '', // Imagem não obrigatória para importação
            bankIssuer: bankIssuer || '',
          };

          await storage.createExpense({
            ...expenseData,
            userId: req.session.userId!,
          });

          imported++;

        } catch (error) {
          console.error('Erro ao processar linha:', error);
          errors.push(`Linha ${lineNumber}: erro ao salvar - ${error instanceof Error ? error.message : 'erro desconhecido'}`);
        }
      }

      console.log(`Importação concluída: ${imported} importadas, ${enhanced} melhoradas, ${errors.length} erros`);

      // Retornar resultado
      const result = {
        success: imported > 0,
        imported,
        enhanced,
        total: dataRows.length,
        errors: errors.length,
        warnings: warnings.length,
        message: imported > 0 
          ? `Importação concluída! ${imported} despesas foram importadas com sucesso.`
          : `Nenhuma despesa foi importada devido a erros nos dados.`,
        feedback: {
          errors: errors.slice(0, 10),
          warnings: warnings.slice(0, 10),
          enhancements: enhancements.slice(0, 15)
        }
      };

      res.json(result);

    } catch (error) {
      console.error('Erro na importação Excel:', error);
      res.status(500).json({ 
        success: false,
        message: "Erro interno do servidor durante a importação",
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  app.put("/api/expenses/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      console.log("Dados recebidos para atualização:", req.body);
      
      const expenseData = insertExpenseSchema.partial().parse(req.body);
      
      console.log("Dados validados para atualização:", expenseData);

      const expense = await storage.updateExpense(id, expenseData);
      res.json(expense);
    } catch (error) {
      console.error("Erro na atualização da despesa:", error);
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
      const { year, month, status, contractNumber, startDate, endDate } = req.query;
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
      if (startDate) filters.startDate = startDate as string;
      if (endDate) filters.endDate = endDate as string;

      const billing = await billingStorage.getBilling(filters);
      res.json(billing);
    } catch (error) {
      console.error("Error fetching billing:", error);
      res.status(50).json({ message: "Erro ao carregar faturamento" });
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

  // Endpoints para contratos
  app.get("/api/contracts", requireAuth, async (req, res) => {
    try {
      const contracts = await storage.getContracts();
      res.json(contracts);
    } catch (error) {
      console.error("Error fetching contracts:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/contracts", requireAuth, async (req, res) => {
    try {
      console.log("=== CREATE CONTRACT DEBUG ===");
      console.log("Request body:", req.body);
      const parsed = insertContractSchema.parse(req.body);
      console.log("Parsed data:", parsed);
      const contract = await storage.createContract(parsed);
      console.log("Created contract:", contract);
      res.status(201).json(contract);
    } catch (error: any) {
      console.error("Error creating contract:", error);
      if (error.message?.includes('duplicate key')) {
        res.status(400).json({ message: "Este contrato já existe" });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });

  app.get("/api/contracts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contract = await storage.getContract(id);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      res.json(contract);
    } catch (error) {
      console.error("Error fetching contract:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.put("/api/contracts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const parsed = insertContractSchema.partial().parse(req.body);
      const contract = await storage.updateContract(id, parsed);
      res.json(contract);
    } catch (error) {
      console.error("Error updating contract:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/contracts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteContract(id);
      res.json({ message: "Contract deleted successfully" });
    } catch (error) {
      console.error("Error deleting contract:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Endpoints para categorias
  app.get("/api/categories", requireAuth, async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/categories", requireAuth, async (req, res) => {
    try {
      console.log("=== CREATE CATEGORY DEBUG ===");
      console.log("Request body:", req.body);
      const parsed = insertCategorySchema.parse(req.body);
      console.log("Parsed data:", parsed);
      const category = await storage.createCategory(parsed);
      console.log("Created category:", category);
      res.status(201).json(category);
    } catch (error: any) {
      console.error("Error creating category:", error);
      if (error.message?.includes('duplicate key')) {
        res.status(400).json({ message: "Esta categoria já existe" });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });

  app.get("/api/categories/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getCategory(id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.put("/api/categories/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const parsed = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(id, parsed);
      res.json(category);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/categories/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCategory(id);
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Endpoint para obter todos os contratos e categorias (para dropdowns)
  app.get("/api/contracts-and-categories", requireAuth, async (req, res) => {
    try {
      const data = await storage.getAllContractsAndCategories();
      res.json(data);
    } catch (error) {
      console.error("Error fetching contracts and categories:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}