from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import query, maintenance, safety, delivery, settings_router
from .scheduler import start_scheduler

app = FastAPI(
    title="Enterprise RAG — Industrial Automation Platform",
    version="2.0.0",
    description="3 use-case industrial automation: Maintenance, Safety, Delivery SLA",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(query.router)
app.include_router(maintenance.router)
app.include_router(safety.router)
app.include_router(delivery.router)
app.include_router(settings_router.router)

start_scheduler(app)


@app.get("/")
async def root():
    return {
        "name": "Enterprise RAG API v2",
        "use_cases": [
            "UC1: Predictive Maintenance Operations",
            "UC2: Driver Safety & Compliance Command",
            "UC3: Customer SLA & Delivery Intelligence",
        ],
        "docs": "/docs",
    }
