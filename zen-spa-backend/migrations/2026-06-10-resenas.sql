-- Tabla de resenas con fotos
CREATE TABLE IF NOT EXISTS resenas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT,
  nombre_cliente VARCHAR(100) NOT NULL,
  email VARCHAR(150),
  calificacion TINYINT NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
  comentario TEXT NOT NULL,
  respuesta TEXT,
  estado ENUM('pendiente','aprobada','rechazada') DEFAULT 'pendiente',
  destacada BOOLEAN DEFAULT FALSE,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de fotos asociadas a resenas (una resena puede tener varias fotos)
CREATE TABLE IF NOT EXISTS resenas_fotos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  resena_id INT NOT NULL,
  ruta_archivo VARCHAR(255) NOT NULL,
  orden INT DEFAULT 0,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (resena_id) REFERENCES resenas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_resenas_estado ON resenas(estado);
CREATE INDEX idx_resenas_creado ON resenas(creado_en);

SELECT 'OK - tablas resenas y resenas_fotos creadas' as resultado;
