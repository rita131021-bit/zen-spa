import Sidebar from "@/components/Sidebar"
import NewTurnButton from "@/components/NewTurnButton"

type AdminShellProps = {
  children: React.ReactNode
  aside?: React.ReactNode
}

export default function AdminShell({ children, aside }: AdminShellProps) {
  return (
    <main className="admin-shell">
      <Sidebar />
      <section className="workspace">
        <header className="topbar">
          <div className="topbar-context">
            <span>Panel Administrativo</span>
            <strong>Zen Spa para Mascotas</strong>
          </div>
          <label className="search-box">
            <span>BUSCAR</span>
            <input placeholder="Buscar turnos, mascotas, servicios..." />
          </label>
          <button className="icon-button" aria-label="Notificaciones" title="Notificaciones">
            <span>!</span>
            <small>3</small>
          </button>
          <div className="user-card">
            <div className="avatar">R</div>
            <div>
              <strong>Romina</strong>
              <span>Administradora</span>
            </div>
          </div>
        </header>

        <div className="content-grid">
          <div className="main-column">{children}</div>
          <aside className="right-column">
            <div className="right-actions">
              <NewTurnButton />
            </div>
            {aside ?? <PetPanel />}
          </aside>
        </div>
      </section>
    </main>
  )
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string
  title: string
  subtitle: string
  action?: React.ReactNode
}) {
  return (
    <div className="page-header">
      <div className="title-cluster">
        {eyebrow && <span className="spark">{eyebrow}</span>}
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      {action}
    </div>
  )
}

export function MetricCard({
  label,
  value,
  detail,
  tone = "purple",
}: {
  label: string
  value: string
  detail: string
  tone?: "purple" | "green" | "yellow" | "red" | "blue"
}) {
  return (
    <article className="metric-card">
      <span className="metric-label">{label}</span>
      <strong>{value}</strong>
      <p className={`tone-${tone}`}>{detail}</p>
    </article>
  )
}

export function PetPanel() {
  const events = [
    ["17/04/2026", "Sesion Premium - Bano & Corte", "Pendiente"],
    ["15/04/2026", "Guarderia Canina", "Completado"],
    ["15/04/2026", "Peluqueria", "Completado"],
    ["10/04/2026", "Sesion Relax", "Completado"],
  ]

  return (
    <>
      <section className="panel-card pet-card">
        <div className="card-head">
          <h3>Ficha de Mascota</h3>
          <button className="ghost-button">Editar</button>
        </div>
        <div className="pet-head">
          <div className="pet-photo">Luna</div>
          <div>
            <h4>Luna (Labrador)</h4>
            <p>Aline Gerez</p>
            <span>15/05/2020 - Hembra - 24 kg</span>
          </div>
        </div>
        <div className="info-list">
          <p><span>Proximo turno</span><strong>17/04/2026 - 16:00</strong></p>
          <p><span>Ultimo servicio</span><strong>Bano & Corte</strong></p>
          <p><span>Estado</span><strong className="tone-green">Activa</strong></p>
        </div>
        <div className="tabs">
          <button className="active">Evoluciones</button>
          <button>Historial</button>
        </div>
        <div className="timeline">
          {events.map(([date, name, status]) => (
            <div className="timeline-row" key={date + name}>
              <time>{date}</time>
              <div>
                <strong>{name}</strong>
                <span className={status === "Pendiente" ? "pill yellow" : "pill green"}>
                  {status}
                </span>
                <p>Profesional: A.R.</p>
              </div>
            </div>
          ))}
        </div>
        <button className="wide-button">Ver historial completo</button>
      </section>

      <section className="panel-card quick-summary">
        <h3>Resumen rapido</h3>
        <div className="summary-grid">
          <span><strong>210</strong>Turnos</span>
          <span><strong>120</strong>Confirmados</span>
          <span><strong>35</strong>Completados</span>
          <span><strong>10</strong>Cancelados</span>
        </div>
      </section>
      <section className="panel-card quick-summary">
        <h3>Acciones rapidas</h3>
        <div className="quick-actions">
          <button>Enviar recordatorio</button>
          <button>Confirmar turno</button>
          <button>Ver historial</button>
        </div>
      </section>
    </>
  )
}

export function MiniBars() {
  return (
    <div className="mini-bars" aria-hidden="true">
      <span style={{ height: "42%" }} />
      <span style={{ height: "68%" }} />
      <span style={{ height: "88%" }} />
    </div>
  )
}
