"use client"

import { FormEvent, useState } from "react"
import { API_BASE, Profesional } from "@/lib/api"

type ProfesionalForm = {
  nombre: string
  telefono: string
  email: string
}

const emptyForm: ProfesionalForm = { nombre: "", telefono: "", email: "" }

export default function ProfesionalesManager({ initialProfesionales }: { initialProfesionales: Profesional[] }) {
  const [profesionales, setProfesionales] = useState(initialProfesionales)
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  async function crearProfesional(event: FormEvent) {
    event.preventDefault()
    if (!form.nombre.trim()) return
    setSaving(true)
    setError("")
    setMessage("")

    try {
      const response = await fetch(`${API_BASE}/api/profesionales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          telefono: form.telefono.trim() || null,
          email: form.email.trim() || null,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "No se pudo crear la profesional")

      setProfesionales((current) => [...current, data.data].sort((a, b) => a.nombre.localeCompare(b.nombre)))
      setForm(emptyForm)
      setShowForm(false)
      setMessage(data.mensaje || "Profesional agregada correctamente")
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la profesional")
    } finally {
      setSaving(false)
    }
  }

  async function eliminarProfesional(profesional: Profesional) {
    if (!window.confirm(`¿Eliminar a ${profesional.nombre} del equipo?`)) return
    setError("")
    setMessage("")

    try {
      const response = await fetch(`${API_BASE}/api/profesionales/${profesional.id}`, { method: "DELETE" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "No se pudo eliminar la profesional")

      setProfesionales((current) => current.filter((item) => item.id !== profesional.id))
      setMessage(data.mensaje || "Profesional eliminada correctamente")
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar la profesional")
    }
  }

  return (
    <section className="panel-card table-card" style={{ marginBottom: 14 }}>
      <div className="card-head">
        <div>
          <span>Equipo activo</span>
          <h3>Profesionales ({profesionales.length})</h3>
        </div>
        <button type="button" className="outline-button yellow" onClick={() => setShowForm((current) => !current)}>
          {showForm ? "Cancelar" : "+ Agregar profesional"}
        </button>
      </div>

      {showForm && (
        <form className="form-grid professional-form" onSubmit={crearProfesional}>
          <label>
            Nombre
            <input required value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} />
          </label>
          <label>
            Teléfono
            <input value={form.telefono} onChange={(event) => setForm({ ...form, telefono: event.target.value })} />
          </label>
          <label>
            Email
            <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </label>
          <button className="new-turn-button" type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar profesional"}
          </button>
        </form>
      )}

      {message && <p className="tone-green">{message}</p>}
      {error && <p className="tone-red">{error}</p>}

      <table>
        <thead>
          <tr>
            <th>Profesional</th>
            <th>Teléfono</th>
            <th>Email</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {profesionales.map((profesional) => (
            <tr key={profesional.id}>
              <td style={{ fontWeight: 600 }}>{profesional.nombre}</td>
              <td>{profesional.telefono || "-"}</td>
              <td>{profesional.email || "-"}</td>
              <td><span className="pill green">Activa</span></td>
              <td>
                <button type="button" className="outline-button danger-button" onClick={() => eliminarProfesional(profesional)}>
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
