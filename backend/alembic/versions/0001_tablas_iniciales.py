"""migración inicial: tablas de corriente

Creación de todas las tablas del periódico digital:
users, authors, categories, articles, comments, tags, article_tags.

Revision ID: 0001
Revises:
Create Date: 2026-09-10
"""
from alembic import op
import sqlalchemy as sa

# Revision identifiers, used by Alembic
revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- users: usuarios del sistema con roles (admin/editor/escritor) ---
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True, index=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("nombre", sa.String(120), nullable=False),
        sa.Column("rol", sa.String(20), nullable=False, server_default="escritor"),
        sa.Column(
            "fecha_registro",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # --- authors: perfil público de autor (FK opcional a users) ---
    op.create_table(
        "authors",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("nombre_publico", sa.String(150), nullable=False, index=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("foto_url", sa.String(500), nullable=True),
    )

    # --- categories: secciones del periódico ---
    op.create_table(
        "categories",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nombre", sa.String(80), nullable=False, unique=True),
        sa.Column("slug", sa.String(90), nullable=False, unique=True, index=True),
        sa.Column("es_principal", sa.Boolean(), nullable=False, server_default=sa.false()),
    )

    # --- articles: artículos del periódico ---
    op.create_table(
        "articles",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("titulo", sa.String(300), nullable=False, index=True),
        sa.Column("slug", sa.String(330), nullable=False, unique=True, index=True),
        sa.Column("resumen", sa.Text(), nullable=True),
        sa.Column("contenido", sa.Text(), nullable=True),
        sa.Column("imagen_portada_url", sa.String(500), nullable=True),
        sa.Column("estado", sa.String(20), nullable=False, server_default="borrador", index=True),
        sa.Column("fecha_publicacion", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "fecha_creacion",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "fecha_actualizacion",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("author_id", sa.Integer(), sa.ForeignKey("authors.id"), nullable=False, index=True),
        sa.Column("category_id", sa.Integer(), sa.ForeignKey("categories.id"), nullable=False, index=True),
    )

    # --- comments: comentarios con moderación ---
    op.create_table(
        "comments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("article_id", sa.Integer(), sa.ForeignKey("articles.id"), nullable=False, index=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("contenido", sa.Text(), nullable=False),
        sa.Column("estado_moderacion", sa.String(20), nullable=False, server_default="pendiente", index=True),
        sa.Column("fecha", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # --- tags: etiquetas ---
    op.create_table(
        "tags",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nombre", sa.String(60), nullable=False, unique=True),
        sa.Column("slug", sa.String(70), nullable=False, unique=True, index=True),
    )

    # --- article_tags: tabla intermedia many-to-many artículos <-> etiquetas ---
    op.create_table(
        "article_tags",
        sa.Column(
            "article_id",
            sa.Integer(),
            sa.ForeignKey("articles.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "tag_id",
            sa.Integer(),
            sa.ForeignKey("tags.id", ondelete="CASCADE"),
            primary_key=True,
        ),
    )


def downgrade() -> None:
    # Eliminación en orden inverso a las dependencias
    op.drop_table("article_tags")
    op.drop_table("tags")
    op.drop_table("comments")
    op.drop_table("articles")
    op.drop_table("categories")
    op.drop_table("authors")
    op.drop_table("users")
