"""Email connector — supports SMTP and Microsoft Graph API (Outlook)."""

import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional
import requests
from ..config import settings


class EmailConnector:
    def send(self, to: str, subject: str, html_body: str, text_body: Optional[str] = None) -> bool:
        if settings.EMAIL_PROVIDER == "graph_api":
            return self._send_graph(to, subject, html_body, text_body)
        return self._send_smtp(to, subject, html_body, text_body)

    # ── SMTP ──────────────────────────────────────────────────────────────────

    def _send_smtp(self, to: str, subject: str, html_body: str, text_body: Optional[str]) -> bool:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_FROM or settings.SMTP_USERNAME
        msg["To"] = to

        if text_body:
            msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        context = ssl.create_default_context()
        try:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.ehlo()
                server.starttls(context=context)
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                server.sendmail(msg["From"], to, msg.as_string())
            return True
        except Exception as e:
            print(f"[SMTP] Send failed: {e}")
            return False

    def test_smtp(self) -> dict:
        required = [settings.SMTP_USERNAME, settings.SMTP_PASSWORD, settings.SMTP_HOST]
        if not all(required):
            return {"ok": False, "error": "SMTP credentials not configured"}
        try:
            context = ssl.create_default_context()
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.ehlo()
                server.starttls(context=context)
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            return {"ok": True, "provider": "smtp", "host": settings.SMTP_HOST}
        except Exception as e:
            return {"ok": False, "error": str(e)}

    # ── Microsoft Graph API ───────────────────────────────────────────────────

    def _get_graph_token(self) -> Optional[str]:
        url = f"https://login.microsoftonline.com/{settings.AZURE_TENANT_ID}/oauth2/v2.0/token"
        data = {
            "grant_type": "client_credentials",
            "client_id": settings.AZURE_CLIENT_ID,
            "client_secret": settings.AZURE_CLIENT_SECRET,
            "scope": "https://graph.microsoft.com/.default",
        }
        try:
            resp = requests.post(url, data=data, timeout=10)
            resp.raise_for_status()
            return resp.json().get("access_token")
        except Exception as e:
            print(f"[Graph] Token fetch failed: {e}")
            return None

    def _send_graph(self, to: str, subject: str, html_body: str, text_body: Optional[str]) -> bool:
        token = self._get_graph_token()
        if not token:
            return False

        payload = {
            "message": {
                "subject": subject,
                "body": {"contentType": "HTML", "content": html_body},
                "toRecipients": [{"emailAddress": {"address": to}}],
            },
            "saveToSentItems": True,
        }

        url = f"https://graph.microsoft.com/v1.0/users/{settings.GRAPH_USER_EMAIL}/sendMail"
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        try:
            resp = requests.post(url, json=payload, headers=headers, timeout=15)
            resp.raise_for_status()
            return True
        except Exception as e:
            print(f"[Graph] Send failed: {e}")
            return False

    def test_graph(self) -> dict:
        required = [settings.AZURE_CLIENT_ID, settings.AZURE_CLIENT_SECRET,
                    settings.AZURE_TENANT_ID, settings.GRAPH_USER_EMAIL]
        if not all(required):
            return {"ok": False, "error": "Azure credentials not configured"}
        token = self._get_graph_token()
        if token:
            return {"ok": True, "provider": "graph_api", "user": settings.GRAPH_USER_EMAIL}
        return {"ok": False, "error": "Token acquisition failed — check Azure credentials"}

    def test_connection(self) -> dict:
        if settings.EMAIL_PROVIDER == "graph_api":
            return self.test_graph()
        return self.test_smtp()


email_connector = EmailConnector()
