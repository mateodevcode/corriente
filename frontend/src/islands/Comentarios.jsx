// === Island React: comentarios del artículo ===
// Hilo de comentarios aprobados (GET público) + sesión de lector inline
// (login o registro contra /auth) + formulario para usuarios autenticados.
// El lector nace con rol 'lector': solo comenta en el sitio, no entra al panel.

import { useEffect, useState } from 'react'

// URL de la API: variable de entorno inyectada por dev.mjs en desarrollo
const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'
const TOKEN_KEY = 'corriente_token'
const USER_KEY = 'corriente_user'

// --- Sesión del lector (localStorage; origen del sitio ≠ origen del panel) ---

function leerSesion() {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return null
    const user = JSON.parse(localStorage.getItem(USER_KEY) || 'null')
    return { token, user }
  } catch {
    return null
  }
}

function guardarSesion(sesion) {
  localStorage.setItem(TOKEN_KEY, sesion.token)
  localStorage.setItem(USER_KEY, JSON.stringify(sesion.user))
}

function cerrarSesion() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export default function Comentarios({ articuloId }) {
  const [comentarios, setComentarios] = useState([])
  const [contenido, setContenido] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(true)

  // Sesión del lector: null = visitante; { token, user } = autenticado
  const [sesion, setSesion] = useState(null)
  const [modoSesion, setModoSesion] = useState(null) // null | 'login' | 'registro'
  const [credenciales, setCredenciales] = useState({ email: '', nombre: '', password: '' })
  const [suscribirse, setSuscribirse] = useState(false)
  const [errorSesion, setErrorSesion] = useState('')
  const [enviandoSesion, setEnviandoSesion] = useState(false)

  // Carga sesión previa y los comentarios aprobados del artículo
  useEffect(() => {
    setSesion(leerSesion())
    fetch(`${API_URL}/comments/articulo/${articuloId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setComentarios)
      .catch(() => setComentarios([]))
      .finally(() => setCargando(false))
  }, [articuloId])

  const cambiarCredencial = (campo) => (e) =>
    setCredenciales((prev) => ({ ...prev, [campo]: e.target.value }))

  // Login o registro contra la API; guarda la sesión en localStorage
  const autenticar = async (e) => {
    e.preventDefault()
    setErrorSesion('')
    setEnviandoSesion(true)
    try {
      const ruta = modoSesion === 'registro' ? '/auth/registro' : '/auth/login'
      const cuerpo = modoSesion === 'registro'
        ? { ...credenciales, suscribirse }
        : { email: credenciales.email, password: credenciales.password }
      const res = await fetch(`${API_URL}${ruta}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(typeof data.detail === 'string' ? data.detail : 'No se pudo iniciar sesión')
      }
      const data = await res.json()
      const nueva = { token: data.access_token, user: data.user }
      guardarSesion(nueva)
      setSesion(nueva)
      setModoSesion(null)
    } catch (err) {
      setErrorSesion(err.message || 'No se pudo iniciar sesión')
    } finally {
      setEnviandoSesion(false)
    }
  }

  const salir = () => {
    cerrarSesion()
    setSesion(null)
    setModoSesion(null)
  }

  const publicar = async (e) => {
    e.preventDefault()
    setMensaje('')
    try {
      const res = await fetch(`${API_URL}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sesion.token}`,
        },
        body: JSON.stringify({ article_id: articuloId, contenido }),
      })
      if (!res.ok) throw new Error()
      setContenido('')
      setMensaje('¡Gracias! Tu comentario quedará pendiente de moderación.')
    } catch {
      setMensaje('No se pudo enviar el comentario.')
    }
  }

  // --- Vista: formulario inline de login/registro ---
  const renderFormularioSesion = () => (
    <div className="mt-6 border border-border bg-card p-4">
      <p className="text-xs font-bold uppercase tracking-meta text-muted-foreground">
        {modoSesion === 'registro' ? 'Crea tu cuenta de lector' : 'Inicia sesión para comentar'}
      </p>
      <form onSubmit={autenticar} className="mt-4 grid gap-4 sm:grid-cols-2">
        {modoSesion === 'registro' && (
          <input
            type="text"
            value={credenciales.nombre}
            onChange={cambiarCredencial('nombre')}
            required
            minLength={2}
            placeholder="Tu nombre"
            className="border border-border bg-background p-2 text-sm outline-none focus:border-primary"
          />
        )}
        <input
          type="email"
          value={credenciales.email}
          onChange={cambiarCredencial('email')}
          required
          placeholder="tu@email.com"
          className="border border-border bg-background p-2 text-sm outline-none focus:border-primary"
        />
        <input
          type="password"
          value={credenciales.password}
          onChange={cambiarCredencial('password')}
          required
          minLength={8}
          placeholder="Contraseña (mín. 8 caracteres)"
          className="border border-border bg-background p-2 text-sm outline-none focus:border-primary"
        />
        {modoSesion === 'registro' && (
          <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground sm:col-span-2">
            <input
              type="checkbox"
              checked={suscribirse}
              onChange={(e) => setSuscribirse(e.target.checked)}
              className="size-4 accent-primary"
            />
            Quiero recibir La carta de Corriente en mi correo
          </label>
        )}
        <button
          type="submit"
          disabled={enviandoSesion}
          className="border border-foreground px-4 py-2 text-xs font-semibold uppercase tracking-meta transition hover:bg-foreground hover:text-background disabled:opacity-50"
        >
          {enviandoSesion ? 'Un momento…' : modoSesion === 'registro' ? 'Crear cuenta' : 'Entrar'}
        </button>
      </form>
      {errorSesion && <p className="mt-3 text-xs font-bold text-primary">{errorSesion}</p>}
      <div className="mt-4 flex gap-4 border-t border-border pt-3">
        <button
          onClick={() => { setModoSesion(modoSesion === 'login' ? 'registro' : 'login'); setErrorSesion('') }}
          className="text-xs font-bold uppercase tracking-meta text-muted-foreground underline hover:text-foreground"
        >
          {modoSesion === 'registro' ? 'Ya tengo cuenta — iniciar sesión' : 'No tengo cuenta — registrarme'}
        </button>
        <button
          onClick={() => { setModoSesion(null); setErrorSesion('') }}
          className="text-xs font-bold uppercase tracking-meta text-muted-foreground hover:text-foreground"
        >
          Cancelar
        </button>
      </div>
    </div>
  )

  // --- Vista: barra de sesión + formulario de comentario ---
  const renderFormularioComentario = () => (
    <form onSubmit={publicar} className="mt-6">
      <div className="flex items-center justify-between gap-4 border-b border-border pb-2">
        <p className="text-xs font-bold uppercase tracking-meta text-muted-foreground">
          Comentando como <span className="text-foreground">{sesion.user?.nombre}</span>
        </p>
        <button
          type="button"
          onClick={salir}
          className="text-xs font-bold uppercase tracking-meta text-muted-foreground underline hover:text-primary"
        >
          Salir
        </button>
      </div>
      <textarea
        value={contenido}
        onChange={(e) => setContenido(e.target.value)}
        required
        minLength={2}
        rows={3}
        placeholder="Escribe un comentario…"
        className="mt-4 w-full border border-border bg-card p-3 text-sm outline-none focus:border-primary"
      />
      <button className="mt-3 border border-foreground px-4 py-2 text-xs font-semibold uppercase tracking-meta transition hover:bg-foreground hover:text-background">
        Publicar comentario
      </button>
      {mensaje && <p className="mt-3 text-xs font-bold text-primary">{mensaje}</p>}
    </form>
  )

  return (
    <div className="mt-6">
      {cargando ? (
        <p className="text-sm text-muted-foreground">Cargando comentarios…</p>
      ) : comentarios.length ? (
        <ul className="divide-y divide-border border-y border-border">
          {comentarios.map((c) => (
            <li key={c.id} className="bg-card px-4 py-4">
              <p className="text-xs font-bold uppercase tracking-meta text-muted-foreground">
                {c.usuario_nombre || 'Lector'} ·{' '}
                {c.fecha?.slice(0, 10)}
              </p>
              <p className="mt-2 text-sm leading-relaxed">{c.contenido}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          Sé el primero en comentar esta historia.
        </p>
      )}

      {/* Sesión + formulario: lector autenticado comenta; visitante entra/registra */}
      {sesion ? renderFormularioComentario() : modoSesion
        ? renderFormularioSesion()
        : (
          <button
            onClick={() => setModoSesion('login')}
            className="mt-6 border border-foreground px-4 py-2 text-xs font-semibold uppercase tracking-meta transition hover:bg-foreground hover:text-background"
          >
            Inicia sesión para comentar
          </button>
        )}
    </div>
  )
}
