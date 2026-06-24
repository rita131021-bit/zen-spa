export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001"
export const SOCKET_BASE = process.env.NEXT_PUBLIC_SOCKET_URL || API_BASE

export async function fetchApi<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${path}`, { cache: "no-store" })
    if (!response.ok) return fallback
    return response.json()
  } catch {
    return fallback
  }
}

export type Servicio = {
  id: number
  nombre: string
  categoria: string | null
  precio: number | string | null
  duracion_minutos: number | null
  descripcion: string | null
  activo: number | boolean
  requiere_canil?: number | boolean
}

export type Turno = {
  id: number
  fecha: string
  hora: string
  estado: string
  pago: string
  cliente_id?: number
  mascota_id?: number
  servicio_id?: number
  profesional_id?: number
  servicio_precio?: number | string
  precio_final?: number | string
  observaciones?: string | null
  cliente_nombre?: string
  mascota_nombre?: string
  mascota_especie?: string
  servicio_nombre?: string
  profesional_nombre?: string
  canil_nombre?: string
}

export type Cliente = {
  id: number
  nombre: string
  telefono?: string | null
  whatsapp?: string | null
  email?: string | null
  direccion?: string | null
  notas?: string | null
  creado_en?: string | null
}

export type Mascota = {
  id: number
  cliente_id: number
  nombre: string
  especie?: string | null
  raza?: string | null
  peso?: number | string | null
  edad?: string | null
  sexo?: string | null
  dueño_nombre?: string | null
  dueño_whatsapp?: string | null
  // Nuevos campos
  tipo_mascota?: string | null
  talla?: string | null
  alimento_tipo?: string | null
  alimento_especial?: boolean | number | null
  horario_preferido?: string | null
  camita?: boolean | number | null
  mantita?: boolean | number | null
  notas?: string | null
}

export type Profesional = {
  id: number
  nombre: string
  telefono?: string | null
  email?: string | null
  activo?: number | boolean
}

export type Bloqueo = {
  id: number
  fecha: string
  motivo?: string | null
}

export type Horario = {
  id: number
  dia: string
  hora: string
  disponible: number | boolean
}

export type DisponibilidadSlot = {
  hora: string
  disponible: boolean
  estado: string
  razones: string[]
}

export type ChatMensaje = {
  id: number
  cliente_id: number
  autor_tipo: "cliente" | "admin"
  autor_nombre: string
  mensaje: string
  creado_en: string
}

export type RecordatorioItem = {
  id: number
  turno_id: number
  tipo: string
  estado: string
  mensaje?: string
  whatsapp_url?: string | null
  cliente_nombre?: string
  mascota_nombre?: string
  servicio_nombre?: string
  fecha?: string
  hora?: string
}

export type GiftCard = {
  id: number
  codigo: string
  monto_inicial: number
  monto_saldo: number
  cliente_id?: number | null
  cliente_nombre?: string | null
  estado: 'activa' | 'canjeada' | 'vencida' | 'anulada'
  fecha_emision: string
  fecha_vencimiento?: string | null
  notas?: string | null
  creado_en?: string
}
