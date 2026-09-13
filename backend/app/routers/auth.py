# === Router: auth (login JWT + registro público de lectores) ===

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models import User
from app.routers.subscribers import registrar_suscripcion, _enviar_gracias
from app.schemas import RegistroLector, Token, UserLogin, UserPayload

logger = logging.getLogger("corriente.auth")

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=Token)
def login(datos: UserLogin, db: Session = Depends(get_db)):
    """Autentica un usuario y devuelve un JWT con sus datos."""
    user = db.query(User).filter(User.email == datos.email).first()
    if user is None or not verify_password(datos.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
        )
    token = create_access_token({"sub": str(user.id)})
    return Token(
        access_token=token,
        user=UserPayload(
            id=user.id, email=user.email, nombre=user.nombre, rol=user.rol
        ),
    )


@router.post("/registro", response_model=Token, status_code=201)
def registro(datos: RegistroLector, db: Session = Depends(get_db)):
    """Registro público de lectores del sitio: siempre rol 'lector'."""
    if db.query(User).filter(User.email == datos.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado",
        )
    user = User(
        email=datos.email,
        nombre=datos.nombre,
        rol="lector",
        password_hash=hash_password(datos.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": str(user.id)})

    # Check "suscribirse al newsletter": registra y envía el correo de gracias.
    # Falla silenciosa: la cuenta se crea igual, la suscripción puede reintentarse.
    if datos.suscribirse:
        try:
            registrar_suscripcion(db, datos.email)
            _enviar_gracias(db, datos.email)
        except Exception:
            logger.exception(
                "Cuenta creada, pero falló la suscripción al newsletter de %s",
                datos.email,
            )

    return Token(
        access_token=token,
        user=UserPayload(
            id=user.id, email=user.email, nombre=user.nombre, rol=user.rol
        ),
    )
