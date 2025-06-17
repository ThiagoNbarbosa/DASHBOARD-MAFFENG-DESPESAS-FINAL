-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER REFERENCES users(id),
  item TEXT NOT NULL,
  value NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  category TEXT NOT NULL,
  contract_number TEXT NOT NULL,
  total_value NUMERIC NOT NULL,
  image_url TEXT NOT NULL,
  payment_date TIMESTAMP NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert demo users (passwords are bcrypt hashed for 'senha123')
INSERT INTO users (email, password, name, role) 
VALUES 
  ('admin@empresa.com', '$2b$10$8K1p/a0dUxn0e0JQBpDBaOXYY8WJu0.YxvdJ.Y3n9o4BvJtFq6nT6', 'Administrador', 'admin'),
  ('user@empresa.com', '$2b$10$8K1p/a0dUxn0e0JQBpDBaOXYY8WJu0.YxvdJ.Y3n9o4BvJtFq6nT6', 'Usuário', 'user')
ON CONFLICT (email) DO NOTHING;

-- Create receipts storage bucket (run this in Supabase Storage if not exists)
-- You'll need to create a bucket named 'receipts' in Supabase Storage manually