import AdminShell, { MetricCard, PageHeader } from "@/components/AdminShell"
import Link from "next/link"
import ServicePriceManager from "@/components/ServicePriceManager"
import { fetchApi, Servicio } from "@/lib/api"

const fallbackServices: Servicio[] = [
  { id: 1, nombre: "Spa Armonia", categoria: "Peluqueria", precio: 18000, duracion_minutos: 45, descripcion: "Bano + Corte de unas", activo: true },
  { id: 2, nombre: "Guarderia Canina", categoria: "Guarderia", precio: 12000, duracion_minutos: 480, descripcion: "Por dia", activo: true, requiere_canil: true },
  { id: 3, nombre: "Sesion Premium", categoria: "Peluqueria", precio: 85000, duracion_minutos: 120, descripcion: "Bano & Corte", activo: true },
]

export default async function ServiciosPage() {
  const services = await fetchApi<Servicio[]>("/api/servicios", fallbackServices)
  const activeServices = services.filter((service) => Boolean(service.activo))
  const averagePrice = activeServices.length
    ? Math.round(activeServices.reduce((sum, service) => sum + Number(service.precio || 0), 0) / activeServices.length)
    : 0

  return (
    <AdminShell>
      <PageHeader
        eyebrow="$"
        title="Gestion de Precios y Servicios"
        subtitle="Administra los precios de tus servicios de forma rapida y sencilla."
        action={<Link className="outline-button" href="/reportes">Ver reportes</Link>}
      />

      <section className="metrics-grid four">
        <MetricCard label="Precio promedio" value={`$${averagePrice.toLocaleString("es-AR")}`} detail="Por servicio activo" />
        <MetricCard label="Ultimo aumento aplicado" value="+15%" detail="12/03/2026" tone="yellow" />
        <MetricCard label="Servicios activos" value={String(activeServices.length)} detail="Sincronizado con backend" tone="green" />
        <MetricCard label="Requieren canil" value={String(services.filter((service) => Boolean(service.requiere_canil)).length)} detail="Validan cupos y disponibilidad" tone="blue" />
      </section>

      <ServicePriceManager initialServices={services.length ? services : fallbackServices} />
    </AdminShell>
  )
}
