"""subscribers: newsletter

Tabla subscribers para el newsletter "La carta de Corriente": email único,
flag activo y fecha de suscripción.

Revision ID: 0003
Revises: 0002
Create Date: 2026-09-12
"""
from alembic import op
import sqlalchemy as sa

# Revision identifiers, used by Alembic
revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "subscribers",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(320), nullable=False, unique=True, index=True),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column(
            "fecha",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_table("subscribers")
