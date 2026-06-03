"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import RealTurnsTable from "@/components/RealTurnsTable"
import {
  API_BASE,
  Cliente,
  DisponibilidadSlot,
  Mascota,
  Profesional,
  Servicio,
  Turno,
} from "@/lib/api"

type TurnosManagerProps = {
  initialTurnos?: Turno[]
}

const emptyForm = {
  cliente_id: "",
  mascota_id: "",
  servicio_id: "",
  profesional_id: "",
  canil_id: "",
  fecha: "",
  hora: "",
  observaciones: "",
}

export default function TurnosManager({ initialTurnos = [] }: TurnosManagerProps) {
  const [turnos, setTurnos] = useState<Turno[]>(initialTurnos)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [mascotas, setMascotas] = useState<Mascota[]>([])
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [profesionales, setProfesionales] = useState<Profesional[]>([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(!initialTurnos.length)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [slots, setSlots] = useState<DisponibilidadSlot[]>([])
  const [slotHint, setSlotHint] = useState("")
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null)

  const selectedServicio = servicios.find((s) => String(s.id) === form.servicio_id)
  const mascotasFiltradas = useMemo(
    () => mascotas.filter((m) => String(m.cliente_id) === form.cliente_id),
    [mascotas, form.cliente_id]
  )

  async function loadCatalogs() {
    const [turnosRes, clientesRes, mascotasRes, serviciosRes, profesionalesRes] = await Promise.all([
      fetch(`${API_BASE}/api/turnos`, { cache: "no-store" }),
      fetch(`${API_BASE}/api/clientes`, { cache: "no-store" }),
      fetch(`${API_BASE}/api/mascotas`, { cache: "no-store" }),
      fetch(`${API_BASE}/api/servicios`, { cache: "no-store" }),
      fetch(`${API_BASE}/api/profesionales`, { cache: "no-store" }),
    ])

    if (turnosRes.ok) setTurnos(await turnosRes.json())
    if (clientesRes.ok) setClientes(await clientesRes.json())
    if (mascotasRes.ok) setMascotas(await mascotasRes.json())
    if (serviciosRes.ok) setServicios(await serviciosRes.json())
    if (profesionalesRes.ok) {
      const list: Profesional[] = await profesionalesRes.json()
      setProfesionales(list)
      const romina = list.find((p) => p.nombre?.toLowerCase().includes("romina"))
      if (romina && !form.profesional_id) {
        setForm((current) => ({ ...current, profesional_id: String(romina.id) }))
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    loadCatalogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (window.location.hash !== "#nuevo-turno") return
    const target = document.getElementById("nuevo-turno")
    target?.scrollIntoView({ behavior: "smooth", block: "start" })
    const firstField = target?.querySelector<HTMLElement>("select, input, textarea")
    firstField?.focus()
  }, [])

  useEffect(() => {
    if (!form.fecha) {
      setSlots([])
      setSlotHint("")
      return
    }

    const params = new URLSearchParams({ fecha: form.fecha })
    if (form.profesional_id) params.set("profesional_id", form.profesional_id)

    fetch(`${API_BASE}/api/disponibilidad?${params.toString()}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.slots) return
        setSlots(data.slots)
        const libres = data.slots.filter((slot: DisponibilidadSlot) => slot.disponible).length
        if (data.bloqueada) setSlotHint("Fecha bloqueada: no se pueden crear turnos.")
        else if (data.noLaborable) setSlotHint("Feriado no laborable.")
        else setSlotHint(`${libres} horario(s) disponible(s) para esta fecha.`)
      })
      .catch(() => setSlotHint(""))
  }, [form.fecha, form.profesional_id])

  function updateField(field: keyof typeof emptyForm, value: string) {
    setForm((current) => {
      const next = { ...current, [field]: value }
      if (field === "cliente_id") next.mascota_id = ""
      return next
    })
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setMessage("")
    setError("")

    if (!form.cliente_id || !form.mascota_id || !form.servicio_id || !form.fecha || !form.hora) {
      setError("Completá cliente, mascota, servicio, fecha y hora.")
      setSaving(false)
      return
    }

    try {
      const body: Record<string, unknown> = {
        cliente_id: Number(form.cliente_id),
        mascota_id: Number(form.mascota_id),
        servicio_id: Number(form.servicio_id),
        profesional_id: form.profesional_id ? Number(form.profesional_id) : null,
        fecha: form.fecha,
        hora: form.hora,
        observaciones: form.observaciones || null,
      }
      if (form.canil_id) body.canil_id = Number(form.canil_id)

      const response = await fetch(`${API_BASE}/api/turnos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        const razones = Array.isArray(data.razones) ? data.razones.join(". ") : ""
        setError(data.error ? `${data.error}${razones ? ` (${razones})` : ""}` : "No se pudo crear el turno")
        setSaving(false)
        return
      }

      setMessage(
        data.whatsapp_url
          ? "Turno creado. Se genero la confirmacion por WhatsApp (ver enlace abajo)."
          : "Turno creado correctamente"
      )
      if (data.whatsapp_url) {
        setWhatsappUrl(data.whatsapp_url as string)
      }
      setForm((current) => ({
        ...emptyForm,
        profesional_id: current.profesional_id,
      }))
      await loadCatalogs()
    } catch {
      setError("No se pudo conectar con el backend. Verificá que esté corriendo en el puerto 3001.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <section className="panel-card block-form" id="nuevo-turno">
        <h3>Nuevo turno</h3>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Cliente
            <select
              required
              value={form.cliente_id}
              onChange={(e) => updateField("cliente_id", e.target.value)}
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
            Mascota
            <select
              required
              value={form.mascota_id}
              onChange={(e) => updateField("mascota_id", e.target.value)}
              disabled={!form.cliente_id}
            >
              <option value="">Seleccionar mascota</option>
              {mascotasFiltradas.map((mascota) => (
                <option key={mascota.id} value={mascota.id}>
                  {mascota.nombre}
                  {mascota.especie ? ` (${mascota.especie})` : ""}
                </option>
              ))}
            </select>
          </label>

          <label>
            Servicio
            <select
              required
              value={form.servicio_id}
              onChange={(e) => updateField("servicio_id", e.target.value)}
            >
              <option value="">Seleccionar servicio</option>
              {servicios
                .filter((servicio) => Boolean(servicio.activo))
                .map((servicio) => (
                  <option key={servicio.id} value={servicio.id}>
                    {servicio.nombre}
                    {servicio.categoria ? ` — ${servicio.categoria}` : ""}
                  </option>
                ))}
            </select>
          </label>

          <label>
            Profesional
            <select
              value={form.profesional_id}
              onChange={(e) => updateField("profesional_id", e.target.value)}
            >
              <option value="">Sin asignar</option>
              {profesionales
                .filter((p) => p.activo !== 0 && p.activo !== false)
                .map((profesional) => (
                  <option key={profesional.id} value={profesional.id}>
                    {profesional.nombre}
                  </option>
                ))}
            </select>
          </label>

          <label>
            Fecha
            <input
              type="date"
              required
              value={form.fecha}
              onChange={(e) => updateField("fecha", e.target.value)}
            />
          </label>

          <label>
            Hora
            {slots.length > 0 ? (
              <select
                required
                value={form.hora}
                onChange={(e) => updateField("hora", e.target.value)}
              >
                <option value="">Seleccionar horario</option>
                {slots.map((slot) => (
                  <option key={slot.hora} value={slot.hora} disabled={!slot.disponible}>
                    {slot.hora} — {slot.disponible ? "Disponible" : slot.estado}
                    {!slot.disponible && slot.razones?.length ? ` (${slot.razones.join(", ")})` : ""}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="time"
                required
                value={form.hora}
                onChange={(e) => updateField("hora", e.target.value)}
              />
            )}
          </label>
          {slotHint && <p className="tone-purple">{slotHint}</p>}

          {selectedServicio?.requiere_canil ? (
            <label>
              Canil
              <select value={form.canil_id} onChange={(e) => updateField("canil_id", e.target.value)}>
                <option value="">Asignar automáticamente</option>
              </select>
            </label>
          ) : null}

          <label>
            Observaciones
            <textarea
              value={form.observaciones}
              onChange={(e) => updateField("observaciones", e.target.value)}
              placeholder="Notas internas del turno"
            />
          </label>

          <div className="button-row">
            <button className="outline-button yellow" type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Crear turno"}
            </button>
          </div>
        </form>
        {message && <p className="tone-green">{message}</p>}
        {whatsappUrl && (
          <p>
            <a href={whatsappUrl} target="_blank" rel="noreferrer" className="outline-button yellow">
              Abrir confirmacion en WhatsApp
            </a>
          </p>
        )}
        {error && <p className="tone-red">{error}</p>}
      </section>

      {loading ? (
        <section className="panel-card table-card">
          <h3>Control de Reservas y Estados</h3>
          <p>Cargando turnos desde la base de datos...</p>
        </section>
      ) : turnos.length ? (
        <RealTurnsTable title="Control de Reservas y Estados" turns={turnos} />
      ) : (
        <section className="panel-card table-card">
          <h3>Control de Reservas y Estados</h3>
          <p>No hay turnos registrados. Creá el primero con el formulario de arriba.</p>
        </section>
      )}
    </>
  )
}
