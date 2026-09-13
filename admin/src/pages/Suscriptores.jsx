// Suscriptores del newsletter: lista + vista previa del correo de bienvenida
import { useEffect, useState } from 'react'
import { api } from '../services/api'

export default function SuscriptoresPage() {
  const [suscriptores, setSuscriptores] = useState(null)
  const [preview, setPreview] = useState(null)
  const [verPreview, setVerPreview] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/subscribers')
      .then((res) => setSuscriptores(res.data))
      .catch((err) => setError(err.message))
    api.get('/subscribers/email-preview')
      .then((res) => setPreview(res.data))
      .catch(() => setPreview(null))   // la preview es opcional
  }, [])

  const alternar = async (id) => {
    try {
      const res = await api.patch(`/subscribers/${id}/activo`)
      setSuscriptores((prev) => prev.map((s) => (s.id === id ? res.data : s)))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="p-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">La carta de Corriente</p>
      <div className="mt-2 flex items-end justify-between gap-4">
        <h1 className="font-serif text-3xl font-bold tracking-[-0.04em]">Suscriptores</h1>
        {preview && (
          <button
            onClick={() => setVerPreview((v) => !v)}
            className="border border-foreground px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition hover:bg-foreground hover:text-background"
          >
            {verPreview ? 'Ocultar correo' : 'Ver correo de bienvenida'}
          </button>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-primary">{error}</p>}

      {/* Vista previa del HTML que reciben los suscriptores */}
      {verPreview && preview && (
        <div className="mt-6 border border-border bg-card">
          <p className="border-b border-border px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
            {preview.asunto} · desde {preview.remitente}
          </p>
          <iframe
            title="Vista previa del correo de suscripción"
            srcDoc={preview.html}
            className="h-[560px] w-full"
          />
        </div>
      )}

      {/* Tabla de suscriptores: hairlines como en Comentarios */}
      <div className="mt-6 border border-border bg-border [&>*+*]:border-t">
        {suscriptores === null ? (
          <p className="bg-card p-4 text-sm text-muted-foreground">Cargando…</p>
        ) : suscriptores.length === 0 ? (
          <p className="bg-card p-4 text-sm text-muted-foreground">
            Aún no hay suscriptores. Cuando un lector se apunte desde el sitio aparecerá aquí.
          </p>
        ) : (
          suscriptores.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-4 bg-card p-4">
              <p className="truncate text-sm font-semibold">{s.email}</p>
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground">
                  {s.fecha?.slice(0, 16).replace('T', ' ')}
                </span>
                <span
                  className={`px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${
                    s.activo ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {s.activo ? 'Activo' : 'Baja'}
                </span>
                <button
                  onClick={() => alternar(s.id)}
                  className="border border-border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  {s.activo ? 'Dar de baja' : 'Reactivar'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
