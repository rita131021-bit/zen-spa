"use client"

import { useEffect, useRef, useState } from "react"
import { io, Socket } from "socket.io-client"
import { PageHeader, MetricCard } from "@/components/AdminShell"
import { API_BASE, SOCKET_BASE } from "@/lib/api"

type Conversacion = {
  cliente_id: number
  cliente_nombre: string
  whatsapp?: string | null
  ultimo_mensaje?: string | null
  ultimo_en?: string | null
}

type Mensaje = {
  id: number
  cliente_id: number
  autor_tipo: "cliente" | "admin"
  autor_nombre: string
  mensaje: string
  creado_en: string
}

function formatHora(v: string) {
  const d = new Date(v)
  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
}

function formatFecha(v: string) {
  const d = new Date(v)
  const hoy = new Date()
  const esHoy = d.toDateString() === hoy.toDateString()
  if (esHoy) return "Hoy"
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })
}

export default function CentroMensajes() {
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([])
  const [activo, setActivo]                 = useState<Conversacion | null>(null)
  const [mensajes, setMensajes]             = useState<Mensaje[]>([])
  const [texto, setTexto]                   = useState("")
  const [loading, setLoading]               = useState(true)
  const [conectado, setConectado]           = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const scrollRef  = useRef<HTMLDivElement>(null)

  // Cargar lista de conversaciones
  async function cargarConversaciones() {
    try {
      const res = await fetch(`${API_BASE}/api/chat/conversaciones`)
      if (res.ok) setConversaciones(await res.json())
    } catch {}
    setLoading(false)
  }

  // Cargar mensajes de una conversación
  async function abrirConversacion(c: Conversacion) {
    setActivo(c)
    try {
      const res = await fetch(`${API_BASE}/api/chat/${c.cliente_id}`)
      if (res.ok) setMensajes(await res.json())
    } catch {}
  }

  // Conectar socket una sola vez
  useEffect(() => {
    cargarConversaciones()

    const socket = io(SOCKET_BASE, { transports: ["websocket", "polling"] })
    socketRef.current = socket

    socket.on("connect", () => {
      setConectado(true)
      socket.emit("join", { role: "admin" })
    })
    socket.on("disconnect", () => setConectado(false))

    socket.on("mensaje:nuevo", (payload: Mensaje) => {
      // Si es la conversación abierta, agregar el mensaje
      setActivo((current) => {
        if (current && current.cliente_id === payload.cliente_id) {
          setMensajes((prev) => [...prev, payload])
        }
        return current
      })
      // Refrescar la lista de conversaciones (para mostrar el último mensaje)
      cargarConversaciones()
    })

    return () => { socket.disconnect() }
  }, [])

  // Scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [mensajes])

  async function enviarMensaje() {
    if (!activo || !texto.trim()) return
    const mensaje = texto.trim()
    setTexto("")

    try {
      await fetch(`${API_BASE}/api/chat/${activo.cliente_id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensaje, autor_tipo: "admin", autor_nombre: "Romina" }),
      })
    } catch {}
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      enviarMensaje()
    }
  }

  const sinLeer = conversaciones.filter((c) => c.ultimo_mensaje).length

  return (
    <>
      <PageHeader
        eyebrow="💬 Chat"
        title="Centro de Mensajes"
        subtitle="Conversaciones en tiempo real con tus clientes desde la web."
        action={
          <span style={{
            display: "flex", alignItems: "center", gap: "6px", fontSize: "12px",
            color: conectado ? "#86efac" : "#fca5a5"
          }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: conectado ? "#22c55e" : "#ef4444" }} />
            {conectado ? "Conectado en tiempo real" : "Desconectado"}
          </span>
        }
      />

      <section className="metrics-grid five">
        <MetricCard label="Conversaciones" value={String(conversaciones.length)} detail="Clientes con chat" tone="purple" />
        <MetricCard label="Con mensajes"   value={String(sinLeer)}               detail="Activas"          tone="green" />
        <MetricCard label="Estado"          value={conectado ? "En vivo" : "Off"} detail="Conexión socket"  tone={conectado ? "green" : "red"} />
      </section>

      <section className="panel-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", minHeight: "520px" }}>

          {/* Lista de conversaciones */}
          <div style={{ borderRight: "1px solid rgba(255,255,255,0.06)", overflowY: "auto", maxHeight: "520px" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontWeight: "600", fontSize: "13px" }}>
              Conversaciones
            </div>
            {loading ? (
              <p style={{ padding: "16px", color: "var(--muted)", fontSize: "13px" }}>Cargando...</p>
            ) : conversaciones.length === 0 ? (
              <p style={{ padding: "16px", color: "var(--muted)", fontSize: "13px" }}>
                Sin conversaciones todavía. Los mensajes de clientes desde la web aparecerán acá.
              </p>
            ) : (
              conversaciones.map((c) => (
                <button
                  key={c.cliente_id}
                  onClick={() => abrirConversacion(c)}
                  style={{
                    display: "block", width: "100%", textAlign: "left", padding: "12px 16px",
                    background: activo?.cliente_id === c.cliente_id ? "rgba(126,34,206,0.15)" : "transparent",
                    border: "none", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <strong style={{ fontSize: "13px", color: "#e9d5ff" }}>{c.cliente_nombre}</strong>
                    {c.ultimo_en && <span style={{ fontSize: "11px", color: "var(--muted)" }}>{formatFecha(c.ultimo_en)}</span>}
                  </div>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {c.ultimo_mensaje || "Sin mensajes"}
                  </p>
                </button>
              ))
            )}
          </div>

          {/* Conversación activa */}
          <div style={{ display: "flex", flexDirection: "column", height: "520px" }}>
            {!activo ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: "13px" }}>
                Seleccioná una conversación para ver los mensajes
              </div>
            ) : (
              <>
                <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <strong style={{ fontSize: "14px" }}>{activo.cliente_nombre}</strong>
                  {activo.whatsapp && (
                    <a href={`https://wa.me/${activo.whatsapp}`} target="_blank" rel="noopener noreferrer"
                      style={{ marginLeft: "10px", fontSize: "12px", color: "#22c55e", textDecoration: "none" }}>
                      💬 {activo.whatsapp}
                    </a>
                  )}
                </div>

                <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  {mensajes.length === 0 ? (
                    <p style={{ color: "var(--muted)", fontSize: "13px", textAlign: "center" }}>Sin mensajes aún.</p>
                  ) : (
                    mensajes.map((m) => (
                      <div key={m.id} style={{
                        alignSelf: m.autor_tipo === "admin" ? "flex-end" : "flex-start",
                        maxWidth: "70%",
                        background: m.autor_tipo === "admin" ? "rgba(126,34,206,0.3)" : "rgba(255,255,255,0.06)",
                        border: `1px solid ${m.autor_tipo === "admin" ? "rgba(126,34,206,0.5)" : "rgba(255,255,255,0.1)"}`,
                        borderRadius: "10px", padding: "8px 12px",
                      }}>
                        <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.5" }}>{m.mensaje}</p>
                        <span style={{ fontSize: "10px", color: "var(--muted)" }}>
                          {m.autor_nombre} · {formatHora(m.creado_en)}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: "8px" }}>
                  <textarea
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribí un mensaje... (Enter para enviar)"
                    style={{ flex: 1, minHeight: "40px", maxHeight: "100px", fontSize: "13px", resize: "none" }}
                  />
                  <button onClick={enviarMensaje} className="outline-button yellow" disabled={!texto.trim()}>
                    Enviar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
