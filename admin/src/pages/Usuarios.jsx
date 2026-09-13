// Gestión de usuarios y roles (solo admin)
import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext.jsx'

const ROLES = ['admin', 'editor', 'escritor']

export default function UsuariosPage() {
  const { user: yo } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [nuevo, setNuevo] = useState({ email: '', nombre: '', rol: 'escritor', password: '' })
  const [error, setError] = useState('')

  const cargar = () => {
    api.get('/users')
      .then((res) => setUsuarios(res.data))
      .catch((err) => setError(err.message))
  }

  useEffect(cargar, [])

  const crear = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/users', nuevo)
      setNuevo({ email: '', nombre: '', rol: 'escritor', password: '' })
      cargar()
    } catch (err) {
      setError(err.message)
    }
  }

  const cambiarRol = async (u, rol) => {
    try {
      await api.patch(`/users/${u.id}`, { rol })
      cargar()
    } catch (err) {
      setError(err.message)
    }
  }

  const eliminar = async (u) => {
    if (!window.confirm(`¿Eliminar a ${u.nombre}?`)) return
    try {
      await api.delete(`/users/${u.id}`)
      cargar()
    } catch (err) {
      setError(err.message)
    }
  }

  const inputClase =
    'w-full border-b-2 border-border bg-transparent pb-2 text-sm outline-none focus:border-primary'

  return (
    <div className="p-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Equipo</p>
      <h1 className="mt-2 font-serif text-3xl font-bold tracking-[-0.04em]">Usuarios y roles</h1>

      {error && <p className="mt-4 text-sm text-primary">{error}</p>}

      {/* Alta de usuario */}
      <form onSubmit={crear} className="mt-6 grid max-w-2xl gap-6 sm:grid-cols-4">
        <label>
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Email</span>
          <input type="email" required value={nuevo.email}
            onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })} className={inputClase} />
        </label>
        <label>
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Nombre</span>
          <input required value={nuevo.nombre}
            onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} className={inputClase} />
        </label>
        <label>
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Contraseña</span>
          <input type="password" required minLength={8} value={nuevo.password}
            onChange={(e) => setNuevo({ ...nuevo, password: e.target.value })} className={inputClase} />
        </label>
        <div>
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Rol</span>
          <div className="flex gap-3">
            <select value={nuevo.rol} onChange={(e) => setNuevo({ ...nuevo, rol: e.target.value })}
              className="w-full border border-border bg-card px-2 py-2 text-sm outline-none">
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <button type="submit"
              className="shrink-0 border border-foreground px-3 text-xs font-semibold uppercase tracking-[0.12em] transition hover:bg-foreground hover:text-background">
              Crear
            </button>
          </div>
        </div>
      </form>

      {/* Lista de usuarios */}
      <div className="mt-8 max-w-2xl border border-border bg-border [&>*+*]:border-t">
        {usuarios.map((u) => (
          <div key={u.id} className="flex items-center justify-between gap-4 bg-card px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">
                {u.nombre}
                {u.id === yo?.id && <span className="ml-2 text-[10px] uppercase tracking-[0.12em] text-primary">(tú)</span>}
              </p>
              <p className="truncate text-xs text-muted-foreground">{u.email}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {/* Cambio de rol directo */}
              <select value={u.rol} onChange={(e) => cambiarRol(u, e.target.value)}
                className="border border-border bg-background px-2 py-1 text-xs outline-none">
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              {u.id !== yo?.id && (
                <button onClick={() => eliminar(u)}
                  className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground hover:text-primary">
                  Eliminar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
