-- Script para criar tabela billing se não existir
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

-- Inserir alguns dados de exemplo para demonstração
INSERT INTO billing ("contractNumber", "clientName", description, value, "dueDate", "issueDate", status, "userId") 
VALUES 
  ('0001', 'Cliente Exemplo A', 'Serviços de consultoria - Janeiro 2025', '5000.00', '2025-01-31', '2025-01-01', 'pendente', 1),
  ('0002', 'Cliente Exemplo B', 'Manutenção sistema - Janeiro 2025', '3500.00', '2025-02-15', '2025-01-15', 'pago', 1),
  ('0001', 'Cliente Exemplo A', 'Serviços adicionais - Dezembro 2024', '2800.00', '2024-12-31', '2024-12-01', 'vencido', 1)
ON CONFLICT (id) DO NOTHING;