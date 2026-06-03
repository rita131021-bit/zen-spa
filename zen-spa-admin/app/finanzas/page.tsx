import AdminShell, { MetricCard, PageHeader } from "@/components/AdminShell"

const movements = [
  ["17/04/2026", "Ingreso", "Peluqueria - Rocky", "Efectivo", "+$25.000"],
  ["17/04/2026", "Ingreso", "Bano & Corte - Luna", "Tarjeta debito", "+$18.000"],
  ["17/04/2026", "Gasto", "Shampoo y acondicionadores", "Transferencia", "-$45.000"],
  ["16/04/2026", "Ingreso", "Spa Relajacion - Nina", "Mercado Pago", "+$22.000"],
  ["16/04/2026", "Gasto", "Pago de luz", "Transferencia", "-$35.000"],
]

export default function FinanzasPage() {
  return (
    <AdminShell aside={<FinanceAside />}>
      <PageHeader
        eyebrow="$"
        title="Finanzas"
        subtitle="Controla los ingresos, gastos y la rentabilidad de tu negocio."
        action={
          <div className="header-actions">
            <button className="date-button">01/04/2026 - 17/04/2026</button>
            <button className="outline-button">Exportar</button>
          </div>
        }
      />

      <section className="metrics-grid five">
        <MetricCard label="Ingresos totales" value="$2.450.000" detail="+18.5% vs mes anterior" tone="green" />
        <MetricCard label="Gastos totales" value="$820.000" detail="+6.2% vs mes anterior" tone="red" />
        <MetricCard label="Ganancia neta" value="$1.630.000" detail="+24.7% vs mes anterior" tone="green" />
        <MetricCard label="Margen de ganancia" value="66.5%" detail="+3.1% vs mes anterior" tone="green" />
        <MetricCard label="Ticket promedio" value="$11.667" detail="+6.1% vs mes anterior" tone="green" />
      </section>

      <div className="tab-strip">
        {["Resumen general", "Ingresos", "Gastos", "Servicios", "Metodos de pago", "Impuestos"].map((tab, index) => (
          <button className={index === 0 ? "active" : ""} key={tab}>{tab}</button>
        ))}
      </div>

      <section className="analytics-grid">
        <article className="panel-card chart-card">
          <div className="card-head">
            <h3>Ingresos vs Gastos</h3>
            <span>Esta semana</span>
          </div>
          <div className="line-chart">
            {Array.from({ length: 17 }).map((_, index) => (
              <span key={index} style={{ height: `${28 + ((index * 19) % 58)}%` }} />
            ))}
          </div>
        </article>
        <article className="panel-card donut-card">
          <h3>Distribucion de ingresos</h3>
          <div className="donut-wrap">
            <div className="donut"><strong>$2.450.000</strong><span>Total</span></div>
            <ul>
              <li>Peluqueria <span>48%</span></li>
              <li>Bano & Corte <span>22%</span></li>
              <li>Spa / Relajacion <span>15%</span></li>
              <li>Guarderia <span>10%</span></li>
            </ul>
          </div>
        </article>
      </section>

      <section className="three-grid">
        <FinanceList title="Resumen de ingresos" total="$2.450.000" items={["Efectivo $950.000", "Tarjeta debito $720.000", "Tarjeta credito $580.000", "Transferencia $150.000"]} />
        <FinanceList title="Gastos por categoria" total="$820.000" items={["Productos de limpieza $250.000", "Productos de higiene $200.000", "Sueldos $180.000", "Servicios $100.000"]} />
        <FinanceList title="Flujo de caja" total="$2.880.000" items={["Saldo inicial $1.250.000", "+ Ingresos $2.450.000", "- Gastos $820.000"]} />
      </section>

      <section className="panel-card table-card">
        <h3>Movimientos recientes</h3>
        <table>
          <thead>
            <tr><th>Fecha</th><th>Tipo</th><th>Concepto</th><th>Metodo</th><th>Monto</th></tr>
          </thead>
          <tbody>
            {movements.map((row) => (
              <tr key={row.join("-")}>
                {row.map((cell, index) => (
                  <td className={index === 1 || index === 4 ? (cell.startsWith("-") || cell === "Gasto" ? "tone-red" : "tone-green") : ""} key={cell}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AdminShell>
  )
}

function FinanceList({ title, total, items }: { title: string; total: string; items: string[] }) {
  return (
    <article className="panel-card finance-list">
      <h3>{title}</h3>
      {items.map((item) => <p key={item}>{item}</p>)}
      <strong>Total <span>{total}</span></strong>
    </article>
  )
}

function FinanceAside() {
  return (
    <>
      <section className="panel-card">
        <h3>Resumen financiero</h3>
        <div className="stack-list">
          <p>Ingresos totales <span className="tone-green">$9.850.000</span></p>
          <p>Gastos totales <span className="tone-red">$3.210.000</span></p>
          <p>Ganancia neta <span className="tone-green">$6.640.000</span></p>
          <p>Margen de ganancia <span>67.4%</span></p>
        </div>
        <button className="wide-button">Ver reporte financiero</button>
      </section>
      <section className="panel-card">
        <h3>Servicios mas rentables</h3>
        <div className="stack-list compact">
          <p>Peluqueria (Canina) <span>$3.680.000</span></p>
          <p>Bano & Corte <span>$2.120.000</span></p>
          <p>Spa Relajacion <span>$1.450.000</span></p>
          <p>Guarderia Canina <span>$1.020.000</span></p>
        </div>
      </section>
    </>
  )
}
