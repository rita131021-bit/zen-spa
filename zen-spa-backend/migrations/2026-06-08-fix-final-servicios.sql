-- Limpiar definitivamente los servicios
SET FOREIGN_KEY_CHECKS = 0;

-- Desvincular turnos de servicios temporalmente
UPDATE turnos SET servicio_id = NULL;

-- Borrar todo y recargar limpio
DELETE FROM servicios;
ALTER TABLE servicios AUTO_INCREMENT = 1;

INSERT INTO servicios (nombre, descripcion, precio, duracion_minutos, categoria, activo) VALUES
('Guarderia Canina',            'Cuidado diario para perros con actividades',       1500.00, 480, 'guarderia',  1),
('Guarderia Felina',            'Cuidado especializado para gatos',                 1800.00, 480, 'guarderia',  1),
('Bano Simple',                 'Bano y secado basico',                             1200.00,  45, 'peluqueria', 1),
('Peluqueria Basica',           'Bano, corte y peinado profesional',                2000.00, 120, 'peluqueria', 1),
('Spa Armonia',                 'Spa relajante con aromaterapia',                   2500.00,  60, 'spa',        1),
('Spa Relax',                   'Spa con masaje terapeutico',                       3000.00,  75, 'spa',        1),
('Spa Premium',                 'Spa de lujo con tratamientos exclusivos',          4500.00,  90, 'spa',        1),
('Terapia Alternativa Holistica','Terapias energeticas y reiki para mascotas',      2800.00,  60, 'terapia',    1);

SET FOREIGN_KEY_CHECKS = 1;

SELECT id, nombre, precio FROM servicios ORDER BY id;
