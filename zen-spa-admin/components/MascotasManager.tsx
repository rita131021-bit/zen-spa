"use client"

import { FormEvent, useMemo, useState } from "react"
import { MetricCard, PageHeader } from "@/components/AdminShell"
import { API_BASE, Cliente, Mascota, Turno } from "@/lib/api"

type MascotasManagerProps = {
  initialMascotas: Mascota[]
  clientes: Cliente[]
  turnos: Turno[]
}

const emptyMascota = {
  cliente_id: "",
  nombre: "",
  especie: "",
  raza: "",
  peso: "",
  edad: "",
  sexo: "",
  notas: "",
}

function normalizeDate(value: string) {
  return String(value).slice(0, 10)
}

export default function MascotasManager({
  initialMascotas,
  clientes,
  turnos,
}: MascotasManagerProps) {
  const [mascotas, setMascotas] = useState<Mascota[]>(initialMascotas)
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyMascota)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const today = normalizeDate(new Date().toISOString())

  const enriched = useMemo(() => {
    return mascotas.map((mascota) => {
      const petTurns = turnos.filter((t) => Number(t.mascota_id) === Number(mascota.id))
      const sorted = [...petTurns].sort((a, b) =>
        `${b.fecha}${b.hora}`.localeCompare(`${a.fecha}${a.hora}`)
      )
      const last = sorted.find((t) => normalizeDate(String(t.fecha)) <= today)
      const next = [...petTurns]
        .filter((t) => normalizeDate(String(t.fecha)) >= today && t.estado !== "Cancelado")
        .sort((a, b) => `${a.fecha}${a.hora}`.localeCompare(`${b.fecha}${b.hora}`))[0]
      return { mascota, last, next }
    })
  }, [mascotas, turnos, today])

  const filtered = enriched.filter(({ mascota }) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return [mascota.nombre, mascota.especie, mascota.raza, mascota.dueño_nombre]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q))
  })

  const perros = mascotas.filter((m) => String(m.especie || "").toLowerCase().includes("perr")).length
  const gatos = mascotas.filter((m) => String(m.especie || "").toLowerCase().includes("gat")).length
  const activas = enriched.filter((e) => e.next || e.last).length

  async function reload() {
    const res = await fetch(`${API_BASE}/api/mascotas`, { cache: "no-store" })
    if (res.ok) setMascotas(await res.json())
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setMessage("")
    setError("")
    if (!form.cliente_id) {
      setError("Seleccioná un dueño.")
      setSaving(false)
      return
    }
    try {
      const response = await fetch(`${API_BASE}/api/mascotas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_id: Number(form.cliente_id),
          nombre: form.nombre,
          especie: form.especie || null,
          raza: form.raza || null,
          peso: form.peso ? Number(form.peso) : null,
          edad: form.edad || null,
          sexo: form.sexo || null,
          notas: form.notas || null,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "No se pudo crear la mascota")
      setMessage("Mascota creada correctamente")
      setForm(emptyMascota)
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
        eyebrow="pet"
        title="Gestion de Mascotas"
        subtitle="Administra la informacion y el historial de todas las mascotas registradas."
        action={
          <div className="header-actions">
            <button type="button" className="outline-button" onClick={() => setShowForm((v) => !v)}>
              + Nueva mascota
            </button>
          </div>
        }
      />

      <section className="metrics-grid five">
        <MetricCard label="Total de mascotas" value={String(mascotas.length)} detail="Sincronizado con backend" tone="green" />
        <MetricCard label="Perros" value={String(perros)} detail="Segun especie registrada" tone="blue" />
        <MetricCard label="Gatos" value={String(gatos)} detail="Segun especie registrada" tone="yellow" />
        <MetricCard label="Activas" value={String(activas)} detail="Con turnos recientes o proximos" tone="green" />
        <MetricCard label="Sin turnos" value={String(mascotas.length - activas)} detail="Sin actividad registrada" />
      </section>

      {showForm && (
        <section className="panel-card block-form">
          <h3>Nueva mascota</h3>
          <form className="form-grid" onSubmit={handleSubmit}>
            <label>
              Dueño
              <select
                required
                value={form.cliente_id}
                onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}
              >
                <option value="">Seleccionar cliente</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Nombre
              <input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </label>
            <label>
              Especie
              <input value={form.especie} onChange={(e) => setForm({ ...form, especie: e.target.value })} placeholder="Perro, Gato..." />
            </label>
            <label>
              Raza
              <input value={form.raza} onChange={(e) => setForm({ ...form, raza: e.target.value })} />
            </label>
            <label>
              Peso (kg)
              <input value={form.peso} onChange={(e) => setForm({ ...form, peso: e.target.value })} />
            </label>
            <label>
              Edad
              <input value={form.edad} onChange={(e) => setForm({ ...form, edad: e.target.value })} />
            </label>
            <label>
              Sexo
              <select value={form.sexo} onChange={(e) => setForm({ ...form, sexo: e.target.value })}>
                <option value="">-</option>
                <option value="Hembra">Hembra</option>
                <option value="Macho">Macho</option>
              </select>
            </label>
            <label>
              Notas
              <textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
            </label>
            <div className="button-row">
              <button className="outline-button yellow" type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Guardar mascota"}
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
            placeholder="Buscar mascota, dueno o raza..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <table>
          <thead>
            <tr>
              <th>Mascota</th>
              <th>Raza</th>
              <th>Dueno</th>
              <th>Especie</th>
              <th>Ultimo servicio</th>
              <th>Proximo turno</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7}>No hay mascotas para mostrar.</td>
              </tr>
            )}
            {filtered.map(({ mascota, last, next }) => (
              <tr key={mascota.id}>
                <td>
                  <div className="people-cell">
                    <span className="mini-avatar">{mascota.nombre?.[0] || "?"}</span>
                    {mascota.nombre}
                  </div>
                </td>
                <td>{mascota.raza || "-"}</td>
                <td>{mascota.dueño_nombre || "-"}</td>
                <td>{mascota.especie || "-"}</td>
                <td>
                  {last
                    ? `${normalizeDate(String(last.fecha))} — ${last.servicio_nombre || "Servicio"}`
                    : "-"}
                </td>
                <td>
                  {next
                    ? `${normalizeDate(String(next.fecha))} ${String(next.hora).slice(0, 5)}`
                    : "-"}
                </td>
                <td>
                  <span className={next ? "pill green" : last ? "pill yellow" : "pill blue"}>
                    {next ? "Activa" : last ? "En seguimiento" : "Inactiva"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="three-grid">
        <article className="panel-card">
          <h3>Resumen por especie</h3>
          <p>Perros: {perros}</p>
          <p>Gatos: {gatos}</p>
        </article>
        <article className="panel-card donut-card">
          <h3>Mascotas por especie</h3>
          <div className="donut">
            <strong>{mascotas.length}</strong>
            <span>Total</span>
          </div>
        </article>
        <article className="panel-card">
          <h3>Actividad reciente</h3>
          {enriched
            .filter((e) => e.last)
            .slice(0, 3)
            .map(({ mascota, last }) => (
              <p key={mascota.id}>
                {mascota.nombre} — {last?.servicio_nombre || "Servicio"} ({normalizeDate(String(last?.fecha))})
              </p>
            ))}
          {enriched.filter((e) => e.last).length === 0 && <p>Sin actividad registrada.</p>}
        </article>
      </section>
    </>
  )
}
