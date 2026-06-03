function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('54')) return digits;
  if (digits.startsWith('0')) return `54${digits.slice(1)}`;
  return `54${digits}`;
}

function buildWhatsAppUrl(phone, message) {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

function buildConfirmacionTurno({ clienteNombre, mascotaNombre, servicioNombre, fecha, hora, profesionalNombre }) {
  const fechaTxt = String(fecha).slice(0, 10).split('-').reverse().join('/');
  const horaTxt = String(hora).slice(0, 5);
  return (
    `Hola ${clienteNombre || ''}! Tu turno en Zen Spa para Mascotas quedo registrado.\n` +
    `Mascota: ${mascotaNombre || '-'}\n` +
    `Servicio: ${servicioNombre || '-'}\n` +
    `Fecha: ${fechaTxt} ${horaTxt}\n` +
    `Profesional: ${profesionalNombre || 'Romina'}\n` +
    `Cualquier cambio, respondemos por este chat.`
  );
}

function buildRecordatorio24h({ clienteNombre, mascotaNombre, servicioNombre, fecha, hora }) {
  const fechaTxt = String(fecha).slice(0, 10).split('-').reverse().join('/');
  const horaTxt = String(hora).slice(0, 5);
  return (
    `Hola ${clienteNombre || ''}! Te recordamos tu turno en Zen Spa para manana.\n` +
    `Mascota: ${mascotaNombre || '-'}\n` +
    `Servicio: ${servicioNombre || '-'}\n` +
    `Fecha: ${fechaTxt} ${horaTxt}\n` +
    `Si necesitas reprogramar, avisanos por aqui.`
  );
}

module.exports = {
  buildWhatsAppUrl,
  buildConfirmacionTurno,
  buildRecordatorio24h,
  normalizePhone,
};
