-- Script SQL para criar a estrutura completa do VIVIMAP no Supabase
-- Execute este script no SQL Editor do Supabase

-- 1. Criar a tabela de fotos
CREATE TABLE IF NOT EXISTS public.fotos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    uri TEXT NOT NULL,
    legenda TEXT,
    data TEXT NOT NULL,
    local TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_fotos_user_id ON public.fotos(user_id);
CREATE INDEX IF NOT EXISTS idx_fotos_created_at ON public.fotos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fotos_location ON public.fotos(latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE public.fotos ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas de segurança

-- Permitir que usuários vejam apenas suas próprias fotos
CREATE POLICY "Usuários podem ver suas próprias fotos" 
ON public.fotos 
FOR SELECT 
USING (auth.uid() = user_id);

-- Permitir que usuários insiram suas próprias fotos
CREATE POLICY "Usuários podem inserir suas próprias fotos" 
ON public.fotos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Permitir que usuários atualizem suas próprias fotos
CREATE POLICY "Usuários podem atualizar suas próprias fotos" 
ON public.fotos 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Permitir que usuários deletem suas próprias fotos
CREATE POLICY "Usuários podem deletar suas próprias fotos" 
ON public.fotos 
FOR DELETE 
USING (auth.uid() = user_id);

-- 5. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Criar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_fotos_updated_at ON public.fotos;
CREATE TRIGGER update_fotos_updated_at
    BEFORE UPDATE ON public.fotos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Adicionar comentários nas colunas
COMMENT ON TABLE public.fotos IS 'Tabela de fotos do VIVIMAP';
COMMENT ON COLUMN public.fotos.id IS 'ID único da foto';
COMMENT ON COLUMN public.fotos.user_id IS 'ID do usuário dono da foto';
COMMENT ON COLUMN public.fotos.uri IS 'URL da foto no Supabase Storage';
COMMENT ON COLUMN public.fotos.legenda IS 'Legenda/descrição da foto';
COMMENT ON COLUMN public.fotos.data IS 'Data em que a foto foi tirada';
COMMENT ON COLUMN public.fotos.local IS 'Nome do local onde a foto foi tirada';
COMMENT ON COLUMN public.fotos.latitude IS 'Latitude onde a foto foi tirada (WGS84)';
COMMENT ON COLUMN public.fotos.longitude IS 'Longitude onde a foto foi tirada (WGS84)';

-- 8. Verificar se tudo foi criado corretamente
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'fotos') as num_columns,
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'fotos') as num_indexes,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'fotos') as num_policies
FROM information_schema.tables 
WHERE table_name = 'fotos' 
AND table_schema = 'public';
