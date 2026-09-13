# === Router: articles (CRUD editorial + endpoints públicos para el frontend) ===

import logging
import re
import unicodedata
from datetime import datetime, timezone
from urllib.parse import unquote, urlparse

import boto3
from botocore.client import Config as BotoConfig
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models import Article, Author, Category, Tag, User
from app.schemas import (
    ArticleCreate, ArticleOut, ArticleListOut, ArticleUpdate,
)
from app.utils.slugs import slugify

logger = logging.getLogger("corriente.articles")

router = APIRouter(prefix="/articles", tags=["articles"])


# ---------- Helpers ----------

def _resolver_tags(db: Session, nombres: list[str]) -> list[Tag]:
    """Busca o crea las etiquetas por nombre y devuelve los objetos Tag."""
    tags = []
    for nombre in nombres:
        slug = slugify(nombre)
        if not slug:
            continue
        tag = db.query(Tag).filter(Tag.slug == slug).first()
        if tag is None:
            tag = Tag(nombre=nombre.strip(), slug=slug)
            db.add(tag)
        tags.append(tag)
    return tags


def _serializar(article: Article) -> dict:
    """Convierte un Article ORM a dict con autor/categoría/tags expandidos."""
    return {
        "id": article.id,
        "titulo": article.titulo,
        "slug": article.slug,
        "resumen": article.resumen,
        "contenido": article.contenido,
        "imagen_portada_url": article.imagen_portada_url,
        "estado": article.estado,
        "es_portada": article.es_portada,
        "fecha_publicacion": article.fecha_publicacion,
        "fecha_creacion": article.fecha_creacion,
        "fecha_actualizacion": article.fecha_actualizacion,
        "author_id": article.author_id,
        "category_id": article.category_id,
        "autor": article.author,
        "categoria": article.category,
        "tags": [t.slug for t in article.tags],
    }


def _asignar_portada(db: Session, article: Article) -> None:
    """Deja a `article` como ÚNICO es_portada=True (quita el flag al anterior)."""
    db.query(Article).filter(Article.es_portada.is_(True)).update(
        {"es_portada": False}
    )
    article.es_portada = True


def _serializar_lista(articles: list[Article]) -> list[dict]:
    """Serializa varios artículos a la vez (para los endpoints de listado)."""
    return [_serializar(a) for a in articles]


def _borrar_portada_s3(file_url: str | None) -> None:
    """Borra la portada de S3 si la URL pertenece a nuestro prefijo. No lanza si falla."""
    if not file_url or not settings.S3_BUCKET_NAME or not settings.AWS_ACCESS_KEY_ID:
        return
    try:
        path = urlparse(file_url).path
        key = unquote(path).lstrip("/")
        if "/" in key:
            posible_bucket, _, resto = key.partition("/")
            if posible_bucket == settings.S3_BUCKET_NAME:
                key = resto
        prefijo = f"{settings.S3_SUBFOLDER}/"
        if not key.startswith(prefijo):
            return
        s3 = boto3.client(
            "s3",
            region_name=settings.S3_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            config=BotoConfig(signature_version="s3v4"),
        )
        s3.delete_object(Bucket=settings.S3_BUCKET_NAME, Key=key)
    except Exception:
        logger.exception("No se pudo borrar portada S3 %s", file_url)


# ---------- Endpoints públicos (frontend Astro) ----------

@router.get("/publicados", response_model=list[ArticleListOut])
def listar_publicados(
    categoria_slug: str | None = None,
    buscar: str | None = None,
    pagina: int = Query(default=1, ge=1),
    por_pagina: int = Query(default=12, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Lista artículos PUBLICADOS ordenados por fecha (feed Última Hora / secciones).

    Si llega a producción sin autor de portada, el cliente decide el destacado.
    """
    query = (
        db.query(Article)
        .options(joinedload(Article.author), joinedload(Article.category))
        .filter(
            Article.estado == "publicado",
            Article.fecha_publicacion.is_not(None),
            Article.fecha_publicacion <= datetime.now(timezone.utc),
        )
    )
    if categoria_slug:
        query = query.join(Category).filter(Category.slug == categoria_slug)
    if buscar:
        # Búsqueda simple por texto en título y resumen
        query = query.filter(
            or_(
                Article.titulo.ilike(f"%{buscar}%"),
                Article.resumen.ilike(f"%{buscar}%"),
            )
        )
    query = query.order_by(Article.fecha_publicacion.desc())
    return _serializar_lista(query.offset((pagina - 1) * por_pagina).limit(por_pagina).all())


@router.get("/publicados/{slug}", response_model=ArticleOut)
def obtener_publicado(slug: str, db: Session = Depends(get_db)):
    """Detalle de un artículo publicado por slug (página del artículo)."""
    article = (
        db.query(Article)
        .options(joinedload(Article.author), joinedload(Article.category))
        .filter(Article.slug == slug, Article.estado == "publicado")
        .first()
    )
    if article is None:
        raise HTTPException(status_code=404, detail="Artículo no encontrado")
    return _serializar(article)


@router.get("/publicados/autor/{autor}", response_model=list[ArticleListOut])
def por_autor(
    autor: str,
    pagina: int = Query(default=1, ge=1),
    por_pagina: int = Query(default=12, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Artículos publicados de un autor por su slug (perfil público)."""
    author = db.query(Author).filter(
        Author.nombre_publico.ilike(autor.replace("-", " "))
    ).first()
    if author is None:
        return []
    query = (
        db.query(Article)
        .options(joinedload(Article.author), joinedload(Article.category))
        .filter(
            Article.author_id == author.id,
            Article.estado == "publicado",
        )
        .order_by(Article.fecha_publicacion.desc())
    )
    return _serializar_lista(query.offset((pagina - 1) * por_pagina).limit(por_pagina).all())


# ---------- Endpoints del panel (protegidos) ----------

@router.get("", response_model=list[ArticleListOut])
def listar_todos(
    estado: str | None = None,
    categoria_slug: str | None = None,
    buscar: str | None = None,
    pagina: int = Query(default=1, ge=1),
    por_pagina: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin", "editor", "escritor")),
):
    """Lista todos los artículos (con filtros) para el panel.

    - admin/editor: ven todos
    - escritor: solo sus propios artículos
    """
    query = (
        db.query(Article)
        .options(joinedload(Article.author), joinedload(Article.category))
    )
    # Un escritor solo accede a sus artículos
    if user.rol == "escritor":
        author = db.query(Author).filter(Author.user_id == user.id).first()
        if author is None:
            return []
        query = query.filter(Article.author_id == author.id)
    if estado:
        query = query.filter(Article.estado == estado)
    if categoria_slug:
        query = query.join(Category).filter(Category.slug == categoria_slug)
    if buscar:
        query = query.filter(
            or_(
                Article.titulo.ilike(f"%{buscar}%"),
                Article.resumen.ilike(f"%{buscar}%"),
            )
        )
    query = query.order_by(Article.fecha_actualizacion.desc())
    return _serializar_lista(query.offset((pagina - 1) * por_pagina).limit(por_pagina).all())


@router.get("/{article_id}", response_model=ArticleOut)
def obtener_por_id(
    article_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin", "editor", "escritor")),
):
    """Detalle de cualquier artículo por ID (para el editor del panel)."""
    article = (
        db.query(Article)
        .options(joinedload(Article.author), joinedload(Article.category))
        .get(article_id)
    )
    if article is None:
        raise HTTPException(status_code=404, detail="Artículo no encontrado")
    # Un escritor solo puede ver sus propios artículos
    if user.rol == "escritor":
        author = db.query(Author).filter(Author.user_id == user.id).first()
        if author is None or article.author_id != author.id:
            raise HTTPException(status_code=403, detail="No puedes ver este artículo")
    return _serializar(article)


@router.post("", response_model=ArticleOut, status_code=201)
def crear(
    datos: ArticleCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin", "editor", "escritor")),
):
    """Crea un artículo. El escritor fuerza su propia autoría."""
    if db.query(Article).filter(Article.slug == datos.slug).first():
        raise HTTPException(status_code=400, detail="El slug ya existe")
    # Publicado debe ser visible de inmediato: si no trae fecha o es futura, fijar a ahora
    fecha_pub = datos.fecha_publicacion
    if datos.estado == "publicado" and (fecha_pub is None or fecha_pub > datetime.now(timezone.utc)):
        fecha_pub = datetime.now(timezone.utc)
    article = Article(
        titulo=datos.titulo,
        slug=datos.slug,
        resumen=datos.resumen,
        contenido=datos.contenido,
        imagen_portada_url=datos.imagen_portada_url,
        estado=datos.estado,
        fecha_publicacion=fecha_pub,
        author_id=datos.author_id,
        category_id=datos.category_id,
    )
    if datos.tags:
        article.tags = _resolver_tags(db, datos.tags)
    if datos.es_portada:
        _asignar_portada(db, article)
    db.add(article)
    db.commit()
    db.refresh(article)
    return _serializar(article)


@router.put("/{article_id}/portada", response_model=ArticleOut)
def asignar_portada(
    article_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin", "editor")),
):
    """Marca este artículo como LA portada del home (quita el flag al anterior).

    Decisión editorial: solo admin/editor. Un solo artículo la lleva a la vez.
    """
    article = db.get(Article, article_id)
    if article is None:
        raise HTTPException(status_code=404, detail="Artículo no encontrado")
    _asignar_portada(db, article)
    db.commit()
    db.refresh(article)
    return _serializar(article)


@router.patch("/{article_id}", response_model=ArticleOut)
def actualizar(    article_id: int,
    datos: ArticleUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin", "editor", "escritor")),
):
    """Actualiza un artículo existente."""
    article = db.get(Article, article_id)
    if article is None:
        raise HTTPException(status_code=404, detail="Artículo no encontrado")
    # Un escritor solo edita sus propios artículos
    if user.rol == "escritor":
        author = db.query(Author).filter(Author.user_id == user.id).first()
        if author is None or article.author_id != author.id:
            raise HTTPException(status_code=403, detail="No puedes editar este artículo")
    cambios = datos.model_dump(exclude_unset=True)
    # Publicado debe ser visible de inmediato: si queda sin fecha o futura, fijar a ahora
    if cambios.get("estado") == "publicado":
        fp = cambios.get("fecha_publicacion", article.fecha_publicacion)
        if fp is None or fp > datetime.now(timezone.utc):
            cambios["fecha_publicacion"] = datetime.now(timezone.utc)
    elif "fecha_publicacion" not in cambios and article.estado == "publicado" and article.fecha_publicacion is None:
        cambios["fecha_publicacion"] = datetime.now(timezone.utc)
    # Si cambia el slug, verificar que no esté repetido
    nuevo_slug = cambios.get("slug")
    if nuevo_slug and nuevo_slug != article.slug:
        if db.query(Article).filter(Article.slug == nuevo_slug).first():
            raise HTTPException(status_code=400, detail="El slug ya existe")
    tags_nombres = cambios.pop("tags", None)
    es_portada_nueva = cambios.pop("es_portada", None)
    for campo, valor in cambios.items():
        setattr(article, campo, valor)
    if tags_nombres is not None:
        article.tags = _resolver_tags(db, tags_nombres)
    # Asignar portada es exclusivo de admin/editor (decisión editorial del home)
    if es_portada_nueva is not None:
        if user.rol == "escritor":
            raise HTTPException(
                status_code=403,
                detail="Solo admin o editor pueden asignar la portada",
            )
        if es_portada_nueva:
            _asignar_portada(db, article)
        else:
            article.es_portada = False
    db.commit()
    db.refresh(article)
    return _serializar(article)


@router.delete("/{article_id}", status_code=204)
def eliminar(
    article_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin", "editor", "escritor")),
):
    """Elimina un artículo. Escritores solo los suyos; editores/admin cualquiera."""
    article = db.get(Article, article_id)
    if article is None:
        raise HTTPException(status_code=404, detail="Artículo no encontrado")
    if user.rol == "escritor":
        author = db.query(Author).filter(Author.user_id == user.id).first()
        if author is None or article.author_id != author.id:
            raise HTTPException(status_code=403, detail="No puedes eliminar este artículo")
    portada_url = article.imagen_portada_url
    db.delete(article)
    db.commit()
    # Borrar portada en S3 solo tras commit exitoso (evita borrar si la transacción hace rollback)
    _borrar_portada_s3(portada_url)
