-- Fix compatible con estructura existente de servicios
-- La columna se llama 'precio' no 'precio_base'

-- Insertar los 7 servicios usando columna 'precio'
INSERT IGNORE INTO servicios (nombre, descripcion, precio, duracion_minutos, categoria) VALUES
('Guardería Felina', 'Cuidado especializado para gatos', 1800.00, 480, 'guarderia'),
('Guardería Canina', 'Cuidado diario para perros', 1500.00, 480, 'guarderia'),
('Peluquería Básica', 'Baño, corte y peinado básico', 2000.00, 120, 'peluqueria'),
('Spa Relax', 'Spa relajante con masaje terapéutico', 3000.00, 75, 'spa'),
('Spa Premium', 'Spa de lujo con tratamientos exclusivos', 4500.00, 90, 'spa'),
('Terapia Alternativa Holística', 'Terapias energéticas y reiki', 2800.00, 60, 'terapia'),
('Baño Simple', 'Baño y secado básico', 1200.00, 45, 'peluqueria');

-- Tabla descuentos
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

-- Tabla bloqueos
CREATE TABLE IF NOT EXISTS bloqueos_calendario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fecha DATE NOT NULL UNIQUE,
  motivo VARCHAR(100),
  disponible BOOLEAN DEFAULT FALSE,
  creado_por VARCHAR(100),
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla historial precios
CREATE TABLE IF NOT EXISTS historial_precios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  servicio_id INT NOT NULL,
  precio_anterior DECIMAL(10,2),
  precio_nuevo DECIMAL(10,2) NOT NULL,
  cambio_por VARCHAR(100),
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Columnas nuevas en turnos
ALTER TABLE turnos ADD COLUMN servicio_id INT;
ALTER TABLE turnos ADD COLUMN descuento_porcentaje DECIMAL(5,2) DEFAULT 0;
ALTER TABLE turnos ADD COLUMN motivo_descuento VARCHAR(100);
ALTER TABLE turnos ADD COLUMN precio_unitario DECIMAL(10,2);
ALTER TABLE turnos ADD COLUMN precio_final DECIMAL(10,2);

-- Columnas nuevas en mascotas
ALTER TABLE mascotas ADD COLUMN tipo_mascota VARCHAR(50);
ALTER TABLE mascotas ADD COLUMN talla VARCHAR(50);
ALTER TABLE mascotas ADD COLUMN alimento_tipo VARCHAR(100);
ALTER TABLE mascotas ADD COLUMN alimento_especial BOOLEAN DEFAULT FALSE;
ALTER TABLE mascotas ADD COLUMN horario_preferido VARCHAR(100);
ALTER TABLE mascotas ADD COLUMN camita BOOLEAN DEFAULT FALSE;
ALTER TABLE mascotas ADD COLUMN mantita BOOLEAN DEFAULT FALSE;

-- Verificar resultado
SELECT CONCAT('Servicios: ', COUNT(*)) as resultado FROM servicios;
SELECT CONCAT('Descuentos: ', COUNT(*)) as resultado FROM descuentos_fidelidad;
