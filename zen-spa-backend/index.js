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
    console.error('Error conectando a MySQL:', err.message);
  } else {
    console.log('Conectado a MySQL correctamente');
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

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log('Servidor corriendo en http://localhost:' + PORT);

  const runJob = () => {
    runRecordatoriosJob(db)
      .then((result) => {
        if (result.creados > 0) {
          console.log(`Recordatorios 24h generados: ${result.creados}`);
        }
      })
      .catch((err) => console.error('Job recordatorios:', err.message));
  };

  runJob();
  setInterval(runJob, 60 * 60 * 1000);
});
