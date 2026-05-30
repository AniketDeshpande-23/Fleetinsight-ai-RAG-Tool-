from fastapi import APIRouter, BackgroundTasks, HTTPException
from ..services import maintenance_service
from ..connectors.email_connector import email_connector
from ..config import settings

router = APIRouter(prefix="/api/maintenance", tags=["maintenance"])


@router.get("/risks")
async def get_risks():
    return {"ok": True, "data": maintenance_service.get_maintenance_risks()}


@router.get("/metrics")
async def get_metrics():
    return {"ok": True, "data": maintenance_service.get_metrics()}


@router.post("/trigger-alert")
async def trigger_alert(background_tasks: BackgroundTasks):
    recipient = settings.MAINTENANCE_ALERT_EMAIL
    if not recipient:
        raise HTTPException(status_code=400, detail="MAINTENANCE_ALERT_EMAIL not configured")

    risks = maintenance_service.get_maintenance_risks()
    high_count = sum(1 for r in risks if r["risk_level"] == "HIGH")

    if high_count == 0:
        return {"ok": True, "message": "No high-risk trucks — alert not sent"}

    html = maintenance_service.build_alert_html(risks)
    background_tasks.add_task(
        email_connector.send,
        to=recipient,
        subject=f"[Maintenance Alert] {high_count} High-Risk Trucks Detected",
        html_body=html,
    )
    return {"ok": True, "message": f"Alert dispatched for {high_count} high-risk trucks"}
