"use client"

import { FormEvent, useEffect, useState } from "react"
import { MetricCard, PageHeader } from "@/components/AdminShell"
import { API_BASE } from "@/lib/api"

type Descuento = {
  id: number
  nombre: string
  porcentaje: number
  turnos_requeridos: number
  meses_requeridos: number
  descripcion?: string
  activo: boolean
}

const emptyForm = {
  nombre: "",
  porcentaje: "",
  turnos_requeridos: "",
  meses_requeridos: "",
  descripcion: "",
}

export default function DescuentosManager() {
  const [descuentos, setDescuentos] = useState<Descuento[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<Descuento | null>(null)
  const [form, setForm]         = useState(emptyForm)
  const [message, setMessage]   = useState("")
  const [error, setError]       = useState("")
  const [saving, setSaving]     = useState(false)

  const cargar = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/descuentos`)
      if (res.ok) setDescuentos(await res.json())
    } catch {}
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  const abrirEditar = (d: Descuento) => {
    setEditando(d)
    setForm({
      nombre: d.nombre,
      porcentaje: String(d.porcentaje),
      turnos_requeridos: String(d.turnos_requeridos),
      meses_requeridos: String(d.meses_requeridos),
      descripcion: d.descripcion || "",
    })
    setShowForm(true)
    setMessage(""); setError("")
  }

  const abrirNuevo = () => {
    setEditando(null)
    setForm(emptyForm)
    setShowForm(true)
    setMessage(""); setError("")
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true); setMessage(""); setError("")

    const body = {
      nombre:            form.nombre,
      porcentaje:        Number(form.porcentaje),
      turnos_requeridos: Number(form.turnos_requeridos) || 0,
      meses_requeridos:  Number(form.meses_requeridos)  || 0,
      descripcion:       form.descripcion || null,
      activo:            true,
    }

    const method = editando ? "PUT" : "POST"
    const url    = editando ? `${API_BASE}/api/descuentos/${editando.id}` : `${API_BASE}/api/descuentos`

    try {
      const res  = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Error al guardar")
      setMessage(editando ? "✅ Descuento actualizado" : "✅ Descuento creado")
      setForm(emptyForm); setEditando(null); setShowForm(false)
      cargar()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error")
    } finally {
      setSaving(false)
    }
  }

  const handleDesactivar = async (id: number) => {
    if (!confirm("¿Desactivar este descuento?")) return
    await fetch(`${API_BASE}/api/descuentos/${id}`, { method: "DELETE" })
    cargar()
  }

  const activos = descuentos.filter((d) => d.activo).length

  return (
    <>
      <PageHeader
        eyebrow="🎁 Fidelidad"
        title="Descuentos por Fidelidad"
        subtitle="Configurá los descuentos automáticos según la cantidad de visitas o antigüedad del cliente."
        action={
          <button className="outline-button yellow" onClick={abrirNuevo}>
            + Nuevo descuento
          </button>
        }
      />

      <section className="metrics-grid five">
        <MetricCard label="Total descuentos" value={String(descuentos.length)} detail="Configurados" tone="purple" />
        <MetricCard label="Activos"           value={String(activos)}           detail="Aplicándose"   tone="green"  />
        <MetricCard label="Máximo descuento"
          value={descuentos.length ? `${Math.max(...descuentos.map((d) => d.porcentaje))}%` : "—"}
          detail="Porcentaje más alto" tone="yellow" />
        <MetricCard label="Req. mínimo"
          value={descuentos.filter((d) => d.activo && d.turnos_requeridos > 0).length
            ? `${Math.min(...descuentos.filter((d) => d.activo && d.turnos_requeridos > 0).map((d) => d.turnos_requeridos))} visitas`
            : "—"}
          detail="Para primer descuento" tone="blue" />
        <MetricCard label="Inactivos" value={String(descuentos.length - activos)} detail="Desactivados" tone="yellow" />
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="panel-card" style={{ background: "rgba(126,34,206,0.1)", border: "1px solid rgba(126,34,206,0.3)" }}>
        <h3 style={{ marginBottom: "10px" }}>ℹ️ Cómo funcionan los descuentos automáticos</h3>
        <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0, lineHeight: "1.6" }}>
          Al crear un turno, el sistema detecta automáticamente cuántos turnos completados tiene el cliente y 
          aplica el mayor descuento disponible. Por ejemplo: si un cliente tiene 12 turnos completados, 
          se aplica el descuento de <strong style={{ color: "#e9d5ff" }}>10% (Cliente Frecuente)</strong> aunque 
          no el de 20% (que requiere 20 visitas). El descuento se muestra en el formulario de nuevo turno.
        </p>
      </section>

      {/* FORMULARIO */}
      {showForm && (
        <section className="panel-card">
          <h3 style={{ marginBottom: "20px" }}>
            {editando ? "✏️ Editar descuento" : "➕ Nuevo descuento"}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <label style={{ display: "grid", gap: "6px", gridColumn: "1/-1" }}>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "#e9d5ff" }}>NOMBRE *</span>
              <input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Cliente VIP" />
            </label>

            <label style={{ display: "grid", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "#e9d5ff" }}>PORCENTAJE (%) *</span>
              <input required type="number" min="1" max="100" step="1"
                value={form.porcentaje} onChange={(e) => setForm({ ...form, porcentaje: e.target.value })}
                placeholder="10" />
            </label>

            <label style={{ display: "grid", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "#e9d5ff" }}>DESCRIPCIÓN</span>
              <input value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Ej: Después de 10 visitas" />
            </label>

            <label style={{ display: "grid", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "#e9d5ff" }}>
                🐾 TURNOS REQUERIDOS
              </span>
              <input type="number" min="0" value={form.turnos_requeridos}
                onChange={(e) => setForm({ ...form, turnos_requeridos: e.target.value })}
                placeholder="0 = no aplica" />
              <span style={{ fontSize: "11px", color: "var(--muted)" }}>Cantidad de turnos completados para activarse</span>
            </label>

            <label style={{ display: "grid", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "#e9d5ff" }}>
                📅 MESES COMO CLIENTE
              </span>
              <input type="number" min="0" value={form.meses_requeridos}
                onChange={(e) => setForm({ ...form, meses_requeridos: e.target.value })}
                placeholder="0 = no aplica" />
              <span style={{ fontSize: "11px", color: "var(--muted)" }}>Meses desde el primer turno para activarse</span>
            </label>

            <div style={{ gridColumn: "1/-1", display: "flex", gap: "12px" }}>
              <button type="submit" className="outline-button yellow" disabled={saving} style={{ flex: 1 }}>
                {saving ? "⏳ Guardando..." : editando ? "✅ Actualizar" : "✅ Crear descuento"}
              </button>
              <button type="button" className="outline-button" onClick={() => setShowForm(false)} style={{ flex: 1 }}>
                Cancelar
              </button>
            </div>
          </form>

          {message && <div style={{ marginTop: "12px", padding: "10px", background: "rgba(34,197,94,0.2)", color: "#86efac", borderRadius: "6px", fontSize: "13px" }}>{message}</div>}
          {error   && <div style={{ marginTop: "12px", padding: "10px", background: "rgba(239,68,68,0.2)", color: "#fca5a5", borderRadius: "6px", fontSize: "13px" }}>{error}</div>}
        </section>
      )}

      {/* TABLA */}
      <section className="panel-card table-card">
        <h3 style={{ marginBottom: "16px" }}>Descuentos configurados</h3>
        {loading ? <p>Cargando...</p> : descuentos.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>No hay descuentos. Creá el primero.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Descuento</th>
                <th>Turnos req.</th>
                <th>Meses req.</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {descuentos.map((d) => (
                <tr key={d.id}>
                  <td style={{ fontWeight: "600" }}>{d.nombre}</td>
                  <td style={{ color: "#22c55e", fontWeight: "700", fontSize: "16px" }}>{d.porcentaje}%</td>
                  <td style={{ fontSize: "13px" }}>
                    {d.turnos_requeridos > 0
                      ? <span style={{ color: "#a78bfa" }}>🐾 {d.turnos_requeridos} turnos</span>
                      : <span style={{ color: "var(--muted)" }}>—</span>}
                  </td>
                  <td style={{ fontSize: "13px" }}>
                    {d.meses_requeridos > 0
                      ? <span style={{ color: "#60a5fa" }}>📅 {d.meses_requeridos} meses</span>
                      : <span style={{ color: "var(--muted)" }}>—</span>}
                  </td>
                  <td style={{ fontSize: "12px", color: "var(--muted)" }}>{d.descripcion || "—"}</td>
                  <td>
                    <span className={d.activo ? "pill green" : "pill gray"}>
                      {d.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td style={{ display: "flex", gap: "6px" }}>
                    <button onClick={() => abrirEditar(d)}
                      style={{ padding: "4px 8px", fontSize: "12px", background: "rgba(126,34,206,0.3)", border: "1px solid rgba(126,34,206,0.5)", borderRadius: "4px", cursor: "pointer", color: "#e9d5ff" }}>
                      ✏️
                    </button>
                    {d.activo && (
                      <button onClick={() => handleDesactivar(d.id)}
                        style={{ padding: "4px 8px", fontSize: "12px", background: "rgba(239,68,68,0.3)", border: "1px solid rgba(239,68,68,0.5)", borderRadius: "4px", cursor: "pointer", color: "#fca5a5" }}>
                        🗑️
                      </button>
                    )}
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
