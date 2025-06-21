-- ==========================================
-- SQL PARA SUPABASE - SISTEMA COMPLETO
-- ==========================================

-- 1. TABELA DE USUÁRIOS
CREATE TABLE users (
    id serial PRIMARY KEY,
    email text UNIQUE NOT NULL,
    password text NOT NULL,
    name text NOT NULL,
    role text DEFAULT 'user',
    "createdAt" timestamp DEFAULT now()
);

-- 2. TABELA DE DESPESAS
CREATE TABLE expenses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    item text NOT NULL,
    "paymentMethod" text NOT NULL,
    category text NOT NULL,
    "contractNumber" text NOT NULL,
    value numeric NOT NULL,
    "paymentDate" date NOT NULL,
    "imageUrl" text,
    "userId" integer REFERENCES users(id),
    "createdAt" timestamp DEFAULT now()
);

-- 3. TABELA DE FATURAMENTO
CREATE TABLE billing (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "contractNumber" text NOT NULL,
    "clientName" text NOT NULL,
    description text NOT NULL,
    value text NOT NULL,
    "dueDate" date NOT NULL,
    "issueDate" date NOT NULL,
    status text DEFAULT 'pendente',
    "userId" integer REFERENCES users(id),
    "createdAt" timestamp DEFAULT now()
);

-- 4. USUÁRIOS DEMO
INSERT INTO users (email, password, name, role) VALUES
('admin@empresa.com', '$2b$10$46hADjHaLmLTS/YmR/XrWu6l7VoTD.kQALnF49nXTluHvGsr9biCq', 'Admin', 'admin'),
('user@empresa.com', '$2b$10$tqASn3.1EId/EWwJ3waIiucwi1Qae7.h03/3i1ENyhLyCgcD63jby', 'User', 'user');

-- 5. DADOS EXEMPLO FATURAMENTO
INSERT INTO billing ("contractNumber", "clientName", description, value, "dueDate", "issueDate", status, "userId") VALUES
('001', 'Cliente A', 'Consultoria Janeiro', '15000.00', '2025-01-31', '2025-01-01', 'pago', 1),
('002', 'Cliente B', 'Manutenção', '8500.00', '2025-02-15', '2025-01-15', 'pago', 1),
('003', 'Cliente C', 'Desenvolvimento', '12000.00', '2025-02-28', '2025-01-20', 'pendente', 1),
('004', 'Cliente D', 'Projeto Especial', '5000.00', '2025-06-30', '2025-06-01', 'vencido', 1);

-- INSTRUÇÕES:
-- 1. Acesse SQL Editor no Supabase
-- 2. Cole e execute este código
-- 3. Login: admin@empresa.com / senha123