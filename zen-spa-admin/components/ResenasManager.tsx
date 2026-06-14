"use client"

import { useEffect, useState } from "react"
import { MetricCard, PageHeader } from "@/components/AdminShell"
import { API_BASE } from "@/lib/api"

type Foto = { id: number; ruta: string }
type Resena = {
  id: number
  cliente_id?: number | null
  cliente_nombre?: string | null
  nombre_cliente: string
  email?: string | null
  calificacion: number
  comentario: string
  respuesta?: string | null
  estado: "pendiente" | "aprobada" | "rechazada"
  destacada: boolean | number
  creado_en: string
  fotos: Foto[]
}

type Resumen = {
  total: number
  pendientes: number
  aprobadas: number
  rechazadas: number
  promedio: number | null
  destacadas: number
}

const tabs: { key: "todas" | "pendiente" | "aprobada" | "rechazada"; label: string }[] = [
  { key: "pendiente", label: "Pendientes" },
  { key: "aprobada",  label: "Aprobadas" },
  { key: "rechazada", label: "Rechazadas" },
  { key: "todas",     label: "Todas" },
]

function Estrellas({ n }: { n: number }) {
  return (
    <span style={{ color: "#facc15", letterSpacing: "2px" }}>
      {"★".repeat(n)}{"☆".repeat(5 - n)}
    </span>
  )
}

function formatFecha(v: string) {
  const d = new Date(v)
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export default function ResenasManager() {
  const [resenas, setResenas] = useState<Resena[]>([])
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [tab, setTab]         = useState<"todas" | "pendiente" | "aprobada" | "rechazada">("pendiente")
  const [loading, setLoading] = useState(true)
  const [respuestas, setRespuestas] = useState<Record<number, string>>({})
  const [editando, setEditando] = useState<number | null>(null)
  const [editTexto, setEditTexto] = useState("")
  const [message, setMessage] = useState("")

  async function cargar() {
    setLoading(true)
    try {
      const url = tab === "todas" ? `${API_BASE}/api/resenas` : `${API_BASE}/api/resenas?estado=${tab}`
      const [r1, r2] = await Promise.all([
        fetch(url),
        fetch(`${API_BASE}/api/resenas/resumen`),
      ])
      if (r1.ok) setResenas(await r1.json())
      if (r2.ok) setResumen(await r2.json())
    } catch {}
    setLoading(false)
  }

  useEffect(() => { cargar() }, [tab])

  async function accionEstado(id: number, accion: "aprobar" | "rechazar" | "pendiente") {
    setMessage("")
    const res = await fetch(`${API_BASE}/api/resenas/${id}/${accion}`, { method: "PATCH" })
    if (res.ok) {
      setMessage(accion === "aprobar" ? "✅ Reseña aprobada" : accion === "rechazar" ? "🚫 Reseña rechazada" : "↩️ Vuelta a pendiente")
      cargar()
    }
  }

  async function toggleDestacada(id: number, actual: boolean | number) {
    await fetch(`${API_BASE}/api/resenas/${id}/destacar`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destacada: !actual }),
    })
    cargar()
  }

  async function guardarRespuesta(id: number) {
    const respuesta = respuestas[id] ?? ""
    const res = await fetch(`${API_BASE}/api/resenas/${id}/respuesta`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ respuesta }),
    })
    if (res.ok) { setMessage("✅ Respuesta guardada"); cargar() }
  }

  async function guardarEdicion(id: number) {
    const res = await fetch(`${API_BASE}/api/resenas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comentario: editTexto }),
    })
    if (res.ok) { setEditando(null); setMessage("✅ Comentario actualizado"); cargar() }
  }

  async function eliminarFoto(fotoId: number) {
    if (!confirm("¿Eliminar esta foto?")) return
    const res = await fetch(`${API_BASE}/api/resenas/fotos/${fotoId}`, { method: "DELETE" })
    if (res.ok) { setMessage("🗑️ Foto eliminada"); cargar() }
  }

  async function eliminarResena(id: number) {
    if (!confirm("¿Eliminar esta reseña completa? Esta acción no se puede deshacer.")) return
    const res = await fetch(`${API_BASE}/api/resenas/${id}`, { method: "DELETE" })
    if (res.ok) { setMessage("🗑️ Reseña eliminada"); cargar() }
  }

  return (
    <>
      <PageHeader
        eyebrow="⭐ Reseñas"
        title="Moderación de Reseñas"
        subtitle="Aprobá, rechazá y respondé las reseñas con fotos enviadas por los clientes."
      />

      <section className="metrics-grid five">
        <MetricCard label="Total"      value={String(resumen?.total ?? 0)}      detail="Reseñas recibidas" tone="purple" />
        <MetricCard label="Pendientes" value={String(resumen?.pendientes ?? 0)} detail="Por moderar"       tone="yellow" />
        <MetricCard label="Aprobadas"  value={String(resumen?.aprobadas ?? 0)}  detail="Visibles en la web" tone="green" />
        <MetricCard label="Rechazadas" value={String(resumen?.rechazadas ?? 0)} detail="Ocultas"           tone="gray" />
        <MetricCard label="Promedio"   value={resumen?.promedio ? `${resumen.promedio} ★` : "—"} detail={`${resumen?.destacadas ?? 0} destacadas`} tone="blue" />
      </section>

      <div className="tab-strip" style={{ marginBottom: "4px" }}>
        {tabs.map((t) => (
          <button key={t.key} className={tab === t.key ? "active" : ""} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {message && (
        <div style={{ padding: "10px 14px", background: "rgba(34,197,94,0.15)", color: "#86efac", borderRadius: "7px", fontSize: "13px", marginBottom: "4px" }}>
          {message}
        </div>
      )}

      {loading ? (
        <p style={{ color: "var(--muted)" }}>Cargando reseñas...</p>
      ) : resenas.length === 0 ? (
        <section className="panel-card">
          <p style={{ color: "var(--muted)", textAlign: "center", margin: 0 }}>
            No hay reseñas {tab !== "todas" ? `en estado "${tab}"` : ""}.
          </p>
        </section>
      ) : (
        resenas.map((r) => (
          <section key={r.id} className="panel-card" style={{ display: "grid", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
              <div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "4px" }}>
                  <strong style={{ fontSize: "15px" }}>{r.nombre_cliente}</strong>
                  <Estrellas n={r.calificacion} />
                  {Boolean(r.destacada) && <span className="pill yellow">⭐ Destacada</span>}
                  <span className={
                    r.estado === "aprobada" ? "pill green" :
                    r.estado === "rechazada" ? "pill red" : "pill yellow"
                  }>{r.estado}</span>
                </div>
                <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)" }}>
                  {r.email ? `${r.email} · ` : ""}{formatFecha(r.creado_en)}
                  {r.cliente_nombre ? ` · Cliente registrado: ${r.cliente_nombre}` : ""}
                </p>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {r.estado !== "aprobada" && (
                  <button onClick={() => accionEstado(r.id, "aprobar")}
                    style={{ padding: "6px 12px", fontSize: "12px", background: "rgba(34,197,94,0.2)", border: "1px solid rgba(34,197,94,0.4)", borderRadius: "6px", cursor: "pointer", color: "#86efac" }}>
                    ✅ Aprobar
                  </button>
                )}
                {r.estado !== "rechazada" && (
                  <button onClick={() => accionEstado(r.id, "rechazar")}
                    style={{ padding: "6px 12px", fontSize: "12px", background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: "6px", cursor: "pointer", color: "#fca5a5" }}>
                    🚫 Rechazar
                  </button>
                )}
                {r.estado !== "pendiente" && (
                  <button onClick={() => accionEstado(r.id, "pendiente")}
                    style={{ padding: "6px 12px", fontSize: "12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "6px", cursor: "pointer", color: "var(--muted)" }}>
                    ↩️ Pendiente
                  </button>
                )}
                <button onClick={() => toggleDestacada(r.id, r.destacada)}
                  style={{ padding: "6px 12px", fontSize: "12px", background: "rgba(250,204,21,0.15)", border: "1px solid rgba(250,204,21,0.4)", borderRadius: "6px", cursor: "pointer", color: "#facc15" }}>
                  {r.destacada ? "★ Quitar destacado" : "☆ Destacar"}
                </button>
                <button onClick={() => eliminarResena(r.id)}
                  style={{ padding: "6px 12px", fontSize: "12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "6px", cursor: "pointer", color: "#fca5a5" }}>
                  🗑️
                </button>
              </div>
            </div>

            {/* Comentario (editable) */}
            {editando === r.id ? (
              <div style={{ display: "grid", gap: "8px" }}>
                <textarea value={editTexto} onChange={(e) => setEditTexto(e.target.value)}
                  style={{ minHeight: "70px", fontSize: "13px" }} />
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => guardarEdicion(r.id)} className="outline-button yellow" style={{ fontSize: "12px" }}>Guardar</button>
                  <button onClick={() => setEditando(null)} className="outline-button" style={{ fontSize: "12px" }}>Cancelar</button>
                </div>
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.6" }}>
                {r.comentario}{" "}
                <button onClick={() => { setEditando(r.id); setEditTexto(r.comentario) }}
                  style={{ background: "none", border: "none", color: "#a78bfa", cursor: "pointer", fontSize: "12px" }}>
                  ✏️ editar
                </button>
              </p>
            )}

            {/* Fotos */}
            {r.fotos.length > 0 && (
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {r.fotos.map((f) => (
                  <div key={f.id} style={{ position: "relative" }}>
                    <img src={`${API_BASE}${f.ruta}`} alt="Foto de reseña"
                      style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }} />
                    <button onClick={() => eliminarFoto(f.id)} title="Eliminar foto"
                      style={{ position: "absolute", top: "4px", right: "4px", width: "22px", height: "22px",
                        background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "50%", color: "#fca5a5", cursor: "pointer", fontSize: "12px" }}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Respuesta del negocio */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "10px" }}>
              <label style={{ display: "grid", gap: "6px" }}>
                <span style={{ fontSize: "12px", fontWeight: "600", color: "#e9d5ff" }}>💬 Respuesta de Zen Spa (pública)</span>
                <textarea
                  value={respuestas[r.id] ?? r.respuesta ?? ""}
                  onChange={(e) => setRespuestas((prev) => ({ ...prev, [r.id]: e.target.value }))}
                  placeholder="Escribí una respuesta pública a esta reseña..."
                  style={{ minHeight: "50px", fontSize: "13px" }}
                />
              </label>
              <button onClick={() => guardarRespuesta(r.id)} className="outline-button yellow" style={{ marginTop: "8px", fontSize: "12px" }}>
                Guardar respuesta
              </button>
            </div>
          </section>
        ))
      )}
    </>
  )
}
