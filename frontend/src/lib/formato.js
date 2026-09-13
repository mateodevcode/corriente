// === Utilidades de formato para el frontend ===

// Fechas en español: "miércoles, 10 de septiembre de 2026"
export function fechaLarga(fecha) {
  if (!fecha) return ''
  return new Date(fecha).toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

// Fecha corta: "10 sept 2026"
export function fechaCorta(fecha) {
  if (!fecha) return ''
  return new Date(fecha).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

// Estimación de lectura: ~220 palabras/min
export function tiempoLectura(texto) {
  if (!texto) return '—'
  const palabras = texto.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length
  return `${Math.max(1, Math.round(palabras / 220))} min`
}

// Slug de autor: "Lucía Ferrer" -> "lucia-ferrer"
export function slugAutor(nombre) {
  return (nombre || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .toLowerCase().trim().replace(/[\s-]+/g, '-')
}

// URL canónica del artículo: /{seccion}/{slug}
// La API devuelve categoria expandida; sin categoría degrada a /articulo/{slug}.
export function urlArticulo(articulo) {
  const seccion = articulo?.categoria?.slug
  return seccion ? `/${seccion}/${articulo.slug}` : `/articulo/${articulo.slug}`
}
