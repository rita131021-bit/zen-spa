import AdminShell from "@/components/AdminShell"
import GiftCardsManager from "@/components/GiftCardsManager"
import { Cliente, fetchApi } from "@/lib/api"

export default async function GiftCardsPage() {
  const clientes = await fetchApi<Cliente[]>("/api/clientes", [])

  return (
    <AdminShell>
      <GiftCardsManager clientes={clientes} />
    </AdminShell>
  )
}
