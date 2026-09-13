// Layout principal del panel: sidebar con navegación por rol + cabecera
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

// Enlaces del menú según rol (mismo lenguaje visual del periódico: kickers uppercase)
const MENU = [
  { to: '/', label: 'Dashboard', roles: ['admin', 'editor'] },
  { to: '/articulos', label: 'Artículos', roles: ['admin', 'editor', 'escritor'] },
  { to: '/comentarios', label: 'Comentarios', roles: ['admin', 'editor'] },
  { to: '/suscriptores', label: 'Suscriptores', roles: ['admin', 'editor'] },
  { to: '/categorias', label: 'Secciones', roles: ['admin', 'editor'] },
  { to: '/usuarios', label: 'Usuarios', roles: ['admin'] },
]

export default function Layout() {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-border bg-card">
        <div className="border-b border-border px-6 py-6">
          {/* Logo del panel: mismo estilo serif del periódico */}
          <p className="font-serif text-2xl font-bold tracking-[-0.04em]">CORRIENTE</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Panel editorial
          </p>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {MENU.filter((item) => item.roles.includes(user?.rol)).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `px-3 py-2 text-sm transition ${
                  isActive
                    ? 'bg-primary font-bold text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        {/* Usuario actual + salir */}
        <div className="mt-auto border-t border-border p-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em]">{user?.nombre}</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            {user?.rol}
          </p>
          <button
            onClick={logout}
            className="mt-3 border border-foreground px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition hover:bg-foreground hover:text-background"
          >
            Salir
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <main className="flex-1 bg-background">
        <Outlet />
      </main>
    </div>
  )
}
