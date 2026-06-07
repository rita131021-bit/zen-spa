const express = require('express');
const router = express.Router();

module.exports = (db) => {

  // OBTENER TODAS LAS MASCOTAS
  router.get('/', (req, res) => {
    const sql = `
      SELECT m.*, c.nombre as dueño_nombre, c.whatsapp as dueño_whatsapp
      FROM mascotas m
      LEFT JOIN clientes c ON m.cliente_id = c.id
      ORDER BY m.nombre ASC
    `;
    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  });

  // OBTENER UNA MASCOTA CON SU HISTORIAL
  router.get('/:id', (req, res) => {
    const sql = `
      SELECT m.*, c.nombre as dueño_nombre, c.whatsapp as dueño_whatsapp,
        t.id as turno_id, t.fecha, t.hora, t.estado, t.pago,
        s.nombre as servicio_nombre, s.precio
      FROM mascotas m
      LEFT JOIN clientes c ON m.cliente_id = c.id
      LEFT JOIN turnos t ON t.mascota_id = m.id
      LEFT JOIN servicios s ON t.servicio_id = s.id
      WHERE m.id = ?
      ORDER BY t.fecha DESC
    `;
    db.query(sql, [req.params.id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  });

  // CREAR NUEVA MASCOTA
  router.post('/', (req, res) => {
    const { 
      cliente_id, nombre, especie, raza, peso, edad, sexo, notas,
      tipo_mascota, talla, alimento_tipo, alimento_especial,
      horario_preferido, camita, mantita
    } = req.body;
    const sql = `INSERT INTO mascotas 
      (cliente_id, nombre, especie, raza, peso, edad, sexo, notas, 
       tipo_mascota, talla, alimento_tipo, alimento_especial, 
       horario_preferido, camita, mantita) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.query(sql, [
      cliente_id, nombre, especie, raza, peso, edad, sexo, notas,
      tipo_mascota || null, talla || null, alimento_tipo || null, alimento_especial || false,
      horario_preferido || null, camita || false, mantita || false
    ], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: '✅ Mascota creada correctamente', id: result.insertId });
    });
  });

  // ACTUALIZAR MASCOTA
  router.put('/:id', (req, res) => {
    const { 
      nombre, especie, raza, peso, edad, sexo, notas,
      tipo_mascota, talla, alimento_tipo, alimento_especial,
      horario_preferido, camita, mantita
    } = req.body;
    const sql = `UPDATE mascotas SET 
      nombre=?, especie=?, raza=?, peso=?, edad=?, sexo=?, notas=?,
      tipo_mascota=?, talla=?, alimento_tipo=?, alimento_especial=?,
      horario_preferido=?, camita=?, mantita=?
      WHERE id=?`;
    db.query(sql, [
      nombre, especie, raza, peso, edad, sexo, notas,
      tipo_mascota || null, talla || null, alimento_tipo || null, alimento_especial || false,
      horario_preferido || null, camita || false, mantita || false,
      req.params.id
    ], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: '✅ Mascota actualizada correctamente' });
    });
  });

  // ELIMINAR MASCOTA
  router.delete('/:id', (req, res) => {
    db.query('DELETE FROM mascotas WHERE id = ?', [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: '✅ Mascota eliminada correctamente' });
    });
  });

  return router;
};