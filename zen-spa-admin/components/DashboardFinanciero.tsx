"use client"

import { useEffect, useState } from "react"
import { MetricCard, PageHeader } from "@/components/AdminShell"
import { API_BASE } from "@/lib/api"

export default function DashboardFinanciero() {
  const [resumenHoy, setResumenHoy] = useState<any>(null)
  const [ingresosMes, setIngresosMes] = useState<any>(null)
  const [ingresosPorServicio, setIngresosPorServicio] = useState<any[]>([])
  const [topClientes, setTopClientes] = useState<any[]>([])
  const [ingresosDiarios, setIngresosDiarios] = useState<any[]>([])
  const [analisisDescuentos, setAnalisisDescuentos] = useState<any>(null)
  const [periodo, setPeriodo] = useState({ inicio: "", fin: "" })
  const [loading, setLoading] = useState(true)

  const cargarDatos = async () => {
    setLoading(true)
    try {
      // Hoy
      const resHoy = await fetch(`${API_BASE}/api/finanzas/resumen/hoy`)
      if (resHoy.ok) setResumenHoy(await resHoy.json())

      // Este mes
      const hoy = new Date()
      const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split("T")[0]
      const fin = hoy.toISOString().split("T")[0]

      const resMes = await fetch(`${API_BASE}/api/finanzas/resumen/periodo?inicio=${inicio}&fin=${fin}`)
      if (resMes.ok) setIngresosMes(await resMes.json())

      // Por servicio
      const resSvc = await fetch(`${API_BASE}/api/finanzas/por-servicio?inicio=${inicio}&fin=${fin}`)
      if (resSvc.ok) setIngresosPorServicio(await resSvc.json())

      // Top clientes
      const resTop = await fetch(`${API_BASE}/api/finanzas/top-clientes`)
      if (resTop.ok) setTopClientes(await resTop.json())

      // Últimos 30 días
      const resDiarios = await fetch(`${API_BASE}/api/finanzas/diarios/30`)
      if (resDiarios.ok) setIngresosDiarios(await resDiarios.json())

      // Análisis descuentos
      const resDesc = await fetch(`${API_BASE}/api/finanzas/analisis-descuentos`)
      if (resDesc.ok) setAnalisisDescuentos(await resDesc.json())
    } catch (err) {
      console.error("Error cargando datos:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const handleGenerarReporte = async () => {
    if (!periodo.inicio || !periodo.fin) {
      alert("Selecciona un período")
      return
    }

    const res = await fetch(`${API_BASE}/api/finanzas/resumen/periodo?inicio=${periodo.inicio}&fin=${periodo.fin}`)
    if (res.ok) {
      const data = await res.json()
      console.log("Reporte generado:", data)
      alert(`Reporte generado:\nIngresos: $${data.ingresos_totales?.toLocaleString("es-AR") || 0}\nTurnos: ${data.cantidad_turnos}`)
    }
  }

  if (loading) {
    return <div style={{ padding: "20px", textAlign: "center" }}>⏳ Cargando datos financieros...</div>
  }

  return (
    <>
      <PageHeader
        eyebrow="💰 Finanzas"
        title="Dashboard Financiero"
        subtitle="Resumen de ingresos, gastos, descuentos y análisis por período"
        action={
          <button className="outline-button yellow" onClick={cargarDatos}>
            🔄 Actualizar
          </button>
        }
      />

      {/* RESUMEN HOY */}
      <section className="metrics-grid five">
        <MetricCard
          label="Ingresos hoy"
          value={`$${(resumenHoy?.ingresos_totales || 0).toLocaleString("es-AR", { maximumFractionDigits: 0 })}`}
          detail={`${resumenHoy?.cantidad_turnos || 0} servicios realizados`}
          tone="green"
        />
        <MetricCard
          label="Ticket promedio"
          value={`$${(resumenHoy?.ticket_promedio || 0).toLocaleString("es-AR", { maximumFractionDigits: 0 })}`}
          detail="Valor medio por turno"
          tone="blue"
        />
        <MetricCard
          label="Este mes"
          value={`$${(ingresosMes?.ingresos_totales || 0).toLocaleString("es-AR", { maximumFractionDigits: 0 })}`}
          detail={`${ingresosMes?.cantidad_turnos || 0} servicios`}
          tone="purple"
        />
        <MetricCard
          label="Descuentos aplicados"
          value={`$${(ingresosMes?.descuentos_totales || 0).toLocaleString("es-AR", { maximumFractionDigits: 0 })}`}
          detail="Por fidelidad de clientes"
          tone="yellow"
        />
        <MetricCard
          label="Clientes activos"
          value={String(ingresosMes?.cantidad_clientes || 0)}
          detail="Este mes"
          tone="green"
        />
      </section>

      {/* GENERADOR DE REPORTES */}
      <section className="panel-card">
        <h3 style={{ marginBottom: "16px" }}>📅 Generar Reporte Personalizado</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
          <label style={{ display: "grid", gap: "6px" }}>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "#e9d5ff" }}>Desde</span>
            <input
              type="date"
              value={periodo.inicio}
              onChange={(e) => setPeriodo({ ...periodo, inicio: e.target.value })}
              style={{ padding: "10px", minHeight: "36px" }}
            />
          </label>
          <label style={{ display: "grid", gap: "6px" }}>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "#e9d5ff" }}>Hasta</span>
            <input
              type="date"
              value={periodo.fin}
              onChange={(e) => setPeriodo({ ...periodo, fin: e.target.value })}
              style={{ padding: "10px", minHeight: "36px" }}
            />
          </label>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button className="outline-button yellow" onClick={handleGenerarReporte} style={{ width: "100%" }}>
              📊 Generar
            </button>
          </div>
        </div>
      </section>

      {/* INGRESOS POR SERVICIO */}
      <section className="panel-card">
        <h3 style={{ marginBottom: "16px" }}>🎯 Ingresos por Servicio (Este mes)</h3>
        {ingresosPorServicio.length === 0 ? (
          <p style={{ color: "var(--muted)", textAlign: "center", padding: "20px" }}>Sin datos</p>
        ) : (
          <table style={{ width: "100%", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(126, 34, 206, 0.3)" }}>
                <th style={{ textAlign: "left", padding: "8px" }}>Servicio</th>
                <th style={{ textAlign: "right", padding: "8px" }}>Turnos</th>
                <th style={{ textAlign: "right", padding: "8px" }}>Ingresos</th>
                <th style={{ textAlign: "right", padding: "8px" }}>Promedio</th>
                <th style={{ textAlign: "right", padding: "8px" }}>Descuentos</th>
              </tr>
            </thead>
            <tbody>
              {ingresosPorServicio.map((svc) => (
                <tr key={svc.id} style={{ borderBottom: "1px solid rgba(126, 34, 206, 0.2)" }}>
                  <td style={{ padding: "8px", fontWeight: "500" }}>{svc.nombre}</td>
                  <td style={{ padding: "8px", textAlign: "right" }}>{svc.cantidad_turnos || 0}</td>
                  <td style={{ padding: "8px", textAlign: "right", color: "#22c55e", fontWeight: "600" }}>
                    ${(svc.ingresos_totales || 0).toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                  </td>
                  <td style={{ padding: "8px", textAlign: "right" }}>
                    ${(svc.precio_promedio || 0).toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                  </td>
                  <td style={{ padding: "8px", textAlign: "right", color: "#facc15" }}>
                    ${(svc.descuentos_totales || 0).toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* TOP 10 CLIENTES */}
      <section className="panel-card">
        <h3 style={{ marginBottom: "16px" }}>👥 Top 10 Clientes por Gasto</h3>
        {topClientes.length === 0 ? (
          <p style={{ color: "var(--muted)", textAlign: "center", padding: "20px" }}>Sin datos</p>
        ) : (
          <table style={{ width: "100%", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(126, 34, 206, 0.3)" }}>
                <th style={{ textAlign: "left", padding: "8px" }}>Cliente</th>
                <th style={{ textAlign: "right", padding: "8px" }}>Turnos</th>
                <th style={{ textAlign: "right", padding: "8px" }}>Gasto total</th>
                <th style={{ textAlign: "right", padding: "8px" }}>Promedio</th>
                <th style={{ textAlign: "right", padding: "8px" }}>Último turno</th>
              </tr>
            </thead>
            <tbody>
              {topClientes.slice(0, 10).map((cliente) => (
                <tr key={cliente.id} style={{ borderBottom: "1px solid rgba(126, 34, 206, 0.2)" }}>
                  <td style={{ padding: "8px", fontWeight: "500" }}>{cliente.nombre}</td>
                  <td style={{ padding: "8px", textAlign: "right" }}>{cliente.cantidad_turnos}</td>
                  <td style={{ padding: "8px", textAlign: "right", color: "#22c55e", fontWeight: "600" }}>
                    ${(cliente.gasto_total || 0).toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                  </td>
                  <td style={{ padding: "8px", textAlign: "right" }}>
                    ${(cliente.ticket_promedio || 0).toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                  </td>
                  <td style={{ padding: "8px", textAlign: "right", fontSize: "12px", color: "var(--muted)" }}>
                    {cliente.ultimo_turno ? new Date(cliente.ultimo_turno).toLocaleDateString("es-AR") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ANÁLISIS DE DESCUENTOS */}
      <section className="three-grid">
        <article className="panel-card">
          <h3>📉 Descuentos Aplicados</h3>
          <div style={{ marginTop: "16px", display: "grid", gap: "10px" }}>
            <p style={{ display: "flex", justifyContent: "space-between", margin: "0", fontSize: "13px" }}>
              <span>Total descuentos:</span>
              <strong style={{ color: "#facc15" }}>
                ${(analisisDescuentos?.descuentos_totales || 0).toLocaleString("es-AR", { maximumFractionDigits: 0 })}
              </strong>
            </p>
            <p style={{ display: "flex", justifyContent: "space-between", margin: "0", fontSize: "13px" }}>
              <span>Clientes con descuento:</span>
              <strong>{analisisDescuentos?.clientes_con_descuento || 0}</strong>
            </p>
            <p style={{ display: "flex", justifyContent: "space-between", margin: "0", fontSize: "13px" }}>
              <span>Turnos con descuento:</span>
              <strong>{analisisDescuentos?.turnos_con_descuento || 0}</strong>
            </p>
            <p style={{ display: "flex", justifyContent: "space-between", margin: "0", fontSize: "13px" }}>
              <span>Porcentaje promedio:</span>
              <strong>{(analisisDescuentos?.porcentaje_promedio || 0).toFixed(1)}%</strong>
            </p>
          </div>
        </article>

        <article className="panel-card" style={{ textAlign: "center" }}>
          <h3>💹 Ganancias Netas (Mes)</h3>
          <div style={{ fontSize: "40px", fontWeight: "800", color: "#22c55e", marginTop: "20px" }}>
            ${((ingresosMes?.ingresos_totales || 0) - (ingresosMes?.descuentos_totales || 0)).toLocaleString("es-AR", { maximumFractionDigits: 0 })}
          </div>
          <p style={{ margin: "8px 0 0", color: "var(--muted)", fontSize: "12px" }}>
            Sin contar gastos operacionales
          </p>
        </article>

        <article className="panel-card">
          <h3>📈 Estadísticas</h3>
          <div style={{ marginTop: "16px", display: "grid", gap: "10px" }}>
            <p style={{ display: "flex", justifyContent: "space-between", margin: "0", fontSize: "13px" }}>
              <span>Ticket promedio mes:</span>
              <strong style={{ color: "#22c55e" }}>
                ${(ingresosMes?.promedio_ticket || 0).toLocaleString("es-AR", { maximumFractionDigits: 0 })}
              </strong>
            </p>
            <p style={{ display: "flex", justifyContent: "space-between", margin: "0", fontSize: "13px" }}>
              <span>Turnos/día promedio:</span>
              <strong>{((ingresosMes?.cantidad_turnos || 0) / 30).toFixed(1)}</strong>
            </p>
            <p style={{ display: "flex", justifyContent: "space-between", margin: "0", fontSize: "13px" }}>
              <span>Ingresos brutos (sin desc):</span>
              <strong>
                ${((ingresosMes?.ingresos_totales || 0) + (ingresosMes?.descuentos_totales || 0)).toLocaleString("es-AR", { maximumFractionDigits: 0 })}
              </strong>
            </p>
          </div>
        </article>
      </section>

      {/* INGRESOS DIARIOS (últimos 7 días) */}
      <section className="panel-card">
        <h3 style={{ marginBottom: "16px" }}>📊 Últimos 7 días</h3>
        {ingresosDiarios.length === 0 ? (
          <p style={{ color: "var(--muted)", textAlign: "center", padding: "20px" }}>Sin datos</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "10px" }}>
            {ingresosDiarios.slice(0, 7).map((dia) => (
              <div key={dia.fecha} style={{ padding: "12px", borderRadius: "8px", background: "rgba(126, 34, 206, 0.1)", textAlign: "center", fontSize: "12px" }}>
                <div style={{ fontWeight: "600", color: "#e9d5ff", marginBottom: "8px" }}>
                  {new Date(dia.fecha).toLocaleDateString("es-AR", { weekday: "short" })}
                </div>
                <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "4px" }}>
                  {new Date(dia.fecha).toLocaleDateString("es-AR")}
                </div>
                <div style={{ color: "#22c55e", fontWeight: "600" }}>
                  ${(dia.ingresos_totales || 0).toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                </div>
                <div style={{ fontSize: "10px", color: "var(--muted)" }}>
                  {dia.cantidad_turnos} servicios
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
