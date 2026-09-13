# === Router: tags (etiquetas) ===

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_role
from app.models import Tag, User
from app.schemas import TagCreate, TagOut

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("", response_model=list[TagOut])
def listar_tags(db: Session = Depends(get_db)):
    """Lista todas las etiquetas (público)."""
    return db.query(Tag).order_by(Tag.nombre).all()


@router.post("", response_model=TagOut, status_code=201)
def crear_tag(
    datos: TagCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin", "editor", "escritor")),
):
    """Crea una etiqueta nueva."""
    if db.query(Tag).filter(Tag.slug == datos.slug).first():
        raise HTTPException(status_code=400, detail="El slug ya existe")
    tag = Tag(**datos.model_dump())
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


@router.delete("/{tag_id}", status_code=204)
def eliminar_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin", "editor")),
):
    """Elimina una etiqueta (se desvincula de sus artículos automáticamente)."""
    tag = db.get(Tag, tag_id)
    if tag is None:
        raise HTTPException(status_code=404, detail="Etiqueta no encontrada")
    db.delete(tag)
    db.commit()
