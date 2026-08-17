const express = require('express');
const router = express.Router();

const allDays = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

function query(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

function normalizeBool(value, fallback = true) {
  if (typeof value === 'boolean') return value;
  if (value === 1 || value === '1' || value === 'true') return true;
  if (value === 0 || value === '0' || value === 'false') return false;
  return fallback;
}

function normalizeTime(value, fallback) {
  const text = String(value || fallback).slice(0, 5);
  return /^d{2}:d{2}$/.test(text) ? text : fallback;
}

function normalizeDays(value) {
  if (!Array.isArray(value)) return allDays.filter((d) => d !== 'Domingo');
  return allDays.filter((day) => value.includes(day));
}

function parseBlocks(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      fecha: String(item.fecha || '').slice(0, 10),
      hora_inicio: item.hora_inicio ? normalizeTime(item.hora_inicio, '00:00') : null,
      hora_fin: item.hora_fin ? normalizeTime(item.hora_fin, '23:59') : null,
      motivo: String(item.motivo || '').trim() || null,
    }))
    .filter((item) => /^d{4}-d{2}-d{2}$/.test(item.fecha));
}

async function ensureSchema(db) {
  await query(db, "CREATE TABLE IF NOT EXISTS locales (id SERIAL PRIMARY KEY, nombre VARCHAR(120) NOT NULL UNIQUE, direccion VARCHAR(180) NOT NULL, tipo VARCHAR(80) NOT NULL, activo BOOLEAN DEFAULT TRUE, creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
  await query(db, "INSERT INTO locales (nombre, direccion, tipo, activo) VALUES ('Villaguay al 1000', 'Villaguay al 1000', 'Peluqueria / Spa', TRUE), ('Juan Baez al final', 'Juan Baez al final', 'Guarderia', TRUE) ON CONFLICT (nombre) DO NOTHING");
  await query(db, 'ALTER TABLE profesionales ADD COLUMN IF NOT EXISTS local_id INTEGER');
  await query(db, "CREATE TABLE IF NOT EXISTS horarios_profesionales (id SERIAL PRIMARY KEY, profesional_id INTEGER NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE, dia VARCHAR(20) NOT NULL, hora_entrada TIME NOT NULL DEFAULT '08:00', hora_salida TIME NOT NULL DEFAULT '18:00', disponible BOOLEAN DEFAULT TRUE, UNIQUE(profesional_id, dia))");
  await query(db, "CREATE TABLE IF NOT EXISTS bloqueos_profesionales (id SERIAL PRIMARY KEY, profesional_id INTEGER NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE, fecha DATE NOT NULL, hora_inicio TIME, hora_fin TIME, motivo VARCHAR(180), creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
}

async function hydrateProfessionals(db, rows) {
  const ids = rows.map((item) => Number(item.id)).filter(Boolean);
  if (ids.length === 0) return rows;
  const horarios = await query(db, 'SELECT * FROM horarios_profesionales ORDER BY profesional_id, dia');
  const bloqueos = await query(db, 'SELECT * FROM bloqueos_profesionales ORDER BY fecha, hora_inicio');
  return rows.map((profesional) => ({
    ...profesional,
    horarios: horarios.filter((item) => Number(item.profesional_id) === Number(profesional.id)),
    bloqueos_especificos: bloqueos.filter((item) => Number(item.profesional_id) === Number(profesional.id)),
  }));
}

async function saveSchedule(db, profesionalId, body) {
  const diasLaborales = normalizeDays(body.dias_laborales);
  const horaEntrada = normalizeTime(body.hora_entrada, '08:00');
  const horaSalida = normalizeTime(body.hora_salida, '18:00');
  for (const day of allDays) {
    await query(
      db,
      "INSERT INTO horarios_profesionales (profesional_id, dia, hora_entrada, hora_salida, disponible) VALUES (?, ?, ?, ?, ?) ON CONFLICT (profesional_id, dia) DO UPDATE SET hora_entrada = EXCLUDED.hora_entrada, hora_salida = EXCLUDED.hora_salida, disponible = EXCLUDED.disponible",
      [profesionalId, day, horaEntrada, horaSalida, diasLaborales.includes(day)]
    );
  }
  if (Array.isArray(body.bloqueos_especificos)) {
    const blocks = parseBlocks(body.bloqueos_especificos);
    await query(db, 'DELETE FROM bloqueos_profesionales WHERE profesional_id = ?', [profesionalId]);
    for (const block of blocks) {
      await query(
        db,
        'INSERT INTO bloqueos_profesionales (profesional_id, fecha, hora_inicio, hora_fin, motivo) VALUES (?, ?, ?, ?, ?)',
        [profesionalId, block.fecha, block.hora_inicio, block.hora_fin, block.motivo]
      );
    }
  }
}

module.exports = (db) => {
  router.get('/', async (req, res) => {
    try {
      await ensureSchema(db);
      const rows = await query(db, `SELECT p.*, l.nombre as local_nombre, l.tipo as local_tipo
              FROM profesionales p
              LEFT JOIN locales l ON p.local_id = l.id
              ORDER BY p.nombre`);
      res.json(await hydrateProfessionals(db, rows));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/', async (req, res) => {
    try {
      await ensureSchema(db);
      const nombre = String(req.body.nombre || '').trim();
      const telefono = req.body.telefono || null;
      const email = req.body.email || null;
      const local_id = req.body.local_id || null;
      if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });

      const rows = await query(
        db,
        'INSERT INTO profesionales (nombre, telefono, email, local_id, activo) VALUES (?, ?, ?, ?, TRUE) RETURNING *',
        [nombre, telefono, email, local_id]
      );
      const profesional = Array.isArray(rows) ? rows[0] : rows;
      await saveSchedule(db, profesional.id, req.body);
      const hydrated = await hydrateProfessionals(db, [profesional]);
      res.status(201).json({ mensaje: 'Profesional agregada correctamente', data: hydrated[0] });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.put('/:id', async (req, res) => {
    try {
      await ensureSchema(db);
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Profesional invalida' });
      const nombre = String(req.body.nombre || '').trim();
      if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });
      const telefono = req.body.telefono || null;
      const email = req.body.email || null;
      const local_id = req.body.local_id || null;
      const activo = normalizeBool(req.body.activo, true);
      await query(db, 'UPDATE profesionales SET nombre=?, telefono=?, email=?, local_id=?, activo=? WHERE id=?', [nombre, telefono, email, local_id, activo, id]);
      await saveSchedule(db, id, req.body);
      const rows = await query(db, `SELECT p.*, l.nombre as local_nombre, l.tipo as local_tipo
              FROM profesionales p
              LEFT JOIN locales l ON p.local_id = l.id
              WHERE p.id = ?`, [id]);
      const hydrated = await hydrateProfessionals(db, rows);
      res.json({ mensaje: 'Profesional actualizada correctamente', data: hydrated[0] });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Profesional invalida' });

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
              ? 'Profesional desactivada; se conservo su historial de turnos'
              : 'Profesional eliminada correctamente',
            desactivada: hasHistory,
          });
        });
      });
    });
  });

  return router;
};
