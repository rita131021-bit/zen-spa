-- Eliminar filas duplicadas en tabla horarios (dejar solo una por dia+hora)
DELETE h1 FROM horarios h1
INNER JOIN horarios h2
WHERE h1.id > h2.id AND h1.dia = h2.dia AND h1.hora = h2.hora;

SELECT COUNT(*) as total_horarios FROM horarios;
