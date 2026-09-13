# === Esquemas de presigned URLs de S3 ===

from pydantic import BaseModel, Field


class PresignedUrlRequest(BaseModel):
    """Solicitud de URL presignada para subir una imagen directo a S3."""
    nombre_archivo: str = Field(min_length=3, max_length=255)
    content_type: str = Field(pattern="^image/(jpeg|png|webp|gif|avif)$")
    # Slug del título para nombrar la key en S3 de forma identificable (opcional, fallback a nombre_archivo)
    titulo_slug: str | None = Field(default=None, max_length=330, pattern="^[a-z0-9-]*$")


class PresignedUrlResponse(BaseModel):
    upload_url: str       # URL PUT presignada (el panel sube directo al bucket)
    file_url: str         # URL pública final del archivo (para guardar en el artículo)
