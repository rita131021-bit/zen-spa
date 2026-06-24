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

const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

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
      const { cliente_id, mascota_id, servicio_id, profesional_id, canil_id, fecha, hora, fecha_egreso, hora_egreso, observaciones } = req.body;

      // Validaciones básicas
      if (!fecha || !hora) {
        return res.status(400).json({ error: 'Fecha y hora son obligatorias' });
      }

      if (!cliente_id || !mascota_id || !servicio_id) {
        return res.status(400).json({ error: 'Cliente, mascota y servicio son obligatorios' });
      }

      const horaCorta = normalizeTime(hora);

      // ===== VALIDACIONES DE DISPONIBILIDAD =====
      
      // 1. Verificar si la fecha está bloqueada
      const bloqueos = await query(db, 'SELECT * FROM bloqueos_calendario WHERE fecha = ?', [fecha]);
      if (bloqueos.length > 0) {
        return res.status(409).json({
          error: 'No se puede reservar en esta fecha',
          estado: 'Bloqueada',
          razones: ['Fecha bloqueada: ' + (bloqueos[0].motivo || 'Sin especificar')],
        });
      }

      // 2. Verificar si es feriado no laborable
      const feriados = await query(db, 'SELECT * FROM feriados WHERE fecha = ? AND no_laborable = TRUE', [fecha]);
      if (feriados.length > 0) {
        return res.status(409).json({
          error: 'No se puede reservar en feriado no laborable',
          estado: 'Feriado',
          razones: ['Feriado no laborable'],
        });
      }

      // 3. Verificar horario disponible
      const date = new Date(`${fecha}T12:00:00`);
      const dia = dayNames[date.getDay()];
      
      const horarios = await query(db, 'SELECT * FROM horarios WHERE dia = ? AND hora = ?', [dia, hora]);
      if (horarios.length > 0 && !horarios[0].disponible) {
        return res.status(409).json({
          error: 'Horario no disponible',
          estado: 'No disponible',
          razones: ['Horario no disponible en horarios semanales'],
        });
      }

      // 4. Obtener turnos existentes en esa fecha y hora
      const turnosExistentes = await query(
        db,
        `SELECT id, profesional_id, canil_id, hora, estado
         FROM turnos
         WHERE fecha = ? AND estado <> 'Cancelado'`,
        [fecha]
      );

      const turnosEnHorario = turnosExistentes.filter((turno) => normalizeTime(turno.hora) === horaCorta);
      const razones = [];

      // 5. Verificar si profesional está ocupado
      if (profesional_id) {
        const profesionalOcupado = turnosEnHorario.some(
          (turno) => Number(turno.profesional_id) === Number(profesional_id)
        );
        if (profesionalOcupado) {
          razones.push('Profesional ocupado en este horario');
        }
      }

      // 6. Verificar si canil está ocupado
      if (canil_id) {
        const canilOcupado = turnosEnHorario.some(
          (turno) => Number(turno.canil_id) === Number(canil_id)
        );
        if (canilOcupado) {
          razones.push('Canil ocupado en este horario');
        }
      }

      // 7. Verificar cupos de caniles (si no se especifica canil pero requiere)
      if (!canil_id) {
        const servicio = await query(db, 'SELECT * FROM servicios WHERE id = ?', [servicio_id]);
        if (servicio.length > 0 && servicio[0].requiere_canil) {
          const caniles = await query(db, 'SELECT * FROM caniles WHERE activo = TRUE');
          const canilesActivos = caniles.length;
          const canilesOcupados = new Set(
            turnosEnHorario
              .filter((turno) => turno.canil_id)
              .map((turno) => Number(turno.canil_id))
          ).size;

          if (canilesActivos > 0 && canilesOcupados >= canilesActivos) {
            razones.push('Cupos completos - todos los caniles ocupados');
          }
        }
      }

      // Si hay razones, rechazar
      if (razones.length > 0) {
        return res.status(409).json({
          error: 'No se puede reservar este horario',
          estado: 'No disponible',
          razones,
        });
      }

      // ===== CREAR TURNO =====
      const sql = `
        INSERT INTO turnos
          (cliente_id, mascota_id, servicio_id, profesional_id, canil_id, fecha, hora, fecha_egreso, hora_egreso, observaciones, estado, pago)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pendiente', 'Pendiente')
      `;

      db.query(
        sql,
        [cliente_id, mascota_id, servicio_id, profesional_id || null, canil_id || null, fecha, hora, fecha_egreso || null, hora_egreso || null, observaciones || null],
        async (err, result) => {
          if (err) return res.status(500).json({ error: err.message });

          const turnoId = result.insertId;
          let whatsapp_url = null;

          try {
            const detalle = await query(
              db,
              `SELECT t.id, t.fecha, t.hora,
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

          res.status(201).json({
            mensaje: '✅ Turno creado correctamente',
            id: turnoId,
            whatsapp_url,
          });
        }
      );
    } catch (err) {
      console.error('Error al crear turno:', err);
      res.status(500).json({ error: err.message });
    }
  });

  router.put('/:id', (req, res) => {
    const { estado, pago } = req.body;
    
    if (!estado && !pago) {
      return res.status(400).json({ error: 'Estado o pago es obligatorio' });
    }

    const updates = [];
    const params = [];

    if (estado) {
      // Validar que el estado sea válido
      const estadosValidos = ['Pendiente', 'Confirmado', 'Completado', 'Cancelado'];
      if (!estadosValidos.includes(estado)) {
        return res.status(400).json({ error: `Estado inválido. Debe ser uno de: ${estadosValidos.join(', ')}` });
      }
      updates.push('estado = ?');
      params.push(estado);
    }

    if (pago) {
      // Validar que el pago sea válido
      const pagosValidos = ['Pendiente', 'Sena', 'Pagado'];
      if (!pagosValidos.includes(pago)) {
        return res.status(400).json({ error: `Pago inválido. Debe ser uno de: ${pagosValidos.join(', ')}` });
      }
      updates.push('pago = ?');
      params.push(pago);
    }

    params.push(req.params.id);
    const sql = `UPDATE turnos SET ${updates.join(', ')} WHERE id = ?`;

    db.query(sql, params, (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: '✅ Turno actualizado correctamente' });
    });
  });

  router.delete('/:id', (req, res) => {
    db.query('DELETE FROM turnos WHERE id = ?', [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: '✅ Turno eliminado correctamente' });
    });
  });


  // POSTERGAR TURNO — cambia fecha y hora
  router.patch('/:id/postergar', (req, res) => {
    const { fecha, hora, motivo } = req.body;
    if (!fecha || !hora) return res.status(400).json({ error: 'Nueva fecha y hora son obligatorias' });
    const sql = "UPDATE turnos SET fecha = ?, hora = ?, estado = 'Pendiente', observaciones = COALESCE(observaciones,'') || ' | Postergado: ' || ? WHERE id = ?";
    db.query(sql, [fecha, hora, motivo || 'Sin motivo', req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: '✅ Turno postergado correctamente' });
    });
  });

  // CANCELAR TURNO
  router.patch('/:id/cancelar', (req, res) => {
    const { motivo } = req.body;
    const sql = "UPDATE turnos SET estado = 'Cancelado', observaciones = COALESCE(observaciones,'') || ' | Cancelado: ' || ? WHERE id = ?";
    db.query(sql, [motivo || 'Cancelado por administrador', req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: '✅ Turno cancelado correctamente' });
    });
  });

  return router;
};

// Este archivo fue parchado — agregar endpoint postergar al router antes del return
