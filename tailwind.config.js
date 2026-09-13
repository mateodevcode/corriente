/**
 * tailwind.config.js — Sistema de diseño centralizado de "Corriente".
 *
 * FUENTE: extraído del prototipo visual "corriente diseño/" (app/globals.css, app/page.tsx, app/layout.tsx).
 * Todos los valores de color provienen de las variables oklch() definidas en "corriente diseño/app/globals.css"
 * convertidas a hex. Estructura visual (líneas hairline, imágenes cuadradas, tipografía) extraída de
 * "corriente diseño/app/page.tsx".
 *
 * Este archivo es REUTILIZADO IDÉNTICAMENTE por:
 *   - frontend/ (periódico público, Astro)
 *   - admin/    (panel privado, Vite + React)
 * No duplicar tokens: cualquier cambio se hace aquí y se replica vía symlink o copia controlada.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,astro,html,ts}',
    './index.html',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // === Tokens de color (de "corriente diseño/app/globals.css" :root) ===
        background: '#f6f2e5',        // oklch(0.96 0.018 90) — crema cálido de fondo
        foreground: '#0a151e',        // oklch(0.19 0.025 245) — tinta azul oscuro (texto principal)
        card: '#fbf8f0',              // oklch(0.98 0.012 90) — superficie de tarjetas (más claro que el fondo)
        'card-foreground': '#0a151e', // oklch(0.19 0.025 245)
        popover: '#fbf8f0',           // oklch(0.98 0.012 90)
        'popover-foreground': '#0a151e',
        primary: '#c84341',           // oklch(0.57 0.17 25) — rojo terracota (kickers, botones, "En directo")
        'primary-foreground': '#fbf8f0', // oklch(0.98 0.012 90)
        secondary: '#d2dcc3',         // oklch(0.88 0.035 125) — verde salvia claro (bandas promocionales)
        'secondary-foreground': '#101f0d', // oklch(0.22 0.04 140)
        muted: '#e6e1d3',             // oklch(0.91 0.02 90) — gris cálido (placeholders de imagen, hovers)
        'muted-foreground': '#42525f', // oklch(0.43 0.03 245) — texto secundario (excerpt, metadatos)
        accent: '#d8b07e',            // oklch(0.78 0.08 72) — ocre/arena (acentos cálidos)
        'accent-foreground': '#0a151e',
        border: '#bfb7a6',            // oklch(0.78 0.025 85) — líneas hairline entre tarjetas y secciones
        input: '#bfb7a6',             // oklch(0.78 0.025 85)
        ring: '#c84341',              // oklch(0.57 0.17 25) — foco de teclado
      },
      fontFamily: {
        // De "corriente diseño/app/globals.css" @theme inline
        sans: ['Arial', 'Helvetica', 'sans-serif'],  // UI, kickers, metadatos
        serif: ['Georgia', 'Times New Roman', 'serif'], // Titulares de artículos y títulos de sección
      },
      borderRadius: {
        // De --radius: 0.2rem — esquinas casi rectas, estética "periódico impreso"
        none: '0',
        sm: 'calc(0.2rem * .6)', // 0.12rem — de --radius-sm
        DEFAULT: 'calc(0.2rem * .8)', // 0.16rem — de --radius-md
        md: 'calc(0.2rem * .8)',
        lg: '0.2rem',           // de --radius-lg = --radius
        xl: 'calc(0.2rem * 1.4)', // 0.28rem — de --radius-xl
      },
      letterSpacing: {
        // De "corriente diseño/app/page.tsx" — kickers y etiquetas uppercase
        kicker: '0.18em',   // tracking-[0.18em] en kickers ("LA SELECCIÓN")
        label: '0.14em',    // tracking-[0.14em] en barra "En directo"
        meta: '0.12em',    // tracking-[0.12em] en metadatos y botones ("APUNTArME →")
        navbar: '0.24em',  // tracking-[0.24em] en fecha del header
      },
      maxWidth: {
        page: '1440px', // max-w-[1440px] — ancho de página del prototipo
      },
      aspectRatio: {
        // De "corriente diseño/app/page.tsx" — proporciones de imagen del periódico
        '16/8': '16 / 8',  // imagen de portada destacada (aspect-[16/8])
        '3/2': '3 / 2',    // tarjetas de artículo (aspect-[1.5/1] = 3/2, "IMÁGENES CUADRADAS" compactas)
        '1/1': '1 / 1',    // avatares cuadrados de autores
      },
    },
  },
  plugins: [],
}
