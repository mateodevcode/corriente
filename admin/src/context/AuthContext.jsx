// Contexto de autenticación: guarda el JWT y el usuario actual del panel
import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)        // { id, email, nombre, rol }
  const [cargando, setCargando] = useState(true)

  // Al arrancar: si hay token guardado, recupera el usuario (/users/me)
  useEffect(() => {
    const token = localStorage.getItem('corriente_token')
    if (!token) {
      setCargando(false)
      return
    }
    api.get('/users/me')
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem('corriente_token'))
      .finally(() => setCargando(false))
  }, [])

  // Login contra la API: guarda el JWT en localStorage
  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    localStorage.setItem('corriente_token', res.data.access_token)
    setUser(res.data.user)
    return res.data.user
  }

  const logout = () => {
    localStorage.removeItem('corriente_token')
    setUser(null)
  }

  // Roles con jerarquía: admin > editor > escritor
  const tieneRol = (...roles) => user && roles.includes(user.rol)

  return (
    <AuthContext.Provider value={{ user, cargando, login, logout, tieneRol }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
