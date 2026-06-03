import AdminShell, { PageHeader } from "@/components/AdminShell"
import DashboardOverviewLive from "@/components/DashboardOverviewLive"
import { fetchApi, Turno } from "@/lib/api"

type Resumen = {
  total?: number
  pendientes?: number
  confirmados?: number
  completados?: number
  cancelados?: number
}

type TopServicio = { nombre: string; total: number }
type Categoria = { categoria: string; total: number }
type PrecioResumen = { promedio?: number | string; duracion?: number | string }
type ServiciosResumen = { activos?: number; categorias?: number }

export default async function Home() {
  const [resumen, topServicios, categorias, proximos, precio, serviciosResumen] = await Promise.all([
    fetchApi<Resumen>("/api/estadisticas/resumen", {}),
    fetchApi<TopServicio[]>("/api/estadisticas/top-servicios", []),
    fetchApi<Categoria[]>("/api/estadisticas/por-categoria", []),
    fetchApi<Turno[]>("/api/estadisticas/proximos", []),
    fetchApi<PrecioResumen>("/api/estadisticas/precio-promedio", {}),
    fetchApi<ServiciosResumen>("/api/estadisticas/servicios-resumen", {}),
  ])

  const today = new Date().toISOString().slice(0, 10)
  const weekAhead = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)

  return (
    <AdminShell>
      <PageHeader
        eyebrow="spark"
        title="Dashboard de Administracion"
        subtitle="Resumen general del negocio en tiempo real."
        action={<button className="date-button">{today} - {weekAhead}</button>}
      />
      <DashboardOverviewLive
        resumen={resumen}
        topServicios={topServicios}
        categorias={categorias}
        proximos={proximos}
        precio={precio}
        serviciosResumen={serviciosResumen}
      />
    </AdminShell>
  )
}
