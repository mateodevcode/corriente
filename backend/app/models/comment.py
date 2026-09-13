# === Modelo: comments (comentarios con moderación) ===

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[int] = mapped_column(primary_key=True)
    article_id: Mapped[int] = mapped_column(ForeignKey("articles.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    contenido: Mapped[str] = mapped_column(Text)
    # Estados de moderación: pendiente, aprobado, rechazado
    estado_moderacion: Mapped[str] = mapped_column(String(20), default="pendiente", index=True)
    fecha: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    article = relationship("Article", back_populates="comments")
    user = relationship("User")
