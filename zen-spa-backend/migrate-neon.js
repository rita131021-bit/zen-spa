const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = 'postgresql://neondb_owner:npg_K1f9erCtvoBR@ep-lucky-darkness-ay3vi0r2-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function migrate() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    console.log('🔗 Conectando a Neon...');
    await client.connect();
    console.log('✅ Conectado exitosamente a Neon');

    console.log('📖 Leyendo el schema SQL...');
    const schemaPath = path.join(__dirname, 'migrations', 'pg-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('🚀 Ejecutando schema SQL...');
    await client.query(schema);
    console.log('✅ Schema ejecutado exitosamente');

    console.log('🎉 Migración completada!');
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Conexión cerrada');
  }
}

migrate().catch(console.error);