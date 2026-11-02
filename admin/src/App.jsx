// Rutas del panel: protegidas por autenticación y rol
import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import LoginPage from './pages/Login.jsx'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ArticulosPage from './pages/Articulos.jsx'
import ArticuloEditor from './pages/ArticuloEditor.jsx'
import ComentariosPage from './pages/Comentarios.jsx'
import CategoriasPage from './pages/Categorias.jsx'
import UsuariosPage from './pages/Usuarios.jsx'
import SuscriptoresPage from './pages/Suscriptores.jsx'

// Roles con acceso al panel editorial (un lector nunca entra)
const ROLES_PANEL = ['admin', 'editor', 'escritor']
const esPersonal = (user) => Boolean(user && ROLES_PANEL.includes(user.rol))

// Manda al inicio público: el lector solo puede comentar en el sitio
function InicioPublico() {
  useEffect(() => {
    window.location.replace('/')
  }, [])
  return <div className="p-10 text-sm text-muted-foreground">Redirigiendo al inicio…</div>
}

// Envoltorio del login: con sesión activa, staff va al panel y lector al inicio
function LoginRuta({ children }) {
  const { user, cargando } = useAuth()
  if (cargando) return <div className="p-10 text-sm text-muted-foreground">Cargando…</div>
  if (!user) return children
  if (!esPersonal(user)) return <InicioPublico />
  return <Navigate to="/" replace />
}

// Envoltorio: exige sesión iniciada y rol del panel (lector no entra)
function Protegido({ children }) {
  const { user, cargando } = useAuth()
  if (cargando) return <div className="p-10 text-sm text-muted-foreground">Cargando…</div>
  if (!user) return <Navigate to="/login" replace />
  if (!esPersonal(user)) return <InicioPublico />
  return children
}

// Envoltorio: exige uno de los roles indicados (admin/editor/escritor)
function PorRol({ roles, children }) {
  const { user } = useAuth()
  if (!user || !roles.includes(user.rol)) {
    return <div className="p-10 text-sm text-primary">No tienes permisos para esta sección.</div>
  }
  return children
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <LoginRuta>
            <LoginPage />
          </LoginRuta>
        }
      />
      <Route
        path="/"
        element={
          <Protegido>
            <Layout />
          </Protegido>
        }
      >
        <Route
          index
          element={
            <PorRol roles={['admin', 'editor', 'escritor']}>
              <Dashboard />
            </PorRol>
          }
        />
        <Route
          path="articulos"
          element={
            <PorRol roles={['admin', 'editor', 'escritor']}>
              <ArticulosPage />
            </PorRol>
          }
        />
        <Route
          path="articulos/nuevo"
          element={
            <PorRol roles={['admin', 'editor', 'escritor']}>
              <ArticuloEditor />
            </PorRol>
          }
        />
        <Route
          path="articulos/:id"
          element={
            <PorRol roles={['admin', 'editor', 'escritor']}>
              <ArticuloEditor />
            </PorRol>
          }
        />
        <Route
          path="comentarios"
          element={
            <PorRol roles={['admin', 'editor', 'escritor']}>
              <ComentariosPage />
            </PorRol>
          }
        />
        <Route
          path="suscriptores"
          element={
            <PorRol roles={['admin', 'editor']}>
              <SuscriptoresPage />
            </PorRol>
          }
        />
        <Route
          path="categorias"
          element={
            <PorRol roles={['admin', 'editor']}>
              <CategoriasPage />
            </PorRol>
          }
        />
        <Route
          path="usuarios"
          element={
            <PorRol roles={['admin']}>
              <UsuariosPage />
            </PorRol>
          }
        />
      </Route>
      {/* Cualquier otra ruta: al dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
