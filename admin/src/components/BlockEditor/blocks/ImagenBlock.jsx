import { eliminarImagen } from '../../../services/api'
import { useState } from 'react'

export default function ImagenBlock({ block, onChange, tituloSlug }) {
  const d = block.data
  const [err, setErr] = useState('')
  const preview = d._local || d.url

  // Diferido: solo preview local, la subida ocurre en guardar() → cero huérfanas
  const onFile = (f) => {
    if (!f) return
    if (d._local) URL.revokeObjectURL(d._local)
    setErr('')
    onChange({ ...block, data: { ...d, url: '', _local: URL.createObjectURL(f), _file: f } })
  }
  const quitar = async () => {
    const url = d.url
    if (d._local) URL.revokeObjectURL(d._local)
    onChange({ ...block, data: { ...d, url: '', _local: null, _file: null } })
    if (!url) return
    try { await eliminarImagen(url) } catch {}
  }

  return (
    <div className="border border-border bg-card p-3">
      <div className="flex gap-3">
        {preview ? (
          <div className="relative">
            <img src={preview} alt={d.alt || ''} className="h-32 w-48 object-cover" />
            {d._file && <span className="absolute bottom-1 left-1 bg-black/60 px-1.5 py-0.5 text-[10px] uppercase text-white">Previa — se sube al guardar</span>}
          </div>
        ) : (
          <label className="flex h-32 w-48 cursor-pointer items-center justify-center border border-dashed border-border text-xs text-muted-foreground hover:border-primary">
            <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              onChange={e => e.target.files[0] && onFile(e.target.files[0])} />
            Subir imagen
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
          {preview && (
            <div className="flex gap-3">
              <button type="button" onClick={quitar} className="text-xs text-primary hover:underline">Quitar imagen</button>
              <label className="cursor-pointer text-xs text-muted-foreground hover:underline">Cambiar…
                <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                  onChange={e => e.target.files[0] && onFile(e.target.files[0])} />
              </label>
            </div>
          )}
          {err && <p className="text-xs text-primary">{err}</p>}
        </div>
      </div>
    </div>
  )
}
