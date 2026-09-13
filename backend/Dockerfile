# === Dockerfile del backend FastAPI de Corriente ===

FROM python:3.12-slim

# Evita buffers intermedios en logs
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Directorio de trabajo
WORKDIR /app

# Dependencias primero (capa cacheada)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Código de la aplicación
COPY . .

# Expone la API (uvicorn detrás del reverse proxy nginx)
EXPOSE 8000

# Arranca la API con recarga desactivada (producción)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
