# === env.py de Alembic: conecta las migraciones con los modelos y la config ===
# Consciente del entorno: usa exactamente la misma lógica de ENVIRONMENT que
# app.core.config, así `alembic upgrade head` funciona idéntico en local y en
# el VPS sin cambiar comandos (solo cambia qué .env está activo).

from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

# La importación de app.core.config valida el entorno (error explícito si
# ENVIRONMENT no está definido) y expone settings ya resueltos.
from app.core.config import settings
from app.core.database import Base
# Importar TODOS los modelos para que Alembic los detecte en metadata
from app.models import (  # noqa: F401
    Article, Author, Category, Comment, Tag, User, article_tags,
)

# Alembic Config (desde alembic.ini)
config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# URL de la BD desde la config del entorno activo (nunca hardcodeada)
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# Metadata de los modelos SQLAlchemy (fuente de verdad del autogenerado)
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Modo offline: genera SQL sin conectar a la BD."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Modo online: conecta a PostgreSQL y aplica migraciones."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            # Compara tipos completos para detectar cambios precisos
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
