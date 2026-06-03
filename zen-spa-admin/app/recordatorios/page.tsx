import AdminShell from "@/components/AdminShell"
import RecordatoriosManager, { RecordatoriosAside } from "@/components/RecordatoriosManager"
import { ChatMensaje, Cliente, fetchApi, RecordatorioItem, Turno } from "@/lib/api"

type RecordatoriosResumen = {
  turnos_hoy?: number
  recordatorios_pendientes?: number
  recordatorios_enviados_hoy?: number
  confirmaciones_pendientes?: number
}

export default async function RecordatoriosPage() {
  const [resumen, proximosTurnos, recordatoriosPendientes, clientes] = await Promise.all([
    fetchApi<RecordatoriosResumen>("/api/recordatorios/resumen", {}),
    fetchApi<Turno[]>("/api/recordatorios/proximos-turnos", []),
    fetchApi<RecordatorioItem[]>("/api/recordatorios/pendientes", []),
    fetchApi<Cliente[]>("/api/clientes", []),
  ])

  const firstClienteId = clientes[0]?.id
  const initialMensajes = firstClienteId
    ? await fetchApi<ChatMensaje[]>(`/api/chat/${firstClienteId}`, [])
    : []

  return (
    <AdminShell aside={<RecordatoriosAside clientes={clientes} selectedClienteId={firstClienteId} />}>
      <RecordatoriosManager
        resumen={resumen}
        proximosTurnos={proximosTurnos}
        recordatoriosPendientes={recordatoriosPendientes}
        clientes={clientes}
        initialMensajes={initialMensajes}
        initialClienteId={firstClienteId}
      />
    </AdminShell>
  )
}
