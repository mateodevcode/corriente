# === Aplicación FastAPI de Corriente ===

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import ALL_ROUTERS

# Documentación de los entregables: routers modulares
app = FastAPI(
    title=f"{settings.APP_NAME} API",
    description="Backend del periódico digital Corriente",
    version="1.0.0",
)

# CORS: permite el frontend público y el panel (URLs desde .env)
allowed_origins = [settings.FRONTEND_URL, settings.ADMIN_URL]
# En desarrollo, los servidores locales también necesitan acceso
if settings.DEBUG:
    allowed_origins += [
        "http://localhost:4321",   # Astro dev
        "http://localhost:5173",   # Vite dev (admin)
        "http://localhost:3000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registro de todos los routers: auth, users, articles, categories, comments, tags, upload, dashboard
for router in ALL_ROUTERS:
    app.include_router(router)


@app.get("/", tags=["health"])
def health():
    """Endpoint de verificación básica."""
    return {"status": "ok", "app": settings.APP_NAME}
