# Integracion del Chat en vivo - Replit y Backend Zen Spa

El backend ya tiene Socket.IO instalado y configurado. Funciona en tiempo real
entre la web del cliente (Replit) y el panel admin.

## 1. Instalar socket.io-client en tu web de Replit

```bash
npm install socket.io-client
```

O via CDN en HTML:
```html
<script src="https://cdn.socket.io/4.8.1/socket.io.min.js"></script>
```

---

## 2. Conectar el cliente al chat

```javascript
const socket = io('https://TU-BACKEND.up.railway.app', {
  transports: ['websocket', 'polling'],
});

// Unirse a la sala del cliente (usar el ID real del cliente logueado)
const CLIENTE_ID = 5; // <- ID real del cliente en la tabla `clientes`

socket.emit('join', { clienteId: CLIENTE_ID, role: 'cliente' });

// Escuchar mensajes nuevos (del admin o propios)
socket.on('mensaje:nuevo', (payload) => {
  console.log('Nuevo mensaje:', payload);
  // payload = { id, cliente_id, autor_tipo, autor_nombre, mensaje, creado_en }
  mostrarMensajeEnPantalla(payload);
});
```

---

## 3. Enviar un mensaje desde la web del cliente

### Opcion A - via Socket (tiempo real, recomendado):

```javascript
function enviarMensaje(texto) {
  socket.emit('mensaje:enviar', {
    cliente_id: CLIENTE_ID,
    mensaje: texto,
    autor_tipo: 'cliente',
    autor_nombre: 'Nombre del Cliente',
  }, (respuesta) => {
    if (respuesta.ok) {
      console.log('Mensaje enviado:', respuesta.data);
    } else {
      console.error('Error:', respuesta.error);
    }
  });
}
```

### Opcion B - via HTTP POST (sin socket):

```javascript
async function enviarMensajeHTTP(texto) {
  const res = await fetch(`https://TU-BACKEND.up.railway.app/api/chat/${CLIENTE_ID}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mensaje: texto,
      autor_tipo: 'cliente',
      autor_nombre: 'Nombre del Cliente',
    }),
  });
  return res.json();
}
```

---

## 4. Cargar historial de mensajes al abrir el chat

```javascript
async function cargarHistorial() {
  const res = await fetch(`https://TU-BACKEND.up.railway.app/api/chat/${CLIENTE_ID}`);
  const mensajes = await res.json();
  mensajes.forEach(mostrarMensajeEnPantalla);
}
cargarHistorial();
```

---

## 5. Ejemplo de widget de chat completo (HTML + JS)

```html
<div id="chat-widget" style="position:fixed; bottom:20px; right:20px; width:320px;
     background:#1e0b6b; border-radius:12px; box-shadow:0 8px 24px rgba(0,0,0,.3); overflow:hidden;">
  <div style="padding:12px; background:#3D1095; color:#fff; font-weight:600;">
    💬 Chat con Zen Spa
  </div>
  <div id="chat-mensajes" style="height:280px; overflow-y:auto; padding:10px; color:#fff; font-size:13px;"></div>
  <div style="display:flex; padding:8px; gap:6px;">
    <input id="chat-input" placeholder="Escribi tu mensaje..."
      style="flex:1; padding:8px; border-radius:6px; border:none;">
    <button id="chat-enviar" style="background:#F5A623; border:none; border-radius:6px; padding:8px 12px; cursor:pointer;">➤</button>
  </div>
</div>

<script src="https://cdn.socket.io/4.8.1/socket.io.min.js"></script>
<script>
  const CLIENTE_ID = 5; // ID real del cliente
  const socket = io('https://TU-BACKEND.up.railway.app');
  socket.emit('join', { clienteId: CLIENTE_ID, role: 'cliente' });

  const mensajesDiv = document.getElementById('chat-mensajes');

  function agregarMensaje(m) {
    const div = document.createElement('div');
    div.style.marginBottom = '6px';
    div.style.textAlign = m.autor_tipo === 'cliente' ? 'right' : 'left';
    div.innerHTML = `<span style="background:${m.autor_tipo==='cliente'?'#F5A623':'#3D1095'};
      padding:6px 10px; border-radius:8px; display:inline-block;">${m.mensaje}</span>`;
    mensajesDiv.appendChild(div);
    mensajesDiv.scrollTop = mensajesDiv.scrollHeight;
  }

  // Cargar historial
  fetch(`https://TU-BACKEND.up.railway.app/api/chat/${CLIENTE_ID}`)
    .then(r => r.json())
    .then(msgs => msgs.forEach(agregarMensaje));

  // Escuchar nuevos
  socket.on('mensaje:nuevo', agregarMensaje);

  // Enviar
  document.getElementById('chat-enviar').onclick = () => {
    const input = document.getElementById('chat-input');
    if (!input.value.trim()) return;
    socket.emit('mensaje:enviar', {
      cliente_id: CLIENTE_ID,
      mensaje: input.value,
      autor_tipo: 'cliente',
      autor_nombre: 'Cliente Web',
    });
    input.value = '';
  };
</script>
```

---

## 6. Panel administrativo (ya implementado)

El panel admin tiene el **Centro de Mensajes** (`/centro-mensajes`):

- Lista de todas las conversaciones por cliente
- Mensajes en tiempo real (sin recargar)
- Indicador de conexion (verde = en vivo)
- Responder desde el panel, llega instantaneo al cliente

---

## 7. Variables de entorno necesarias en produccion

En el frontend (Vercel), agregar:
```
NEXT_PUBLIC_API_URL=https://TU-BACKEND.up.railway.app
NEXT_PUBLIC_SOCKET_URL=https://TU-BACKEND.up.railway.app
```

En el backend (Railway), CORS ya esta configurado con `origin: '*'`,
funciona para cualquier dominio incluyendo Replit.
