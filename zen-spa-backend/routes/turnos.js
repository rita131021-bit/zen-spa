const express = require('express');
const router = express.Router();
const { buildConfirmacionTurno, buildWhatsAppUrl } = require('../utils/whatsapp');

function query(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

function normalizeTime(value) {
  if (!value) return '';
  return String(value).slice(0, 5);
}

module.exports = (db) => {
  router.get('/', (req, res) => {
    const sql = `
      SELECT t.*,
        c.nombre as cliente_nombre,
        c.whatsapp as cliente_whatsapp,
        m.nombre as mascota_nombre,
        m.especie as mascota_especie,
        s.nombre as servicio_nombre,
        s.precio as servicio_precio,
        p.nombre as profesional_nombre,
        ca.nombre as canil_nombre
      FROM turnos t
      LEFT JOIN clientes c ON t.cliente_id = c.id
      LEFT JOIN mascotas m ON t.mascota_id = m.id
      LEFT JOIN servicios s ON t.servicio_id = s.id
      LEFT JOIN profesionales p ON t.profesional_id = p.id
      LEFT JOIN caniles ca ON t.canil_id = ca.id
      ORDER BY t.fecha DESC, t.hora DESC
    `;

    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  });

  router.post('/', async (req, res) => {
    try {
      const { cliente_id, mascota_id, servicio_id, profesional_id, canil_id, fecha, hora, observaciones } = req.body;

      if (!fecha || !hora) {
        return res.status(400).json({ error: 'Fecha y hora son obligatorias' });
      }

      const horaCorta = normalizeTime(hora);
      const [bloqueos, feriados, turnosMismaHora, caniles] = await Promise.all([
        query(db, 'SELECT * FROM bloqueos WHERE fecha = ?', [fecha]),
        query(db, 'SELECT * FROM feriados WHERE fecha = ? AND no_laborable = 1', [fecha]),
        query(
          db,
          `SELECT id, profesional_id, canil_id, hora
           FROM turnos
           WHERE fecha = ? AND estado <> 'Cancelado'`,
          [fecha]
        ),
        query(db, 'SELECT * FROM caniles WHERE activo = 1'),
      ]);

      const turnosEnHorario = turnosMismaHora.filter((turno) => normalizeTime(turno.hora) === horaCorta);
      const razones = [];

      if (bloqueos.length > 0) razones.push('Fecha bloqueada');
      if (feriados.length > 0) razones.push('Feriado no laborable');
      if (profesional_id && turnosEnHorario.some((turno) => Number(turno.profesional_id) === Number(profesional_id))) {
        razones.push('Profesional ocupado');
      }
      if (canil_id && turnosEnHorario.some((turno) => Number(turno.canil_id) === Number(canil_id))) {
        razones.push('Canil ocupado');
      }

      const canilesActivos = caniles.length;
      const canilesOcupados = new Set(turnosEnHorario.filter((turno) => turno.canil_id).map((turno) => Number(turno.canil_id))).size;
      if (!canil_id && canilesActivos > 0 && canilesOcupados >= canilesActivos) {
        razones.push('Cupos completos');
      }

      if (razones.length > 0) {
        return res.status(409).json({
          error: 'No se puede reservar este horario',
          estado: razones.includes('Cupos completos') ? 'Cupos completos' : 'No disponible',
          razones,
        });
      }

      const sql = `
        INSERT INTO turnos
          (cliente_id, mascota_id, servicio_id, profesional_id, canil_id, fecha, hora, observaciones)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        sql,
        [cliente_id, mascota_id, servicio_id, profesional_id, canil_id || null, fecha, hora, observaciones],
        async (err, result) => {
          if (err) return res.status(500).json({ error: err.message });

          const turnoId = result.insertId;
          let whatsapp_url = null;

          try {
            const detalle = await query(
              db,
              `SELECT t.fecha, t.hora,
                c.nombre as cliente_nombre, c.whatsapp as cliente_whatsapp,
                m.nombre as mascota_nombre,
                s.nombre as servicio_nombre,
                p.nombre as profesional_nombre
               FROM turnos t
               LEFT JOIN clientes c ON t.cliente_id = c.id
               LEFT JOIN mascotas m ON t.mascota_id = m.id
               LEFT JOIN servicios s ON t.servicio_id = s.id
               LEFT JOIN profesionales p ON t.profesional_id = p.id
               WHERE t.id = ?`,
              [turnoId]
            );
            const turno = detalle[0];
            const mensaje = buildConfirmacionTurno(turno || {});
            whatsapp_url = buildWhatsAppUrl(turno?.cliente_whatsapp, mensaje);

            if (whatsapp_url) {
              await query(
                db,
                `INSERT INTO recordatorios (turno_id, tipo, canal, estado, mensaje, whatsapp_url)
                 VALUES (?, 'confirmacion', 'whatsapp', 'pendiente', ?, ?)`,
                [turnoId, mensaje, whatsapp_url]
              );
            }
          } catch (recordatorioErr) {
            console.error('Recordatorio de confirmacion:', recordatorioErr.message);
          }

          res.json({
            mensaje: 'Turno creado correctamente',
            id: turnoId,
            whatsapp_url,
          });
        }
      );
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.put('/:id', (req, res) => {
    const { estado, pago } = req.body;
    const sql = 'UPDATE turnos SET estado = ?, pago = ? WHERE id = ?';
    db.query(sql, [estado, pago, req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: 'Turno actualizado correctamente' });
    });
  });

  router.delete('/:id', (req, res) => {
    db.query('DELETE FROM turnos WHERE id = ?', [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: 'Turno eliminado correctamente' });
    });
  });

  return router;
};
