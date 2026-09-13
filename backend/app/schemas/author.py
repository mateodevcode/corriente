# === Esquemas de autores ===

from pydantic import BaseModel, ConfigDict, Field


class AuthorBase(BaseModel):
    nombre_publico: str = Field(min_length=2, max_length=150)
    bio: str | None = None
    foto_url: str | None = None
    user_id: int | None = None  # FK opcional a users


class AuthorCreate(AuthorBase):
    pass


class AuthorUpdate(BaseModel):
    nombre_publico: str | None = Field(default=None, min_length=2, max_length=150)
    bio: str | None = None
    foto_url: str | None = None
    user_id: int | None = None


class AuthorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre_publico: str
    bio: str | None
    foto_url: str | None
    user_id: int | None
