from fastapi import APIRouter, HTTPException
from ..connectors.email_connector import email_connector
from ..config import settings

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("/email")
async def get_email_config():
    return {
        "ok": True,
        "provider": settings.EMAIL_PROVIDER,
        "smtp": {
            "host": settings.SMTP_HOST,
            "port": settings.SMTP_PORT,
            "username": settings.SMTP_USERNAME,
            "from_address": settings.SMTP_FROM,
            "configured": bool(settings.SMTP_USERNAME and settings.SMTP_PASSWORD),
        },
        "graph_api": {
            "tenant_id": settings.AZURE_TENANT_ID,
            "client_id": settings.AZURE_CLIENT_ID,
            "user_email": settings.GRAPH_USER_EMAIL,
            "configured": bool(
                settings.AZURE_CLIENT_ID
                and settings.AZURE_CLIENT_SECRET
                and settings.AZURE_TENANT_ID
            ),
        },
        "recipients": {
            "maintenance": settings.MAINTENANCE_ALERT_EMAIL,
            "safety": settings.SAFETY_ALERT_EMAIL,
            "delivery": settings.DELIVERY_ALERT_EMAIL,
        },
    }


@router.post("/email/test")
async def test_email():
    result = email_connector.test_connection()
    if not result["ok"]:
        raise HTTPException(status_code=400, detail=result.get("error", "Connection failed"))
    return {"ok": True, "detail": result}


@router.get("/llm")
async def get_llm_config():
    return {
        "ok": True,
        "provider": settings.LLM_PROVIDER,
        "ollama": {
            "model": settings.OLLAMA_MODEL,
            "base_url": settings.OLLAMA_BASE_URL,
        },
        "claude": {
            "model": settings.CLAUDE_MODEL,
            "configured": bool(settings.CLAUDE_API_KEY),
        },
        "openai": {
            "model": settings.OPENAI_MODEL,
            "configured": bool(settings.OPENAI_API_KEY),
        },
    }
