import { useEffect, useRef, useState } from 'react'

const TB = [
  { cmd: 'bold', label: 'B', title: 'Negrita (Ctrl+B)', cls: 'font-bold' },
  { cmd: 'italic', label: 'I', title: 'Cursiva (Ctrl+I)', cls: 'italic' },
  { cmd: 'underline', label: 'U', title: 'Subrayado (Ctrl+U)', cls: 'underline' },
]

function getSelectedAnchorHref() {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return ''
  let n = sel.anchorNode
  if (n?.nodeType === 3) n = n.parentElement
  const a = n?.closest?.('a')
  return a?.getAttribute('href') || ''
}

function normalizeUrl(url) {
  url = (url || '').trim()
  if (!url) return ''
  if (/^(https?:\/\/|mailto:|tel:|#)/i.test(url)) return url
  return `https://${url}`
}

export default function ParrafoBlock({ block, onChange }) {
  const ref = useRef(null)
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const savedRange = useRef(null)

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (block.data.html || '')) {
      ref.current.innerHTML = block.data.html || ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block.id])

  const save = () => onChange({ ...block, data: { ...block.data, html: ref.current.innerHTML } })

  // Pegar siempre como texto plano (evita fondos/colores/fuentes de Word/Google Docs)
  const onPaste = (e) => {
    e.preventDefault()
    const text = (e.clipboardData || window.clipboardData).getData('text/plain')
    if (!text) return
    document.execCommand('insertText', false, text)
    save()
  }

  const exec = (cmd) => {
    ref.current?.focus()
    document.execCommand(cmd, false, null)
    save()
  }

  const openLinkEditor = () => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      savedRange.current = sel.getRangeAt(0).cloneRange()
    } else {
      // sin selección: buscar anchor bajo el cursor para editarlo
      savedRange.current = null
    }
    setLinkUrl(getSelectedAnchorHref())
    setLinkOpen(true)
  }

  const applyLink = () => {
    const url = normalizeUrl(linkUrl)
    if (!url) return
    ref.current?.focus()
    if (savedRange.current) {
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(savedRange.current)
    }
    document.execCommand('createLink', false, url)
    // forzar target/rel en los links creados
    ref.current.querySelectorAll('a').forEach(a => {
      const href = a.getAttribute('href') || ''
      if (href.startsWith('http')) { a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener'); }
    })
    savedRange.current = null
    setLinkOpen(false)
    setLinkUrl('')
    save()
  }

  const removeLink = () => {
    ref.current?.focus()
    if (savedRange.current) {
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(savedRange.current)
    }
    document.execCommand('unlink', false, null)
    savedRange.current = null
    setLinkOpen(false)
    setLinkUrl('')
    save()
  }

  // Limpia el formato de la SELECCIÓN (o todo el bloque si no hay selección)
  const limpiarFormato = () => {
    const el = ref.current
    if (!el) return
    el.focus()
    const sel = window.getSelection()
    const haySeleccion = sel.rangeCount > 0 && !sel.isCollapsed &&
      el.contains(sel.anchorNode) && el.contains(sel.focusNode)
    if (haySeleccion) {
      // Solo lo seleccionado: quita B/I/U/colores/fondo/fuente, conserva links
      document.execCommand('removeFormat', false, null)
      document.execCommand('foreColor', false, 'inherit')
      document.execCommand('hiliteColor', false, 'transparent')
      document.execCommand('fontName', false, 'inherit')
      sel.removeAllRanges()
      save()
      return
    }
    // Sin selección: limpiar todo el bloque (incluye spans/divs pegados de Word/Docs)
    const range = document.createRange()
    range.selectNodeContents(el)
    sel.removeAllRanges()
    sel.addRange(range)
    document.execCommand('removeFormat', false, null)
    // 2) quitar atributos style/class y spans/font/divs que trae Word/Docs
    el.querySelectorAll('[style]').forEach(n => n.removeAttribute('style'))
    el.querySelectorAll('span,font').forEach(n => {
      if (!n.closest('a')) n.replaceWith(...n.childNodes)
    })
    el.querySelectorAll('div').forEach(n => {
      if (n !== el) { const p = document.createElement('p'); p.innerHTML = n.innerHTML; n.replaceWith(p) }
    })
    sel.removeAllRanges()
    save()
  }

  return (
    <div className="border border-border bg-card">
      <div className="flex flex-wrap items-center gap-1 border-b border-border p-1">
        {TB.map(b => (
          <button key={b.cmd} type="button" title={b.title} onMouseDown={e => e.preventDefault()} onClick={() => exec(b.cmd)}
            className={`min-w-7 border border-border px-1.5 py-0.5 text-xs hover:bg-muted ${b.cls || ''}`}>{b.label}</button>
        ))}
        <button type="button" title="Insertar link en el texto seleccionado" onMouseDown={e => e.preventDefault()} onClick={openLinkEditor}
          className="border border-border px-1.5 py-0.5 text-xs hover:bg-muted">🔗 Link</button>
        <button type="button" title="Quitar link" onMouseDown={e => e.preventDefault()} onClick={removeLink}
          className="border border-border px-1.5 py-0.5 text-xs hover:bg-muted">🔗✕</button>
        <button type="button" title="Limpiar formato pegado (quita fondos/colores/fuentes)" onMouseDown={e => e.preventDefault()} onClick={limpiarFormato}
          className="border border-border px-1.5 py-0.5 text-xs hover:bg-muted">🧹 Limpiar</button>
        <span className="ml-2 hidden text-[10px] uppercase tracking-widest text-muted-foreground sm:inline">Selecciona una palabra → 🔗 Link</span>
      </div>
      {linkOpen && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/50 p-2">
          <input autoFocus className="min-w-52 flex-1 border border-border px-2 py-1 font-mono text-xs"
            value={linkUrl} onChange={e => setLinkUrl(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') applyLink(); if (e.key === 'Escape') setLinkOpen(false) }}
            placeholder="https://seventwo.tech" />
          <button type="button" onClick={applyLink} className="bg-primary px-3 py-1 text-xs text-white">Aplicar</button>
          <button type="button" onClick={() => setLinkOpen(false)} className="border border-border px-2 py-1 text-xs">Cancelar</button>
        </div>
      )}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={save}
        onBlur={save}
        onPaste={onPaste}
        className="min-h-[90px] p-3 font-serif text-sm leading-relaxed outline-none [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-3 [&_blockquote]:italic"
        data-placeholder="Escribe el párrafo… selecciona una palabra y pulsa 🔗 Link"
      />
    </div>
  )
}
