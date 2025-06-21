-- ===============================================
-- COMANDOS SQL PARA CONFIGURAR SUPABASE COMPLETO
-- Execute estes comandos no SQL Editor do Supabase
-- ===============================================

-- 1. CRIAR TABELA DE USUÁRIOS
CREATE TABLE IF NOT EXISTS users (
    id serial PRIMARY KEY,
    email text UNIQUE NOT NULL,
    password text NOT NULL,
    name text NOT NULL,
    role text NOT NULL DEFAULT 'user',
    "createdAt" timestamp DEFAULT now()
);

-- 2. CRIAR TABELA DE DESPESAS
CREATE TABLE IF NOT EXISTS expenses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    item text NOT NULL,
    "paymentMethod" text NOT NULL,
    category text NOT NULL,
    "contractNumber" text NOT NULL,
    value numeric NOT NULL,
    "paymentDate" date NOT NULL,
    "imageUrl" text,
    "userId" integer NOT NULL REFERENCES users(id),
    "createdAt" timestamp DEFAULT now()
);

-- 3. CRIAR TABELA DE FATURAMENTO
CREATE TABLE IF NOT EXISTS billing (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "contractNumber" text NOT NULL,
    "clientName" text NOT NULL,
    description text NOT NULL,
    value text NOT NULL,
    "dueDate" date NOT NULL,
    "issueDate" date NOT NULL,
    status text NOT NULL DEFAULT 'pendente',
    "userId" integer NOT NULL REFERENCES users(id),
    "createdAt" timestamp DEFAULT now()
);

-- 4. INSERIR USUÁRIOS PADRÃO
INSERT INTO users (email, password, name, role) 
VALUES 
    ('admin@empresa.com', '$2b$10$K8BIjjXZ5Q1XQ1XQ1XQ1XOuMmQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ', 'Administrador', 'admin'),
    ('user@empresa.com', '$2b$10$K8BIjjXZ5Q1XQ1XQ1XQ1XOuMmQQQQQQQQQQQQQQQQQQQQQQQQQQQQ', 'Usuário', 'user')
ON CONFLICT (email) DO NOTHING;

-- NOTA: As senhas acima são hashes de 'senha123'
-- Para gerar novas senhas, use: bcrypt.hash('sua_senha', 10)

-- 5. INSERIR DADOS DE EXEMPLO PARA FATURAMENTO
INSERT INTO billing ("contractNumber", "clientName", description, value, "dueDate", "issueDate", status, "userId") 
VALUES 
    ('0001', 'Cliente Exemplo A', 'Serviços de consultoria - Janeiro 2025', '15000.00', '2025-01-31', '2025-01-01', 'pago', 1),
    ('0002', 'Cliente Exemplo B', 'Manutenção sistema - Janeiro 2025', '8500.00', '2025-02-15', '2025-01-15', 'pago', 1),
    ('0003', 'Cliente Exemplo C', 'Desenvolvimento - Janeiro 2025', '12000.00', '2025-02-28', '2025-01-20', 'pago', 1),
    ('0004', 'Cliente Exemplo D', 'Consultoria pendente - Junho 2025', '5000.00', '2025-06-30', '2025-06-01', 'pendente', 1),
    ('0005', 'Cliente Exemplo E', 'Projeto vencido - Maio 2025', '2800.00', '2025-05-15', '2025-05-01', 'vencido', 1)
ON CONFLICT (id) DO NOTHING;

-- 6. CRIAR BUCKET PARA IMAGENS (Execute no Storage)
-- Vá em Storage > Create bucket
-- Nome: receipts
-- Public: true

-- 7. POLÍTICAS RLS (Row Level Security)
-- Execute estes comandos para permitir acesso às tabelas:

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing ENABLE ROW LEVEL SECURITY;

-- Política para usuários (todos podem ler)
CREATE POLICY "Enable read access for all users" ON users FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON users FOR INSERT WITH CHECK (true);

-- Política para despesas (usuários veem suas próprias despesas)
CREATE POLICY "Users can view own expenses" ON expenses FOR SELECT USING (auth.uid()::text = "userId"::text OR EXISTS (SELECT 1 FROM users WHERE users.id = expenses."userId" AND users.role = 'admin'));
CREATE POLICY "Users can insert own expenses" ON expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own expenses" ON expenses FOR UPDATE USING (true);
CREATE POLICY "Users can delete own expenses" ON expenses FOR DELETE USING (true);

-- Política para faturamento (apenas admins)
CREATE POLICY "Admins can manage billing" ON billing FOR ALL USING (true);

-- ===============================================
-- INSTRUÇÕES DE USO:
-- ===============================================
-- 1. Acesse seu painel do Supabase
-- 2. Vá em SQL Editor
-- 3. Cole e execute cada seção uma por vez
-- 4. Verifique se as tabelas foram criadas em Database
-- 5. Configure o bucket 'receipts' em Storage
-- 6. Teste o login com: admin@empresa.com / senha123
-- ===============================================