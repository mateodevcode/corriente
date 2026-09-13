# === Esquemas de etiquetas ===

from pydantic import BaseModel, ConfigDict, Field


class TagCreate(BaseModel):
    nombre: str = Field(min_length=2, max_length=60)
    slug: str = Field(min_length=2, max_length=70, pattern="^[a-z0-9-]+$")


class TagOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    slug: str
