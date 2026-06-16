"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const primaryItems = [
  { href: "/", label: "Resumen", icon: "RS" },
  { href: "/turnos", label: "Turnos", icon: "TU" },
  { href: "/calendario", label: "Calendario", icon: "CA" },
  { href: "/horarios", label: "Horarios Profesionales", icon: "HR" },
  { href: "/mascotas", label: "Mascotas", icon: "MA" },
  { href: "/servicios", label: "Servicios", icon: "SV" },
  { href: "/clientes", label: "Clientes", icon: "CL" },
  { href: "/resenas", label: "Reseñas", icon: "ES" },
  { href: "/reportes", label: "Reportes", icon: "RP" },
  { href: "/finanzas", label: "Finanzas", icon: "$" },
  { href: "/recordatorios", label: "Recordatorios", icon: "RE" },
  { href: "/gift-cards", label: "Gift Cards", icon: "GC" },
  { href: "/descuentos", label: "Descuentos Fidelidad", icon: "DF" },
  { href: "/centro-mensajes", label: "Centro de Mensajes", icon: "CM" },
]

const advancedItems = [
  { href: "/bloqueos", label: "Bloqueos / Vacaciones", icon: "BL" },
  { href: "/pasarela-pago", label: "Pasarela de Pago", icon: "PG" },
  { href: "/configuracion", label: "Configuracion", icon: "CF" },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="sidebar">
      <div className="brand">
        <img
          src="/logo-zen.png"
          alt="Zen Spa para Mascotas"
          style={{
            width: "54px",
            height: "54px",
            borderRadius: "50%",
            objectFit: "cover",
            objectPosition: "center",
            flexShrink: 0,
          }}
        />
        <div>
          <h1>Zen Spa para Mascotas</h1>
          <p>Parana, Entre Rios</p>
        </div>
      </div>

      <nav className="nav-section" aria-label="Panel de control">
        <p className="nav-title">Panel de control</p>
        {primaryItems.map((item) => (
          <Link
            key={item.href + item.label}
            href={item.href}
            className={pathname === item.href ? "nav-link active" : "nav-link"}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <nav className="nav-section" aria-label="Gestion avanzada">
        <p className="nav-title">Gestion avanzada</p>
        {advancedItems.map((item) => (
          <Link
            key={item.href + item.label}
            href={item.href}
            className={pathname === item.href ? "nav-link active" : "nav-link"}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="location-card">
        <div className="map-preview">
          <div className="pin" />
        </div>
        <strong>Zen Spa para Mascotas</strong>
        <p>Parana, Entre Rios</p>
      </div>

      <div className="whatsapp-card">
        <span>WhatsApp Business</span>
        <strong>343-526-3898</strong>
      </div>

      <div className="mode-card">
        <span>Modo Oscuro</span>
        <div className="toggle"><span /></div>
      </div>
    </aside>
  )
}
