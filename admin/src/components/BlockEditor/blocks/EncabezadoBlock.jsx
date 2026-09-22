export default function EncabezadoBlock({ block, onChange }) {
  const d = block.data
  return (
    <div className="flex items-center gap-2 border border-border bg-card p-2">
      <select value={d.nivel} onChange={e => onChange({...block, data:{...d, nivel: Number(e.target.value)}})}
        className="border border-border bg-card px-2 py-1 text-xs">
        <option value={2}>H2</option>
        <option value={3}>H3</option>
        <option value={4}>H4</option>
      </select>
      <input value={d.texto} onChange={e => onChange({...block, data:{...d, texto: e.target.value}})}
        placeholder="Título de sección"
        className="flex-1 border-b border-border bg-transparent px-2 py-1 font-serif text-lg font-bold outline-none" />
    </div>
  )
}
