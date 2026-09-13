// === Cliente de la API para el frontend público (Astro SSR/build) ===
// Lee la URL del backend desde variables de entorno (replicable entre proyectos).
// En dev, dev.mjs inyecta PUBLIC_API_URL con el puerto real de la API.

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'

// Fetch con manejo de errores: ante cualquier fallo (red caída, 500) devuelve
// lista vacía para que el sitio degrada con gracia en el build sin backend.
async function pedir(ruta, params = {}) {
  const url = new URL(`${API_URL}${ruta}`)
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v)
  }
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []   // sin conexión al backend: páginas vacías pero funcionales
  }
}

export const api = {
  // Artículos publicados (home, secciones, Última Hora, búsqueda)
  articulos: ({ categoria, buscar, pagina = 1, porPagina = 12 } = {}) =>
    pedir('/articles/publicados', {
      categoria_slug: categoria, buscar, pagina, por_pagina: porPagina,
    }),
  // Detalle de artículo por slug
  articulo: (slug) => pedir(`/articles/publicados/${slug}`),
  // Artículos de un autor (perfil público)
  porAutor: (slug) => pedir(`/articles/publicados/autor/${slug}`),
  // Categorías/secciones
  categorias: () => pedir('/categories'),
}
