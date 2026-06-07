-- Agregar nuevos campos a tabla mascotas
ALTER TABLE mascotas ADD COLUMN IF NOT EXISTS tipo_mascota VARCHAR(50) DEFAULT NULL;
ALTER TABLE mascotas ADD COLUMN IF NOT EXISTS talla VARCHAR(50) DEFAULT NULL;
ALTER TABLE mascotas ADD COLUMN IF NOT EXISTS alimento_tipo VARCHAR(100) DEFAULT NULL;
ALTER TABLE mascotas ADD COLUMN IF NOT EXISTS alimento_especial BOOLEAN DEFAULT FALSE;
ALTER TABLE mascotas ADD COLUMN IF NOT EXISTS horario_preferido VARCHAR(100) DEFAULT NULL;
ALTER TABLE mascotas ADD COLUMN IF NOT EXISTS camita BOOLEAN DEFAULT FALSE;
ALTER TABLE mascotas ADD COLUMN IF NOT EXISTS mantita BOOLEAN DEFAULT FALSE;

-- Índices para búsquedas
CREATE INDEX IF NOT EXISTS idx_tipo_mascota ON mascotas(tipo_mascota);
CREATE INDEX IF NOT EXISTS idx_alimento_especial ON mascotas(alimento_especial);
