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
  tipo_mascota: "",
  raza: "",
  talla: "",
  peso: "",
  edad: "",
  sexo: "",
  alimento_tipo: "",
  alimento_especial: false,
  horario_preferido: "",
  camita: false,
  mantita: false,
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
  const [editando, setEditando] = useState<Mascota | null>(null)
  const [form, setForm] = useState(emptyMascota)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const today = normalizeDate(new Date().toISOString())

  const cargarMascotas = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/mascotas`)
      if (res.ok) setMascotas(await res.json())
    } catch (err) {
      console.error("Error cargando mascotas:", err)
    }
  }

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
  const conAlimentoEspecial = mascotas.filter((m) => m.alimento_especial).length
  const activas = enriched.filter((e) => e.next || e.last).length

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
    if (!form.nombre.trim()) {
      setError("El nombre de la mascota es obligatorio.")
      setSaving(false)
      return
    }

    const method = editando ? "PUT" : "POST"
    const url = editando ? `${API_BASE}/api/mascotas/${editando.id}` : `${API_BASE}/api/mascotas`

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_id: Number(form.cliente_id),
          nombre: form.nombre.trim(),
          especie: form.especie || null,
          tipo_mascota: form.tipo_mascota || null,
          raza: form.raza || null,
          talla: form.talla || null,
          peso: form.peso ? Number(form.peso) : null,
          edad: form.edad || null,
          sexo: form.sexo || null,
          alimento_tipo: form.alimento_tipo || null,
          alimento_especial: Boolean(form.alimento_especial),
          horario_preferido: form.horario_preferido || null,
          camita: Boolean(form.camita),
          mantita: Boolean(form.mantita),
          notas: form.notas || null,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "No se pudo guardar la mascota")
      setMessage(editando ? "✅ Mascota actualizada" : "✅ Mascota creada correctamente")
      setForm(emptyMascota)
      setEditando(null)
      setShowForm(false)
      await cargarMascotas()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  async function handleEliminar(id: number) {
    if (!confirm("¿Eliminar esta mascota?")) return
    try {
      const res = await fetch(`${API_BASE}/api/mascotas/${id}`, { method: "DELETE" })
      if (res.ok) {
        await cargarMascotas()
      }
    } catch (err) {
      console.error("Error:", err)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="🐾 Gestión"
        title="Mascotas Registradas"
        subtitle="Administra la información completa, preferencias y historial de todas las mascotas."
        action={
          <button className="outline-button yellow" onClick={() => {
            setEditando(null)
            setForm(emptyMascota)
            setShowForm(!showForm)
          }}>
            {showForm ? "✕ Cancelar" : "+ Nueva mascota"}
          </button>
        }
      />

      <section className="metrics-grid five">
        <MetricCard label="Total de mascotas" value={String(mascotas.length)} detail="Registradas" tone="purple" />
        <MetricCard label="Perros" value={String(perros)} detail="En el sistema" tone="blue" />
        <MetricCard label="Gatos" value={String(gatos)} detail="En el sistema" tone="green" />
        <MetricCard label="Alimento especial" value={String(conAlimentoEspecial)} detail="Con requisitos" tone="yellow" />
        <MetricCard label="Activas" value={String(activas)} detail="Con turnos" tone="green" />
      </section>

      {showForm && (
        <section className="panel-card">
          <h3 style={{ marginBottom: "24px", fontSize: "18px", fontWeight: "600" }}>
            🐱 {editando ? "Editar" : "Registrar"} Mascota
          </h3>
          <form className="form-grid" onSubmit={handleSubmit} style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
            <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <label style={{ display: "grid", gap: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#e9d5ff", textTransform: "uppercase" }}>👤 Dueño *</span>
                <select required value={form.cliente_id} onChange={(e) => setForm({ ...form, cliente_id: e.target.value })} style={{ padding: "11px 12px", minHeight: "42px" }}>
                  <option value="">Seleccionar cliente</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: "grid", gap: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#e9d5ff", textTransform: "uppercase" }}>🏷️ Nombre *</span>
                <input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Luna, Max, Belu..." style={{ padding: "11px 12px", minHeight: "42px" }} />
              </label>
            </div>

            <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <label style={{ display: "grid", gap: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#e9d5ff", textTransform: "uppercase" }}>🦴 Especie</span>
                <select value={form.especie} onChange={(e) => setForm({ ...form, especie: e.target.value })} style={{ padding: "11px 12px", minHeight: "42px" }}>
                  <option value="">Seleccionar</option>
                  <option value="Perro">Perro</option>
                  <option value="Gato">Gato</option>
                  <option value="Conejo">Conejo</option>
                  <option value="Loro">Loro</option>
                  <option value="Otro">Otro</option>
                </select>
              </label>
              <label style={{ display: "grid", gap: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#e9d5ff", textTransform: "uppercase" }}>🏷️ Tipo</span>
                <input value={form.tipo_mascota} onChange={(e) => setForm({ ...form, tipo_mascota: e.target.value })} placeholder="Poodle, Siamés..." style={{ padding: "11px 12px", minHeight: "42px" }} />
              </label>
            </div>

            <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <label style={{ display: "grid", gap: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#e9d5ff", textTransform: "uppercase" }}>🎯 Raza</span>
                <input value={form.raza} onChange={(e) => setForm({ ...form, raza: e.target.value })} placeholder="Labrador, Persa..." style={{ padding: "11px 12px", minHeight: "42px" }} />
              </label>
              <label style={{ display: "grid", gap: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#e9d5ff", textTransform: "uppercase" }}>📏 Talla</span>
                <select value={form.talla} onChange={(e) => setForm({ ...form, talla: e.target.value })} style={{ padding: "11px 12px", minHeight: "42px" }}>
                  <option value="">Seleccionar</option>
                  <option value="Pequeño">Pequeño (0-5kg)</option>
                  <option value="Mediano">Mediano (5-20kg)</option>
                  <option value="Grande">Grande (20-40kg)</option>
                  <option value="Extra">Extra Grande (+40kg)</option>
                </select>
              </label>
            </div>

            <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <label style={{ display: "grid", gap: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#e9d5ff", textTransform: "uppercase" }}>⚖️ Peso (kg)</span>
                <input type="number" step="0.1" value={form.peso} onChange={(e) => setForm({ ...form, peso: e.target.value })} placeholder="25.5" style={{ padding: "11px 12px", minHeight: "42px" }} />
              </label>
              <label style={{ display: "grid", gap: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#e9d5ff", textTransform: "uppercase" }}>🎂 Edad</span>
                <input value={form.edad} onChange={(e) => setForm({ ...form, edad: e.target.value })} placeholder="3 años, 2 meses" style={{ padding: "11px 12px", minHeight: "42px" }} />
              </label>
            </div>

            <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <label style={{ display: "grid", gap: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#e9d5ff", textTransform: "uppercase" }}>♀️ Sexo</span>
                <select value={form.sexo} onChange={(e) => setForm({ ...form, sexo: e.target.value })} style={{ padding: "11px 12px", minHeight: "42px" }}>
                  <option value="">-</option>
                  <option value="Hembra">Hembra</option>
                  <option value="Macho">Macho</option>
                </select>
              </label>
              <label style={{ display: "grid", gap: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#e9d5ff", textTransform: "uppercase" }}>🥘 Alimento</span>
                <input value={form.alimento_tipo} onChange={(e) => setForm({ ...form, alimento_tipo: e.target.value })} placeholder="Royal Canin, Pedigree..." style={{ padding: "11px 12px", minHeight: "42px" }} />
              </label>
            </div>

            <label style={{ gridColumn: "1 / -1", display: "grid", gap: "8px" }}>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#e9d5ff", textTransform: "uppercase" }}>🕐 Horario preferido</span>
              <input value={form.horario_preferido} onChange={(e) => setForm({ ...form, horario_preferido: e.target.value })} placeholder="Mañana, Tarde, 09:00-11:00" style={{ padding: "11px 12px", minHeight: "42px" }} />
            </label>

            <div style={{ gridColumn: "1 / -1", display: "grid", gap: "12px", padding: "16px", borderRadius: "8px", background: "rgba(126, 34, 206, 0.1)" }}>
              <p style={{ margin: "0 0 8px", fontSize: "13px", fontWeight: "600", color: "#e9d5ff", textTransform: "uppercase" }}>📦 Requisitos especiales</p>
              <label style={{ display: "flex", gap: "10px", alignItems: "center", cursor: "pointer" }}>
                <input type="checkbox" checked={Boolean(form.alimento_especial)} onChange={(e) => setForm({ ...form, alimento_especial: e.target.checked })} style={{ width: "18px", height: "18px", cursor: "pointer" }} />
                <span style={{ fontSize: "14px" }}>🍴 Alimento especial / Dieta restrictiva</span>
              </label>
              <label style={{ display: "flex", gap: "10px", alignItems: "center", cursor: "pointer" }}>
                <input type="checkbox" checked={Boolean(form.camita)} onChange={(e) => setForm({ ...form, camita: e.target.checked })} style={{ width: "18px", height: "18px", cursor: "pointer" }} />
                <span style={{ fontSize: "14px" }}>🛏️ Trae cama</span>
              </label>
              <label style={{ display: "flex", gap: "10px", alignItems: "center", cursor: "pointer" }}>
                <input type="checkbox" checked={Boolean(form.mantita)} onChange={(e) => setForm({ ...form, mantita: e.target.checked })} style={{ width: "18px", height: "18px", cursor: "pointer" }} />
                <span style={{ fontSize: "14px" }}>🧣 Trae mantita</span>
              </label>
            </div>

            <label style={{ gridColumn: "1 / -1", display: "grid", gap: "8px" }}>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#e9d5ff", textTransform: "uppercase" }}>📝 Notas adicionales</span>
              <textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} placeholder="Alergias, medicamentos, comportamientos..." style={{ padding: "12px", minHeight: "90px", fontSize: "14px", lineHeight: "1.5" }} />
            </label>

            <div style={{ gridColumn: "1 / -1", display: "flex", gap: "12px", marginTop: "8px" }}>
              <button className="outline-button yellow" type="submit" disabled={saving} style={{ flex: 1 }}>
                {saving ? "⏳ Guardando..." : editando ? "✏️ Actualizar" : "✅ Guardar mascota"}
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
          <h3 style={{ margin: 0 }}>Mascotas Registradas</h3>
          <input
            type="text"
            placeholder="Buscar mascota..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: "8px 12px", minHeight: "36px", fontSize: "13px", width: "250px" }}
          />
        </div>
        <table>
          <thead>
            <tr>
              <th>Mascota</th>
              <th>Dueño</th>
              <th>Especie</th>
              <th>Raza</th>
              <th>Peso</th>
              <th>Alimento</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "24px", color: "var(--muted)" }}>
                  {mascotas.length === 0 ? "📭 No hay mascotas" : "🔍 No hay resultados"}
                </td>
              </tr>
            )}
            {filtered.map(({ mascota }) => (
              <tr key={mascota.id}>
                <td style={{ fontWeight: "500" }}>{mascota.nombre}</td>
                <td style={{ fontSize: "12px" }}>{mascota.dueño_nombre || "-"}</td>
                <td style={{ fontSize: "12px" }}>{mascota.especie || "-"}</td>
                <td style={{ fontSize: "12px" }}>{mascota.raza || "-"}</td>
                <td style={{ fontSize: "12px" }}>{mascota.peso ? `${mascota.peso}kg` : "-"}</td>
                <td style={{ fontSize: "12px" }}>
                  {mascota.alimento_tipo}
                  {mascota.alimento_especial && <span style={{ marginLeft: "6px", color: "#facc15" }}>⚠️</span>}
                </td>
                <td style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => { setEditando(mascota); setForm({
                    ...emptyMascota,
                    cliente_id: String(mascota.cliente_id ?? ""),
                    nombre: mascota.nombre ?? "",
                    especie: mascota.especie ?? "",
                    tipo_mascota: mascota.tipo_mascota ?? "",
                    raza: mascota.raza ?? "",
                    talla: mascota.talla ?? "",
                    peso: String(mascota.peso ?? ""),
                    edad: mascota.edad ?? "",
                    sexo: mascota.sexo ?? "",
                    alimento_tipo: mascota.alimento_tipo ?? "",
                    alimento_especial: mascota.alimento_especial === true || Number(mascota.alimento_especial) === 1,
                    horario_preferido: mascota.horario_preferido ?? "",
                    camita: mascota.camita === true || Number(mascota.camita) === 1,
                    mantita: mascota.mantita === true || Number(mascota.mantita) === 1,
                    notas: mascota.notas ?? "",
                  }); setShowForm(true); }} style={{ padding: "4px 8px", fontSize: "12px", background: "rgba(126, 34, 206, 0.3)", border: "1px solid rgba(126, 34, 206, 0.5)", borderRadius: "4px", cursor: "pointer", color: "#e9d5ff" }}>✏️</button>
                  <button onClick={() => handleEliminar(mascota.id!)} style={{ padding: "4px 8px", fontSize: "12px", background: "rgba(239, 68, 68, 0.3)", border: "1px solid rgba(239, 68, 68, 0.5)", borderRadius: "4px", cursor: "pointer", color: "#fca5a5" }}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  )
}
