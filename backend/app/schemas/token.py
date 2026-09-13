# === Esquema del token JWT ===

from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    # Datos útiles del usuario para el panel (evita una petición extra al login)
    user: "UserPayload | None" = None


class UserPayload(BaseModel):
    id: int
    email: str
    nombre: str
    rol: str


Token.model_rebuild()
