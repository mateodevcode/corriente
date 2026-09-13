# === Modelo: authors (perfil público de autor, puede o no tener usuario) ===

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Author(Base):
    __tablename__ = "authors"

    id: Mapped[int] = mapped_column(primary_key=True)
    # FK opcional: un autor puede existir sin cuenta de usuario (colaborador externo)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    nombre_publico: Mapped[str] = mapped_column(String(150), index=True)
    bio: Mapped[str | None] = mapped_column(Text)
    foto_url: Mapped[str | None] = mapped_column(String(500))

    # Relación con sus artículos
    articles = relationship("Article", back_populates="author")
