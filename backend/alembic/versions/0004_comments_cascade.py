"""comments cascade al borrar artículo

Al eliminar un artículo deben borrarse también sus comentarios
(huérfanos con article_id NOT NULL). Antes el FK no tenía
ON DELETE CASCADE e intentaba SET NULL → NotNullViolation.

Revision ID: 0004
Revises: 0003
Create Date: 2026-09-12
"""
from alembic import op

# Revision identifiers, used by Alembic
revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_constraint("comments_article_id_fkey", "comments", type_="foreignkey")
    op.create_foreign_key(
        "comments_article_id_fkey",
        "comments",
        "articles",
        ["article_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint("comments_article_id_fkey", "comments", type_="foreignkey")
    op.create_foreign_key(
        "comments_article_id_fkey",
        "comments",
        "articles",
        ["article_id"],
        ["id"],
    )
