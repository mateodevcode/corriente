# === Router: upload (presigned URLs de S3 para subir imágenes) ===

import uuid
from urllib.parse import unquote, urlparse

import boto3
from botocore.client import Config as BotoConfig
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.config import settings
from app.core.deps import require_role
from app.models import User
from app.schemas import PresignedUrlRequest, PresignedUrlResponse
from app.utils.slugs import slugify

router = APIRouter(prefix="/upload", tags=["upload"])

# Extensiones permitidas según content_type (validación del nombre de archivo)
EXTENSIONES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
}


def _s3_client():
    """Cliente S3 con firma V4 (requerido por la mayoría de buckets nuevos)."""
    return boto3.client(
        "s3",
        region_name=settings.S3_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        config=BotoConfig(signature_version="s3v4"),
    )


@router.post("/presign", response_model=PresignedUrlResponse)
def generar_presigned(
    datos: PresignedUrlRequest,
    _: User = Depends(require_role("admin", "editor", "escritor")),  # Solo el panel sube imágenes
):
    """Genera una URL presignada para subir una imagen directo a S3.

    El panel hace PUT a `upload_url` con el archivo y luego guarda `file_url`
    en el artículo. Así la imagen nunca pasa por el servidor.
    """
    if not settings.S3_BUCKET_NAME or not settings.AWS_ACCESS_KEY_ID:
        raise HTTPException(
            status_code=500,
            detail="S3 no está configurado (faltan variables de entorno)",
        )
    # Nombre de archivo final: slug del título (identificable) + uuid corto.
    # Key bajo el prefijo corriente/ (bucket compartido con otros proyectos).
    titulo_base = slugify(datos.titulo_slug)[:40] if datos.titulo_slug else ""
    base = titulo_base or slugify(datos.nombre_archivo.rsplit(".", 1)[0])[:40] or "imagen"
    extension = EXTENSIONES.get(datos.content_type)
    if extension is None:
        raise HTTPException(status_code=400, detail="Tipo de imagen no soportado")
    key = f"{settings.S3_SUBFOLDER}/{base}-{uuid.uuid4().hex[:8]}.{extension}"

    s3 = _s3_client()
    try:
        upload_url = s3.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": settings.S3_BUCKET_NAME,
                "Key": key,
                "ContentType": datos.content_type,
            },
            ExpiresIn=600,  # 10 minutos para completar la subida
        )
    except Exception as exc:  # Error de credenciales o red de AWS
        raise HTTPException(status_code=500, detail=f"Error generando URL S3: {exc}")

    # URL pública final del archivo
    file_url = (
        f"https://{settings.S3_BUCKET_NAME}.s3.{settings.S3_REGION}.amazonaws.com/{key}"
    )
    return PresignedUrlResponse(upload_url=upload_url, file_url=file_url)


class EliminarImagenRequest(BaseModel):
    """URL pública de la imagen a borrar (la que devolvió /presign)."""
    file_url: str


@router.post("/eliminar-imagen")
def eliminar_imagen(
    datos: EliminarImagenRequest,
    _: User = Depends(require_role("admin", "editor", "escritor")),
):
    """Elimina una imagen de S3 a partir de su URL pública.

    Porte del deleteFromS3 (s3AWS.js) a boto3. Guarda de seguridad: solo se
    borran keys bajo el prefijo corriente/ — el bucket es compartido con
    otros proyectos y jamás se toca nada fuera de nuestra carpeta.
    """
    if not settings.S3_BUCKET_NAME or not settings.AWS_ACCESS_KEY_ID:
        raise HTTPException(
            status_code=500,
            detail="S3 no está configurado (faltan variables de entorno)",
        )

    # Extraer el key de la URL (acepta path-style y virtual-hosted-style,
    # con o sin región explícita, y decodifica %20 etc.)
    try:
        path = urlparse(datos.file_url).path
    except Exception:
        raise HTTPException(status_code=400, detail="URL de imagen inválida")
    key = unquote(path).lstrip("/")
    if "/" in key:  # path-style: el primer segmento es el bucket
        posible_bucket, _, resto = key.partition("/")
        if posible_bucket == settings.S3_BUCKET_NAME:
            key = resto

    prefijo = f"{settings.S3_SUBFOLDER}/"
    if not key.startswith(prefijo):
        raise HTTPException(
            status_code=403,
            detail=f"Solo se pueden eliminar imágenes bajo {prefijo} "
            "(el bucket es compartido con otros proyectos)",
        )

    s3 = _s3_client()
    try:
        s3.delete_object(Bucket=settings.S3_BUCKET_NAME, Key=key)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error eliminando en S3: {exc}")

    return {"ok": True, "key": key}
