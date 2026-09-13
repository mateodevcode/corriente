# === Configuración central del backend de Corriente ===
# Sistema de switch automático de entorno:
#   ENVIRONMENT=development → carga .env.development (Postgres local, localhost:5433)
#   ENVIRONMENT=production  → carga .env.production  (Postgres del VPS, postgres_central:5432)
#
# Si ENVIRONMENT no está seteado, FALLA con error explícito: nunca se asume un
# default silencioso (evita conectar a producción sin darse cuenta).

import os
from functools import lru_cache

from pydantic import ValidationError
from pydantic_settings import BaseSettings

# Archivos .env candidatos según entorno (ruta relativa a backend/)
_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ENV_DEV_FILE = os.path.join(_DIR, ".env.development")
ENV_PROD_FILE = os.path.join(_DIR, ".env.production")


def _resolver_entorno_y_archivo():
    """Determina el entorno activo y qué archivo .env cargar.

    Regla: ENVIRONMENT puede venir como variable de entorno del proceso
    (ej: `ENVIRONMENT=development uvicorn ...`) o ya estar dentro del propio
    archivo .env* elegido. Si no está en ningún lado → error explícito.
    """
    entorno = os.environ.get("ENVIRONMENT")

    # 1) Variable del proceso manda (switch explícito por comando)
    if entorno == "development":
        return entorno, ENV_DEV_FILE
    if entorno == "production":
        return entorno, ENV_PROD_FILE

    # 2) Sin variable: probar si existe un único archivo .env con ENVIRONMENT
    candidatos = []
    for archivo in (ENV_DEV_FILE, ENV_PROD_FILE):
        if os.path.exists(archivo):
            with open(archivo, encoding="utf-8") as fh:
                for linea in fh:
                    linea = linea.strip()
                    if linea.startswith("ENVIRONMENT="):
                        candidatos.append((linea.split("=", 1)[1].strip(), archivo))
                        break

    if len(candidatos) == 1:
        return candidatos[0]

    # 3) Nada determinable → error claro y accionable
    raise RuntimeError(
        "ENVIRONMENT no definido. Crea backend/.env.development (desarrollo) o "
        "backend/.env.production (producción), o exporta la variable: "
        "ENVIRONMENT=development uvicorn app.main:app --reload  |  "
        "ENVIRONMENT=production uvicorn app.main:app. "
        "No se asume ningún entorno por defecto para evitar conexiones "
        "accidentales a producción."
    )


class Settings(BaseSettings):
    """Configuración leída del .env correspondiente al entorno activo."""

    # --- Entorno activo ---
    ENVIRONMENT: str  # obligatorio: "development" o "production"

    # --- Aplicación ---
    APP_NAME: str = "Corriente"          # Nombre del periódico (replicable entre clientes)
    DEBUG: bool = False

    # --- Base de datos ---
    # development → localhost:5433 (postgres_local_dev en Docker)
    # production  → postgres_central:5432 (red central_network del VPS)
    DATABASE_URL: str

    # --- Seguridad / JWT ---
    JWT_SECRET: str = "cambiar-en-produccion"   # ¡Generar secreto fuerte en producción!
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440               # Duración del token (24h por defecto)

    # --- AWS S3 (imágenes: portadas, contenido, avatares) ---
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    S3_BUCKET_NAME: str = ""
    S3_REGION: str = "us-east-1"
    # Prefijo de claves dentro del bucket compartido (todo lo de Corriente
    # vive bajo esta carpeta; el borrado solo acepta keys de este prefijo)
    S3_SUBFOLDER: str = "corriente"

    # --- URLs de los frontends (para CORS y enlaces) ---
    FRONTEND_URL: str = "https://corriente.com"     # Sitio público (Astro)
    ADMIN_URL: str = "https://admin.corriente.com"  # Panel privado (Vite+React)

    # --- Emails / Brevo SMTP (envío transaccional: suscripciones, etc.) ---
    BREVO_SMTP_EMAIL: str = ""
    BREVO_SMTP_PASS: str = ""
    # Remitente por defecto: no-reply@seventwo.tech en .env
    BREVO_EMAIL_NO_REPLY: str = ""

    # --- Docker: red externa donde corre PostgreSQL ---
    EXTERNAL_DOCKER_NETWORK: str = "central_network"

    class Config:
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    """Instancia única (cacheada) de la configuración, consciente del entorno."""
    entorno, archivo = _resolver_entorno_y_archivo()

    # Validar que el entorno sea uno de los valores permitidos
    if entorno not in ("development", "production"):
        raise RuntimeError(
            f"ENVIRONMENT inválido: '{entorno}'. Valores permitidos: "
            "development | production."
        )

    try:
        # Carga el .env del entorno y valida el esquema completo
        return Settings(_env_file=archivo, ENVIRONMENT=entorno)
    except ValidationError as exc:
        raise RuntimeError(
            f"Configuración inválida para ENVIRONMENT={entorno} "
            f"(archivo {os.path.basename(archivo)}): {exc}"
        ) from exc


# Validación EAGER al importar: cualquier error de entorno sale inmediatamente
# al arrancar la app (o al importar en tests), con el mensaje claro de arriba.
ENTORNO_ACTIVO, _ = _resolver_entorno_y_archivo()
settings = get_settings()
