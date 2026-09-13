# === Esquemas de comentarios ===

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

# Estados de moderación
COMMENT_STATES = ("pendiente", "aprobado", "rechazado")


class CommentCreate(BaseModel):
    article_id: int
    contenido: str = Field(min_length=2, max_length=3000)


class CommentModerate(BaseModel):
    """Acción de moderación desde el panel."""
    estado_moderacion: str = Field(pattern="^(aprobado|rechazado)$")


class CommentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    article_id: int
    user_id: int
    contenido: str
    estado_moderacion: str
    fecha: datetime
    # Datos expandidos
    usuario_nombre: str | None = None
    article_titulo: str | None = None
