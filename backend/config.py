from pydantic_settings import BaseSettings
from typing import Literal
from pathlib import Path

_ENV_FILE = Path(__file__).parent.parent / ".env"


class Settings(BaseSettings):
    # LLM
    LLM_PROVIDER: Literal["ollama", "claude", "openai"] = "ollama"
    OLLAMA_MODEL: str = "mistral"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    CLAUDE_API_KEY: str = ""
    CLAUDE_MODEL: str = "claude-sonnet-4-6"
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"

    # Email
    EMAIL_PROVIDER: Literal["smtp", "graph_api"] = "smtp"
    # SMTP
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = ""
    # Microsoft Graph API (Outlook)
    AZURE_CLIENT_ID: str = ""
    AZURE_CLIENT_SECRET: str = ""
    AZURE_TENANT_ID: str = ""
    GRAPH_USER_EMAIL: str = ""

    # Alert recipients
    MAINTENANCE_ALERT_EMAIL: str = ""
    SAFETY_ALERT_EMAIL: str = ""
    DELIVERY_ALERT_EMAIL: str = ""

    # Paths (defaults resolve relative to repo root via __file__)
    VECTOR_PATH: str = str(Path(__file__).parent.parent / "vector_store")
    DATA_PATH: str = str(Path(__file__).parent.parent / "data")

    # Risk thresholds
    MAINTENANCE_HIGH_RISK_THRESHOLD: float = 0.65
    SAFETY_INCIDENT_WINDOW_DAYS: int = 30
    SAFETY_LICENSE_WARNING_DAYS: int = 30
    DELIVERY_SLA_MIN_RATE: float = 0.85

    class Config:
        env_file = str(_ENV_FILE)
        env_file_encoding = "utf-8"


settings = Settings()
