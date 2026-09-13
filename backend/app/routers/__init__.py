# === Routers de la API de Corriente ===

from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.articles import router as articles_router
from app.routers.categories import router as categories_router
from app.routers.comments import router as comments_router
from app.routers.tags import router as tags_router
from app.routers.upload import router as upload_router
from app.routers.dashboard import router as dashboard_router
from app.routers.subscribers import router as subscribers_router

ALL_ROUTERS = [
    auth_router,
    users_router,
    articles_router,
    categories_router,
    comments_router,
    tags_router,
    upload_router,
    dashboard_router,
    subscribers_router,
]

__all__ = ["ALL_ROUTERS"]
