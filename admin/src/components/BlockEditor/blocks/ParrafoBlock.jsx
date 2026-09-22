import { useEffect, useRef } from 'react'

const TB = [
  { cmd: 'bold', label: 'B', title:'Negrita', cls:'font-bold' },
  { cmd: 'italic', label: 'I', title:'Cursiva', cls:'italic' },
  { cmd: 'underline', label: 'U', title:'Subrayado', cls:'underline' },
  { cmd: 'createLink', label: '🔗', title:'Link' },
]

export default function ParrafoBlock({ block, onChange }) {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (block.data.html || '')) {
      ref.current.innerHTML = block.data.html || ''
    }
  }, [block.id])

  const exec = (cmd) => {
    ref.current?.focus()
    if (cmd === 'createLink') {
      const url = prompt('URL del link:')
      if (!url) return
      document.execCommand('createLink', false, url)
    } else {
      document.execCommand(cmd, false, null)
    }
    onChange({ ...block, data: { ...block.data, html: ref.current.innerHTML } })
  }

  return (
    <div className="border border-border bg-card">
      <div className="flex flex-wrap gap-1 border-b border-border p-1">
        {TB.map(b => (
          <button key={b.cmd} type="button" title={b.title} onClick={() => exec(b.cmd)}
            className={`min-w-7 border border-border px-1.5 py-0.5 text-xs hover:bg-muted ${b.cls||''}`}>{b.label}</button>
        ))}
        <span className="ml-2 text-[10px] uppercase tracking-widest text-muted-foreground">Párrafo — usa B/I/U/link</span>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange({ ...block, data: { ...block.data, html: ref.current.innerHTML } })}
        onBlur={() => onChange({ ...block, data: { ...block.data, html: ref.current.innerHTML } })}
        className="min-h-[90px] p-3 font-serif text-sm leading-relaxed outline-none [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-3 [&_blockquote]:italic"
        data-placeholder="Escribe el párrafo…"
      />
    </div>
  )
}
