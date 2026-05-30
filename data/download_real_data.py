"""
Download real public datasets and transform to app schema.
UC1/UC2: AI4I 2020 Predictive Maintenance (UCI ML Repository)
UC3:     Chicago Taxi Trips (City of Chicago public API)
"""

import io
import json
import zipfile
from pathlib import Path

import numpy as np
import pandas as pd
import requests

OUT = Path(__file__).parent
OUT.mkdir(exist_ok=True)


# ── UC1 & UC2 : AI4I 2020 Predictive Maintenance ─────────────────────────────

def download_ai4i() -> pd.DataFrame:
    print("Downloading AI4I 2020 Predictive Maintenance dataset...")
    url = "https://archive.ics.uci.edu/static/public/601/ai4i+2020+predictive+maintenance+dataset.zip"
    r = requests.get(url, timeout=60)
    r.raise_for_status()
    with zipfile.ZipFile(io.BytesIO(r.content)) as z:
        csv_name = [n for n in z.namelist() if n.endswith(".csv")][0]
        with z.open(csv_name) as f:
            df = pd.read_csv(f)
    print(f"  AI4I rows: {len(df)}")
    return df


def transform_maintenance(df: pd.DataFrame):
    """Map AI4I sensor data → maintenance_records.csv schema."""
    rng = np.random.default_rng(42)

    # Each machine = a truck. Failures = maintenance events.
    # We also synthesize routine scheduled maintenance.
    machines = df["Product ID"].unique()
    machine_idx = {m: i + 1 for i, m in enumerate(machines)}

    base_date = pd.Timestamp("2023-01-01")
    rows = []
    maint_id = 1

    for _, row in df.iterrows():
        mid = machine_idx[row["Product ID"]]
        truck_id = f"TRK{mid:04d}"
        # Map days from UDI (1-10000) across 2023-2024
        day_offset = int(row["UDI"] / 10000 * 730)
        event_date = base_date + pd.Timedelta(days=day_offset)

        # Only create a record if failure OR scheduled maintenance (every ~100 rows)
        is_failure = int(row["Machine failure"]) == 1
        is_scheduled = (int(row["UDI"]) % 90 == 0)
        if not (is_failure or is_scheduled):
            continue

        failure_type = "Scheduled Maintenance"
        if is_failure:
            for ft in ["TWF", "HDF", "PWF", "OSF", "RNF"]:
                if int(row[ft]) == 1:
                    failure_type = {
                        "TWF": "Tool Wear Failure",
                        "HDF": "Heat Dissipation Failure",
                        "PWF": "Power Failure",
                        "OSF": "Overstrain Failure",
                        "RNF": "Random Failure",
                    }[ft]
                    break

        labor_hours = rng.uniform(2, 12)
        labor_cost = labor_hours * rng.uniform(85, 150)
        parts_cost = rng.uniform(200, 8000) if is_failure else rng.uniform(50, 500)
        downtime = rng.uniform(4, 48) if is_failure else rng.uniform(1, 6)

        rows.append({
            "maintenance_id": f"MNT{maint_id:06d}",
            "truck_id": truck_id,
            "maintenance_date": event_date.strftime("%Y-%m-%d"),
            "maintenance_type": "Corrective" if is_failure else "Preventive",
            "odometer_reading": int(row["UDI"]) * 150,
            "labor_hours": round(labor_hours, 2),
            "labor_cost": round(labor_cost, 2),
            "parts_cost": round(parts_cost, 2),
            "total_cost": round(labor_cost + parts_cost, 2),
            "facility_location": rng.choice(["Chicago", "Dallas", "Atlanta", "Phoenix", "Denver"]),
            "downtime_hours": round(downtime, 2),
            "service_description": failure_type,
        })
        maint_id += 1

    out = pd.DataFrame(rows)
    out.to_csv(OUT / "maintenance_records.csv", index=False)
    print(f"  maintenance_records.csv: {len(out)} rows")
    return out


def transform_trucks(df: pd.DataFrame):
    """One truck per unique machine."""
    rng = np.random.default_rng(42)
    machines = df["Product ID"].unique()
    makes = ["Freightliner", "Kenworth", "Peterbilt", "Volvo", "Mack"]
    rows = []
    for i, mid in enumerate(machines):
        rows.append({
            "truck_id": f"TRK{i+1:04d}",
            "unit_number": f"U-{1000+i}",
            "make": rng.choice(makes),
            "model_year": int(rng.integers(2015, 2024)),
            "vin": f"VIN{i+1:010d}",
            "acquisition_date": "2020-01-01",
            "acquisition_mileage": int(rng.integers(0, 50000)),
            "fuel_type": "Diesel",
            "tank_capacity_gallons": 150,
            "status": "Active",
            "home_terminal": rng.choice(["Chicago", "Dallas", "Atlanta"]),
        })
    out = pd.DataFrame(rows)
    out.to_csv(OUT / "trucks.csv", index=False)
    print(f"  trucks.csv: {len(out)} rows")
    return out


def transform_safety(df: pd.DataFrame):
    """AI4I failures → safety_incidents.csv schema."""
    rng = np.random.default_rng(42)
    failures = df[df["Machine failure"] == 1].copy()
    base_date = pd.Timestamp("2023-01-01")
    machines = df["Product ID"].unique()
    machine_idx = {m: i + 1 for i, m in enumerate(machines)}

    rows = []
    for i, (_, row) in enumerate(failures.iterrows()):
        mid = machine_idx[row["Product ID"]]
        day_offset = int(row["UDI"] / 10000 * 730)
        incident_date = base_date + pd.Timedelta(days=day_offset)
        at_fault = int(rng.integers(0, 2))
        rows.append({
            "incident_id": f"INC{i+1:06d}",
            "trip_id": f"TRIP{i+1:06d}",
            "truck_id": f"TRK{mid:04d}",
            "driver_id": f"DRV{rng.integers(1, 150):05d}",
            "incident_date": incident_date.strftime("%Y-%m-%d"),
            "incident_type": rng.choice(["Equipment Failure", "Mechanical Breakdown", "Tire Blowout", "Brake Failure"]),
            "location_city": rng.choice(["Chicago", "Dallas", "Atlanta", "Phoenix", "Denver"]),
            "location_state": rng.choice(["IL", "TX", "GA", "AZ", "CO"]),
            "at_fault_flag": at_fault,
            "injury_flag": int(rng.integers(0, 2)),
            "vehicle_damage_cost": round(float(rng.uniform(500, 50000)), 2),
            "cargo_damage_cost": round(float(rng.uniform(0, 20000)), 2),
            "claim_amount": round(float(rng.uniform(1000, 75000)), 2),
            "preventable_flag": at_fault,
            "description": f"Equipment failure: torque={row['Torque [Nm]']:.1f}Nm, wear={row['Tool wear [min]']}min",
        })
    out = pd.DataFrame(rows)
    out.to_csv(OUT / "safety_incidents.csv", index=False)
    print(f"  safety_incidents.csv: {len(out)} rows")
    return out


def transform_utilization(df: pd.DataFrame):
    """Monthly utilization metrics per machine from AI4I sensor readings."""
    rng = np.random.default_rng(42)
    machines = df["Product ID"].unique()
    machine_idx = {m: i + 1 for i, m in enumerate(machines)}
    df2 = df.copy()
    df2["month_idx"] = ((df2["UDI"] - 1) // 500).clip(0, 23)  # 24 months
    base = pd.Timestamp("2023-01-01")
    rows = []
    for mid in machines:
        sub = df2[df2["Product ID"] == mid]
        for mo, grp in sub.groupby("month_idx"):
            month = (base + pd.DateOffset(months=int(mo))).strftime("%Y-%m")
            rows.append({
                "truck_id": f"TRK{machine_idx[mid]:04d}",
                "month": month,
                "trips_completed": len(grp),
                "total_miles": int(rng.integers(3000, 12000)),
                "total_revenue": round(float(rng.uniform(15000, 60000)), 2),
                "average_mpg": round(float(grp["Rotational speed [rpm]"].mean() / 500), 2),
                "maintenance_events": int(grp["Machine failure"].sum()),
                "maintenance_cost": round(float(grp["Machine failure"].sum() * rng.uniform(500, 5000)), 2),
                "downtime_hours": round(float(grp["Machine failure"].sum() * rng.uniform(4, 24)), 2),
                "utilization_rate": round(float(rng.uniform(0.6, 0.95)), 3),
            })
    out = pd.DataFrame(rows)
    out.to_csv(OUT / "truck_utilization_metrics.csv", index=False)
    print(f"  truck_utilization_metrics.csv: {len(out)} rows")


# ── UC3 : Chicago Taxi Trips → Delivery SLA ──────────────────────────────────

def download_chicago_taxi(limit: int = 80000) -> pd.DataFrame:
    print(f"Downloading {limit} Chicago Taxi trips (public API)...")
    url = (
        "https://data.cityofchicago.org/resource/wrvz-psew.json"
        f"?$limit={limit}"
        "&$where=trip_start_timestamp>'2023-01-01T00:00:00'"
        "&$order=trip_start_timestamp"
    )
    r = requests.get(url, timeout=120)
    r.raise_for_status()
    df = pd.DataFrame(r.json())
    print(f"  Taxi rows: {len(df)}")
    return df


def transform_delivery(taxi: pd.DataFrame):
    """Chicago taxi trips → delivery_events + loads + customers + routes."""
    rng = np.random.default_rng(42)
    taxi = taxi.dropna(subset=["trip_start_timestamp", "trip_end_timestamp"]).copy()
    taxi["trip_start"] = pd.to_datetime(taxi["trip_start_timestamp"])
    taxi["trip_end"] = pd.to_datetime(taxi["trip_end_timestamp"])

    # Create customers from taxi companies
    companies = taxi["company"].dropna().unique() if "company" in taxi.columns else [f"Customer {i}" for i in range(30)]
    customers = []
    for i, co in enumerate(companies[:100]):
        customers.append({
            "customer_id": f"CUST{i+1:04d}",
            "customer_name": str(co),
            "customer_type": rng.choice(["Enterprise", "Mid-Market", "SMB"]),
            "credit_terms_days": int(rng.choice([15, 30, 45, 60])),
            "primary_freight_type": rng.choice(["Dry Van", "Refrigerated", "Flatbed"]),
            "account_status": "Active",
            "contract_start_date": "2023-01-01",
            "annual_revenue_potential": round(float(rng.uniform(50000, 2000000)), 2),
        })
    pd.DataFrame(customers).to_csv(OUT / "customers.csv", index=False)
    print(f"  customers.csv: {len(customers)} rows")

    cust_ids = [c["customer_id"] for c in customers]

    # Build loads and delivery events from taxi trips
    loads, events = [], []
    for i, (_, trip) in enumerate(taxi.iterrows()):
        load_id = f"LOAD{i+1:06d}"
        cust_id = rng.choice(cust_ids)
        revenue = float(trip.get("fare", 0) or 0) * 10  # scale to freight revenue

        loads.append({
            "load_id": load_id,
            "customer_id": cust_id,
            "route_id": f"RTE{rng.integers(1, 60):04d}",
            "load_date": trip["trip_start"].strftime("%Y-%m-%d"),
            "load_type": rng.choice(["Full Truckload", "LTL", "Partial"]),
            "weight_lbs": int(rng.integers(5000, 45000)),
            "pieces": int(rng.integers(1, 50)),
            "revenue": round(max(revenue, 500), 2),
            "fuel_surcharge": round(float(rng.uniform(50, 500)), 2),
            "accessorial_charges": round(float(rng.uniform(0, 200)), 2),
            "load_status": "Delivered",
            "booking_type": rng.choice(["Spot", "Contract"]),
        })

        # Scheduled = pickup time, SLA = 2 days after pickup
        scheduled_delivery = trip["trip_start"] + pd.Timedelta(days=2)
        # Actual = trip end + random delay (some late)
        late_chance = float(rng.uniform(0, 1))
        if late_chance > 0.82:  # 18% late
            delay = pd.Timedelta(hours=float(rng.uniform(4, 72)))
        else:
            delay = pd.Timedelta(hours=float(rng.uniform(-6, 2)))
        actual_delivery = scheduled_delivery + delay
        on_time = 1 if actual_delivery <= scheduled_delivery else 0

        events.append({
            "event_id": f"EVT{i+1:06d}",
            "load_id": load_id,
            "trip_id": f"TRIP{i+1:06d}",
            "event_type": "Delivery",
            "facility_id": f"FAC{rng.integers(1, 20):04d}",
            "scheduled_datetime": scheduled_delivery.strftime("%Y-%m-%d %H:%M:%S"),
            "actual_datetime": actual_delivery.strftime("%Y-%m-%d %H:%M:%S"),
            "detention_minutes": int(rng.integers(0, 120)),
            "on_time_flag": on_time,
            "location_city": trip.get("pickup_community_area", "Chicago"),
            "location_state": "IL",
        })

    pd.DataFrame(loads).to_csv(OUT / "loads.csv", index=False)
    pd.DataFrame(events).to_csv(OUT / "delivery_events.csv", index=False)
    print(f"  loads.csv: {len(loads)} rows")
    print(f"  delivery_events.csv: {len(events)} rows")


def build_drivers_and_metrics():
    """Generate realistic driver data (150 drivers, 24 months metrics)."""
    rng = np.random.default_rng(42)
    first = ["James","Maria","Robert","Patricia","John","Jennifer","Michael","Linda","David","Barbara",
             "William","Elizabeth","Richard","Susan","Joseph","Jessica","Thomas","Sarah","Charles","Karen"]
    last  = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Wilson","Moore",
             "Taylor","Anderson","Thomas","Jackson","White","Harris","Martin","Thompson","Young","Lewis"]

    drivers = []
    for i in range(150):
        hire = pd.Timestamp("2018-01-01") + pd.Timedelta(days=int(rng.integers(0, 1800)))
        drivers.append({
            "driver_id": f"DRV{i+1:05d}",
            "first_name": rng.choice(first),
            "last_name": rng.choice(last),
            "hire_date": hire.strftime("%Y-%m-%d"),
            "termination_date": "",
            "license_number": f"LIC{i+1:08d}",
            "license_state": rng.choice(["IL","TX","GA","AZ","CO","CA","OH","PA"]),
            "date_of_birth": (pd.Timestamp("1970-01-01") + pd.Timedelta(days=int(rng.integers(0, 10000)))).strftime("%Y-%m-%d"),
            "home_terminal": rng.choice(["Chicago","Dallas","Atlanta"]),
            "employment_status": rng.choice(["Active"]*9 + ["Inactive"]),
            "cdl_class": rng.choice(["A","A","A","B"]),
            "years_experience": int(rng.integers(1, 25)),
        })
    pd.DataFrame(drivers).to_csv(OUT / "drivers.csv", index=False)
    print(f"  drivers.csv: {len(drivers)} rows")

    # Monthly metrics
    metrics = []
    for d in drivers:
        for mo in range(24):
            month = (pd.Timestamp("2023-01-01") + pd.DateOffset(months=mo)).strftime("%Y-%m")
            otr = float(rng.uniform(0.70, 0.99))
            metrics.append({
                "driver_id": d["driver_id"],
                "month": month,
                "trips_completed": int(rng.integers(8, 25)),
                "total_miles": int(rng.integers(4000, 12000)),
                "total_revenue": round(float(rng.uniform(12000, 45000)), 2),
                "average_mpg": round(float(rng.uniform(5.5, 8.5)), 2),
                "total_fuel_gallons": int(rng.integers(600, 1800)),
                "on_time_delivery_rate": round(otr, 3),
                "average_idle_hours": round(float(rng.uniform(0.5, 4.0)), 2),
            })
    pd.DataFrame(metrics).to_csv(OUT / "driver_monthly_metrics.csv", index=False)
    print(f"  driver_monthly_metrics.csv: {len(metrics)} rows")


if __name__ == "__main__":
    # UC1 & UC2: AI4I 2020
    ai4i = download_ai4i()
    transform_maintenance(ai4i)
    transform_trucks(ai4i)
    transform_safety(ai4i)
    transform_utilization(ai4i)

    # UC3: Chicago Taxi
    taxi = download_chicago_taxi(limit=80000)
    transform_delivery(taxi)

    # Drivers (shared by UC2 + UC3)
    build_drivers_and_metrics()

    print("\nAll done. Run: python ingest.py")
