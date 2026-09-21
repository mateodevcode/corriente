# === Esquemas Pydantic (validación de entrada/salida) ===

from app.schemas.user import (
    UserCreate, UserOut, UserLogin, UserUpdate, RegistroLector,
)
from app.schemas.author import AuthorCreate, AuthorOut, AuthorUpdate
from app.schemas.category import CategoryCreate, CategoryOut, CategoryUpdate
from app.schemas.article import (
    ArticleCreate, ArticleUpdate, ArticleOut, ArticleListOut,
)
from app.schemas.comment import CommentCreate, CommentOut, CommentModerate
from app.schemas.tag import TagCreate, TagOut
from app.schemas.token import Token, UserPayload
from app.schemas.s3 import PresignedUrlRequest, PresignedUrlResponse
from app.schemas.metrics import DashboardMetrics, WriterMetrics
from app.schemas.subscriber import SubscriberCreate, SubscriberOut, EmailPreviewOut

__all__ = [
    "UserCreate", "UserOut", "UserLogin", "UserUpdate", "RegistroLector",
    "AuthorCreate", "AuthorOut", "AuthorUpdate",
    "CategoryCreate", "CategoryOut", "CategoryUpdate",
    "ArticleCreate", "ArticleUpdate", "ArticleOut", "ArticleListOut",
    "CommentCreate", "CommentOut", "CommentModerate",
    "TagCreate", "TagOut",
    "Token", "UserPayload",
    "PresignedUrlRequest", "PresignedUrlResponse",
    "DashboardMetrics", "WriterMetrics",
    "SubscriberCreate", "SubscriberOut", "EmailPreviewOut",
]
