// routes/descuentos.js
module.exports = function createDescuentosRouter(db) {
  const express = require('express');
  const router = express.Router();

  // GET TODOS LOS DESCUENTOS
  router.get('/', (req, res) => {
    const sql = 'SELECT * FROM descuentos_fidelidad ORDER BY porcentaje DESC';
    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results || []);
    });
  });

  // GET DESCUENTOS ACTIVOS
  router.get('/activos/true', (req, res) => {
    const sql = 'SELECT * FROM descuentos_fidelidad WHERE activo = TRUE ORDER BY porcentaje DESC';
    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results || []);
    });
  });

  // CALCULAR DESCUENTO PARA CLIENTE
  router.post('/cliente/:cliente_id', (req, res) => {
    const cliente_id = req.params.cliente_id;
    
    const sql = `
      SELECT 
        c.id,
        c.nombre,
        COUNT(t.id) as cantidad_turnos,
        (EXTRACT(YEAR FROM AGE(CURRENT_DATE, MIN(t.fecha))) * 12
          + EXTRACT(MONTH FROM AGE(CURRENT_DATE, MIN(t.fecha))))::int as meses_cliente
      FROM clientes c
      LEFT JOIN turnos t ON c.id = t.cliente_id AND t.estado IN ('Confirmado', 'Completado')
      WHERE c.id = ?
      GROUP BY c.id, c.nombre
    `;
    
    db.query(sql, [cliente_id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length === 0) return res.status(404).json({ error: 'Cliente no encontrado' });

      const cliente = results[0];
      const cantidad_turnos = cliente.cantidad_turnos || 0;
      const meses_cliente = cliente.meses_cliente || 0;

      const sqlDesc = `
        SELECT * FROM descuentos_fidelidad
        WHERE activo = TRUE
        AND (
          (turnos_requeridos > 0 AND turnos_requeridos <= ?)
          OR (meses_requeridos > 0 AND meses_requeridos <= ?)
        )
        ORDER BY porcentaje DESC
        LIMIT 1
      `;

      db.query(sqlDesc, [cantidad_turnos, meses_cliente], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const descuento = results.length > 0 ? results[0] : null;
        res.json({
          cliente: cliente,
          descuento_aplicable: descuento,
          porcentaje: descuento ? descuento.porcentaje : 0
        });
      });
    });
  });

  // CREAR DESCUENTO
  router.post('/', (req, res) => {
    const { nombre, porcentaje, turnos_requeridos, meses_requeridos, descripcion } = req.body;
    
    if (!nombre || !porcentaje) {
      return res.status(400).json({ error: 'Nombre y porcentaje son obligatorios' });
    }

    const sql = `INSERT INTO descuentos_fidelidad 
      (nombre, porcentaje, turnos_requeridos, meses_requeridos, descripcion) 
      VALUES (?, ?, ?, ?, ?)`;
    
    db.query(
      sql,
      [nombre, porcentaje, turnos_requeridos || 0, meses_requeridos || 0, descripcion || null],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ 
          mensaje: '✅ Descuento creado correctamente', 
          id: result.insertId 
        });
      }
    );
  });

  // ACTUALIZAR DESCUENTO
  router.put('/:id', (req, res) => {
    const { nombre, porcentaje, turnos_requeridos, meses_requeridos, descripcion, activo } = req.body;
    
    const sql = `UPDATE descuentos_fidelidad SET 
      nombre = ?, 
      porcentaje = ?, 
      turnos_requeridos = ?, 
      meses_requeridos = ?, 
      descripcion = ?,
      activo = ?
      WHERE id = ?`;
    
    db.query(
      sql,
      [
        nombre, 
        porcentaje, 
        turnos_requeridos || 0, 
        meses_requeridos || 0, 
        descripcion || null,
        activo !== undefined ? activo : true,
        req.params.id
      ],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ mensaje: '✅ Descuento actualizado correctamente' });
      }
    );
  });

  // ELIMINAR DESCUENTO
  router.delete('/:id', (req, res) => {
    const sql = 'UPDATE descuentos_fidelidad SET activo = FALSE WHERE id = ?';
    db.query(sql, [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: '✅ Descuento desactivado correctamente' });
    });
  });

  return router;
};
