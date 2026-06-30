const express = require('express');

function query(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => err ? reject(err) : resolve(results || []));
  });
}

async function ensureSchema(db) {
  await query(db, "CREATE TABLE IF NOT EXISTS locales (id SERIAL PRIMARY KEY, nombre VARCHAR(120) NOT NULL UNIQUE, direccion VARCHAR(180) NOT NULL, tipo VARCHAR(80) NOT NULL, activo BOOLEAN DEFAULT TRUE, creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
  await query(db, "INSERT INTO locales (nombre, direccion, tipo, activo) VALUES ('Villaguay al 1000', 'Villaguay al 1000', 'Peluqueria / Spa', TRUE), ('Juan Baez al final', 'Juan Baez al final', 'Guarderia', TRUE) ON CONFLICT (nombre) DO UPDATE SET direccion = EXCLUDED.direccion, tipo = EXCLUDED.tipo, activo = TRUE");
  await query(db, 'ALTER TABLE profesionales ADD COLUMN IF NOT EXISTS local_id INTEGER REFERENCES locales(id)');
  await query(db, 'ALTER TABLE servicios ADD COLUMN IF NOT EXISTS local_id INTEGER REFERENCES locales(id)');
  await query(db, 'ALTER TABLE turnos ADD COLUMN IF NOT EXISTS local_id INTEGER REFERENCES locales(id)');
  await query(db, "UPDATE profesionales SET local_id = (SELECT id FROM locales WHERE nombre = 'Villaguay al 1000') WHERE local_id IS NULL");
  await query(db, "UPDATE servicios SET local_id = (SELECT id FROM locales WHERE nombre = 'Juan Baez al final') WHERE local_id IS NULL AND lower(coalesce(categoria,'')) LIKE '%guard%'");
  await query(db, "UPDATE servicios SET local_id = (SELECT id FROM locales WHERE nombre = 'Villaguay al 1000') WHERE local_id IS NULL");
  await query(db, "CREATE TABLE IF NOT EXISTS horarios_locales (id SERIAL PRIMARY KEY, local_id INTEGER NOT NULL REFERENCES locales(id) ON DELETE CASCADE, dia VARCHAR(20) NOT NULL, hora_apertura TIME NOT NULL DEFAULT '08:00', hora_cierre TIME NOT NULL DEFAULT '18:00', disponible BOOLEAN DEFAULT TRUE, UNIQUE(local_id, dia))");
  await query(db, "CREATE TABLE IF NOT EXISTS horarios_profesionales (id SERIAL PRIMARY KEY, profesional_id INTEGER NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE, dia VARCHAR(20) NOT NULL, hora_apertura TIME NOT NULL DEFAULT '08:00', hora_cierre TIME NOT NULL DEFAULT '18:00', disponible BOOLEAN DEFAULT TRUE, UNIQUE(profesional_id, dia))");
  await query(db, "CREATE TABLE IF NOT EXISTS bloqueos_disponibilidad (id SERIAL PRIMARY KEY, local_id INTEGER REFERENCES locales(id) ON DELETE CASCADE, profesional_id INTEGER REFERENCES profesionales(id) ON DELETE CASCADE, fecha DATE NOT NULL, hora_inicio TIME, hora_fin TIME, tipo VARCHAR(40) DEFAULT 'bloqueo', motivo VARCHAR(255), creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
  await query(db, "INSERT INTO horarios_locales (local_id, dia, hora_apertura, hora_cierre, disponible) SELECT l.id, d.dia, '08:00', '18:00', TRUE FROM locales l CROSS JOIN (VALUES ('Lunes'),('Martes'),('Miercoles'),('Jueves'),('Viernes'),('Sabado')) d(dia) ON CONFLICT (local_id, dia) DO NOTHING");
  await query(db, "INSERT INTO horarios_profesionales (profesional_id, dia, hora_apertura, hora_cierre, disponible) SELECT p.id, d.dia, '08:00', '18:00', TRUE FROM profesionales p CROSS JOIN (VALUES ('Lunes'),('Martes'),('Miercoles'),('Jueves'),('Viernes'),('Sabado')) d(dia) ON CONFLICT (profesional_id, dia) DO NOTHING");
}

module.exports = (db) => {
  const router = express.Router();
  router.get('/', async (req, res) => {
    try {
      await ensureSchema(db);
      const rows = await query(db, 'SELECT * FROM locales WHERE activo = TRUE ORDER BY id');
      res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });
  router.put('/:id', async (req, res) => {
    try {
      await ensureSchema(db);
      const { nombre, direccion, tipo, activo } = req.body;
      await query(db, 'UPDATE locales SET nombre = ?, direccion = ?, tipo = ?, activo = ? WHERE id = ?', [nombre, direccion, tipo, Boolean(activo), req.params.id]);
      res.json({ mensaje: 'Local actualizado correctamente' });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });
  return router;
};
module.exports.ensureSchema = ensureSchema;
