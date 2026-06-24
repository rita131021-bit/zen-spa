const { Pool, types } = require('pg');

types.setTypeParser(20, (value) => Number(value));
types.setTypeParser(1700, (value) => Number(value));
types.setTypeParser(1082, (value) => value);
types.setTypeParser(1083, (value) => value);

function compileQuery(sql, params) {
  const values = [];
  let paramIndex = 0;
  let quote = null;
  let text = '';

  for (let i = 0; i < sql.length; i += 1) {
    const char = sql[i];
    if (quote) {
      text += char;
      if (char === quote && sql[i - 1] !== '\\') quote = null;
      continue;
    }
    if (char === "'" || char === '"') {
      quote = char;
      text += char;
      continue;
    }
    if (char !== '?') {
      text += char;
      continue;
    }

    const value = params[paramIndex];
    paramIndex += 1;
    if (Array.isArray(value) && Array.isArray(value[0])) {
      text += value.map((row) => `(${row.map((item) => {
        values.push(item);
        return `$${values.length}`;
      }).join(', ')})`).join(', ');
    } else if (Array.isArray(value)) {
      text += value.map((item) => {
        values.push(item);
        return `$${values.length}`;
      }).join(', ');
    } else {
      values.push(value);
      text += `$${values.length}`;
    }
  }

  if (paramIndex !== params.length) {
    throw new Error(`Cantidad incorrecta de parametros SQL: esperados ${paramIndex}, recibidos ${params.length}`);
  }
  if (/^\s*insert\s+into\b/i.test(text) && !/\breturning\b/i.test(text)) {
    text = `${text.replace(/;\s*$/, '')} RETURNING id`;
  }
  return { text, values };
}

function normalizeResult(result) {
  if (result.command === 'SELECT' || result.command === 'SHOW') return result.rows;
  return {
    insertId: result.rows[0]?.id,
    affectedRows: result.rowCount,
    rows: result.rows,
  };
}

function createDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error('Falta la variable de entorno DATABASE_URL de Supabase');
  }
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
    max: Number(process.env.DB_POOL_MAX || 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
  pool.on('error', (error) => console.error('Error inesperado del pool PostgreSQL:', error.message));

  return {
    query(sql, params, callback) {
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }
      const promise = Promise.resolve()
        .then(() => compileQuery(sql, params || []))
        .then((query) => pool.query(query))
        .then(normalizeResult);
      if (callback) {
        promise.then((result) => callback(null, result)).catch((error) => callback(error));
        return undefined;
      }
      return promise;
    },
    getConnection(callback) {
      pool.connect()
        .then((client) => callback(null, { release: () => client.release() }))
        .catch((error) => callback(error));
    },
    close() {
      return pool.end();
    },
  };
}

module.exports = { createDatabase, compileQuery };
