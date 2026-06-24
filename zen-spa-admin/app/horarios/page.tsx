import AdminShell, { PageHeader } from "@/components/AdminShell"
import ProfesionalesManager from "@/components/ProfesionalesManager"
import ScheduleBlocksPanel from "@/components/ScheduleBlocksPanel"
import { fetchApi, Profesional } from "@/lib/api"

export default async function HorariosPage() {
  const profesionales = await fetchApi<Profesional[]>("/api/profesionales", [])

  return (
    <AdminShell>
      <PageHeader
        eyebrow="Equipo"
        title="Horarios y Profesionales"
        subtitle="Gestiona el equipo, la disponibilidad, los bloqueos y las vacaciones."
      />
      <ProfesionalesManager initialProfesionales={profesionales} />
      <ScheduleBlocksPanel />
    </AdminShell>
  )
}
