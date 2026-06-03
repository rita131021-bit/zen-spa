"use client"

import { usePathname, useRouter } from "next/navigation"

export default function NewTurnButton() {
  const router = useRouter()
  const pathname = usePathname()

  function openNewTurn() {
    if (pathname === "/turnos") {
      const target = document.getElementById("nuevo-turno")
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" })
        const firstField = target.querySelector<HTMLElement>("select, input, textarea")
        firstField?.focus()
        return
      }
    }
    router.push("/turnos#nuevo-turno")
  }

  return (
    <>
      <button type="button" className="new-turn-button" onClick={openNewTurn}>
        + Nuevo turno
      </button>
      <p className="assistant-link">Asistente en 4 pasos</p>
    </>
  )
}
