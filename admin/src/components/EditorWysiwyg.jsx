// Editor WYSIWYG ligero con contentEditable (sin librerías externas, JS puro)
// Barra de herramientas con document.execCommand (formatos básicos del periódico)
import { useEffect, useRef } from 'react'

// Botones de la barra: comando execCommand + etiqueta visible
const BOTONES = [
  { cmd: 'bold', label: 'B', titulo: 'Negrita', estilo: 'font-bold' },
  { cmd: 'italic', label: 'I', titulo: 'Cursiva', estilo: 'italic' },
  { cmd: 'underline', label: 'U', titulo: 'Subrayado', estilo: 'underline' },
  { cmd: 'formatBlock:<h2>', label: 'H2', titulo: 'Título de sección' },
  { cmd: 'formatBlock:<h3>', label: 'H3', titulo: 'Subtítulo' },
  { cmd: 'formatBlock:<blockquote>', label: '❝', titulo: 'Cita' },
  { cmd: 'insertUnorderedList', label: '• Lista', titulo: 'Lista con viñetas' },
  { cmd: 'formatBlock:<p>', label: 'P', titulo: 'Párrafo normal' },
  { cmd: 'removeFormat', label: '✕', titulo: 'Quitar formato' },
]

export default function EditorWysiwyg({ value, onChange }) {
  const ref = useRef(null)

  // Solo sincroniza el DOM si el HTML externo cambia (evita perder el cursor)
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || ''
    }
  }, [value])

  // Ejecuta un comando de formato sobre la selección actual
  const ejecutar = (cmd) => {
    ref.current?.focus()
    const [comando, bloque] = cmd.split(':')
    if (bloque) {
      document.execCommand('formatBlock', false, bloque)
    } else {
      document.execCommand(comando, false, null)
    }
    onChange(ref.current?.innerHTML || '')
  }

  return (
    <div className="border border-border bg-card">
      {/* Barra de herramientas */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border p-2">
        {BOTONES.map((b) => (
          <button
            key={b.cmd}
            type="button"
            title={b.titulo}
            onClick={() => ejecutar(b.cmd)}
            className={`min-w-8 border border-border px-2 py-1 text-xs transition hover:bg-muted ${b.estilo || ''}`}
          >
            {b.label}
          </button>
        ))}
      </div>
      {/* Área editable: tipografía serif como el periódico */}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(ref.current?.innerHTML || '')}
        onBlur={() => onChange(ref.current?.innerHTML || '')}
        className="min-h-64 max-w-none p-4 font-serif text-base leading-relaxed outline-none [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-[-0.03em] [&_h3]:text-xl [&_h3]:font-bold [&_li]:list-disc [&_li]:pl-5 [&_p]:mb-3"
      />
    </div>
  )
}
