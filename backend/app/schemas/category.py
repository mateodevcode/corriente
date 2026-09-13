# === Esquemas de categorías/secciones ===

from pydantic import BaseModel, ConfigDict, Field


class CategoryBase(BaseModel):
    nombre: str = Field(min_length=2, max_length=80)
    slug: str = Field(min_length=2, max_length=90, pattern="^[a-z0-9-]+$")
    es_principal: bool = False


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=2, max_length=80)
    slug: str | None = Field(default=None, min_length=2, max_length=90, pattern="^[a-z0-9-]+$")
    es_principal: bool | None = None


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    slug: str
    es_principal: bool
