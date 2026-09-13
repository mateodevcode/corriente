"""articulo de portada: es_portada

Agrega el flag es_portada a articles: solo UN artículo es la portada del
home a la vez. Se asigna desde el panel (el backend garantiza unicidad
quitando el flag al anterior antes de asignarlo al nuevo).

Revision ID: 0002
Revises: 0001
Create Date: 2026-09-11
"""
from alembic import op
import sqlalchemy as sa

# Revision identifiers, used by Alembic
revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "articles",
        sa.Column("es_portada", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.create_index(op.f("ix_articles_es_portada"), "articles", ["es_portada"])


def downgrade() -> None:
    op.drop_index(op.f("ix_articles_es_portada"), table_name="articles")
    op.drop_column("articles", "es_portada")
