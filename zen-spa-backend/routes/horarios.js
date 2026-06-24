const express = require('express');
const router = express.Router();

const days = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
const defaultHours = ['08:00:00', '09:00:00', '10:00:00', '11:00:00', '14:00:00', '15:00:00', '16:00:00', '17:00:00'];

function query(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

function normalizeTime(value) {
  if (!value) return '';
  return String(value).slice(0, 5);
}

async function ensureSeed(db) {
  const rows = await query(db, 'SELECT COUNT(*) as total FROM horarios');
  if (Number(rows[0]?.total) > 0) return;

  const values = [];
  for (const dia of days) {
    for (const hora of defaultHours) {
      values.push([dia, hora, true]);
    }
  }

  await query(
    db,
    'INSERT INTO horarios (dia, hora, disponible) VALUES ?',
    [values]
  );
}

module.exports = (db) => {
  router.get('/', async (req, res) => {
    try {
      await ensureSeed(db);
      const results = await query(db, 'SELECT * FROM horarios ORDER BY array_position(ARRAY[?, ?, ?, ?, ?, ?, ?]::text[], dia), hora', days);
      res.json(results);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.put('/toggle', async (req, res) => {
    try {
      const { dia, hora, disponible } = req.body;
      if (!dia || !hora) {
        return res.status(400).json({ error: 'Dia y hora son obligatorios' });
      }

      const horaNorm = normalizeTime(hora);
      const existing = await query(
        db,
        "SELECT * FROM horarios WHERE dia = ? AND to_char(hora, 'HH24:MI') = ? LIMIT 1",
        [dia, horaNorm]
      );

      const flag = disponible === undefined ? null : Boolean(disponible);

      if (existing.length > 0) {
        const next = flag === null ? !existing[0].disponible : flag;
        await query(db, 'UPDATE horarios SET disponible = ? WHERE id = ?', [next, existing[0].id]);
        return res.json({ mensaje: 'Horario actualizado', disponible: Boolean(next) });
      }

      const next = flag === null ? true : flag;
      await query(db, 'INSERT INTO horarios (dia, hora, disponible) VALUES (?, ?, ?)', [dia, `${horaNorm}:00`, next]);
      res.json({ mensaje: 'Horario creado', disponible: Boolean(next) });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
