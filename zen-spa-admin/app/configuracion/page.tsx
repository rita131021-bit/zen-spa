import AdminShell, { PageHeader } from "@/components/AdminShell"

export default function ConfiguracionPage() {
  return (
    <AdminShell>
      <PageHeader eyebrow="cfg" title="Configuracion" subtitle="Preferencias generales del panel administrativo." />
      <section className="three-grid">
        <article className="panel-card"><h3>Negocio</h3><p>Zen Spa para Mascotas</p><p>Parana, Entre Rios</p></article>
        <article className="panel-card"><h3>Usuario</h3><p>Romina</p><p>Administradora</p></article>
        <article className="panel-card"><h3>Integraciones</h3><p>WhatsApp Business conectado</p><p>Pasarela de pago pendiente</p></article>
      </section>
    </AdminShell>
  )
}
