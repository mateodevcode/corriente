# === Plantilla: agradecimiento por suscripción (adaptada al diseño de Corriente) ===
#
# Diseño email-friendly del sistema visual del periódico (inline styles, como
# los ejemplos de emails/): fondo crema, terracota, serif Georgia, kickers
# uppercase y hairlines. Muestra los últimos titulares publicados.

from html import escape

# Tokens de color del prototipo (tailwind.config.js)
CREMA = "#f6f2e5"
TINTA = "#0a151e"
TERRACOTA = "#c84341"
MUTED = "#42525f"
BORDER = "#bfb7a6"
SUPERFICIE = "#fbf8f0"


def gracias_suscripcion(
    email: str, titulares: list[dict], frontend_url: str, token_baja: str = ""
) -> str:
    """HTML del correo de bienvenida.

    titulares: [{titulo, slug, categoria_slug}] — últimos publicados.
    token_baja: JWT del link "darse de baja" (si es vacío no se muestra el botón).
    """
    # Filas de titulares: hairline arriba de cada uno, categoría + título
    filas = ""
    for a in titulares:
        ruta = (
            f"/{a['categoria_slug']}/{a['slug']}" if a.get("categoria_slug") else f"/articulo/{a['slug']}"
        )
        filas += f"""
        <tr>
          <td style="padding: 14px 0; border-top: 1px solid {BORDER};">
            <p style="margin: 0 0 4px; font-size: 11px; font-weight: bold; letter-spacing: 0.18em; text-transform: uppercase; color: {TERRACOTA};">
              {escape(a.get("categoria_nombre") or "Corriente")}
            </p>
            <a href="{frontend_url}{ruta}" style="font-family: Georgia, 'Times New Roman', serif; font-size: 18px; font-weight: bold; color: {TINTA}; text-decoration: none; line-height: 1.3;">
              {escape(a["titulo"])}
            </a>
          </td>
        </tr>"""

    titulares_html = f"""
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 28px;">
      <tr>
        <td style="border-top: 1px solid {BORDER}; padding-top: 18px;">
          <p style="margin: 0; font-size: 11px; font-weight: bold; letter-spacing: 0.18em; text-transform: uppercase; color: {TERRACOTA};">
            Últimos titulares
          </p>
        </td>
      </tr>{filas}
    </table>""" if titulares else ""

    # Botón hairline de baja (solo si hay token): borde tinta, uppercase
    baja_html = ""
    if token_baja:
        baja_html = f"""
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
          <tr>
            <td align="center">
              <a href="{frontend_url}/baja?token={token_baja}"
                 style="display: inline-block; border: 1px solid {TINTA}; padding: 10px 24px; font-family: Arial, Helvetica, sans-serif; font-size: 11px; font-weight: bold; letter-spacing: 0.12em; text-transform: uppercase; color: {TINTA}; text-decoration: none;">
                Darse de baja
              </a>
            </td>
          </tr>
        </table>"""

    return f"""<!doctype html>
<html lang="es">
<body style="margin: 0; padding: 0; background-color: {CREMA};">
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
    Gracias por suscribirte a La Corriente — los últimos titulares.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: {CREMA}; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: {SUPERFICIE}; border: 1px solid {BORDER};">
          <!-- Cabecera del periódico -->
          <tr>
            <td style="padding: 28px 32px 0;">
              <p style="margin: 0 0 6px; font-size: 11px; font-weight: bold; letter-spacing: 0.24em; text-transform: uppercase; color: {MUTED};">
                Periodismo para el mundo que viene
              </p>
              <p style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 28px; font-weight: bold; letter-spacing: -0.04em; color: {TINTA};">
                LA CORRIENTE
              </p>
            </td>
          </tr>
          <!-- Cuerpo -->
          <tr>
            <td style="padding: 24px 32px 32px;">
              <p style="margin: 0 0 14px; font-size: 11px; font-weight: bold; letter-spacing: 0.18em; text-transform: uppercase; color: {TERRACOTA};">
                La carta de Corriente
              </p>
              <h1 style="margin: 0 0 14px; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; font-weight: bold; color: {TINTA}; line-height: 1.1;">
                Gracias por suscribirte.
              </h1>
              <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 15px; color: {MUTED}; line-height: 1.6;">
                Hola {escape(email)}, tu suscripción quedó confirmada. Cada semana
                llegarán a tu correo los titulares y las historias que explican la
                corriente que mueve el mundo — sin ruido, con contexto.
              </p>
              {titulares_html}
              <p style="margin: 28px 0 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: {MUTED}; line-height: 1.6;">
                Si no solicitaste esta suscripción, puedes ignorar este correo.
              </p>
              {baja_html}
              <p style="margin: 20px 0 0; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: {MUTED};">
                © La Corriente · Seventwo
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""
