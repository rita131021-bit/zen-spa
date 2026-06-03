import { Turno } from "@/lib/api"

export default function RealTurnsTable({
  title,
  turns,
  limit,
}: {
  title: string
  turns: Turno[]
  limit?: number
}) {
  const rows = limit ? turns.slice(0, limit) : turns
  return (
    <section className="panel-card table-card">
      <h3>{title}</h3>
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Hora</th>
            <th>Mascota</th>
            <th>Cliente</th>
            <th>Servicio</th>
            <th>Profesional</th>
            <th>Estado</th>
            <th>Pago</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((turn) => (
            <tr key={turn.id}>
              <td>{String(turn.fecha).slice(0, 10)}</td>
              <td>{String(turn.hora).slice(0, 5)}</td>
              <td>{turn.mascota_nombre || "-"}</td>
              <td>{turn.cliente_nombre || "-"}</td>
              <td>{turn.servicio_nombre || "-"}</td>
              <td>{turn.profesional_nombre || "-"}</td>
              <td>
                <span
                  className={`pill ${
                    turn.estado === "Pendiente"
                      ? "yellow"
                      : turn.estado === "Cancelado"
                        ? "red"
                        : turn.estado === "Completado"
                          ? "blue"
                          : "green"
                  }`}
                >
                  {turn.estado || "Pendiente"}
                </span>
              </td>
              <td>
                <span className={turn.pago === "Pendiente" ? "pill yellow" : turn.pago === "Sena" ? "pill blue" : "pill green"}>
                  {turn.pago || "Pendiente"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
