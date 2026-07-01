const express = require('express');
const router = express.Router();

const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
const fallbackHours = ['08:00:00', '09:00:00', '10:00:00', '11:00:00', '14:00:00', '15:00:00', '16:00:00', '17:00:00'];

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

async function ensureSchema(db) {
  await query(db, "CREATE TABLE IF NOT EXISTS locales (id SERIAL PRIMARY KEY, nombre VARCHAR(120) NOT NULL UNIQUE, direccion VARCHAR(180) NOT NULL, tipo VARCHAR(80) NOT NULL, activo BOOLEAN DEFAULT TRUE, creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
  await query(db, "INSERT INTO locales (nombre, direccion, tipo, activo) VALUES ('Villaguay al 1000', 'Villaguay al 1000', 'Peluqueria / Spa', TRUE), ('Juan Baez al final', 'Juan Baez al final', 'Guarderia', TRUE) ON CONFLICT (nombre) DO UPDATE SET direccion = EXCLUDED.direccion, tipo = EXCLUDED.tipo, activo = TRUE");
  await query(db, 'ALTER TABLE profesionales ADD COLUMN IF NOT EXISTS local_id INTEGER REFERENCES locales(id)');
  await query(db, 'ALTER TABLE servicios ADD COLUMN IF NOT EXISTS local_id INTEGER REFERENCES locales(id)');
  await query(db, 'ALTER TABLE turnos ADD COLUMN IF NOT EXISTS local_id INTEGER REFERENCES locales(id)');
  await query(db, "UPDATE profesionales SET local_id = (SELECT id FROM locales WHERE nombre = 'Villaguay al 1000') WHERE local_id IS NULL");
  await query(db, "UPDATE servicios SET local_id = (SELECT id FROM locales WHERE nombre = 'Juan Baez al final') WHERE local_id IS NULL AND lower(coalesce(categoria,'')) LIKE '%guard%'");
  await query(db, "UPDATE servicios SET local_id = (SELECT id FROM locales WHERE nombre = 'Villaguay al 1000') WHERE local_id IS NULL");
  await query(db, "CREATE TABLE IF NOT EXISTS horarios_locales (id SERIAL PRIMARY KEY, local_id INTEGER NOT NULL REFERENCES locales(id) ON DELETE CASCADE, dia VARCHAR(20) NOT NULL, hora_apertura TIME NOT NULL DEFAULT '08:00', hora_cierre TIME NOT NULL DEFAULT '18:00', disponible BOOLEAN DEFAULT TRUE, UNIQUE(local_id, dia))");
  await query(db, "INSERT INTO horarios_locales (local_id, dia, hora_apertura, hora_cierre, disponible) SELECT l.id, d.dia, '08:00', '18:00', CASE WHEN d.dia = 'Domingo' THEN FALSE ELSE TRUE END FROM locales l CROSS JOIN (VALUES ('Lunes'),('Martes'),('Miercoles'),('Jueves'),('Viernes'),('Sabado'),('Domingo')) d(dia) ON CONFLICT (local_id, dia) DO NOTHING");
  await query(db, "CREATE TABLE IF NOT EXISTS horarios_profesionales (id SERIAL PRIMARY KEY, profesional_id INTEGER NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE, dia VARCHAR(20) NOT NULL, hora_entrada TIME NOT NULL DEFAULT '08:00', hora_salida TIME NOT NULL DEFAULT '18:00', disponible BOOLEAN DEFAULT TRUE, UNIQUE(profesional_id, dia))");
  await query(db, "CREATE TABLE IF NOT EXISTS bloqueos_profesionales (id SERIAL PRIMARY KEY, profesional_id INTEGER NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE, fecha DATE NOT NULL, hora_inicio TIME, hora_fin TIME, motivo VARCHAR(180), creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
}

function normalizeDays(value) {
  const allowed = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
  if (!Array.isArray(value)) return allowed.filter((d) => d !== 'Domingo');
  return allowed.filter((day) => value.includes(day));
}

function normalizeBool(value, fallback = true) {
  if (typeof value === 'boolean') return value;
  if (value === 1 || value === '1' || value === 'true') return true;
  if (value === 0 || value === '0' || value === 'false') return false;
  return fallback;
}

function cleanTime(value, fallback) {
  const text = normalizeTime(value || fallback);
  return /^\d{2}:\d{2}$/.test(text) ? text : fallback;
}

function parseProfessionalBlocks(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      fecha: String(item.fecha || '').slice(0, 10),
      hora_inicio: item.hora_inicio ? normalizeTime(item.hora_inicio) : null,
      hora_fin: item.hora_fin ? normalizeTime(item.hora_fin) : null,
      motivo: String(item.motivo || '').trim() || null,
    }))
    .filter((item) => /^\d{4}-\d{2}-\d{2}$/.test(item.fecha));
}

async function getAvailability(db, { fecha, profesional_id, canil_id, local_id, servicio_id }) {
  await ensureSchema(db);
  if (!fecha) {
    const error = new Error('La fecha es obligatoria');
    error.status = 400;
    throw error;
  }

  const date = new Date(`${fecha}T12:00:00`);
  const dia = dayNames[date.getDay()];

  const [bloqueos, feriados, horarios, turnos, caniles] = await Promise.all([
    query(db, 'SELECT * FROM bloqueos_calendario WHERE fecha = ?', [fecha]),
    query(db, 'SELECT * FROM feriados WHERE fecha = ?', [fecha]),
    query(db, 'SELECT * FROM horarios WHERE dia = ? ORDER BY hora', [dia]),
    query(
      db,
      `SELECT id, fecha, hora, profesional_id, canil_id, estado
       FROM turnos
       WHERE fecha = ? AND estado <> 'Cancelado'`,
      [fecha]
    ),
    query(db, 'SELECT * FROM caniles WHERE activo = TRUE ORDER BY nombre'),
  ]);

  let localHorario = null;
  if (local_id) {
    const localRows = await query(db, 'SELECT * FROM horarios_locales WHERE local_id = ? AND dia = ? LIMIT 1', [local_id, dia]);
    localHorario = localRows[0] || null;
  } else if (servicio_id) {
    const serviceRows = await query(db, 'SELECT local_id FROM servicios WHERE id = ? LIMIT 1', [servicio_id]);
    const serviceLocalId = serviceRows[0]?.local_id;
    if (serviceLocalId) {
      const localRows = await query(db, 'SELECT * FROM horarios_locales WHERE local_id = ? AND dia = ? LIMIT 1', [serviceLocalId, dia]);
      localHorario = localRows[0] || null;
    }
  }

  let profesionalHorario = null;
  let bloqueosProfesional = [];
  if (profesional_id) {
    const professionalRows = await query(db, 'SELECT * FROM horarios_profesionales WHERE profesional_id = ? AND dia = ? LIMIT 1', [profesional_id, dia]);
    profesionalHorario = professionalRows[0] || null;
    bloqueosProfesional = await query(db, 'SELECT * FROM bloqueos_profesionales WHERE profesional_id = ? AND fecha = ? ORDER BY hora_inicio', [profesional_id, fecha]);
  }

  const fechaBloqueada = bloqueos.length > 0;
  const feriado = feriados[0] || null;
  const noLaborable = Boolean(feriado && feriado.no_laborable);
  // Deduplicar horas para evitar slots repetidos
  const horasUnicas = horarios.length > 0
    ? [...new Set(horarios.map((item) => normalizeTime(item.hora)))].sort()
    : fallbackHours.map(h => normalizeTime(h));
  const hours = horasUnicas;

  const slots = hours.map((hora) => {
    const horaCorta = normalizeTime(hora);
    const horario = horarios.find((item) => normalizeTime(item.hora) === horaCorta);
    const fueraDeHorario = horario ? !Boolean(horario.disponible) : false;
    const fueraDeLocal = localHorario ? (!Boolean(localHorario.disponible) || horaCorta < normalizeTime(localHorario.hora_apertura) || horaCorta >= normalizeTime(localHorario.hora_cierre)) : false;
    const fueraDeProfesional = profesionalHorario ? (!Boolean(profesionalHorario.disponible) || horaCorta < normalizeTime(profesionalHorario.hora_entrada) || horaCorta >= normalizeTime(profesionalHorario.hora_salida)) : false;
    const bloqueoProfesional = bloqueosProfesional.find((bloqueo) => {
      const inicio = bloqueo.hora_inicio ? normalizeTime(bloqueo.hora_inicio) : '';
      const fin = bloqueo.hora_fin ? normalizeTime(bloqueo.hora_fin) : '';
      if (!inicio && !fin) return true;
      return (!inicio || horaCorta >= inicio) && (!fin || horaCorta < fin);
    });
    const turnosMismaHora = turnos.filter((turno) => normalizeTime(turno.hora) === horaCorta);
    const profesionalOcupado = profesional_id
      ? turnosMismaHora.some((turno) => Number(turno.profesional_id) === Number(profesional_id))
      : false;
    const canilOcupado = canil_id
      ? turnosMismaHora.some((turno) => Number(turno.canil_id) === Number(canil_id))
      : false;
    const canilesActivos = caniles.length;
    const canilesOcupados = new Set(turnosMismaHora.filter((turno) => turno.canil_id).map((turno) => Number(turno.canil_id))).size;
    const cuposCompletos = canilesActivos > 0 && canilesOcupados >= canilesActivos;
    const razones = [];

    if (fechaBloqueada) razones.push('Fecha bloqueada');
    if (noLaborable) razones.push('Feriado no laborable');
    if (fueraDeHorario) razones.push('Horario no disponible');
    if (fueraDeLocal) razones.push('Fuera del horario del local');
    if (fueraDeProfesional) razones.push('Fuera del horario del profesional');
    if (bloqueoProfesional) razones.push(bloqueoProfesional.motivo || 'Profesional bloqueado');
    if (profesionalOcupado) razones.push('Profesional ocupado');
    if (canilOcupado) razones.push('Canil ocupado');
    if (cuposCompletos) razones.push('Cupos completos');

    return {
      hora: horaCorta,
      disponible: razones.length === 0,
      estado: razones.length === 0 ? 'Disponible' : razones.includes('Cupos completos') ? 'Cupos completos' : 'No disponible',
      razones,
      cupos: {
        canilesActivos,
        canilesOcupados,
        canilesLibres: Math.max(canilesActivos - canilesOcupados, 0),
      },
    };
  });

  return {
    fecha,
    dia,
    bloqueada: fechaBloqueada,
    bloqueo: bloqueos[0] || null,
    feriado,
    noLaborable,
    slots,
  };
}

module.exports = (db) => {
  router.get('/locales', async (req, res) => {
    try {
      await ensureSchema(db);
      const rows = await query(db, 'SELECT * FROM locales ORDER BY id');
      const horarios = await query(db, 'SELECT * FROM horarios_locales ORDER BY local_id, dia');
      res.json(rows.map((local) => ({
        ...local,
        horarios: horarios.filter((item) => Number(item.local_id) === Number(local.id)),
      })));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.put('/locales/:id', async (req, res) => {
    try {
      await ensureSchema(db);
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Local invalido' });
      const direccion = String(req.body.direccion || '').trim();
      const activo = normalizeBool(req.body.activo, true);
      const diasLaborales = normalizeDays(req.body.dias_laborales);
      const horaApertura = cleanTime(req.body.hora_apertura, '08:00');
      const horaCierre = cleanTime(req.body.hora_cierre, '18:00');
      if (!direccion) return res.status(400).json({ error: 'La direccion es obligatoria' });

      await query(db, 'UPDATE locales SET direccion = ?, activo = ? WHERE id = ?', [direccion, activo, id]);
      const allDays = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
      for (const day of allDays) {
        await query(
          db,
          "INSERT INTO horarios_locales (local_id, dia, hora_apertura, hora_cierre, disponible) VALUES (?, ?, ?, ?, ?) ON CONFLICT (local_id, dia) DO UPDATE SET hora_apertura = EXCLUDED.hora_apertura, hora_cierre = EXCLUDED.hora_cierre, disponible = EXCLUDED.disponible",
          [id, day, horaApertura, horaCierre, diasLaborales.includes(day)]
        );
      }
      const rows = await query(db, 'SELECT * FROM locales WHERE id = ? LIMIT 1', [id]);
      const horarios = await query(db, 'SELECT * FROM horarios_locales WHERE local_id = ? ORDER BY dia', [id]);
      res.json({ mensaje: 'Local actualizado correctamente', data: { ...rows[0], horarios } });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/', async (req, res) => {
    try {
      const data = await getAvailability(db, req.query);
      res.json(data);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  });

  router.post('/validar', async (req, res) => {
    try {
      const { fecha, hora, profesional_id, canil_id } = req.body;
      const data = await getAvailability(db, { fecha, profesional_id, canil_id });
      const slot = data.slots.find((item) => item.hora === normalizeTime(hora));

      if (!slot) {
        return res.json({
          disponible: false,
          estado: 'No disponible',
          mensaje: 'Horario fuera de agenda',
          razones: ['Horario fuera de agenda'],
        });
      }

      res.json({
        disponible: slot.disponible,
        estado: slot.estado,
        mensaje: slot.disponible ? 'Horario disponible' : slot.estado,
        razones: slot.razones,
        cupos: slot.cupos,
      });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  });

  return router;
};
