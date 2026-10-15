export default function TablaBlock({ block, onChange }) {
  const d = block.data || {}
  const heads = d.encabezados || []
  const rows = d.filas || []
  const set = (patch) => onChange({ ...block, data: { encabezados: heads, filas: rows, ...patch } })
  return (
    <div className="grid gap-2 border border-border bg-card p-3 text-xs">
      <label className="grid gap-1">Encabezados (coma)
        <input className="border border-border px-2 py-1" value={heads.join(', ')} onChange={e=>set({ encabezados: e.target.value.split(',').map(s=>s.trim()) })} />
      </label>
      <label className="grid gap-1">Filas (una por línea, celdas con |)
        <textarea className="min-h-[60px] border border-border p-2 font-mono" value={rows.map(r=>r.join(' | ')).join('\n')}
          onChange={e=>set({ filas: e.target.value.split('\n').map(l=>l.split('|').map(s=>s.trim())) })} />
      </label>
    </div>
  )
}
