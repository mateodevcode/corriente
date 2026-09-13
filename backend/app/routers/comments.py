# === Router: comments (comentarios con moderación) ===

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models import Article, Comment, User
from app.schemas import CommentCreate, CommentModerate, CommentOut

router = APIRouter(prefix="/comments", tags=["comments"])


def _serializar(comment: Comment) -> CommentOut:
    """Convierte un Comment ORM a CommentOut con usuario y artículo expandidos."""
    return CommentOut(
        id=comment.id,
        article_id=comment.article_id,
        user_id=comment.user_id,
        contenido=comment.contenido,
        estado_moderacion=comment.estado_moderacion,
        fecha=comment.fecha,
        usuario_nombre=comment.user.nombre if comment.user else None,
        article_titulo=comment.article.titulo if comment.article else None,
    )


@router.get("/articulo/{article_id}", response_model=list[CommentOut])
def comentarios_publicos(
    article_id: int,
    db: Session = Depends(get_db),
):
    """Comentarios APROBADOS de un artículo (público, para el frontend)."""
    comentarios = (
        db.query(Comment)
        .options(joinedload(Comment.user))
        .filter(
            Comment.article_id == article_id,
            Comment.estado_moderacion == "aprobado",
        )
        .order_by(Comment.fecha.desc())
        .all()
    )
    return [_serializar(c) for c in comentarios]


@router.post("", response_model=CommentOut, status_code=201)
def crear_comentario(
    datos: CommentCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),  # Cualquier usuario autenticado comenta
):
    """Publica un comentario (nace en estado 'pendiente' hasta moderación)."""
    if db.get(Article, datos.article_id) is None:
        raise HTTPException(status_code=404, detail="Artículo no encontrado")
    comment = Comment(
        article_id=datos.article_id,
        user_id=user.id,
        contenido=datos.contenido,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    db.refresh(user)
    return _serializar(comment)


@router.get("", response_model=list[CommentOut])
def listar_para_moderacion(
    estado: str | None = Query(default=None, pattern="^(pendiente|aprobado|rechazado)$"),
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin", "editor")),  # Solo admin/editor moderan
):
    """Lista comentarios para el panel de moderación (con filtro por estado)."""
    query = (
        db.query(Comment)
        .options(joinedload(Comment.user), joinedload(Comment.article))
        .order_by(Comment.fecha.desc())
    )
    if estado:
        query = query.filter(Comment.estado_moderacion == estado)
    comentarios = query.limit(200).all()
    return [_serializar(c) for c in comentarios]


@router.patch("/{comment_id}/moderar", response_model=CommentOut)
def moderar(
    comment_id: int,
    datos: CommentModerate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin", "editor")),  # Solo admin/editor moderan
):
    """Aprueba o rechaza un comentario pendiente."""
    comment = db.get(Comment, comment_id)
    if comment is None:
        raise HTTPException(status_code=404, detail="Comentario no encontrado")
    comment.estado_moderacion = datos.estado_moderacion
    db.commit()
    db.refresh(comment)
    return _serializar(comment)


@router.delete("/{comment_id}", status_code=204)
def eliminar_comentario(
    comment_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin", "editor")),  # Solo admin/editor eliminan
):
    """Elimina definitivamente un comentario."""
    comment = db.get(Comment, comment_id)
    if comment is None:
        raise HTTPException(status_code=404, detail="Comentario no encontrado")
    db.delete(comment)
    db.commit()
