import { useState } from 'react'
import { subirImagen, eliminarImagen } from '../../../services/api'

export default function PasoBlock({ block, onChange, tituloSlug, index }) {
  const d = block.data
  const [subiendo, setSubiendo] = useState(false)
  const onFile = async (f) => {
    setSubiendo(true)
    try {
      const url = await subirImagen(f, tituloSlug)
      onChange({ ...block, data: { ...d, imagen_url: url } })
    } catch {} finally { setSubiendo(false) }
  }
  const quitar = async () => {
    const url = d.imagen_url
    onChange({ ...block, data: { ...d, imagen_url: '' } })
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
          {d.imagen_url ? (
            <div>
              <img src={d.imagen_url} alt="" className="aspect-[4/3] w-full object-cover" />
              <button type="button" onClick={quitar} className="mt-1 text-xs text-primary hover:underline">Quitar</button>
            </div>
          ) : (
            <label className="flex aspect-[4/3] cursor-pointer items-center justify-center border border-dashed border-border text-xs">
              <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files[0] && onFile(e.target.files[0])} disabled={subiendo} />
              {subiendo ? 'Subiendo…' : 'Imagen del paso'}
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
