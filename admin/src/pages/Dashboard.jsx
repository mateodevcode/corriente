// Dashboard: métricas básicas del panel (artículos, comentarios, más leídos)
import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext.jsx'

export default function Dashboard() {
  const { user } = useAuth()
  const [metricas, setMetricas] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const endpoint = user?.rol === 'escritor'
      ? '/dashboard/metrics-propias'
      : '/dashboard/metrics'
    api.get(endpoint)
      .then((res) => setMetricas(res.data))
      .catch((err) => setError(err.message))
  }, [user])

  if (error) return <div className="p-10 text-sm text-primary">{error}</div>
  if (!metricas) return <div className="p-10 text-sm text-muted-foreground">Cargando métricas…</div>

  const esEscritor = user?.rol === 'escritor'

  return (
    <div className="p-8">
      {/* Cabecera de sección: kicker + título serif (lenguaje del periódico) */}
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Panel</p>
      <h1 className="mt-2 font-serif text-3xl font-bold tracking-[-0.04em]">
        {esEscritor ? 'Mi Dashboard' : 'Dashboard'}
      </h1>

      {/* Métricas en grilla hairline (gap-px sobre bg-border, estilo del prototipo) */}
      <div className="mt-8 grid max-w-3xl grid-cols-2 gap-px bg-border md:grid-cols-3">
        {[
          { label: 'Publicados', valor: metricas.articulos_publicados },
          { label: 'En borrador', valor: metricas.articulos_borrador },
          { label: 'Com. pendientes', valor: metricas.comentarios_pendientes },
        ].map((m) => (
          <div key={m.label} className="bg-card p-6">
            <p className="text-3xl font-bold">{m.valor}</p>
            <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {m.label}
            </p>
          </div>
        ))}
      </div>

      {/* Últimos publicados: solo admin/editor */}
      {!esEscritor && (
        <>
          <h2 className="mt-12 font-serif text-2xl font-bold tracking-[-0.03em]">Últimos publicados</h2>
          <div className="mt-4 max-w-3xl divide-y divide-border border-y border-border">
            {metricas.mas_leidos.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-4 bg-card px-4 py-3">
                <span className="truncate text-sm">{a.titulo}</span>
                <span className="shrink-0 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  {a.fecha?.slice(0, 10) || '—'}
                </span>
              </div>
            ))}
            {!metricas.mas_leidos.length && (
              <p className="px-4 py-6 text-sm text-muted-foreground">
                Todavía no hay artículos publicados.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
