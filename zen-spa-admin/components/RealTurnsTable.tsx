"use client"

import { useState } from "react"
import { API_BASE, Turno } from "@/lib/api"

export default function RealTurnsTable({
  title,
  turns,
  limit,
}: {
  title: string
  turns: Turno[]
  limit?: number
}) {
  const [turnoUpdates, setTurnoUpdates] = useState<Record<number, Partial<Turno>>>({})
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editData, setEditData] = useState<{ estado: string; pago: string }>({ estado: "", pago: "" })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const mergedTurns = turns.map((turn) => ({ ...turn, ...turnoUpdates[turn.id] }))
  const rows = limit ? mergedTurns.slice(0, limit) : mergedTurns

  function startEdit(turn: Turno) {
    setEditingId(turn.id)
    setEditData({
      estado: turn.estado || "Pendiente",
      pago: turn.pago || "Pendiente",
    })
    setMessage("")
    setError("")
  }

  async function handleSave(turnoId: number) {
    setSaving(true)
    try {
      const response = await fetch(`${API_BASE}/api/turnos/${turnoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "No se pudo guardar")
      }

      setTurnoUpdates((prev) => ({
        ...prev,
        [turnoId]: { estado: editData.estado, pago: editData.pago },
      }))

      setMessage("Turno actualizado correctamente")
      setEditingId(null)
      setTimeout(() => setMessage(""), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setEditingId(null)
    setMessage("")
    setError("")
  }

  return (
    <section className="panel-card table-card">
      <h3>{title}</h3>
      {message && <p className="tone-green">{message}</p>}
      {error && <p className="tone-red">{error}</p>}
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
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((turn) =>
            editingId === turn.id ? (
              <tr key={turn.id} className="editing-row">
                <td>{String(turn.fecha).slice(0, 10)}</td>
                <td>{String(turn.hora).slice(0, 5)}</td>
                <td>{turn.mascota_nombre || "-"}</td>
                <td>{turn.cliente_nombre || "-"}</td>
                <td>{turn.servicio_nombre || "-"}</td>
                <td>{turn.profesional_nombre || "-"}</td>
                <td>
                  <select
                    value={editData.estado}
                    onChange={(e) => setEditData({ ...editData, estado: e.target.value })}
                    className="inline-select"
                  >
                    <option>Pendiente</option>
                    <option>Confirmado</option>
                    <option>Completado</option>
                    <option>Cancelado</option>
                  </select>
                </td>
                <td>
                  <select
                    value={editData.pago}
                    onChange={(e) => setEditData({ ...editData, pago: e.target.value })}
                    className="inline-select"
                  >
                    <option>Pendiente</option>
                    <option>Sena</option>
                    <option>Pagado</option>
                  </select>
                </td>
                <td>
                  <button
                    className="ghost-button"
                    onClick={() => handleSave(turn.id)}
                    disabled={saving}
                  >
                    {saving ? "..." : "✓"}
                  </button>
                  <button
                    className="ghost-button"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ) : (
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
                <td>
                  <button
                    className="ghost-button"
                    onClick={() => startEdit(turn)}
                  >
                    Editar
                  </button>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </section>
  )
}
