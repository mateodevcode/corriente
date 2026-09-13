# === Utilidades de slugs (transliteración de acentos al estilo URL) ===

import re
import unicodedata


def slugify(texto: str) -> str:
    """Convierte un texto a slug URL-friendly: minúsculas, sin acentos, guiones.

    Ejemplo: "Economía y Negocios" -> "economia-y-negocios"
    """
    if not texto:
        return ""
    # Normaliza y elimina diacríticos (á -> a)
    texto = unicodedata.normalize("NFKD", texto)
    texto = "".join(c for c in texto if not unicodedata.combining(c))
    # Minúsculas, solo alfanuméricos y guiones
    texto = re.sub(r"[^a-zA-Z0-9\s-]", "", texto).lower().strip()
    # Colapsa espacios y guiones repetidos y limpia bordes
    texto = re.sub(r"[\s-]+", "-", texto).strip("-")
    return texto[:330]
