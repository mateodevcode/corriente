# === Token de baja del newsletter (link "darse de baja" del correo) ===
#
# JWT sin expiración firmado con el mismo secreto de la app: el suscriptor
# puede darse de baja en cualquier momento, meses después de suscribirse.
# Se distingue del token de sesión con audience dedicada.

from datetime import datetime, timezone

from jose import JWTError, jwt

from app.core.config import settings

BAJA_AUD = "newsletter-baja"


def generar_token_baja(email: str) -> str:
    """JWT firmado con el email del suscriptor; SIN expiración."""
    payload = {
        "sub": email,
        "aud": BAJA_AUD,
        # iat solo informativo (cuándo se envió el correo)
        "iat": int(datetime.now(timezone.utc).timestamp()),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def verificar_token_baja(token: str) -> str | None:
    """Valida el token de baja y devuelve el email; None si es inválido.

    No se exige exp: los tokens de baja no expiran.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
            audience=BAJA_AUD,
            options={"verify_exp": False},
        )
        email = payload.get("sub")
        return email if isinstance(email, str) and "@" in email else None
    except JWTError:
        return None
