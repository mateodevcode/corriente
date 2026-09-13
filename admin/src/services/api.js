// Cliente HTTP central del panel: axios-like con fetch, inyecta el JWT
const BASE_URL = import.meta.env.VITE_API_URL || '/api'

async function request(metodo, ruta, cuerpo = null, esFormData = false) {
  const token = localStorage.getItem('corriente_token')
  const headers = { Accept: 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  if (cuerpo && !esFormData) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${BASE_URL}${ruta}`, {
    method: metodo,
    headers,
    body: cuerpo ? (esFormData ? cuerpo : JSON.stringify(cuerpo)) : null,
  })

  // Token inválido/expirado: limpiar sesión
  if (res.status === 401) {
    localStorage.removeItem('corriente_token')
    window.location.href = '/login'
  }

  if (!res.ok) {
    // Extraer el detalle del error de FastAPI
    let detalle = `Error HTTP ${res.status}`
    try {
      const data = await res.json()
      detalle = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)
    } catch { /* sin cuerpo JSON */ }
    throw new Error(detalle)
  }

  if (res.status === 204) return { data: null }
  return { data: await res.json() }
}

// API con los métodos usados por el panel
export const api = {
  get: (ruta) => request('GET', ruta),
  post: (ruta, cuerpo) => request('POST', ruta, cuerpo),
  patch: (ruta, cuerpo) => request('PATCH', ruta, cuerpo),
  put: (ruta, cuerpo) => request('PUT', ruta, cuerpo),
  delete: (ruta) => request('DELETE', ruta),
}

// Sube una imagen a S3 usando presigned URL del backend
export async function subirImagen(archivo, tituloSlug = '') {
  // 1) Pedir URL presignada al backend (tituloSlug para que la key sea identificable)
  const payload = {
    nombre_archivo: archivo.name,
    content_type: archivo.type,
  }
  if (tituloSlug) payload.titulo_slug = tituloSlug
  const { data } = await api.post('/upload/presign', payload)
  // 2) Subir directo al bucket (PUT, sin pasar por el servidor)
  const res = await fetch(data.upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': archivo.type },
    body: archivo,
  })
  if (!res.ok) throw new Error('Error subiendo imagen a S3')
  // 3) Devolver la URL pública final
  return data.file_url
}

// Elimina una imagen de S3 (el backend solo acepta keys bajo corriente/)
export function eliminarImagen(fileUrl) {
  return api.post('/upload/eliminar-imagen', { file_url: fileUrl })
}
