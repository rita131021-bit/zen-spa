"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { PageHeader } from "@/components/AdminShell"
import { Bloqueo, Turno } from "@/lib/api"

const hours = ["08:00", "09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"]

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
  const names = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"]
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  return `${names[date.getDay()]} ${day}/${month}`
}

function formatRangeLabel(start: Date, end: Date) {
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ]
  return `${start.getDate()} - ${end.getDate()} de ${months[end.getMonth()]} de ${end.getFullYear()}`
}

function normalizeHour(value: string) {
  return String(value).slice(0, 5)
}

function eventTone(estado: string) {
  if (estado === "Pendiente") return "yellow"
  if (estado === "Confirmado") return "green"
  if (estado === "Completado") return "blue"
  if (estado === "Cancelado") return "red"
  return "purple"
}

type CalendarWeekViewProps = {
  initialTurnos: Turno[]
  initialBloqueos: Bloqueo[]
}

export default function CalendarWeekView({ initialTurnos, initialBloqueos }: CalendarWeekViewProps) {
  const [weekOffset, setWeekOffset] = useState(0)

  const weekStart = useMemo(() => {
    const start = startOfWeek(new Date())
    return addDays(start, weekOffset * 7)
  }, [weekOffset])

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart]
  )

  const weekEnd = weekDays[6]
  const isoDays = weekDays.map(toIsoDate)

  const turnosSemana = initialTurnos.filter((turno) => isoDays.includes(String(turno.fecha).slice(0, 10)))

  const turnosPorCelda = useMemo(() => {
    const map = new Map<string, Turno[]>()
    for (const turno of turnosSemana) {
      const fecha = String(turno.fecha).slice(0, 10)
      const hora = normalizeHour(String(turno.hora))
      const hourSlot = hours.find((h) => h === hora) || hora
      const key = `${fecha}-${hourSlot}`
      const list = map.get(key) || []
      list.push(turno)
      map.set(key, list)
    }
    return map
  }, [turnosSemana])

  const bloqueosSemana = initialBloqueos.filter((bloqueo) =>
    isoDays.includes(String(bloqueo.fecha).slice(0, 10))
  )

  const confirmados = turnosSemana.filter((t) => t.estado === "Confirmado").length
  const pendientes = turnosSemana.filter((t) => t.estado === "Pendiente").length
  const proximos = [...turnosSemana]
    .filter((t) => t.estado !== "Cancelado")
    .sort((a, b) => `${a.fecha}${a.hora}`.localeCompare(`${b.fecha}${b.hora}`))
    .slice(0, 3)

  return (
    <>
      <PageHeader
        eyebrow="cal"
        title="Calendario de Turnos"
        subtitle="Visualiza, gestiona y organiza todos los turnos de la semana."
        action={
          <Link href="/turnos#nuevo-turno" className="outline-button">
            Nueva reserva +
          </Link>
        }
      />

      <section className="panel-card">
        <div className="card-head">
          <h3>{formatRangeLabel(weekStart, weekEnd)}</h3>
          <div className="tab-strip">
            <button type="button" className="outline-button" onClick={() => setWeekOffset((v) => v - 1)}>
              Semana anterior
            </button>
            <button type="button" className="active">
              Semana
            </button>
            <button type="button" className="outline-button" onClick={() => setWeekOffset(0)}>
              Hoy
            </button>
            <button type="button" className="outline-button" onClick={() => setWeekOffset((v) => v + 1)}>
              Semana siguiente
            </button>
          </div>
        </div>
        <div className="calendar-grid">
          <div />
          {weekDays.map((day) => (
            <div key={toIsoDate(day)}>{formatDayLabel(day)}</div>
          ))}
          {hours.map((hour) => (
            <div className="schedule-row" key={hour}>
              <div>{hour}</div>
              {weekDays.map((day) => {
                const iso = toIsoDate(day)
                const items = turnosPorCelda.get(`${iso}-${hour}`) || []
                return (
                  <div key={hour + iso}>
                    {items.map((turno) => (
                      <div
                        key={turno.id}
                        className={`calendar-event ${eventTone(turno.estado || "Pendiente")}`}
                        title={`${turno.estado} — ${turno.pago || ""}`}
                      >
                        {normalizeHour(String(turno.hora))}
                        <br />
                        <strong>{turno.mascota_nombre || "Mascota"}</strong>
                        <br />
                        {turno.servicio_nombre || "Servicio"}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </section>

      <section className="three-grid">
        <article className="panel-card">
          <h3>Resumen de la semana</h3>
          <p>Turnos totales: {turnosSemana.length}</p>
          <p>Confirmados: {confirmados}</p>
          <p>Pendientes: {pendientes}</p>
        </article>
        <article className="panel-card">
          <h3>Proximos turnos</h3>
          {proximos.length === 0 && <p>Sin turnos en esta semana.</p>}
          {proximos.map((turno) => (
            <p key={turno.id}>
              {turno.mascota_nombre || "Mascota"} — {String(turno.fecha).slice(0, 10)}{" "}
              {normalizeHour(String(turno.hora))}
            </p>
          ))}
          <Link href="/turnos" className="wide-button">
            Ver todos
          </Link>
        </article>
        <article className="panel-card">
          <h3>Bloqueos y eventos</h3>
          {bloqueosSemana.length === 0 && <p>Sin bloqueos en esta semana.</p>}
          {bloqueosSemana.map((bloqueo) => (
            <p key={bloqueo.id}>
              {String(bloqueo.fecha).slice(0, 10)} — {bloqueo.motivo || "Bloqueado"}
            </p>
          ))}
        </article>
      </section>
    </>
  )
}
