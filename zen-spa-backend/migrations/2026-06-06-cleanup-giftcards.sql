-- ============================================================
-- Limpiar servicios duplicados — dejar los nombres correctos
-- ============================================================

-- Paso 1: eliminar todos los servicios y reinsertarlos limpios
-- (solo si la tabla tiene más de 7 registros, hay duplicados)
DELETE FROM servicios;
ALTER TABLE servicios AUTO_INCREMENT = 1;

INSERT INTO servicios (nombre, descripcion, precio, duracion_minutos, categoria, activo) VALUES
('Guardería Felina',            'Cuidado especializado para gatos con ambiente tranquilo y seguro', 1800.00, 480, 'guarderia', 1),
('Guardería Canina',            'Cuidado diario para perros con actividades y entretenimiento',    1500.00, 480, 'guarderia', 1),
('Peluquería Básica',           'Baño, corte y peinado profesional',                               2000.00, 120, 'peluqueria', 1),
('Spa Relax',                   'Spa relajante con masaje terapéutico y aromaterapia',              3000.00,  75, 'spa',        1),
('Spa Premium',                 'Spa de lujo con tratamientos exclusivos y atención personalizada', 4500.00,  90, 'spa',        1),
('Terapia Alternativa Holística','Terapias energéticas, acupuntura y reiki para mascotas',          2800.00,  60, 'terapia',    1),
('Baño Simple',                 'Baño y secado básico con productos hipoalergénicos',               1200.00,  45, 'peluqueria', 1);

-- ============================================================
-- Tabla gift_cards
-- ============================================================
CREATE TABLE IF NOT EXISTS gift_cards (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  codigo        VARCHAR(20) NOT NULL UNIQUE,
  monto_inicial DECIMAL(10,2) NOT NULL,
  monto_saldo   DECIMAL(10,2) NOT NULL,
  cliente_id    INT,
  estado        ENUM('activa','canjeada','vencida','anulada') DEFAULT 'activa',
  fecha_emision DATE NOT NULL DEFAULT (CURDATE()),
  fecha_vencimiento DATE,
  notas         TEXT,
  creado_en     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS gift_cards_usos (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  gift_card_id INT NOT NULL,
  turno_id    INT,
  monto_usado DECIMAL(10,2) NOT NULL,
  fecha_uso   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notas       TEXT,
  FOREIGN KEY (gift_card_id) REFERENCES gift_cards(id) ON DELETE CASCADE,
  FOREIGN KEY (turno_id)     REFERENCES turnos(id)     ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SELECT CONCAT('✅ Servicios: ', COUNT(*)) as resultado FROM servicios;
SELECT CONCAT('✅ Gift cards tabla creada') as resultado;
