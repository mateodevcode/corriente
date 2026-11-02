# === Utilidad: perfil de autor ligado a un usuario ===

from sqlalchemy.orm import Session

from app.models import Author, User


def autor_de_usuario(db: Session, user: User) -> Author:
    """Devuelve el perfil de autor del usuario; lo crea si aún no existe."""
    autor = db.query(Author).filter(Author.user_id == user.id).first()
    if autor is None:
        autor = Author(user_id=user.id, nombre_publico=user.nombre)
        db.add(autor)
        db.commit()
        db.refresh(autor)
    return autor
