-- Agregar columna alimento_tipo si no existe
SET @exist = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'zen_spa' 
  AND TABLE_NAME = 'mascotas' 
  AND COLUMN_NAME = 'alimento_tipo'
);

SET @sql = IF(@exist = 0, 
  'ALTER TABLE mascotas ADD COLUMN alimento_tipo VARCHAR(100) DEFAULT NULL',
  'SELECT "alimento_tipo ya existe" as mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar columnas actuales
SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'zen_spa' AND TABLE_NAME = 'mascotas'
ORDER BY ORDINAL_POSITION;
