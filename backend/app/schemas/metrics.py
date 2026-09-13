# === Esquema de métricas del dashboard del panel ===

from pydantic import BaseModel


class DashboardMetrics(BaseModel):
    articulos_publicados: int
    articulos_borrador: int      # incluye "en_revision" y "programado"
    comentarios_pendientes: int
    total_usuarios: int
    # Más leídos: top de artículos publicados (id, titulo, slug, vistas_estimadas)
    mas_leidos: list[dict] = []
