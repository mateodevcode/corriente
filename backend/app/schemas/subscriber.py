# === Esquemas de suscriptores (newsletter) ===

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class SubscriberCreate(BaseModel):
    """Suscripción pública al newsletter (solo el email)."""
    email: EmailStr = Field(max_length=320)


class SubscriberOut(BaseModel):
    """Salida para el panel (lista de suscriptores)."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    activo: bool
    fecha: datetime


class EmailPreviewOut(BaseModel):
    """HTML del correo de suscripción (vista previa del panel)."""
    asunto: str
    html: str
    remitente: str = Field(default="no-reply@seventwo.tech")
