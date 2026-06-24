import { Suspense } from "react"
import AdminShell, { PageHeader } from "@/components/AdminShell"
import TurnosManager from "@/components/TurnosManager"
import { fetchApi, Turno } from "@/lib/api"

export default async function TurnosPage() {
  const turnos = await fetchApi<Turno[]>("/api/turnos", [])

  return (
    <AdminShell>
      <PageHeader
        eyebrow="Agenda"
        title="Gestión de Turnos"
        subtitle="Administra reservas, estados, pagos y asignaciones."
      />
      <Suspense fallback={<section className="panel-card">Cargando turnos...</section>}>
        <TurnosManager initialTurnos={turnos} />
      </Suspense>
    </AdminShell>
  )
}
