// routes/bookings.js
// Endpoint de compatibilidad con el sitio web público
// Traduce el formato del sitio web al formato interno de turnos

module.exports = function createBookingsRouter(db) {
  const express = require('express');
  const router = express.Router();

  const PRICE_ADMIN_PASSWORD = process.env.PRICE_ADMIN_PASSWORD || 'admin1234';
  const defaultWebPrices = [
    ['spa-relax', '', 'por sesion'],
    ['spa-armonia', '', 'por sesion'],
    ['spa-premium', '', 'por sesion'],
    ['ter-completo', '', 'por sesion'],
    ['gua-canina', '', 'por dia'],
    ['gua-felina', '', 'por dia'],
    ['pel-canina', '', ''],
    ['pel-felina', '', ''],
    ['gc-relax', '', ''],
    ['gc-armonia', '', ''],
    ['gc-libre', '', ''],
  ];

  function isPricesMount(req) {
    return String(req.baseUrl || '').endsWith('/api/prices');
  }

  function validarClavePrecio(req, res) {
    const clave = req.body?.password_precio || req.body?.clave_precio || req.body?.precio_password || req.get('x-admin-password') || '';
    if (String(clave) !== PRICE_ADMIN_PASSWORD) {
      res.status(401).json({ error: 'Contraseña incorrecta para modificar precios' });
      return false;
    }
    return true;
  }

  async function ensureWebPricesTable() {
    await db.query(`CREATE TABLE IF NOT EXISTS web_prices (
      id TEXT PRIMARY KEY,
      price TEXT DEFAULT '',
      price_note TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    for (let i = 0; i < defaultWebPrices.length; i += 1) {
      const [id, price, priceNote] = defaultWebPrices[i];
      await db.query(
        `INSERT INTO web_prices (id, price, price_note, sort_order)
         VALUES (?, ?, ?, ?)
         ON CONFLICT (id) DO NOTHING`,
        [id, price, priceNote, i]
      );
    }
  }

  async function listWebPrices(res) {
    await ensureWebPricesTable();
    const rows = await db.query(
      'SELECT id, price, price_note AS "priceNote" FROM web_prices ORDER BY sort_order, id'
    );
    res.json(rows || []);
  }


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
  // GET /api/prices - listar precios editables del sitio web
  router.get('/', async (req, res) => {
    try {
      if (isPricesMount(req)) return await listWebPrices(res);

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

  // GET /api/prices - precios de servicios web (cuando el router esta montado en /api/bookings)
  router.get('/prices', async (req, res) => {
    try {
      return await listWebPrices(res);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT /api/prices/:id - actualizar precio editable del sitio web
  router.put('/:id', async (req, res, next) => {
    if (!isPricesMount(req)) return next();
    try {
      if (!validarClavePrecio(req, res)) return;
      await ensureWebPricesTable();
      const id = String(req.params.id || '').trim();
      const price = String(req.body?.price || req.body?.precio || '').trim();
      const priceNote = String(req.body?.priceNote || req.body?.price_note || req.body?.nota || '').trim();
      if (!id) return res.status(400).json({ error: 'ID de precio obligatorio' });

      await db.query(
        `INSERT INTO web_prices (id, price, price_note, updated_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO UPDATE SET
           price = EXCLUDED.price,
           price_note = EXCLUDED.price_note,
           updated_at = CURRENT_TIMESTAMP`,
        [id, price, priceNote]
      );
      res.json({ mensaje: 'Precio actualizado', id, price, priceNote });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
