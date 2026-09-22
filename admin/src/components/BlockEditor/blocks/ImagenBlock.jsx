import { subirImagen, eliminarImagen } from '../../../services/api'
import { slugify } from '../../../lib/slugs'
import { useState } from 'react'

export default function ImagenBlock({ block, onChange, tituloSlug }) {
  const d = block.data
  const [subiendo, setSubiendo] = useState(false)
  const [err, setErr] = useState('')

  const onFile = async (f) => {
    setSubiendo(true); setErr('')
    try {
      const url = await subirImagen(f, tituloSlug)
      onChange({ ...block, data: { ...d, url } })
    } catch (e) { setErr(e.message) } finally { setSubiendo(false) }
  }
  const quitar = async () => {
    const url = d.url
    onChange({ ...block, data: { ...d, url: '' } })
    try { await eliminarImagen(url) } catch {}
  }

  return (
    <div className="border border-border bg-card p-3">
      <div className="flex gap-3">
        {d.url ? (
          <img src={d.url} alt={d.alt || ''} className="h-32 w-48 object-cover" />
        ) : (
          <label className="flex h-32 w-48 cursor-pointer items-center justify-center border border-dashed border-border text-xs text-muted-foreground">
            <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              onChange={e => e.target.files[0] && onFile(e.target.files[0])} disabled={subiendo} />
            {subiendo ? 'Subiendo…' : 'Subir imagen'}
          </label>
        )}
        <div className="flex-1 space-y-2">
          <input value={d.epigrafe || ''} onChange={e => onChange({...block, data:{...d, epigrafe: e.target.value}})}
            placeholder="Epígrafe (opcional)" className="w-full border-b border-border bg-transparent py-1 text-xs outline-none" />
          <input value={d.alt || ''} onChange={e => onChange({...block, data:{...d, alt: e.target.value}})}
            placeholder="Alt (SEO)" className="w-full border-b border-border bg-transparent py-1 text-xs outline-none" />
          <select value={d.posicion || 'full'} onChange={e => onChange({...block, data:{...d, posicion: e.target.value}})}
            className="border border-border bg-card px-2 py-1 text-xs">
            <option value="full">Ancho completo</option>
            <option value="half">Media columna</option>
          </select>
          {d.url && <button type="button" onClick={quitar} className="text-xs text-primary hover:underline">Quitar imagen</button>}
          {err && <p className="text-xs text-primary">{err}</p>}
        </div>
      </div>
    </div>
  )
}
