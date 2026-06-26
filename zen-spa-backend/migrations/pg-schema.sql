BEGIN;

CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  email VARCHAR(100),
  whatsapp VARCHAR(20),
  direccion VARCHAR(200),
  notas TEXT,
  creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profesionales (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  especialidad VARCHAR(100),
  telefono VARCHAR(20),
  email VARCHAR(100),
  whatsapp VARCHAR(20),
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS caniles (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL,
  descripcion VARCHAR(255),
  activo BOOLEAN DEFAULT TRUE,
  creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mascotas (
  id SERIAL PRIMARY KEY,
  cliente_id INT REFERENCES clientes(id) ON DELETE SET NULL,
  nombre VARCHAR(100) NOT NULL,
  especie VARCHAR(50),
  raza VARCHAR(100),
  peso DECIMAL(5,2),
  sexo VARCHAR(10),
  talla VARCHAR(20),
  edad VARCHAR(30),
  color VARCHAR(50),
  chip VARCHAR(50),
  alergias TEXT,
  medicacion TEXT,
  veterinario VARCHAR(100),
  castracion VARCHAR(20),
  alimento_tipo VARCHAR(50),
  fecha_nacimiento DATE,
  notas TEXT,
  tipo_mascota VARCHAR(50),
  alimento_especial BOOLEAN DEFAULT FALSE,
  horario_preferido VARCHAR(100),
  camita BOOLEAN DEFAULT FALSE,
  mantita BOOLEAN DEFAULT FALSE,
  creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS servicios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  precio_base DECIMAL(10,2),
  precio DECIMAL(10,2),
  duracion_minutos INT DEFAULT 60,
  categoria VARCHAR(50),
  activo BOOLEAN DEFAULT TRUE,
  requiere_canil BOOLEAN DEFAULT FALSE,
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS horarios (
  id SERIAL PRIMARY KEY,
  dia VARCHAR(20) NOT NULL,
  hora TIME NOT NULL,
  disponible BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS bloqueos (
  id SERIAL PRIMARY KEY,
  fecha DATE NOT NULL,
  motivo VARCHAR(200),
  creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bloqueos_calendario (
  id SERIAL PRIMARY KEY,
  fecha DATE NOT NULL UNIQUE,
  motivo VARCHAR(100),
  disponible BOOLEAN DEFAULT FALSE,
  creado_por VARCHAR(100),
  creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feriados (
  id SERIAL PRIMARY KEY,
  fecha DATE NOT NULL UNIQUE,
  nombre VARCHAR(120) NOT NULL,
  tipo VARCHAR(60) DEFAULT 'Nacional',
  no_laborable BOOLEAN DEFAULT TRUE,
  creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS turnos (
  id SERIAL PRIMARY KEY,
  cliente_id INT REFERENCES clientes(id) ON DELETE SET NULL,
  mascota_id INT REFERENCES mascotas(id) ON DELETE SET NULL,
  servicio_id INT REFERENCES servicios(id) ON DELETE SET NULL,
  profesional_id INT REFERENCES profesionales(id) ON DELETE SET NULL,
  canil_id INT REFERENCES caniles(id) ON DELETE SET NULL,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  fecha_egreso DATE,
  hora_egreso TIME,
  estado VARCHAR(50) DEFAULT 'Pendiente',
  pago VARCHAR(50) DEFAULT 'Pendiente',
  observaciones TEXT,
  descuento_porcentaje DECIMAL(5,2) DEFAULT 0,
  motivo_descuento VARCHAR(100),
  precio_unitario DECIMAL(10,2),
  precio_final DECIMAL(10,2),
  creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mensajes_chat (
  id SERIAL PRIMARY KEY,
  cliente_id INT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  autor_tipo VARCHAR(20) NOT NULL,
  autor_nombre VARCHAR(100) NOT NULL,
  mensaje TEXT NOT NULL,
  creado_en TIMESTAMP DEFAULT NOW(),
  CONSTRAINT mensajes_chat_autor_tipo_check CHECK (autor_tipo IN ('cliente', 'admin'))
);

CREATE TABLE IF NOT EXISTS recordatorios (
  id SERIAL PRIMARY KEY,
  turno_id INT NOT NULL REFERENCES turnos(id) ON DELETE CASCADE,
  tipo VARCHAR(30) NOT NULL,
  canal VARCHAR(20) DEFAULT 'whatsapp',
  estado VARCHAR(20) DEFAULT 'pendiente',
  mensaje TEXT,
  whatsapp_url VARCHAR(600),
  creado_en TIMESTAMP DEFAULT NOW(),
  enviado_en TIMESTAMP
);

CREATE TABLE IF NOT EXISTS descuentos_fidelidad (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  porcentaje DECIMAL(5,2) NOT NULL,
  turnos_requeridos INT DEFAULT 0,
  meses_requeridos INT DEFAULT 0,
  descripcion TEXT,
  activo BOOLEAN DEFAULT TRUE,
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reportes_finanzas (
  id SERIAL PRIMARY KEY,
  periodo_inicio DATE,
  periodo_fin DATE,
  ingresos_totales DECIMAL(12,2) DEFAULT 0,
  gastos_totales DECIMAL(12,2) DEFAULT 0,
  descuentos_aplicados DECIMAL(12,2) DEFAULT 0,
  ganancias DECIMAL(12,2) DEFAULT 0,
  cantidad_turnos INT DEFAULT 0,
  promedio_ticket DECIMAL(10,2) DEFAULT 0,
  servicio_mas_popular VARCHAR(100),
  cantidad_clientes INT DEFAULT 0,
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS historial_precios (
  id SERIAL PRIMARY KEY,
  servicio_id INT NOT NULL REFERENCES servicios(id) ON DELETE CASCADE,
  precio_anterior DECIMAL(10,2),
  precio_nuevo DECIMAL(10,2) NOT NULL,
  cambio_por VARCHAR(100),
  creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS movimientos_financieros (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(50),
  turno_id INT REFERENCES turnos(id) ON DELETE SET NULL,
  cliente_id INT REFERENCES clientes(id) ON DELETE SET NULL,
  monto DECIMAL(12,2) NOT NULL,
  descripcion TEXT,
  concepto VARCHAR(100),
  creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resenas (
  id SERIAL PRIMARY KEY,
  cliente_id INT REFERENCES clientes(id) ON DELETE SET NULL,
  nombre_cliente VARCHAR(100) NOT NULL,
  email VARCHAR(150),
  calificacion SMALLINT NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
  comentario TEXT NOT NULL,
  respuesta TEXT,
  estado VARCHAR(20) DEFAULT 'pendiente',
  destacada BOOLEAN DEFAULT FALSE,
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW(),
  CONSTRAINT resenas_estado_check CHECK (estado IN ('pendiente', 'aprobada', 'rechazada'))
);

CREATE TABLE IF NOT EXISTS resenas_fotos (
  id SERIAL PRIMARY KEY,
  resena_id INT NOT NULL REFERENCES resenas(id) ON DELETE CASCADE,
  ruta_archivo VARCHAR(255) NOT NULL,
  orden INT DEFAULT 0,
  creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gift_cards (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  monto_inicial DECIMAL(10,2) NOT NULL,
  monto_saldo DECIMAL(10,2) NOT NULL,
  cliente_id INT REFERENCES clientes(id) ON DELETE SET NULL,
  estado VARCHAR(20) DEFAULT 'activa',
  fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento DATE,
  notas TEXT,
  creado_en TIMESTAMP DEFAULT NOW(),
  CONSTRAINT gift_cards_estado_check CHECK (estado IN ('activa', 'canjeada', 'vencida', 'anulada'))
);

CREATE TABLE IF NOT EXISTS gift_cards_usos (
  id SERIAL PRIMARY KEY,
  gift_card_id INT NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
  turno_id INT REFERENCES turnos(id) ON DELETE SET NULL,
  monto_usado DECIMAL(10,2) NOT NULL,
  fecha_uso TIMESTAMP DEFAULT NOW(),
  notas TEXT
);

CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes(nombre);
CREATE INDEX IF NOT EXISTS idx_clientes_whatsapp ON clientes(whatsapp);
CREATE INDEX IF NOT EXISTS idx_mascotas_cliente_id ON mascotas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_mascotas_nombre ON mascotas(nombre);
CREATE INDEX IF NOT EXISTS idx_mascotas_tipo_mascota ON mascotas(tipo_mascota);
CREATE INDEX IF NOT EXISTS idx_mascotas_alimento_especial ON mascotas(alimento_especial);
CREATE INDEX IF NOT EXISTS idx_servicios_categoria ON servicios(categoria);
CREATE INDEX IF NOT EXISTS idx_servicios_activo ON servicios(activo);
CREATE INDEX IF NOT EXISTS idx_profesionales_activo ON profesionales(activo);
CREATE INDEX IF NOT EXISTS idx_caniles_activo ON caniles(activo);
CREATE INDEX IF NOT EXISTS idx_horarios_dia_hora ON horarios(dia, hora);
CREATE UNIQUE INDEX IF NOT EXISTS idx_horarios_dia_hora_unique ON horarios(dia, hora);
CREATE INDEX IF NOT EXISTS idx_bloqueos_fecha ON bloqueos(fecha);
CREATE INDEX IF NOT EXISTS idx_bloqueos_calendario_fecha ON bloqueos_calendario(fecha);
CREATE INDEX IF NOT EXISTS idx_bloqueos_calendario_disponible ON bloqueos_calendario(disponible);
CREATE INDEX IF NOT EXISTS idx_feriados_fecha ON feriados(fecha);
CREATE INDEX IF NOT EXISTS idx_turnos_cliente_id ON turnos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_turnos_mascota_id ON turnos(mascota_id);
CREATE INDEX IF NOT EXISTS idx_turnos_servicio_id ON turnos(servicio_id);
CREATE INDEX IF NOT EXISTS idx_turnos_profesional_id ON turnos(profesional_id);
CREATE INDEX IF NOT EXISTS idx_turnos_canil_id ON turnos(canil_id);
CREATE INDEX IF NOT EXISTS idx_turnos_fecha_hora ON turnos(fecha, hora);
CREATE INDEX IF NOT EXISTS idx_turnos_profesional_fecha_hora ON turnos(profesional_id, fecha, hora);
CREATE INDEX IF NOT EXISTS idx_turnos_canil_fecha_hora ON turnos(canil_id, fecha, hora);
CREATE INDEX IF NOT EXISTS idx_turnos_estado ON turnos(estado);
CREATE INDEX IF NOT EXISTS idx_turnos_pago ON turnos(pago);
CREATE INDEX IF NOT EXISTS idx_turnos_precio_final ON turnos(precio_final);
CREATE INDEX IF NOT EXISTS idx_mensajes_chat_cliente_creado ON mensajes_chat(cliente_id, creado_en);
CREATE INDEX IF NOT EXISTS idx_recordatorios_turno_tipo ON recordatorios(turno_id, tipo);
CREATE INDEX IF NOT EXISTS idx_recordatorios_estado ON recordatorios(estado);
CREATE INDEX IF NOT EXISTS idx_descuentos_fidelidad_activo ON descuentos_fidelidad(activo);
CREATE INDEX IF NOT EXISTS idx_reportes_finanzas_periodo ON reportes_finanzas(periodo_inicio, periodo_fin);
CREATE INDEX IF NOT EXISTS idx_historial_precios_servicio_id ON historial_precios(servicio_id);
CREATE INDEX IF NOT EXISTS idx_historial_precios_creado_en ON historial_precios(creado_en);
CREATE INDEX IF NOT EXISTS idx_movimientos_financieros_tipo ON movimientos_financieros(tipo);
CREATE INDEX IF NOT EXISTS idx_movimientos_financieros_turno_id ON movimientos_financieros(turno_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_financieros_cliente_id ON movimientos_financieros(cliente_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_financieros_creado_en ON movimientos_financieros(creado_en);
CREATE INDEX IF NOT EXISTS idx_resenas_estado ON resenas(estado);
CREATE INDEX IF NOT EXISTS idx_resenas_creado_en ON resenas(creado_en);
CREATE INDEX IF NOT EXISTS idx_resenas_destacada ON resenas(destacada);
CREATE INDEX IF NOT EXISTS idx_resenas_fotos_resena_id ON resenas_fotos(resena_id);
CREATE INDEX IF NOT EXISTS idx_gift_cards_codigo ON gift_cards(codigo);
CREATE INDEX IF NOT EXISTS idx_gift_cards_cliente_id ON gift_cards(cliente_id);
CREATE INDEX IF NOT EXISTS idx_gift_cards_estado ON gift_cards(estado);
CREATE INDEX IF NOT EXISTS idx_gift_cards_fecha_vencimiento ON gift_cards(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_gift_cards_usos_gift_card_id ON gift_cards_usos(gift_card_id);
CREATE INDEX IF NOT EXISTS idx_gift_cards_usos_turno_id ON gift_cards_usos(turno_id);

INSERT INTO caniles (nombre, descripcion, activo)
VALUES
  ('Canil 1', 'Canil principal', TRUE),
  ('Canil 2', 'Canil mediano', TRUE),
  ('Canil 3', 'Canil chico', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO feriados (fecha, nombre, tipo, no_laborable)
VALUES
  ('2026-01-01', 'Año Nuevo', 'Nacional', TRUE),
  ('2026-02-16', 'Carnaval', 'Nacional', TRUE),
  ('2026-02-17', 'Carnaval', 'Nacional', TRUE),
  ('2026-03-24', 'Día Nacional de la Memoria por la Verdad y la Justicia', 'Nacional', TRUE),
  ('2026-04-02', 'Día del Veterano y de los Caídos en la Guerra de Malvinas', 'Nacional', TRUE),
  ('2026-04-03', 'Viernes Santo', 'Religioso', TRUE),
  ('2026-05-01', 'Día del Trabajador', 'Nacional', TRUE),
  ('2026-05-25', 'Día de la Revolución de Mayo', 'Nacional', TRUE),
  ('2026-06-20', 'Paso a la Inmortalidad del General Manuel Belgrano', 'Nacional', TRUE),
  ('2026-07-09', 'Día de la Independencia', 'Nacional', TRUE),
  ('2026-08-17', 'Paso a la Inmortalidad del General José de San Martín', 'Nacional', TRUE),
  ('2026-10-12', 'Día del Respeto a la Diversidad Cultural', 'Nacional', TRUE),
  ('2026-11-23', 'Día de la Soberanía Nacional', 'Nacional', TRUE),
  ('2026-12-08', 'Inmaculada Concepción de María', 'Religioso', TRUE),
  ('2026-12-25', 'Navidad', 'Religioso', TRUE)
ON CONFLICT (fecha) DO NOTHING;

INSERT INTO horarios (dia, hora, disponible)
VALUES
  ('Lunes', '08:00:00', TRUE),
  ('Lunes', '09:00:00', TRUE),
  ('Lunes', '10:00:00', TRUE),
  ('Lunes', '11:00:00', TRUE),
  ('Lunes', '14:00:00', TRUE),
  ('Lunes', '15:00:00', TRUE),
  ('Lunes', '16:00:00', TRUE),
  ('Lunes', '17:00:00', TRUE),
  ('Martes', '08:00:00', TRUE),
  ('Martes', '09:00:00', TRUE),
  ('Martes', '10:00:00', TRUE),
  ('Martes', '11:00:00', TRUE),
  ('Martes', '14:00:00', TRUE),
  ('Martes', '15:00:00', TRUE),
  ('Martes', '16:00:00', TRUE),
  ('Martes', '17:00:00', TRUE),
  ('Miercoles', '08:00:00', TRUE),
  ('Miercoles', '09:00:00', TRUE),
  ('Miercoles', '10:00:00', TRUE),
  ('Miercoles', '11:00:00', TRUE),
  ('Miercoles', '14:00:00', TRUE),
  ('Miercoles', '15:00:00', TRUE),
  ('Miercoles', '16:00:00', TRUE),
  ('Miercoles', '17:00:00', TRUE),
  ('Jueves', '08:00:00', TRUE),
  ('Jueves', '09:00:00', TRUE),
  ('Jueves', '10:00:00', TRUE),
  ('Jueves', '11:00:00', TRUE),
  ('Jueves', '14:00:00', TRUE),
  ('Jueves', '15:00:00', TRUE),
  ('Jueves', '16:00:00', TRUE),
  ('Jueves', '17:00:00', TRUE),
  ('Viernes', '08:00:00', TRUE),
  ('Viernes', '09:00:00', TRUE),
  ('Viernes', '10:00:00', TRUE),
  ('Viernes', '11:00:00', TRUE),
  ('Viernes', '14:00:00', TRUE),
  ('Viernes', '15:00:00', TRUE),
  ('Viernes', '16:00:00', TRUE),
  ('Viernes', '17:00:00', TRUE),
  ('Sabado', '08:00:00', TRUE),
  ('Sabado', '09:00:00', TRUE),
  ('Sabado', '10:00:00', TRUE),
  ('Sabado', '11:00:00', TRUE),
  ('Sabado', '14:00:00', TRUE),
  ('Sabado', '15:00:00', TRUE),
  ('Sabado', '16:00:00', TRUE),
  ('Sabado', '17:00:00', TRUE),
  ('Domingo', '08:00:00', TRUE),
  ('Domingo', '09:00:00', TRUE),
  ('Domingo', '10:00:00', TRUE),
  ('Domingo', '11:00:00', TRUE),
  ('Domingo', '14:00:00', TRUE),
  ('Domingo', '15:00:00', TRUE),
  ('Domingo', '16:00:00', TRUE),
  ('Domingo', '17:00:00', TRUE)
ON CONFLICT (dia, hora) DO NOTHING;

INSERT INTO servicios (nombre, descripcion, precio_base, precio, duracion_minutos, categoria, activo, requiere_canil)
VALUES
  ('Guardería Felina', 'Cuidado especializado para gatos con ambiente tranquilo y seguro', 1800.00, 1800.00, 480, 'guarderia', TRUE, TRUE),
  ('Guardería Canina', 'Cuidado diario para perros con actividades y entretenimiento', 1500.00, 1500.00, 480, 'guarderia', TRUE, TRUE),
  ('Peluquería Básica', 'Baño, corte y peinado profesional básico', 2000.00, 2000.00, 120, 'peluqueria', TRUE, FALSE),
  ('Spa Relax', 'Spa relajante intenso con baños termales y masaje terapéutico', 3000.00, 3000.00, 75, 'spa', TRUE, FALSE),
  ('Spa Premium', 'Spa de lujo con tratamientos exclusivos y atención personalizada', 4500.00, 4500.00, 90, 'spa', TRUE, FALSE),
  ('Terapia Alternativa Holística', 'Terapias energéticas, acupuntura y reiki para mascotas', 2800.00, 2800.00, 60, 'terapia', TRUE, FALSE),
  ('Baño Simple', 'Baño y secado básico con productos hipoalergénicos', 1200.00, 1200.00, 45, 'peluqueria', TRUE, FALSE)
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO descuentos_fidelidad (nombre, porcentaje, turnos_requeridos, meses_requeridos, descripcion, activo)
VALUES
  ('Cliente Regular', 5.00, 5, 0, 'Después de 5 servicios', TRUE),
  ('Cliente Frecuente', 10.00, 10, 0, 'Después de 10 servicios', TRUE),
  ('Cliente VIP', 15.00, 20, 3, 'Después de 20 servicios y 3 meses', TRUE),
  ('Cliente Aniversario', 20.00, 0, 12, 'Después de 1 año como cliente', TRUE)
ON CONFLICT DO NOTHING;

COMMIT;