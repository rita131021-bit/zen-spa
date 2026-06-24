"use client"

import { useMemo, useState } from "react"
import { MetricCard, PageHeader } from "@/components/AdminShell"
import { Cliente, Mascota, Servicio, Turno } from "@/lib/api"

type Props = {
  initialTurnos:    Turno[]
  initialClientes:  Cliente[]
  initialMascotas:  Mascota[]
  initialServicios: Servicio[]
}

type Tab = "resumen" | "servicios" | "clientes" | "mascotas" | "finanzas"

function normalizeDate(v: string | Date) { return String(v).slice(0, 10) }

export default function ReportesManager({ initialTurnos, initialMascotas }: Props) {
  const [tab,       setTab]       = useState<Tab>("resumen")
  const [periodoI,  setPeriodoI]  = useState("")
  const [periodoF,  setPeriodoF]  = useState("")

  const hoy = normalizeDate(new Date().toISOString())

  // Filtrar turnos por período si está seleccionado
  const turnos = useMemo(() => {
    if (!periodoI && !periodoF) return initialTurnos
    return initialTurnos.filter((t) => {
      const f = normalizeDate(String(t.fecha))
      if (periodoI && f < periodoI) return false
      if (periodoF && f > periodoF) return false
      return true
    })
  }, [initialTurnos, periodoI, periodoF])

  const completados = turnos.filter((t) => t.estado === "Completado" || t.estado === "Confirmado")
  const cancelados  = turnos.filter((t) => t.estado === "Cancelado")
  const pendientes  = turnos.filter((t) => t.estado === "Pendiente")

  const ingresos = completados.reduce((s, t) => s + Number(t.precio_final || t.servicio_precio || 0), 0)
  const ticketPromedio = completados.length ? ingresos / completados.length : 0

  // Ingresos por servicio
  const ingresosPorServicio = useMemo(() => {
    const map = new Map<string, { cantidad: number; total: number }>()
    for (const t of completados) {
      const nombre = t.servicio_nombre || "Sin servicio"
      const precio = Number(t.precio_final || t.servicio_precio || 0)
      const prev   = map.get(nombre) || { cantidad: 0, total: 0 }
      map.set(nombre, { cantidad: prev.cantidad + 1, total: prev.total + precio })
    }
    return Array.from(map.entries())
      .map(([nombre, v]) => ({ nombre, ...v }))
      .sort((a, b) => b.total - a.total)
  }, [completados])

  // Turnos por día (últimos 14 días)
  const turnosPorDia = useMemo(() => {
    const map = new Map<string, number>()
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      map.set(normalizeDate(d.toISOString()), 0)
    }
    for (const t of turnos) {
      const f = normalizeDate(String(t.fecha))
      if (map.has(f)) map.set(f, (map.get(f) || 0) + 1)
    }
    return Array.from(map.entries()).map(([fecha, cant]) => ({ fecha, cant }))
  }, [turnos])

  const maxTurnosDia = Math.max(...turnosPorDia.map((d) => d.cant), 1)

  // Clientes con más turnos
  const topClientes = useMemo(() => {
    const map = new Map<number, { nombre: string; cantidad: number }>()
    for (const t of turnos) {
      if (!t.cliente_id) continue
      const nombre = t.cliente_nombre || `Cliente ${t.cliente_id}`
      const prev   = map.get(t.cliente_id) || { nombre, cantidad: 0 }
      map.set(t.cliente_id, { nombre, cantidad: prev.cantidad + 1 })
    }
    return Array.from(map.values()).sort((a, b) => b.cantidad - a.cantidad).slice(0, 10)
  }, [turnos])

  // Mascotas con más turnos
  const topMascotas = useMemo(() => {
    const map = new Map<number, { nombre: string; especie: string; cantidad: number }>()
    for (const t of turnos) {
      if (!t.mascota_id) continue
      const nombre  = t.mascota_nombre || `Mascota ${t.mascota_id}`
      const especie = t.mascota_especie || ""
      const prev    = map.get(t.mascota_id) || { nombre, especie, cantidad: 0 }
      map.set(t.mascota_id, { nombre, especie, cantidad: prev.cantidad + 1 })
    }
    return Array.from(map.values()).sort((a, b) => b.cantidad - a.cantidad).slice(0, 10)
  }, [turnos])

  // Mascotas por especie
  const especiesCount = useMemo(() => {
    const map = new Map<string, number>()
    for (const m of initialMascotas) {
      const esp = m.especie || "Sin especie"
      map.set(esp, (map.get(esp) || 0) + 1)
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [initialMascotas])

  function handleExportar() {
    const rows = [
      ["Fecha","Cliente","Mascota","Servicio","Estado","Precio"],
      ...turnos.map((t) => [
        normalizeDate(String(t.fecha)),
        t.cliente_nombre || "",
        t.mascota_nombre || "",
        t.servicio_nombre || "",
        t.estado || "",
        t.precio_final || t.servicio_precio || "0",
      ])
    ]
    const csv  = rows.map((r) => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href     = url
    a.download = `reporte-zen-spa-${hoy}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <PageHeader
        eyebrow="📊 Reportes"
        title="Reportes y Estadisticas"
        subtitle="Analiza el rendimiento del negocio con datos reales."
        action={
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input type="date" value={periodoI} onChange={(e) => setPeriodoI(e.target.value)}
              style={{ padding: "8px", fontSize: "13px" }} title="Desde" />
            <input type="date" value={periodoF} onChange={(e) => setPeriodoF(e.target.value)}
              style={{ padding: "8px", fontSize: "13px" }} title="Hasta" />
            <button className="outline-button yellow" onClick={handleExportar}>
              ⬇️ Exportar CSV
            </button>
          </div>
        }
      />

      {/* MÉTRICAS */}
      <section className="metrics-grid five">
        <MetricCard label="Ingresos totales"   value={`$${ingresos.toLocaleString("es-AR")}`}        detail={`${completados.length} servicios completados`}  tone="green"  />
        <MetricCard label="Turnos totales"      value={String(turnos.length)}                         detail={`${pendientes.length} pendientes`}               tone="purple" />
        <MetricCard label="Cancelados"          value={String(cancelados.length)}                     detail={`${Math.round(cancelados.length/Math.max(turnos.length,1)*100)}% del total`} tone="yellow" />
        <MetricCard label="Clientes activos"    value={String(new Set(turnos.map((t) => t.cliente_id)).size)} detail="Con al menos 1 turno"               tone="blue"   />
        <MetricCard label="Ticket promedio"     value={`$${Math.round(ticketPromedio).toLocaleString("es-AR")}`} detail="Por servicio completado"          tone="green"  />
      </section>

      {/* TABS */}
      <div className="tab-strip" style={{ marginBottom: "4px" }}>
        {(["resumen","servicios","clientes","mascotas","finanzas"] as Tab[]).map((t) => (
          <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}
            style={{ textTransform: "capitalize" }}>
            {t === "resumen" ? "Resumen general" : t === "finanzas" ? "Finanzas" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* TAB: RESUMEN */}
      {tab === "resumen" && (
        <>
          <section className="two-grid">
            <article className="panel-card">
              <h3 style={{ marginBottom: "16px" }}>📈 Turnos últimos 14 días</h3>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "120px" }}>
                {turnosPorDia.map((d) => (
                  <div key={d.fecha} title={`${d.fecha}: ${d.cant} turnos`}
                    style={{ flex: 1, background: "rgba(126,34,206,0.6)", borderRadius: "3px 3px 0 0",
                      height: `${Math.max((d.cant / maxTurnosDia) * 100, d.cant ? 6 : 2)}%`,
                      minHeight: "2px", cursor: "default" }} />
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--muted)", marginTop: "4px" }}>
                <span>{turnosPorDia[0]?.fecha.slice(5)}</span>
                <span>{turnosPorDia[13]?.fecha.slice(5)}</span>
              </div>
            </article>

            <article className="panel-card">
              <h3 style={{ marginBottom: "16px" }}>📊 Estado de turnos</h3>
              {[
                { label: "Completados/Confirmados", value: completados.length, color: "#22c55e" },
                { label: "Pendientes",              value: pendientes.length,  color: "#facc15" },
                { label: "Cancelados",              value: cancelados.length,  color: "#ef4444" },
              ].map((item) => (
                <div key={item.label} style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                    <span>{item.label}</span>
                    <strong style={{ color: item.color }}>{item.value}</strong>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "4px", height: "6px" }}>
                    <div style={{ background: item.color, borderRadius: "4px", height: "100%",
                      width: `${Math.round(item.value / Math.max(turnos.length, 1) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </article>
          </section>
        </>
      )}

      {/* TAB: SERVICIOS */}
      {tab === "servicios" && (
        <section className="panel-card table-card">
          <h3 style={{ marginBottom: "16px" }}>🎯 Ingresos y cantidad por servicio</h3>
          {ingresosPorServicio.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>Sin datos de servicios.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Servicio</th>
                  <th>Turnos</th>
                  <th>Ingresos</th>
                  <th>Promedio</th>
                  <th>% del total</th>
                </tr>
              </thead>
              <tbody>
                {ingresosPorServicio.map((s) => (
                  <tr key={s.nombre}>
                    <td style={{ fontWeight: "500" }}>{s.nombre}</td>
                    <td>{s.cantidad}</td>
                    <td style={{ color: "#22c55e", fontWeight: "600" }}>${s.total.toLocaleString("es-AR")}</td>
                    <td>${Math.round(s.total / Math.max(s.cantidad, 1)).toLocaleString("es-AR")}</td>
                    <td style={{ color: "#a78bfa" }}>
                      {Math.round(s.cantidad / Math.max(completados.length, 1) * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {/* TAB: CLIENTES */}
      {tab === "clientes" && (
        <section className="panel-card table-card">
          <h3 style={{ marginBottom: "16px" }}>👥 Top clientes por cantidad de turnos</h3>
          {topClientes.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>Sin datos de clientes.</p>
          ) : (
            <table>
              <thead>
                <tr><th>#</th><th>Cliente</th><th>Turnos</th></tr>
              </thead>
              <tbody>
                {topClientes.map((c, i) => (
                  <tr key={c.nombre}>
                    <td style={{ color: "var(--muted)", width: "40px" }}>{i + 1}</td>
                    <td style={{ fontWeight: "500" }}>{c.nombre}</td>
                    <td style={{ color: "#22c55e", fontWeight: "600" }}>{c.cantidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {/* TAB: MASCOTAS */}
      {tab === "mascotas" && (
        <section className="two-grid">
          <article className="panel-card table-card">
            <h3 style={{ marginBottom: "16px" }}>🐾 Top mascotas por turnos</h3>
            <table>
              <thead>
                <tr><th>#</th><th>Mascota</th><th>Especie</th><th>Turnos</th></tr>
              </thead>
              <tbody>
                {topMascotas.map((m, i) => (
                  <tr key={m.nombre + i}>
                    <td style={{ color: "var(--muted)" }}>{i + 1}</td>
                    <td style={{ fontWeight: "500" }}>{m.nombre}</td>
                    <td style={{ fontSize: "12px", color: "var(--muted)" }}>{m.especie || "—"}</td>
                    <td style={{ color: "#22c55e", fontWeight: "600" }}>{m.cantidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
          <article className="panel-card">
            <h3 style={{ marginBottom: "16px" }}>📊 Mascotas por especie</h3>
            {especiesCount.map(([esp, cant]) => (
              <div key={esp} style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                  <span>{esp}</span><strong>{cant}</strong>
                </div>
                <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "4px", height: "6px" }}>
                  <div style={{ background: "#7e22ce", borderRadius: "4px", height: "100%",
                    width: `${Math.round(cant / Math.max(initialMascotas.length, 1) * 100)}%` }} />
                </div>
              </div>
            ))}
            <p style={{ marginTop: "16px", fontSize: "13px", color: "var(--muted)" }}>
              Total: <strong style={{ color: "#e9d5ff" }}>{initialMascotas.length}</strong> mascotas registradas
            </p>
          </article>
        </section>
      )}

      {/* TAB: FINANZAS */}
      {tab === "finanzas" && (
        <section className="two-grid">
          <article className="panel-card">
            <h3 style={{ marginBottom: "16px" }}>💰 Resumen financiero</h3>
            {[
              { label: "Ingresos totales",       value: `$${ingresos.toLocaleString("es-AR")}`,                    color: "#22c55e" },
              { label: "Ticket promedio",         value: `$${Math.round(ticketPromedio).toLocaleString("es-AR")}`, color: "#a78bfa" },
              { label: "Turnos completados",      value: String(completados.length),                               color: "#22c55e" },
              { label: "Turnos cancelados",       value: String(cancelados.length),                                color: "#ef4444" },
              { label: "Clientes únicos",         value: String(new Set(turnos.map((t) => t.cliente_id)).size),   color: "#60a5fa" },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: "14px" }}>
                <span style={{ color: "var(--muted)" }}>{item.label}</span>
                <strong style={{ color: item.color }}>{item.value}</strong>
              </div>
            ))}
          </article>
          <article className="panel-card table-card">
            <h3 style={{ marginBottom: "16px" }}>📋 Últimos 10 turnos</h3>
            <table>
              <thead>
                <tr><th>Fecha</th><th>Cliente</th><th>Servicio</th><th>Estado</th></tr>
              </thead>
              <tbody>
                {[...turnos]
                  .sort((a, b) => normalizeDate(String(b.fecha)).localeCompare(normalizeDate(String(a.fecha))))
                  .slice(0, 10)
                  .map((t) => (
                    <tr key={t.id}>
                      <td style={{ fontSize: "12px" }}>{normalizeDate(String(t.fecha))}</td>
                      <td style={{ fontSize: "12px" }}>{t.cliente_nombre || "—"}</td>
                      <td style={{ fontSize: "12px" }}>{t.servicio_nombre || "—"}</td>
                      <td>
                        <span className={
                          t.estado === "Completado" || t.estado === "Confirmado" ? "pill green" :
                          t.estado === "Cancelado" ? "pill gray" : "pill yellow"
                        }>{t.estado}</span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </article>
        </section>
      )}
    </>
  )
}
