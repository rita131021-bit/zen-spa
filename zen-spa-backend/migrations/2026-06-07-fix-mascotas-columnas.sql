-- 1. Agregar columnas faltantes en mascotas (solo las que no existen)
ALTER TABLE mascotas ADD COLUMN tipo_mascota VARCHAR(50) DEFAULT NULL;
ALTER TABLE mascotas ADD COLUMN talla VARCHAR(50) DEFAULT NULL;
ALTER TABLE mascotas ADD COLUMN alimento_tipo VARCHAR(100) DEFAULT NULL;
ALTER TABLE mascotas ADD COLUMN alimento_especial BOOLEAN DEFAULT FALSE;
ALTER TABLE mascotas ADD COLUMN horario_preferido VARCHAR(100) DEFAULT NULL;
ALTER TABLE mascotas ADD COLUMN camita BOOLEAN DEFAULT FALSE;
ALTER TABLE mascotas ADD COLUMN mantita BOOLEAN DEFAULT FALSE;

-- 2. Si tamanio existe, renombrarlo a talla (puede fallar si ya se llama talla, no importa)
ALTER TABLE mascotas CHANGE COLUMN tamanio talla VARCHAR(50);

-- Verificar resultado
SELECT COLUMN_NAME, COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'zen_spa' AND TABLE_NAME = 'mascotas'
ORDER BY ORDINAL_POSITION;
