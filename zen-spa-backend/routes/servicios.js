// routes/servicios.js
module.exports = function createServiciosRouter(db) {
  const express = require('express');
  const router = express.Router();
  const PRICE_ADMIN_PASSWORD = process.env.PRICE_ADMIN_PASSWORD || 'admin1234';

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

  function normalizarTexto(valor) {
    return String(valor || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  async function ensureCatalogoServicios() {
    const servicios = (await db.query('SELECT * FROM servicios')) || [];
    const buscar = (predicado) => servicios.find((servicio) =>
      predicado(normalizarTexto(servicio.nombre), normalizarTexto(servicio.categoria), servicio)
    );

    const banoSimple = buscar((nombre) => nombre === 'bano simple');
    if (banoSimple) {
      await db.query(
        'UPDATE servicios SET nombre = ?, descripcion = ?, categoria = ? WHERE id = ?',
        [
          'Baño + limpieza de orejas + cortes de uñas',
          'Baño completo con limpieza de orejas y cortes de uñas',
          'peluqueria',
          banoSimple.id,
        ]
      );
      banoSimple.nombre = 'Baño + limpieza de orejas + cortes de uñas';
      banoSimple.descripcion = 'Baño completo con limpieza de orejas y cortes de uñas';
      banoSimple.categoria = 'peluqueria';
    }

    const peluqueriaCaninaExistente = buscar((nombre) => nombre === 'peluqueria canina');
    const peluqueriaBase = buscar((nombre, categoria) =>
      !peluqueriaCaninaExistente &&
      categoria.includes('peluqueria') &&
      (nombre.includes('peluqueria simple') || nombre.includes('peluqueria basica'))
    );
    const caninaTemplate = peluqueriaCaninaExistente || peluqueriaBase || buscar((nombre, categoria) => categoria.includes('peluqueria'));

    if (peluqueriaBase) {
      await db.query(
        'UPDATE servicios SET nombre = ?, descripcion = ?, categoria = ? WHERE id = ?',
        ['Peluquería Canina', peluqueriaBase.descripcion || 'Baño y arreglo para perros', 'peluqueria', peluqueriaBase.id]
      );
      peluqueriaBase.nombre = 'Peluquería Canina';
      peluqueriaBase.categoria = 'peluqueria';
    }

    const peluqueriaFelina = buscar((nombre) => nombre === 'peluqueria felina');
    if (!peluqueriaFelina) {
      await db.query(
        'INSERT INTO servicios (nombre, descripcion, precio, duracion_minutos, categoria, activo) VALUES (?, ?, ?, ?, ?, TRUE)',
        [
          'Peluquería Felina',
          'Baño y arreglo para gatos',
          Number(caninaTemplate?.precio || 0),
          Number(caninaTemplate?.duracion_minutos || 120),
          'peluqueria',
        ]
      );
    }

    const guarderiaCanina = buscar((nombre) => nombre === 'guarderia canina');
    const guarderiaFelina = buscar((nombre) => nombre === 'guarderia felina');
    if (!guarderiaFelina) {
      await db.query(
        'INSERT INTO servicios (nombre, descripcion, precio, duracion_minutos, categoria, activo) VALUES (?, ?, ?, ?, ?, TRUE)',
        [
          'Guarderia Felina',
          'Cuidado y estadía para gatos',
          Number(guarderiaCanina?.precio || 0),
          Number(guarderiaCanina?.duracion_minutos || 480),
          'guarderia',
        ]
      );
    }
  }


  // GET TODOS
  router.get('/', async (req, res) => {
    try {
      await ensureCatalogoServicios();
      const results = await db.query('SELECT * FROM servicios ORDER BY categoria, nombre');
      res.json(results || []);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET ACTIVOS
  router.get('/activos/true', async (req, res) => {
    try {
      await ensureCatalogoServicios();
      const results = await db.query('SELECT * FROM servicios WHERE activo = TRUE ORDER BY categoria, nombre');
      res.json(results || []);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
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
