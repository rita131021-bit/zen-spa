// routes/servicios.js
module.exports = function createServiciosRouter(db) {
  const express = require('express');
  const router = express.Router();

  // GET TODOS LOS SERVICIOS
  router.get('/', (req, res) => {
    const sql = 'SELECT * FROM servicios ORDER BY categoria, nombre';
    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results || []);
    });
  });

  // GET SERVICIOS ACTIVOS
  router.get('/activos/true', (req, res) => {
    const sql = 'SELECT * FROM servicios WHERE activo = TRUE ORDER BY categoria, nombre';
    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results || []);
    });
  });

  // GET SERVICIO POR ID
  router.get('/:id', (req, res) => {
    const sql = 'SELECT * FROM servicios WHERE id = ?';
    db.query(sql, [req.params.id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length === 0) return res.status(404).json({ error: 'Servicio no encontrado' });
      res.json(results[0]);
    });
  });

  // CREAR NUEVO SERVICIO
  router.post('/', (req, res) => {
    const { nombre, descripcion, precio_base, duracion_minutos, categoria } = req.body;
    
    if (!nombre || !precio_base) {
      return res.status(400).json({ error: 'Nombre y precio son obligatorios' });
    }

    const sql = `INSERT INTO servicios 
      (nombre, descripcion, precio_base, duracion_minutos, categoria) 
      VALUES (?, ?, ?, ?, ?)`;
    
    db.query(
      sql,
      [nombre, descripcion || null, precio_base, duracion_minutos || 60, categoria || null],
      (err, result) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Ya existe un servicio con ese nombre' });
          }
          return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ 
          mensaje: '✅ Servicio creado correctamente', 
          id: result.insertId 
        });
      }
    );
  });

  // ACTUALIZAR SERVICIO
  router.put('/:id', (req, res) => {
    const { nombre, descripcion, precio_base, duracion_minutos, categoria, activo } = req.body;
    
    const sqlGetPrecio = 'SELECT precio_base FROM servicios WHERE id = ?';
    db.query(sqlGetPrecio, [req.params.id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length === 0) return res.status(404).json({ error: 'Servicio no encontrado' });

      const precio_anterior = results[0].precio_base;

      const sql = `UPDATE servicios SET 
        nombre = ?, 
        descripcion = ?, 
        precio_base = ?, 
        duracion_minutos = ?, 
        categoria = ?, 
        activo = ?
        WHERE id = ?`;
      
      db.query(
        sql,
        [
          nombre, 
          descripcion || null, 
          precio_base, 
          duracion_minutos || 60, 
          categoria || null, 
          activo !== undefined ? activo : true,
          req.params.id
        ],
        (err) => {
          if (err) return res.status(500).json({ error: err.message });

          if (precio_anterior !== precio_base) {
            const sqlHistorial = `INSERT INTO historial_precios 
              (servicio_id, precio_anterior, precio_nuevo, cambio_por) 
              VALUES (?, ?, ?, ?)`;
            db.query(sqlHistorial, [req.params.id, precio_anterior, precio_base, 'admin']);
          }

          res.json({ mensaje: '✅ Servicio actualizado correctamente' });
        }
      );
    });
  });

  // ELIMINAR SERVICIO (marcar como inactivo)
  router.delete('/:id', (req, res) => {
    const sql = 'UPDATE servicios SET activo = FALSE WHERE id = ?';
    db.query(sql, [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: '✅ Servicio desactivado correctamente' });
    });
  });

  // REACTIVAR SERVICIO
  router.patch('/:id/reactivar', (req, res) => {
    const sql = 'UPDATE servicios SET activo = TRUE WHERE id = ?';
    db.query(sql, [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: '✅ Servicio reactivado correctamente' });
    });
  });

  return router;
};
