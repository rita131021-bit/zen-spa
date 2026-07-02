// routes/servicios.js
module.exports = function createServiciosRouter(db) {
  const express = require('express');
  const router = express.Router();
  const PRICE_ADMIN_PASSWORD = process.env.PRICE_ADMIN_PASSWORD || 'admin1234';



  function normalizarTexto(valor) {
    return String(valor || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  function idsWebParaServicio(servicio) {
    const nombre = normalizarTexto(servicio.nombre);
    const categoria = normalizarTexto(servicio.categoria);

    if (nombre.includes('relax')) return ['spa-relax'];
    if (nombre.includes('armonia')) return ['spa-armonia'];
    if (nombre.includes('premium') && (categoria.includes('spa') || nombre.includes('spa'))) return ['spa-premium'];
    if (nombre.includes('terapia') || categoria.includes('terapia')) return ['ter-completo'];
    if (nombre.includes('guarderia') || categoria.includes('guarderia')) return ['gua-canina', 'gua-felina'];
    if (nombre.includes('peluqueria') || nombre.includes('bano') || categoria.includes('peluqueria')) return ['pel-canina', 'pel-felina'];

    return [];
  }

  function notaWebParaServicio(servicio) {
    const categoria = normalizarTexto(servicio.categoria);
    if (categoria.includes('guarderia')) return 'por dia';
    if (categoria.includes('peluqueria')) return '';
    return 'por sesion';
  }

  function formatoPrecioWeb(precio) {
    const numero = Number(precio || 0);
    if (!Number.isFinite(numero) || numero <= 0) return '';
    return '
    const clave = req.body?.password_precio || req.body?.clave_precio || req.body?.precio_password || '';
    const claveNormalizada = String(clave).trim().toLowerCase();
    const claveEsperada = String(PRICE_ADMIN_PASSWORD).trim().toLowerCase();
    if (claveNormalizada !== claveEsperada) {
      res.status(401).json({ error: 'Contraseña incorrecta para modificar precios' });
      return false;
    }
    return true;
  }

  // GET TODOS
  router.get('/', (req, res) => {
    db.query('SELECT * FROM servicios ORDER BY categoria, nombre', (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results || []);
    });
  });

  // GET ACTIVOS
  router.get('/activos/true', (req, res) => {
    db.query('SELECT * FROM servicios WHERE activo = TRUE ORDER BY categoria, nombre', (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results || []);
    });
  });

  // AUMENTO GENERAL DE PRECIOS — debe ir ANTES de /:id
  router.put('/precio/aumento', (req, res) => {
    if (!validarClavePrecio(req, res)) return;
    const { porcentaje } = req.body;
    if (!porcentaje || porcentaje <= 0) {
      return res.status(400).json({ error: 'Porcentaje debe ser mayor a 0' });
    }
    const factor = 1 + Number(porcentaje) / 100;
    const sql = 'UPDATE servicios SET precio = ROUND(precio * ?, 0) WHERE activo = TRUE';
    db.query(sql, [factor], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      db.query('SELECT * FROM servicios WHERE activo = TRUE', (selectErr, servicios) => {
        if (selectErr) return res.status(500).json({ error: selectErr.message });
        sincronizarPreciosWeb(servicios || [], (syncErr) => {
          if (syncErr) return res.status(500).json({ error: syncErr.message });
          const total = result.affectedRows ?? result.rowCount ?? (servicios || []).length;
          res.json({ mensaje: `✅ Aumento de ${porcentaje}% aplicado a ${total} servicios` });
        });
      });
    });
  });

  // GET POR ID
  router.get('/:id', (req, res) => {
    db.query('SELECT * FROM servicios WHERE id = ?', [req.params.id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!results.length) return res.status(404).json({ error: 'Servicio no encontrado' });
      res.json(results[0]);
    });
  });

  // CREAR
  router.post('/', (req, res) => {
    const { nombre, descripcion, precio, precio_base, duracion_minutos, categoria } = req.body;
    const precioFinal = precio || precio_base;
    if (!nombre || !precioFinal) {
      return res.status(400).json({ error: 'Nombre y precio son obligatorios' });
    }
    const sql = 'INSERT INTO servicios (nombre, descripcion, precio, duracion_minutos, categoria) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [nombre, descripcion || null, precioFinal, duracion_minutos || 60, categoria || null], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ya existe un servicio con ese nombre' });
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ mensaje: '✅ Servicio creado', id: result.insertId });
    });
  });

  // ACTUALIZAR
  router.put('/:id', (req, res) => {
    if (!validarClavePrecio(req, res)) return;
    const { nombre, descripcion, precio, precio_base, duracion_minutos, categoria, activo } = req.body;
    const precioFinal = precio || precio_base;

    // Guardar historial si cambió el precio
    db.query('SELECT precio FROM servicios WHERE id = ?', [req.params.id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!results.length) return res.status(404).json({ error: 'No encontrado' });

      const precioAnterior = results[0].precio;
      const sql = 'UPDATE servicios SET nombre=?, descripcion=?, precio=?, duracion_minutos=?, categoria=?, activo=? WHERE id=?';

      db.query(sql, [
        nombre, descripcion || null, precioFinal,
        duracion_minutos || 60, categoria || null,
        activo !== undefined ? activo : true,
        req.params.id
      ], (err) => {
        if (err) return res.status(500).json({ error: err.message });

        if (precioAnterior !== precioFinal) {
          db.query(
            'INSERT INTO historial_precios (servicio_id, precio_anterior, precio_nuevo, cambio_por) VALUES (?, ?, ?, ?)',
            [req.params.id, precioAnterior, precioFinal, 'admin']
          );
        }
        sincronizarPrecioWeb({ nombre, categoria, precio: precioFinal, precio_base: precioFinal }, (syncErr) => {
          if (syncErr) return res.status(500).json({ error: syncErr.message });
          res.json({ mensaje: '✅ Servicio actualizado' });
        });
      });
    });
  });

  // DESACTIVAR
  router.delete('/:id', (req, res) => {
    db.query('UPDATE servicios SET activo = FALSE WHERE id = ?', [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: '✅ Servicio desactivado' });
    });
  });

  // REACTIVAR
  router.patch('/:id/reactivar', (req, res) => {
    db.query('UPDATE servicios SET activo = TRUE WHERE id = ?', [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: '✅ Servicio reactivado' });
    });
  });

  return router;
};
 + Math.round(numero).toLocaleString('es-AR');
  }

  function asegurarTablaPreciosWeb(callback) {
    db.query(`CREATE TABLE IF NOT EXISTS web_prices (
      id TEXT PRIMARY KEY,
      price TEXT DEFAULT '',
      price_note TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`, callback);
  }

  function sincronizarPrecioWeb(servicio, callback = () => {}) {
    const ids = idsWebParaServicio(servicio);
    if (!ids.length) return callback();

    asegurarTablaPreciosWeb((tableErr) => {
      if (tableErr) return callback(tableErr);

      const price = formatoPrecioWeb(servicio.precio ?? servicio.precio_base);
      const priceNote = notaWebParaServicio(servicio);
      let pendientes = ids.length;
      let primerError = null;

      ids.forEach((id, index) => {
        db.query(
          `INSERT INTO web_prices (id, price, price_note, sort_order)
           VALUES (?, ?, ?, ?)
           ON CONFLICT (id) DO UPDATE SET
             price = EXCLUDED.price,
             price_note = EXCLUDED.price_note,
             updated_at = CURRENT_TIMESTAMP`,
          [id, price, priceNote, index],
          (err) => {
            if (err && !primerError) primerError = err;
            pendientes -= 1;
            if (pendientes === 0) callback(primerError);
          }
        );
      });
    });
  }

  function sincronizarPreciosWeb(servicios, callback = () => {}) {
    const pendientes = (servicios || []).filter((servicio) => idsWebParaServicio(servicio).length > 0);
    if (!pendientes.length) return callback();

    let restantes = pendientes.length;
    let primerError = null;
    pendientes.forEach((servicio) => {
      sincronizarPrecioWeb(servicio, (err) => {
        if (err && !primerError) primerError = err;
        restantes -= 1;
        if (restantes === 0) callback(primerError);
      });
    });
  }

  function validarClavePrecio(req, res) {
    const clave = req.body?.password_precio || req.body?.clave_precio || req.body?.precio_password || '';
    const claveNormalizada = String(clave).trim().toLowerCase();
    const claveEsperada = String(PRICE_ADMIN_PASSWORD).trim().toLowerCase();
    if (claveNormalizada !== claveEsperada) {
      res.status(401).json({ error: 'Contraseña incorrecta para modificar precios' });
      return false;
    }
    return true;
  }

  // GET TODOS
  router.get('/', (req, res) => {
    db.query('SELECT * FROM servicios ORDER BY categoria, nombre', (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results || []);
    });
  });

  // GET ACTIVOS
  router.get('/activos/true', (req, res) => {
    db.query('SELECT * FROM servicios WHERE activo = TRUE ORDER BY categoria, nombre', (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results || []);
    });
  });

  // AUMENTO GENERAL DE PRECIOS — debe ir ANTES de /:id
  router.put('/precio/aumento', (req, res) => {
    if (!validarClavePrecio(req, res)) return;
    const { porcentaje } = req.body;
    if (!porcentaje || porcentaje <= 0) {
      return res.status(400).json({ error: 'Porcentaje debe ser mayor a 0' });
    }
    const factor = 1 + Number(porcentaje) / 100;
    const sql = 'UPDATE servicios SET precio = ROUND(precio * ?, 0) WHERE activo = TRUE';
    db.query(sql, [factor], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: `✅ Aumento de ${porcentaje}% aplicado a ${result.affectedRows} servicios` });
    });
  });

  // GET POR ID
  router.get('/:id', (req, res) => {
    db.query('SELECT * FROM servicios WHERE id = ?', [req.params.id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!results.length) return res.status(404).json({ error: 'Servicio no encontrado' });
      res.json(results[0]);
    });
  });

  // CREAR
  router.post('/', (req, res) => {
    const { nombre, descripcion, precio, precio_base, duracion_minutos, categoria } = req.body;
    const precioFinal = precio || precio_base;
    if (!nombre || !precioFinal) {
      return res.status(400).json({ error: 'Nombre y precio son obligatorios' });
    }
    const sql = 'INSERT INTO servicios (nombre, descripcion, precio, duracion_minutos, categoria) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [nombre, descripcion || null, precioFinal, duracion_minutos || 60, categoria || null], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ya existe un servicio con ese nombre' });
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ mensaje: '✅ Servicio creado', id: result.insertId });
    });
  });

  // ACTUALIZAR
  router.put('/:id', (req, res) => {
    if (!validarClavePrecio(req, res)) return;
    const { nombre, descripcion, precio, precio_base, duracion_minutos, categoria, activo } = req.body;
    const precioFinal = precio || precio_base;

    // Guardar historial si cambió el precio
    db.query('SELECT precio FROM servicios WHERE id = ?', [req.params.id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!results.length) return res.status(404).json({ error: 'No encontrado' });

      const precioAnterior = results[0].precio;
      const sql = 'UPDATE servicios SET nombre=?, descripcion=?, precio=?, duracion_minutos=?, categoria=?, activo=? WHERE id=?';

      db.query(sql, [
        nombre, descripcion || null, precioFinal,
        duracion_minutos || 60, categoria || null,
        activo !== undefined ? activo : true,
        req.params.id
      ], (err) => {
        if (err) return res.status(500).json({ error: err.message });

        if (precioAnterior !== precioFinal) {
          db.query(
            'INSERT INTO historial_precios (servicio_id, precio_anterior, precio_nuevo, cambio_por) VALUES (?, ?, ?, ?)',
            [req.params.id, precioAnterior, precioFinal, 'admin']
          );
        }
        res.json({ mensaje: '✅ Servicio actualizado' });
      });
    });
  });

  // DESACTIVAR
  router.delete('/:id', (req, res) => {
    db.query('UPDATE servicios SET activo = FALSE WHERE id = ?', [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: '✅ Servicio desactivado' });
    });
  });

  // REACTIVAR
  router.patch('/:id/reactivar', (req, res) => {
    db.query('UPDATE servicios SET activo = TRUE WHERE id = ?', [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: '✅ Servicio reactivado' });
    });
  });

  return router;
};
