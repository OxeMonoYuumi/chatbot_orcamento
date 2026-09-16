-- Script para inicializar o banco de dados do Supabase

-- Criar tabela de serviços
CREATE TABLE public.servicos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_servico text NOT NULL,
  preco_comodo numeric NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inserir dados iniciais
INSERT INTO public.servicos (nome_servico, preco_comodo) VALUES
  ('Parede Lisa', 120),
  ('Parede Textura', 180),
  ('Teto', 100);

-- Criar tabela de leads (orçamentos)
CREATE TABLE public.leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  telefone text NOT NULL,
  servico text NOT NULL,
  quantidade_comodos integer NOT NULL,
  valor_total numeric NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura para servicos
CREATE POLICY "Servicos sao publicos para leitura" ON public.servicos FOR SELECT USING (true);
