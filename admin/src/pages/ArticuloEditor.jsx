// Editor de artículo: crear/editar con WYSIWYG, portada vía S3 y flujo editorial
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, subirImagen, eliminarImagen } from '../services/api'
import EditorWysiwyg from '../components/EditorWysiwyg.jsx'
import { slugify } from '../lib/slugs'

// Estados del flujo editorial
const ESTADOS = [
  { valor: 'borrador', label: 'Borrador' },
  { valor: 'en_revision', label: 'En revisión' },
  { valor: 'publicado', label: 'Publicado' },
  { valor: 'programado', label: 'Programado' },
]

// Formulario en blanco
const VACIO = {
  titulo: '',
  slug: '',
  resumen: '',
  contenido: '',
  imagen_portada_url: '',
  estado: 'borrador',
  es_portada: false,
  fecha_publicacion: '',
  author_id: '',
  category_id: '',
  tags: [],
}

export default function ArticuloEditor() {
  const { id } = useParams()             // si hay id, es edición
  const navigate = useNavigate()
  const [form, setForm] = useState(VACIO)
  const [slugManual, setSlugManual] = useState(false) // si el usuario tocó el slug, no se pisa
  const [categorias, setCategorias] = useState([])
  const [autores, setAutores] = useState([])
  const [tagsTexto, setTagsTexto] = useState('')   // etiquetas separadas por coma
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [subiendo, setSubiendo] = useState(false)

  // Carga inicial: categorías + autores + artículo (si es edición)
  useEffect(() => {
    api.get('/categories').then((res) => setCategorias(res.data))
    // Nota: los autores se obtienen de los artículos existentes (endpoint mínimo);
    // el admin de ejemplo ya trae su perfil de autor creado por el seed.
    if (id) {
      api.get(`/articles/${id}`)
        .then((res) => {
          const a = res.data
          setForm({
            titulo: a.titulo, slug: a.slug, resumen: a.resumen || '',
            contenido: a.contenido || '', imagen_portada_url: a.imagen_portada_url || '',
            estado: a.estado, es_portada: !!a.es_portada,
            fecha_publicacion: a.fecha_publicacion?.slice(0, 10) || '',
            author_id: String(a.author_id), category_id: String(a.category_id),
            tags: a.tags || [],
          })
          setTagsTexto((a.tags || []).join(', '))
          if (a.slug) setSlugManual(true) // en edición no pisar el slug cargado
        })
        .catch((err) => setError(err.message))
    }
  }, [id])

  const setCampo = (campo, valor) => setForm((prev) => ({ ...prev, [campo]: valor }))

  const onSlugChange = (valor) => {
    setForm((prev) => ({ ...prev, slug: valor }))
    setSlugManual(valor !== '')
  }

  // Título -> slug automático (solo si el usuario no lo tocó a mano)
  const onTitulo = (valor) => {
    const auto = slugify(valor)
    setForm((prev) => ({
      ...prev,
      titulo: valor,
      slug: !slugManual ? auto : prev.slug,
    }))
  }

  // Subida de portada: presigned URL -> PUT directo a S3 (key con slug del título)
  const onPortada = async (archivo) => {
    setSubiendo(true)
    setError('')
    try {
      const tituloSlug = slugify(form.titulo) || slugify(form.slug)
      const url = await subirImagen(archivo, tituloSlug)
      setCampo('imagen_portada_url', url)
    } catch (err) {
      setError(`Error subiendo portada: ${err.message}`)
    } finally {
      setSubiendo(false)
    }
  }

  // Quitar portada: borra el archivo en S3 y limpia el campo
  const onQuitarPortada = async () => {
    const url = form.imagen_portada_url
    setCampo('imagen_portada_url', '')
    try {
      await eliminarImagen(url)
    } catch (err) {
      setError(`No se pudo borrar la imagen en S3: ${err.message}`)
    }
  }

  const guardar = async (e) => {
    e.preventDefault()
    if (subiendo) {
      setError('Espera a que termine de subir la imagen antes de guardar.')
      return
    }
    setGuardando(true)
    setError('')
    // Fecha: publicado debe verse ya; si es hoy o sin fecha, usa ahora (UTC)
    const hoyISO = new Date().toISOString().slice(0, 10)
    let fechaISO = null
    if (form.fecha_publicacion) {
      if (form.estado === 'publicado' && form.fecha_publicacion === hoyISO) {
        fechaISO = new Date().toISOString()
      } else {
        fechaISO = new Date(`${form.fecha_publicacion}T12:00:00Z`).toISOString()
      }
    } else if (form.estado === 'publicado') {
      fechaISO = new Date().toISOString()
    }
    // Cuerpo final: tags desde texto separado por comas
    const cuerpo = {
      ...form,
      author_id: Number(form.author_id) || 1,
      category_id: Number(form.category_id),
      fecha_publicacion: fechaISO,
      tags: tagsTexto.split(',').map((t) => t.trim()).filter(Boolean),
    }
    try {
      if (id) {
        await api.patch(`/articles/${id}`, cuerpo)
      } else {
        await api.post('/articles', cuerpo)
      }
      navigate('/articulos')
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  const inputClase =
    'w-full border-b-2 border-border bg-transparent pb-2 text-sm outline-none focus:border-primary'

  return (
    <form onSubmit={guardar} className="mx-auto max-w-4xl p-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
        {id ? 'Editando' : 'Nuevo artículo'}
      </p>

      {error && <p className="mt-4 border-l-2 border-primary bg-muted px-4 py-3 text-sm text-primary">{error}</p>}

      {/* Título: serif grande como el periódico */}
      <input
        value={form.titulo}
        onChange={(e) => onTitulo(e.target.value)}
        required
        placeholder="Titular del artículo"
        className="mt-4 w-full font-serif text-3xl font-bold tracking-[-0.03em] outline-none placeholder:text-muted-foreground"
      />

      {/* Fila: slug + estado + fecha */}
      <div className="mt-6 grid gap-6 sm:grid-cols-3">
        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Slug (URL)</span>
          <input value={form.slug} onChange={(e) => onSlugChange(e.target.value)} required
            className={inputClase} placeholder="titulo-en-url" />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Estado</span>
          <select value={form.estado} onChange={(e) => setCampo('estado', e.target.value)}
            className="w-full border border-border bg-card px-2 py-2 text-sm outline-none">
            {ESTADOS.map((s) => <option key={s.valor} value={s.valor}>{s.label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Fecha de publicación</span>
          <input type="date" value={form.fecha_publicacion}
            onChange={(e) => setCampo('fecha_publicacion', e.target.value)}
            className={inputClase} />
        </label>
      </div>

      {/* Fila: categoría + etiquetas */}
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Sección</span>
          <select value={form.category_id} onChange={(e) => setCampo('category_id', e.target.value)} required
            className="w-full border border-border bg-card px-2 py-2 text-sm outline-none">
            <option value="">Elegir sección…</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </label>
        <div className="flex items-end pb-2">
          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" checked={form.es_portada}
              onChange={(e) => setCampo('es_portada', e.target.checked)}
              className="size-4 accent-[#c84341]" />
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Portada del home (solo un artículo a la vez)
            </span>
          </label>
        </div>
      </div>

      {/* Etiquetas */}
      <label className="mt-6 block">
        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Etiquetas (separadas por coma)</span>
        <input value={tagsTexto} onChange={(e) => setTagsTexto(e.target.value)}
          className={inputClase} placeholder="clima, análisis, norte" />
      </label>

      {/* Resumen */}
      <label className="mt-6 block">
        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Resumen (bajada)</span>
        <textarea value={form.resumen} onChange={(e) => setCampo('resumen', e.target.value)} rows={2}
          className={`${inputClase} resize-none`} placeholder="Entrada del artículo para listados y SEO" />
      </label>

      {/* Portada: subida directa a S3 con preview (aspecto 3/2 del prototipo) */}
      <div className="mt-8">
        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Imagen de portada (S3)
        </span>
        {form.imagen_portada_url ? (
          <div className="flex items-start gap-4">
            <img src={form.imagen_portada_url} alt="Portada" className="aspect-[3/2] w-64 object-cover" />
            <button type="button" onClick={onQuitarPortada}
              className="text-xs font-bold uppercase tracking-[0.12em] text-primary hover:underline">
              Quitar
            </button>
          </div>
        ) : (
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            onChange={(e) => e.target.files[0] && onPortada(e.target.files[0])}
            className="text-sm text-muted-foreground" disabled={subiendo} />
        )}
        {subiendo && <p className="mt-2 text-xs text-muted-foreground">Subiendo a S3…</p>}
      </div>

      {/* Contenido WYSIWYG */}
      <div className="mt-8">
        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Contenido
        </span>
        <EditorWysiwyg value={form.contenido} onChange={(html) => setCampo('contenido', html)} />
      </div>

      {/* Acciones */}
      <div className="mt-8 flex gap-4">
        <button type="submit" disabled={guardando || subiendo}
          className="bg-primary px-6 py-3 text-xs font-bold uppercase tracking-[0.12em] text-primary-foreground transition hover:opacity-90 disabled:opacity-50">
          {subiendo ? 'Subiendo imagen…' : guardando ? 'Guardando…' : id ? 'Guardar cambios' : 'Crear artículo'}
        </button>
        <button type="button" onClick={() => navigate('/articulos')}
          className="border border-foreground px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] transition hover:bg-foreground hover:text-background">
          Cancelar
        </button>
      </div>
    </form>
  )
}
