import { MetricCard, MiniBars } from "@/components/AdminShell"

const upcomingTurns = [
  ["Hoy, 17/04", "15:45", "Luna", "Sesion Premium", "Confirmado", "Completo"],
  ["Hoy, 17/04", "17:00", "Toto", "Guarderia Canina", "Confirmado", "Sena"],
  ["Manana, 18/04", "10:00", "Stella", "Peluqueria", "Pendiente", "Pendiente"],
  ["Manana, 18/04", "16:00", "Simba", "Sesion Relax", "Confirmado", "Completo"],
]

export function DashboardOverview() {
  return (
    <>
      <div className="filter-row">
        <button className="filter active">Todos (210)</button>
        <button className="filter yellow">Pendientes (45)</button>
        <button className="filter green">Confirmados (120)</button>
        <button className="filter blue">Completados (35)</button>
        <button className="filter red">Cancelados (10)</button>
      </div>

      <section className="metrics-grid">
        <MetricCard label="Servicio estrella (mes)" value="Sesion Premium" detail="18 turnos esta mes" tone="red" />
        <MetricCard label="Categoria top" value="Guarderia" detail="Mayor volumen este mes" tone="blue" />
        <article className="metric-card split">
          <div>
            <span>Servicios activos</span>
            <strong>24</strong>
            <p className="tone-green">8 categorias activas</p>
          </div>
          <MiniBars />
        </article>
        <MetricCard label="Precio promedio" value="$85.000" detail="Por servicio activo" tone="green" />
        <MetricCard label="Duracion promedio" value="45 min" detail="Por servicio activo" tone="yellow" />
        <MetricCard label="Sin reservas (90 dias)" value="3" detail="Alerta, servicios sin reservas" tone="yellow" />
      </section>

      <section className="analytics-grid">
        <article className="panel-card">
          <div className="card-head">
            <h3>Top 5 - Servicios mas solicitados</h3>
            <span>Ultimos 90 dias</span>
          </div>
          <div className="bar-list">
            {[
              ["Sesion Premium - Bano & Corte", 132],
              ["Guarderia Canina", 98],
              ["Peluqueria en General", 76],
              ["Sesion Relax", 58],
              ["Terapia Alternativa", 34],
            ].map(([label, value]) => (
              <div className="bar-row" key={label}>
                <span>{label}</span>
                <div><i style={{ width: `${Number(value) / 1.5}%` }} /></div>
                <b>{value}</b>
              </div>
            ))}
          </div>
        </article>

        <article className="panel-card donut-card">
          <h3>Turnos por categoria</h3>
          <div className="donut-wrap">
            <div className="donut"><strong>210</strong><span>Total</span></div>
            <ul>
              <li>Peluqueria <span>35%</span></li>
              <li>Guarderia <span>30%</span></li>
              <li>Spa / Relax <span>20%</span></li>
              <li>Salud / Vacunas <span>10%</span></li>
            </ul>
          </div>
        </article>
      </section>

      <TurnTable title="Proximos turnos" rows={upcomingTurns} />
    </>
  )
}

export function TurnTable({
  title,
  rows = upcomingTurns,
}: {
  title: string
  rows?: string[][]
}) {
  return (
    <section className="panel-card table-card">
      <h3>{title}</h3>
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Hora</th>
            <th>Mascota</th>
            <th>Servicio</th>
            <th>Estado</th>
            <th>Pago</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.join("-")}>
              {row.map((cell, index) => (
                <td key={cell + index}>
                  {index >= 4 ? (
                    <span className={`pill ${cell === "Pendiente" ? "yellow" : cell === "Sena" ? "blue" : "green"}`}>
                      {cell}
                    </span>
                  ) : (
                    cell
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <button className="wide-button">Ver todos los turnos</button>
    </section>
  )
}
