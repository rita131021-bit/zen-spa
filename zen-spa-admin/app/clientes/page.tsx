import AdminShell from "@/components/AdminShell"
import ClientesManager from "@/components/ClientesManager"
import { Cliente, fetchApi, Mascota, Turno } from "@/lib/api"

export default async function ClientesPage() {
  const [clientes, mascotas, turnos] = await Promise.all([
    fetchApi<Cliente[]>("/api/clientes", []),
    fetchApi<Mascota[]>("/api/mascotas", []),
    fetchApi<Turno[]>("/api/turnos", []),
  ])

  return (
    <AdminShell>
      <ClientesManager initialClientes={clientes} mascotas={mascotas} turnos={turnos} />
    </AdminShell>
  )
}
