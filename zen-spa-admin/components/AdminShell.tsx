"use client"
import Sidebar from "@/components/Sidebar"
import NewTurnButton from "@/components/NewTurnButton"
import Link from "next/link"
import { useState } from "react"

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
          <NotificacionesButton />
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
            {aside ?? <QuickAccessPanel />}
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
  tone?: "purple" | "green" | "yellow" | "red" | "blue" | "gray"
}) {
  return (
    <article className="metric-card">
      <span className="metric-label">{label}</span>
      <strong>{value}</strong>
      <p className={`tone-${tone}`}>{detail}</p>
    </article>
  )
}

function QuickAccessPanel() {
  return (
    <section className="panel-card quick-summary">
      <h3>Accesos rápidos</h3>
      <div className="quick-links">
        <Link href="/turnos">Gestionar turnos</Link>
        <Link href="/calendario">Abrir calendario</Link>
        <Link href="/recordatorios">Enviar recordatorios</Link>
      </div>
    </section>
  )
}

function NotificacionesButton() {
  return (
    <Link className="icon-button" href="/recordatorios" aria-label="Abrir recordatorios" title="Recordatorios">
      <span aria-hidden="true">&#128276;</span>
    </Link>
  )
}

export function PetPanel() {
  const [tab, setTab] = useState<"evoluciones" | "historial">("evoluciones")

  const evoluciones = [
    { fecha: "17/04/2026", nombre: "Sesion Premium - Bano & Corte", estado: "Pendiente",  prof: "A.R." },
    { fecha: "15/04/2026", nombre: "Guarderia Canina",               estado: "Completado", prof: "A.R." },
    { fecha: "15/04/2026", nombre: "Peluqueria",                     estado: "Completado", prof: "A.R." },
    { fecha: "10/04/2026", nombre: "Sesion Relax",                   estado: "Completado", prof: "A.R." },
  ]

  const historial = [
    { fecha: "15/04/2026", nombre: "Guarderia Canina",   estado: "Completado", prof: "A.R." },
    { fecha: "15/04/2026", nombre: "Peluqueria",         estado: "Completado", prof: "A.R." },
    { fecha: "10/04/2026", nombre: "Sesion Relax",       estado: "Completado", prof: "A.R." },
  ]

  const items = tab === "evoluciones" ? evoluciones : historial

  const whatsappUrl = "https://wa.me/549XXXXXXXXXX?text=Hola%20Luna%2C%20te%20recordamos%20tu%20turno%20en%20Zen%20Spa"

  return (
    <>
      <section className="panel-card pet-card">
        <div className="card-head">
          <h3>Ficha de Mascota</h3>
          <Link href="/mascotas" className="ghost-button" style={{ textDecoration: "none", fontSize: "13px", color: "#a78bfa" }}>
            Editar
          </Link>
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
          <button
            className={tab === "evoluciones" ? "active" : ""}
            onClick={() => setTab("evoluciones")}
            style={{ cursor: "pointer" }}
          >
            Evoluciones
          </button>
          <button
            className={tab === "historial" ? "active" : ""}
            onClick={() => setTab("historial")}
            style={{ cursor: "pointer" }}
          >
            Historial
          </button>
        </div>
        <div className="timeline">
          {items.map(({ fecha, nombre, estado, prof }) => (
            <div className="timeline-row" key={fecha + nombre}>
              <time>{fecha}</time>
              <div>
                <strong>{nombre}</strong>
                <span className={estado === "Pendiente" ? "pill yellow" : "pill green"}>
                  {estado}
                </span>
                <p>Profesional: {prof}</p>
              </div>
            </div>
          ))}
        </div>
        <Link href="/turnos" className="wide-button" style={{ display: "block", textAlign: "center", textDecoration: "none", padding: "10px", marginTop: "8px", borderRadius: "7px", background: "rgba(126,34,206,0.3)", color: "#e9d5ff", fontSize: "13px" }}>
          Ver historial completo
        </Link>
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
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
            style={{ display: "block", padding: "10px", textAlign: "center", textDecoration: "none",
              background: "rgba(34,197,94,0.2)", border: "1px solid rgba(34,197,94,0.4)",
              borderRadius: "7px", color: "#86efac", fontSize: "13px", marginBottom: "8px" }}>
            💬 Enviar recordatorio
          </a>
          <Link href="/turnos"
            style={{ display: "block", padding: "10px", textAlign: "center", textDecoration: "none",
              background: "rgba(126,34,206,0.2)", border: "1px solid rgba(126,34,206,0.4)",
              borderRadius: "7px", color: "#e9d5ff", fontSize: "13px", marginBottom: "8px" }}>
            ✅ Ver y confirmar turnos
          </Link>
          <Link href="/turnos"
            style={{ display: "block", padding: "10px", textAlign: "center", textDecoration: "none",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "7px", color: "var(--muted)", fontSize: "13px" }}>
            📋 Ver historial
          </Link>
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
