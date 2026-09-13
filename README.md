# Corriente — Periódico digital

Periódico digital completo con doble sentido de marca: **corriente eléctrica/tecnológica** y **corriente política/ideológica**..

## Estructura del proyecto

```
corriente/
├── frontend/          # Sitio público (Astro + React islands + Tailwind, SSR)
│   ├── src/pages/     # index, [seccion], articulo/[slug], autor, busqueda, baja
│   ├── src/islands/   # Newsletter.jsx, BajaNewsletter.jsx, Comentarios.jsx
│   ├── src/lib/       # api.js, formato.js, slugs.js
│   └── src/components/# ArticuloCard.astro
├── admin/             # Panel privado (Vite + React, JS puro)
│   ├── src/pages/     # Articulos.jsx, ArticuloEditor.jsx, Suscriptores.jsx, Comentarios.jsx, etc.
│   ├── src/lib/slugs.js
│   └── src/services/api.js  # presign S3, CRUD
├── backend/           # API (Python FastAPI + SQLAlchemy + Alembic)
│   ├── app/routers/   # articles, categories, comments, tags, users, auth, upload, dashboard, subscribers
│   ├── app/models/    # article, author, category, comment, tag, user, subscriber
│   ├── app/schemas/   # validación Pydantic
│   ├── app/utils/emails/ # transporter.py (Brevo SMTP), gracias_suscripcion.py, baja.py
│   └── alembic/versions/ # 0001 tablas, 0002 portada, 0003 subscribers, 0004 comments cascade
├── nginx/             # Reverse proxy (3 subdominios)
├── corriente diseño/  # Prototipo visual v0 (fuente del sistema de diseño)
├── tailwind.config.js # Sistema de diseño compartido (tokens del prototipo)
└── docker-compose.yml # Backend en red externa del Postgres existente
```

## Stack

| Capa | Tecnología |
|---|---|
| Frontend público | Astro (JS puro, SSR `output: server`), islands React `.jsx`, Tailwind |
| Panel privado | Vite + React `.jsx` (SPA `corriente.seventwo.tech/admin`) |
| Backend | Python + FastAPI + SQLAlchemy + Alembic + Pydantic |
| Auth | JWT (python-jose) + bcrypt (passlib) |
| Imágenes | AWS S3 vía presigned URLs (boto3), keys `corriente/{slug-titulo}-{uuid}.ext`, CORS habilitado |
| DB | PostgreSQL existente (contenedor Docker, red externa `postgres_red`) |
| Emails | Brevo SMTP (`smtp-relay.brevo.com:587`, `no-reply@seventwo.tech`), templates HTML inline adaptados al diseño |
| Proxy | nginx: `corriente.seventwo.tech` (`/` → Astro SSR, `/admin` → Vite, `/api` → FastAPI) |
| DNS/SSL/CDN | Cloudflare |

**Cero TypeScript en todo el frontend.**

## Desarrollo local vs Producción

El backend elige la BD con `ENVIRONMENT` — **nunca asume default**:

| | Desarrollo | Producción |
|---|---|---|
| Postgres | `postgres_local_dev` (`backend/docker-compose.dev.yml`) | `postgres_central` (VPS) |
| Imagen | `postgis/postgis:16-3.4-alpine` | idem |
| Puerto | `localhost:5433` | no expuesto |
| Red | `corriente_dev_network` | `central_network` |
| `.env` | `backend/.env.development` | `backend/.env.production` (solo VPS) |

### Postgres de desarrollo

```bash
docker compose -f backend/docker-compose.dev.yml up -d
# 5433 para no chocar con 5432 nativo
```

### Backend por entorno

```bash
cd backend
ENVIRONMENT=development uvicorn app.main:app --reload  # dev
ENVIRONMENT=production uvicorn app.main:app            # prod VPS
alembic upgrade head && python -m scripts.seed
```

### Secretos

- Nunca commitear `.env.development` ni `.env.production` (`.gitignore`). Solo `.example` van al repo.
- `.env.production` solo en el VPS.

## Puesta en marcha

### Todo junto (recomendado)

```bash
npm run dev
```

`dev.mjs` instala venv + node_modules, levanta `postgres_local_dev:5433`, aplica migraciones y seed, y arranca los 3 servicios con logs `[API] [ADMIN] [FRONT]`:

| Servicio | URL |
|---|---|
| Periódico | http://localhost:4321 |
| Panel admin | http://localhost:5173 |
| API docs | http://localhost:8000/docs |
| Postgres | localhost:5433 |

`Ctrl+C` detiene servicios (Postgres sigue). También `npm run setup` y `npm start`.

### Backend

```bash
cd backend
cp .env.development.example .env.development
pip install -r requirements.txt
alembic upgrade head
python -m scripts.seed
uvicorn app.main:app --reload
# o docker-compose up -d --build (red externa)
```

### Panel admin

```bash
cd admin
npm install
npm run dev   # :5173 proxy /api -> :8000
npm run build # dist/
```

### Frontend público

```bash
cd frontend
npm install
npm run dev   # :4321
npm run build # SSR dist/ con sitemap.xml, robots.txt
node dist/server.mjs
```

### Producción (nginx)

1. `nginx/corriente.conf` → `/etc/nginx/conf.d/`
2. `frontend` en docker `corriente-frontend:4321` y `admin/dist` servido por nginx desde `/srv/infra/corriente/admin/dist` (`/admin`)
3. `docker compose up -d` (api + frontend en `central_network`)
4. Cloudflare: `corriente.seventwo.tech` → SSL Full + CDN (cert `certbot -d corriente.seventwo.tech`)

> SSR (`@astrojs/node`): cada request consulta la API, publicar se refleja al instante.

## Variables de entorno

Solo dos archivos completos:

| Archivo | Dónde | Uso |
|---|---|---|
| `backend/.env.development` | local | `ENVIRONMENT=development`, `localhost:5433`, `postgres_local_dev` |
| `backend/.env.production` | VPS | `ENVIRONMENT=production`, `postgres_central:5432` |

Plantillas: `.env.development.example` y `.env.production.example`.

| Variable | Descripción |
|---|---|
| `ENVIRONMENT` | `development` / `production` (obligatorio) |
| `DATABASE_URL` | `localhost:5433` dev / `postgres_central:5432` prod |
| `POSTGRES_USER/PASSWORD/DB` | credenciales contenedor (dev) |
| `JWT_SECRET` | `openssl rand -hex 32` en prod |
| `AWS_ACCESS_KEY_ID/SECRET` | presigned S3 |
| `S3_BUCKET_NAME/REGION/SUBFOLDER` | bucket compartido, prefijo `corriente/` (única carpeta borrable) |
| `FRONTEND_URL` / `ADMIN_URL` | `http://localhost:4321|5173` dev / `https://corriente.seventwo.tech` + `/admin` prod |
| `BREVO_SMTP_EMAIL/PASS` | SMTP `smtp-relay.brevo.com:587` |
| `BREVO_EMAIL_NO_REPLY` | `no-reply@seventwo.tech` (remitente newsletter) |
| `DEV_API_PORT/ADMIN_PORT/FRONT_PORT` | puertos dev (dev.mjs desvía si ocupados) |

## Credenciales de ejemplo

- **Email:** `admin@corriente.com`
- **Contraseña:** `corriente2026`
- Rol: `admin` (seed)

## Roles y permisos

| Rol | Permisos |
|---|---|
| `admin` | Todo: usuarios, categorías, artículos, comentarios, suscriptores, dashboard |
| `editor` | Artículos todos, moderación comentarios, categorías, suscriptores, dashboard |
| `escritor` | Solo sus artículos |
| `lector` | Solo comentar (registro público `/auth/registro`) |

Comentarios nacen `pendiente`, moderación `aprobar/rechazar/eliminar`. Al borrar un artículo se borran en cascada sus comentarios (`ON DELETE CASCADE`) y su portada en S3.

## Secciones

**Principales:** Política, Tecnología. **Secundarias:** Economía y Negocios, Internacional/Mundo, Deportes, Cultura y Entretenimiento, Ciencia y Salud, Opinión/Editorial, Sociedad, Medio Ambiente, Educación. **Última Hora** (`/ultima-hora`) es feed ordenado por fecha, no categoría DB.

## Sistema de diseño

`tailwind.config.js` raíz con tokens del prototipo `corriente diseño/` (crema `#f6f2e5`, terracota `#c84341`, salvia, ocre, hairlines `#bfb7a6`, Arial/Georgia, radios `0.2rem`, kickers `tracking-[0.18em]`, grillas `gap-px`, imágenes `3/2` y `16/8`). Copias idénticas en `frontend/` y `admin/`.

## Flujo editorial

`borrador` → `en_revision` → `publicado` (visible si `fecha_publicacion <= now()`) / `programado` (futura). `publicado` sin fecha o con fecha futura se autocorrige a `now()` (backend y editor). `es_portada` único.

## Newsletter — La carta de Corriente

- Home `Newsletter.jsx` → `POST /subscribers` (público, valida email, idempotente). Registro desde comentarios con check `suscribirse` (`POST /auth/registro`).
- Email de bienvenida vía Brevo SMTP con últimos 5 titulares y botón `Darse de baja` (`/baja?token=JWT` sin expiración, `GET /subscribers/baja-info` + `POST /subscribers/baja`).
- Panel `Suscriptores` (`/suscriptores`, admin/editor) lista + preview HTML + activar/desactivar.

## Imágenes

Subida directa a S3 vía `POST /upload/presign` → `PUT` presignado. Key `corriente/{slug-titulo}-{uuid}.ext` (slug del título, fallback nombre archivo), CORS habilitado para `PUT`. Borrado `POST /upload/eliminar-imagen` y al `DELETE /articles/{id}` se borra la portada S3 tras `commit`.

## SEO

Meta tags dinámicos + Open Graph + JSON-LD `NewsArticle` + `sitemap.xml` dinámico + `robots.txt`. `tiempoLectura` (`frontend/src/lib/formato.js`) con `~220 ppm`.

## Editor

WYSIWYG + slug auto desde título (`lib/slugs.js` — sin acentos, solo `a-z0-9-`, colapsa guiones) con flag `slugManual` para no pisar edición manual.
