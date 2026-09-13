# === Base de datos: motor y sesión de SQLAlchemy ===

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

# Motor conectado al PostgreSQL existente (URL viene de .env)
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)

# Fábrica de sesiones usada por los routers vía Depends(get_db)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Clase base para todos los modelos ORM
Base = declarative_base()


def get_db():
    """Generador de sesión de BD para inyección de dependencias de FastAPI."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
