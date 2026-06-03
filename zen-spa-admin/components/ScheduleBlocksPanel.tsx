"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { API_BASE, Bloqueo, Horario } from "@/lib/api"

const days = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"]
const hours = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"]

function formatDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-")
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

function slotKey(dia: string, hora: string) {
  return `${dia}-${hora}`
}

export default function ScheduleBlocksPanel() {
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([])
  const [fecha, setFecha] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [motivo, setMotivo] = useState("Cierre administrativo")
  const [showAllBlocks, setShowAllBlocks] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  const horarioMap = useMemo(() => {
    const map = new Map<string, boolean>()
    for (const item of horarios) {
      const hora = String(item.hora).slice(0, 5)
      map.set(slotKey(item.dia, hora), Boolean(item.disponible))
    }
    return map
  }, [horarios])

  const visibleBloqueos = showAllBlocks ? bloqueos : bloqueos.slice(0, 5)

  async function loadData() {
    setLoading(true)
    try {
      const [horariosRes, bloqueosRes] = await Promise.all([
        fetch(`${API_BASE}/api/horarios`, { cache: "no-store" }),
        fetch(`${API_BASE}/api/bloqueos`, { cache: "no-store" }),
      ])
      if (horariosRes.ok) setHorarios(await horariosRes.json())
      if (bloqueosRes.ok) setBloqueos(await bloqueosRes.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  function isSlotActive(dia: string, hora: string) {
    const value = horarioMap.get(slotKey(dia, hora))
    return value !== false
  }

  async function toggleSlot(dia: string, hora: string) {
    const active = isSlotActive(dia, hora)
    setError("")
    try {
      const response = await fetch(`${API_BASE}/api/horarios/toggle`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dia, hora, disponible: !active }),
      })
      if (!response.ok) throw new Error("No se pudo actualizar")
      await loadData()
    } catch {
      setError("No se pudo actualizar el horario semanal.")
    }
  }

  async function createBlock(tipo: "bloqueo" | "vacaciones") {
    setMessage("")
    setError("")
    if (!fecha) {
      setError("Seleccioná una fecha.")
      return
    }
    if (tipo === "vacaciones" && fechaFin && fechaFin < fecha) {
      setError("La fecha fin debe ser posterior a la fecha inicio.")
      return
    }

    try {
      const response = await fetch(`${API_BASE}/api/bloqueos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha,
          fecha_fin: tipo === "vacaciones" ? fechaFin || fecha : undefined,
          motivo,
          tipo,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "No se pudo guardar")
      setMessage(data.mensaje || "Guardado correctamente")
      setFecha("")
      setFechaFin("")
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el bloqueo")
    }
  }

  async function removeBlock(id: number) {
    setError("")
    try {
      const response = await fetch(`${API_BASE}/api/bloqueos/${id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("No se pudo eliminar")
      await loadData()
    } catch {
      setError("No se pudo eliminar el bloqueo.")
    }
  }

  function handleBlockSubmit(event: FormEvent) {
    event.preventDefault()
    createBlock("bloqueo")
  }

  return (
    <>
      <section className="schedule-layout">
        <article className="panel-card schedule-card">
          <div className="schedule-grid">
            <span>Hora</span>
            {days.map((day) => (
              <span key={day}>{day}</span>
            ))}
            {hours.map((hour) => (
              <div className="schedule-row" key={hour}>
                <b>{hour}</b>
                {days.map((day) => {
                  const active = isSlotActive(day, hour)
                  return (
                    <button
                      key={hour + day}
                      type="button"
                      className={active ? "slot active" : "slot"}
                      title={active ? "Disponible — clic para desactivar" : "No disponible — clic para activar"}
                      onClick={() => toggleSlot(day, hour)}
                      disabled={loading}
                    >
                      {active ? "check" : ""}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </article>

        <article className="panel-card block-card">
          <h3>Bloqueos y Vacaciones</h3>
          {loading && <p>Cargando bloqueos...</p>}
          {!loading && bloqueos.length === 0 && <p>No hay fechas bloqueadas.</p>}
          {visibleBloqueos.map((bloqueo) => {
            const isVacation = String(bloqueo.motivo || "").toLowerCase().includes("vacacion")
            return (
              <p key={bloqueo.id}>
                <strong>{formatDate(String(bloqueo.fecha))}</strong>
                <span className={isVacation ? "pill blue" : "pill red"}>
                  {isVacation ? "Vacaciones" : "Bloqueado"}
                </span>
                <button
                  type="button"
                  className="ghost-button"
                  style={{ marginLeft: 8 }}
                  onClick={() => removeBlock(bloqueo.id)}
                >
                  Quitar
                </button>
              </p>
            )
          })}
          {bloqueos.length > 5 && (
            <button type="button" className="link-button" onClick={() => setShowAllBlocks((v) => !v)}>
              {showAllBlocks ? "Ver menos" : "Ver todos los bloqueos"}
            </button>
          )}
        </article>
      </section>

      <section className="panel-card block-form">
        <h3>Bloquear fecha completa</h3>
        <form
          onSubmit={handleBlockSubmit}
          style={{ display: "grid", gap: 10 }}
        >
          <div>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              aria-label="Fecha a bloquear"
            />
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              aria-label="Fecha fin de vacaciones"
              title="Opcional: fin de vacaciones"
            />
            <select value={motivo} onChange={(e) => setMotivo(e.target.value)}>
              <option>Cierre administrativo</option>
              <option>Mantenimiento</option>
              <option>Capacitacion</option>
              <option>Vacaciones</option>
              <option>Feriado local</option>
            </select>
            <button className="outline-button yellow" type="submit">
              Bloquear fecha
            </button>
            <button
              className="outline-button"
              type="button"
              onClick={() => createBlock("vacaciones")}
            >
              Agregar vacaciones
            </button>
          </div>
        </form>
        {message && <p className="tone-green">{message}</p>}
        {error && <p className="tone-red">{error}</p>}
      </section>
    </>
  )
}
