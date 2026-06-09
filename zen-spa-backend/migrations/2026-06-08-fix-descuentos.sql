DELETE FROM descuentos_fidelidad;
ALTER TABLE descuentos_fidelidad AUTO_INCREMENT = 1;

INSERT INTO descuentos_fidelidad (nombre, porcentaje, turnos_requeridos, meses_requeridos, descripcion, activo) VALUES
('Cliente Regular',    5.00,  5,  0, 'Despues de 5 visitas',               1),
('Cliente Frecuente', 10.00, 10,  0, 'Despues de 10 visitas',              1),
('Cliente VIP',       15.00, 20,  3, 'Despues de 20 visitas y 3 meses',    1),
('Cliente Aniversario',20.00, 0, 12, 'Despues de 1 anio como cliente',     1);

SELECT id, nombre, porcentaje, turnos_requeridos, meses_requeridos FROM descuentos_fidelidad;
