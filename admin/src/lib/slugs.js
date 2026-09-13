// Slugify en JS (misma lógica que el backend: sin acentos, guiones)
export function slugify(texto) {
  if (!texto) return ''
  return texto
    .normalize('NFD')                          // separa diacríticos (á -> a+´)
    .replace(/[\u0300-\u036f]/g, '')           // elimina los diacríticos
    .replace(/[^a-zA-Z0-9\s-]/g, '')           // solo alfanuméricos, elimina puntos y rarezas
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, '-')                   // espacios -> guiones colapsados
    .replace(/^-+|-+$/g, '')                   // sin guiones al inicio/final
    .slice(0, 330)                             // límite del backend (Article.slug 330)
}
