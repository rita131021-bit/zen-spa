-- Ver estructura actual de servicios
-- y arreglar columnas faltantes

-- Agregar columnas que faltan si no existen
ALTER TABLE servicios ADD COLUMN IF NOT EXISTS precio_base DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE servicios ADD COLUMN IF NOT EXISTS duracion_minutos INT DEFAULT 60;
ALTER TABLE servicios ADD COLUMN IF NOT EXISTS categoria VARCHAR(50);
ALTER TABLE servicios ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE;
ALTER TABLE servicios ADD COLUMN IF NOT EXISTS descripcion TEXT;
ALTER TABLE servicios ADD COLUMN IF NOT EXISTS creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE servicios ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Insertar los 7 servicios (ignorar si ya existen)
INSERT IGNORE INTO servicios (nombre, descripcion, precio_base, duracion_minutos, categoria) VALUES
('Guardería Felina', 'Cuidado especializado para gatos', 1800.00, 480, 'guarderia'),
('Guardería Canina', 'Cuidado diario para perros', 1500.00, 480, 'guarderia'),
('Peluquería Básica', 'Baño, corte y peinado básico', 2000.00, 120, 'peluqueria'),
('Spa Relax', 'Spa relajante con masaje terapéutico', 3000.00, 75, 'spa'),
('Spa Premium', 'Spa de lujo con tratamientos exclusivos', 4500.00, 90, 'spa'),
('Terapia Alternativa Holística', 'Terapias energéticas y reiki', 2800.00, 60, 'terapia'),
('Baño Simple', 'Baño y secado básico', 1200.00, 45, 'peluqueria');

-- Crear tablas nuevas si no existen
CREATE TABLE IF NOT EXISTS descuentos_fidelidad (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  porcentaje DECIMAL(5,2) NOT NULL,
  turnos_requeridos INT DEFAULT 0,
  meses_requeridos INT DEFAULT 0,
  descripcion TEXT,
  activo BOOLEAN DEFAULT TRUE,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO descuentos_fidelidad (nombre, porcentaje, turnos_requeridos, meses_requeridos, descripcion) VALUES
('Cliente Regular', 5.00, 5, 0, 'Después de 5 servicios'),
('Cliente Frecuente', 10.00, 10, 0, 'Después de 10 servicios'),
('Cliente VIP', 15.00, 20, 3, 'Después de 20 servicios y 3 meses'),
('Cliente Aniversario', 20.00, 0, 12, 'Después de 1 año como cliente');

CREATE TABLE IF NOT EXISTS bloqueos_calendario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fecha DATE NOT NULL UNIQUE,
  motivo VARCHAR(100),
  disponible BOOLEAN DEFAULT FALSE,
  creado_por VARCHAR(100),
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS historial_precios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  servicio_id INT NOT NULL,
  precio_anterior DECIMAL(10,2),
  precio_nuevo DECIMAL(10,2) NOT NULL,
  cambio_por VARCHAR(100),
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE turnos ADD COLUMN IF NOT EXISTS servicio_id INT;
ALTER TABLE turnos ADD COLUMN IF NOT EXISTS descuento_porcentaje DECIMAL(5,2) DEFAULT 0;
ALTER TABLE turnos ADD COLUMN IF NOT EXISTS motivo_descuento VARCHAR(100);
ALTER TABLE turnos ADD COLUMN IF NOT EXISTS precio_unitario DECIMAL(10,2);
ALTER TABLE turnos ADD COLUMN IF NOT EXISTS precio_final DECIMAL(10,2);

ALTER TABLE mascotas ADD COLUMN IF NOT EXISTS tipo_mascota VARCHAR(50);
ALTER TABLE mascotas ADD COLUMN IF NOT EXISTS tamaño VARCHAR(50);
ALTER TABLE mascotas ADD COLUMN IF NOT EXISTS alimento_tipo VARCHAR(100);
ALTER TABLE mascotas ADD COLUMN IF NOT EXISTS alimento_especial BOOLEAN DEFAULT FALSE;
ALTER TABLE mascotas ADD COLUMN IF NOT EXISTS horario_preferido VARCHAR(100);
ALTER TABLE mascotas ADD COLUMN IF NOT EXISTS camita BOOLEAN DEFAULT FALSE;
ALTER TABLE mascotas ADD COLUMN IF NOT EXISTS mantita BOOLEAN DEFAULT FALSE;

SELECT CONCAT('✅ Servicios cargados: ', COUNT(*), ' registros') as resultado FROM servicios;
SELECT CONCAT('✅ Descuentos cargados: ', COUNT(*), ' registros') as resultado FROM descuentos_fidelidad;
