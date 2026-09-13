// === Island React: confirmación de baja del newsletter ===
// Lee ?token= del enlace del correo, muestra el email enmascarado y
// pide confirmación antes de dar la baja.

import { useEffect, useState } from 'react'

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'

export default function BajaNewsletter() {
  const [token, setToken] = useState('')
  const [email, setEmail] = useState('')
  const [yaInactivo, setYaInactivo] = useState(false)
  const [estado, setEstado] = useState('validando') // validando | listo | confirmado | invalido | error
  const [error, setError] = useState('')

  // Valida el token al montar (el email llega enmascarado: j***@gmail.com)
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('token') || ''
    setToken(t)
    if (!t) {
      setEstado('invalido')
      return
    }
    fetch(`${API_URL}/subscribers/baja-info?token=${encodeURIComponent(t)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error()
        const data = await res.json()
        setEmail(data.email)
        setYaInactivo(Boolean(data.ya_inactivo))
        setEstado('listo')
      })
      .catch(() => setEstado('invalido'))
  }, [])

  const confirmar = async () => {
    setEstado('procesando')
    setError('')
    try {
      const res = await fetch(
        `${API_URL}/subscribers/baja?token=${encodeURIComponent(token)}`,
        { method: 'POST' }
      )
      if (!res.ok) throw new Error()
      setEstado('confirmado')
    } catch {
      setError('No se pudo procesar la baja. Inténtalo de nuevo en unos minutos.')
      setEstado('listo')
    }
  }

  return (
    <section className="mx-auto max-w-xl py-16 sm:py-24">
      <p className="mb-2 text-xs font-bold uppercase tracking-kicker text-primary">
        La carta de Corriente
      </p>

      {estado === 'validando' && (
        <p className="text-sm text-muted-foreground">Validando tu enlace…</p>
      )}

      {estado === 'invalido' && (
        <>
          <h1 className="font-serif text-3xl font-bold tracking-[-0.04em]">
            Enlace no válido
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Este enlace de baja no es válido o fue modificado. Abre el correo de
            La carta de Corriente y usa el botón "Darse de baja" tal cual.
          </p>
        </>
      )}

      {(estado === 'listo' || estado === 'procesando') && (
        <>
          <h1 className="font-serif text-3xl font-bold tracking-[-0.04em]">
            ¿Darte de baja?
          </h1>
          {yaInactivo ? (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              El correo <strong>{email}</strong> ya está dado de baja de La carta
              de Corriente. No recibirás más envíos.
            </p>
          ) : (
            <>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Vas a dejar de recibir La carta de Corriente en{' '}
                <strong>{email}</strong>. Puedes volver a suscribirte desde el
                sitio cuando quieras.
              </p>
              {error && <p className="mt-4 text-xs font-bold text-primary">{error}</p>}
              <button
                onClick={confirmar}
                disabled={estado === 'procesando'}
                className="mt-6 border border-foreground px-4 py-2 text-xs font-semibold uppercase tracking-meta transition hover:bg-foreground hover:text-background disabled:opacity-50"
              >
                {estado === 'procesando' ? 'Un momento…' : 'Confirmar baja'}
              </button>
            </>
          )}
        </>
      )}

      {estado === 'confirmado' && (
        <>
          <h1 className="font-serif text-3xl font-bold tracking-[-0.04em]">
            Baja confirmada
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            El correo <strong>{email}</strong> ya no recibirá La carta de
            Corriente. Si cambias de opinión, puedes suscribirte de nuevo desde
            el home en cualquier momento.
          </p>
          <a
            href="/"
            className="mt-6 inline-block border border-foreground px-4 py-2 text-xs font-semibold uppercase tracking-meta transition hover:bg-foreground hover:text-background"
          >
            Volver al inicio
          </a>
        </>
      )}
    </section>
  )
}
