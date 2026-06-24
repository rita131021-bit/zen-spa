"use client"

import Link from "next/link"
import { Fragment, useMemo, useState } from "react"
import { PageHeader } from "@/components/AdminShell"
import { Bloqueo, Turno } from "@/lib/api"

const hours = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"]

function startOfWeek(base: Date) {
  const date = new Date(base)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(12, 0, 0, 0)
  return date
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function formatDayLabel(date: Date) {
  const names = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"]
  const day   = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  return `${names[date.getDay()]} ${day}/${month}`
}

function formatRangeLabel(start: Date, end: Date) {
  const months = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
  return `${start.getDate()} - ${end.getDate()} de ${months[end.getMonth()]} de ${end.getFullYear()}`
}

function normalizeHour(value: string) {
  return String(value).slice(0, 5)
}

function eventColor(estado: string) {
  if (estado === "Confirmado") return { bg: "rgba(34,197,94,0.25)",  border: "#22c55e", text: "#86efac" }
  if (estado === "Completado") return { bg: "rgba(59,130,246,0.25)", border: "#3b82f6", text: "#93c5fd" }
  if (estado === "Cancelado")  return { bg: "rgba(107,114,128,0.2)", border: "#6b7280", text: "#9ca3af" }
  return { bg: "rgba(250,204,21,0.2)", border: "#facc15", text: "#fde68a" } // Pendiente
}

type CalendarWeekViewProps = {
  initialTurnos: Turno[]
  initialBloqueos: Bloqueo[]
}

export default function CalendarWeekView({ initialTurnos, initialBloqueos }: CalendarWeekViewProps) {
  const [weekOffset, setWeekOffset] = useState(0)
  const today = toIsoDate(new Date())

  const weekStart = useMemo(() => {
    const start = startOfWeek(new Date())
    return addDays(start, weekOffset * 7)
  }, [weekOffset])

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  )

  const weekEnd  = weekDays[6]
  const isoDays  = weekDays.map(toIsoDate)

  const turnosSemana = initialTurnos.filter((t) => isoDays.includes(String(t.fecha).slice(0, 10)))

  const turnosPorCelda = useMemo(() => {
    const map = new Map<string, Turno[]>()
    for (const turno of turnosSemana) {
      const fecha    = String(turno.fecha).slice(0, 10)
      const horaStr  = normalizeHour(String(turno.hora))
      // buscar el slot más cercano
      const slot = hours.find((h) => h === horaStr) || horaStr
      const key  = `${fecha}-${slot}`
      map.set(key, [...(map.get(key) || []), turno])
    }
    return map
  }, [turnosSemana])

  // Set de fechas bloqueadas para pintar la celda entera
  const bloqueosSemana   = initialBloqueos.filter((b) => isoDays.includes(String(b.fecha).slice(0, 10)))
  const fechasBloqueadas = new Set(bloqueosSemana.map((b) => String(b.fecha).slice(0, 10)))

  const confirmados = turnosSemana.filter((t) => t.estado === "Confirmado").length
  const pendientes  = turnosSemana.filter((t) => t.estado === "Pendiente").length
  const proximos    = [...turnosSemana]
    .filter((t) => t.estado !== "Cancelado")
    .sort((a, b) => `${a.fecha}${a.hora}`.localeCompare(`${b.fecha}${b.hora}`))
    .slice(0, 5)

  return (
    <>
      <PageHeader
        eyebrow="cal"
        title="Calendario de Turnos"
        subtitle="Visualizá, gestioná y organizá todos los turnos de la semana."
        action={
          <Link href="/turnos#nuevo-turno" className="outline-button yellow">
            + Nueva reserva
          </Link>
        }
      />

      <section className="panel-card" style={{ overflowX: "auto" }}>
        {/* Navegación */}
        <div className="card-head" style={{ marginBottom: "16px" }}>
          <h3 style={{ margin: 0 }}>{formatRangeLabel(weekStart, weekEnd)}</h3>
          <div className="tab-strip">
            <button type="button" className="outline-button" onClick={() => setWeekOffset((v) => v - 1)}>← Anterior</button>
            <button type="button" className="outline-button" onClick={() => setWeekOffset(0)}>Hoy</button>
            <button type="button" className="outline-button" onClick={() => setWeekOffset((v) => v + 1)}>Siguiente →</button>
          </div>
        </div>

        {/* Grilla */}
        <div style={{ display: "grid", gridTemplateColumns: "60px repeat(7, 1fr)", gap: "1px", minWidth: "700px" }}>

          {/* Header días */}
          <div />
          {weekDays.map((day) => {
            const iso        = toIsoDate(day)
            const isToday    = iso === today
            const isBloqueado = fechasBloqueadas.has(iso)
            return (
              <div
                key={iso}
                style={{
                  textAlign: "center",
                  padding: "8px 4px",
                  fontSize: "12px",
                  fontWeight: "600",
                  borderRadius: "6px",
                  background: isBloqueado
                    ? "rgba(239,68,68,0.15)"
                    : isToday
                    ? "rgba(126,34,206,0.25)"
                    : "rgba(255,255,255,0.04)",
                  color: isBloqueado ? "#fca5a5" : isToday ? "#e9d5ff" : "var(--muted)",
                  border: isToday ? "1px solid rgba(126,34,206,0.5)" : "1px solid transparent",
                }}
              >
                {formatDayLabel(day)}
                {isBloqueado && (
                  <div style={{ fontSize: "10px", color: "#f87171", marginTop: "2px" }}>
                    🔒 {bloqueosSemana.find((b) => String(b.fecha).slice(0, 10) === iso)?.motivo || "Bloqueado"}
                  </div>
                )}
              </div>
            )
          })}

          {/* Filas de horas */}
          {hours.map((hour) => (
            <Fragment key={hour}>
              {/* Etiqueta hora */}
              <div
                style={{ fontSize: "11px", color: "var(--muted)", textAlign: "right", paddingRight: "8px", paddingTop: "6px", alignSelf: "start" }}
              >
                {hour}
              </div>

              {/* Celdas */}
              {weekDays.map((day) => {
                const iso         = toIsoDate(day)
                const isBloqueado = fechasBloqueadas.has(iso)
                const items       = turnosPorCelda.get(`${iso}-${hour}`) || []

                return (
                  <div
                    key={`${iso}-${hour}`}
                    style={{
                      minHeight: "52px",
                      borderTop: "1px solid rgba(255,255,255,0.05)",
                      background: isBloqueado
                        ? "repeating-linear-gradient(45deg, rgba(239,68,68,0.05), rgba(239,68,68,0.05) 4px, transparent 4px, transparent 12px)"
                        : "transparent",
                      padding: "2px",
                      position: "relative",
                    }}
                  >
                    {/* Banner de bloqueo en primera fila */}
                    {isBloqueado && hour === hours[0] && (
                      <div style={{
                        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "10px", color: "rgba(239,68,68,0.6)", pointerEvents: "none",
                        fontWeight: "600",
                      }}>
                        🔒
                      </div>
                    )}

                    {items.length === 0 && !isBloqueado && (
                      <Link
                        href={`/turnos?fecha=${iso}&hora=${hour}#nuevo-turno`}
                        title={`Crear turno el ${iso} a las ${hour}`}
                        style={{
                          position: "absolute",
                          inset: "2px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1px dashed rgba(148,163,184,0.22)",
                          borderRadius: "5px",
                          color: "rgba(226,232,240,0.38)",
                          fontSize: "12px",
                          textDecoration: "none",
                        }}
                      >
                        +
                      </Link>
                    )}

                    {items.map((turno) => {
                      const colors = eventColor(turno.estado || "Pendiente")
                      const nombre  = turno.mascota_nombre  || "Mascota"
                      const servicio = turno.servicio_nombre || "Turno"
                      const cliente  = turno.cliente_nombre  || ""
                      return (
                        <div
                          key={turno.id}
                          style={{
                            background: colors.bg,
                            border: `1px solid ${colors.border}`,
                            borderRadius: "5px",
                            padding: "4px 6px",
                            marginBottom: "2px",
                            fontSize: "11px",
                            lineHeight: "1.3",
                            cursor: "default",
                          }}
                          title={`${turno.estado} — ${cliente} — ${servicio}`}
                        >
                          <div style={{ color: colors.border, fontWeight: "700" }}>
                            {normalizeHour(String(turno.hora))}
                          </div>
                          <div style={{ color: colors.text, fontWeight: "600" }}>{nombre}</div>
                          <div style={{ color: "var(--muted)", fontSize: "10px" }}>{servicio}</div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </Fragment>
          ))}
        </div>
      </section>

      {/* Resumen inferior */}
      <section className="three-grid">
        <article className="panel-card">
          <h3>📊 Resumen de la semana</h3>
          <div style={{ marginTop: "12px", display: "grid", gap: "8px", fontSize: "13px" }}>
            <p style={{ margin: 0, display: "flex", justifyContent: "space-between" }}>
              <span>Total:</span><strong>{turnosSemana.length}</strong>
            </p>
            <p style={{ margin: 0, display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#22c55e" }}>Confirmados:</span><strong>{confirmados}</strong>
            </p>
            <p style={{ margin: 0, display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#facc15" }}>Pendientes:</span><strong>{pendientes}</strong>
            </p>
            <p style={{ margin: 0, display: "flex", justifyContent: "space-between" }}>
              <span>Cancelados:</span>
              <strong>{turnosSemana.filter((t) => t.estado === "Cancelado").length}</strong>
            </p>
          </div>
        </article>

        <article className="panel-card">
          <h3>⏰ Próximos turnos</h3>
          {proximos.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: "13px" }}>Sin turnos esta semana.</p>
          ) : (
            <div style={{ marginTop: "12px", display: "grid", gap: "8px" }}>
              {proximos.map((turno) => {
                const colors = eventColor(turno.estado || "Pendiente")
                return (
                  <div key={turno.id} style={{ fontSize: "12px", display: "flex", gap: "8px", alignItems: "center" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: colors.border, flexShrink: 0 }} />
                    <div>
                      <strong>{turno.mascota_nombre || "Mascota"}</strong>
                      <span style={{ color: "var(--muted)" }}>
                        {" "}— {String(turno.fecha).slice(0, 10)} {normalizeHour(String(turno.hora))}
                      </span>
                      <div style={{ color: "var(--muted)", fontSize: "11px" }}>{turno.servicio_nombre || ""}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <Link href="/turnos" className="wide-button" style={{ display: "block", marginTop: "12px", textAlign: "center", padding: "8px", borderRadius: "6px", background: "rgba(126,34,206,0.3)", color: "#e9d5ff", fontSize: "13px", textDecoration: "none" }}>
            Ver todos los turnos
          </Link>
        </article>

        <article className="panel-card">
          <h3>🔒 Bloqueos esta semana</h3>
          {bloqueosSemana.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: "13px" }}>Sin bloqueos.</p>
          ) : (
            <div style={{ marginTop: "12px", display: "grid", gap: "8px" }}>
              {bloqueosSemana.map((b) => (
                <div key={b.id} style={{ fontSize: "12px", display: "flex", gap: "8px", alignItems: "center" }}>
                  <span style={{ fontSize: "16px" }}>🔒</span>
                  <div>
                    <strong style={{ color: "#fca5a5" }}>{String(b.fecha).slice(0, 10)}</strong>
                    <div style={{ color: "var(--muted)", fontSize: "11px" }}>{b.motivo || "Bloqueado"}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link href="/bloqueos" style={{ display: "block", marginTop: "12px", textAlign: "center", padding: "8px", borderRadius: "6px", background: "rgba(239,68,68,0.15)", color: "#fca5a5", fontSize: "13px", textDecoration: "none" }}>
            Gestionar bloqueos
          </Link>
        </article>
      </section>
    </>
  )
}
