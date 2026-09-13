// === sitemap.xml dinámico (endpoint) ===
// Incluye páginas estáticas + artículos publicados + secciones y autores (según la API).
// Devuelve XML puro (sin templates JSX).

import { api } from '../lib/api.js'
import { urlArticulo } from '../lib/formato.js'

export async function GET() {
  const site = 'https://corriente.com'

  // Páginas fijas del sitio
  const paginasFijas = [
    '', '/ultima-hora', '/busqueda',
    '/politica', '/tecnologia', '/economia-y-negocios', '/internacional-mundo',
    '/deportes', '/cultura-y-entretenimiento', '/ciencia-y-salud',
    '/opinion-editorial', '/sociedad', '/medio-ambiente', '/educacion',
  ]

  // Artículos publicados (si la API responde; si no, solo las fijas)
  const articulos = await api.articulos({ porPagina: 100 })

  const slugsAutores = [...new Set(
    articulos
      .map((a) => a.autor?.nombre_publico)
      .filter(Boolean)
      .map((n) => n
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-'))
  )]

  const urls = [
    ...paginasFijas,
    ...articulos.map((a) => urlArticulo(a)),
    ...slugsAutores.map((s) => `/autor/${s}`),
  ]

  const hoy = new Date().toISOString().slice(0, 10)
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(
      (u) =>
        `  <url><loc>${site}${u}</loc><lastmod>${hoy}</lastmod></url>`
    ),
    '</urlset>',
  ].join('\n')

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
