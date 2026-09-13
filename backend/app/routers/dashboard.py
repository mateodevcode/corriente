# === Router: dashboard (métricas básicas para el panel) ===

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_role
from app.models import Article, Comment, User
from app.schemas import DashboardMetrics

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/metrics", response_model=DashboardMetrics)
def metricas(
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin", "editor")),
):
    """Métricas resumidas del panel: publicados, borradores, comentarios pendientes."""
    publicados = (
        db.query(func.count(Article.id))
        .filter(Article.estado == "publicado")
        .scalar()
    )
    borrador = (
        db.query(func.count(Article.id))
        .filter(Article.estado.in_(["borrador", "en_revision", "programado"]))
        .scalar()
    )
    pendientes = (
        db.query(func.count(Comment.id))
        .filter(Comment.estado_moderacion == "pendiente")
        .scalar()
    )
    usuarios = db.query(func.count(User.id)).scalar()

    # Más leídos: los últimos publicados (sin sistema de vistas instalado aún)
    mas_leidos = (
        db.query(Article)
        .filter(Article.estado == "publicado")
        .order_by(Article.fecha_publicacion.desc())
        .limit(5)
        .all()
    )

    return DashboardMetrics(
        articulos_publicados=publicados or 0,
        articulos_borrador=borrador or 0,
        comentarios_pendientes=pendientes or 0,
        total_usuarios=usuarios or 0,
        mas_leidos=[
            {
                "id": a.id,
                "titulo": a.titulo,
                "slug": a.slug,
                "fecha": a.fecha_publicacion.isoformat() if a.fecha_publicacion else None,
            }
            for a in mas_leidos
        ],
    )
