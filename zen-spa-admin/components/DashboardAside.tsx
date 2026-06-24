import Link from "next/link"
import type { Turno } from "@/lib/api"

type Resumen = {
  total?: number
  pendientes?: number
  confirmados?: number
  completados?: number
  cancelados?: number
}

function formatAppointmentDate(fecha: string, hora: string) {
  const date = new Date(`${fecha.slice(0, 10)}T12:00:00`)
  const label = new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(date)

  return `${label} · ${hora.slice(0, 5)}`
}

function statusTone(estado: string) {
  const normalized = estado.toLowerCase()
  if (normalized === "confirmado" || normalized === "completado") return "green"
  if (normalized === "cancelado") return "red"
  return "yellow"
}

export default function DashboardAside({
  resumen,
  proximos,
}: {
  resumen: Resumen
  proximos: Turno[]
}) {
  const appointments = proximos.slice(0, 4)

  return (
    <>
      <section className="panel-card upcoming-card">
        <div className="card-head">
          <div>
            <span>Agenda activa</span>
            <h3>Próximos turnos</h3>
          </div>
          <Link href="/calendario" className="ghost-button panel-link">
            Calendario
          </Link>
        </div>

        {appointments.length > 0 ? (
          <div className="upcoming-list">
            {appointments.map((turno) => (
              <Link href="/turnos" className="upcoming-row" key={turno.id}>
                <time>{formatAppointmentDate(turno.fecha, turno.hora)}</time>
                <strong>{turno.mascota_nombre || "Mascota sin asignar"}</strong>
                <span>{turno.servicio_nombre || "Servicio sin asignar"}</span>
                <small className={`pill ${statusTone(turno.estado)}`}>{turno.estado}</small>
              </Link>
            ))}
          </div>
        ) : (
          <div className="aside-empty">
            <strong>Agenda libre</strong>
            <p>No hay turnos próximos registrados.</p>
            <Link href="/turnos#nuevo-turno">Crear un turno</Link>
          </div>
        )}
      </section>

      <section className="panel-card quick-summary">
        <h3>Resumen real</h3>
        <div className="summary-grid">
          <span><strong>{resumen.total ?? 0}</strong>Turnos</span>
          <span><strong>{resumen.confirmados ?? 0}</strong>Confirmados</span>
          <span><strong>{resumen.pendientes ?? 0}</strong>Pendientes</span>
          <span><strong>{resumen.cancelados ?? 0}</strong>Cancelados</span>
        </div>
      </section>

      <section className="panel-card quick-summary">
        <h3>Accesos rápidos</h3>
        <div className="quick-links">
          <Link href="/recordatorios">Enviar recordatorios</Link>
          <Link href="/turnos">Gestionar turnos</Link>
          <Link href="/clientes">Buscar clientes</Link>
        </div>
      </section>
    </>
  )
}
