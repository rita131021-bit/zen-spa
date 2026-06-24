"use client"

import { FormEvent, useMemo, useState } from "react"
import { MetricCard, PageHeader } from "@/components/AdminShell"
import { API_BASE, Cliente, Mascota, Turno } from "@/lib/api"

type ClientesManagerProps = {
  initialClientes: Cliente[]
  mascotas: Mascota[]
  turnos: Turno[]
}

const emptyCliente = {
  nombre: "",
  telefono: "",
  whatsapp: "",
  email: "",
  direccion: "",
  notas: "",
}

export default function ClientesManager({
  initialClientes,
  mascotas,
  turnos,
}: ClientesManagerProps) {
  const [clientes, setClientes] = useState<Cliente[]>(initialClientes)
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<Cliente | null>(null)
  const [form, setForm] = useState(emptyCliente)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const cargarClientes = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/clientes`)
      if (res.ok) setClientes(await res.json())
    } catch (err) {
      console.error("Error cargando clientes:", err)
    }
  }

  const enriched = useMemo(() => {
    return clientes.map((cliente) => {
      const pets = mascotas.filter((m) => Number(m.cliente_id) === Number(cliente.id))
      const clientTurns = turnos.filter((t) => Number(t.cliente_id) === cliente.id)
      const sorted = [...clientTurns].sort((a, b) =>
        `${b.fecha}${b.hora}`.localeCompare(`${a.fecha}${a.hora}`)
      )
      const last = sorted[0]
      const total = clientTurns.reduce((sum, t) => sum + Number(t.servicio_precio || 0), 0)
      return {
        cliente,
        pets,
        last,
        total,
      }
    })
  }, [clientes, mascotas, turnos])

  const filtered = enriched.filter(({ cliente }) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return [cliente.nombre, cliente.telefono, cliente.whatsapp, cliente.email]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q))
  })

  const total = clientes.length
  const thisMonth = clientes.filter((c) => {
    if (!c.creado_en) return false
    const created = new Date(c.creado_en)
    const now = new Date()
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
  }).length
  const conWhatsApp = clientes.filter((c) => c.whatsapp).length

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setMessage("")
    setError("")
    
    if (!form.nombre.trim()) {
      setError("El nombre es obligatorio.")
      setSaving(false)
      return
    }

    const method = editando ? "PUT" : "POST"
    const url = editando ? `${API_BASE}/api/clientes/${editando.id}` : `${API_BASE}/api/clientes`

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          telefono: form.telefono || null,
          whatsapp: form.whatsapp || null,
          email: form.email || null,
          direccion: form.direccion || null,
          notas: form.notas || null,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "No se pudo guardar")
      setMessage(editando ? "✅ Cliente actualizado" : "✅ Cliente creado correctamente")
      setForm(emptyCliente)
      setEditando(null)
      setShowForm(false)
      await cargarClientes()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  async function handleEliminar(id: number) {
    if (!confirm("¿Eliminar este cliente?")) return
    try {
      const res = await fetch(`${API_BASE}/api/clientes/${id}`, { method: "DELETE" })
      if (res.ok) {
        await cargarClientes()
      }
    } catch (err) {
      console.error("Error:", err)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="👥 Gestión"
        title="Clientes y Dueños"
        subtitle="Administra contactos, historial de servicios y preferencias"
        action={
          <button className="outline-button yellow" onClick={() => {
            setEditando(null)
            setForm(emptyCliente)
            setShowForm(!showForm)
          }}>
            {showForm ? "✕ Cancelar" : "+ Nuevo cliente"}
          </button>
        }
      />

      <section className="metrics-grid five">
        <MetricCard label="Total de clientes" value={String(total)} detail="Registrados" tone="purple" />
        <MetricCard label="Nuevos este mes" value={String(thisMonth)} detail="Últimos 30 días" tone="blue" />
        <MetricCard label="Con WhatsApp" value={String(conWhatsApp)} detail="Contacto directo" tone="green" />
        <MetricCard label="Mascotas" value={String(mascotas.length)} detail="En sistema" tone="yellow" />
        <MetricCard label="Turnos pendientes" value={String(turnos.filter((t) => t.estado === "Pendiente").length)} detail="Sin confirmar" tone="yellow" />
      </section>

      {showForm && (
        <section className="panel-card">
          <h3 style={{ marginBottom: "24px", fontSize: "18px", fontWeight: "600" }}>
            👤 {editando ? "Editar" : "Registrar"} Cliente
          </h3>
          <form className="form-grid" onSubmit={handleSubmit} style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
            <label style={{ gridColumn: "1 / -1", display: "grid", gap: "8px" }}>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#e9d5ff", textTransform: "uppercase" }}>👤 Nombre completo *</span>
              <input 
                required
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Nombre del dueño"
                style={{ padding: "11px 12px", minHeight: "42px" }}
              />
            </label>

            <label style={{ display: "grid", gap: "8px" }}>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#e9d5ff", textTransform: "uppercase" }}>☎️ Teléfono</span>
              <input 
                type="tel"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                placeholder="(03447) 123456"
                style={{ padding: "11px 12px", minHeight: "42px" }}
              />
            </label>
            <label style={{ display: "grid", gap: "8px" }}>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#e9d5ff", textTransform: "uppercase" }}>💬 WhatsApp</span>
              <input 
                type="tel"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                placeholder="549xx123456"
                style={{ padding: "11px 12px", minHeight: "42px" }}
              />
            </label>

            <label style={{ gridColumn: "1 / -1", display: "grid", gap: "8px" }}>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#e9d5ff", textTransform: "uppercase" }}>📧 Email</span>
              <input 
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="correo@ejemplo.com"
                style={{ padding: "11px 12px", minHeight: "42px" }}
              />
            </label>

            <label style={{ gridColumn: "1 / -1", display: "grid", gap: "8px" }}>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#e9d5ff", textTransform: "uppercase" }}>📍 Dirección</span>
              <input 
                value={form.direccion}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                placeholder="Calle, número, localidad"
                style={{ padding: "11px 12px", minHeight: "42px" }}
              />
            </label>

            <label style={{ gridColumn: "1 / -1", display: "grid", gap: "8px" }}>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#e9d5ff", textTransform: "uppercase" }}>📝 Notas / Observaciones</span>
              <textarea 
                value={form.notas}
                onChange={(e) => setForm({ ...form, notas: e.target.value })}
                placeholder="Preferencias, referencias, datos de interés..."
                style={{ padding: "12px", minHeight: "80px", fontSize: "14px", lineHeight: "1.5" }}
              />
            </label>

            <div style={{ gridColumn: "1 / -1", display: "flex", gap: "12px", marginTop: "8px" }}>
              <button className="outline-button yellow" type="submit" disabled={saving} style={{ flex: 1 }}>
                {saving ? "⏳ Guardando..." : editando ? "✏️ Actualizar" : "✅ Crear cliente"}
              </button>
              <button className="outline-button" type="button" onClick={() => setShowForm(false)} style={{ flex: 1 }}>
                Cancelar
              </button>
            </div>
          </form>

          {message && (
            <div style={{ marginTop: "16px", padding: "12px", borderRadius: "7px", background: "rgba(34, 197, 94, 0.2)", color: "#86efac", fontSize: "13px" }}>
              {message}
            </div>
          )}
          {error && (
            <div style={{ marginTop: "16px", padding: "12px", borderRadius: "7px", background: "rgba(239, 68, 68, 0.2)", color: "#fca5a5", fontSize: "13px" }}>
              {error}
            </div>
          )}
        </section>
      )}

      <section className="panel-card table-card">
        <div style={{ marginBottom: "16px", display: "flex", gap: "12px", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>Clientes Registrados</h3>
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: "8px 12px", minHeight: "36px", fontSize: "13px", width: "250px" }}
          />
        </div>
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Contacto</th>
              <th>WhatsApp</th>
              <th>Mascotas</th>
              <th>Turnos</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "24px", color: "var(--muted)" }}>
                  {total === 0 ? "📭 No hay clientes" : "🔍 No hay resultados"}
                </td>
              </tr>
            )}
            {filtered.map(({ cliente, pets, total: clientTotal }) => (
              <tr key={cliente.id}>
                <td style={{ fontWeight: "500" }}>{cliente.nombre}</td>
                <td style={{ fontSize: "12px" }}>
                  {cliente.telefono && <div>☎️ {cliente.telefono}</div>}
                  {cliente.email && <div style={{ color: "var(--muted)" }}>{cliente.email}</div>}
                </td>
                <td>
                  {cliente.whatsapp ? (
                    <a href={`https://wa.me/${cliente.whatsapp}`} target="_blank" rel="noopener noreferrer" style={{ color: "#22c55e", fontSize: "12px", textDecoration: "none" }}>
                      💬 {cliente.whatsapp}
                    </a>
                  ) : (
                    <span style={{ color: "var(--muted)", fontSize: "12px" }}>-</span>
                  )}
                </td>
                <td style={{ fontSize: "13px", fontWeight: "600" }}>{pets.length} 🐾</td>
                <td style={{ fontSize: "13px", fontWeight: "600" }}>
                  {turnos.filter((t) => Number(t.cliente_id) === cliente.id).length}
                </td>
                <td style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => { setEditando(cliente); setForm(cliente as typeof emptyCliente); setShowForm(true); }} style={{ padding: "4px 8px", fontSize: "12px", background: "rgba(126, 34, 206, 0.3)", border: "1px solid rgba(126, 34, 206, 0.5)", borderRadius: "4px", cursor: "pointer", color: "#e9d5ff" }}>✏️</button>
                  <button onClick={() => handleEliminar(cliente.id!)} style={{ padding: "4px 8px", fontSize: "12px", background: "rgba(239, 68, 68, 0.3)", border: "1px solid rgba(239, 68, 68, 0.5)", borderRadius: "4px", cursor: "pointer", color: "#fca5a5" }}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  )
}
