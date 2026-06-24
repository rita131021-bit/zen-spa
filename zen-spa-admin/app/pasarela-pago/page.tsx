import AdminShell, { MetricCard, PageHeader } from "@/components/AdminShell"
import Link from "next/link"

export default function PasarelaPagoPage() {
  return (
    <AdminShell aside={<PaymentAside />}>
      <PageHeader eyebrow="pay" title="Pasarela de Pago" subtitle="Gestiona los pagos y cobros de tus clientes de forma simple y segura." action={<Link className="outline-button" href="/configuracion">Configuracion de pagos</Link>} />
      <section className="metrics-grid five">
        <MetricCard label="Ventas totales (este mes)" value="$1.248.560" detail="+18.6% vs mes anterior" tone="green" />
        <MetricCard label="Transacciones exitosas" value="128" detail="92.1% del total" tone="green" />
        <MetricCard label="Pendientes" value="8" detail="$83.450" tone="yellow" />
        <MetricCard label="Reembolsos" value="2" detail="$12.300" tone="red" />
        <MetricCard label="Ticket promedio" value="$9.754" detail="+7.3% vs mes anterior" tone="green" />
      </section>
      <div className="tab-strip">
        <Link className="active" href="/pasarela-pago">Pagos</Link>
        <Link href="/configuracion">Metodos de pago</Link>
        <Link href="/finanzas">Historial de pagos</Link>
        <Link href="/configuracion">Configuracion</Link>
      </div>
      <section className="payment-layout">
        <article className="panel-card"><h3>Detalle del pago</h3><div className="pet-head"><div className="pet-photo">ML</div><div><h4>Maria Lopez</h4><p>Rocky - Caniche</p><span>Bano & Corte Completo</span></div></div><div className="payment-total"><p>Total del servicio</p><strong>$18.500</strong><p>Sena requerida (30%) $5.550</p></div></article>
        <article className="panel-card form-grid"><h3>Informacion del pago</h3><label>Estado del pago<select><option>Pendiente</option></select></label><label>Monto total<input value="$ 18.500" readOnly /></label><label>Monto pagado<input value="$ 0" readOnly /></label><label>Notas<textarea placeholder="Agrega una nota sobre el pago..." /></label><Link className="new-turn-button" href="/finanzas">Registrar pago</Link></article>
        <article className="panel-card"><h3>Historial de pagos</h3><div className="timeline"><div className="timeline-row"><time>17/05</time><div><strong>Sena</strong><p>MercadoPago - $5.550</p></div></div><div className="timeline-row"><time>10/05</time><div><strong>Parcial</strong><p>Transferencia - $6.000</p></div></div></div></article>
      </section>
      <section className="panel-card table-card"><h3>Pagos recientes</h3><table><tbody>{["PAY-000154 Maria Lopez Rocky $5.550 MercadoPago", "PAY-000153 Juan Perez Milo $15.000 Transferencia", "PAY-000152 Carla Gomez Nina $22.000 Efectivo"].map((row) => <tr key={row}><td>{row}</td><td><span className="pill green">Completo</span></td></tr>)}</tbody></table></section>
    </AdminShell>
  )
}

function PaymentAside() {
  return <section className="panel-card"><h3>Acciones rapidas</h3><p>Registrar pago manual</p><p>Enviar mensaje</p><p>Ver historial de pagos</p><p>Generar link de pago</p><p>Reembolsar pago</p></section>
}
