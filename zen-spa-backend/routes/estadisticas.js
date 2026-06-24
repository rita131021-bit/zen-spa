const express = require('express');
const router = express.Router();

module.exports = (db) => {

  // RESUMEN GENERAL
  router.get('/resumen', (req, res) => {
    const sql = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'Pendiente'  THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN estado = 'Confirmado' THEN 1 ELSE 0 END) as confirmados,
        SUM(CASE WHEN estado = 'Completado' THEN 1 ELSE 0 END) as completados,
        SUM(CASE WHEN estado = 'Cancelado'  THEN 1 ELSE 0 END) as cancelados
      FROM turnos
    `;
    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results[0]);
    });
  });

  // TOP 5 SERVICIOS — usa nombre del servicio o fallback al texto guardado
  router.get('/top-servicios', (req, res) => {
    const sql = `
      SELECT 
        COALESCE(s.nombre, 'Sin servicio asignado') as nombre,
        COUNT(t.id) as total
      FROM turnos t
      LEFT JOIN servicios s ON t.servicio_id = s.id
      GROUP BY COALESCE(s.nombre, 'Sin servicio asignado')
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
      SELECT 
        COALESCE(s.categoria, 'Sin categoria') as categoria,
        COUNT(t.id) as total
      FROM turnos t
      LEFT JOIN servicios s ON t.servicio_id = s.id
      GROUP BY COALESCE(s.categoria, 'Sin categoria')
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
        c.nombre  as cliente_nombre,
        c.whatsapp as cliente_whatsapp,
        m.nombre  as mascota_nombre,
        m.especie,
        COALESCE(s.nombre, 'Sin servicio') as servicio_nombre,
        p.nombre  as profesional_nombre
      FROM turnos t
      LEFT JOIN clientes     c ON t.cliente_id     = c.id
      LEFT JOIN mascotas     m ON t.mascota_id     = m.id
      LEFT JOIN servicios    s ON t.servicio_id    = s.id
      LEFT JOIN profesionales p ON t.profesional_id = p.id
      WHERE t.fecha >= CURRENT_DATE
        AND t.estado NOT IN ('Cancelado')
      ORDER BY t.fecha ASC, t.hora ASC
      LIMIT 10
    `;
    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  });

  // PRECIO PROMEDIO DE SERVICIOS ACTIVOS
  router.get('/precio-promedio', (req, res) => {
    const sql = `
      SELECT 
        COALESCE(AVG(precio), 0)            as promedio,
        COALESCE(AVG(duracion_minutos), 60) as duracion
      FROM servicios
      WHERE activo = TRUE
    `;
    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results[0]);
    });
  });

  // RESUMEN DE SERVICIOS
  router.get('/servicios-resumen', (req, res) => {
    const sql = `
      SELECT
        COUNT(*)                   as activos,
        COUNT(DISTINCT categoria)  as categorias
      FROM servicios
      WHERE activo = TRUE
    `;
    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results[0]);
    });
  });

  // FICHA DE MASCOTA (última visitante)
  router.get('/ficha-mascota', (req, res) => {
    const sql = `
      SELECT 
        m.id, m.nombre, m.especie, m.raza, m.peso, m.sexo,
        m.creado_en as fecha_nacimiento,
        c.nombre as dueño_nombre,
        p_next.fecha as proximo_turno, p_next.hora as proximo_hora,
        p_last.servicio_nombre as ultimo_servicio,
        'Activa' as estado
      FROM mascotas m
      LEFT JOIN clientes c ON m.cliente_id = c.id
      LEFT JOIN (
        SELECT mascota_id, fecha, hora
        FROM turnos
        WHERE fecha >= CURRENT_DATE AND estado != 'Cancelado'
        ORDER BY fecha ASC, hora ASC
        LIMIT 1
      ) p_next ON m.id = p_next.mascota_id
      LEFT JOIN (
        SELECT mascota_id, COALESCE(s.nombre,'Sin servicio') as servicio_nombre
        FROM turnos t
        LEFT JOIN servicios s ON t.servicio_id = s.id
        WHERE t.fecha < CURRENT_DATE
        ORDER BY t.fecha DESC
        LIMIT 1
      ) p_last ON m.id = p_last.mascota_id
      ORDER BY m.id DESC
      LIMIT 1
    `;
    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results[0] || null);
    });
  });

  return router;
};
