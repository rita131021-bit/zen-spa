// routes/bookings.js
// Endpoint de compatibilidad con el sitio web público
// Traduce el formato del sitio web al formato interno de turnos

module.exports = function createBookingsRouter(db) {
  const express = require('express');
  const router = express.Router();

  // POST /api/bookings - crear reserva desde el sitio web
  router.post('/', async (req, res) => {
    try {
      const {
        ownerName, ownerEmail, ownerPhone,
        species, petName, weight, age,
        date, hour, startDate, startHour, endDate, endHour,
        specialFood, foodBrand, foodPortion, foodSchedule, customFood,
        bringsBlanket, bringsBed, extraNotes,
        serviceId, serviceName,
      } = req.body;

      if (!petName || (!date && !startDate)) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
      }

      // 1. Buscar o crear cliente
      let clienteId = null;
      if (ownerName || ownerEmail || ownerPhone) {
        const clienteRows = await db.query(
          'SELECT id FROM clientes WHERE nombre = ? LIMIT 1',
          [ownerName || 'Cliente Web']
        );
        if (clienteRows && clienteRows.length > 0) {
          clienteId = clienteRows[0].id;
        } else {
          const newCliente = await db.query(
            'INSERT INTO clientes (nombre, email, telefono, whatsapp) VALUES (?, ?, ?, ?)',
            [ownerName || 'Cliente Web', ownerEmail || null, ownerPhone || null, ownerPhone || null]
          );
          clienteId = newCliente.insertId;
        }
      }

      // 2. Buscar o crear mascota
      let mascotaId = null;
      if (clienteId && petName) {
        const mascotaRows = await db.query(
          'SELECT id FROM mascotas WHERE nombre = ? AND cliente_id = ? LIMIT 1',
          [petName, clienteId]
        );
        if (mascotaRows && mascotaRows.length > 0) {
          mascotaId = mascotaRows[0].id;
        } else {
          const newMascota = await db.query(
            'INSERT INTO mascotas (cliente_id, nombre, especie, peso, edad) VALUES (?, ?, ?, ?, ?)',
            [clienteId, petName, species || null, weight || null, age || null]
          );
          mascotaId = newMascota.insertId;
        }
      }

      // 3. Buscar servicio
      let servicioId = serviceId || null;
      if (!servicioId && serviceName) {
        const svcRows = await db.query(
          'SELECT id FROM servicios WHERE nombre ILIKE ? LIMIT 1',
          [`%${serviceName}%`]
        );
        if (svcRows && svcRows.length > 0) servicioId = svcRows[0].id;
      }

      // 4. Armar observaciones
      const obs = [
        specialFood ? `Alimento especial: ${foodBrand} - ${foodPortion} - ${foodSchedule} - ${customFood}` : null,
        bringsBlanket ? 'Trae mantita' : null,
        bringsBed ? 'Trae camita' : null,
        extraNotes || null,
      ].filter(Boolean).join('. ');

      // 5. Crear turno
      const fechaTurno = date ? date.slice(0, 10) : (startDate ? startDate.slice(0, 10) : null);
      const horaTurno  = hour || startHour || '09:00';
      const fechaEgreso = endDate ? endDate.slice(0, 10) : null;
      const horaEgreso  = endHour || null;

      const result = await db.query(
        `INSERT INTO turnos (cliente_id, mascota_id, servicio_id, fecha, hora, fecha_egreso, hora_egreso, observaciones, estado, pago)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pendiente', 'Pendiente')`,
        [clienteId, mascotaId, servicioId, fechaTurno, horaTurno, fechaEgreso, horaEgreso, obs || null]
      );

      res.status(201).json({
        id: result.insertId,
        mensaje: '✅ Reserva creada correctamente',
        turno: { clienteId, mascotaId, servicioId, fecha: fechaTurno, hora: horaTurno }
      });

    } catch (err) {
      console.error('Error en /api/bookings:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/bookings - listar reservas
  router.get('/', async (req, res) => {
    try {
      const rows = await db.query(`
        SELECT t.*, c.nombre as cliente_nombre, m.nombre as mascota_nombre,
               s.nombre as servicio_nombre
        FROM turnos t
        LEFT JOIN clientes c ON t.cliente_id = c.id
        LEFT JOIN mascotas m ON t.mascota_id = m.id
        LEFT JOIN servicios s ON t.servicio_id = s.id
        ORDER BY t.fecha DESC, t.hora DESC
        LIMIT 50
      `);
      res.json(rows || []);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/availability - disponibilidad por mes
  router.get('/availability', async (req, res) => {
    try {
      const { month } = req.query; // formato: "2026-06"
      if (!month) return res.json({});

      const rows = await db.query(
        `SELECT fecha, COUNT(*) as turnos
         FROM turnos
         WHERE fecha::text LIKE ? AND estado != 'Cancelado'
         GROUP BY fecha`,
        [`${month}%`]
      );

      const result = {};
      for (const row of (rows || [])) {
        result[row.fecha] = Number(row.turnos);
      }
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/prices - precios de servicios
  router.get('/prices', async (req, res) => {
    try {
      const rows = await db.query('SELECT id, nombre, precio, categoria FROM servicios WHERE activo = TRUE');
      res.json(rows || []);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
