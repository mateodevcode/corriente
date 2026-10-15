// Editor de artículo v2: bloques estructurados + vista previa
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, subirImagen, eliminarImagen } from '../services/api'
import BlockEditor from '../components/BlockEditor/BlockEditor'
import { nuevoBloque, bloquesDesdeContenido } from '../lib/blocks'
import { slugify } from '../lib/slugs'

const ESTADOS = [
  { valor: 'borrador', label: 'Borrador' },
  { valor: 'en_revision', label: 'En revisión' },
  { valor: 'publicado', label: 'Publicado' },
  { valor: 'programado', label: 'Programado' },
]

const VACIO = {
  titulo: '', slug: '', resumen: '', imagen_portada_url: '',
  estado: 'borrador', es_portada: false, fecha_publicacion: '',
  author_id: '', category_id: '', tags: [],
}

export default function ArticuloEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(VACIO)
  const [bloques, setBloques] = useState([nuevoBloque('parrafo')])
  const [slugManual, setSlugManual] = useState(false)
  const [categorias, setCategorias] = useState([])
  const [tagsTexto, setTagsTexto] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const [portadaLocal, setPortadaLocal] = useState(null) // preview instantáneo
  const [portadaFile, setPortadaFile] = useState(null) // se sube al guardar (evita huérfanas)

  useEffect(() => {
    api.get('/categories').then(res => setCategorias(res.data))
    if (id) {
      api.get(`/articles/${id}`).then(res => {
        const a = res.data
        setForm({
          titulo: a.titulo, slug: a.slug, resumen: a.resumen || '',
          imagen_portada_url: a.imagen_portada_url || '',
          estado: a.estado, es_portada: !!a.es_portada,
          fecha_publicacion: a.fecha_publicacion?.slice(0, 10) || '',
          author_id: String(a.author_id), category_id: String(a.category_id), tags: a.tags || [],
        })
        if (a.contenido_bloques?.length) setBloques(a.contenido_bloques)
        else setBloques(bloquesDesdeContenido(a.contenido))
        setTagsTexto((a.tags || []).join(', '))
        if (a.slug) setSlugManual(true)
      }).catch(err => setError(err.message))
    }
  }, [id])

  const setCampo = (campo, valor) => setForm(prev => ({ ...prev, [campo]: valor }))
  const onSlugChange = (valor) => { setForm(prev => ({ ...prev, slug: valor })); setSlugManual(valor !== '') }
  const onTitulo = (valor) => {
    const auto = slugify(valor)
    setForm(prev => ({ ...prev, titulo: valor, slug: !slugManual ? auto : prev.slug }))
  }
  // Solo preview local: la subida real ocurre en guardar() → cero huérfanas si cancelas
  const onPortada = (archivo) => {
    if (!archivo) return
    if (portadaLocal) URL.revokeObjectURL(portadaLocal)
    setPortadaLocal(URL.createObjectURL(archivo))
    setPortadaFile(archivo)
    setCampo('imagen_portada_url', '') // se rellena al guardar
  }
  const onQuitarPortada = async () => {
    const url = form.imagen_portada_url
    setCampo('imagen_portada_url', '')
    if (portadaLocal) URL.revokeObjectURL(portadaLocal)
    setPortadaLocal(null); setPortadaFile(null)
    if (!url) return // era solo preview local, nada que borrar en S3
    try { await eliminarImagen(url) } catch (err) { setError(`No se pudo borrar la imagen en S3: ${err.message}`) }
  }

  // Sube pendientes (portada + bloques con _file) y devuelve bloques limpios listos para la API
  const subirPendientes = async (tituloSlug) => {
    let portadaUrl = form.imagen_portada_url
    if (portadaFile) {
      portadaUrl = await subirImagen(portadaFile, tituloSlug)
    }
    const bloquesLimpios = []
    for (const b of bloques) {
      const d = { ...(b.data || {}) }
      const f = d._file
      if (f) {
        const url = await subirImagen(f, tituloSlug)
        delete d._file
        if (d._local) { URL.revokeObjectURL(d._local); delete d._local }
        if (b.tipo === 'imagen') d.url = url
        if (b.tipo === 'paso') d.imagen_url = url
      } else if (b.tipo === 'galeria' && d._files?.length) {
        const urls = [...(d.imagenes || [])]
        for (const file of d._files) urls.push(await subirImagen(file, tituloSlug))
        ;(d._locals || []).forEach(l => l.url && URL.revokeObjectURL(l.url))
        d.imagenes = urls.slice(0, 6)
        delete d._files; delete d._locals
      } else {
        delete d._file; delete d._local
      }
      bloquesLimpios.push({ ...b, data: d })
    }
    return { portadaUrl, bloquesLimpios }
  }

  const abrirPreview = () => {
    const payload = {
      titulo: form.titulo || 'Sin título',
      resumen: form.resumen,
      imagen_portada_url: form.imagen_portada_url,
      bloques,
      categoria_nombre: categorias.find(c => String(c.id) === String(form.category_id))?.nombre || '',
      fecha: form.fecha_publicacion || new Date().toISOString(),
    }
    // sessionStorage solo funciona mismo origen (prod OK, dev 5173->4321 NO), así que usamos postMessage + URL fallback
    try { sessionStorage.setItem('corriente_preview', JSON.stringify(payload)) } catch {}
    // En prod (Vite build) el frontend y el admin comparten origen https://corriente.seventwo.tech -> usar window.location.origin
    let base
    if (import.meta.env.PROD) {
      base = `${window.location.origin}/preview`
    } else {
      const frontUrl = import.meta.env.VITE_FRONTEND_URL || import.meta.env.PUBLIC_FRONTEND_URL || 'http://localhost:4321'
      base = frontUrl.includes('localhost') ? 'http://localhost:4321/preview' : `${frontUrl}/preview`
    }
    // fallback URL (base64 corto): si el payload es grande, el navegador puede truncar, pero postMessage lo cubre
    let url = base
    try {
      const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
      if (b64.length < 7000) url = `${base}?d=${encodeURIComponent(b64)}`
    } catch {}
    const win = window.open(url, '_blank')
    // postMessage para dev cross-port (5173 -> 4321)
    let tries = 0
    const send = () => {
      try { win?.postMessage({ type: 'corriente_preview', payload }, '*') } catch {}
      if (tries++ < 20 && win && !win.closed) setTimeout(send, 300)
    }
    setTimeout(send, 500)
  }

  const guardar = async (e) => {
    e.preventDefault()
    setGuardando(true); setError('')
    const tituloSlug = slugify(form.titulo) || slugify(form.slug) || 'articulo'
    // 1) Subir pendientes a S3 (portada + bloques); si cancelabas antes, nada se subía
    let portadaUrl = form.imagen_portada_url
    let bloquesLimpios = bloques
    try {
      setSubiendo(true)
      ;({ portadaUrl, bloquesLimpios } = await subirPendientes(tituloSlug))
    } catch (err) { setError(`Error subiendo imágenes: ${err.message}`); setGuardando(false); setSubiendo(false); return }
    setSubiendo(false)
    const hoyISO = new Date().toISOString().slice(0, 10)
    let fechaISO = null
    if (form.fecha_publicacion) {
      if (form.estado === 'publicado' && form.fecha_publicacion === hoyISO) fechaISO = new Date().toISOString()
      else fechaISO = new Date(`${form.fecha_publicacion}T12:00:00Z`).toISOString()
    } else if (form.estado === 'publicado') fechaISO = new Date().toISOString()

    const cuerpo = {
      ...form,
      imagen_portada_url: portadaUrl,
      contenido: undefined, // derivado del servidor
      contenido_bloques: bloquesLimpios,
      author_id: Number(form.author_id) || 1,
      category_id: Number(form.category_id),
      fecha_publicacion: fechaISO,
      tags: tagsTexto.split(',').map(t=>t.trim()).filter(Boolean),
    }
    try {
      if (id) await api.patch(`/articles/${id}`, cuerpo)
      else await api.post('/articles', cuerpo)
      navigate('/articulos')
    } catch (err) { setError(err.message) } finally { setGuardando(false) }
  }

  const inputClase = 'w-full border-b-2 border-border bg-transparent pb-2 text-sm outline-none focus:border-primary'

  return (
    <form onSubmit={guardar} className="mx-auto max-w-4xl p-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{id ? 'Editando' : 'Nuevo artículo'}</p>
      {error && <p className="mt-4 border-l-2 border-primary bg-muted px-4 py-3 text-sm text-primary">{error}</p>}

      <input value={form.titulo} onChange={e=>onTitulo(e.target.value)} required
        placeholder="Titular del artículo"
        className="mt-4 w-full font-serif text-3xl font-bold tracking-[-0.03em] outline-none placeholder:text-muted-foreground" />

      <div className="mt-6 grid gap-6 sm:grid-cols-3">
        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Slug (URL)</span>
          <input value={form.slug} onChange={e=>onSlugChange(e.target.value)} required className={inputClase} placeholder="titulo-en-url" />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Estado</span>
          <select value={form.estado} onChange={e=>setCampo('estado', e.target.value)} className="w-full border border-border bg-card px-2 py-2 text-sm outline-none">
            {ESTADOS.map(s=> <option key={s.valor} value={s.valor}>{s.label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Fecha de publicación</span>
          <input type="date" value={form.fecha_publicacion} onChange={e=>setCampo('fecha_publicacion', e.target.value)} className={inputClase} />
        </label>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Sección</span>
          <select value={form.category_id} onChange={e=>setCampo('category_id', e.target.value)} required
            className="w-full border border-border bg-card px-2 py-2 text-sm outline-none">
            <option value="">Elegir sección…</option>
            {categorias.map(c=> <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </label>
        <div className="flex items-end pb-2">
          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" checked={form.es_portada} onChange={e=>setCampo('es_portada', e.target.checked)} className="size-4 accent-[#c84341]" />
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Portada del home</span>
          </label>
        </div>
      </div>

      <label className="mt-6 block">
        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Etiquetas (separadas por coma)</span>
        <input value={tagsTexto} onChange={e=>setTagsTexto(e.target.value)} className={inputClase} placeholder="clima, análisis, norte" />
      </label>

      <label className="mt-6 block">
        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Resumen (bajada)</span>
        <textarea value={form.resumen} onChange={e=>setCampo('resumen', e.target.value)} rows={2} className={`${inputClase} resize-none`} placeholder="Entrada del artículo para listados y SEO" />
      </label>

      <div className="mt-8">
        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Imagen de portada — se sube al guardar</span>
        {(form.imagen_portada_url || portadaLocal) ? (
          <div className="flex items-start gap-4">
            <div className="relative">
              <img src={form.imagen_portada_url || portadaLocal} alt="Portada" className="aspect-[3/2] w-64 object-cover" />
              {portadaFile && <span className="absolute bottom-1 left-1 bg-black/60 px-1.5 py-0.5 text-[10px] uppercase text-white">Previa — se sube al guardar</span>}
            </div>
            <div className="grid gap-2">
              <button type="button" onClick={onQuitarPortada} className="text-xs font-bold uppercase tracking-[0.12em] text-primary hover:underline">Quitar</button>
              <label className="cursor-pointer text-xs text-muted-foreground hover:underline">Cambiar…
                <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                  onChange={e=> e.target.files[0] && onPortada(e.target.files[0])} />
              </label>
            </div>
          </div>
        ) : (
          <label className="flex h-40 w-64 cursor-pointer items-center justify-center border border-dashed border-border text-sm text-muted-foreground hover:border-primary">
            <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              onChange={e=> e.target.files[0] && onPortada(e.target.files[0])} />
            Subir portada
          </label>
        )}
      </div>

      <div className="mt-8">
        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Contenido por bloques — paso a paso</span>
        <p className="mb-3 text-xs text-muted-foreground">Añade párrafos, imágenes, pasos (imagen+texto), citas, listas. Arrastra para reordenar.</p>
        <BlockEditor bloques={bloques} onChange={setBloques} tituloSlug={slugify(form.titulo) || slugify(form.slug) || 'articulo'} />
      </div>

      <div className="mt-8 flex flex-wrap gap-4">
        <button type="submit" disabled={guardando || subiendo}
          className="bg-primary px-6 py-3 text-xs font-bold uppercase tracking-[0.12em] text-primary-foreground transition hover:opacity-90 disabled:opacity-50">
          {subiendo ? 'Subiendo imagen…' : guardando ? 'Guardando…' : id ? 'Guardar cambios' : 'Crear artículo'}
        </button>
        <button type="button" onClick={abrirPreview}
          className="border border-foreground px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] transition hover:bg-foreground hover:text-background">
          Vista previa
        </button>
        <button type="button" onClick={()=>navigate('/articulos')}
          className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground hover:underline">
          Cancelar
        </button>
      </div>
    </form>
  )
}
