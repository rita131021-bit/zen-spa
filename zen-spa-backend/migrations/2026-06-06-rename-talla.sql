-- Renombrar columna tamanio (anterior) → talla en tabla mascotas
ALTER TABLE mascotas CHANGE COLUMN tamanio talla VARCHAR(50);

-- Verificar
DESCRIBE mascotas;
