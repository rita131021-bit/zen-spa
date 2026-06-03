const mysql = require('mysql2/promise');

const config = {
  host: 'localhost',
  user: 'root',
  password: 'admin1234',
  database: 'zen_spa',
};

async function columnExists(db, table, column) {
  const [rows] = await db.query(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?
     LIMIT 1`,
    [table, column]
  );
  return rows.length > 0;
}

async function indexExists(db, table, indexName) {
  const [rows] = await db.query(
    `SELECT 1
     FROM information_schema.statistics
     WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?
     LIMIT 1`,
    [table, indexName]
  );
  return rows.length > 0;
}

async function ensureIndex(db, table, indexName, columns) {
  if (!(await indexExists(db, table, indexName))) {
    await db.query(`CREATE INDEX ${indexName} ON ${table} (${columns})`);
  }
}

async function seedIfMissing(db, table, whereColumn, whereValue, insertSql, params) {
  const [rows] = await db.query(`SELECT 1 FROM ${table} WHERE ${whereColumn} = ? LIMIT 1`, [whereValue]);
  if (rows.length === 0) {
    await db.query(insertSql, params);
  }
}

async function main() {
  const db = await mysql.createConnection(config);

  await db.query(`
    CREATE TABLE IF NOT EXISTS caniles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(80) NOT NULL,
      descripcion VARCHAR(255) NULL,
      activo TINYINT(1) DEFAULT 1,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS feriados (
      id INT AUTO_INCREMENT PRIMARY KEY,
      fecha DATE NOT NULL UNIQUE,
      nombre VARCHAR(120) NOT NULL,
      tipo VARCHAR(60) DEFAULT 'Nacional',
      no_laborable TINYINT(1) DEFAULT 1,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  if (!(await columnExists(db, 'turnos', 'canil_id'))) {
    await db.query('ALTER TABLE turnos ADD COLUMN canil_id INT NULL AFTER profesional_id');
  }

  if (!(await columnExists(db, 'servicios', 'requiere_canil'))) {
    await db.query('ALTER TABLE servicios ADD COLUMN requiere_canil TINYINT(1) DEFAULT 0 AFTER activo');
  }

  await ensureIndex(db, 'turnos', 'idx_turnos_fecha_hora', 'fecha, hora');
  await ensureIndex(db, 'turnos', 'idx_turnos_profesional', 'profesional_id, fecha, hora');
  await ensureIndex(db, 'turnos', 'idx_turnos_canil', 'canil_id, fecha, hora');

  await seedIfMissing(db, 'caniles', 'nombre', 'Canil 1', 'INSERT INTO caniles (nombre, descripcion, activo) VALUES (?, ?, ?)', ['Canil 1', 'Canil principal', 1]);
  await seedIfMissing(db, 'caniles', 'nombre', 'Canil 2', 'INSERT INTO caniles (nombre, descripcion, activo) VALUES (?, ?, ?)', ['Canil 2', 'Canil mediano', 1]);
  await seedIfMissing(db, 'caniles', 'nombre', 'Canil 3', 'INSERT INTO caniles (nombre, descripcion, activo) VALUES (?, ?, ?)', ['Canil 3', 'Canil chico', 1]);

  const holidays = [
    ['2026-01-01', 'Ano Nuevo'],
    ['2026-03-24', 'Dia Nacional de la Memoria'],
    ['2026-04-02', 'Dia del Veterano y de los Caidos en Malvinas'],
    ['2026-05-01', 'Dia del Trabajador'],
    ['2026-05-25', 'Dia de la Revolucion de Mayo'],
    ['2026-07-09', 'Dia de la Independencia'],
    ['2026-12-25', 'Navidad'],
  ];

  for (const [fecha, nombre] of holidays) {
    await seedIfMissing(
      db,
      'feriados',
      'fecha',
      fecha,
      'INSERT INTO feriados (fecha, nombre, tipo, no_laborable) VALUES (?, ?, ?, ?)',
      [fecha, nombre, 'Nacional', 1]
    );
  }

  await db.end();
  console.log('Migracion de disponibilidad aplicada correctamente');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
