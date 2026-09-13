# === Dependencias de autenticación y autorización por rol ===

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.models import User

# Esquema Bearer para extraer el JWT del header Authorization
bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Resuelve el usuario autenticado a partir del JWT (o devuelve 401)."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autenticado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_token(credentials.credentials)
    if payload is None or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.get(User, int(payload["sub"]))
    if user is None:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return user


def require_role(*roles: str):
    """Fábrica de dependencia: exige que el usuario tenga uno de los roles indicados.

    Jerarquía: admin > editor > escritor.
    """

    def checker(user: User = Depends(get_current_user)) -> User:
        if user.rol not in roles:
            raise HTTPException(status_code=403, detail="Permisos insuficientes")
        return user

    return checker
