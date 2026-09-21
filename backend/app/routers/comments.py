# === Router: comments (comentarios con moderación) ===

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models import Article, Author, Comment, User
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


def _article_ids_del_escritor(db: Session, user: User) -> list[int]:
    """Devuelve los IDs de artículos que pertenecen al escritor."""
    author = db.query(Author).filter(Author.user_id == user.id).first()
    if author is None:
        return []
    return [a.id for a in db.query(Article.id).filter(Article.author_id == author.id).all()]


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
    """Publica un comentario (pendiente para lectores, aprobado directo para admin/editor)."""
    if db.get(Article, datos.article_id) is None:
        raise HTTPException(status_code=404, detail="Artículo no encontrado")
    # Admin y editor publican sin moderación
    auto_aprobar = user.rol in ("admin", "editor")
    comment = Comment(
        article_id=datos.article_id,
        user_id=user.id,
        contenido=datos.contenido,
        estado_moderacion="aprobado" if auto_aprobar else "pendiente",
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
    user: User = Depends(require_role("admin", "editor", "escritor")),
):
    """Lista comentarios para el panel de moderación (con filtro por estado).

    - admin/editor: ven todos
    - escritor: solo pendientes de sus artículos
    """
    query = (
        db.query(Comment)
        .options(joinedload(Comment.user), joinedload(Comment.article))
        .order_by(Comment.fecha.desc())
    )
    # Escritor: solo comentarios de sus artículos y por defecto pendientes
    if user.rol == "escritor":
        article_ids = _article_ids_del_escritor(db, user)
        if not article_ids:
            return []
        query = query.filter(Comment.article_id.in_(article_ids))
        if not estado:
            estado = "pendiente"  # por defecto, solo pendientes para escritor
    if estado:
        query = query.filter(Comment.estado_moderacion == estado)
    comentarios = query.limit(200).all()
    return [_serializar(c) for c in comentarios]


@router.patch("/{comment_id}/moderar", response_model=CommentOut)
def moderar(
    comment_id: int,
    datos: CommentModerate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin", "editor", "escritor")),
):
    """Aprueba o rechaza un comentario pendiente.

    - admin/editor: cualquier comentario
    - escritor: solo comentarios de sus artículos
    """
    comment = db.get(Comment, comment_id)
    if comment is None:
        raise HTTPException(status_code=404, detail="Comentario no encontrado")
    if user.rol == "escritor":
        article_ids = _article_ids_del_escritor(db, user)
        if comment.article_id not in article_ids:
            raise HTTPException(status_code=403, detail="No puedes moderar este comentario")
    comment.estado_moderacion = datos.estado_moderacion
    db.commit()
    db.refresh(comment)
    return _serializar(comment)


@router.delete("/{comment_id}", status_code=204)
def eliminar_comentario(
    comment_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin", "editor", "escritor")),
):
    """Elimina definitivamente un comentario.

    - admin/editor: cualquier comentario
    - escritor: solo comentarios de sus artículos
    """
    comment = db.get(Comment, comment_id)
    if comment is None:
        raise HTTPException(status_code=404, detail="Comentario no encontrado")
    if user.rol == "escritor":
        article_ids = _article_ids_del_escritor(db, user)
        if comment.article_id not in article_ids:
            raise HTTPException(status_code=403, detail="No puedes eliminar este comentario")
    db.delete(comment)
    db.commit()
