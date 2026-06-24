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

async function getAvailability(db, { fecha, profesional_id, canil_id }) {
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
