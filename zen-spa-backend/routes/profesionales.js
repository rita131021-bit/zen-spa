const express = require('express');
const router = express.Router();

function ensureSchema(db) {
  db.query("CREATE TABLE IF NOT EXISTS locales (id SERIAL PRIMARY KEY, nombre VARCHAR(120) NOT NULL UNIQUE, direccion VARCHAR(180) NOT NULL, tipo VARCHAR(80) NOT NULL, activo BOOLEAN DEFAULT TRUE, creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP)", [], () => {});
  db.query("INSERT INTO locales (nombre, direccion, tipo, activo) VALUES ('Villaguay al 1000', 'Villaguay al 1000', 'Peluqueria / Spa', TRUE), ('Juan Baez al final', 'Juan Baez al final', 'Guarderia', TRUE) ON CONFLICT (nombre) DO NOTHING", [], () => {});
  db.query('ALTER TABLE profesionales ADD COLUMN IF NOT EXISTS local_id INTEGER', [], () => {});
}
module.exports = (db) => {
  router.get('/', (req, res) => {
    ensureSchema(db);
    db.query(`SELECT p.*, l.nombre as local_nombre, l.tipo as local_tipo
              FROM profesionales p
              LEFT JOIN locales l ON p.local_id = l.id
              WHERE p.activo = TRUE
              ORDER BY p.nombre`, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  });

  router.post('/', (req, res) => {
    ensureSchema(db);
    const nombre = String(req.body.nombre || '').trim();
    const telefono = req.body.telefono || null;
    const email = req.body.email || null;
    const local_id = req.body.local_id || null;
    if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });

    const sql = 'INSERT INTO profesionales (nombre, telefono, email, local_id, activo) VALUES (?, ?, ?, ?, TRUE)';
    db.query(sql, [nombre, telefono, email, local_id], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({
        mensaje: 'Profesional agregada correctamente',
        data: { id: result.insertId, nombre, telefono, email, local_id, activo: true },
      });
    });
  });

  router.put('/:id', (req, res) => {
    ensureSchema(db);
    const { nombre, telefono, email, activo, local_id } = req.body;
    const sql = 'UPDATE profesionales SET nombre=?, telefono=?, email=?, local_id=?, activo=? WHERE id=?';
    db.query(sql, [nombre, telefono, email, local_id || null, activo, req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: 'Profesional actualizada correctamente' });
    });
  });

  router.delete('/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Profesional inválida' });

    db.query('SELECT COUNT(*) AS total FROM profesionales WHERE activo = TRUE', (countErr, countRows) => {
      if (countErr) return res.status(500).json({ error: countErr.message });
      if (Number(countRows[0]?.total || 0) <= 1) {
        return res.status(409).json({ error: 'Debe quedar al menos una profesional activa' });
      }

      db.query('SELECT COUNT(*) AS total FROM turnos WHERE profesional_id = ?', [id], (turnErr, turnRows) => {
        if (turnErr) return res.status(500).json({ error: turnErr.message });
        const hasHistory = Number(turnRows[0]?.total || 0) > 0;
        const sql = hasHistory
          ? 'UPDATE profesionales SET activo = FALSE WHERE id = ?'
          : 'DELETE FROM profesionales WHERE id = ?';

        db.query(sql, [id], (err, result) => {
          if (err) return res.status(500).json({ error: err.message });
          if (!result.affectedRows) return res.status(404).json({ error: 'Profesional no encontrada' });
          res.json({
            mensaje: hasHistory
              ? 'Profesional desactivada; se conservó su historial de turnos'
              : 'Profesional eliminada correctamente',
            desactivada: hasHistory,
          });
        });
      });
    });
  });

  return router;
};
