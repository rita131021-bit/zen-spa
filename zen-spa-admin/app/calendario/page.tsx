import AdminShell from "@/components/AdminShell"
import CalendarWeekView from "@/components/CalendarWeekView"
import { Bloqueo, fetchApi, Turno } from "@/lib/api"

export default async function CalendarioPage() {
  const [turnos, bloqueos] = await Promise.all([
    fetchApi<Turno[]>("/api/turnos", []),
    fetchApi<Bloqueo[]>("/api/bloqueos", []),
  ])

  return (
    <AdminShell>
      <CalendarWeekView initialTurnos={turnos} initialBloqueos={bloqueos} />
    </AdminShell>
  )
}
