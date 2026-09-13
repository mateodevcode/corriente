// Lista de artículos del panel: filtros por estado + acciones de edición
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext.jsx'

// Etiquetas legibles para cada estado editorial
const ETIQUETAS = {
  borrador: 'Borrador',
  en_revision: 'En revisión',
  publicado: 'Publicado',
  programado: 'Programado',
}

export default function ArticulosPage() {
  const { user } = useAuth()
  const [articulos, setArticulos] = useState([])
  const [estado, setEstado] = useState('')   // filtro por estado
  const [buscar, setBuscar] = useState('')   // búsqueda por texto
  const [error, setError] = useState('')

  // Carga la lista al montar y al cambiar filtros
  useEffect(() => {
    const params = new URLSearchParams()
    if (estado) params.set('estado', estado)
    if (buscar) params.set('buscar', buscar)
    api.get(`/articles?${params}`)
      .then((res) => setArticulos(res.data))
      .catch((err) => setError(err.message))
  }, [estado, buscar])

  const hacerPortada = async (id) => {
    try {
      const res = await api.put(`/articles/${id}/portada`)
      // Refleja el cambio en la lista sin recargar
      setArticulos((prev) => prev.map((a) => ({ ...a, es_portada: res.data.es_portada ? a.id === id : false })))
    } catch (err) {
      setError(err.message)
    }
  }

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este artículo?')) return
    try {
      await api.delete(`/articles/${id}`)
      setArticulos((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Editorial</p>
          <h1 className="mt-2 font-serif text-3xl font-bold tracking-[-0.04em]">Artículos</h1>
        </div>
        <Link
          to="/articulos/nuevo"
          className="border border-foreground px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition hover:bg-foreground hover:text-background"
        >
          + Nuevo artículo
        </Link>
      </div>

      {/* Filtros */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className="border border-border bg-card px-3 py-2 text-sm outline-none"
        >
          <option value="">Todos los estados</option>
          {Object.entries(ETIQUETAS).map(([valor, label]) => (
            <option key={valor} value={valor}>{label}</option>
          ))}
        </select>
        <input
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          placeholder="Buscar por título…"
          className="border-b-2 border-border bg-transparent px-1 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      {error && <p className="mt-4 text-sm text-primary">{error}</p>}

      {/* Tabla: filas separadas por hairlines, como el prototipo */}
      <div className="mt-6 border border-border bg-border [&>*+*]:border-t">
        {articulos.map((a) => (
          <div key={a.id} className="flex items-center justify-between gap-4 bg-card px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{a.titulo}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                {a.autor?.nombre_publico || `#${a.author_id}`} · {a.categoria?.nombre || `#${a.category_id}`}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span
                className={`px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${
                  a.estado === 'publicado'
                    ? 'bg-secondary text-secondary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {ETIQUETAS[a.estado] || a.estado}
              </span>
              {a.es_portada && (
                <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] bg-primary text-primary-foreground">
                  Portada
                </span>
              )}
              {!a.es_portada && user.rol !== 'escritor' && (
                <button
                  onClick={() => hacerPortada(a.id)}
                  className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground hover:text-primary"
                  title="Destacar este artículo como portada del home"
                >
                  Hacer portada
                </button>
              )}
              <Link
                to={`/articulos/${a.id}`}
                className="text-xs font-bold uppercase tracking-[0.12em] text-primary hover:underline"
              >
                Editar
              </Link>
              {/* Escritores solo eliminan sus artículos (el backend también lo valida) */}
              <button
                onClick={() => eliminar(a.id)}
                className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground hover:text-primary"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
        {!articulos.length && (
          <p className="bg-card px-4 py-8 text-center text-sm text-muted-foreground">
            No hay artículos con esos filtros.
          </p>
        )}
      </div>
      {user?.rol === 'escritor' && (
        <p className="mt-4 text-xs text-muted-foreground">
          Como escritor, solo ves y editas tus propios artículos.
        </p>
      )}
    </div>
  )
}
