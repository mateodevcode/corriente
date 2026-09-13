// Gestión de categorías/secciones: crear, editar principal, eliminar
import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { slugify } from '../lib/slugs'

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState([])
  const [nombre, setNombre] = useState('')
  const [esPrincipal, setEsPrincipal] = useState(false)
  const [error, setError] = useState('')

  const cargar = () => {
    api.get('/categories')
      .then((res) => setCategorias(res.data))
      .catch((err) => setError(err.message))
  }

  useEffect(cargar, [])

  const crear = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/categories', {
        nombre,
        slug: slugify(nombre),
        es_principal: esPrincipal,
      })
      setNombre('')
      setEsPrincipal(false)
      cargar()
    } catch (err) {
      setError(err.message)
    }
  }

  const alternarPrincipal = async (c) => {
    try {
      await api.patch(`/categories/${c.id}`, { es_principal: !c.es_principal })
      cargar()
    } catch (err) {
      setError(err.message)
    }
  }

  const eliminar = async (c) => {
    if (!window.confirm(`¿Eliminar la sección "${c.nombre}"?`)) return
    try {
      await api.delete(`/categories/${c.id}`)
      cargar()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="p-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Estructura</p>
      <h1 className="mt-2 font-serif text-3xl font-bold tracking-[-0.04em]">Secciones</h1>

      {error && <p className="mt-4 text-sm text-primary">{error}</p>}

      {/* Formulario de creación */}
      <form onSubmit={crear} className="mt-6 flex max-w-xl flex-wrap items-end gap-4">
        <label className="min-w-52 flex-1">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Nueva sección
          </span>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} required
            placeholder="Nombre de la sección"
            className="w-full border-b-2 border-border bg-transparent pb-2 text-sm outline-none focus:border-primary" />
        </label>
        <label className="flex items-center gap-2 pb-2 text-xs uppercase tracking-[0.12em] text-muted-foreground">
          <input type="checkbox" checked={esPrincipal} onChange={(e) => setEsPrincipal(e.target.checked)} />
          Principal
        </label>
        <button type="submit"
          className="border border-foreground px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition hover:bg-foreground hover:text-background">
          Añadir
        </button>
      </form>

      {/* Lista: hairlines entre filas, marca las principales */}
      <div className="mt-8 max-w-2xl border border-border bg-border [&>*+*]:border-t">
        {categorias.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-4 bg-card px-4 py-3">
            <div>
              <p className="text-sm font-bold">
                {c.nombre}
                {c.es_principal && (
                  <span className="ml-2 bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-primary-foreground">
                    Principal
                  </span>
                )}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">/{c.slug}</p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => alternarPrincipal(c)}
                className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground hover:text-primary">
                {c.es_principal ? 'Quitar principal' : 'Hacer principal'}
              </button>
              <button onClick={() => eliminar(c)}
                className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground hover:text-primary">
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 max-w-2xl text-xs text-muted-foreground">
        Nota: "Última Hora" no es una sección, es el feed cronológico transversal del sitio público.
      </p>
    </div>
  )
}
