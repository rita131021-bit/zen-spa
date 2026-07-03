const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads', 'resultados');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'resultado-' + Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 6 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Formato de imagen no permitido. Usa JPG, PNG, WEBP o GIF.'));
  },
});

module.exports = function createDogsRouter(db) {
  const router = express.Router();
  let schemaReady = false;
  let schemaCreating = false;
  const schemaQueue = [];

  function ensureSchema(done = () => {}) {
    if (schemaReady) return done();
    schemaQueue.push(done);
    if (schemaCreating) return;
    schemaCreating = true;
    db.query('CREATE TABLE IF NOT EXISTS resultados_antes_despues (id SERIAL PRIMARY KEY, name VARCHAR(120) NOT NULL, service VARCHAR(180) NOT NULL, emoji VARCHAR(12) DEFAULT '🐾', antes TEXT NOT NULL, despues TEXT NOT NULL, combined TEXT, data_url_antes TEXT, data_url_despues TEXT, activo BOOLEAN DEFAULT TRUE, creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP)', [], (err) => {
      schemaCreating = false;
      if (err) console.error('No se pudo verificar resultados_antes_despues:', err.message);
      else schemaReady = true;
      const callbacks = schemaQueue.splice(0);
      callbacks.forEach((callback) => callback(err));
    });
  }

  function fileToDataUrl(file) {
    try {
      return 'data:' + file.mimetype + ';base64,' + fs.readFileSync(file.path).toString('base64');
    } catch (err) {
      console.error('No se pudo respaldar foto de resultado:', err.message);
      return null;
    }
  }

  router.get('/fotos/:filename', (req, res, next) => {
    ensureSchema((schemaErr) => {
      if (schemaErr) return res.status(500).json({ error: schemaErr.message });
      const filename = path.basename(req.params.filename || '');
      const filepath = path.join(uploadDir, filename);
      if (fs.existsSync(filepath)) return res.sendFile(filepath);
      const url = '/api/dogs/fotos/' + filename;
      db.query('SELECT data_url_antes, data_url_despues FROM resultados_antes_despues WHERE antes = ? OR despues = ? LIMIT 1', [url, url], (err, rows) => {
        if (err) return next(err);
        const row = rows && rows[0];
        const dataUrl = row && (row.data_url_antes || row.data_url_despues);
        const match = typeof dataUrl === 'string' ? dataUrl.match(/^data:([^;]+);base64,(.+)$/) : null;
        if (!match) return res.status(404).json({ error: 'Foto no encontrada' });
        res.setHeader('Content-Type', match[1]);
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        return res.send(Buffer.from(match[2], 'base64'));
      });
    });
  });

  router.use('/fotos', express.static(uploadDir));

  router.get('/', (req, res) => {
    ensureSchema((schemaErr) => {
      if (schemaErr) return res.status(500).json({ error: schemaErr.message });
      db.query('SELECT id, name, service, emoji, antes, despues, combined, creado_en FROM resultados_antes_despues WHERE activo = TRUE ORDER BY creado_en DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
      });
    });
  });

  router.post('/', upload.fields([{ name: 'antes', maxCount: 1 }, { name: 'despues', maxCount: 1 }]), (req, res) => {
    ensureSchema((schemaErr) => {
      if (schemaErr) return res.status(500).json({ error: schemaErr.message });
      const name = String((req.body && (req.body.name || req.body.nombre)) || '').trim();
      const service = String((req.body && (req.body.service || req.body.servicio)) || '').trim();
      const emoji = String((req.body && req.body.emoji) || '🐾').trim() || '🐾';
      const antesFile = req.files && req.files.antes && req.files.antes[0];
      const despuesFile = req.files && req.files.despues && req.files.despues[0];
      if (!name || !service || !antesFile || !despuesFile) return res.status(400).json({ error: 'Nombre, servicio, foto antes y foto después son obligatorios' });
      const antes = '/api/dogs/fotos/' + antesFile.filename;
      const despues = '/api/dogs/fotos/' + despuesFile.filename;
      db.query('INSERT INTO resultados_antes_despues (name, service, emoji, antes, despues, data_url_antes, data_url_despues) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id', [name, service, emoji, antes, despues, fileToDataUrl(antesFile), fileToDataUrl(despuesFile)], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        const id = result && (result.insertId || (result.rows && result.rows[0] && result.rows[0].id) || (result[0] && result[0].id));
        res.status(201).json({ id, name, service, emoji, antes, despues });
      });
    });
  });

  router.delete('/:id', (req, res) => {
    ensureSchema((schemaErr) => {
      if (schemaErr) return res.status(500).json({ error: schemaErr.message });
      db.query('SELECT antes, despues FROM resultados_antes_despues WHERE id = ?', [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!rows.length) return res.status(404).json({ error: 'Resultado no encontrado' });
        db.query('DELETE FROM resultados_antes_despues WHERE id = ?', [req.params.id], (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });
          [rows[0].antes, rows[0].despues].forEach((url) => fs.unlink(path.join(uploadDir, path.basename(url || '')), () => {}));
          res.json({ mensaje: 'Resultado eliminado' });
        });
      });
    });
  });

  return router;
};
