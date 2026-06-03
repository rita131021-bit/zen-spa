#!/usr/bin/env node

/**
 * Script de Testing para Zen Spa Backend
 * Prueba todos los endpoints y validaciones del sistema
 * 
 * Uso: node scripts/test-routes.js
 */

const http = require('http');

const API_BASE = 'http://localhost:3001';

// Colores para console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

let testsPassed = 0;
let testsFailed = 0;

function log(type, message) {
  const prefix = {
    '✅': colors.green + '✅',
    '❌': colors.red + '❌',
    '⚠️': colors.yellow + '⚠️',
    'ℹ️': colors.blue + 'ℹ️',
  }[type] || type;
  console.log(`${prefix}${colors.reset} ${message}`);
}

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null,
          });
        } catch (err) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test(name, fn) {
  try {
    await fn();
    log('✅', name);
    testsPassed++;
  } catch (err) {
    log('❌', `${name}: ${err.message}`);
    testsFailed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function runTests() {
  console.log('\n' + colors.cyan + '🧪 INICIANDO TESTS DEL BACKEND ZEN SPA\n' + colors.reset);

  // ===== TESTS DE CLIENTES =====
  console.log(colors.blue + '📋 TESTS DE CLIENTES\n' + colors.reset);

  let clienteId;
  await test('GET /api/clientes - Obtener lista de clientes', async () => {
    const res = await request('GET', '/api/clientes');
    assert(res.status === 200, `Status ${res.status}`);
    assert(Array.isArray(res.body), 'Response is array');
    assert(res.body.length > 0, 'Hay clientes precargados');
  });

  await test('POST /api/clientes - Crear cliente', async () => {
    const res = await request('POST', '/api/clientes', {
      nombre: 'Cliente Test',
      whatsapp: '+5491234567890',
      email: 'test@example.com',
      direccion: 'Calle Test 123',
    });
    assert(res.status === 200, `Status ${res.status}`);
    assert(res.body.id, 'Cliente creado con ID');
    clienteId = res.body.id;
  });

  // ===== TESTS DE MASCOTAS =====
  console.log(colors.blue + '\n🐾 TESTS DE MASCOTAS\n' + colors.reset);

  let mascotaId;
  await test('GET /api/mascotas - Obtener lista de mascotas', async () => {
    const res = await request('GET', '/api/mascotas');
    assert(res.status === 200, `Status ${res.status}`);
    assert(Array.isArray(res.body), 'Response is array');
    assert(res.body.length > 0, 'Hay mascotas precargadas');
  });

  await test('POST /api/mascotas - Crear mascota', async () => {
    const res = await request('POST', '/api/mascotas', {
      cliente_id: clienteId,
      nombre: 'Perrito Test',
      especie: 'Perro',
      raza: 'Mestizo',
      peso: 15,
      sexo: 'Macho',
    });
    assert(res.status === 200, `Status ${res.status}`);
    assert(res.body.id, 'Mascota creada con ID');
    mascotaId = res.body.id;
  });

  // ===== TESTS DE SERVICIOS =====
  console.log(colors.blue + '\n💇 TESTS DE SERVICIOS\n' + colors.reset);

  let servicioId;
  await test('GET /api/servicios - Obtener lista de servicios', async () => {
    const res = await request('GET', '/api/servicios');
    assert(res.status === 200, `Status ${res.status}`);
    assert(Array.isArray(res.body), 'Response is array');
    assert(res.body.length > 0, 'Hay servicios precargados');
    servicioId = res.body.find(s => !s.requiere_canil)?.id;
  });

  // ===== TESTS DE DISPONIBILIDAD Y BLOQUEOS =====
  console.log(colors.blue + '\n📅 TESTS DE DISPONIBILIDAD Y BLOQUEOS\n' + colors.reset);

  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const twoDaysLater = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];

  await test('GET /api/disponibilidad - Ver horarios disponibles', async () => {
    const res = await request('GET', `/api/disponibilidad?fecha=${tomorrow}`);
    assert(res.status === 200, `Status ${res.status}`);
    assert(res.body.slots, 'Tiene slots disponibles');
    assert(Array.isArray(res.body.slots), 'Slots es array');
    assert(res.body.slots.length > 0, 'Hay horarios en la agenda');
  });

  let bloqueoId;
  await test('POST /api/bloqueos - Crear bloqueo', async () => {
    const res = await request('POST', '/api/bloqueos', {
      fecha: twoDaysLater,
      motivo: 'Cierre de prueba',
    });
    assert(res.status === 200, `Status ${res.status}`);
    assert(res.body.id, 'Bloqueo creado con ID');
    bloqueoId = res.body.id;
  });

  await test('GET /api/bloqueos - Obtener lista de bloqueos', async () => {
    const res = await request('GET', '/api/bloqueos');
    assert(res.status === 200, `Status ${res.status}`);
    assert(Array.isArray(res.body), 'Response is array');
  });

  // ===== TESTS DE TURNOS - CASOS EXITOSOS =====
  console.log(colors.blue + '\n🎫 TESTS DE TURNOS - CASOS EXITOSOS\n' + colors.reset);

  let turnoId;
  await test('POST /api/turnos - Crear turno válido', async () => {
    const res = await request('POST', '/api/turnos', {
      cliente_id: clienteId,
      mascota_id: mascotaId,
      servicio_id: servicioId,
      profesional_id: 1,
      fecha: tomorrow,
      hora: '09:00',
      observaciones: 'Turno de prueba',
    });
    assert(res.status === 201, `Status ${res.status} (esperado 201)`);
    assert(res.body.id, 'Turno creado con ID');
    turnoId = res.body.id;
  });

  await test('GET /api/turnos - Obtener lista de turnos', async () => {
    const res = await request('GET', '/api/turnos');
    assert(res.status === 200, `Status ${res.status}`);
    assert(Array.isArray(res.body), 'Response is array');
    assert(res.body.length > 0, 'Hay turnos en la lista');
  });

  await test('PUT /api/turnos/:id - Actualizar estado de turno', async () => {
    const res = await request('PUT', `/api/turnos/${turnoId}`, {
      estado: 'Confirmado',
      pago: 'Sena',
    });
    assert(res.status === 200, `Status ${res.status}`);
  });

  // ===== TESTS DE TURNOS - VALIDACIONES (DEBE FALLAR) =====
  console.log(colors.blue + '\n🚫 TESTS DE TURNOS - VALIDACIONES\n' + colors.reset);

  await test('POST /api/turnos - Rechazar turno SIN fecha/hora', async () => {
    const res = await request('POST', '/api/turnos', {
      cliente_id: clienteId,
      mascota_id: mascotaId,
      servicio_id: servicioId,
    });
    assert(res.status === 400, `Status debe ser 400 (recibido: ${res.status})`);
  });

  await test('POST /api/turnos - Rechazar turno SIN cliente/mascota/servicio', async () => {
    const res = await request('POST', '/api/turnos', {
      fecha: tomorrow,
      hora: '10:00',
    });
    assert(res.status === 400, `Status debe ser 400 (recibido: ${res.status})`);
  });

  await test('POST /api/turnos - Rechazar turno en fecha BLOQUEADA', async () => {
    const res = await request('POST', '/api/turnos', {
      cliente_id: clienteId,
      mascota_id: mascotaId,
      servicio_id: servicioId,
      fecha: twoDaysLater, // Esta fecha está bloqueada
      hora: '09:00',
    });
    assert(res.status === 409, `Status debe ser 409 (recibido: ${res.status})`);
    assert(res.body.razones?.some(r => r.includes('bloqueada')), 'Debe mencionar fecha bloqueada');
  });

  await test('POST /api/turnos - Rechazar turno con profesional OCUPADO', async () => {
    // Intentar crear turno a la misma hora con mismo profesional
    const res = await request('POST', '/api/turnos', {
      cliente_id: clienteId,
      mascota_id: mascotaId,
      servicio_id: servicioId,
      profesional_id: 1, // Mismo profesional del turno anterior
      fecha: tomorrow,
      hora: '09:00', // Misma hora del turno anterior
    });
    assert(res.status === 409, `Status debe ser 409 (recibido: ${res.status})`);
    assert(res.body.razones?.some(r => r.includes('ocupado')), 'Debe mencionar profesional ocupado');
  });

  await test('PUT /api/turnos/:id - Rechazar estado INVÁLIDO', async () => {
    const res = await request('PUT', `/api/turnos/${turnoId}`, {
      estado: 'EstadoInvalido',
    });
    assert(res.status === 400, `Status debe ser 400 (recibido: ${res.status})`);
  });

  // ===== CLEANUP =====
  console.log(colors.blue + '\n🧹 LIMPIEZA\n' + colors.reset);

  await test('DELETE /api/bloqueos/:id - Eliminar bloqueo de prueba', async () => {
    const res = await request('DELETE', `/api/bloqueos/${bloqueoId}`);
    assert(res.status === 200, `Status ${res.status}`);
  });

  await test('DELETE /api/turnos/:id - Eliminar turno de prueba', async () => {
    const res = await request('DELETE', `/api/turnos/${turnoId}`);
    assert(res.status === 200, `Status ${res.status}`);
  });

  // ===== RESUMEN =====
  console.log('\n' + colors.cyan + '📊 RESUMEN DE TESTS\n' + colors.reset);
  console.log(colors.green + `✅ Pasados: ${testsPassed}` + colors.reset);
  console.log(colors.red + `❌ Fallidos: ${testsFailed}` + colors.reset);
  console.log(colors.cyan + `📈 Total: ${testsPassed + testsFailed}\n` + colors.reset);

  if (testsFailed === 0) {
    console.log(colors.green + '🎉 ¡TODOS LOS TESTS PASARON!\n' + colors.reset);
    process.exit(0);
  } else {
    console.log(colors.red + `⚠️ ${testsFailed} tests fallaron\n` + colors.reset);
    process.exit(1);
  }
}

runTests().catch((err) => {
  log('❌', `Error fatal: ${err.message}`);
  process.exit(1);
});
