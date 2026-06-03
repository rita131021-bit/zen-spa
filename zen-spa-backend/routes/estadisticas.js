const express = require('express');
const router = express.Router();

module.exports = (db) => {

  // RESUMEN GENERAL DEL DASHBOARD
  router.get('/resumen', (req, res) => {
    const sql = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'Pendiente' THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN estado = 'Confirmado' THEN 1 ELSE 0 END) as confirmados,
        SUM(CASE WHEN estado = 'Completado' THEN 1 ELSE 0 END) as completados,
        SUM(CASE WHEN estado = 'Cancelado' THEN 1 ELSE 0 END) as cancelados
      FROM turnos
    `;
    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results[0]);
    });
  });

  // TOP 5 SERVICIOS MÁS SOLICITADOS
  router.get('/top-servicios', (req, res) => {
    const sql = `
      SELECT s.nombre, COUNT(t.id) as total
      FROM turnos t
      LEFT JOIN servicios s ON t.servicio_id = s.id
      GROUP BY s.nombre
      ORDER BY total DESC
      LIMIT 5
    `;
    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  });

  // TURNOS POR CATEGORÍA
  router.get('/por-categoria', (req, res) => {
    const sql = `
      SELECT s.categoria, COUNT(t.id) as total
      FROM turnos t
      LEFT JOIN servicios s ON t.servicio_id = s.id
      GROUP BY s.categoria
      ORDER BY total DESC
    `;
    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  });

  // PRÓXIMOS TURNOS
  router.get('/proximos', (req, res) => {
    const sql = `
      SELECT t.*, 
        c.nombre as cliente_nombre, c.whatsapp as cliente_whatsapp,
        m.nombre as mascota_nombre, m.especie,
        s.nombre as servicio_nombre,
        p.nombre as profesional_nombre
      FROM turnos t
      LEFT JOIN clientes c ON t.cliente_id = c.id
      LEFT JOIN mascotas m ON t.mascota_id = m.id
      LEFT JOIN servicios s ON t.servicio_id = s.id
      LEFT JOIN profesionales p ON t.profesional_id = p.id
      WHERE t.fecha >= CURDATE()
      ORDER BY t.fecha ASC, t.hora ASC
      LIMIT 10
    `;
    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  });

  // PRECIO PROMEDIO
  router.get('/precio-promedio', (req, res) => {
    const sql = 'SELECT AVG(precio) as promedio, AVG(duracion_minutos) as duracion FROM servicios WHERE activo = true';
    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results[0]);
    });
  });

  router.get('/servicios-resumen', (req, res) => {
    const sql = `
      SELECT
        COUNT(*) as activos,
        COUNT(DISTINCT categoria) as categorias
      FROM servicios
      WHERE activo = 1
    `;
    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results[0]);
    });
  });

  return router;
};