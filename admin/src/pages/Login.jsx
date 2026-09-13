// Login del panel: formulario contra /auth/login
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const enviar = async (e) => {
    e.preventDefault()
    setError('')
    setCargando(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Error de autenticación')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5">
      <form onSubmit={enviar} className="w-full max-w-sm border border-border bg-card p-8">
        {/* Cabecera con la identidad del periódico */}
        <p className="text-center font-serif text-3xl font-bold tracking-[-0.05em]">CORRIENTE</p>
        <p className="mt-2 text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Panel editorial
        </p>

        {/* Campos: inputs con borde inferior, estilo del prototipo */}
        <label className="mt-8 block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Email
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border-b-2 border-border bg-transparent pb-2 text-sm outline-none focus:border-primary"
            placeholder="tu@corriente.com"
          />
        </label>
        <label className="mt-6 block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Contraseña
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border-b-2 border-border bg-transparent pb-2 text-sm outline-none focus:border-primary"
            placeholder="••••••••"
          />
        </label>

        {error && <p className="mt-4 text-sm font-bold text-primary">{error}</p>}

        <button
          type="submit"
          disabled={cargando}
          className="mt-8 w-full bg-primary px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {cargando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
