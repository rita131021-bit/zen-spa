const express = require('express');
const router = express.Router();

module.exports = (db) => {

  // OBTENER TODOS LOS CLIENTES
  router.get('/', (req, res) => {
    db.query('SELECT * FROM clientes ORDER BY nombre ASC', (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  });

  // OBTENER UN CLIENTE CON SUS MASCOTAS
  router.get('/:id', (req, res) => {
    const sql = `
      SELECT c.*, m.id as mascota_id, m.nombre as mascota_nombre, 
        m.especie, m.raza, m.peso, m.edad, m.sexo
      FROM clientes c
      LEFT JOIN mascotas m ON m.cliente_id = c.id
      WHERE c.id = ?
    `;
    db.query(sql, [req.params.id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  });

  // CREAR NUEVO CLIENTE
  router.post('/', (req, res) => {
    const { nombre, telefono, whatsapp, email, direccion, notas } = req.body;
    const sql = 'INSERT INTO clientes (nombre, telefono, whatsapp, email, direccion, notas) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql, [nombre, telefono, whatsapp, email, direccion, notas], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: '✅ Cliente creado correctamente', id: result.insertId });
    });
  });

  // ACTUALIZAR CLIENTE
  router.put('/:id', (req, res) => {
    const { nombre, telefono, whatsapp, email, direccion, notas } = req.body;
    const sql = 'UPDATE clientes SET nombre=?, telefono=?, whatsapp=?, email=?, direccion=?, notas=? WHERE id=?';
    db.query(sql, [nombre, telefono, whatsapp, email, direccion, notas, req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: '✅ Cliente actualizado correctamente' });
    });
  });

  // ELIMINAR CLIENTE
  router.delete('/:id', (req, res) => {
    db.query('DELETE FROM clientes WHERE id = ?', [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: '✅ Cliente eliminado correctamente' });
    });
  });

  return router;
};