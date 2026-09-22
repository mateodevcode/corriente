# === Bloques estructurados → HTML derivado ===
import html
import re
import bleach

ALLOWED_TAGS = ["p", "h2", "h3", "h4", "strong", "em", "u", "a", "ul", "ol", "li", "blockquote", "hr", "br", "figure", "figcaption", "div", "span"]
ALLOWED_ATTRS = {"a": ["href", "target", "rel"], "figure": ["class"], "img": ["src", "alt"], "div": ["class"], "span": ["class"]}

def _sanitize_html(raw: str) -> str:
    if not raw:
        return ""
    # bleach limpia tags no permitidos pero preserva estructura básica
    return bleach.clean(raw, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRS, strip=True)

def _esc(s: str) -> str:
    return html.escape(s or "", quote=True)

def bloque_a_html(b: dict) -> str:
    tipo = b.get("tipo")
    data = b.get("data") or {}
    if tipo == "parrafo":
        return _sanitize_html(data.get("html") or "")
    if tipo == "encabezado":
        nivel = 2 if data.get("nivel") not in (2,3,4) else data["nivel"]
        return f"<h{nivel}>{_esc(data.get('texto',''))}</h{nivel}>"
    if tipo == "imagen":
        url = _esc(data.get("url",""))
        if not url:
            return ""
        alt = _esc(data.get("alt",""))
        epi = _esc(data.get("epigrafe",""))
        cls = "half" if data.get("posicion") == "half" else "full"
        fig = f'<figure class="bloque-imagen bloque-imagen--{cls}"><img src="{url}" alt="{alt}" loading="lazy" /><figcaption>{epi}</figcaption></figure>' if epi else f'<figure class="bloque-imagen bloque-imagen--{cls}"><img src="{url}" alt="{alt}" loading="lazy" /></figure>'
        return fig
    if tipo == "paso":
        num = data.get("numero") or ""
        titulo = _esc(data.get("titulo_paso",""))
        texto = _sanitize_html(data.get("texto",""))
        url = _esc(data.get("imagen_url",""))
        img = f'<img src="{url}" alt="" loading="lazy" />' if url else ""
        head = f'<div class="paso-numero">Paso {num}</div>' if num else ""
        if titulo:
            head += f'<h4 class="paso-titulo">{titulo}</h4>'
        return f'<div class="bloque-paso">{head}<div class="paso-grid">{img}<div class="paso-texto">{texto}</div></div></div>'
    if tipo == "cita":
        texto = _esc(data.get("texto",""))
        autor = _esc(data.get("autor",""))
        cite = f"<cite>— {autor}</cite>" if autor else ""
        return f"<blockquote>{texto}{cite}</blockquote>"
    if tipo == "lista":
        items = data.get("items") or []
        tag = "ol" if data.get("estilo") == "ol" else "ul"
        lis = "".join(f"<li>{_esc(i)}</li>" for i in items if i)
        return f"<{tag}>{lis}</{tag}>"
    if tipo == "separador":
        return "<hr />"
    return ""

def bloques_a_html(bloques: list | None) -> str:
    if not bloques:
        return ""
    parts = [bloque_a_html(b) for b in bloques]
    # filtrar vacíos y unir con newline
    return "\n".join(p for p in parts if p)
