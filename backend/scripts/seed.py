# === Seed inicial: categorías, usuario admin de ejemplo, autor ligado y demo ===
# Uso: python -m scripts.seed  (requiere que exista la BD y las migraciones aplicadas)

from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models import Article, Author, Category, User

# Secciones del periódico según especificación del proyecto
CATEGORIAS = [
    ("Política", True),                 # Principal
    ("Tecnología", True),               # Principal
    ("Economía y Negocios", False),     # Secundarias a partir de aquí
    ("Internacional / Mundo", False),
    ("Deportes", False),
    ("Cultura y Entretenimiento", False),
    ("Ciencia y Salud", False),
    ("Opinión / Editorial", False),
    ("Sociedad", False),
    ("Medio Ambiente", False),
    ("Educación", False),
    # NOTA: "Última Hora" NO es una categoría en la BD: es una vista cronológica
    # transversal de todas las secciones (ver frontend /ultima-hora).
]

# Slugs precalculados (deben coincidir con las rutas del frontend)
SLUGS = {
    "Política": "politica",
    "Tecnología": "tecnologia",
    "Economía y Negocios": "economia-y-negocios",
    "Internacional / Mundo": "internacional-mundo",
    "Deportes": "deportes",
    "Cultura y Entretenimiento": "cultura-y-entretenimiento",
    "Ciencia y Salud": "ciencia-y-salud",
    "Opinión / Editorial": "opinion-editorial",
    "Sociedad": "sociedad",
    "Medio Ambiente": "medio-ambiente",
    "Educación": "educacion",
}


def _parr( texto):
    """Envuelve un párrafo en el HTML del WYSIWYG (prosa serif del sitio)."""
    return f"<p>{texto}</p>"


# Artículos demo del prototipo (imágenes Unsplash originales, v0).
# Se reparten en las secciones reales de la BD; el primero (portada) es Tecnología.
# (categoria_slug, kicker, titulo, slug, resumen, parrafos, imagen, horas_atras)
DEMO = [
    (
        "tecnologia", "Innovación",
        "La inteligencia artificial empieza a pensar en pequeño",
        "la-inteligencia-artificial-empieza-a-pensar-en-pequeno",
        "Nuevas herramientas prometen devolvernos el tiempo sin pedirnos que aprendamos un lenguaje nuevo.",
        [
            "Durante una década, la promesa de la inteligencia artificial fue descomunal: sistemas capaces de rehacer industrias enteras de un solo golpe. Pero la ola que está cambiando de verdad la vida cotidiana es la opuesta: modelos pequeños, baratos y especializados que caben en un teléfono y hacen una sola cosa muy bien.",
            "Las nuevas herramientas asumen que el usuario no quiere aprender un lenguaje nuevo, sino recuperar tiempo. Resumen de facturas, agenda de familia, plantillas a medida. La revolución silenciosa de la IA pasa por desaparecer en las rutinas, no por exhibirse.",
            "Los grandes modelos siguen siendo el laboratorio donde nace todo. Pero el producto, el que entra en casa, piensa en pequeño.",
        ],
        "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=85",
        2,
    ),
    (
        "medio-ambiente", "Clima",
        "El bosque que aprendió a guardar agua",
        "el-bosque-que-aprendio-a-guardar-agua",
        "Una comunidad del norte recupera técnicas ancestrales para enfrentar las sequías.",
        [
            "Las sequías cada vez más largas obligaron a una comunidad del norte a mirar hacia atrás: los bosques que rodeaban el pueblo recordaban cómo guardar agua en las capas profundas del terreno.",
            "La recuperación de técnicas ancestrales no es nostalgia, es ingeniería de bajo costo. Zanjas de infiltración, setos vivos y calendarización de lluvias volvieron a conversar con la ciencia moderna.",
            "Los primeros datos del proyecto muestran que la humedad del suelo creció un tercio en dos años.",
        ],
        "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=85",
        8,
    ),
    (
        "politica", "Análisis",
        "La conversación pública cambia de plaza",
        "la-conversacion-publica-cambia-de-plaza",
        "Qué está detrás de la nueva generación de asambleas ciudadanas.",
        [
            "Cuando las instituciones tradicionales pierden centralidad, la conversación no desaparece: se muda. La nueva generación de asambleas ciudadanas reúne a vecinos sorteados al azar para deliberar sobre presupuesto, urbanismo y servicios.",
            "Los defensores del modelo insisten en que sorteo y tiempo son la fórmula: personas comunes con meses de información producen recomendaciones más consistentes que muchos consejos electos.",
            "La pregunta abierta es de escala: lo que funciona en un barrio, ¿puede sostenerse en una ciudad entera?",
        ],
        "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=900&q=85",
        26,
    ),
    (
        "sociedad", "Archivo vivo",
        "Las cartas que cruzaron un continente",
        "las-cartas-que-cruzaron-un-continente",
        "Una colección privada revela otra manera de contar el siglo XX.",
        [
            "En cajas de una finca familiar aparecieron más de mil cartas enviadas entre ambos lados del Atlántico durante medio siglo. Leídas juntas, forman una crónica íntima de las migraciones que ningún manual cuenta.",
            "La colección, ahora digitalizada, cambia la perspectiva de las grandes fechas: guerras y crisis aparecen como pausas en conversaciones domésticas sobre cosechas, bodas y deudas pequeñas.",
            "Archivo vivo: la historia que se conserva cuando nadie pensaba que era historia.",
        ],
        "https://images.unsplash.com/photo-1495433324511-bf8e92934d90?auto=format&fit=crop&w=900&q=85",
        50,
    ),
    (
        "cultura-y-entretenimiento", "Mesa",
        "El maíz también se escribe",
        "el-maiz-tambien-se-escribe",
        "Recetas, territorio y memoria en una cocina que mira hacia adelante.",
        [
            "Detrás de cada receta de maíz hay un mapa: rutas de comercio, fronteras movedizas y memorias familiares que se transmiten a fuego lento. Un nuevo movimiento de cocineras recopila esas historias antes de que se pierdan.",
            "No es una moda de cocina regional: es documentación. Cada plato se registra con su origen, su vocabulario propio y sus variaciones discutidas, casi discutidas a gritos, entre generaciones.",
            "La mesa como archivo y como futuro.",
        ],
        "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=900&q=85",
        74,
    ),
    (
        "educacion", "Aprender",
        "Seis cursos para cambiar de perspectiva",
        "seis-cursos-para-cambiar-de-perspectiva",
        "Selección de clases abiertas para seguir aprendiendo desde cualquier lugar.",
        [
            "Aprender algo nuevo dejó de exigir matrícula y horario. La oferta abierta creció tanto que el problema ya no es acceder, sino elegir. Seis cursos que valen el tiempo, de pensamiento computacional a escritura de ensayos.",
            "El criterio de selección fue simple: cursos con material gratuito, docentes que responden y comunidades activas. El certificado es lo de menos.",
            "La educación permanente es la corriente que no se corta.",
        ],
        "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=85",
        98,
    ),
]


def seed(db: Session):
    # --- Categorías ---
    for nombre, es_principal in CATEGORIAS:
        existe = db.query(Category).filter(Category.slug == SLUGS[nombre]).first()
        if existe is None:
            db.add(Category(
                nombre=nombre,
                slug=SLUGS[nombre],
                es_principal=es_principal,
            ))
            print(f"  + categoría: {nombre}")
    db.commit()

    # --- Usuario admin de ejemplo (credenciales de desarrollo, cambiar en producción) ---
    ADMIN_EMAIL = "admin@corriente.com"
    if db.query(User).filter(User.email == ADMIN_EMAIL).first() is None:
        admin = User(
            email=ADMIN_EMAIL,
            nombre="Administrador",
            rol="admin",
            # ¡CAMBIAR EN PRODUCCIÓN! Documentado en el README
            password_hash=hash_password("corriente2026"),
        )
        db.add(admin)
        db.commit()
        print(f"  + usuario admin: {ADMIN_EMAIL} / corriente2026 (cambiar en producción)")

        # Perfil de autor ligado al admin (para poder crear artículos)
        db.add(Author(
            nombre_publico="Redacción Corriente",
            bio="Redacción oficial del periódico.",
            user_id=admin.id,
        ))
        db.commit()
        print("  + autor: Redacción Corriente (ligado al admin)")

    # --- Lector de ejemplo (para probar comentarios en el sitio público) ---
    LECTOR_EMAIL = "lector@corriente.com"
    if db.query(User).filter(User.email == LECTOR_EMAIL).first() is None:
        db.add(User(
            email=LECTOR_EMAIL,
            nombre="Lector de Prueba",
            rol="lector",
            password_hash=hash_password("lector2026"),
        ))
        db.commit()
        print(f"  + usuario lector: {LECTOR_EMAIL} / lector2026 (prueba de comentarios)")

    # --- Artículos demo del prototipo (solo si no existen; idempotente) ---
    autor = db.query(Author).filter(Author.user_id.isnot(None)).first()
    ahora = datetime.now(timezone.utc)
    agregados = 0
    for cat_slug, kicker, titulo, slug, resumen, parrafos, imagen, horas in DEMO:
        if db.query(Article).filter(Article.slug == slug).first() is not None:
            continue
        categoria = db.query(Category).filter(Category.slug == cat_slug).first()
        if categoria is None or autor is None:
            continue
        db.add(Article(
            titulo=titulo,
            slug=slug,
            resumen=f"{kicker} — {resumen}",
            contenido="\n".join(_parr(p) for p in parrafos),
            imagen_portada_url=imagen,
            estado="publicado",
            fecha_publicacion=ahora - timedelta(hours=horas),
            author_id=autor.id,
            category_id=categoria.id,
        ))
        print(f"  + artículo demo: {titulo}")
        agregados += 1
    if agregados:
        db.commit()
    print("Seed completado.")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        print("Ejecutando seed inicial de Corriente...")
        seed(db)
    finally:
        db.close()
