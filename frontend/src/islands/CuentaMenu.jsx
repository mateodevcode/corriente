// === Island React: bloque de cuenta del menú móvil ===
// Muestra "Iniciar sesión" si no hay sesión, o el nombre/email del usuario
// y el acceso al panel si su rol es distinto al de lector.
import { useEffect, useState } from 'react'

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000'
const TOKEN_KEY = 'corriente_token'
const USER_KEY = 'corriente_user'

// En producción el panel vive bajo /admin/; en dev corre en el puerto de Vite.
const ADMIN_URL =
  import.meta.env.PUBLIC_ADMIN_URL ||
  (import.meta.env.PROD ? '/admin/' : 'http://localhost:5173/')
const LOGIN_URL = `${ADMIN_URL.replace(/\/$/, '')}/login`

const ROLES_PANEL = ['admin', 'editor', 'escritor']

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

export default function CuentaMenu() {
  const [sesion, setSesion] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let activo = true

    const cargar = async () => {
      const actual = leerSesion()
      if (!actual?.token) {
        if (activo) {
          setSesion(null)
          setCargando(false)
        }
        return
      }
      // Si ya tenemos los datos guardados, los usamos de inmediato
      if (actual.user) {
        if (activo) {
          setSesion(actual)
          setCargando(false)
        }
        return
      }
      // Sesión iniciada desde el panel: solo hay token, pedimos el usuario
      try {
        const res = await fetch(`${API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${actual.token}` },
        })
        if (!res.ok) throw new Error()
        const user = await res.json()
        localStorage.setItem(USER_KEY, JSON.stringify(user))
        if (activo) setSesion({ token: actual.token, user })
      } catch {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        if (activo) setSesion(null)
      } finally {
        if (activo) setCargando(false)
      }
    }

    cargar()

    // Sincroniza entre pestañas y al volver a la pestaña
    const alCambiar = (e) => {
      if (!e.key || e.key === TOKEN_KEY || e.key === USER_KEY) cargar()
    }
    window.addEventListener('storage', alCambiar)
    window.addEventListener('focus', cargar)
    window.addEventListener('corriente-sesion-cambiada', cargar)
    return () => {
      activo = false
      window.removeEventListener('storage', alCambiar)
      window.removeEventListener('focus', cargar)
      window.removeEventListener('corriente-sesion-cambiada', cargar)
    }
  }, [])

  const salir = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setSesion(null)
    window.dispatchEvent(new Event('corriente-sesion-cambiada'))
  }

  if (cargando) {
    return (
      <p className="border-b border-border py-3 text-xs uppercase tracking-meta text-muted-foreground">
        Cargando cuenta…
      </p>
    )
  }

  // Sin sesión: acceso al login del panel (los lectores vuelven al sitio)
  if (!sesion) {
    return (
      <a
        href={LOGIN_URL}
        className="mt-2 border border-foreground px-3 py-2 text-center text-xs font-bold uppercase tracking-meta transition hover:bg-foreground hover:text-background"
      >
        Iniciar sesión →
      </a>
    )
  }

  const user = sesion.user || {}
  const esPersonal = ROLES_PANEL.includes(user.rol)

  return (
    <div className="mt-2 border border-border bg-background p-3">
      <p className="text-[10px] font-bold uppercase tracking-meta text-muted-foreground">
        Sesión iniciada
      </p>
      <p className="mt-1 truncate text-sm font-bold">{user.nombre || user.email}</p>
      {user.email && user.nombre && (
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
      )}
      <p className="mt-1 text-[10px] uppercase tracking-meta text-muted-foreground">
        {user.rol}
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {esPersonal && (
          <a
            href={ADMIN_URL}
            className="border border-foreground px-3 py-2 text-center text-xs font-bold uppercase tracking-meta transition hover:bg-foreground hover:text-background"
          >
            Ir al panel →
          </a>
        )}
        <button
          type="button"
          onClick={salir}
          className="text-xs font-bold uppercase tracking-meta text-muted-foreground underline hover:text-primary"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
