// routes/servicios.js
module.exports = function createServiciosRouter(db) {
  const express = require('express');
  const router = express.Router();

  // GET TODOS
  router.get('/', (req, res) => {
    db.query('SELECT * FROM servicios ORDER BY categoria, nombre', (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results || []);
    });
  });

  // GET ACTIVOS
  router.get('/activos/true', (req, res) => {
    db.query('SELECT * FROM servicios WHERE activo = TRUE ORDER BY categoria, nombre', (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results || []);
    });
  });

  // AUMENTO GENERAL DE PRECIOS — debe ir ANTES de /:id
  router.put('/precio/aumento', (req, res) => {
    const { porcentaje } = req.body;
    if (!porcentaje || porcentaje <= 0) {
      return res.status(400).json({ error: 'Porcentaje debe ser mayor a 0' });
    }
    const factor = 1 + Number(porcentaje) / 100;
    const sql = 'UPDATE servicios SET precio = ROUND(precio * ?, 0) WHERE activo = TRUE';
    db.query(sql, [factor], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: `✅ Aumento de ${porcentaje}% aplicado a ${result.affectedRows} servicios` });
    });
  });

  // GET POR ID
  router.get('/:id', (req, res) => {
    db.query('SELECT * FROM servicios WHERE id = ?', [req.params.id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!results.length) return res.status(404).json({ error: 'Servicio no encontrado' });
      res.json(results[0]);
    });
  });

  // CREAR
  router.post('/', (req, res) => {
    const { nombre, descripcion, precio, precio_base, duracion_minutos, categoria } = req.body;
    const precioFinal = precio || precio_base;
    if (!nombre || !precioFinal) {
      return res.status(400).json({ error: 'Nombre y precio son obligatorios' });
    }
    const sql = 'INSERT INTO servicios (nombre, descripcion, precio, duracion_minutos, categoria) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [nombre, descripcion || null, precioFinal, duracion_minutos || 60, categoria || null], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ya existe un servicio con ese nombre' });
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ mensaje: '✅ Servicio creado', id: result.insertId });
    });
  });

  // ACTUALIZAR
  router.put('/:id', (req, res) => {
    const { nombre, descripcion, precio, precio_base, duracion_minutos, categoria, activo } = req.body;
    const precioFinal = precio || precio_base;

    // Guardar historial si cambió el precio
    db.query('SELECT precio FROM servicios WHERE id = ?', [req.params.id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!results.length) return res.status(404).json({ error: 'No encontrado' });

      const precioAnterior = results[0].precio;
      const sql = 'UPDATE servicios SET nombre=?, descripcion=?, precio=?, duracion_minutos=?, categoria=?, activo=? WHERE id=?';

      db.query(sql, [
        nombre, descripcion || null, precioFinal,
        duracion_minutos || 60, categoria || null,
        activo !== undefined ? activo : true,
        req.params.id
      ], (err) => {
        if (err) return res.status(500).json({ error: err.message });

        if (precioAnterior !== precioFinal) {
          db.query(
            'INSERT INTO historial_precios (servicio_id, precio_anterior, precio_nuevo, cambio_por) VALUES (?, ?, ?, ?)',
            [req.params.id, precioAnterior, precioFinal, 'admin']
          );
        }
        res.json({ mensaje: '✅ Servicio actualizado' });
      });
    });
  });

  // DESACTIVAR
  router.delete('/:id', (req, res) => {
    db.query('UPDATE servicios SET activo = FALSE WHERE id = ?', [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: '✅ Servicio desactivado' });
    });
  });

  // REACTIVAR
  router.patch('/:id/reactivar', (req, res) => {
    db.query('UPDATE servicios SET activo = TRUE WHERE id = ?', [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: '✅ Servicio reactivado' });
    });
  });

  return router;
};
