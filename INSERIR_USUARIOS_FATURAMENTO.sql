-- INSERIR USUÁRIOS COM SENHAS CORRETAS
INSERT INTO users (email, password, name, role) VALUES
('admin@empresa.com', '$2b$10$A4/o3gWR4LVVFLnf.gkpveC/4Fu8uRI3jSD3qae4exTE5lbHUekuS', 'Administrador', 'admin'),
('user@empresa.com', '$2b$10$3W.49gVFELqpWeJ41Wc1VenYJyGxReh1uKy9MCid8eEjRhT4Jf2Uq', 'Usuário', 'user');

-- INSERIR DADOS DE EXEMPLO PARA FATURAMENTO
INSERT INTO billing ("contractNumber", "clientName", description, value, "dueDate", "issueDate", status, "userId") VALUES
('001', 'Cliente A', 'Consultoria Janeiro 2025', '15000.00', '2025-01-31', '2025-01-01', 'pago', 1),
('002', 'Cliente B', 'Manutenção Sistema', '8500.00', '2025-02-15', '2025-01-15', 'pago', 1),
('003', 'Cliente C', 'Desenvolvimento Web', '12000.00', '2025-02-28', '2025-01-20', 'pendente', 1),
('004', 'Cliente D', 'Projeto Especial', '5000.00', '2025-06-30', '2025-06-01', 'vencido', 1),
('005', 'Cliente E', 'Suporte Técnico', '3500.00', '2025-03-15', '2025-02-01', 'pendente', 1);

-- LOGIN: admin@empresa.com / senha123
-- LOGIN: user@empresa.com / senha123