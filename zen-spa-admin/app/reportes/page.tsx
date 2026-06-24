import AdminShell from "@/components/AdminShell"
import ReportesManager from "@/components/ReportesManager"
import { fetchApi, Turno, Cliente, Mascota, Servicio } from "@/lib/api"

export default async function ReportesPage() {
  const [turnos, clientes, mascotas, servicios] = await Promise.all([
    fetchApi<Turno[]>("/api/turnos", []),
    fetchApi<Cliente[]>("/api/clientes", []),
    fetchApi<Mascota[]>("/api/mascotas", []),
    fetchApi<Servicio[]>("/api/servicios", []),
  ])

  return (
    <AdminShell>
      <ReportesManager
        initialTurnos={turnos}
        initialClientes={clientes}
        initialMascotas={mascotas}
        initialServicios={servicios}
      />
    </AdminShell>
  )
}
