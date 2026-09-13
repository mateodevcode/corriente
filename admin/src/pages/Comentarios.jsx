// Moderación de comentarios: aprobar / rechazar / eliminar
import { useEffect, useState } from 'react'
import { api } from '../services/api'

const ETIQUETAS = { pendiente: 'Pendiente', aprobado: 'Aprobado', rechazado: 'Rechazado' }

export default function ComentariosPage() {
  const [comentarios, setComentarios] = useState([])
  const [estado, setEstado] = useState('pendiente')   // por defecto, los pendientes
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams()
    if (estado) params.set('estado', estado)
    api.get(`/comments?${params}`)
      .then((res) => setComentarios(res.data))
      .catch((err) => setError(err.message))
  }, [estado])

  const moderar = async (id, nuevoEstado) => {
    try {
      await api.patch(`/comments/${id}/moderar`, { estado_moderacion: nuevoEstado })
      setComentarios((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este comentario definitivamente?')) return
    try {
      await api.delete(`/comments/${id}`)
      setComentarios((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="p-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Comunidad</p>
      <h1 className="mt-2 font-serif text-3xl font-bold tracking-[-0.04em]">Moderación de comentarios</h1>

      {/* Filtro por estado */}
      <div className="mt-6 flex gap-3">
        {['pendiente', 'aprobado', 'rechazado', ''].map((valor) => (
          <button
            key={valor || 'todos'}
            onClick={() => setEstado(valor)}
            className={`border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${
              estado === valor
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            {valor ? ETIQUETAS[valor] : 'Todos'}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-primary">{error}</p>}

      {/* Lista de comentarios: tarjetas separadas por hairlines */}
      <div className="mt-6 border border-border bg-border [&>*+*]:border-t">
        {comentarios.map((c) => (
          <div key={c.id} className="bg-card p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em]">
                {c.usuario_nombre || c.user_id}
                <span className="ml-2 font-normal text-muted-foreground">
                  {c.fecha?.slice(0, 16).replace('T', ' ')}
                </span>
              </p>
              {/* Estado con color según moderación */}
              <span
                className={`px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${
                  c.estado_moderacion === 'pendiente'
                    ? 'bg-accent text-accent-foreground'
                    : c.estado_moderacion === 'aprobado'
                      ? 'bg-secondary text-secondary-foreground'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {ETIQUETAS[c.estado_moderacion]}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed">{c.contenido}</p>
            <div className="mt-4 flex gap-4">
              {c.estado_moderacion !== 'aprobado' && (
                <button onClick={() => moderar(c.id, 'aprobado')}
                  className="text-xs font-bold uppercase tracking-[0.12em] text-primary hover:underline">
                  Aprobar
                </button>
              )}
              {c.estado_moderacion !== 'rechazado' && (
                <button onClick={() => moderar(c.id, 'rechazado')}
                  className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground hover:text-primary">
                  Rechazar
                </button>
              )}
              <button onClick={() => eliminar(c.id)}
                className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground hover:text-primary">
                Eliminar
              </button>
            </div>
          </div>
        ))}
        {!comentarios.length && (
          <p className="bg-card px-4 py-8 text-center text-sm text-muted-foreground">
            No hay comentarios {estado ? ETIQUETAS[estado].toLowerCase() : ''}.
          </p>
        )}
      </div>
    </div>
  )
}
