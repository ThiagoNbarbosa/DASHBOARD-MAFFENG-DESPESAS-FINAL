-- Criar tabela billing no Supabase
CREATE TABLE IF NOT EXISTS billing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "contractNumber" text NOT NULL,
  "clientName" text NOT NULL,
  description text NOT NULL,
  value text NOT NULL,
  "dueDate" date NOT NULL,
  "issueDate" date NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  "userId" integer NOT NULL,
  "createdAt" timestamp DEFAULT now()
);

-- Inserir dados de exemplo
INSERT INTO billing ("contractNumber", "clientName", description, value, "dueDate", "issueDate", status, "userId") 
VALUES 
  ('0001', 'Cliente Exemplo A', 'Serviços de consultoria - Janeiro 2025', '15000.00', '2025-01-31', '2025-01-01', 'pago', 1),
  ('0002', 'Cliente Exemplo B', 'Manutenção sistema - Janeiro 2025', '8500.00', '2025-02-15', '2025-01-15', 'pago', 1),
  ('0003', 'Cliente Exemplo C', 'Desenvolvimento - Janeiro 2025', '12000.00', '2025-02-28', '2025-01-20', 'pago', 1),
  ('0004', 'Cliente Exemplo D', 'Consultoria pendente - Junho 2025', '5000.00', '2025-06-30', '2025-06-01', 'pendente', 1),
  ('0005', 'Cliente Exemplo E', 'Projeto vencido - Maio 2025', '2800.00', '2025-05-15', '2025-05-01', 'vencido', 1)
ON CONFLICT (id) DO NOTHING;