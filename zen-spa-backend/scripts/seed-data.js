const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'admin1234',
  database: 'zen_spa',
});

db.connect((err) => {
  if (err) {
    console.error('Error conectando a MySQL:', err.message);
    process.exit(1);
  }
  console.log('✅ Conectado a MySQL');
  seedData();
});

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

async function seedData() {
  try {
    console.log('\n📋 Limpiando datos antiguos...');
    await query('DELETE FROM turnos WHERE 1=1');
    await query('DELETE FROM mascotas WHERE 1=1');
    await query('DELETE FROM clientes WHERE 1=1');
    await query('DELETE FROM servicios WHERE 1=1');
    await query('DELETE FROM profesionales WHERE 1=1');
    await query('DELETE FROM caniles WHERE 1=1');

    console.log('➕ Creando profesionales...');
    const profesionales = [
      { nombre: 'Romina', especialidad: 'Grooming' },
      { nombre: 'Ana García', especialidad: 'Peluquería' },
      { nombre: 'Carlos López', especialidad: 'Baño y limpieza' },
    ];
    for (const prof of profesionales) {
      const result = await query('INSERT INTO profesionales (nombre, especialidad, activo) VALUES (?, ?, 1)', [prof.nombre, prof.especialidad]);
      prof.id = result.insertId;
    }
    console.log(`✅ ${profesionales.length} profesionales creados`);

    console.log('➕ Creando caniles...');
    const caniles = [
      { nombre: 'Canil A' },
      { nombre: 'Canil B' },
      { nombre: 'Canil C' },
    ];
    for (const canil of caniles) {
      const result = await query('INSERT INTO caniles (nombre, activo) VALUES (?, 1)', [canil.nombre]);
      canil.id = result.insertId;
    }
    console.log(`✅ ${caniles.length} caniles creados`);

    console.log('➕ Creando servicios...');
    const servicios = [
      { nombre: 'Baño & Corte Premium', categoria: 'Grooming', precio: 150, duracion: 90, requiere_canil: 0 },
      { nombre: 'Baño Completo', categoria: 'Limpieza', precio: 80, duracion: 60, requiere_canil: 0 },
      { nombre: 'Peluquería Creativa', categoria: 'Grooming', precio: 120, duracion: 75, requiere_canil: 0 },
      { nombre: 'Guardería Canina', categoria: 'Cuidado', precio: 200, duracion: 480, requiere_canil: 1 },
      { nombre: 'Sesión Relax', categoria: 'Bienestar', precio: 90, duracion: 45, requiere_canil: 0 },
    ];
    for (const servicio of servicios) {
      await query('INSERT INTO servicios (nombre, categoria, precio, duracion_minutos, requiere_canil, activo) VALUES (?, ?, ?, ?, ?, 1)', [
        servicio.nombre,
        servicio.categoria,
        servicio.precio,
        servicio.duracion,
        servicio.requiere_canil,
      ]);
    }
    console.log(`✅ ${servicios.length} servicios creados`);

    console.log('➕ Creando clientes...');
    const clientes = [
      { nombre: 'Aline Gerez', whatsapp: '+541123456789', email: 'aline@mail.com', direccion: 'Av. Rivadavia 1234' },
      { nombre: 'Juan Pérez', whatsapp: '+541198765432', email: 'juan@mail.com', direccion: 'Calle 9 de Julio 567' },
      { nombre: 'María García', whatsapp: '+541145678901', email: 'maria@mail.com', direccion: 'Paseo de la Reforma 890' },
      { nombre: 'Carlos López', whatsapp: '+541156789012', email: 'carlos@mail.com', direccion: 'Corrientes 2345' },
    ];
    for (const cliente of clientes) {
      const result = await query('INSERT INTO clientes (nombre, whatsapp, email, direccion) VALUES (?, ?, ?, ?)', [
        cliente.nombre,
        cliente.whatsapp,
        cliente.email,
        cliente.direccion,
      ]);
      cliente.id = result.insertId;
    }
    console.log(`✅ ${clientes.length} clientes creados`);

    console.log('➕ Creando mascotas...');
    const mascotasData = [
      { cliente_id: 1, nombre: 'Luna', especie: 'Perro', raza: 'Labrador', peso: 24, sexo: 'Hembra' },
      { cliente_id: 1, nombre: 'Max', especie: 'Perro', raza: 'Pastor Alemán', peso: 35, sexo: 'Macho' },
      { cliente_id: 2, nombre: 'Bella', especie: 'Perro', raza: 'Golden Retriever', peso: 28, sexo: 'Hembra' },
      { cliente_id: 3, nombre: 'Rocky', especie: 'Perro', raza: 'Bulldog', peso: 22, sexo: 'Macho' },
      { cliente_id: 4, nombre: 'Milo', especie: 'Gato', raza: 'Siamés', peso: 4, sexo: 'Macho' },
    ];
    for (const mascota of mascotasData) {
      await query('INSERT INTO mascotas (cliente_id, nombre, especie, raza, peso, sexo) VALUES (?, ?, ?, ?, ?, ?)', [
        mascota.cliente_id,
        mascota.nombre,
        mascota.especie,
        mascota.raza,
        mascota.peso,
        mascota.sexo,
      ]);
    }
    console.log(`✅ ${mascotasData.length} mascotas creadas`);

    console.log('➕ Creando turnos de ejemplo...');
    const hoy = new Date();
    const turnos = [
      {
        cliente_id: 1,
        mascota_id: 1,
        servicio_id: 1,
        profesional_id: 1,
        fecha: new Date(hoy.getTime() + 2 * 86400000).toISOString().split('T')[0],
        hora: '09:00',
        estado: 'Pendiente',
        pago: 'Pendiente',
      },
      {
        cliente_id: 2,
        mascota_id: 3,
        servicio_id: 2,
        profesional_id: 2,
        fecha: new Date(hoy.getTime() + 1 * 86400000).toISOString().split('T')[0],
        hora: '14:00',
        estado: 'Confirmado',
        pago: 'Sena',
      },
      {
        cliente_id: 1,
        mascota_id: 2,
        servicio_id: 3,
        profesional_id: 1,
        fecha: new Date(hoy.getTime() + 3 * 86400000).toISOString().split('T')[0],
        hora: '10:00',
        estado: 'Completado',
        pago: 'Pagado',
      },
      {
        cliente_id: 3,
        mascota_id: 4,
        servicio_id: 1,
        profesional_id: 3,
        fecha: new Date(hoy.getTime() + 5 * 86400000).toISOString().split('T')[0],
        hora: '16:00',
        estado: 'Pendiente',
        pago: 'Pendiente',
      },
    ];
    for (const turno of turnos) {
      await query('INSERT INTO turnos (cliente_id, mascota_id, servicio_id, profesional_id, fecha, hora, estado, pago) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [
        turno.cliente_id,
        turno.mascota_id,
        turno.servicio_id,
        turno.profesional_id,
        turno.fecha,
        turno.hora,
        turno.estado,
        turno.pago,
      ]);
    }
    console.log(`✅ ${turnos.length} turnos creados`);

    console.log('\n✨ Base de datos lista con datos de prueba\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}
