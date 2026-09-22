# === Modelo: articles (artículos del periódico) ===

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Article(Base):
    __tablename__ = "articles"

    id: Mapped[int] = mapped_column(primary_key=True)
    titulo: Mapped[str] = mapped_column(String(300), index=True)
    slug: Mapped[str] = mapped_column(String(330), unique=True, index=True)
    resumen: Mapped[str | None] = mapped_column(Text)
    # Contenido HTML derivado de los bloques (compatibilidad v1)
    contenido: Mapped[str | None] = mapped_column(Text)
    # Bloques estructurados v2 (campo derivado inverso: contenido se genera de aquí)
    contenido_bloques: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    contenido_version: Mapped[int] = mapped_column(Integer, default=1, server_default="1")
    imagen_portada_url: Mapped[str | None] = mapped_column(String(500))
    # Estados del flujo editorial: borrador, en_revision, publicado, programado
    estado: Mapped[str] = mapped_column(String(20), default="borrador", index=True)
    # Portada del home: solo UN artículo la lleva a la vez (el home la destaca)
    es_portada: Mapped[bool] = mapped_column(default=False, index=True)
    fecha_publicacion: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    fecha_creacion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    fecha_actualizacion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Claves foráneas
    author_id: Mapped[int] = mapped_column(ForeignKey("authors.id"), index=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"), index=True)

    # Relaciones
    author = relationship("Author", back_populates="articles")
    category = relationship("Category", back_populates="articles")
    comments = relationship("Comment", back_populates="article", cascade="all, delete-orphan", passive_deletes=True)
    tags = relationship("Tag", secondary="article_tags", back_populates="articles")
