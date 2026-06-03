const express = require('express');
const router = express.Router();

function query(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

function createChatRouter(db, io) {
  const api = express.Router();

  api.get('/conversaciones', async (req, res) => {
    try {
      const sql = `
        SELECT c.id as cliente_id, c.nombre as cliente_nombre, c.whatsapp,
          (
            SELECT mensaje FROM mensajes_chat mc
            WHERE mc.cliente_id = c.id
            ORDER BY mc.creado_en DESC
            LIMIT 1
          ) as ultimo_mensaje,
          (
            SELECT creado_en FROM mensajes_chat mc
            WHERE mc.cliente_id = c.id
            ORDER BY mc.creado_en DESC
            LIMIT 1
          ) as ultimo_en
        FROM clientes c
        ORDER BY ultimo_en DESC, c.nombre ASC
      `;
      const rows = await query(db, sql);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  api.get('/:clienteId', async (req, res) => {
    try {
      const rows = await query(
        db,
        `SELECT * FROM mensajes_chat WHERE cliente_id = ? ORDER BY creado_en ASC`,
        [req.params.clienteId]
      );
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  api.post('/:clienteId', async (req, res) => {
    try {
      const { mensaje, autor_tipo = 'admin', autor_nombre = 'Romina' } = req.body;
      if (!mensaje) return res.status(400).json({ error: 'El mensaje es obligatorio' });

      const result = await query(
        db,
        `INSERT INTO mensajes_chat (cliente_id, autor_tipo, autor_nombre, mensaje)
         VALUES (?, ?, ?, ?)`,
        [req.params.clienteId, autor_tipo, autor_nombre, mensaje]
      );

      const payload = {
        id: result.insertId,
        cliente_id: Number(req.params.clienteId),
        autor_tipo,
        autor_nombre,
        mensaje,
        creado_en: new Date().toISOString(),
      };

      if (io) {
        io.to(`cliente-${req.params.clienteId}`).emit('mensaje:nuevo', payload);
        io.to('admin').emit('mensaje:nuevo', payload);
      }

      res.json({ mensaje: 'Mensaje enviado', data: payload });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return api;
}

function setupSocket(io, db) {
  io.on('connection', (socket) => {
    socket.on('join', ({ clienteId, role }) => {
      if (role === 'admin') socket.join('admin');
      if (clienteId) socket.join(`cliente-${clienteId}`);
    });

    socket.on('mensaje:enviar', async (data, callback) => {
      try {
        const { cliente_id, mensaje, autor_tipo = 'cliente', autor_nombre = 'Cliente' } = data || {};
        if (!cliente_id || !mensaje) throw new Error('Datos incompletos');

        const result = await query(
          db,
          `INSERT INTO mensajes_chat (cliente_id, autor_tipo, autor_nombre, mensaje)
           VALUES (?, ?, ?, ?)`,
          [cliente_id, autor_tipo, autor_nombre, mensaje]
        );

        const payload = {
          id: result.insertId,
          cliente_id: Number(cliente_id),
          autor_tipo,
          autor_nombre,
          mensaje,
          creado_en: new Date().toISOString(),
        };

        io.to(`cliente-${cliente_id}`).emit('mensaje:nuevo', payload);
        io.to('admin').emit('mensaje:nuevo', payload);
        if (callback) callback({ ok: true, data: payload });
      } catch (err) {
        if (callback) callback({ ok: false, error: err.message });
      }
    });
  });
}

module.exports = createChatRouter;
module.exports.setupSocket = setupSocket;
