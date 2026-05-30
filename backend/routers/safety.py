from fastapi import APIRouter, BackgroundTasks, HTTPException
from ..services import safety_service
from ..connectors.email_connector import email_connector
from ..config import settings

router = APIRouter(prefix="/api/safety", tags=["safety"])


@router.get("/compliance")
async def get_compliance():
    return {"ok": True, "data": safety_service.get_compliance_status()}


@router.get("/metrics")
async def get_metrics():
    return {"ok": True, "data": safety_service.get_metrics()}


@router.post("/trigger-alert")
async def trigger_alert(background_tasks: BackgroundTasks):
    recipient = settings.SAFETY_ALERT_EMAIL
    if not recipient:
        raise HTTPException(status_code=400, detail="SAFETY_ALERT_EMAIL not configured")

    flagged = safety_service.get_compliance_status()
    critical_count = sum(1 for d in flagged if d["compliance_status"] == "CRITICAL")

    if critical_count == 0:
        return {"ok": True, "message": "No critical drivers — alert not sent"}

    html = safety_service.build_alert_html(flagged)
    background_tasks.add_task(
        email_connector.send,
        to=recipient,
        subject=f"[Safety Alert] {critical_count} Drivers Require Immediate Review",
        html_body=html,
    )
    return {"ok": True, "message": f"Safety alert dispatched for {critical_count} critical drivers"}
