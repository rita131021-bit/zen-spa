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
  const [form, setForm] = useState(emptyCliente)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const enriched = useMemo(() => {
    return clientes.map((cliente) => {
      const pets = mascotas.filter((m) => Number(m.cliente_id) === Number(cliente.id))
      const clientTurns = turnos.filter((t) => Number(t.cliente_id) === cliente.id)
      const sorted = [...clientTurns].sort((a, b) =>
        `${b.fecha}${b.hora}`.localeCompare(`${a.fecha}${a.hora}`)
      )
      const last = sorted[0]
      const total = clientTurns.reduce((sum, t) => sum + Number((t as Turno & { servicio_precio?: number }).servicio_precio || 0), 0)
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

  async function reload() {
    const res = await fetch(`${API_BASE}/api/clientes`, { cache: "no-store" })
    if (res.ok) setClientes(await res.json())
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setMessage("")
    setError("")
    try {
      const response = await fetch(`${API_BASE}/api/clientes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "No se pudo crear el cliente")
      setMessage("Cliente creado correctamente")
      setForm(emptyCliente)
      setShowForm(false)
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="usr"
        title="Gestion de Clientes"
        subtitle="Administra la informacion y el historial de todos tus clientes."
        action={
          <div className="header-actions">
            <button type="button" className="outline-button" onClick={() => setShowForm((v) => !v)}>
              + Nuevo cliente
            </button>
          </div>
        }
      />

      <section className="metrics-grid five">
        <MetricCard label="Total de clientes" value={String(total)} detail="Sincronizado con backend" tone="green" />
        <MetricCard label="Clientes nuevos (mes)" value={String(thisMonth)} detail="Segun fecha de alta" tone="green" />
        <MetricCard label="Con mascotas" value={String(enriched.filter((e) => e.pets.length > 0).length)} detail="Clientes con al menos una mascota" tone="yellow" />
        <MetricCard label="Con turnos" value={String(enriched.filter((e) => e.last).length)} detail="Historial de reservas" />
        <MetricCard label="Sin turnos" value={String(enriched.filter((e) => !e.last).length)} detail="Aun sin reservas" tone="red" />
      </section>

      {showForm && (
        <section className="panel-card block-form">
          <h3>Nuevo cliente</h3>
          <form className="form-grid" onSubmit={handleSubmit}>
            <label>
              Nombre
              <input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </label>
            <label>
              Telefono
              <input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            </label>
            <label>
              WhatsApp
              <input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
            </label>
            <label>
              Email
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </label>
            <label>
              Direccion
              <input value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
            </label>
            <label>
              Notas
              <textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
            </label>
            <div className="button-row">
              <button className="outline-button yellow" type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Guardar cliente"}
              </button>
              <button className="outline-button" type="button" onClick={() => setShowForm(false)}>
                Cancelar
              </button>
            </div>
          </form>
          {message && <p className="tone-green">{message}</p>}
          {error && <p className="tone-red">{error}</p>}
        </section>
      )}

      <section className="panel-card table-card">
        <div className="card-head">
          <input
            className="small-search"
            placeholder="Buscar cliente por nombre, telefono o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Contacto</th>
              <th>Mascotas</th>
              <th>Ultimo turno</th>
              <th>Total gastado</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6}>No hay clientes para mostrar.</td>
              </tr>
            )}
            {filtered.map(({ cliente, pets, last, total }) => (
              <tr key={cliente.id}>
                <td>
                  <div className="people-cell">
                    <span className="mini-avatar">{cliente.nombre?.[0] || "?"}</span>
                    {cliente.nombre}
                  </div>
                </td>
                <td>{cliente.whatsapp || cliente.telefono || cliente.email || "-"}</td>
                <td>{pets.map((p) => p.nombre).join(", ") || "-"}</td>
                <td>
                  {last
                    ? `${String(last.fecha).slice(0, 10)} ${String(last.hora).slice(0, 5)}`
                    : "-"}
                </td>
                <td>${total.toLocaleString("es-AR")}</td>
                <td>
                  <span className={last ? "pill green" : "pill yellow"}>
                    {last ? "Activo" : "Sin turnos"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="three-grid">
        <article className="panel-card donut-card">
          <h3>Segmentacion de clientes</h3>
          <div className="donut">
            <strong>{total}</strong>
            <span>Total</span>
          </div>
        </article>
        <article className="panel-card">
          <h3>Clientes nuevos</h3>
          <p>{thisMonth} alta(s) este mes</p>
        </article>
        <article className="panel-card">
          <h3>Resumen rapido</h3>
          <p>{enriched.filter((e) => e.pets.length > 0).length} con mascotas registradas</p>
          <p>{enriched.filter((e) => e.last).length} con historial de turnos</p>
        </article>
      </section>
    </>
  )
}
