const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads', 'galeria');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `galeria-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
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

module.exports = function createGalleryRouter(db) {
  const router = express.Router();
  let schemaReady = false;

  function ensureSchema() {
    if (schemaReady) return;
    db.query(`CREATE TABLE IF NOT EXISTS galeria_fotos (
      id SERIAL PRIMARY KEY,
      url TEXT NOT NULL,
      titulo VARCHAR(120),
      orden INTEGER DEFAULT 0,
      activa BOOLEAN DEFAULT TRUE,
      data_url TEXT,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`, [], (err) => {
      if (err) console.error('No se pudo verificar galeria_fotos:', err.message);
    });
    schemaReady = true;
  }

  ensureSchema();

  router.get('/fotos/:filename', (req, res, next) => {
    ensureSchema();
    const filename = path.basename(req.params.filename || '');
    const filepath = path.join(uploadDir, filename);

    if (fs.existsSync(filepath)) return res.sendFile(filepath);

    const url = `/api/gallery/fotos/${filename}`;
    db.query('SELECT data_url FROM galeria_fotos WHERE url = ? LIMIT 1', [url], (err, rows) => {
      if (err) return next(err);
      const dataUrl = rows?.[0]?.data_url;
      const match = typeof dataUrl === 'string' ? dataUrl.match(/^data:([^;]+);base64,(.+)$/) : null;
      if (!match) return res.status(404).json({ error: 'Foto no encontrada' });

      res.setHeader('Content-Type', match[1]);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.send(Buffer.from(match[2], 'base64'));
    });
  });

  router.use('/fotos', express.static(uploadDir));

  router.get('/', (req, res) => {
    ensureSchema();
    db.query('SELECT id, url, titulo, orden, creado_en FROM galeria_fotos WHERE activa = TRUE ORDER BY orden ASC, creado_en DESC', [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows || []);
    });
  });

  router.post('/', upload.single('foto'), (req, res) => {
    ensureSchema();
    if (!req.file) return res.status(400).json({ error: 'La foto es obligatoria' });

    const titulo = String(req.body?.titulo || '').trim() || null;
    const orden = Number(req.body?.orden || 0);
    const url = `/api/gallery/fotos/${req.file.filename}`;
    let dataUrl = null;

    try {
      dataUrl = `data:${req.file.mimetype};base64,${fs.readFileSync(req.file.path).toString('base64')}`;
    } catch (err) {
      console.error('No se pudo respaldar foto de galería:', err.message);
    }

    db.query('INSERT INTO galeria_fotos (url, titulo, orden, data_url) VALUES (?, ?, ?, ?) RETURNING id', [url, titulo, orden, dataUrl], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      const id = result?.insertId || result?.rows?.[0]?.id || result?.[0]?.id;
      res.status(201).json({ id, url, titulo, orden });
    });
  });

  router.delete('/:id', (req, res) => {
    ensureSchema();
    db.query('SELECT url FROM galeria_fotos WHERE id = ?', [req.params.id], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!rows.length) return res.status(404).json({ error: 'Foto no encontrada' });

      const filename = path.basename(rows[0].url || '');
      const filepath = path.join(uploadDir, filename);

      db.query('DELETE FROM galeria_fotos WHERE id = ?', [req.params.id], (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });
        fs.unlink(filepath, () => {});
        res.json({ mensaje: 'Foto eliminada' });
      });
    });
  });

  return router;
};
