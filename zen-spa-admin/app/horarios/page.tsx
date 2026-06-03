import AdminShell, { PageHeader } from "@/components/AdminShell"
import ScheduleBlocksPanel from "@/components/ScheduleBlocksPanel"

export default function HorariosPage() {
  return (
    <AdminShell>
      <PageHeader eyebrow="clk" title="Horarios Profesionales" subtitle="Gestiona disponibilidad, bloqueos y vacaciones." />
      <ScheduleBlocksPanel />
    </AdminShell>
  )
}
