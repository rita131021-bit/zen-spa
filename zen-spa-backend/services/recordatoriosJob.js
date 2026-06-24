const { buildRecordatorio24h, buildWhatsAppUrl } = require('../utils/whatsapp');

function query(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

async function runRecordatoriosJob(db) {
  const sql = `
    SELECT t.id as turno_id, t.fecha, t.hora,
      c.nombre as cliente_nombre, c.whatsapp as cliente_whatsapp,
      m.nombre as mascota_nombre,
      s.nombre as servicio_nombre
    FROM turnos t
    LEFT JOIN clientes c ON t.cliente_id = c.id
    LEFT JOIN mascotas m ON t.mascota_id = m.id
    LEFT JOIN servicios s ON t.servicio_id = s.id
    WHERE t.fecha = CURRENT_DATE + INTERVAL '1 day'
      AND t.estado IN ('Pendiente', 'Confirmado')
      AND NOT EXISTS (
        SELECT 1 FROM recordatorios r
        WHERE r.turno_id = t.id AND r.tipo = '24h'
      )
  `;

  const turnos = await query(db, sql);
  let creados = 0;

  for (const turno of turnos) {
    const mensaje = buildRecordatorio24h(turno);
    const whatsapp_url = buildWhatsAppUrl(turno.cliente_whatsapp, mensaje);
    await query(
      db,
      `INSERT INTO recordatorios (turno_id, tipo, canal, estado, mensaje, whatsapp_url)
       VALUES (?, '24h', 'whatsapp', 'pendiente', ?, ?)`,
      [turno.turno_id, mensaje, whatsapp_url]
    );
    creados += 1;
  }

  return { creados, revisados: turnos.length };
}

module.exports = { runRecordatoriosJob };
