// routes/finanzas.js
module.exports = function createFinanzasRouter(db) {
  const express = require('express');
  const router = express.Router();

  // RESUMEN FINANCIERO DE HOY
  router.get('/resumen/hoy', (req, res) => {
    const hoy = new Date().toISOString().split('T')[0];
    
    const sql = `
      SELECT 
        COUNT(t.id) as cantidad_turnos,
        COALESCE(SUM(t.precio_final), 0) as ingresos_totales,
        COALESCE(SUM(t.descuento_porcentaje * t.precio_unitario / 100), 0) as descuentos_totales,
        COALESCE(AVG(t.precio_final), 0) as ticket_promedio
      FROM turnos t
      WHERE DATE(t.fecha) = ? AND t.estado IN ('Confirmado', 'Completado')
    `;

    db.query(sql, [hoy], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results[0] || { cantidad_turnos: 0, ingresos_totales: 0, descuentos_totales: 0, ticket_promedio: 0 });
    });
  });

  // RESUMEN FINANCIERO DE PERÍODO
  router.get('/resumen/periodo', (req, res) => {
    const { inicio, fin } = req.query;

    if (!inicio || !fin) {
      return res.status(400).json({ error: 'Parámetros inicio y fin son obligatorios' });
    }

    const sql = `
      SELECT 
        COUNT(t.id) as cantidad_turnos,
        COUNT(DISTINCT t.cliente_id) as cantidad_clientes,
        COALESCE(SUM(t.precio_final), 0) as ingresos_totales,
        COALESCE(SUM(t.descuento_porcentaje * t.precio_unitario / 100), 0) as descuentos_totales,
        COALESCE(SUM(t.precio_final) + SUM(t.descuento_porcentaje * t.precio_unitario / 100), 0) as ingresos_sin_descuentos,
        COALESCE(AVG(t.precio_final), 0) as ticket_promedio,
        COALESCE(MIN(t.precio_final), 0) as venta_minima,
        COALESCE(MAX(t.precio_final), 0) as venta_maxima
      FROM turnos t
      WHERE DATE(t.fecha) >= ? AND DATE(t.fecha) <= ? AND t.estado IN ('Confirmado', 'Completado')
    `;

    db.query(sql, [inicio, fin], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results[0] || {});
    });
  });

  // INGRESOS POR SERVICIO
  router.get('/por-servicio', (req, res) => {
    const { inicio, fin } = req.query;

    let sql = `
      SELECT 
        s.id,
        s.nombre,
        s.categoria,
        COUNT(t.id) as cantidad_turnos,
        COALESCE(SUM(t.precio_final), 0) as ingresos_totales,
        COALESCE(AVG(t.precio_final), 0) as precio_promedio,
        COALESCE(SUM(t.descuento_porcentaje * t.precio_unitario / 100), 0) as descuentos_totales
      FROM servicios s
      LEFT JOIN turnos t ON s.id = t.servicio_id AND t.estado IN ('Confirmado', 'Completado')
    `;

    let params = [];

    if (inicio && fin) {
      sql += ` WHERE DATE(t.fecha) >= ? AND DATE(t.fecha) <= ?`;
      params = [inicio, fin];
    }

    sql += ` GROUP BY s.id, s.nombre, s.categoria ORDER BY ingresos_totales DESC`;

    db.query(sql, params, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results || []);
    });
  });

  // INGRESOS DIARIOS (últimos 30 días)
  router.get('/diarios/30', (req, res) => {
    const sql = `
      SELECT 
        DATE(t.fecha) as fecha,
        COUNT(t.id) as cantidad_turnos,
        COALESCE(SUM(t.precio_final), 0) as ingresos_totales,
        COALESCE(SUM(t.descuento_porcentaje * t.precio_unitario / 100), 0) as descuentos_totales,
        COALESCE(SUM(t.precio_final) + SUM(t.descuento_porcentaje * t.precio_unitario / 100), 0) as ingresos_brutos
      FROM turnos t
      WHERE t.estado IN ('Confirmado', 'Completado')
      AND DATE(t.fecha) >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(t.fecha)
      ORDER BY fecha DESC
    `;

    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results || []);
    });
  });

  // TOP 10 CLIENTES POR GASTO
  router.get('/top-clientes', (req, res) => {
    const sql = `
      SELECT 
        c.id,
        c.nombre,
        COUNT(t.id) as cantidad_turnos,
        COALESCE(SUM(t.precio_final), 0) as gasto_total,
        COALESCE(AVG(t.precio_final), 0) as ticket_promedio,
        MAX(t.fecha) as ultimo_turno
      FROM clientes c
      LEFT JOIN turnos t ON c.id = t.cliente_id AND t.estado IN ('Confirmado', 'Completado')
      GROUP BY c.id, c.nombre
      ORDER BY gasto_total DESC
      LIMIT 10
    `;

    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results || []);
    });
  });

  // ANÁLISIS DE DESCUENTOS
  router.get('/analisis-descuentos', (req, res) => {
    const { inicio, fin } = req.query;

    let sql = `
      SELECT 
        COALESCE(SUM(t.descuento_porcentaje * t.precio_unitario / 100), 0) as descuentos_totales,
        COUNT(DISTINCT t.cliente_id) as clientes_con_descuento,
        COUNT(t.id) as turnos_con_descuento,
        COALESCE(AVG(t.descuento_porcentaje), 0) as porcentaje_promedio
      FROM turnos t
      WHERE t.descuento_porcentaje > 0 AND t.estado IN ('Confirmado', 'Completado')
    `;

    if (inicio && fin) {
      sql += ` AND DATE(t.fecha) >= ? AND DATE(t.fecha) <= ?`;
      db.query(sql, [inicio, fin], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results[0] || {});
      });
    } else {
      db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results[0] || {});
      });
    }
  });

  // GENERAR REPORTE MENSUAL
  router.post('/reporte/mensual', (req, res) => {
    const { mes, año } = req.body;

    if (!mes || !año) {
      return res.status(400).json({ error: 'Mes y año son obligatorios' });
    }

    const inicio = `${año}-${String(mes).padStart(2, '0')}-01`;
    const fin = new Date(año, mes, 0).toISOString().split('T')[0];

    const sql = `
      SELECT 
        ? as periodo_inicio,
        ? as periodo_fin,
        COUNT(t.id) as cantidad_turnos,
        COUNT(DISTINCT t.cliente_id) as cantidad_clientes,
        COALESCE(SUM(t.precio_final), 0) as ingresos_totales,
        COALESCE(SUM(t.descuento_porcentaje * t.precio_unitario / 100), 0) as descuentos_aplicados,
        COALESCE(SUM(t.precio_final) + SUM(t.descuento_porcentaje * t.precio_unitario / 100), 0) as ingresos_brutos,
        COALESCE(AVG(t.precio_final), 0) as promedio_ticket
      FROM turnos t
      WHERE DATE(t.fecha) >= ? AND DATE(t.fecha) <= ? AND t.estado IN ('Confirmado', 'Completado')
    `;

    db.query(sql, [inicio, fin, inicio, fin], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      
      if (results[0]) {
        results[0].ganancias = results[0].ingresos_totales;
        results[0].ganancia_sin_descuentos = results[0].ingresos_brutos;
      }

      res.json(results[0] || {});
    });
  });

  // EXPORTAR PARA PDF
  router.get('/exportar/:formato', (req, res) => {
    const { formato } = req.params;
    const { inicio, fin } = req.query;

    if (!['pdf', 'excel', 'json'].includes(formato)) {
      return res.status(400).json({ error: 'Formato inválido (pdf, excel, json)' });
    }

    const sql = `
      SELECT 
        t.fecha,
        c.nombre as cliente,
        s.nombre as servicio,
        t.precio_unitario,
        t.descuento_porcentaje,
        t.precio_final,
        t.estado
      FROM turnos t
      JOIN clientes c ON t.cliente_id = c.id
      JOIN servicios s ON t.servicio_id = s.id
      WHERE t.estado IN ('Confirmado', 'Completado')
    `;

    let params = [];

    if (inicio && fin) {
      sql += ` AND DATE(t.fecha) >= ? AND DATE(t.fecha) <= ?`;
      params = [inicio, fin];
    }

    sql += ` ORDER BY t.fecha DESC`;

    db.query(sql, params, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });

      res.json({
        formato,
        data: results || [],
        periodo_inicio: inicio,
        periodo_fin: fin,
        total_registros: results ? results.length : 0
      });
    });
  });

  return router;
};
