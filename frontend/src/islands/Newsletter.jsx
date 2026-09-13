// === Island React: newsletter signup ("La carta de Corriente") ===
// Interactiva: llama a POST /subscribers del backend; estados de éxito y error.

import { useState } from 'react'

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [cargando, setCargando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')

  const suscribir = async (e) => {
    e.preventDefault()
    if (!email.includes('@') || cargando) return
    setCargando(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/subscribers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        // detail de pydantic puede venir como array de errores de validación
        const detalle = Array.isArray(data?.detail)
          ? data.detail[0]?.msg
          : data?.detail
        throw new Error(detalle || 'No se pudo completar la suscripción.')
      }
      setEnviado(true)
    } catch (err) {
      setError(err.message || 'No se pudo completar la suscripción.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <section className="flex flex-col gap-6 border-t border-border py-12 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-kicker text-primary">
          La carta de Corriente
        </p>
        <h2 className="font-serif text-3xl font-bold tracking-[-0.04em]">
          Una lectura que vale la pena.
        </h2>
      </div>
      {enviado ? (
        <p className="text-sm font-bold text-primary">
          ¡Listo! Revisa tu correo: te enviamos las gracias y los últimos titulares.
        </p>
      ) : (
        <div className="w-full max-w-md">
          <form
            onSubmit={suscribir}
            className="flex w-full border-b-2 border-foreground pb-2"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Tu correo electrónico"
              aria-label="Tu correo electrónico"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={cargando}
              className="text-xs font-bold uppercase tracking-meta text-primary disabled:opacity-50"
            >
              {cargando ? 'Enviando…' : 'Apuntarme →'}
            </button>
          </form>
          {error && <p className="mt-2 text-xs font-bold text-primary">{error}</p>}
        </div>
      )}
    </section>
  )
}
