import Link from "next/link"
import { MetricCard, MiniBars } from "@/components/AdminShell"
import { TurnTable } from "@/components/DashboardSections"
import { Turno } from "@/lib/api"

type Resumen = {
  total?: number
  pendientes?: number
  confirmados?: number
  completados?: number
  cancelados?: number
}

type TopServicio = { nombre: string; total: number }
type Categoria = { categoria: string; total: number }
type PrecioResumen = { promedio?: number | string; duracion?: number | string }
type ServiciosResumen = { activos?: number; categorias?: number }

type DashboardOverviewLiveProps = {
  resumen: Resumen
  topServicios: TopServicio[]
  categorias: Categoria[]
  proximos: Turno[]
  precio: PrecioResumen
  serviciosResumen: ServiciosResumen
}

function formatDateLabel(fecha: string) {
  const iso = String(fecha).slice(0, 10)
  const today = new Date().toISOString().slice(0, 10)
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  const [y, m, d] = iso.split("-")
  const label = `${d}/${m}/${y}`
  if (iso === today) return `Hoy, ${label}`
  if (iso === tomorrow) return `Manana, ${label}`
  return label
}

export default function DashboardOverviewLive({
  resumen,
  topServicios,
  categorias,
  proximos,
  precio,
  serviciosResumen,
}: DashboardOverviewLiveProps) {
  const total = Number(resumen.total || 0)
  const maxTop = Math.max(...topServicios.map((s) => Number(s.total || 0)), 1)
  const categoriaTotal = categorias.reduce((sum, item) => sum + Number(item.total || 0), 0) || total || 1
  const star = topServicios[0]
  const topCategoria = categorias[0]

  const proximosRows = proximos.slice(0, 6).map((turno) => [
    formatDateLabel(String(turno.fecha)),
    String(turno.hora).slice(0, 5),
    turno.mascota_nombre || "-",
    turno.servicio_nombre || "-",
    turno.estado || "Pendiente",
    turno.pago || "Pendiente",
  ])

  return (
    <>
      <div className="filter-row">
        <button type="button" className="filter active">
          Todos ({total})
        </button>
        <button type="button" className="filter yellow">
          Pendientes ({Number(resumen.pendientes || 0)})
        </button>
        <button type="button" className="filter green">
          Confirmados ({Number(resumen.confirmados || 0)})
        </button>
        <button type="button" className="filter blue">
          Completados ({Number(resumen.completados || 0)})
        </button>
        <button type="button" className="filter red">
          Cancelados ({Number(resumen.cancelados || 0)})
        </button>
      </div>

      <section className="metrics-grid">
        <MetricCard
          label="Servicio estrella"
          value={star?.nombre || "Sin datos"}
          detail={`${star?.total || 0} turnos registrados`}
          tone="red"
        />
        <MetricCard
          label="Categoria top"
          value={topCategoria?.categoria || "Sin datos"}
          detail={`${topCategoria?.total || 0} turnos`}
          tone="blue"
        />
        <article className="metric-card split">
          <div>
            <span>Servicios activos</span>
            <strong>{serviciosResumen.activos || 0}</strong>
            <p className="tone-green">{serviciosResumen.categorias || 0} categorias activas</p>
          </div>
          <MiniBars />
        </article>
        <MetricCard
          label="Precio promedio"
          value={`$${Math.round(Number(precio.promedio || 0)).toLocaleString("es-AR")}`}
          detail="Por servicio activo"
          tone="green"
        />
        <MetricCard
          label="Duracion promedio"
          value={`${Math.round(Number(precio.duracion || 0))} min`}
          detail="Por servicio activo"
          tone="yellow"
        />
        <MetricCard
          label="Turnos proximos"
          value={String(proximos.length)}
          detail="Desde hoy en adelante"
          tone="yellow"
        />
      </section>

      <section className="analytics-grid">
        <article className="panel-card">
          <div className="card-head">
            <h3>Top 5 - Servicios mas solicitados</h3>
            <span>Historico</span>
          </div>
          <div className="bar-list">
            {topServicios.length === 0 && <p>Sin datos de servicios.</p>}
            {topServicios.map((item) => (
              <div className="bar-row" key={item.nombre}>
                <span>{item.nombre}</span>
                <div>
                  <i style={{ width: `${(Number(item.total) / maxTop) * 100}%` }} />
                </div>
                <b>{item.total}</b>
              </div>
            ))}
          </div>
        </article>

        <article className="panel-card donut-card">
          <h3>Turnos por categoria</h3>
          <div className="donut-wrap">
            <div className="donut">
              <strong>{categoriaTotal}</strong>
              <span>Total</span>
            </div>
            <ul>
              {categorias.map((item) => (
                <li key={item.categoria}>
                  {item.categoria || "Sin categoria"}{" "}
                  <span>{Math.round((Number(item.total) / categoriaTotal) * 100)}%</span>
                </li>
              ))}
            </ul>
          </div>
        </article>
      </section>

      {proximosRows.length > 0 ? (
        <TurnTable title="Proximos turnos" rows={proximosRows} />
      ) : (
        <section className="panel-card table-card">
          <h3>Proximos turnos</h3>
          <p>No hay turnos proximos.</p>
          <Link href="/turnos#nuevo-turno" className="wide-button">
            Crear turno
          </Link>
        </section>
      )}
    </>
  )
}
