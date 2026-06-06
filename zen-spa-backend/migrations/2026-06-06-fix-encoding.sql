SET NAMES utf8mb4;
SET character_set_client = utf8mb4;
SET character_set_results = utf8mb4;
SET character_set_connection = utf8mb4;

UPDATE servicios SET nombre = 'Spa Armonia'                   WHERE id = 1;
UPDATE servicios SET nombre = 'Guarderia Canina'              WHERE id = 4;
UPDATE servicios SET nombre = 'Guarderia Felina'              WHERE id = 5;
UPDATE servicios SET nombre = 'Bano/Peluqueria'               WHERE id = 6;
UPDATE servicios SET nombre = 'Terapia Alternativa Holistica' WHERE id = 7;

SELECT id, nombre FROM servicios ORDER BY id;
