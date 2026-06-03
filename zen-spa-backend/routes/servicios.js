const express = require('express');
const router = express.Router();

module.exports = (db) => {

  router.get('/', (req, res) => {
    db.query('SELECT * FROM servicios ORDER BY categoria, nombre', (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  });

  router.post('/', (req, res) => {
    const { nombre, categoria, precio, duracion_minutos, descripcion } = req.body;
    const sql = 'INSERT INTO servicios (nombre, categoria, precio, duracion_minutos, descripcion) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [nombre, categoria, precio, duracion_minutos, descripcion], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: 'Servicio creado correctamente', id: result.insertId });
    });
  });

  router.put('/precio/aumento', (req, res) => {
    const { porcentaje } = req.body;
    const sql = 'UPDATE servicios SET precio = precio * (1 + ? / 100) WHERE activo = true';
    db.query(sql, [porcentaje], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: 'Precios aumentados correctamente' });
    });
  });

  router.put('/:id', (req, res) => {
    const { nombre, categoria, precio, duracion_minutos, descripcion, activo } = req.body;
    const sql = 'UPDATE servicios SET nombre=?, categoria=?, precio=?, duracion_minutos=?, descripcion=?, activo=? WHERE id=?';
    db.query(sql, [nombre, categoria, precio, duracion_minutos, descripcion, activo, req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: 'Servicio actualizado correctamente' });
    });
  });

  router.delete('/:id', (req, res) => {
    db.query('DELETE FROM servicios WHERE id = ?', [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: 'Servicio eliminado correctamente' });
    });
  });

  return router;
};