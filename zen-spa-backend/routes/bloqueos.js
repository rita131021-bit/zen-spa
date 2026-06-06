// routes/bloqueos.js
module.exports = function createBloqueoRouter(db) {
  const express = require('express');
  const router = express.Router();

  // GET TODOS LOS BLOQUEOS
  router.get('/', (req, res) => {
    const sql = 'SELECT * FROM bloqueos_calendario ORDER BY fecha DESC';
    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  });

  // GET BLOQUEOS DE UN PERÍODO
  router.get('/periodo', (req, res) => {
    const { inicio, fin } = req.query;

    if (!inicio || !fin) {
      return res.status(400).json({ error: 'Parámetros inicio y fin son obligatorios' });
    }

    const sql = 'SELECT * FROM bloqueos_calendario WHERE fecha >= ? AND fecha <= ? ORDER BY fecha';
    db.query(sql, [inicio, fin], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  });

  // GET BLOQUEOS DEL MES ACTUAL
  router.get('/mes/actual', (req, res) => {
    const sql = `
      SELECT * FROM bloqueos_calendario 
      WHERE YEAR(fecha) = YEAR(CURDATE()) 
      AND MONTH(fecha) = MONTH(CURDATE())
      ORDER BY fecha
    `;
    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  });

  // CREAR BLOQUEO
  router.post('/', (req, res) => {
    const { fecha, motivo, disponible, creado_por } = req.body;

    if (!fecha) {
      return res.status(400).json({ error: 'Fecha es obligatoria' });
    }

    const sql = `INSERT INTO bloqueos_calendario 
      (fecha, motivo, disponible, creado_por) 
      VALUES (?, ?, ?, ?)`;

    db.query(sql, [fecha, motivo || 'Bloqueado', disponible || false, creado_por || 'admin'], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ error: 'Esta fecha ya está bloqueada' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ 
        mensaje: '✅ Fecha bloqueada correctamente', 
        id: result.insertId 
      });
    });
  });

  // ACTUALIZAR BLOQUEO
  router.put('/:id', (req, res) => {
    const { motivo, disponible } = req.body;

    const sql = 'UPDATE bloqueos_calendario SET motivo = ?, disponible = ? WHERE id = ?';
    db.query(sql, [motivo || 'Bloqueado', disponible || false, req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: '✅ Bloqueo actualizado correctamente' });
    });
  });

  // ELIMINAR BLOQUEO
  router.delete('/:id', (req, res) => {
    const sql = 'DELETE FROM bloqueos_calendario WHERE id = ?';
    db.query(sql, [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: '✅ Bloqueo eliminado correctamente' });
    });
  });

  // BLOQUEAR MÚLTIPLES FECHAS (rango)
  router.post('/rango', (req, res) => {
    const { inicio, fin, motivo, creado_por } = req.body;

    if (!inicio || !fin) {
      return res.status(400).json({ error: 'Inicio y fin son obligatorios' });
    }

    // Generar array de fechas
    const fechas = [];
    const current = new Date(inicio);
    const final = new Date(fin);

    while (current <= final) {
      const fecha = current.toISOString().split('T')[0];
      fechas.push([fecha, motivo || 'Bloqueado', false, creado_por || 'admin']);
      current.setDate(current.getDate() + 1);
    }

    const sql = 'INSERT INTO bloqueos_calendario (fecha, motivo, disponible, creado_por) VALUES ?';
    
    db.query(sql, [fechas], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ 
        mensaje: `✅ ${fechas.length} fechas bloqueadas correctamente`,
        cantidad: fechas.length
      });
    });
  });

  // VERIFICAR SI UNA FECHA ESTÁ DISPONIBLE
  router.get('/disponible/:fecha', (req, res) => {
    const { fecha } = req.params;

    const sql = `
      SELECT 
        CASE 
          WHEN (SELECT COUNT(*) FROM bloqueos_calendario WHERE fecha = ? AND disponible = FALSE) > 0 
          THEN 0
          ELSE 1
        END as disponible
    `;

    db.query(sql, [fecha], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        fecha,
        disponible: results[0].disponible === 1
      });
    });
  });

  return router;
};
