from fastapi import APIRouter, BackgroundTasks, HTTPException
from ..services import delivery_service
from ..connectors.email_connector import email_connector
from ..config import settings

router = APIRouter(prefix="/api/delivery", tags=["delivery"])


@router.get("/sla")
async def get_sla():
    return {"ok": True, "data": delivery_service.get_sla_status()}


@router.get("/at-risk")
async def get_at_risk():
    return {"ok": True, "data": delivery_service.get_at_risk_loads()}


@router.get("/metrics")
async def get_metrics():
    return {"ok": True, "data": delivery_service.get_metrics()}


@router.post("/trigger-report")
async def trigger_report(background_tasks: BackgroundTasks):
    recipient = settings.DELIVERY_ALERT_EMAIL
    if not recipient:
        raise HTTPException(status_code=400, detail="DELIVERY_ALERT_EMAIL not configured")

    sla = delivery_service.get_sla_status()
    at_risk = delivery_service.get_at_risk_loads()
    html = delivery_service.build_report_html(sla, at_risk)
    background_tasks.add_task(
        email_connector.send,
        to=recipient,
        subject="[SLA Report] Weekly Customer Delivery Intelligence",
        html_body=html,
    )
    return {"ok": True, "message": "SLA report dispatched"}
