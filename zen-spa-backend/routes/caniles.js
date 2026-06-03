const express = require('express');
const router = express.Router();

module.exports = (db) => {
  router.get('/', (req, res) => {
    db.query('SELECT * FROM caniles ORDER BY nombre', (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  });

  router.post('/', (req, res) => {
    const { nombre, descripcion, activo = true } = req.body;
    db.query(
      'INSERT INTO caniles (nombre, descripcion, activo) VALUES (?, ?, ?)',
      [nombre, descripcion, activo],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ mensaje: 'Canil creado correctamente', id: result.insertId });
      }
    );
  });

  router.put('/:id', (req, res) => {
    const { nombre, descripcion, activo } = req.body;
    db.query(
      'UPDATE caniles SET nombre=?, descripcion=?, activo=? WHERE id=?',
      [nombre, descripcion, activo, req.params.id],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ mensaje: 'Canil actualizado correctamente' });
      }
    );
  });

  return router;
};
