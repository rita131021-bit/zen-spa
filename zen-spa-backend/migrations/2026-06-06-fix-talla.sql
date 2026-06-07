-- Asegurar que la columna se llama 'talla' en mascotas
-- Intentar desde tamanio (sin tilde)
ALTER TABLE mascotas CHANGE COLUMN tamanio talla VARCHAR(50);
