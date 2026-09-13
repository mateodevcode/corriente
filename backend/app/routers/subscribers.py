# === Router: subscribers (newsletter público + panel) ===

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import require_role
from app.models import Article, Subscriber, User
from app.schemas import EmailPreviewOut, SubscriberCreate, SubscriberOut
from app.utils.emails.baja import generar_token_baja, verificar_token_baja
from app.utils.emails.gracias_suscripcion import gracias_suscripcion
from app.utils.emails.transporter import create_transporter

logger = logging.getLogger("corriente.subscribers")

router = APIRouter(prefix="/subscribers", tags=["subscribers"])


def _ultimos_titulares(db: Session, limite: int = 5) -> list[dict]:
    """Últimos artículos publicados (para el correo y la vista previa)."""
    articulos = (
        db.query(Article)
        .options(joinedload(Article.category))
        .filter(
            Article.estado == "publicado",
            Article.fecha_publicacion.is_not(None),
            Article.fecha_publicacion <= datetime.now(timezone.utc),
        )
        .order_by(Article.fecha_publicacion.desc())
        .limit(limite)
        .all()
    )
    return [
        {
            "titulo": a.titulo,
            "slug": a.slug,
            "categoria_slug": a.category.slug if a.category else None,
            "categoria_nombre": a.category.nombre if a.category else None,
        }
        for a in articulos
    ]


def _enviar_gracias(db: Session, email: str) -> None:
    """Envía el correo de agradecimiento con los últimos titulares + botón de baja."""
    transporter = create_transporter()
    html = gracias_suscripcion(
        email=email,
        titulares=_ultimos_titulares(db),
        frontend_url=settings.FRONTEND_URL,
        token_baja=generar_token_baja(email),
    )
    transporter.enviar(
        para=email,
        asunto="Gracias por suscribirte a La Corriente",
        html=html,
    )


def _enmascarar(email: str) -> str:
    """jdoe@gmail.com -> j***@gmail.com (para confirmar sin exponer el correo)."""
    local, _, dominio = email.partition("@")
    visible = local[:1] if local else ""
    return f"{visible}***@{dominio}" if dominio else email


def registrar_suscripcion(db: Session, email: str) -> Subscriber:
    """Crea (o reactiva) el suscriptor SIN enviar el correo.

    Reutilizado por POST /subscribers y por /auth/registro (check de suscripción).
    Devuelve el Subscriber; el llamador decide si envía el correo de gracias.
    """
    existente = db.query(Subscriber).filter(Subscriber.email == email).first()
    if existente:
        if not existente.activo:
            existente.activo = True
            db.commit()
            db.refresh(existente)
        return existente
    sub = Subscriber(email=email)
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


# ---------- Público (frontend) ----------

@router.post("", response_model=SubscriberOut, status_code=201)
def suscribirse(
    datos: SubscriberCreate,
    db: Session = Depends(get_db),
):
    """Suscripción al newsletter: crea el suscriptor y envía el correo de gracias.

    Si el email ya existe (y está activo) responde 200 sin duplicar ni reenviar.
    Si existía desactivado, lo reactiva y reenvía el correo.
    """
    sub = registrar_suscripcion(db, datos.email)
    ya_activo = sub.activo and sub.fecha is not None

    try:
        _enviar_gracias(db, datos.email)
    except Exception:
        # La suscripción queda registrada aunque Brevo falle; se loguea para revisar
        logger.exception("No se pudo enviar el correo de suscripción a %s", datos.email)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Suscripción registrada, pero falló el envío del correo. Intenta de nuevo más tarde.",
        )

    return sub


# ---------- Panel (admin/editor) ----------

@router.get("", response_model=list[SubscriberOut])
def listar(
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin", "editor")),
):
    """Lista de suscriptores para el panel."""
    return (
        db.query(Subscriber)
        .order_by(Subscriber.fecha.desc())
        .limit(500)
        .all()
    )


@router.get("/email-preview", response_model=EmailPreviewOut)
def email_preview(
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin", "editor")),
):
    """HTML del correo de suscripción con titulares reales (vista previa)."""
    return EmailPreviewOut(
        asunto="Gracias por suscribirte a La Corriente",
        html=gracias_suscripcion(
            email="lector@ejemplo.com",
            titulares=_ultimos_titulares(db),
            frontend_url=settings.FRONTEND_URL,
        ),
    )


@router.patch("/{subscriber_id}/activo", response_model=SubscriberOut)
def alternar_activo(
    subscriber_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin", "editor")),
):
    """Activa/desactiva un suscriptor (baja del newsletter)."""
    sub = db.get(Subscriber, subscriber_id)
    if sub is None:
        raise HTTPException(status_code=404, detail="Suscriptor no encontrado")
    sub.activo = not sub.activo
    db.commit()
    db.refresh(sub)
    return sub


# ---------- Baja pública (link del correo) ----------

@router.get("/baja-info")
def baja_info(
    token: str = Query(min_length=20),
    db: Session = Depends(get_db),
):
    """Valida el token del link de baja y devuelve el email enmascarado.

    El frontend lo usa para confirmar: "¿Darte de baja j***@gmail.com?".
    """
    email = verificar_token_baja(token)
    if email is None:
        raise HTTPException(status_code=400, detail="El enlace de baja no es válido.")
    sub = db.query(Subscriber).filter(Subscriber.email == email).first()
    return {
        "email": _enmascarar(email),
        "ya_inactivo": bool(sub and not sub.activo),
    }


@router.post("/baja")
def baja(
    token: str = Query(min_length=20),
    db: Session = Depends(get_db),
):
    """Confirma la baja: marca al suscriptor como inactivo (idempotente)."""
    email = verificar_token_baja(token)
    if email is None:
        raise HTTPException(status_code=400, detail="El enlace de baja no es válido.")
    sub = db.query(Subscriber).filter(Subscriber.email == email).first()
    if sub is None:
        # Nunca estuvo suscrito (o la fila se limpió): misma respuesta, sin filtrar
        return {"ok": True, "email": _enmascarar(email)}
    sub.activo = False
    db.commit()
    return {"ok": True, "email": _enmascarar(email)}
