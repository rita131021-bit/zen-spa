CREATE TABLE IF NOT EXISTS mensajes_chat (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  autor_tipo ENUM('cliente', 'admin') NOT NULL,
  autor_nombre VARCHAR(100) NOT NULL,
  mensaje TEXT NOT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_chat_cliente (cliente_id, creado_en)
);

CREATE TABLE IF NOT EXISTS recordatorios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  turno_id INT NOT NULL,
  tipo VARCHAR(30) NOT NULL,
  canal VARCHAR(20) DEFAULT 'whatsapp',
  estado VARCHAR(20) DEFAULT 'pendiente',
  mensaje TEXT,
  whatsapp_url VARCHAR(600),
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  enviado_en TIMESTAMP NULL,
  INDEX idx_recordatorio_turno (turno_id, tipo)
);
