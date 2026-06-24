// routes/giftcards.js
module.exports = function createGiftCardsRouter(db) {
  const express = require('express');
  const router = express.Router();

  function generarCodigo() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'ZEN-';
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  }

  // GET todas
  router.get('/', (req, res) => {
    const sql = `
      SELECT g.*, c.nombre as cliente_nombre
      FROM gift_cards g
      LEFT JOIN clientes c ON g.cliente_id = c.id
      ORDER BY g.creado_en DESC`;
    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results || []);
    });
  });

  // GET por código
  router.get('/codigo/:codigo', (req, res) => {
    const sql = `
      SELECT g.*, c.nombre as cliente_nombre
      FROM gift_cards g
      LEFT JOIN clientes c ON g.cliente_id = c.id
      WHERE g.codigo = ?`;
    db.query(sql, [req.params.codigo.toUpperCase()], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!results.length) return res.status(404).json({ error: 'Gift card no encontrada' });
      res.json(results[0]);
    });
  });

  // CREAR gift card
  router.post('/', (req, res) => {
    const { monto, cliente_id, fecha_vencimiento, notas } = req.body;
    if (!monto || monto <= 0) return res.status(400).json({ error: 'Monto debe ser mayor a 0' });

    const codigo = generarCodigo();
    const sql = `INSERT INTO gift_cards (codigo, monto_inicial, monto_saldo, cliente_id, fecha_vencimiento, notas)
                 VALUES (?, ?, ?, ?, ?, ?)`;
    db.query(sql, [codigo, monto, monto, cliente_id || null, fecha_vencimiento || null, notas || null], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ mensaje: '✅ Gift card creada', id: result.insertId, codigo });
    });
  });

  // CANJEAR gift card
  router.post('/canjear', (req, res) => {
    const { codigo, monto_usar, turno_id, notas } = req.body;
    if (!codigo || !monto_usar) return res.status(400).json({ error: 'Código y monto son obligatorios' });

    const sqlGet = 'SELECT * FROM gift_cards WHERE codigo = ? AND estado = "activa"';
    db.query(sqlGet, [codigo.toUpperCase()], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!results.length) return res.status(404).json({ error: 'Gift card no encontrada o inactiva' });

      const gc = results[0];

      // Verificar vencimiento
      if (gc.fecha_vencimiento && new Date(gc.fecha_vencimiento) < new Date()) {
        db.query("UPDATE gift_cards SET estado = 'vencida' WHERE id = ?", [gc.id]);
        return res.status(400).json({ error: 'Gift card vencida' });
      }

      const montoUsar = Math.min(Number(monto_usar), Number(gc.monto_saldo));
      if (montoUsar <= 0) return res.status(400).json({ error: 'Sin saldo disponible' });

      const nuevoSaldo = Number(gc.monto_saldo) - montoUsar;
      const nuevoEstado = nuevoSaldo <= 0 ? 'canjeada' : 'activa';

      db.query('UPDATE gift_cards SET monto_saldo = ?, estado = ? WHERE id = ?', [nuevoSaldo, nuevoEstado, gc.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });

        db.query('INSERT INTO gift_cards_usos (gift_card_id, turno_id, monto_usado, notas) VALUES (?, ?, ?, ?)',
          [gc.id, turno_id || null, montoUsar, notas || null]);

        res.json({ mensaje: '✅ Gift card canjeada', monto_usado: montoUsar, saldo_restante: nuevoSaldo });
      });
    });
  });

  // ANULAR gift card
  router.delete('/:id', (req, res) => {
    db.query("UPDATE gift_cards SET estado = 'anulada' WHERE id = ?", [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: '✅ Gift card anulada' });
    });
  });

  return router;
};
