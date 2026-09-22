// Render bloques → HTML (mirror de backend/app/utils/bloques.py)
export function bloquesAHtml(bloques) {
  if (!bloques?.length) return ''
  return bloques.map(b => {
    const d = b.data || {}
    if (b.tipo === 'parrafo') return d.html || ''
    if (b.tipo === 'encabezado') {
      const n = [2,3,4].includes(d.nivel) ? d.nivel : 2
      const esc = (s) => (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      return `<h${n}>${esc(d.texto)}</h${n}>`
    }
    if (b.tipo === 'imagen') {
      if (!d.url) return ''
      const epi = d.epigrafe ? `<figcaption>${d.epigrafe}</figcaption>` : ''
      const cls = d.posicion === 'half' ? 'half' : 'full'
      return `<figure class="bloque-imagen bloque-imagen--${cls}"><img src="${d.url}" alt="${d.alt||''}" loading="lazy" />${epi}</figure>`
    }
    if (b.tipo === 'paso') {
      const img = d.imagen_url ? `<img src="${d.imagen_url}" alt="" loading="lazy" />` : ''
      const head = `${d.numero ? `<div class="paso-numero">Paso ${d.numero}</div>` : ''}${d.titulo_paso ? `<h4 class="paso-titulo">${d.titulo_paso}</h4>` : ''}`
      const texto = d.texto || ''
      return `<div class="bloque-paso">${head}<div class="paso-grid">${img}<div class="paso-texto">${texto}</div></div></div>`
    }
    if (b.tipo === 'cita') {
      const cite = d.autor ? `<cite>— ${d.autor}</cite>` : ''
      return `<blockquote>${d.texto||''}${cite}</blockquote>`
    }
    if (b.tipo === 'lista') {
      const tag = d.estilo === 'ol' ? 'ol' : 'ul'
      const lis = (d.items||[]).filter(Boolean).map(i=>`<li>${i}</li>`).join('')
      return `<${tag}>${lis}</${tag}>`
    }
    if (b.tipo === 'separador') return '<hr />'
    return ''
  }).join('\n')
}

export function tiempoLecturaBloques(bloques, fallbackHtml) {
  const html = bloques?.length ? bloquesAHtml(bloques) : (fallbackHtml || '')
  if (!html) return '—'
  const palabras = html.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length
  return `${Math.max(1, Math.round(palabras / 220))} min`
}
