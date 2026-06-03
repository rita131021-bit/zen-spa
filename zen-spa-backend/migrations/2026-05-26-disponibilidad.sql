CREATE TABLE IF NOT EXISTS caniles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL,
  descripcion VARCHAR(255) NULL,
  activo TINYINT(1) DEFAULT 1,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS feriados (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fecha DATE NOT NULL UNIQUE,
  nombre VARCHAR(120) NOT NULL,
  tipo VARCHAR(60) DEFAULT 'Nacional',
  no_laborable TINYINT(1) DEFAULT 1,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE turnos
  ADD COLUMN IF NOT EXISTS canil_id INT NULL AFTER profesional_id;

ALTER TABLE servicios
  ADD COLUMN IF NOT EXISTS requiere_canil TINYINT(1) DEFAULT 0 AFTER activo;

CREATE INDEX IF NOT EXISTS idx_turnos_fecha_hora ON turnos (fecha, hora);
CREATE INDEX IF NOT EXISTS idx_turnos_profesional ON turnos (profesional_id, fecha, hora);
CREATE INDEX IF NOT EXISTS idx_turnos_canil ON turnos (canil_id, fecha, hora);

INSERT INTO caniles (nombre, descripcion, activo)
SELECT 'Canil 1', 'Canil principal', 1
WHERE NOT EXISTS (SELECT 1 FROM caniles WHERE nombre = 'Canil 1');

INSERT INTO caniles (nombre, descripcion, activo)
SELECT 'Canil 2', 'Canil mediano', 1
WHERE NOT EXISTS (SELECT 1 FROM caniles WHERE nombre = 'Canil 2');

INSERT INTO caniles (nombre, descripcion, activo)
SELECT 'Canil 3', 'Canil chico', 1
WHERE NOT EXISTS (SELECT 1 FROM caniles WHERE nombre = 'Canil 3');

INSERT INTO feriados (fecha, nombre, tipo, no_laborable)
SELECT '2026-01-01', 'Ano Nuevo', 'Nacional', 1
WHERE NOT EXISTS (SELECT 1 FROM feriados WHERE fecha = '2026-01-01');

INSERT INTO feriados (fecha, nombre, tipo, no_laborable)
SELECT '2026-03-24', 'Dia Nacional de la Memoria', 'Nacional', 1
WHERE NOT EXISTS (SELECT 1 FROM feriados WHERE fecha = '2026-03-24');

INSERT INTO feriados (fecha, nombre, tipo, no_laborable)
SELECT '2026-04-02', 'Dia del Veterano y de los Caidos en Malvinas', 'Nacional', 1
WHERE NOT EXISTS (SELECT 1 FROM feriados WHERE fecha = '2026-04-02');

INSERT INTO feriados (fecha, nombre, tipo, no_laborable)
SELECT '2026-05-01', 'Dia del Trabajador', 'Nacional', 1
WHERE NOT EXISTS (SELECT 1 FROM feriados WHERE fecha = '2026-05-01');

INSERT INTO feriados (fecha, nombre, tipo, no_laborable)
SELECT '2026-05-25', 'Dia de la Revolucion de Mayo', 'Nacional', 1
WHERE NOT EXISTS (SELECT 1 FROM feriados WHERE fecha = '2026-05-25');

INSERT INTO feriados (fecha, nombre, tipo, no_laborable)
SELECT '2026-07-09', 'Dia de la Independencia', 'Nacional', 1
WHERE NOT EXISTS (SELECT 1 FROM feriados WHERE fecha = '2026-07-09');

INSERT INTO feriados (fecha, nombre, tipo, no_laborable)
SELECT '2026-12-25', 'Navidad', 'Nacional', 1
WHERE NOT EXISTS (SELECT 1 FROM feriados WHERE fecha = '2026-12-25');
