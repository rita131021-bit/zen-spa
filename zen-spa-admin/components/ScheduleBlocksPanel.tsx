"use client"

import { FormEvent, Fragment, useEffect, useMemo, useState } from "react"
import { API_BASE, Bloqueo, Horario } from "@/lib/api"

const days  = ["Lunes","Martes","Miercoles","Jueves","Viernes","Sabado","Domingo"]
const hours = ["08:00","09:00","10:00","11:00","14:00","15:00","16:00","17:00"]

function slotKey(dia: string, hora: string) { return `${dia}-${hora}` }

function formatDate(value: string) {
  const [y, m, d] = value.slice(0, 10).split("-")
  return `${d}/${m}/${y}`
}

export default function ScheduleBlocksPanel() {
  const [horarios, setHorarios]       = useState<Horario[]>([])
  const [bloqueos, setBloqueos]       = useState<Bloqueo[]>([])
  const [fecha, setFecha]             = useState("")
  const [fechaFin, setFechaFin]       = useState("")
  const [motivo, setMotivo]           = useState("Cierre administrativo")
  const [message, setMessage]         = useState("")
  const [error, setError]             = useState("")
  const [loading, setLoading]         = useState(true)
  const [toggling, setToggling]       = useState<string | null>(null)

  // Mapa de horarios desde BD
  const horarioMap = useMemo(() => {
    const map = new Map<string, boolean>()
    for (const item of horarios) {
      map.set(slotKey(item.dia, String(item.hora).slice(0,5)), Boolean(item.disponible))
    }
    return map
  }, [horarios])

  function isActive(dia: string, hora: string) {
    const val = horarioMap.get(slotKey(dia, hora))
    return val === undefined ? true : val  // default: disponible
  }

  async function loadData() {
    setLoading(true)
    try {
      const [h, b] = await Promise.all([
        fetch(`${API_BASE}/api/horarios`),
        fetch(`${API_BASE}/api/bloqueos`),
      ])
      if (h.ok) setHorarios(await h.json())
      if (b.ok) setBloqueos(await b.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  async function toggleSlot(dia: string, hora: string) {
    const key    = slotKey(dia, hora)
    const active = isActive(dia, hora)
    setToggling(key)
    setError("")
    try {
      const res = await fetch(`${API_BASE}/api/horarios/toggle`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dia, hora, disponible: !active }),
      })
      if (!res.ok) throw new Error("No se pudo actualizar")
      // Actualizar estado local inmediatamente
      setHorarios((prev) => {
        const exists = prev.find((h) => h.dia === dia && String(h.hora).slice(0,5) === hora)
        if (exists) {
          return prev.map((h) =>
            h.dia === dia && String(h.hora).slice(0,5) === hora
              ? { ...h, disponible: !active }
              : h
          )
        }
        return [...prev, { id: Date.now(), dia, hora, disponible: !active } as Horario]
      })
    } catch {
      setError("No se pudo actualizar el horario.")
    } finally {
      setToggling(null)
    }
  }

  async function crearBloqueo(tipo: "bloqueo" | "vacaciones") {
    setMessage(""); setError("")
    if (!fecha) { setError("Seleccioná una fecha."); return }
    try {
      const res = await fetch(`${API_BASE}/api/bloqueos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha,
          fecha_fin: fechaFin || fecha,
          motivo,
          tipo,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "No se pudo guardar")
      setMessage(data.mensaje || "✅ Guardado correctamente")
      setFecha(""); setFechaFin("")
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar")
    }
  }

  async function eliminarBloqueo(id: number) {
    try {
      await fetch(`${API_BASE}/api/bloqueos/${id}`, { method: "DELETE" })
      setBloqueos((prev) => prev.filter((b) => b.id !== id))
    } catch {
      setError("No se pudo eliminar el bloqueo.")
    }
  }

  return (
    <>
      {/* GRILLA DE HORARIOS SEMANALES */}
      <section className="panel-card" style={{ overflowX: "auto" }}>
        <div style={{ marginBottom: "16px" }}>
          <h3 style={{ margin: "0 0 6px" }}>📅 Horarios semanales disponibles</h3>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>
            Clic en cada celda para activar ✅ o desactivar ❌ ese horario.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "60px repeat(7, 1fr)",
          gap: "4px",
          minWidth: "600px",
        }}>
          {/* Encabezado */}
          <div />
          {days.map((d) => (
            <div key={d} style={{ textAlign: "center", fontSize: "12px", fontWeight: "600", color: "#e9d5ff", padding: "6px 0" }}>
              {d}
            </div>
          ))}

          {/* Filas de horas */}
          {hours.map((hora) => (
            <Fragment key={hora}>
              <div style={{ fontSize: "12px", color: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: "8px" }}>
                {hora}
              </div>
              {days.map((dia) => {
                const active = isActive(dia, hora)
                const key    = slotKey(dia, hora)
                const busy   = toggling === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleSlot(dia, hora)}
                    disabled={loading || busy}
                    title={active ? `${dia} ${hora} — Disponible. Clic para bloquear.` : `${dia} ${hora} — No disponible. Clic para activar.`}
                    style={{
                      padding: "8px 4px",
                      borderRadius: "6px",
                      border: `1px solid ${active ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.4)"}`,
                      background: active ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.1)",
                      color: active ? "#86efac" : "#fca5a5",
                      fontSize: "14px",
                      cursor: loading || busy ? "wait" : "pointer",
                      transition: "all 0.15s",
                      textAlign: "center",
                    }}
                  >
                    {busy ? "⏳" : active ? "✅" : "❌"}
                  </button>
                )
              })}
            </Fragment>
          ))}
        </div>

        {error && <p style={{ color: "#fca5a5", marginTop: "12px", fontSize: "13px" }}>{error}</p>}
      </section>

      {/* BLOQUEO DE FECHAS */}
      <section className="panel-card">
        <h3 style={{ marginBottom: "16px" }}>🔒 Bloquear fechas o vacaciones</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto auto", gap: "12px", alignItems: "end" }}>
          <label style={{ display: "grid", gap: "6px" }}>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "#e9d5ff" }}>Fecha inicio *</span>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </label>
          <label style={{ display: "grid", gap: "6px" }}>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "#e9d5ff" }}>Fecha fin (opcional)</span>
            <input type="date" value={fechaFin} min={fecha} onChange={(e) => setFechaFin(e.target.value)} />
          </label>
          <label style={{ display: "grid", gap: "6px" }}>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "#e9d5ff" }}>Motivo</span>
            <select value={motivo} onChange={(e) => setMotivo(e.target.value)}
              style={{ color: "#fff", background: "var(--card)", border: "1px solid rgba(126,34,206,0.5)", borderRadius: "6px", padding: "10px 12px" }}>
              <option value="Cierre administrativo" style={{ background: "#1e0b6b", color: "#fff" }}>Cierre administrativo</option>
              <option value="Mantenimiento"         style={{ background: "#1e0b6b", color: "#fff" }}>Mantenimiento</option>
              <option value="Capacitacion"          style={{ background: "#1e0b6b", color: "#fff" }}>Capacitacion</option>
              <option value="Vacaciones"            style={{ background: "#1e0b6b", color: "#fff" }}>Vacaciones</option>
              <option value="Feriado local"         style={{ background: "#1e0b6b", color: "#fff" }}>Feriado local</option>
              <option value="Enfermedad"            style={{ background: "#1e0b6b", color: "#fff" }}>Enfermedad</option>
              <option value="Otro"                  style={{ background: "#1e0b6b", color: "#fff" }}>Otro</option>
            </select>
          </label>
          <button className="outline-button yellow" onClick={() => crearBloqueo("bloqueo")}>
            🔒 Bloquear
          </button>
          <button className="outline-button" onClick={() => crearBloqueo("vacaciones")}>
            🏖️ Vacaciones
          </button>
        </div>
        {message && <p style={{ marginTop: "12px", color: "#86efac", fontSize: "13px" }}>{message}</p>}
        {error   && <p style={{ marginTop: "12px", color: "#fca5a5", fontSize: "13px" }}>{error}</p>}
      </section>

      {/* LISTA DE BLOQUEOS */}
      <section className="panel-card table-card">
        <h3 style={{ marginBottom: "16px" }}>📋 Fechas bloqueadas</h3>
        {bloqueos.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: "13px" }}>No hay fechas bloqueadas.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Motivo</th>
                <th>Tipo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {bloqueos.map((b) => {
                const isVacation = String(b.motivo || "").toLowerCase().includes("vacacion")
                return (
                  <tr key={b.id}>
                    <td style={{ fontWeight: "600", color: "#fca5a5" }}>{formatDate(String(b.fecha))}</td>
                    <td style={{ fontSize: "13px" }}>{b.motivo || "Bloqueado"}</td>
                    <td>
                      <span className={isVacation ? "pill blue" : "pill red"}>
                        {isVacation ? "🏖️ Vacaciones" : "🔒 Bloqueo"}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => eliminarBloqueo(b.id)}
                        style={{ padding: "4px 10px", fontSize: "12px", background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: "4px", cursor: "pointer", color: "#fca5a5" }}
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </section>
    </>
  )
}
