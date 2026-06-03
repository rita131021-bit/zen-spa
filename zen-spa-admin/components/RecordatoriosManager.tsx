"use client"

import Link from "next/link"
import { FormEvent, useEffect, useMemo, useRef, useState } from "react"
import { io, Socket } from "socket.io-client"
import { MetricCard, PageHeader } from "@/components/AdminShell"
import { API_BASE, ChatMensaje, Cliente, RecordatorioItem, SOCKET_BASE, Turno } from "@/lib/api"

type RecordatoriosManagerProps = {
  resumen: {
    turnos_hoy?: number
    recordatorios_pendientes?: number
    recordatorios_enviados_hoy?: number
    confirmaciones_pendientes?: number
  }
  proximosTurnos: Turno[]
  recordatoriosPendientes: RecordatorioItem[]
  clientes: Cliente[]
  initialMensajes: ChatMensaje[]
  initialClienteId?: number
}

export default function RecordatoriosManager({
  resumen,
  proximosTurnos,
  recordatoriosPendientes,
  clientes,
  initialMensajes,
  initialClienteId,
}: RecordatoriosManagerProps) {
  const [pendientes, setPendientes] = useState(recordatoriosPendientes)
  const [selectedClienteId, setSelectedClienteId] = useState<number | null>(
    initialClienteId || clientes[0]?.id || null
  )
  const [mensajes, setMensajes] = useState<ChatMensaje[]>(initialMensajes)
  const [draft, setDraft] = useState("")
  const [message, setMessage] = useState("")
  const socketRef = useRef<Socket | null>(null)

  const selectedCliente = clientes.find((c) => c.id === selectedClienteId)

  const sinResponder = useMemo(
    () =>
      mensajes.filter((m) => m.autor_tipo === "cliente").length > 0 &&
      mensajes[mensajes.length - 1]?.autor_tipo === "cliente",
    [mensajes]
  )

  useEffect(() => {
    const socket = io(SOCKET_BASE, { transports: ["websocket", "polling"] })
    socketRef.current = socket
    socket.emit("join", { role: "admin", clienteId: selectedClienteId })

    socket.on("mensaje:nuevo", (payload: ChatMensaje) => {
      if (Number(payload.cliente_id) === Number(selectedClienteId)) {
        setMensajes((current) => [...current, payload])
      }
    })

    return () => {
      socket.disconnect()
    }
  }, [selectedClienteId])

  useEffect(() => {
    if (!selectedClienteId) return
    fetch(`${API_BASE}/api/chat/${selectedClienteId}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : []))
      .then((rows) => setMensajes(rows))
      .catch(() => setMensajes([]))
    socketRef.current?.emit("join", { role: "admin", clienteId: selectedClienteId })
  }, [selectedClienteId])

  async function enviarRecordatorio(id: number) {
    const response = await fetch(`${API_BASE}/api/recordatorios/${id}/enviar`, { method: "POST" })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) return
    if (data.whatsapp_url) window.open(data.whatsapp_url, "_blank", "noopener,noreferrer")
    setPendientes((current) => current.filter((item) => item.id !== id))
    setMessage("Recordatorio marcado como enviado")
  }

  async function ejecutarJob() {
    const response = await fetch(`${API_BASE}/api/recordatorios/ejecutar`, { method: "POST" })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) return
    setMessage(data.mensaje || "Proceso ejecutado")
    const refresh = await fetch(`${API_BASE}/api/recordatorios/pendientes`, { cache: "no-store" })
    if (refresh.ok) setPendientes(await refresh.json())
  }

  async function enviarMensaje(event: FormEvent) {
    event.preventDefault()
    if (!selectedClienteId || !draft.trim()) return

    const payload = {
      cliente_id: selectedClienteId,
      mensaje: draft.trim(),
      autor_tipo: "admin" as const,
      autor_nombre: "Romina",
    }

    const response = await fetch(`${API_BASE}/api/chat/${selectedClienteId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (response.ok) {
      const data = await response.json()
      if (data.data) setMensajes((current) => [...current, data.data])
      setDraft("")
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="bell"
        title="Recordatorios y Mensajes"
        subtitle="Chat online con clientes y recordatorios automaticos por WhatsApp."
        action={
          <button type="button" className="outline-button" onClick={ejecutarJob}>
            Generar recordatorios 24h
          </button>
        }
      />

      <section className="metrics-grid five">
        <MetricCard label="Turnos de hoy" value={String(resumen.turnos_hoy || 0)} detail="Desde la base de datos" tone="yellow" />
        <MetricCard label="Recordatorios pendientes" value={String(pendientes.length)} detail="Listos para WhatsApp" tone="yellow" />
        <MetricCard label="Mensajes sin responder" value={sinResponder ? "Si" : "No"} detail="Ultimo mensaje del cliente" tone="red" />
        <MetricCard label="Confirmaciones pendientes" value={String(resumen.confirmaciones_pendientes || 0)} detail="Turnos por confirmar" />
        <MetricCard label="Recordatorios enviados hoy" value={String(resumen.recordatorios_enviados_hoy || 0)} detail="Canal WhatsApp" tone="blue" />
      </section>

      <section className="chat-layout">
        <article className="panel-card table-card">
          <h3>Proximos turnos para recordar</h3>
          <table>
            <tbody>
              {proximosTurnos.length === 0 && (
                <tr>
                  <td colSpan={2}>No hay turnos proximos.</td>
                </tr>
              )}
              {proximosTurnos.slice(0, 8).map((turno) => (
                <tr key={turno.id}>
                  <td>
                    {turno.cliente_nombre} — {turno.mascota_nombre} — {String(turno.fecha).slice(0, 10)}{" "}
                    {String(turno.hora).slice(0, 5)}
                  </td>
                  <td>
                    <span className={`pill ${turno.estado === "Pendiente" ? "yellow" : "green"}`}>
                      {turno.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Link href="/turnos" className="wide-button">
            Ver todos los turnos
          </Link>

          <h3 style={{ marginTop: 18 }}>Recordatorios WhatsApp pendientes</h3>
          <table>
            <tbody>
              {pendientes.length === 0 && (
                <tr>
                  <td colSpan={2}>No hay recordatorios pendientes.</td>
                </tr>
              )}
              {pendientes.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.cliente_nombre} — {item.mascota_nombre} ({item.tipo})
                  </td>
                  <td>
                    <button type="button" className="outline-button yellow" onClick={() => enviarRecordatorio(item.id)}>
                      Enviar WhatsApp
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="panel-card chat-box">
          <h3>Centro de mensajes (Socket.io)</h3>
          <label>
            Cliente
            <select
              value={selectedClienteId || ""}
              onChange={(e) => setSelectedClienteId(Number(e.target.value))}
            >
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombre}
                </option>
              ))}
            </select>
          </label>
          {mensajes.map((item) => (
            <div key={item.id} className={item.autor_tipo === "admin" ? "message me" : "message"}>
              <strong>{item.autor_nombre}: </strong>
              {item.mensaje}
            </div>
          ))}
          <form className="input-row" onSubmit={enviarMensaje}>
            <input
              placeholder="Escribi un mensaje..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button className="outline-button" type="submit">
              Enviar
            </button>
          </form>
          {selectedCliente?.whatsapp && (
            <p className="tone-purple">
              WhatsApp del cliente:{" "}
              <a href={`https://wa.me/54${String(selectedCliente.whatsapp).replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                {selectedCliente.whatsapp}
              </a>{" "}
              (solo confirmaciones/recordatorios automaticos al reservar)
            </p>
          )}
        </article>
      </section>

      {message && <p className="tone-green">{message}</p>}

      <section className="three-grid">
        <article className="panel-card">
          <h3>Actividad reciente</h3>
          {pendientes.slice(0, 3).map((item) => (
            <p key={item.id}>
              Recordatorio {item.tipo} pendiente — {item.cliente_nombre}
            </p>
          ))}
          {pendientes.length === 0 && <p>Sin recordatorios pendientes.</p>}
        </article>
        <article className="panel-card">
          <h3>Estado del chat</h3>
          <p className="tone-green">Socket.io conectado</p>
          <p>Conversacion activa: {selectedCliente?.nombre || "-"}</p>
        </article>
        <article className="panel-card">
          <h3>Automatizaciones activas</h3>
          <p>Recordatorio 24 hs antes (cada hora)</p>
          <p>Confirmacion WhatsApp al crear turno</p>
        </article>
      </section>
    </>
  )
}

function ClientAside({ cliente, mascotasLabel }: { cliente?: Cliente; mascotasLabel: string }) {
  if (!cliente) return null
  return (
    <>
      <section className="panel-card pet-card">
        <h3>Ficha del Cliente</h3>
        <div className="pet-head">
          <div className="pet-photo">{cliente.nombre?.slice(0, 2).toUpperCase()}</div>
          <div>
            <h4>{cliente.nombre}</h4>
            <p>{cliente.whatsapp || cliente.telefono || "-"}</p>
          </div>
        </div>
        <div className="stack-list">
          <p>
            Mascotas <span>{mascotasLabel}</span>
          </p>
        </div>
      </section>
      <section className="panel-card">
        <h3>Plantillas rapidas</h3>
        <p>Recordatorio de turno</p>
        <p>Confirmacion de turno</p>
        <p>Gracias por tu visita</p>
      </section>
    </>
  )
}

export function RecordatoriosAside({
  clientes,
  selectedClienteId,
}: {
  clientes: Cliente[]
  selectedClienteId?: number | null
}) {
  const cliente = clientes.find((c) => c.id === selectedClienteId)
  return <ClientAside cliente={cliente} mascotasLabel="Ver en Mascotas" />
}
