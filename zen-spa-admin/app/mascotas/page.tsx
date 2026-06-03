import AdminShell from "@/components/AdminShell"
import MascotasManager from "@/components/MascotasManager"
import { Cliente, fetchApi, Mascota, Turno } from "@/lib/api"

export default async function MascotasPage() {
  const [mascotas, clientes, turnos] = await Promise.all([
    fetchApi<Mascota[]>("/api/mascotas", []),
    fetchApi<Cliente[]>("/api/clientes", []),
    fetchApi<Turno[]>("/api/turnos", []),
  ])

  return (
    <AdminShell>
      <MascotasManager initialMascotas={mascotas} clientes={clientes} turnos={turnos} />
    </AdminShell>
  )
}
