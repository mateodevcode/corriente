# === Modelo: categories (secciones del periódico) ===

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(80), unique=True)
    slug: Mapped[str] = mapped_column(String(90), unique=True, index=True)
    # Las secciones principales (Política, Tecnología) tienen mayor peso visual
    es_principal: Mapped[bool] = mapped_column(Boolean, default=False)

    articles = relationship("Article", back_populates="category")
