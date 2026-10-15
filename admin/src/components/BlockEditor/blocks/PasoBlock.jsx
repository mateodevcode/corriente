import { eliminarImagen } from '../../../services/api'

export default function PasoBlock({ block, onChange, tituloSlug, index }) {
  const d = block.data
  const preview = d._local || d.imagen_url
  // Diferido: solo preview local, la subida ocurre en guardar()
  const onFile = (f) => {
    if (!f) return
    if (d._local) URL.revokeObjectURL(d._local)
    onChange({ ...block, data: { ...d, imagen_url: '', _local: URL.createObjectURL(f), _file: f } })
  }
  const quitar = async () => {
    const url = d.imagen_url
    if (d._local) URL.revokeObjectURL(d._local)
    onChange({ ...block, data: { ...d, imagen_url: '', _local: null, _file: null } })
    if (!url) return
    try { await eliminarImagen(url) } catch {}
  }
  return (
    <div className="border-l-2 border-primary bg-card p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="bg-primary px-2 py-1 text-[10px] font-bold uppercase text-white">Paso {index + 1}</span>
        <input value={d.titulo_paso || ''} onChange={e => onChange({...block, data:{...d, titulo_paso: e.target.value}})}
          placeholder="Título del paso (opcional)" className="flex-1 border-b border-border bg-transparent py-1 text-sm font-semibold outline-none" />
        <input type="number" value={d.numero || index+1} onChange={e => onChange({...block, data:{...d, numero: Number(e.target.value)}})}
          className="w-14 border border-border bg-card px-2 py-1 text-xs" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          {(preview) ? (
            <div>
              <div className="relative">
                <img src={preview} alt="" className="aspect-[4/3] w-full object-cover" />
                {d._file && <span className="absolute bottom-1 left-1 bg-black/60 px-1.5 py-0.5 text-[10px] uppercase text-white">Previa — se sube al guardar</span>}
              </div>
              <div className="mt-1 flex gap-3">
                <button type="button" onClick={quitar} className="text-xs text-primary hover:underline">Quitar</button>
                <label className="cursor-pointer text-xs text-muted-foreground hover:underline">Cambiar…
                  <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files[0] && onFile(e.target.files[0])} />
                </label>
              </div>
            </div>
          ) : (
            <label className="flex aspect-[4/3] cursor-pointer items-center justify-center border border-dashed border-border text-xs">
              <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files[0] && onFile(e.target.files[0])} />
              Imagen del paso
            </label>
          )}
        </div>
        <textarea value={d.texto || ''} onChange={e => onChange({...block, data:{...d, texto: e.target.value}})}
          placeholder="Texto explicativo del paso… (admite HTML simple)" rows={5}
          className="w-full border border-border bg-card p-2 font-serif text-sm outline-none" />
      </div>
    </div>
  )
}
