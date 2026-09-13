# === Dockerfile del frontend Astro SSR de Corriente ===
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Variables de build para producción (corriente.seventwo.tech + /admin + /api)
ENV PUBLIC_API_URL=https://corriente.seventwo.tech/api
ENV PUBLIC_SITE_URL=https://corriente.seventwo.tech
RUN npm run build
EXPOSE 4321
CMD ["node", "dist/server/entry.mjs"]
