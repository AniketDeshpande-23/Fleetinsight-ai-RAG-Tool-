"""UC3 — Customer SLA & Delivery Intelligence: monitors SLA performance and at-risk loads."""

import pandas as pd
from pathlib import Path
from datetime import timedelta
from typing import Any
from ..config import settings


def _load(filename: str) -> pd.DataFrame:
    return pd.read_csv(Path(settings.DATA_PATH) / filename)


def get_sla_status() -> list[dict[str, Any]]:
    """SLA on-time rate per customer for the last 30 days."""
    events = _load("delivery_events.csv")
    loads = _load("loads.csv")
    customers = _load("customers.csv")

    events["actual_datetime"] = pd.to_datetime(events["actual_datetime"])
    ref = events["actual_datetime"].max()
    cutoff = ref - timedelta(days=30)
    recent = events[events["actual_datetime"] >= cutoff]

    deliveries = recent[recent["event_type"] == "Delivery"]

    load_cust = loads[["load_id", "customer_id", "revenue"]].merge(
        customers[["customer_id", "customer_name", "account_status"]], on="customer_id"
    )

    merged = deliveries.merge(load_cust, on="load_id", how="left")
    merged = merged[merged["account_status"] == "Active"]

    sla = (
        merged.groupby(["customer_id", "customer_name"])
        .agg(
            total_deliveries=("event_id", "count"),
            on_time=("on_time_flag", "sum"),
            total_revenue=("revenue", "sum"),
        )
        .reset_index()
    )

    sla["on_time_rate"] = (sla["on_time"] / sla["total_deliveries"]).round(3)

    def _health(rate: float) -> str:
        if rate >= settings.DELIVERY_SLA_MIN_RATE:
            return "HEALTHY"
        if rate >= 0.70:
            return "AT_RISK"
        return "BREACHED"

    sla["sla_health"] = sla["on_time_rate"].apply(_health)
    sla = sla.sort_values("on_time_rate")

    return sla.to_dict(orient="records")


def get_at_risk_loads() -> list[dict[str, Any]]:
    """Loads in the last 7 days that were delivered late."""
    events = _load("delivery_events.csv")
    loads = _load("loads.csv")
    customers = _load("customers.csv")

    events["actual_datetime"] = pd.to_datetime(events["actual_datetime"])
    ref = events["actual_datetime"].max()
    cutoff = ref - timedelta(days=7)
    recent = events[
        (events["actual_datetime"] >= cutoff)
        & (events["event_type"] == "Delivery")
        & (events["on_time_flag"] == 0)
    ]

    load_cust = loads[["load_id", "customer_id", "revenue", "load_status"]].merge(
        customers[["customer_id", "customer_name"]], on="customer_id"
    )

    merged = recent.merge(load_cust, on="load_id", how="left")

    result = merged[[
        "event_id", "load_id", "customer_name", "actual_datetime",
        "location_city", "location_state", "revenue",
    ]].copy()
    result["actual_datetime"] = result["actual_datetime"].dt.strftime("%Y-%m-%d %H:%M")

    return result.to_dict(orient="records")


def get_metrics() -> dict[str, Any]:
    events = _load("delivery_events.csv")
    events["actual_datetime"] = pd.to_datetime(events["actual_datetime"])
    ref = events["actual_datetime"].max()
    cutoff = ref - timedelta(days=30)
    recent = events[
        (events["actual_datetime"] >= cutoff) & (events["event_type"] == "Delivery")
    ]

    sla = get_sla_status()
    breached = sum(1 for s in sla if s["sla_health"] == "BREACHED")
    at_risk = sum(1 for s in sla if s["sla_health"] == "AT_RISK")

    overall_rate = float(recent["on_time_flag"].mean()) if len(recent) else 0.0

    return {
        "deliveries_30d": int(len(recent)),
        "overall_on_time_rate": round(overall_rate, 3),
        "breached_customers": breached,
        "at_risk_customers": at_risk,
        "total_customers": len(sla),
        "late_loads_7d": len(get_at_risk_loads()),
    }


def build_report_html(sla: list[dict], at_risk: list[dict]) -> str:
    sla_rows = "".join(
        f"""<tr style="background:{'#ffeaea' if s['sla_health']=='BREACHED' else '#fff8e1' if s['sla_health']=='AT_RISK' else '#f0fff0'}">
          <td style="padding:8px;border:1px solid #ddd">{s['customer_name']}</td>
          <td style="padding:8px;border:1px solid #ddd">{int(s['total_deliveries'])}</td>
          <td style="padding:8px;border:1px solid #ddd">{s['on_time_rate']*100:.1f}%</td>
          <td style="padding:8px;border:1px solid #ddd">${s.get('total_revenue',0):,.0f}</td>
          <td style="padding:8px;border:1px solid #ddd;font-weight:bold">{s['sla_health']}</td>
        </tr>"""
        for s in sla
    )

    return f"""
    <html><body style="font-family:Arial,sans-serif">
    <h2 style="color:#2980b9">&#128666; Customer SLA Weekly Report</h2>
    <h3>SLA Performance by Customer (last 30 days)</h3>
    <table style="border-collapse:collapse;width:100%">
      <tr style="background:#f2f2f2">
        <th style="padding:8px;border:1px solid #ddd">Customer</th>
        <th style="padding:8px;border:1px solid #ddd">Deliveries</th>
        <th style="padding:8px;border:1px solid #ddd">On-Time Rate</th>
        <th style="padding:8px;border:1px solid #ddd">Revenue</th>
        <th style="padding:8px;border:1px solid #ddd">SLA Health</th>
      </tr>
      {sla_rows}
    </table>
    <h3>Late Deliveries (last 7 days): {len(at_risk)}</h3>
    <p style="color:#666;font-size:12px">Generated by Enterprise RAG — Customer SLA Intelligence</p>
    </body></html>
    """
