deploy@vmi2932254:/etc/nginx$ ls
conf.d        fastcgi_params  koi-win     modules-available  nginx.conf    scgi_params      sites-enabled  uwsgi_params
fastcgi.conf  koi-utf         mime.types  modules-enabled    proxy_params  sites-available  snippets       win-utf
deploy@vmi2932254:/etc/nginx$ cd sites-enabled/
deploy@vmi2932254:/etc/nginx/sites-enabled$ ls
admin-panel  corriente  socket-core
deploy@vmi2932254:/etc/nginx/sites-enabled$ cat admin-panel
# ============================================================
# PANEL ADMIN + FRONTEND - SOLO ACCESIBLE VÍA TAILSCALE
# ============================================================
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name monitoring.seventwo.tech;

    ssl_certificate /etc/letsencrypt/live/monitoring.seventwo.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/monitoring.seventwo.tech/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # 🔒 Capa extra de seguridad: solo tu IP de Tailscale personal puede entrar
    # allow 100.88.213.83;
    # deny all;

    client_max_body_size 10M;

    # 1. SERVIR EL FRONTEND (Archivos estáticos de React/Vite)
    # Esta ruta debe coincidir exactamente con donde GitHub Actions deja los archivos
    root /var/www/socket-pubsub-dashboard/dist;
    index index.html;

    location / {
        # Intenta servir el archivo. Si no existe (rutas de React Router), sirve index.html
        try_files $uri $uri/ /index.html;
    }

    # 2. PROXY AL BACKEND (Rust Admin Agent)
    # Cualquier petición que empiece con /api/ se envía a Rust
    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 3. PROXY AL CORE (Socket Pub/Sub - Puerto 3005)
    # Para que el frontend pueda obtener los IDs de los canales
    location /channels {
        proxy_pass http://127.0.0.1:3005;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 4. PROXY WEBSOCKET AL CORE
    # Para que el frontend pueda suscribirse a los eventos en tiempo real
    location /ws {
        proxy_pass http://127.0.0.1:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }


}
deploy@vmi2932254:/etc/nginx/sites-enabled$ cat corriente
# === nginx: Corriente — corriente.seventwo.tech (/ , /admin , /api) ===
# Todo en /srv/infra/corriente, sin Tailscale. Un solo cert para el dominio.

# --- HTTP → HTTPS ---
server {
    listen 80;
    listen [::]:80;
    server_name corriente.seventwo.tech;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name corriente.seventwo.tech;

    ssl_certificate /etc/letsencrypt/live/corriente.seventwo.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/corriente.seventwo.tech/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    client_max_body_size 10M;
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;

    # --- Frontend Astro SSR (corriente-frontend:4321) ---
    location / {
        proxy_pass http://127.0.0.1:4321;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Assets con hash: caché agresiva (si Astro los sirve con /_astro/)
    location /_astro/ {
        proxy_pass http://127.0.0.1:4321;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # --- Admin Vite SPA (estático en /srv/infra/corriente/admin/dist, servido directo) ---
    location = /admin { return 301 /admin/; }
    location /admin/ {
        alias /srv/infra/corriente/admin/dist/;
        index index.html;
        try_files $uri $uri/ /admin/index.html;
    }

    # --- API FastAPI (corriente-api:8000) ---
    location /api/ {
        # /api/ → /api/ en el contenedor (strip del prefijo ya lo hace FastAPI en /subscribers, /articles, etc.
        # nginx quita /api y lo deja como /)
        rewrite ^/api/(.*)$ /$1 break;
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 30s;
        proxy_read_timeout 60s;
    }
}
deploy@vmi2932254:/etc/nginx/sites-enabled$ cat socket-core
# ============================================================
# SOCKET-CORE (pub/sub) - PÚBLICO A PROPÓSITO
# ============================================================

# Redirección HTTP a HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name socket-core.seventwo.tech;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name socket-core.seventwo.tech;

    ssl_certificate /etc/letsencrypt/live/monitoring.seventwo.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/monitoring.seventwo.tech/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    client_max_body_size 10M;

    location / {
        # Apunta a localhost porque en docker-compose mapeamos 127.0.0.1:3005:3005
        proxy_pass http://127.0.0.1:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 🆕 Timeouts generosos para WebSocket
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }
}
deploy@vmi2932254:/etc/nginx/sites-enabled$


deploy@vmi2932254:/etc/nginx$ ls
conf.d        fastcgi_params  koi-win     modules-available  nginx.conf    scgi_params      sites-enabled  uwsgi_params
fastcgi.conf  koi-utf         mime.types  modules-enabled    proxy_params  sites-available  snippets       win-utf
deploy@vmi2932254:/etc/nginx$ cd a
-bash: cd: a: No such file or directory
deploy@vmi2932254:/etc/nginx$ cd sites-available/
deploy@vmi2932254:/etc/nginx/sites-available$ ls
admin-panel  corriente  default  socket-core
deploy@vmi2932254:/etc/nginx/sites-available$ cat admin-panel
# ============================================================
# PANEL ADMIN + FRONTEND - SOLO ACCESIBLE VÍA TAILSCALE
# ============================================================
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name monitoring.seventwo.tech;

    ssl_certificate /etc/letsencrypt/live/monitoring.seventwo.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/monitoring.seventwo.tech/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # 🔒 Capa extra de seguridad: solo tu IP de Tailscale personal puede entrar
    # allow 100.88.213.83;
    # deny all;

    client_max_body_size 10M;

    # 1. SERVIR EL FRONTEND (Archivos estáticos de React/Vite)
    # Esta ruta debe coincidir exactamente con donde GitHub Actions deja los archivos
    root /var/www/socket-pubsub-dashboard/dist;
    index index.html;

    location / {
        # Intenta servir el archivo. Si no existe (rutas de React Router), sirve index.html
        try_files $uri $uri/ /index.html;
    }

    # 2. PROXY AL BACKEND (Rust Admin Agent)
    # Cualquier petición que empiece con /api/ se envía a Rust
    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 3. PROXY AL CORE (Socket Pub/Sub - Puerto 3005)
    # Para que el frontend pueda obtener los IDs de los canales
    location /channels {
        proxy_pass http://127.0.0.1:3005;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 4. PROXY WEBSOCKET AL CORE
    # Para que el frontend pueda suscribirse a los eventos en tiempo real
    location /ws {
        proxy_pass http://127.0.0.1:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }


}
deploy@vmi2932254:/etc/nginx/sites-available$ cat corriente
# === nginx: Corriente — corriente.seventwo.tech (/ , /admin , /api) ===
# Todo en /srv/infra/corriente, sin Tailscale. Un solo cert para el dominio.

# --- HTTP → HTTPS ---
server {
    listen 80;
    listen [::]:80;
    server_name corriente.seventwo.tech;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name corriente.seventwo.tech;

    ssl_certificate /etc/letsencrypt/live/corriente.seventwo.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/corriente.seventwo.tech/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    client_max_body_size 10M;
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;

    # --- Frontend Astro SSR (corriente-frontend:4321) ---
    location / {
        proxy_pass http://127.0.0.1:4321;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Assets con hash: caché agresiva (si Astro los sirve con /_astro/)
    location /_astro/ {
        proxy_pass http://127.0.0.1:4321;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # --- Admin Vite SPA (estático en /srv/infra/corriente/admin/dist, servido directo) ---
    location = /admin { return 301 /admin/; }
    location /admin/ {
        alias /srv/infra/corriente/admin/dist/;
        index index.html;
        try_files $uri $uri/ /admin/index.html;
    }

    # --- API FastAPI (corriente-api:8000) ---
    location /api/ {
        # /api/ → /api/ en el contenedor (strip del prefijo ya lo hace FastAPI en /subscribers, /articles, etc.
        # nginx quita /api y lo deja como /)
        rewrite ^/api/(.*)$ /$1 break;
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 30s;
        proxy_read_timeout 60s;
    }
}
deploy@vmi2932254:/etc/nginx/sites-available$ cat socket-core
# ============================================================
# SOCKET-CORE (pub/sub) - PÚBLICO A PROPÓSITO
# ============================================================

# Redirección HTTP a HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name socket-core.seventwo.tech;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name socket-core.seventwo.tech;

    ssl_certificate /etc/letsencrypt/live/monitoring.seventwo.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/monitoring.seventwo.tech/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    client_max_body_size 10M;

    location / {
        # Apunta a localhost porque en docker-compose mapeamos 127.0.0.1:3005:3005
        proxy_pass http://127.0.0.1:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 🆕 Timeouts generosos para WebSocket
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }
}
deploy@vmi2932254:/etc/nginx/sites-available$
