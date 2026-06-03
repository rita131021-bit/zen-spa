const http = require('http');
const fs = require('fs');
const path = require('path');
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'admin1234',
  database: 'zen_spa',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

function runMigrations() {
  const filePath = path.join(__dirname, 'migrations', '2026-06-03-chat-recordatorios.sql');
  if (!fs.existsSync(filePath)) return;

  const sql = fs.readFileSync(filePath, 'utf8');
  const statements = sql
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean);

  statements.forEach((statement) => {
    db.query(statement, (err) => {
      if (err && !/already exists|Duplicate/i.test(err.message)) {
        console.error('Migracion:', err.message);
      }
    });
  });
}

db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Error conectando a MySQL:', err.message);
  } else {
    console.log('✅ Conectado a MySQL correctamente');
    connection.release();
    runMigrations();
  }
});

const turnosRouter = require('./routes/turnos');
const disponibilidadRouter = require('./routes/disponibilidad');
const bloqueoRouter = require('./routes/bloqueos');
const clientesRouter = require('./routes/clientes');
const mascotasRouter = require('./routes/mascotas');
const serviciosRouter = require('./routes/servicios');
const profesionalesRouter = require('./routes/profesionales');
const canilRouter = require('./routes/caniles');
const estadisticasRouter = require('./routes/estadisticas');
const horariosRouter = require('./routes/horarios');
const recordatoriosRouter = require('./routes/recordatorios');
const createChatRouter = require('./routes/chat');
const { runRecordatoriosJob } = require('./services/recordatoriosJob');

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

createChatRouter.setupSocket(io, db);

app.use('/api/turnos', turnosRouter(db));
app.use('/api/disponibilidad', disponibilidadRouter(db));
app.use('/api/bloqueos', bloqueoRouter(db));
app.use('/api/clientes', clientesRouter(db));
app.use('/api/mascotas', mascotasRouter(db));
app.use('/api/servicios', serviciosRouter(db));
app.use('/api/profesionales', profesionalesRouter(db));
app.use('/api/caniles', canilRouter(db));
app.use('/api/estadisticas', estadisticasRouter(db));
app.use('/api/horarios', horariosRouter(db));
app.use('/api/recordatorios', recordatoriosRouter(db));
app.use('/api/chat', createChatRouter(db, io));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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

server.listen(PORT, '127.0.0.1', () => {
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
