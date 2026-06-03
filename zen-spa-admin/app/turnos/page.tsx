import AdminShell, { PageHeader } from "@/components/AdminShell"
import ScheduleBlocksPanel from "@/components/ScheduleBlocksPanel"
import TurnosManager from "@/components/TurnosManager"
import { fetchApi, Turno } from "@/lib/api"

export default async function TurnosPage() {
  const turnos = await fetchApi<Turno[]>("/api/turnos", [])

  return (
    <AdminShell>
      <PageHeader
        eyebrow="spark"
        title="Gestor de Horarios, Bloqueos y Vacaciones"
        subtitle="Gestiona disponibilidad, bloquea turnos o configura tus vacaciones."
      />

      <ScheduleBlocksPanel />

      <TurnosManager initialTurnos={turnos} />
    </AdminShell>
  )
}
