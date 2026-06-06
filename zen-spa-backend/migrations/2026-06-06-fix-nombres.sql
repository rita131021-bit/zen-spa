UPDATE servicios SET nombre = 'Spa Armonía'                   WHERE nombre LIKE 'Spa Armon%';
UPDATE servicios SET nombre = 'Guardería Canina'              WHERE nombre LIKE 'Guarder%Canina%';
UPDATE servicios SET nombre = 'Guardería Felina'              WHERE nombre LIKE 'Guarder%Felina%';
UPDATE servicios SET nombre = 'Baño/Peluquería'               WHERE nombre LIKE 'Ba%o%Peluquer%';
UPDATE servicios SET nombre = 'Terapia Alternativa Holística' WHERE nombre LIKE 'Terapia%Hol%';

SELECT id, nombre FROM servicios ORDER BY id;
