// routes/bloqueos.js
module.exports = function createBloqueoRouter(db) {
  const express = require('express');
  const router = express.Router();

  router.get('/', (req, res) => {
    db.query('SELECT * FROM bloqueos_calendario ORDER BY fecha DESC', (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results || []);
    });
  });

  router.get('/periodo', (req, res) => {
    const { inicio, fin } = req.query;
    if (!inicio || !fin) return res.status(400).json({ error: 'inicio y fin son obligatorios' });
    db.query('SELECT * FROM bloqueos_calendario WHERE fecha >= ? AND fecha <= ? ORDER BY fecha', [inicio, fin], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results || []);
    });
  });

  router.get('/disponible/:fecha', (req, res) => {
    db.query('SELECT COUNT(*) as total FROM bloqueos_calendario WHERE fecha = ?', [req.params.fecha], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ fecha: req.params.fecha, disponible: results[0].total === 0 });
    });
  });

  // CREAR — soporta fecha_fin para rangos (vacaciones)
  router.post('/', (req, res) => {
    const { fecha, fecha_fin, motivo, tipo, creado_por } = req.body;
    if (!fecha) return res.status(400).json({ error: 'Fecha es obligatoria' });

    const motivoFinal = motivo || (tipo === 'vacaciones' ? 'Vacaciones' : 'Bloqueado');

    // Si hay fecha_fin, insertar rango
    if (fecha_fin && fecha_fin >= fecha) {
      const fechas = [];
      const current = new Date(fecha + 'T12:00:00');
      const final  = new Date(fecha_fin + 'T12:00:00');
      while (current <= final) {
        fechas.push([current.toISOString().split('T')[0], motivoFinal, false, creado_por || 'admin']);
        current.setDate(current.getDate() + 1);
      }
      db.query(
        'INSERT INTO bloqueos_calendario (fecha, motivo, disponible, creado_por) VALUES ? ON CONFLICT (fecha) DO NOTHING',
        [fechas],
        (err) => {
          if (err) return res.status(500).json({ error: err.message });
          res.status(201).json({ mensaje: `✅ ${fechas.length} fecha(s) bloqueada(s)`, cantidad: fechas.length });
        }
      );
    } else {
      db.query(
        'INSERT INTO bloqueos_calendario (fecha, motivo, disponible, creado_por) VALUES (?, ?, FALSE, ?) ON CONFLICT (fecha) DO NOTHING',
        [fecha, motivoFinal, creado_por || 'admin'],
        (err, result) => {
          if (err) return res.status(500).json({ error: err.message });
          res.status(201).json({ mensaje: '✅ Fecha bloqueada correctamente', id: result.insertId });
        }
      );
    }
  });

  router.put('/:id', (req, res) => {
    const { motivo } = req.body;
    db.query('UPDATE bloqueos_calendario SET motivo = ? WHERE id = ?', [motivo || 'Bloqueado', req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: '✅ Bloqueo actualizado' });
    });
  });

  router.delete('/:id', (req, res) => {
    db.query('DELETE FROM bloqueos_calendario WHERE id = ?', [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: '✅ Bloqueo eliminado' });
    });
  });

  return router;
};
