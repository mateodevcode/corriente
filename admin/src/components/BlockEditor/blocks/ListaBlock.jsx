export default function ListaBlock({ block, onChange }) {
  const d = block.data
  const setItem = (i, v) => {
    const items = [...(d.items||[])]
    items[i]=v
    onChange({...block, data:{...d, items}})
  }
  return (
    <div className="border border-border bg-card p-3">
      <div className="mb-2 flex gap-2">
        <select value={d.estilo} onChange={e => onChange({...block, data:{...d, estilo: e.target.value}})}
          className="border border-border bg-card px-2 py-1 text-xs">
          <option value="ul">Viñetas</option>
          <option value="ol">Numerada</option>
        </select>
        <button type="button" onClick={() => onChange({...block, data:{...d, items:[...(d.items||[]), '']}})}
          className="border border-border px-2 py-1 text-xs">+ Ítem</button>
      </div>
      {(d.items||[]).map((it,i)=>(
        <div key={i} className="mb-1 flex gap-2">
          <input value={it} onChange={e=>setItem(i,e.target.value)}
            placeholder={`Ítem ${i+1}`} className="flex-1 border-b border-border bg-transparent py-1 text-sm outline-none" />
          <button type="button" onClick={()=>{
            const items=[...(d.items||[])]; items.splice(i,1); onChange({...block, data:{...d, items}})
          }} className="text-xs text-primary">✕</button>
        </div>
      ))}
    </div>
  )
}
