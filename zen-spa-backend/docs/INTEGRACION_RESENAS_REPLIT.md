# Integracion de Resenas - Replit y Backend Zen Spa

## 1. Endpoint para ENVIAR una resena (desde la web en Replit)

```
POST https://TU-BACKEND.up.railway.app/api/resenas
Content-Type: multipart/form-data

Campos:
- nombre_cliente   (texto, obligatorio)
- email            (texto, opcional)
- calificacion     (numero 1-5, obligatorio)
- comentario       (texto, obligatorio)
- cliente_id       (numero, opcional)
- fotos            (hasta 5 archivos de imagen, opcional)
```

### Ejemplo JavaScript (fetch desde Replit):

```javascript
async function enviarResena(datos, archivos) {
  const formData = new FormData();
  formData.append('nombre_cliente', datos.nombre);
  formData.append('email', datos.email);
  formData.append('calificacion', datos.calificacion);
  formData.append('comentario', datos.comentario);

  for (const archivo of archivos) {
    formData.append('fotos', archivo);
  }

  const res = await fetch('https://TU-BACKEND.up.railway.app/api/resenas', {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (res.ok) {
    alert('Gracias! Tu resena fue enviada y esta pendiente de aprobacion.');
  } else {
    alert('Error: ' + data.error);
  }
}
```

### Ejemplo de formulario HTML completo:

```html
<form id="form-resena">
  <input type="text"  name="nombre_cliente" placeholder="Tu nombre" required>
  <input type="email" name="email" placeholder="Tu email (opcional)">
  <select name="calificacion" required>
    <option value="5">5 estrellas - Excelente</option>
    <option value="4">4 estrellas - Muy bueno</option>
    <option value="3">3 estrellas - Bueno</option>
    <option value="2">2 estrellas - Regular</option>
    <option value="1">1 estrella - Malo</option>
  </select>
  <textarea name="comentario" placeholder="Contanos tu experiencia..." required></textarea>
  <input type="file" name="fotos" accept="image/*" multiple>
  <button type="submit">Enviar resena</button>
</form>

<script>
document.getElementById('form-resena').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const res = await fetch('https://TU-BACKEND.up.railway.app/api/resenas', {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (res.ok) {
    alert('Gracias! Tu resena fue enviada.');
    e.target.reset();
  } else {
    alert('Error: ' + data.error);
  }
});
</script>
```

---

## 2. Endpoint para MOSTRAR resenas aprobadas (web publica)

```
GET https://TU-BACKEND.up.railway.app/api/resenas/publicas
```

Devuelve array de resenas aprobadas, destacadas primero:

```json
[
  {
    "id": 5,
    "nombre_cliente": "Aline Gerez",
    "calificacion": 5,
    "comentario": "Excelente atencion, Luna salio hermosa!",
    "respuesta": "Gracias Aline! Te esperamos pronto.",
    "destacada": true,
    "creado_en": "2026-06-08T14:30:00.000Z",
    "fotos": [
      "/api/resenas/fotos/resena-1234567890-123.jpg"
    ]
  }
]
```

### Ejemplo JavaScript:

```javascript
async function cargarResenas() {
  const res = await fetch('https://TU-BACKEND.up.railway.app/api/resenas/publicas');
  const resenas = await res.json();

  const contenedor = document.getElementById('resenas-container');
  contenedor.innerHTML = resenas.map(r => `
    <div class="resena-card">
      <div class="estrellas">${'*'.repeat(r.calificacion)}</div>
      <h4>${r.nombre_cliente}</h4>
      <p>${r.comentario}</p>
      ${r.respuesta ? `<div class="respuesta"><strong>Respuesta de Zen Spa:</strong> ${r.respuesta}</div>` : ''}
      <div class="fotos">
        ${r.fotos.map(f => `<img src="https://TU-BACKEND.up.railway.app${f}" alt="Foto">`).join('')}
      </div>
    </div>
  `).join('');
}
cargarResenas();
```

---

## 3. Importante para produccion (Railway)

Las fotos se guardan en `zen-spa-backend/uploads/resenas/`.

ATENCION: Railway tiene sistema de archivos efimero. Si el servidor se reinicia,
los archivos subidos se pueden perder.

Para produccion definitiva, considerar:
- Cloudinary (gratis hasta 25GB, facil de integrar)
- AWS S3 / Backblaze B2

Si se necesita, se puede migrar a Cloudinary cuando se haga el deploy.

---

## 4. Panel de administracion

Acceder a /resenas en el panel admin para:

- Ver resenas pendientes, aprobadas y rechazadas
- Aprobar / rechazar / volver a pendiente
- Destacar resenas (aparecen primero en la web)
- Editar el texto del comentario
- Eliminar fotos individuales
- Eliminar resenas completas
- Responder publicamente a cada resena
