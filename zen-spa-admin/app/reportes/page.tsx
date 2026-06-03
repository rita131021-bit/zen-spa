import AdminShell, { MetricCard, PageHeader } from "@/components/AdminShell"

export default function ReportesPage() {
  return (
    <AdminShell aside={<ReportAside />}>
      <PageHeader eyebrow="rep" title="Reportes y Estadisticas" subtitle="Analiza el rendimiento de tu negocio y toma mejores decisiones." action={<button className="outline-button">Exportar</button>} />
      <section className="metrics-grid five">
        <MetricCard label="Ingresos totales" value="$2.450.000" detail="+18.5% vs semana anterior" tone="green" />
        <MetricCard label="Turnos realizados" value="210" detail="+12.3% vs semana anterior" tone="green" />
        <MetricCard label="Servicios realizados" value="276" detail="+9.7% vs semana anterior" tone="green" />
        <MetricCard label="Nuevos clientes" value="23" detail="+21.1% vs semana anterior" tone="green" />
        <MetricCard label="Ticket promedio" value="$11.667" detail="+6.4% vs semana anterior" tone="green" />
      </section>
      <div className="tab-strip"><button className="active">Resumen general</button><button>Servicios</button><button>Clientes</button><button>Mascotas</button><button>Finanzas</button></div>
      <section className="analytics-grid">
        <article className="panel-card chart-card"><h3>Ingresos por dia</h3><div className="line-chart">{[28,55,43,58,49,82,57,69].map((h) => <span key={h} style={{ height: `${h}%` }} />)}</div></article>
        <article className="panel-card donut-card"><h3>Ingresos por categoria de servicio</h3><div className="donut-wrap"><div className="donut"><strong>$2.450.000</strong><span>Total</span></div><ul><li>Peluqueria <span>48%</span></li><li>Bano & Corte <span>22%</span></li><li>Spa / Relajacion <span>15%</span></li></ul></div></article>
      </section>
      <section className="three-grid">
        <article className="panel-card"><h3>Servicios mas solicitados</h3><p>Bano & Corte 74</p><p>Peluqueria 61</p><p>Spa Relajacion 42</p></article>
        <article className="panel-card"><h3>Nuevos clientes por dia</h3><div className="line-chart">{[24,31,15,44,52,60,27].map((h) => <span key={h} style={{ height: `${h}%` }} />)}</div></article>
        <article className="panel-card donut-card"><h3>Resumen de turnos</h3><div className="donut"><strong>210</strong><span>Total</span></div></article>
      </section>
    </AdminShell>
  )
}

function ReportAside() {
  return (
    <>
      <section className="panel-card"><h3>Resumen rapido</h3><div className="summary-grid"><span><strong>$2.450.000</strong>Ingresos</span><span><strong>210</strong>Turnos</span><span><strong>276</strong>Servicios</span><span><strong>23</strong>Clientes</span></div><button className="wide-button">Ver reporte completo</button></section>
      <section className="panel-card"><h3>Descargar reportes</h3><div className="stack-list"><p>Reporte de ingresos <span>PDF</span></p><p>Reporte de turnos <span>XLS</span></p><p>Reporte de clientes <span>PDF</span></p></div></section>
    </>
  )
}
