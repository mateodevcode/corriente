"""bloques estructurados para artículo (Opción B campo derivado)

Revision ID: 0005
Revises: 0004
Create Date: 2026-09-22
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("articles", sa.Column("contenido_bloques", JSONB, nullable=True))
    op.add_column("articles", sa.Column("contenido_version", sa.Integer, server_default="1", nullable=False))
    # Backfill: envolver contenido existente en un bloque parrafo para que el editor nuevo lo cargue
    op.execute(
        """
        UPDATE articles
        SET contenido_bloques = jsonb_build_array(
            jsonb_build_object(
                'id', 'b_' || substr(md5(random()::text), 1, 7),
                'tipo', 'parrafo',
                'data', jsonb_build_object('html', COALESCE(contenido, ''))
            )
        ),
        contenido_version = 1
        WHERE contenido IS NOT NULL AND contenido_bloques IS NULL
        """
    )


def downgrade() -> None:
    op.drop_column("articles", "contenido_bloques")
    op.drop_column("articles", "contenido_version")
