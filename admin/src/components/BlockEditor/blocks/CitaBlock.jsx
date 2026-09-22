export default function CitaBlock({ block, onChange }) {
  const d = block.data
  return (
    <div className="border-l-2 border-primary bg-muted p-3 pl-4">
      <textarea value={d.texto || ''} onChange={e => onChange({...block, data:{...d, texto: e.target.value}})}
        placeholder="Texto de la cita" rows={2} className="w-full bg-transparent font-serif italic outline-none" />
      <input value={d.autor || ''} onChange={e => onChange({...block, data:{...d, autor: e.target.value}})}
        placeholder="Autor (opcional)" className="mt-2 w-full border-b border-border bg-transparent py-1 text-xs outline-none" />
    </div>
  )
}
