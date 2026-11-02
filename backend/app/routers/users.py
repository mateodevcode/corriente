# === Router: users (gestión de usuarios y roles — solo admin) ===

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.core.security import hash_password
from app.models import Author, User
from app.schemas import (
    PerfilOut, PerfilUpdate, UserCreate, UserOut, UserUpdate,
)
from app.utils.autores import autor_de_usuario

router = APIRouter(prefix="/users", tags=["users"])

ROLES_PANEL = ("admin", "editor", "escritor")


def _perfil_out(user: User, autor: Author) -> PerfilOut:
    return PerfilOut(
        id=user.id,
        email=user.email,
        nombre=user.nombre,
        rol=user.rol,
        fecha_registro=user.fecha_registro,
        profesion=autor.profesion,
        bio=autor.bio,
        foto_url=autor.foto_url,
    )


@router.get("/me", response_model=UserOut)
def quien_soy(user: User = Depends(get_current_user)):
    """Devuelve el usuario autenticado actual (para el panel)."""
    return user


@router.get("/me/perfil", response_model=PerfilOut)
def mi_perfil(
    db: Session = Depends(get_db),
    user: User = Depends(require_role(*ROLES_PANEL)),
):
    """Datos de la cuenta y del perfil público del usuario autenticado."""
    return _perfil_out(user, autor_de_usuario(db, user))


@router.patch("/me/perfil", response_model=PerfilOut)
def actualizar_mi_perfil(
    datos: PerfilUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(*ROLES_PANEL)),
):
    """Cada usuario del panel edita sus propios datos (sin cambiar email ni rol)."""
    autor = autor_de_usuario(db, user)
    cambios = datos.model_dump(exclude_unset=True)
    if "nombre" in cambios:
        user.nombre = cambios["nombre"]
        autor.nombre_publico = cambios["nombre"]
    if "password" in cambios:
        user.password_hash = hash_password(cambios["password"])
    for campo in ("profesion", "bio", "foto_url"):
        if campo in cambios:
            setattr(autor, campo, cambios[campo])
    db.commit()
    db.refresh(user)
    db.refresh(autor)
    return _perfil_out(user, autor)


@router.get("", response_model=list[UserOut])
def listar_usuarios(
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),  # Solo el admin ve la lista completa
):
    """Lista todos los usuarios (solo admin)."""
    return db.query(User).order_by(User.id).all()


@router.post("", response_model=UserOut, status_code=201)
def crear_usuario(
    datos: UserCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),  # Solo el admin crea usuarios
):
    """Crea un usuario nuevo con rol (solo admin)."""
    email = datos.email.strip().lower()
    if db.query(User).filter(func.lower(User.email) == email).first():
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    user = User(
        email=email,
        nombre=datos.nombre,
        rol=datos.rol,
        password_hash=hash_password(datos.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    # Todo el personal editorial firma sus artículos con un perfil de autor
    if user.rol != "lector":
        db.add(Author(nombre_publico=user.nombre, user_id=user.id))
        db.commit()
    return user


@router.patch("/{user_id}", response_model=UserOut)
def actualizar_usuario(
    user_id: int,
    datos: UserUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),  # Solo el admin edita usuarios
):
    """Actualiza nombre, rol o contraseña de un usuario (solo admin)."""
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    cambios = datos.model_dump(exclude_unset=True)
    if "password" in cambios:
        user.password_hash = hash_password(cambios.pop("password"))
    for campo, valor in cambios.items():
        setattr(user, campo, valor)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=204)
def eliminar_usuario(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    """Elimina un usuario (solo admin). No puede eliminarse a sí mismo."""
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="No puedes eliminar tu propia cuenta")
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    db.delete(user)
    db.commit()
