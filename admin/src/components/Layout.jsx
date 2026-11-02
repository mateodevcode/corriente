// Layout principal del panel: sidebar con navegación por rol + cabecera
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

// Enlaces del menú según rol (mismo lenguaje visual del periódico: kickers uppercase)
const MENU = [
  { to: '/', label: 'Dashboard', roles: ['admin', 'editor', 'escritor'] },
  { to: '/articulos', label: 'Artículos', roles: ['admin', 'editor', 'escritor'] },
  { to: '/comentarios', label: 'Comentarios', roles: ['admin', 'editor', 'escritor'] },
  { to: '/suscriptores', label: 'Suscriptores', roles: ['admin', 'editor'] },
  { to: '/categorias', label: 'Secciones', roles: ['admin', 'editor'] },
  { to: '/usuarios', label: 'Usuarios', roles: ['admin'] },
  { to: '/perfil', label: 'Mi perfil', roles: ['admin', 'editor', 'escritor'] },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const cerrarMenu = () => setMenuAbierto(false)

  return (
    <div className="flex min-h-screen">
      {/* Cabecera móvil: hamburguesa + marca */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-4 md:hidden">
        <button
          type="button"
          onClick={() => setMenuAbierto(true)}
          aria-label="Abrir menú"
          aria-expanded={menuAbierto}
          className="flex h-9 w-9 items-center justify-center border border-border text-lg"
        >
          ☰
        </button>
        <p className="font-serif text-lg font-bold tracking-[-0.04em]">CORRIENTE</p>
        <button
          onClick={logout}
          className="border border-foreground px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] transition hover:bg-foreground hover:text-background"
        >
          Salir
        </button>
      </header>

      {/* Fondo oscuro del drawer en móvil */}
      {menuAbierto && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={cerrarMenu}
          className="fixed inset-0 z-40 bg-foreground/40 md:hidden"
        />
      )}

      {/* Sidebar: drawer en móvil, columna fija desde md */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform duration-200 md:static md:z-auto md:w-56 md:translate-x-0 md:shrink-0 ${
          menuAbierto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-6">
          {/* Logo del panel: mismo estilo serif del periódico */}
          <div>
            <p className="font-serif text-2xl font-bold tracking-[-0.04em]">CORRIENTE</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Panel editorial
            </p>
          </div>
          <button
            type="button"
            onClick={cerrarMenu}
            aria-label="Cerrar menú"
            className="text-lg text-muted-foreground md:hidden"
          >
            ✕
          </button>
        </div>
        <nav className="flex flex-col gap-1 overflow-y-auto p-3">
          {MENU.filter((item) => item.roles.includes(user?.rol)).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={cerrarMenu}
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
          <p className="truncate text-xs font-bold uppercase tracking-[0.12em]">{user?.nombre}</p>
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
      <main className="min-w-0 flex-1 bg-background pt-14 md:pt-0">
        <Outlet />
      </main>
    </div>
  )
}
