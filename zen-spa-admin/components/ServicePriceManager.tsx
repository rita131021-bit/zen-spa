"use client"

import { useState } from "react"
import { API_BASE, Servicio } from "@/lib/api"

const fallbackServices: Servicio[] = [
  { id: 1, nombre: "Spa Armonia", categoria: "Peluqueria", precio: 18000, duracion_minutos: 45, descripcion: "Bano + Corte de unas", activo: true },
  { id: 2, nombre: "Guarderia Canina", categoria: "Guarderia", precio: 12000, duracion_minutos: 480, descripcion: "Por dia", activo: true, requiere_canil: true },
  { id: 3, nombre: "Sesion Premium", categoria: "Peluqueria", precio: 85000, duracion_minutos: 120, descripcion: "Bano & Corte", activo: true },
]

export default function ServicePriceManager({ initialServices = fallbackServices }: { initialServices?: Servicio[] }) {
  const [services, setServices] = useState<Servicio[]>(initialServices)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [message, setMessage] = useState("")

  function updateLocal(id: number, field: keyof Servicio, value: string | boolean) {
    setServices((current) => current.map((service) => service.id === id ? { ...service, [field]: value } : service))
  }

  async function save(service: Servicio) {
    setSavingId(service.id)
    setMessage("")
    try {
      const response = await fetch(`${API_BASE}/api/servicios/${service.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: service.nombre,
          categoria: service.categoria,
          precio: Number(service.precio),
          duracion_minutos: Number(service.duracion_minutos || 0),
          descripcion: service.descripcion,
          activo: Boolean(service.activo),
        }),
      })
      if (!response.ok) throw new Error("No se pudo actualizar")
      setMessage("Precio actualizado correctamente")
    } catch {
      setMessage("No se pudo guardar el cambio")
    } finally {
      setSavingId(null)
    }
  }

  async function applyIncrease(percent: number) {
    setMessage("")
    try {
      const response = await fetch(`${API_BASE}/api/servicios/precio/aumento`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ porcentaje: percent }),
      })
      if (!response.ok) throw new Error("No se pudo aplicar")
      setServices((current) => current.map((service) => ({
        ...service,
        precio: Math.round(Number(service.precio || 0) * (1 + percent / 100)),
      })))
      setMessage(`Aumento de ${percent}% aplicado`)
    } catch {
      setMessage("No se pudo aplicar el aumento")
    }
  }

  return (
    <>
      <section className="promo-grid">
        <article className="panel-card">
          <h3>Aplicar aumento general</h3>
          <p>Actualiza todos los precios de los servicios activos.</p>
          <div className="button-row">
            {[5, 10, 15, 20, 25].map((percent) => (
              <button className={percent === 10 ? "outline-button yellow" : "outline-button"} key={percent} onClick={() => applyIncrease(percent)}>
                +{percent}%
              </button>
            ))}
          </div>
          {message && <p className="tone-purple">{message}</p>}
        </article>
        <article className="panel-card suggestion-card">
          <h3>Sugerencia</h3>
          <p>Guarderia no se actualiza hace 62 dias.</p>
          <button className="link-button">Ver detalles</button>
        </article>
      </section>

      <section className="panel-card table-card">
        <div className="card-head">
          <h3>Categorias</h3>
          <input className="small-search" placeholder="Buscar servicio..." />
        </div>
        <table>
          <thead>
            <tr><th>Servicio</th><th>Categoria</th><th>Precio actual</th><th>Duracion</th><th>Estado</th><th>Accion</th></tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.id}>
                <td>{service.nombre}</td>
                <td>{service.categoria}</td>
                <td>
                  <input
                    className="price-input"
                    value={String(service.precio ?? "")}
                    onChange={(event) => updateLocal(service.id, "precio", event.target.value)}
                  />
                </td>
                <td>{service.duracion_minutos} min</td>
                <td><span className={service.activo ? "pill green" : "pill red"}>{service.activo ? "Activo" : "Inactivo"}</span></td>
                <td><button className="outline-button" onClick={() => save(service)}>{savingId === service.id ? "Guardando" : "Guardar"}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  )
}
