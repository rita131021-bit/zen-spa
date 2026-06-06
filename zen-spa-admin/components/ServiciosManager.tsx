"use client"

import { FormEvent, useState } from "react"
import { MetricCard, PageHeader } from "@/components/AdminShell"
import { API_BASE } from "@/lib/api"

type Servicio = {
  id?: number
  nombre: string
  descripcion?: string
  precio_base: number | string
  duracion_minutos?: number
  categoria?: string
  activo?: boolean
}

const categorias = ["spa", "guarderia", "peluqueria", "terapia"]

export default function ServiciosManager() {
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<Servicio | null>(null)
  const [form, setForm] = useState<Servicio>({
    nombre: "",
    descripcion: "",
    precio_base: "",
    duracion_minutos: 60,
    categoria: "spa",
    activo: true,
  })
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const cargarServicios = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/servicios`)
      if (res.ok) {
        const data = await res.json()
        setServicios(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error("Error cargando servicios:", err)
    }
    setLoading(false)
  }

  useState(() => {
    cargarServicios()
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setMessage("")
    setError("")

    const method = editando ? "PUT" : "POST"
    const url = editando ? `${API_BASE}/api/servicios/${editando.id}` : `${API_BASE}/api/servicios`

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          precio_base: Number(form.precio_base),
          duracion_minutos: Number(form.duracion_minutos) || 60,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage(editando ? "✅ Servicio actualizado" : "✅ Servicio creado")
        setForm({ nombre: "", descripcion: "", precio_base: "", duracion_minutos: 60, categoria: "spa", activo: true })
        setEditando(null)
        setShowForm(false)
        cargarServicios()
      } else {
        setError(data.error || "Error al guardar")
      }
    } catch (err) {
      setError("Error al guardar el servicio")
    }
  }

  const handleEliminar = async (id: number) => {
    if (!confirm("¿Desactivar este servicio?")) return
    try {
      const res = await fetch(`${API_BASE}/api/servicios/${id}`, { method: "DELETE" })
      if (res.ok) {
        cargarServicios()
      }
    } catch (err) {
      console.error("Error eliminando:", err)
    }
  }

  const totalServicios = servicios.length
  const activos = servicios.filter((s) => s.activo).length
  const precioPromedio = servicios.length > 0 ? servicios.reduce((sum, s) => sum + Number(s.precio_base), 0) / servicios.length : 0
  const precioMax = servicios.length > 0 ? Math.max(...servicios.map((s) => Number(s.precio_base))) : 0
  const precioMin = servicios.length > 0 ? Math.min(...servicios.map((s) => Number(s.precio_base))) : 0

  return (
    <>
      <PageHeader
        eyebrow="🎯 Catálogo"
        title="Gestión de Servicios"
        subtitle="Administra servicios, precios y disponibilidad"
        action={
          <button className="outline-button yellow" onClick={() => {
            setEditando(null)
            setForm({ nombre: "", descripcion: "", precio_base: "", duracion_minutos: 60, categoria: "spa", activo: true })
            setShowForm(!showForm)
          }}>
            {showForm ? "✕ Cancelar" : "+ Nuevo servicio"}
          </button>
        }
      />

      <section className="metrics-grid five">
        <MetricCard label="Total servicios" value={String(totalServicios)} detail="Registrados" tone="purple" />
        <MetricCard label="Activos" value={String(activos)} detail="Disponibles" tone="green" />
        <MetricCard label="Precio promedio" value={`$${precioPromedio.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`} detail="Promedio" tone="blue" />
        <MetricCard label="Máximo" value={`$${precioMax.toLocaleString("es-AR")}`} detail="Mayor precio" tone="yellow" />
        <MetricCard label="Mínimo" value={`$${precioMin.toLocaleString("es-AR")}`} detail="Menor precio" tone="yellow" />
      </section>

      {showForm && (
        <section className="panel-card">
          <h3 style={{ marginBottom: "20px" }}>{editando ? "✏️ Editar Servicio" : "➕ Nuevo Servicio"}</h3>
          <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <label style={{ display: "grid", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "#e9d5ff" }}>Nombre *</span>
              <input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Spa Premium" />
            </label>
            <label style={{ display: "grid", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "#e9d5ff" }}>Categoría</span>
              <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
                {categorias.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: "grid", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "#e9d5ff" }}>Precio base ($) *</span>
              <input required type="number" step="100" value={form.precio_base} onChange={(e) => setForm({ ...form, precio_base: e.target.value })} placeholder="4500" />
            </label>
            <label style={{ display: "grid", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "#e9d5ff" }}>Duración (min)</span>
              <input type="number" value={form.duracion_minutos} onChange={(e) => setForm({ ...form, duracion_minutos: Number(e.target.value) })} />
            </label>
            <label style={{ gridColumn: "1 / -1", display: "grid", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "#e9d5ff" }}>Descripción</span>
              <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Detalles del servicio..." style={{ minHeight: "60px" }} />
            </label>
            <div style={{ gridColumn: "1 / -1", display: "flex", gap: "12px" }}>
              <button type="submit" className="outline-button yellow" style={{ flex: 1 }}>
                ✅ {editando ? "Actualizar" : "Crear"} Servicio
              </button>
              <button type="button" className="outline-button" onClick={() => setShowForm(false)} style={{ flex: 1 }}>
                Cancelar
              </button>
            </div>
          </form>
          {message && <div style={{ marginTop: "12px", padding: "12px", background: "rgba(34, 197, 94, 0.2)", color: "#86efac", fontSize: "13px", borderRadius: "6px" }}>{message}</div>}
          {error && <div style={{ marginTop: "12px", padding: "12px", background: "rgba(239, 68, 68, 0.2)", color: "#fca5a5", fontSize: "13px", borderRadius: "6px" }}>{error}</div>}
        </section>
      )}

      <section className="panel-card table-card">
        <h3 style={{ marginBottom: "16px" }}>Servicios Registrados</h3>
        {loading ? (
          <p style={{ textAlign: "center", color: "var(--muted)" }}>Cargando...</p>
        ) : servicios.length === 0 ? (
          <p style={{ textAlign: "center", color: "var(--muted)" }}>No hay servicios. Crea uno para comenzar.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Duración</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {servicios.map((srv) => (
                <tr key={srv.id}>
                  <td style={{ fontWeight: "500" }}>{srv.nombre}</td>
                  <td style={{ fontSize: "12px", color: "var(--muted)" }}>{srv.categoria || "-"}</td>
                  <td style={{ fontWeight: "600", color: "#facc15" }}>${Number(srv.precio_base).toLocaleString("es-AR")}</td>
                  <td style={{ fontSize: "12px" }}>{srv.duracion_minutos} min</td>
                  <td>
                    <span className={srv.activo ? "pill green" : "pill gray"}>
                      {srv.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => {
                        setEditando(srv)
                        setForm(srv as Servicio)
                        setShowForm(true)
                      }}
                      style={{ padding: "4px 8px", fontSize: "12px", background: "rgba(126, 34, 206, 0.3)", border: "1px solid rgba(126, 34, 206, 0.5)", borderRadius: "4px", cursor: "pointer", color: "#e9d5ff" }}
                    >
                      ✏️
                    </button>
                    <button onClick={() => handleEliminar(srv.id!)} style={{ padding: "4px 8px", fontSize: "12px", background: "rgba(239, 68, 68, 0.3)", border: "1px solid rgba(239, 68, 68, 0.5)", borderRadius: "4px", cursor: "pointer", color: "#fca5a5" }}>
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  )
}
