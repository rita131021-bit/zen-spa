const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads', 'resenas');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `resena-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB por foto
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Formato de imagen no permitido. Usa JPG, PNG, WEBP o GIF.'));
  },
});

module.exports = function createResenasRouter(db) {
  const router = express.Router();

  // Servir las fotos estáticamente
  router.use('/fotos', express.static(uploadDir));

  // ---------------------------------------------------------------------
  // PÚBLICO — usado desde la web de Replit
  // ---------------------------------------------------------------------

  // Crear nueva reseña (con hasta 5 fotos)
  router.post('/', upload.array('fotos', 5), (req, res) => {
    const { nombre_cliente, email, calificacion, comentario, cliente_id } = req.body;

    if (!nombre_cliente || !calificacion || !comentario) {
      return res.status(400).json({ error: 'nombre_cliente, calificacion y comentario son obligatorios' });
    }
    const cal = Number(calificacion);
    if (cal < 1 || cal > 5) {
      return res.status(400).json({ error: 'calificacion debe ser entre 1 y 5' });
    }

    const sql = `INSERT INTO resenas (cliente_id, nombre_cliente, email, calificacion, comentario, estado)
                  VALUES (?, ?, ?, ?, ?, 'pendiente')`;

    db.query(sql, [cliente_id || null, nombre_cliente, email || null, cal, comentario], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      const resenaId = result.insertId;
      const files = req.files || [];

      if (files.length === 0) {
        return res.status(201).json({ mensaje: '✅ Reseña enviada, pendiente de aprobación', id: resenaId, fotos: [] });
      }

      const values = files.map((f, i) => [resenaId, `/api/resenas/fotos/${f.filename}`, i]);
      db.query('INSERT INTO resenas_fotos (resena_id, ruta_archivo, orden) VALUES ?', [values], (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.status(201).json({
          mensaje: '✅ Reseña enviada, pendiente de aprobación',
          id: resenaId,
          fotos: values.map((v) => v[1]),
        });
      });
    });
  });

  // Listar reseñas APROBADAS (para mostrar en la web pública)
  router.get('/publicas', (req, res) => {
    const sqlResenas = `
      SELECT r.id, r.nombre_cliente, r.calificacion, r.comentario, r.respuesta,
             r.destacada, r.creado_en
      FROM resenas r
      WHERE r.estado = 'aprobada'
      ORDER BY r.destacada DESC, r.creado_en DESC
    `;
    db.query(sqlResenas, (err, resenas) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!resenas.length) return res.json([]);

      const ids = resenas.map((r) => r.id);
      db.query('SELECT resena_id, ruta_archivo, orden FROM resenas_fotos WHERE resena_id IN (?) ORDER BY orden', [ids], (err2, fotos) => {
        if (err2) return res.status(500).json({ error: err2.message });
        const fotosMap = {};
        for (const f of fotos) {
          (fotosMap[f.resena_id] = fotosMap[f.resena_id] || []).push(f.ruta_archivo);
        }
        res.json(resenas.map((r) => ({ ...r, fotos: fotosMap[r.id] || [] })));
      });
    });
  });

  // ---------------------------------------------------------------------
  // ADMIN — panel administrativo
  // ---------------------------------------------------------------------

  // Listar TODAS las reseñas (con filtro opcional por estado)
  router.get('/', (req, res) => {
    const { estado } = req.query;
    let sql = `
      SELECT r.*, c.nombre as cliente_nombre
      FROM resenas r
      LEFT JOIN clientes c ON r.cliente_id = c.id
    `;
    const params = [];
    if (estado) {
      sql += ' WHERE r.estado = ?';
      params.push(estado);
    }
    sql += ' ORDER BY r.creado_en DESC';

    db.query(sql, params, (err, resenas) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!resenas.length) return res.json([]);

      const ids = resenas.map((r) => r.id);
      db.query('SELECT resena_id, id as foto_id, ruta_archivo, orden FROM resenas_fotos WHERE resena_id IN (?) ORDER BY orden', [ids], (err2, fotos) => {
        if (err2) return res.status(500).json({ error: err2.message });
        const fotosMap = {};
        for (const f of fotos) {
          (fotosMap[f.resena_id] = fotosMap[f.resena_id] || []).push({ id: f.foto_id, ruta: f.ruta_archivo });
        }
        res.json(resenas.map((r) => ({ ...r, fotos: fotosMap[r.id] || [] })));
      });
    });
  });

  // Resumen / métricas
  router.get('/resumen', (req, res) => {
    const sql = `
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE estado = 'pendiente') as pendientes,
        COUNT(*) FILTER (WHERE estado = 'aprobada') as aprobadas,
        COUNT(*) FILTER (WHERE estado = 'rechazada') as rechazadas,
        ROUND(AVG(CASE WHEN estado = 'aprobada' THEN calificacion END), 2) as promedio,
        COUNT(*) FILTER (WHERE destacada) as destacadas
      FROM resenas
    `;
    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results[0]);
    });
  });

  // Aprobar
  router.patch('/:id/aprobar', (req, res) => {
    db.query("UPDATE resenas SET estado = 'aprobada' WHERE id = ?", [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: '✅ Reseña aprobada' });
    });
  });

  // Rechazar
  router.patch('/:id/rechazar', (req, res) => {
    db.query("UPDATE resenas SET estado = 'rechazada' WHERE id = ?", [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: '✅ Reseña rechazada' });
    });
  });

  // Volver a pendiente
  router.patch('/:id/pendiente', (req, res) => {
    db.query("UPDATE resenas SET estado = 'pendiente' WHERE id = ?", [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: '✅ Reseña vuelta a pendiente' });
    });
  });

  // Destacar / quitar destacado
  router.patch('/:id/destacar', (req, res) => {
    const { destacada } = req.body;
    db.query('UPDATE resenas SET destacada = ? WHERE id = ?', [Boolean(destacada), req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: destacada ? '⭐ Reseña destacada' : 'Reseña ya no destacada' });
    });
  });

  // Editar texto del comentario
  router.put('/:id', (req, res) => {
    const { comentario, calificacion, nombre_cliente } = req.body;
    const fields = [];
    const values = [];
    if (comentario !== undefined)     { fields.push('comentario = ?');     values.push(comentario); }
    if (calificacion !== undefined)   { fields.push('calificacion = ?');   values.push(Number(calificacion)); }
    if (nombre_cliente !== undefined) { fields.push('nombre_cliente = ?'); values.push(nombre_cliente); }

    if (!fields.length) return res.status(400).json({ error: 'Nada para actualizar' });

    values.push(req.params.id);
    db.query(`UPDATE resenas SET ${fields.join(', ')} WHERE id = ?`, values, (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: '✅ Reseña actualizada' });
    });
  });

  // Responder a la reseña (respuesta pública del negocio)
  router.put('/:id/respuesta', (req, res) => {
    const { respuesta } = req.body;
    db.query('UPDATE resenas SET respuesta = ? WHERE id = ?', [respuesta || null, req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: '✅ Respuesta guardada' });
    });
  });

  // Eliminar una foto individual
  router.delete('/fotos/:fotoId', (req, res) => {
    db.query('SELECT ruta_archivo FROM resenas_fotos WHERE id = ?', [req.params.fotoId], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!results.length) return res.status(404).json({ error: 'Foto no encontrada' });

      const filename = path.basename(results[0].ruta_archivo);
      const filepath = path.join(uploadDir, filename);

      db.query('DELETE FROM resenas_fotos WHERE id = ?', [req.params.fotoId], (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });
        fs.unlink(filepath, () => {}); // borrar archivo, ignorar error si no existe
        res.json({ mensaje: '✅ Foto eliminada' });
      });
    });
  });

  // Eliminar reseña completa (y sus fotos)
  router.delete('/:id', (req, res) => {
    db.query('SELECT ruta_archivo FROM resenas_fotos WHERE resena_id = ?', [req.params.id], (err, fotos) => {
      if (err) return res.status(500).json({ error: err.message });

      db.query('DELETE FROM resenas WHERE id = ?', [req.params.id], (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });
        for (const f of fotos) {
          fs.unlink(path.join(uploadDir, path.basename(f.ruta_archivo)), () => {});
        }
        res.json({ mensaje: '✅ Reseña eliminada' });
      });
    });
  });

  return router;
};
