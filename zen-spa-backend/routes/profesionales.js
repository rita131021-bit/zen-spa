const express = require('express');
const router = express.Router();

module.exports = (db) => {

  // OBTENER TODOS LOS PROFESIONALES
  router.get('/', (req, res) => {
    db.query('SELECT * FROM profesionales ORDER BY nombre', (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  });

  // CREAR PROFESIONAL
  router.post('/', (req, res) => {
    const { nombre, telefono, email } = req.body;
    const sql = 'INSERT INTO profesionales (nombre, telefono, email) VALUES (?, ?, ?)';
    db.query(sql, [nombre, telefono, email], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: '✅ Profesional creado correctamente', id: result.insertId });
    });
  });

  // ACTUALIZAR PROFESIONAL
  router.put('/:id', (req, res) => {
    const { nombre, telefono, email, activo } = req.body;
    const sql = 'UPDATE profesionales SET nombre=?, telefono=?, email=?, activo=? WHERE id=?';
    db.query(sql, [nombre, telefono, email, activo, req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: '✅ Profesional actualizado correctamente' });
    });
  });

  // ELIMINAR PROFESIONAL
  router.delete('/:id', (req, res) => {
    db.query('DELETE FROM profesionales WHERE id = ?', [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: '✅ Profesional eliminado correctamente' });
    });
  });

  return router;
};