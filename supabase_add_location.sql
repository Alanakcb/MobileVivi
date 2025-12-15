-- Script SQL para adicionar colunas de geolocalização na tabela fotos

-- 1. Adicionar colunas de latitude e longitude
ALTER TABLE fotos 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- 2. Criar índice espacial para melhor performance em queries geográficas
CREATE INDEX IF NOT EXISTS idx_fotos_location 
ON fotos (latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- 3. Adicionar comentários para documentação
COMMENT ON COLUMN fotos.latitude IS 'Latitude onde a foto foi tirada (WGS84)';
COMMENT ON COLUMN fotos.longitude IS 'Longitude onde a foto foi tirada (WGS84)';

-- 4. (Opcional) Adicionar constraint para validar coordenadas
ALTER TABLE fotos 
ADD CONSTRAINT check_latitude CHECK (latitude >= -90 AND latitude <= 90),
ADD CONSTRAINT check_longitude CHECK (longitude >= -180 AND longitude <= 180);

-- 5. Visualizar estrutura atualizada
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'fotos' 
ORDER BY ordinal_position;
