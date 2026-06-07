import AdminShell from "@/components/AdminShell"
import ScheduleBlocksPanel from "@/components/ScheduleBlocksPanel"
import { Bloqueo, fetchApi } from "@/lib/api"

export default async function BloqueosPage() {
  const bloqueos = await fetchApi<Bloqueo[]>("/api/bloqueos", [])

  return (
    <AdminShell>
      <ScheduleBlocksPanel initialBloqueos={bloqueos} />
    </AdminShell>
  )
}
