-- ============================================================================
-- MIGRACIÓN: SERVICIOS, PRECIOS, DESCUENTOS Y FINANZAS
-- Fecha: 5 de Junio de 2026
-- ============================================================================

-- 1. TABLA DE SERVICIOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS servicios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  precio_base DECIMAL(10,2) NOT NULL,
  duracion_minutos INT DEFAULT 60,
  categoria VARCHAR(50),
  activo BOOLEAN DEFAULT TRUE,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_categoria (categoria),
  INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insertar servicios predefinidos (7 servicios)
INSERT INTO servicios (nombre, descripcion, precio_base, duracion_minutos, categoria) VALUES
('Guardería Felina', 'Cuidado especializado para gatos con ambiente tranquilo y seguro', 1800.00, 480, 'guarderia'),
('Guardería Canina', 'Cuidado diario para perros con actividades y entretenimiento', 1500.00, 480, 'guarderia'),
('Peluquería Básica', 'Baño, corte y peinado profesional básico', 2000.00, 120, 'peluqueria'),
('Spa Relax', 'Spa relajante intenso con baños termales y masaje terapéutico', 3000.00, 75, 'spa'),
('Spa Premium', 'Spa de lujo con tratamientos exclusivos y atención personalizada', 4500.00, 90, 'spa'),
('Terapia Alternativa Holística', 'Terapias energéticas, acupuntura y reiki para mascotas', 2800.00, 60, 'terapia'),
('Baño Simple', 'Baño y secado básico con productos hipoalergénicos', 1200.00, 45, 'peluqueria');

-- 2. TABLA DE DESCUENTOS POR FIDELIDAD
-- ============================================================================
CREATE TABLE IF NOT EXISTS descuentos_fidelidad (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  porcentaje DECIMAL(5,2) NOT NULL,
  turnos_requeridos INT DEFAULT 0,
  meses_requeridos INT DEFAULT 0,
  descripcion TEXT,
  activo BOOLEAN DEFAULT TRUE,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insertar descuentos por defecto
INSERT INTO descuentos_fidelidad (nombre, porcentaje, turnos_requeridos, meses_requeridos, descripcion) VALUES
('Cliente Regular', 5.00, 5, 0, 'Después de 5 servicios'),
('Cliente Frecuente', 10.00, 10, 0, 'Después de 10 servicios'),
('Cliente VIP', 15.00, 20, 3, 'Después de 20 servicios y 3 meses'),
('Cliente Aniversario', 20.00, 0, 12, 'Después de 1 año como cliente');

-- 3. TABLA DE BLOQUEOS DE CALENDARIO
-- ============================================================================
CREATE TABLE IF NOT EXISTS bloqueos_calendario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fecha DATE NOT NULL UNIQUE,
  motivo VARCHAR(100),
  disponible BOOLEAN DEFAULT FALSE,
  creado_por VARCHAR(100),
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_fecha (fecha),
  INDEX idx_disponible (disponible)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. MODIFICAR TABLA TURNOS (si no existen las columnas, las agrega)
-- ============================================================================
ALTER TABLE turnos ADD COLUMN IF NOT EXISTS servicio_id INT;
ALTER TABLE turnos ADD COLUMN IF NOT EXISTS descuento_porcentaje DECIMAL(5,2) DEFAULT 0;
ALTER TABLE turnos ADD COLUMN IF NOT EXISTS motivo_descuento VARCHAR(100);
ALTER TABLE turnos ADD COLUMN IF NOT EXISTS precio_unitario DECIMAL(10,2);
ALTER TABLE turnos ADD COLUMN IF NOT EXISTS precio_final DECIMAL(10,2);

-- Agregar foreign key si no existe
ALTER TABLE turnos ADD CONSTRAINT IGNORE fk_servicio FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE SET NULL;

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_servicio_id ON turnos(servicio_id);
CREATE INDEX IF NOT EXISTS idx_precio_final ON turnos(precio_final);

-- 5. TABLA DE REPORTES DE FINANZAS
-- ============================================================================
CREATE TABLE IF NOT EXISTS reportes_finanzas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  periodo_inicio DATE NOT NULL,
  periodo_fin DATE NOT NULL,
  ingresos_totales DECIMAL(12,2) DEFAULT 0,
  gastos_totales DECIMAL(12,2) DEFAULT 0,
  descuentos_aplicados DECIMAL(12,2) DEFAULT 0,
  ganancias DECIMAL(12,2) DEFAULT 0,
  cantidad_turnos INT DEFAULT 0,
  promedio_ticket DECIMAL(10,2) DEFAULT 0,
  servicio_mas_popular VARCHAR(100),
  cantidad_clientes INT DEFAULT 0,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_periodo (periodo_inicio, periodo_fin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. TABLA DE HISTORIAL DE PRECIOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS historial_precios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  servicio_id INT NOT NULL,
  precio_anterior DECIMAL(10,2),
  precio_nuevo DECIMAL(10,2) NOT NULL,
  cambio_por VARCHAR(100),
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE,
  INDEX idx_servicio_id (servicio_id),
  INDEX idx_fecha (creado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. TABLA DE MOVIMIENTOS FINANCIEROS
-- ============================================================================
CREATE TABLE IF NOT EXISTS movimientos_financieros (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipo VARCHAR(50),
  turno_id INT,
  cliente_id INT,
  monto DECIMAL(12,2) NOT NULL,
  descripcion TEXT,
  concepto VARCHAR(100),
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (turno_id) REFERENCES turnos(id) ON DELETE SET NULL,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
  INDEX idx_tipo (tipo),
  INDEX idx_fecha (creado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- VISTAS ÚTILES PARA REPORTES
-- ============================================================================

-- Vista: Clientes con descuento aplicable
CREATE OR REPLACE VIEW v_clientes_con_descuento AS
SELECT 
  c.id,
  c.nombre,
  COUNT(t.id) as cantidad_turnos,
  DATEDIFF(CURDATE(), MIN(t.fecha)) / 30 as meses_desde_primer_turno,
  CASE
    WHEN DATEDIFF(CURDATE(), MIN(t.fecha)) >= 365 THEN 'Cliente Aniversario'
    WHEN COUNT(t.id) >= 20 AND DATEDIFF(CURDATE(), MIN(t.fecha)) >= 90 THEN 'Cliente VIP'
    WHEN COUNT(t.id) >= 10 THEN 'Cliente Frecuente'
    WHEN COUNT(t.id) >= 5 THEN 'Cliente Regular'
    ELSE 'Sin descuento'
  END as nivel_fidelidad
FROM clientes c
LEFT JOIN turnos t ON c.id = t.cliente_id AND t.estado IN ('Confirmado', 'Completado')
GROUP BY c.id, c.nombre;

-- Vista: Resumen ingresos por servicio
CREATE OR REPLACE VIEW v_ingresos_por_servicio AS
SELECT 
  s.id,
  s.nombre,
  s.categoria,
  COUNT(t.id) as cantidad_turnos,
  COALESCE(SUM(t.precio_final), 0) as ingresos_totales,
  COALESCE(AVG(t.precio_final), 0) as precio_promedio,
  COALESCE(SUM(t.descuento_porcentaje * t.precio_unitario / 100), 0) as descuentos_totales
FROM servicios s
LEFT JOIN turnos t ON s.id = t.servicio_id AND t.estado IN ('Confirmado', 'Completado')
WHERE s.activo = TRUE
GROUP BY s.id, s.nombre, s.categoria;

-- Vista: Ingresos diarios
CREATE OR REPLACE VIEW v_ingresos_diarios AS
SELECT 
  DATE(t.fecha) as fecha,
  COUNT(t.id) as cantidad_turnos,
  COALESCE(SUM(t.precio_final), 0) as ingresos_totales,
  COALESCE(SUM(t.descuento_porcentaje * t.precio_unitario / 100), 0) as descuentos_totales,
  COALESCE(SUM(t.precio_final) + SUM(t.descuento_porcentaje * t.precio_unitario / 100), 0) as ingresos_sin_descuentos
FROM turnos t
WHERE t.estado IN ('Confirmado', 'Completado')
GROUP BY DATE(t.fecha);

-- ============================================================================
-- FIN MIGRACIÓN
-- ============================================================================
-- Para verificar que todo se creó correctamente, ejecutar:
-- SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'zen_spa';
-- SELECT COUNT(*) FROM servicios;  -- Debería mostrar 7
-- SELECT * FROM servicios;
