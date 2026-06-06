-- ============================================================
-- Eliminar duplicados y dejar servicios correctos
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Borrar TODA la tabla y reemplazar con los 7 correctos
-- (los turnos quedan con servicio_id NULL temporalmente)
UPDATE turnos SET servicio_id = NULL WHERE servicio_id IS NOT NULL;

DELETE FROM servicios;
ALTER TABLE servicios AUTO_INCREMENT = 1;

INSERT INTO servicios (nombre, descripcion, precio, duracion_minutos, categoria, activo) VALUES
('Spa Armonía',                  'Spa relajante con aromaterapia y técnicas holísticas',          2500.00, 60,  'spa',        1),
('Spa Relax',                    'Spa relajante con masaje terapéutico',                           3000.00, 75,  'spa',        1),
('Spa Premium',                  'Spa de lujo con tratamientos exclusivos',                        4500.00, 90,  'spa',        1),
('Guardería Canina',             'Cuidado diario para perros con actividades',                     1500.00, 480, 'guarderia',  1),
('Guardería Felina',             'Cuidado especializado para gatos',                               1800.00, 480, 'guarderia',  1),
('Baño/Peluquería',              'Baño, corte y peinado profesional',                              2000.00, 120, 'peluqueria', 1),
('Terapia Alternativa Holística','Terapias energéticas, acupuntura y reiki para mascotas',         2800.00, 60,  'terapia',    1);

SET FOREIGN_KEY_CHECKS = 1;

SELECT id, nombre, precio FROM servicios ORDER BY id;
