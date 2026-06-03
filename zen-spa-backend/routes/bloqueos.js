const express = require('express');
const router = express.Router();

module.exports = (db) => {

  // OBTENER TODOS LOS BLOQUEOS
  router.get('/', (req, res) => {
    db.query('SELECT * FROM bloqueos ORDER BY fecha ASC', (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  });

  // CREAR BLOQUEO (o rango de vacaciones con fecha_fin)
  router.post('/', (req, res) => {
    const { fecha, fecha_fin, motivo, tipo } = req.body;
    if (!fecha) return res.status(400).json({ error: 'La fecha es obligatoria' });

    const label =
      tipo === 'vacaciones'
        ? `Vacaciones${motivo ? `: ${motivo}` : ''}`
        : motivo || 'Bloqueo';

  function insertOne(targetDate, callback) {
      db.query(
        'INSERT INTO bloqueos (fecha, motivo) VALUES (?, ?)',
        [targetDate, label],
        callback
      );
    }

    if (fecha_fin && fecha_fin !== fecha) {
      const start = new Date(`${fecha}T12:00:00`);
      const end = new Date(`${fecha_fin}T12:00:00`);
      if (end < start) {
        return res.status(400).json({ error: 'La fecha fin debe ser posterior a la fecha inicio' });
      }

      const dates = [];
      const cursor = new Date(start);
      while (cursor <= end) {
        dates.push(cursor.toISOString().slice(0, 10));
        cursor.setDate(cursor.getDate() + 1);
      }

      let index = 0;
      const ids = [];
      const runNext = () => {
        if (index >= dates.length) {
          return res.json({
            mensaje: `✅ ${dates.length} día(s) de vacaciones registrados`,
            ids,
          });
        }
        insertOne(dates[index], (err, result) => {
          if (err) return res.status(500).json({ error: err.message });
          ids.push(result.insertId);
          index += 1;
          runNext();
        });
      };
      return runNext();
    }

    insertOne(fecha, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: '✅ Bloqueo creado correctamente', id: result.insertId });
    });
  });

  // ELIMINAR BLOQUEO
  router.delete('/:id', (req, res) => {
    db.query('DELETE FROM bloqueos WHERE id = ?', [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: '✅ Bloqueo eliminado correctamente' });
    });
  });

  // VERIFICAR SI UNA FECHA ESTÁ BLOQUEADA
  router.get('/verificar/:fecha', (req, res) => {
    db.query('SELECT * FROM bloqueos WHERE fecha = ?', [req.params.fecha], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ bloqueada: results.length > 0, detalle: results[0] || null });
    });
  });

  return router;
};