export default function BotonBlock({ block, onChange }) {
  const d = block.data || {}
  const set = (k, v) => onChange({ ...block, data: { ...d, [k]: v } })
  return (
    <div className="flex flex-wrap items-end gap-2 border border-border bg-card p-3">
      <label className="grid gap-1 text-xs">Texto<input className="border border-border px-2 py-1" value={d.texto||''} onChange={e=>set('texto',e.target.value)} placeholder="Leer más" /></label>
      <label className="grid gap-1 text-xs">URL<input className="border border-border px-2 py-1" value={d.url||''} onChange={e=>set('url',e.target.value)} placeholder="https://…" /></label>
      <label className="grid gap-1 text-xs">Estilo
        <select className="border border-border px-2 py-1" value={d.estilo||'primario'} onChange={e=>set('estilo',e.target.value)}>
          <option value="primario">Primario</option>
          <option value="secundario">Secundario</option>
        </select>
      </label>
    </div>
  )
}
