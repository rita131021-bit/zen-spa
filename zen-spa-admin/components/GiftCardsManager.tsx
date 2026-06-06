"use client"

import { FormEvent, useEffect, useState } from "react"
import { MetricCard, PageHeader } from "@/components/AdminShell"
import { API_BASE, Cliente } from "@/lib/api"

type GiftCard = {
  id: number
  codigo: string
  monto_inicial: number
  monto_saldo: number
  cliente_id?: number
  cliente_nombre?: string
  estado: string
  fecha_emision: string
  fecha_vencimiento?: string
  notas?: string
}

export default function GiftCardsManager({ clientes }: { clientes: Cliente[] }) {
  const [giftCards, setGiftCards] = useState<GiftCard[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showCanjear, setShowCanjear] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const [form, setForm] = useState({ monto: "", cliente_id: "", fecha_vencimiento: "", notas: "" })
  const [canje, setCanje] = useState({ codigo: "", monto_usar: "" })
  const [canjeResult, setCanjeResult] = useState<any>(null)

  const cargar = async () => {
    setLoading(true)
    const res = await fetch(`${API_BASE}/api/giftcards`)
    if (res.ok) setGiftCards(await res.json())
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  const activas = giftCards.filter((g) => g.estado === "activa").length
  const totalSaldo = giftCards.filter((g) => g.estado === "activa").reduce((s, g) => s + Number(g.monto_saldo), 0)
  const totalVendido = giftCards.reduce((s, g) => s + Number(g.monto_inicial), 0)

  async function handleCrear(e: FormEvent) {
    e.preventDefault()
    setMessage(""); setError("")
    if (!form.monto || Number(form.monto) <= 0) { setError("El monto debe ser mayor a 0"); return }
    const res = await fetch(`${API_BASE}/api/giftcards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        monto: Number(form.monto),
        cliente_id: form.cliente_id ? Number(form.cliente_id) : null,
        fecha_vencimiento: form.fecha_vencimiento || null,
        notas: form.notas || null,
      }),
    })
    const data = await res.json()
    if (res.ok) {
      setMessage(`✅ Gift card creada — Código: ${data.codigo}`)
      setForm({ monto: "", cliente_id: "", fecha_vencimiento: "", notas: "" })
      setShowForm(false)
      cargar()
    } else {
      setError(data.error || "Error al crear")
    }
  }

  async function handleCanjear(e: FormEvent) {
    e.preventDefault()
    setMessage(""); setError(""); setCanjeResult(null)
    const res = await fetch(`${API_BASE}/api/giftcards/canjear`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigo: canje.codigo, monto_usar: Number(canje.monto_usar) }),
    })
    const data = await res.json()
    if (res.ok) {
      setCanjeResult(data)
      setCanje({ codigo: "", monto_usar: "" })
      cargar()
    } else {
      setError(data.error || "Error al canjear")
    }
  }

  async function handleAnular(id: number) {
    if (!confirm("¿Anular esta gift card?")) return
    const res = await fetch(`${API_BASE}/api/giftcards/${id}`, { method: "DELETE" })
    if (res.ok) cargar()
  }

  const estadoColor: Record<string, string> = {
    activa: "pill green",
    canjeada: "pill blue",
    vencida: "pill gray",
    anulada: "pill gray",
  }

  return (
    <>
      <PageHeader
        eyebrow="🎁 Gift Cards"
        title="Gift Cards"
        subtitle="Crear, vender y canjear gift cards con monto fijo o variable"
        action={
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="outline-button" onClick={() => { setShowCanjear(!showCanjear); setShowForm(false) }}>
              {showCanjear ? "✕" : "🔑 Canjear"}
            </button>
            <button className="outline-button yellow" onClick={() => { setShowForm(!showForm); setShowCanjear(false) }}>
              {showForm ? "✕" : "+ Nueva gift card"}
            </button>
          </div>
        }
      />

      <section className="metrics-grid five">
        <MetricCard label="Total creadas" value={String(giftCards.length)} detail="Historial completo" tone="purple" />
        <MetricCard label="Activas" value={String(activas)} detail="Con saldo disponible" tone="green" />
        <MetricCard label="Saldo total" value={`$${totalSaldo.toLocaleString("es-AR")}`} detail="En gift cards activas" tone="yellow" />
        <MetricCard label="Total vendido" value={`$${totalVendido.toLocaleString("es-AR")}`} detail="Histórico" tone="blue" />
        <MetricCard label="Canjeadas" value={String(giftCards.filter((g) => g.estado === "canjeada").length)} detail="Usadas completamente" tone="blue" />
      </section>

      {/* FORMULARIO CANJEAR */}
      {showCanjear && (
        <section className="panel-card">
          <h3 style={{ marginBottom: "16px" }}>🔑 Canjear Gift Card</h3>
          <form onSubmit={handleCanjear} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
            <label style={{ display: "grid", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "#e9d5ff" }}>Código</span>
              <input required value={canje.codigo} onChange={(e) => setCanje({ ...canje, codigo: e.target.value.toUpperCase() })} placeholder="ZEN-XXXXXXXX" style={{ padding: "10px" }} />
            </label>
            <label style={{ display: "grid", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "#e9d5ff" }}>Monto a usar ($)</span>
              <input required type="number" value={canje.monto_usar} onChange={(e) => setCanje({ ...canje, monto_usar: e.target.value })} placeholder="1500" style={{ padding: "10px" }} />
            </label>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button className="outline-button yellow" type="submit" style={{ width: "100%" }}>✅ Canjear</button>
            </div>
          </form>
          {canjeResult && (
            <div style={{ marginTop: "12px", padding: "12px", background: "rgba(34,197,94,0.2)", borderRadius: "7px", color: "#86efac", fontSize: "13px" }}>
              ✅ Canjeado ${Number(canjeResult.monto_usado).toLocaleString("es-AR")} — Saldo restante: ${Number(canjeResult.saldo_restante).toLocaleString("es-AR")}
            </div>
          )}
        </section>
      )}

      {/* FORMULARIO CREAR */}
      {showForm && (
        <section className="panel-card">
          <h3 style={{ marginBottom: "16px" }}>🎁 Nueva Gift Card</h3>
          <form onSubmit={handleCrear} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <label style={{ display: "grid", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "#e9d5ff" }}>Monto ($) *</span>
              <input required type="number" step="100" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} placeholder="5000" style={{ padding: "10px" }} />
            </label>
            <label style={{ display: "grid", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "#e9d5ff" }}>Cliente (opcional)</span>
              <select value={form.cliente_id} onChange={(e) => setForm({ ...form, cliente_id: e.target.value })} style={{ padding: "10px" }}>
                <option value="">Sin asignar</option>
                {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </label>
            <label style={{ display: "grid", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "#e9d5ff" }}>Vence (opcional)</span>
              <input type="date" value={form.fecha_vencimiento} onChange={(e) => setForm({ ...form, fecha_vencimiento: e.target.value })} style={{ padding: "10px" }} />
            </label>
            <label style={{ display: "grid", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "#e9d5ff" }}>Notas</span>
              <input value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} placeholder="Regalo, promoción..." style={{ padding: "10px" }} />
            </label>
            <div style={{ gridColumn: "1/-1", display: "flex", gap: "12px" }}>
              <button className="outline-button yellow" type="submit" style={{ flex: 1 }}>✅ Crear Gift Card</button>
              <button className="outline-button" type="button" onClick={() => setShowForm(false)} style={{ flex: 1 }}>Cancelar</button>
            </div>
          </form>
          {message && <div style={{ marginTop: "12px", padding: "10px", background: "rgba(34,197,94,0.2)", color: "#86efac", borderRadius: "6px", fontSize: "13px" }}>{message}</div>}
          {error && <div style={{ marginTop: "12px", padding: "10px", background: "rgba(239,68,68,0.2)", color: "#fca5a5", borderRadius: "6px", fontSize: "13px" }}>{error}</div>}
        </section>
      )}

      {/* TABLA */}
      <section className="panel-card table-card">
        <h3 style={{ marginBottom: "16px" }}>Historial de Gift Cards</h3>
        {loading ? <p>Cargando...</p> : giftCards.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>No hay gift cards. Creá la primera.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Cliente</th>
                <th>Monto inicial</th>
                <th>Saldo</th>
                <th>Vencimiento</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {giftCards.map((gc) => (
                <tr key={gc.id}>
                  <td style={{ fontFamily: "monospace", fontWeight: "600", color: "#a78bfa" }}>{gc.codigo}</td>
                  <td style={{ fontSize: "12px" }}>{gc.cliente_nombre || "—"}</td>
                  <td style={{ color: "#22c55e", fontWeight: "600" }}>${Number(gc.monto_inicial).toLocaleString("es-AR")}</td>
                  <td style={{ color: gc.monto_saldo > 0 ? "#facc15" : "var(--muted)", fontWeight: "600" }}>
                    ${Number(gc.monto_saldo).toLocaleString("es-AR")}
                  </td>
                  <td style={{ fontSize: "12px", color: "var(--muted)" }}>
                    {gc.fecha_vencimiento ? String(gc.fecha_vencimiento).slice(0, 10) : "Sin venc."}
                  </td>
                  <td><span className={estadoColor[gc.estado] || "pill gray"}>{gc.estado}</span></td>
                  <td>
                    {gc.estado === "activa" && (
                      <button onClick={() => handleAnular(gc.id)} style={{ padding: "4px 8px", fontSize: "12px", background: "rgba(239,68,68,0.3)", border: "1px solid rgba(239,68,68,0.5)", borderRadius: "4px", cursor: "pointer", color: "#fca5a5" }}>
                        Anular
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  )
}
