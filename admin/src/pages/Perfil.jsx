// Mi perfil: cada usuario del panel edita sus propios datos (sin email ni rol)
import { useEffect, useState } from 'react'
import { api, subirImagen } from '../services/api'
import { useAuth } from '../context/AuthContext.jsx'
import { slugify } from '../lib/slugs'

const inputClase = 'w-full border-b-2 border-border bg-transparent pb-2 text-sm outline-none focus:border-primary'

export default function PerfilPage() {
  const { refrescar } = useAuth()
  const [perfil, setPerfil] = useState(null)
  const [form, setForm] = useState({ nombre: '', profesion: '', bio: '', foto_url: '', password: '' })
  const [fotoFile, setFotoFile] = useState(null)
  const [fotoLocal, setFotoLocal] = useState(null)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    api.get('/users/me/perfil')
      .then((res) => {
        setPerfil(res.data)
        setForm({
          nombre: res.data.nombre || '',
          profesion: res.data.profesion || '',
          bio: res.data.bio || '',
          foto_url: res.data.foto_url || '',
          password: '',
        })
      })
      .catch((err) => setError(err.message))
  }, [])

  const setCampo = (campo, valor) => setForm((prev) => ({ ...prev, [campo]: valor }))

  const onFoto = (archivo) => {
    if (!archivo) return
    if (fotoLocal) URL.revokeObjectURL(fotoLocal)
    setFotoLocal(URL.createObjectURL(archivo))
    setFotoFile(archivo)
  }

  const quitarFoto = () => {
    if (fotoLocal) URL.revokeObjectURL(fotoLocal)
    setFotoLocal(null)
    setFotoFile(null)
    setCampo('foto_url', '')
  }

  const guardar = async (e) => {
    e.preventDefault()
    setError('')
    setMensaje('')
    setGuardando(true)
    try {
      let fotoUrl = form.foto_url
      if (fotoFile) {
        fotoUrl = await subirImagen(fotoFile, slugify(form.nombre) || 'autor')
      }
      const payload = {
        nombre: form.nombre.trim(),
        profesion: form.profesion.trim(),
        bio: form.bio.trim(),
        foto_url: fotoUrl,
      }
      if (form.password) payload.password = form.password
      const res = await api.patch('/users/me/perfil', payload)
      setPerfil(res.data)
      setForm((prev) => ({ ...prev, foto_url: res.data.foto_url || '', password: '' }))
      setFotoFile(null)
      if (fotoLocal) URL.revokeObjectURL(fotoLocal)
      setFotoLocal(null)
      await refrescar()
      setMensaje('Perfil actualizado correctamente.')
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  if (!perfil) {
    return (
      <div className="p-4 sm:p-8">
        {error
          ? <p className="text-sm text-primary">{error}</p>
          : <p className="text-sm text-muted-foreground">Cargando perfil…</p>}
      </div>
    )
  }

  return (
    <form onSubmit={guardar} className="mx-auto max-w-2xl p-4 sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Cuenta</p>
      <h1 className="mt-2 font-serif text-2xl font-bold tracking-[-0.04em] sm:text-3xl">Mi perfil</h1>
      <p className="mt-2 text-xs text-muted-foreground">
        Tu nombre y profesión aparecen bajo tu firma en los artículos publicados.
      </p>

      {error && <p className="mt-4 border-l-2 border-primary bg-muted px-4 py-3 text-sm text-primary">{error}</p>}
      {mensaje && <p className="mt-4 border-l-2 border-foreground bg-muted px-4 py-3 text-sm font-bold">{mensaje}</p>}

      {/* Email: solo lectura, no se puede modificar */}
      <label className="mt-8 block">
        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Email</span>
        <input value={perfil.email} readOnly disabled
          className="w-full border-b-2 border-border bg-transparent pb-2 text-sm text-muted-foreground outline-none" />
      </label>

      <label className="mt-6 block">
        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Nombre</span>
        <input value={form.nombre} onChange={(e) => setCampo('nombre', e.target.value)} required minLength={2}
          className={inputClase} placeholder="Tu nombre público" />
      </label>

      <label className="mt-6 block">
        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Profesión</span>
        <input value={form.profesion} onChange={(e) => setCampo('profesion', e.target.value)}
          className={inputClase} placeholder="Ej. Periodista, abogada, analista…" />
      </label>

      <label className="mt-6 block">
        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Bio</span>
        <textarea value={form.bio} onChange={(e) => setCampo('bio', e.target.value)} rows={3}
          className={`${inputClase} resize-none`} placeholder="Breve presentación para tu perfil de autor" />
      </label>

      <div className="mt-8">
        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Foto de perfil</span>
        {(form.foto_url || fotoLocal) ? (
          <div className="flex flex-col items-start gap-4 sm:flex-row">
            <img src={fotoLocal || form.foto_url} alt="Foto de perfil" className="size-24 object-cover" />
            <div className="grid gap-2">
              <button type="button" onClick={quitarFoto}
                className="text-xs font-bold uppercase tracking-[0.12em] text-primary hover:underline">
                Quitar
              </button>
              <label className="cursor-pointer text-xs text-muted-foreground hover:underline">Cambiar…
                <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                  onChange={(e) => onFoto(e.target.files[0])} />
              </label>
            </div>
          </div>
        ) : (
          <label className="flex h-24 w-24 cursor-pointer items-center justify-center border border-dashed border-border text-center text-[10px] uppercase tracking-[0.1em] text-muted-foreground hover:border-primary">
            <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              onChange={(e) => onFoto(e.target.files[0])} />
            Subir foto
          </label>
        )}
      </div>

      <label className="mt-8 block">
        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Nueva contraseña (opcional)
        </span>
        <input type="password" value={form.password} onChange={(e) => setCampo('password', e.target.value)}
          minLength={8} autoComplete="new-password" className={inputClase}
          placeholder="Déjala vacía para no cambiarla" />
      </label>

      <div className="mt-8 flex flex-wrap gap-4">
        <button type="submit" disabled={guardando}
          className="bg-primary px-6 py-3 text-xs font-bold uppercase tracking-[0.12em] text-primary-foreground transition hover:opacity-90 disabled:opacity-50">
          {guardando ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}
