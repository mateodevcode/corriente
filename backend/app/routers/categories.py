# === Router: categories (secciones del periódico) ===

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_role
from app.models import Category, User
from app.schemas import CategoryCreate, CategoryOut, CategoryUpdate

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryOut])
def listar_categorias(db: Session = Depends(get_db)):
    """Lista todas las categorías (público: usado por el frontend y el panel)."""
    return db.query(Category).order_by(Category.es_principal.desc(), Category.nombre).all()


@router.get("/{slug}", response_model=CategoryOut)
def obtener_categoria(slug: str, db: Session = Depends(get_db)):
    """Detalle de categoría por slug (público)."""
    categoria = db.query(Category).filter(Category.slug == slug).first()
    if categoria is None:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    return categoria


@router.post("", response_model=CategoryOut, status_code=201)
def crear_categoria(
    datos: CategoryCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin", "editor")),  # Solo admin/editor crean secciones
):
    """Crea una categoría nueva."""
    if db.query(Category).filter(Category.slug == datos.slug).first():
        raise HTTPException(status_code=400, detail="El slug ya existe")
    categoria = Category(**datos.model_dump())
    db.add(categoria)
    db.commit()
    db.refresh(categoria)
    return categoria


@router.patch("/{category_id}", response_model=CategoryOut)
def actualizar_categoria(
    category_id: int,
    datos: CategoryUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin", "editor")),
):
    """Actualiza una categoría (nombre, slug, es_principal)."""
    categoria = db.get(Category, category_id)
    if categoria is None:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    cambios = datos.model_dump(exclude_unset=True)
    if "slug" in cambios and cambios["slug"] != categoria.slug:
        if db.query(Category).filter(Category.slug == cambios["slug"]).first():
            raise HTTPException(status_code=400, detail="El slug ya existe")
    for campo, valor in cambios.items():
        setattr(categoria, campo, valor)
    db.commit()
    db.refresh(categoria)
    return categoria


@router.delete("/{category_id}", status_code=204)
def eliminar_categoria(
    category_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),  # Solo admin elimina secciones
):
    """Elimina una categoría (solo admin). Falla si tiene artículos asociados."""
    categoria = db.get(Category, category_id)
    if categoria is None:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    if categoria.articles:
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar: la categoría tiene artículos asociados",
        )
    db.delete(categoria)
    db.commit()
