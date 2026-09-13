# === Esquemas de usuarios ===

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

# Roles válidos: staff del panel (admin/editor/escritor) + lector del sitio público
ROLES = ("admin", "editor", "escritor", "lector")


class UserBase(BaseModel):
    email: EmailStr
    nombre: str = Field(min_length=2, max_length=120)
    rol: str = Field(default="escritor", pattern="^(admin|editor|escritor|lector)$")


class RegistroLector(BaseModel):
    """Registro público de lectores en el sitio (siempre rol 'lector')."""
    email: EmailStr
    nombre: str = Field(min_length=2, max_length=120)
    password: str = Field(min_length=8, max_length=128)
    # Check opcional: suscribirse al newsletter al crear la cuenta
    suscribirse: bool = False


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserUpdate(BaseModel):
    """Actualización parcial: solo los campos enviados se modifican."""
    nombre: str | None = None
    rol: str | None = Field(default=None, pattern="^(admin|editor|escritor|lector)$")
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    """Representación pública del usuario (nunca expone password_hash)."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    nombre: str
    rol: str
    fecha_registro: datetime
