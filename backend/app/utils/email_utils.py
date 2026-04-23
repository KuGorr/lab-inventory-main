import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr
import os

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER)


def send_reset_email(to_email: str, reset_link: str):
    subject = "Reset hasła – Lab Inventory"

    html = f"""
    <html>
      <body>
        <p>Cześć!</p>
        <p>Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta.</p>
        <p>Kliknij poniższy link, aby ustawić nowe hasło:</p>
        <p><a href="{reset_link}">{reset_link}</a></p>
        <p>Jeśli to nie Ty wysłałeś prośbę, zignoruj tę wiadomość.</p>
        <br>
        <p>Pozdrawiamy,<br>Lab Inventory</p>
      </body>
    </html>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = formataddr(("Lab Inventory", SMTP_FROM))
    msg["To"] = to_email

    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_FROM, to_email, msg.as_string())
