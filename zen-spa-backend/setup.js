const mysql = require('mysql2');
const db = mysql.createConnection({host:'localhost',user:'root',password:'admin1234',database:'zen_spa'});
db.connect(err => {
  if(err) { console.log('Error:', err.message); db.end(); return; }
  const tablas = [
    "CREATE TABLE IF NOT EXISTS clientes (id INT AUTO_INCREMENT PRIMARY KEY, nombre VARCHAR(100) NOT NULL, email VARCHAR(100), whatsapp VARCHAR(20), direccion VARCHAR(200), notas TEXT, creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
    "CREATE TABLE IF NOT EXISTS mascotas (id INT AUTO_INCREMENT PRIMARY KEY, cliente_id INT, nombre VARCHAR(100) NOT NULL, especie VARCHAR(50), raza VARCHAR(100), peso DECIMAL(5,2), sexo VARCHAR(10), fecha_nacimiento DATE, notas TEXT, creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
    "CREATE TABLE IF NOT EXISTS servicios (id INT AUTO_INCREMENT PRIMARY KEY, nombre VARCHAR(100) NOT NULL, categoria VARCHAR(100), precio DECIMAL(10,2), duracion_minutos INT, descripcion TEXT, activo TINYINT DEFAULT 1, requiere_canil TINYINT DEFAULT 0)",
    "CREATE TABLE IF NOT EXISTS profesionales (id INT AUTO_INCREMENT PRIMARY KEY, nombre VARCHAR(100) NOT NULL, especialidad VARCHAR(100), whatsapp VARCHAR(20), activo TINYINT DEFAULT 1)",
    "CREATE TABLE IF NOT EXISTS caniles (id INT AUTO_INCREMENT PRIMARY KEY, nombre VARCHAR(100) NOT NULL, activo TINYINT DEFAULT 1)",
    "CREATE TABLE IF NOT EXISTS turnos (id INT AUTO_INCREMENT PRIMARY KEY, cliente_id INT, mascota_id INT, servicio_id INT, profesional_id INT, canil_id INT, fecha DATE NOT NULL, hora TIME NOT NULL, estado VARCHAR(50) DEFAULT 'Pendiente', pago VARCHAR(50) DEFAULT 'Pendiente', observaciones TEXT, creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
    "CREATE TABLE IF NOT EXISTS horarios (id INT AUTO_INCREMENT PRIMARY KEY, dia VARCHAR(20) NOT NULL, hora TIME NOT NULL, disponible TINYINT DEFAULT 1)",
    "CREATE TABLE IF NOT EXISTS bloqueos (id INT AUTO_INCREMENT PRIMARY KEY, fecha DATE NOT NULL, motivo VARCHAR(200), creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
    "CREATE TABLE IF NOT EXISTS feriados (id INT AUTO_INCREMENT PRIMARY KEY, fecha DATE NOT NULL, nombre VARCHAR(100), no_laborable TINYINT DEFAULT 1)"
  ];
  let done = 0;
  tablas.forEach(sql => {
    db.query(sql, err => {
      if(err) console.log('Error:', err.message);
      else console.log('OK:', sql.slice(27,50));
      done++;
      if(done === tablas.length) { console.log('--- Todas las tablas listas! ---'); db.end(); }
    });
  });
});
