const express = require('express');
const router = express.Router();
const { runRecordatoriosJob } = require('../services/recordatoriosJob');

function query(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

module.exports = (db) => {
  router.get('/resumen', async (req, res) => {
    try {
      const [hoy, pendientes, enviadosHoy] = await Promise.all([
        query(db, `SELECT COUNT(*) as total FROM turnos WHERE fecha = CURRENT_DATE`),
        query(db, `SELECT COUNT(*) as total FROM recordatorios WHERE estado = 'pendiente'`),
        query(
          db,
          `SELECT COUNT(*) as total FROM recordatorios
           WHERE estado = 'enviado' AND DATE(enviado_en) = CURRENT_DATE`
        ),
      ]);

      const pendientesConfirmacion = await query(
        db,
        `SELECT COUNT(*) as total FROM turnos
         WHERE fecha >= CURRENT_DATE AND estado = 'Pendiente'`
      );

      res.json({
        turnos_hoy: Number(hoy[0]?.total || 0),
        recordatorios_pendientes: Number(pendientes[0]?.total || 0),
        recordatorios_enviados_hoy: Number(enviadosHoy[0]?.total || 0),
        confirmaciones_pendientes: Number(pendientesConfirmacion[0]?.total || 0),
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/pendientes', async (req, res) => {
    try {
      const rows = await query(
        db,
        `SELECT r.*, t.fecha, t.hora, t.estado as turno_estado,
          c.nombre as cliente_nombre, c.whatsapp,
          m.nombre as mascota_nombre, s.nombre as servicio_nombre
         FROM recordatorios r
         INNER JOIN turnos t ON r.turno_id = t.id
         LEFT JOIN clientes c ON t.cliente_id = c.id
         LEFT JOIN mascotas m ON t.mascota_id = m.id
         LEFT JOIN servicios s ON t.servicio_id = s.id
         WHERE r.estado = 'pendiente'
         ORDER BY t.fecha ASC, t.hora ASC`
      );
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/proximos-turnos', async (req, res) => {
    try {
      const rows = await query(
        db,
        `SELECT t.*, c.nombre as cliente_nombre, c.whatsapp,
          m.nombre as mascota_nombre, s.nombre as servicio_nombre
         FROM turnos t
         LEFT JOIN clientes c ON t.cliente_id = c.id
         LEFT JOIN mascotas m ON t.mascota_id = m.id
         LEFT JOIN servicios s ON t.servicio_id = s.id
         WHERE t.fecha >= CURRENT_DATE AND t.estado <> 'Cancelado'
         ORDER BY t.fecha ASC, t.hora ASC
         LIMIT 20`
      );
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/:id/enviar', async (req, res) => {
    try {
      await query(
        db,
        `UPDATE recordatorios SET estado = 'enviado', enviado_en = CURRENT_TIMESTAMP WHERE id = ?`,
        [req.params.id]
      );
      const rows = await query(db, 'SELECT * FROM recordatorios WHERE id = ?', [req.params.id]);
      const item = rows[0];
      res.json({
        mensaje: 'Recordatorio marcado como enviado',
        whatsapp_url: item?.whatsapp_url || null,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/ejecutar', async (req, res) => {
    try {
      const result = await runRecordatoriosJob(db);
      res.json({ mensaje: 'Proceso de recordatorios ejecutado', ...result });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
