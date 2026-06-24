const fs = require('fs');
const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const { createDatabase } = require('./database');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://127.0.0.1:3000,http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origen no permitido por CORS'));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

const db = createDatabase();

db.getConnection((err, connection) => {
  if (err) {
    console.error('Error conectando a PostgreSQL:', err.message);
  } else {
    console.log('Conectado a PostgreSQL correctamente');
    connection.release();
  }
});

const turnosRouter = require('./routes/turnos');
const disponibilidadRouter = require('./routes/disponibilidad');
const bloqueoRouter = require('./routes/bloqueos');
const clientesRouter = require('./routes/clientes');
const mascotasRouter = require('./routes/mascotas');
const serviciosRouter = require('./routes/servicios');
const descuentosRouter = require('./routes/descuentos');
const finanzasRouter = require('./routes/finanzas');
const profesionalesRouter = require('./routes/profesionales');
const canilRouter = require('./routes/caniles');
const estadisticasRouter = require('./routes/estadisticas');
const horariosRouter = require('./routes/horarios');
const recordatoriosRouter = require('./routes/recordatorios');
const createChatRouter = require('./routes/chat');
const giftCardsRouter = require('./routes/giftcards');
const resenasRouter = require('./routes/resenas');
const { runRecordatoriosJob } = require('./services/recordatoriosJob');

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials: true },
});

createChatRouter.setupSocket(io, db);

app.use('/api/turnos', turnosRouter(db));
app.use('/api/disponibilidad', disponibilidadRouter(db));
app.use('/api/bloqueos', bloqueoRouter(db));
app.use('/api/clientes', clientesRouter(db));
app.use('/api/mascotas', mascotasRouter(db));
app.use('/api/servicios', serviciosRouter(db));
app.use('/api/descuentos', descuentosRouter(db));
app.use('/api/finanzas', finanzasRouter(db));
app.use('/api/profesionales', profesionalesRouter(db));
app.use('/api/caniles', canilRouter(db));
app.use('/api/estadisticas', estadisticasRouter(db));
app.use('/api/horarios', horariosRouter(db));
app.use('/api/recordatorios', recordatoriosRouter(db));
app.use('/api/chat', createChatRouter(db, io));
app.use('/api/giftcards', giftCardsRouter(db));
app.use('/api/resenas', resenasRouter(db));

// Health check
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1 AS database_ok');
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: 'error', database: 'disconnected', error: error.message });
  }
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en http://127.0.0.1:${PORT}`);
  console.log('\n📋 APIs disponibles:');
  console.log('   GET  /api/clientes');
  console.log('   POST /api/clientes');
  console.log('   GET  /api/mascotas');
  console.log('   POST /api/mascotas');
  console.log('   GET  /api/servicios');
  console.log('   POST /api/servicios');
  console.log('   GET  /api/profesionales');
  console.log('   GET  /api/caniles');
  console.log('   GET  /api/turnos');
  console.log('   POST /api/turnos');
  console.log('   PUT  /api/turnos/:id');
  console.log('   GET  /api/disponibilidad?fecha=2026-06-10');
  console.log('   GET  /api/bloqueos');
  console.log('   POST /api/bloqueos');
  console.log('   GET  /health\n');

  const runJob = () => {
    runRecordatoriosJob(db)
      .then((result) => {
        if (result.creados > 0) {
          console.log(`📧 Recordatorios 24h generados: ${result.creados}`);
        }
      })
      .catch((err) => console.error('Job recordatorios:', err.message));
  };

  runJob();
  setInterval(runJob, 60 * 60 * 1000);
});
