"""APScheduler — automated daily/weekly scans for all 3 industrial use cases."""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from fastapi import FastAPI

from .services import maintenance_service, safety_service, delivery_service
from .connectors.email_connector import email_connector
from .config import settings

scheduler = AsyncIOScheduler()


async def _daily_maintenance_scan():
    """UC1: Daily truck risk scan → Outlook/SMTP alert if HIGH-risk trucks found."""
    recipient = settings.MAINTENANCE_ALERT_EMAIL
    if not recipient:
        print("[Scheduler] MAINTENANCE_ALERT_EMAIL not set — skipping")
        return

    risks = maintenance_service.get_maintenance_risks()
    high = [r for r in risks if r["risk_level"] == "HIGH"]
    if not high:
        print("[Scheduler] Maintenance scan: no high-risk trucks")
        return

    html = maintenance_service.build_alert_html(risks)
    sent = email_connector.send(
        to=recipient,
        subject=f"[Daily Maintenance Alert] {len(high)} High-Risk Trucks",
        html_body=html,
    )
    print(f"[Scheduler] Maintenance alert sent={sent} to {recipient}")


async def _daily_safety_scan():
    """UC2: Daily driver compliance scan → alert for CRITICAL drivers."""
    recipient = settings.SAFETY_ALERT_EMAIL
    if not recipient:
        print("[Scheduler] SAFETY_ALERT_EMAIL not set — skipping")
        return

    flagged = safety_service.get_compliance_status()
    critical = [d for d in flagged if d["compliance_status"] == "CRITICAL"]
    if not critical:
        print("[Scheduler] Safety scan: no critical drivers")
        return

    html = safety_service.build_alert_html(flagged)
    sent = email_connector.send(
        to=recipient,
        subject=f"[Daily Safety Alert] {len(critical)} Drivers Need Review",
        html_body=html,
    )
    print(f"[Scheduler] Safety alert sent={sent} to {recipient}")


async def _weekly_sla_report():
    """UC3: Weekly SLA summary report → delivery intelligence email."""
    recipient = settings.DELIVERY_ALERT_EMAIL
    if not recipient:
        print("[Scheduler] DELIVERY_ALERT_EMAIL not set — skipping")
        return

    sla = delivery_service.get_sla_status()
    at_risk = delivery_service.get_at_risk_loads()
    html = delivery_service.build_report_html(sla, at_risk)
    sent = email_connector.send(
        to=recipient,
        subject="[Weekly SLA Report] Customer Delivery Intelligence",
        html_body=html,
    )
    print(f"[Scheduler] SLA report sent={sent} to {recipient}")


def start_scheduler(app: FastAPI):
    scheduler.add_job(
        _daily_maintenance_scan,
        CronTrigger(hour=7, minute=0),
        id="daily_maintenance",
        replace_existing=True,
    )
    scheduler.add_job(
        _daily_safety_scan,
        CronTrigger(hour=7, minute=15),
        id="daily_safety",
        replace_existing=True,
    )
    scheduler.add_job(
        _weekly_sla_report,
        CronTrigger(day_of_week="mon", hour=8, minute=0),
        id="weekly_sla",
        replace_existing=True,
    )

    @app.on_event("startup")
    async def _start():
        scheduler.start()
        print("[Scheduler] Started — maintenance@07:00, safety@07:15, SLA@Mon08:00")

    @app.on_event("shutdown")
    async def _stop():
        scheduler.shutdown()
        print("[Scheduler] Stopped")
