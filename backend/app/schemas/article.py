# === Esquemas de artículos (v2 bloques) ===

from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field

# Estados válidos del flujo editorial
ARTICLE_STATES = ("borrador", "en_revision", "publicado", "programado")

# --- Bloques tipados ---
class BlockParrafo(BaseModel):
    id: str
    tipo: Literal["parrafo"]
    data: dict  # {html: str}

class BlockEncabezado(BaseModel):
    id: str
    tipo: Literal["encabezado"]
    data: dict  # {nivel:2|3|4, texto:str}

class BlockImagen(BaseModel):
    id: str
    tipo: Literal["imagen"]
    data: dict  # {url, epigrafe, alt, posicion}

class BlockPaso(BaseModel):
    id: str
    tipo: Literal["paso"]
    data: dict  # {numero, titulo_paso, imagen_url, texto}

class BlockCita(BaseModel):
    id: str
    tipo: Literal["cita"]
    data: dict  # {texto, autor}

class BlockLista(BaseModel):
    id: str
    tipo: Literal["lista"]
    data: dict  # {estilo: ul|ol, items:[]}

class BlockSeparador(BaseModel):
    id: str
    tipo: Literal["separador"]
    data: dict = {}

Block = Annotated[BlockParrafo | BlockEncabezado | BlockImagen | BlockPaso | BlockCita | BlockLista | BlockSeparador, Field(discriminator="tipo")]


class ArticleBase(BaseModel):
    titulo: str = Field(min_length=3, max_length=300)
    slug: str = Field(min_length=3, max_length=330, pattern="^[a-z0-9-]+$")
    resumen: str | None = None
    contenido: str | None = None           # HTML derivado (compat v1)
    contenido_bloques: list[Block] | None = None  # v2 bloques tipados
    imagen_portada_url: str | None = None  # URL pública en S3 tras subida presignada
    estado: str = Field(default="borrador", pattern="^(borrador|en_revision|publicado|programado)$")
    es_portada: bool = False                # Solo un artículo es portada a la vez
    fecha_publicacion: datetime | None = None
    author_id: int
    category_id: int
    tags: list[str] = []                    # Nombres de etiquetas (se resuelven a slug)


class ArticleCreate(ArticleBase):
    pass


class ArticleUpdate(BaseModel):
    """Actualización parcial de artículo."""
    titulo: str | None = Field(default=None, min_length=3, max_length=300)
    slug: str | None = Field(default=None, min_length=3, max_length=330, pattern="^[a-z0-9-]+$")
    resumen: str | None = None
    contenido: str | None = None
    contenido_bloques: list[Block] | None = None
    imagen_portada_url: str | None = None
    estado: str | None = Field(default=None, pattern="^(borrador|en_revision|publicado|programado)$")
    es_portada: bool | None = None
    fecha_publicacion: datetime | None = None
    author_id: int | None = None
    category_id: int | None = None
    tags: list[str] | None = None


class ArticleOut(BaseModel):
    """Salida completa (detalle del artículo)."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    titulo: str
    slug: str
    resumen: str | None
    contenido: str | None
    contenido_bloques: list[Block] | None = None
    contenido_version: int = 1
    imagen_portada_url: str | None
    estado: str
    es_portada: bool
    fecha_publicacion: datetime | None
    fecha_creacion: datetime
    fecha_actualizacion: datetime
    author_id: int
    category_id: int
    # Datos expandidos para el frontend
    autor: "AuthorNested | None" = None
    categoria: "CategoryNested | None" = None
    tags: list[str] = []          # slugs de etiquetas


class ArticleListOut(BaseModel):
    """Salida compacta para listados (home, secciones, Última Hora)."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    titulo: str
    slug: str
    resumen: str | None
    imagen_portada_url: str | None
    estado: str
    es_portada: bool
    fecha_publicacion: datetime | None
    fecha_creacion: datetime
    fecha_actualizacion: datetime
    author_id: int
    category_id: int
    autor: "AuthorNested | None" = None
    categoria: "CategoryNested | None" = None
    tags: list[str] = []


class ArticleFilter(BaseModel):
    """Filtros de búsqueda para listar artículos."""
    estado: str | None = None
    categoria_slug: str | None = None
    autor_id: int | None = None
    buscar: str | None = None      # Búsqueda por texto en título/resumen
    pagina: int = Field(default=1, ge=1)
    por_pagina: int = Field(default=12, ge=1, le=100)


# Esquemas anidados (se definen al final para evitar referencias circulares)
class AuthorNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre_publico: str
    foto_url: str | None


class CategoryNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    slug: str
    es_principal: bool


# Resuelve los nombres forward-referenced de ArticleOut/ArticleListOut
ArticleOut.model_rebuild()
ArticleListOut.model_rebuild()
