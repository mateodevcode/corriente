# === Transporte SMTP de Corriente (Brevo, replica de createTransporter.js) ===
#
# Usa smtplib de la stdlib: cero dependencias nuevas. Mismo comportamiento que
# el ejemplo de nodemailer → smtp-relay.brevo.com:587 (STARTTLS, sin SSL directo).

import smtplib
from email.message import EmailMessage

from app.core.config import settings

SMTP_HOST = "smtp-relay.brevo.com"
SMTP_PORT = 587


class BrevoTransporter:
    """Envío transaccional vía Brevo (SMTP relay)."""

    def __init__(self):
        self._host = SMTP_HOST
        self._port = SMTP_PORT
        self._user = settings.BREVO_SMTP_EMAIL
        self._pass = settings.BREVO_SMTP_PASS
        self._from = settings.BREVO_EMAIL_NO_REPLY

    def enviar(self, para: str, asunto: str, html: str) -> None:
        """Envía un correo HTML. Lanza smtplib.SMTPException ante fallos."""
        msg = EmailMessage()
        msg["From"] = f"La Corriente <{self._from}>"
        msg["To"] = para
        msg["Subject"] = asunto
        msg.set_content("Abre este correo en un cliente que soporte HTML.")
        msg.add_alternative(html, subtype="html")

        with smtplib.SMTP(self._host, self._port, timeout=20) as server:
            server.starttls()
            server.login(self._user, self._pass)
            server.send_message(msg)


def create_transporter() -> BrevoTransporter:
    """Fábrica del transporter (análogo a createTransporter() del ejemplo)."""
    return BrevoTransporter()
