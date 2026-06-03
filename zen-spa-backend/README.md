# 🐾 Zen Spa para Mascotas - Panel Administrativo

Panel de administración funcional para gestionar turnos, clientes, mascotas y servicios en tu spa de mascotas.

## ✨ Funcionalidades Implementadas

### ✅ Gestión de Turnos
- ✓ **Crear turnos** con validación de disponibilidad
- ✓ **Ver todos los turnos** en tabla ordenada
- ✓ **Editar estado** (Pendiente → Confirmado → Completado → Cancelado)
- ✓ **Editar pago** (Pendiente → Seña → Pagado)
- ✓ **Confirmación por WhatsApp** automática al crear turno

### ✅ Disponibilidad
- ✓ **Horarios semanales** personalizables por día y hora
- ✓ **Bloqueos de fechas** (cierre, mantenimiento, capacitación)
- ✓ **Vacaciones** con rango de fechas
- ✓ **Validación automática** de cupos (caniles)

### ✅ Dashboard
- ✓ **Resumen en tiempo real** de turnos
- ✓ **Top servicios** más solicitados
- ✓ **Estadísticas por categoría**
- ✓ **Próximos turnos** programados
- ✓ **Precio y duración promedio**

### ✅ Base de Datos
- ✓ **Datos de prueba precargados** (4 clientes, 5 mascotas, 5 servicios)
- ✓ **3 profesionales** incluyendo Romina
- ✓ **3 caniles** para guardería
- ✓ **4 turnos de ejemplo** para testing

---

## 🚀 Instrucciones para Ejecutar

### 1️⃣ Backend (Express + MySQL)

```bash
# Ir a la carpeta backend
cd zen-spa-backend

# Instalar dependencias
npm install

# Cargar datos de prueba en la BD (IMPORTANTE - solo primera vez)
node scripts/seed-data.js

# Iniciar el servidor
npm run dev
```

**Salida esperada:**
```
✅ Conectado a MySQL
✨ Base de datos lista con datos de prueba
Servidor corriendo en http://localhost:3001
```

### 2️⃣ Frontend (Next.js)

En **otra terminal**:

```bash
# Ir a la carpeta admin
cd zen-spa-admin

# Instalar dependencias
npm install

# Iniciar el desarrollo
npm run dev
```

**Salida esperada:**
```
> next dev --webpack --hostname 127.0.0.1 --port 3000
...
ready - started server on 127.0.0.1:3000
```

### 3️⃣ Abrir en el navegador

Ve a: **http://127.0.0.1:3000**

---

## 📋 Datos de Prueba Precargados

### Clientes
1. **Aline Gerez** - +541123456789
2. **Juan Pérez** - +541198765432
3. **María García** - +541145678901
4. **Carlos López** - +541156789012

### Mascotas
- Luna (Labrador, Aline)
- Max (Pastor Alemán, Aline)
- Bella (Golden Retriever, Juan)
- Rocky (Bulldog, María)
- Milo (Siamés, Carlos)

### Servicios
- 🛁 **Baño & Corte Premium** - $150 (90 min)
- 🛁 **Baño Completo** - $80 (60 min)
- ✂️ **Peluquería Creativa** - $120 (75 min)
- 🏠 **Guardería Canina** - $200 (480 min) ← Requiere canil
- 🧘 **Sesión Relax** - $90 (45 min)

### Profesionales
- Romina (Grooming)
- Ana García (Peluquería)
- Carlos López (Baño y limpieza)

---

## 🎮 Cómo Usar el Panel

### Crear un Turno
1. Desplázate a **"Nuevo turno"** (arriba en el panel)
2. Selecciona:
   - ✓ Cliente
   - ✓ Mascota (filtra automáticamente por cliente)
   - ✓ Servicio
   - ✓ Profesional (Romina está preseleccionada)
   - ✓ Fecha
   - ✓ Hora (con validación de disponibilidad)
3. Click en **"Crear turno"**
4. ¡Se generará automáticamente un enlace WhatsApp de confirmación!

### Editar un Turno
1. En la tabla **"Control de Reservas"**
2. Click en el botón **"Editar"** del turno
3. Cambia el estado o pago desde los selectores
4. Confirma con ✓ o cancela con ✕

### Gestionar Disponibilidad
1. Ve a sección **"Horarios semanales"**
2. Clickea en las celdas para activar/desactivar horarios
3. En **"Bloquear fecha"** puedes:
   - Bloquear un día específico
   - Crear vacaciones (con rango de fechas)
   - Seleccionar motivo

### Ver Dashboard
1. En la página de inicio (/dashboard)
2. Verás automáticamente:
   - Total de turnos y estados
   - Servicios más solicitados
   - Estadísticas de precios
   - Próximos turnos programados

---

## 🔧 Estructura del Proyecto

```
zen-spa/
├── zen-spa-backend/
│   ├── index.js              # Servidor Express
│   ├── routes/
│   │   ├── turnos.js        # CRUD turnos
│   │   ├── clientes.js      # CRUD clientes
│   │   ├── mascotas.js      # CRUD mascotas
│   │   ├── servicios.js     # CRUD servicios
│   │   ├── profesionales.js # CRUD profesionales
│   │   ├── disponibilidad.js # Validar horarios
│   │   └── bloqueos.js      # Bloqueos y vacaciones
│   ├── scripts/
│   │   └── seed-data.js     # Datos de prueba
│   └── package.json
│
└── zen-spa-admin/
    ├── app/
    │   ├── page.tsx         # Dashboard
    │   ├── turnos/page.tsx  # Página de turnos
    │   ├── globals.css      # Estilos globales
    │   └── layout.tsx       # Layout
    ├── components/
    │   ├── AdminShell.tsx           # Shell del admin
    │   ├── TurnosManager.tsx        # Gestor de turnos
    │   ├── RealTurnsTable.tsx       # Tabla editable
    │   ├── ScheduleBlocksPanel.tsx  # Panel de bloqueos
    │   └── DashboardOverviewLive.tsx # Dashboard
    ├── lib/
    │   └── api.ts           # Tipos y funciones API
    └── package.json
```

---

## 🛠️ APIs Disponibles

### Turnos
- `GET /api/turnos` - Obtener todos los turnos
- `POST /api/turnos` - Crear un turno
- `PUT /api/turnos/:id` - Actualizar estado y pago
- `DELETE /api/turnos/:id` - Eliminar turno

### Clientes
- `GET /api/clientes` - Listar clientes
- `POST /api/clientes` - Crear cliente
- `PUT /api/clientes/:id` - Actualizar cliente

### Mascotas
- `GET /api/mascotas` - Listar mascotas
- `POST /api/mascotas` - Crear mascota
- `PUT /api/mascotas/:id` - Actualizar mascota

### Disponibilidad
- `GET /api/disponibilidad?fecha=2026-06-10` - Horarios disponibles
- `GET /api/horarios` - Horarios semanales
- `PUT /api/horarios/toggle` - Activar/desactivar horario

### Bloqueos
- `GET /api/bloqueos` - Listar bloqueos
- `POST /api/bloqueos` - Crear bloqueo
- `DELETE /api/bloqueos/:id` - Eliminar bloqueo

---

## 🐛 Troubleshooting

### Error: "No se pudo conectar con el backend"
- ¿Backend está corriendo en puerto 3001?
- Verificar: `http://localhost:3001/api/turnos`

### Error: "Tabla no existe"
- Ejecutar: `node scripts/seed-data.js`
- Verifica la conexión a MySQL en `zen-spa-backend/index.js`

### No aparecen datos de prueba
- Ejecutar nuevamente: `node scripts/seed-data.js`
- El script limpia datos antiguos y carga nuevos

### Turnos sin llegar desde el frontend
- Abrir DevTools (F12) y revisar Console
- Verificar que `API_BASE` en `lib/api.ts` sea correcto

---

## 📝 Próximas Mejoras (Optional)

- [ ] Editar clientes directamente desde el panel
- [ ] Crear mascotas desde el panel
- [ ] Reportes más detallados
- [ ] Exportar datos a CSV/PDF
- [ ] Notificaciones en tiempo real
- [ ] Sistema de pagos integrado
- [ ] Galería de fotos de mascotas

---

## 📧 Soporte

Si hay algo que no funciona:
1. Revisar logs del backend (`npm run dev`)
2. Revisar console del navegador (F12)
3. Verificar conexión a MySQL
4. Asegurarse de que los datos de prueba están cargados

¡Que disfrutes tu panel administrativo! 🎉
