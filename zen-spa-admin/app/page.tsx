import AdminShell, { PageHeader } from "@/components/AdminShell"
import DashboardAside from "@/components/DashboardAside"
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

  const todayDate = new Date()
  const weekAheadDate = new Date(todayDate)
  weekAheadDate.setDate(todayDate.getDate() + 7)

  const dateFormatter = new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
  })
  const dateRange = `${dateFormatter.format(todayDate)} al ${dateFormatter.format(weekAheadDate)}`

  return (
    <AdminShell aside={<DashboardAside resumen={resumen} proximos={proximos} />}>
      <PageHeader
        eyebrow="spark"
        title="Dashboard de Administracion"
        subtitle="Resumen general del negocio en tiempo real."
        action={<span className="date-button">{dateRange}</span>}
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
