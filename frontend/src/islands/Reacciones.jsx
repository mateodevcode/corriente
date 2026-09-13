// === Island React: botones de reacción y compartir ===
// Compartir nativo + copia de enlace + reacciones locales (sin backend todavía).

import { useState } from 'react'

// ruta: ruta canónica del artículo (ej: /politica/titulo-del-articulo)
export default function Reacciones({ ruta, titulo }) {
  const [reaccion, setReaccion] = useState(null)
  const [copiado, setCopiado] = useState(false)

  const reacciones = [
    { id: 'util', emoji: '⚡', label: 'Corriente' },
    { id: 'interesante', emoji: '💡', label: 'Interesante' },
    { id: 'preocupante', emoji: '🌪️', label: 'Preocupante' },
  ]

  const compartir = async () => {
    const url = `${window.location.origin}${ruta}`
    // Web Share API (móvil) o fallback a portapapeles
    if (navigator.share) {
      try {
        await navigator.share({ title: titulo, url })
        return
      } catch { /* usuario canceló */ }
    }
    await navigator.clipboard.writeText(url)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-border pt-6">
      {/* Reacciones */}
      {reacciones.map((r) => (
        <button
          key={r.id}
          onClick={() => setReaccion(reaccion === r.id ? null : r.id)}
          className={`border px-3 py-2 text-xs font-semibold uppercase tracking-meta transition ${
            reaccion === r.id
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border text-muted-foreground hover:bg-muted'
          }`}
        >
          {r.emoji} {r.label}
        </button>
      ))}
      {/* Compartir */}
      <button
        onClick={compartir}
        className="border border-foreground px-3 py-2 text-xs font-semibold uppercase tracking-meta transition hover:bg-foreground hover:text-background"
      >
        {copiado ? '¡Enlace copiado!' : 'Compartir'}
      </button>
    </div>
  )
}
