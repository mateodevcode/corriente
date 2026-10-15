import { eliminarImagen } from '../../../services/api'

export default function GaleriaBlock({ block, onChange }) {
  const d = block.data || {}
  const subidas = d.imagenes || []       // URLs S3 ya guardadas
  const locales = d._locals || []        // previews locales [{url}]
  const pendientes = d._files || []      // Files por subir al guardar
  const total = subidas.length + locales.length

  // Diferido: solo preview local, la subida ocurre en guardar() → cero huérfanas
  const onFiles = (files) => {
    const nuevos = [...(files || [])].slice(0, 6 - total)
    if (!nuevos.length) return
    onChange({ ...block, data: {
      ...d,
      _locals: [...locales, ...nuevos.map(f => ({ url: URL.createObjectURL(f) }))],
      _files: [...pendientes, ...nuevos],
    }})
  }
  const quitarSubida = async (idx) => {
    const url = subidas[idx]
    onChange({ ...block, data: { ...d, imagenes: subidas.filter((_, i) => i !== idx) } })
    if (url) try { await eliminarImagen(url) } catch {}
  }
  const quitarLocal = (idx) => {
    URL.revokeObjectURL(locales[idx].url)
    onChange({ ...block, data: {
      ...d,
      _locals: locales.filter((_, i) => i !== idx),
      _files: pendientes.filter((_, i) => i !== idx),
    }})
  }

  return (
    <div className="grid gap-2 border border-border bg-card p-3">
      <label className={`flex h-24 cursor-pointer items-center justify-center border border-dashed border-border text-xs text-muted-foreground hover:border-primary ${total >= 6 ? 'pointer-events-none opacity-40' : ''}`}>
        <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" multiple
          onChange={e => { onFiles([...(e.target.files || [])]); e.target.value = '' }} />
        {total >= 6 ? 'Máximo 6 fotos' : 'Click para subir fotos (máx 6)'}
      </label>
      {(!!subidas.length || !!locales.length) && (
        <div className="grid grid-cols-3 gap-1">
          {subidas.map((u, i) => (
            <div key={`s${i}`} className="relative">
              <img src={u} alt="" className="h-16 w-full object-cover" loading="lazy" />
              <button type="button" onClick={() => quitarSubida(i)} className="absolute right-0.5 top-0.5 bg-black/60 px-1 text-[10px] text-white">✕</button>
            </div>
          ))}
          {locales.map((l, i) => (
            <div key={`l${i}`} className="relative">
              <img src={l.url} alt="" className="h-16 w-full object-cover" loading="lazy" />
              <span className="absolute bottom-0.5 left-0.5 bg-black/60 px-1 text-[9px] uppercase text-white">Previa</span>
              <button type="button" onClick={() => quitarLocal(i)} className="absolute right-0.5 top-0.5 bg-black/60 px-1 text-[10px] text-white">✕</button>
            </div>
          ))}
        </div>
      )}
      {!!pendientes.length && <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{pendientes.length} foto(s) previa — se suben al guardar</p>}
      <label className="grid gap-1 text-xs">Epígrafe
        <input className="border border-border px-2 py-1" value={d.epigrafe || ''} onChange={e => onChange({ ...block, data: { ...d, epigrafe: e.target.value } })} />
      </label>
    </div>
  )
}
