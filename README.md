# Enterprise RAG — Industrial Automation Platform

![Python](https://img.shields.io/badge/Python-3.10%2B-blue)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688)
![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016-black)
![RAG](https://img.shields.io/badge/Architecture-RAG-purple)
![LLM](https://img.shields.io/badge/LLM-Ollama%20%7C%20Claude%20%7C%20OpenAI-orange)
![Vector DB](https://img.shields.io/badge/VectorDB-FAISS-blueviolet)
![Status](https://img.shields.io/badge/Status-Active-success)

AI-powered industrial operations platform combining Retrieval-Augmented Generation with automated alerting across three real-world use cases: predictive maintenance, driver safety compliance, and customer delivery SLA intelligence.

---

## Use Cases

### UC1 — Predictive Maintenance Operations
Analyzes real machine sensor data (AI4I 2020 dataset — rotational speed, torque, tool wear, temperature) to score each asset by failure risk. Daily automated scan flags HIGH-risk equipment and dispatches email alerts to maintenance managers.

### UC2 — Driver Safety & Compliance Command
Monitors safety incident history and driver performance metrics. Flags drivers with incident spikes, at-fault events, or low on-time rates. Daily scan sends compliance reports to safety officers.

### UC3 — Customer Delivery SLA Intelligence
Tracks delivery performance against SLA commitments using real trip data (Chicago Taxi dataset — 80,000 records). Identifies at-risk and breached customer accounts. Weekly automated SLA report dispatched to account managers.

---

## Architecture

```
Real Datasets (AI4I 2020 + Chicago Taxi)
        ↓
  Data Transform → CSV schema
        ↓
  MiniLM-L6-v2 Embeddings → FAISS Index
        ↓
┌──────────────────────────────────────┐
│           FastAPI Backend            │
│  ┌─────────────┐  ┌───────────────┐  │
│  │ RAG Pipeline│  │  3 Services   │  │
│  │ FAISS + LLM │  │ Maint/Safety/ │  │
│  └─────────────┘  │  Delivery     │  │
│                   └───────────────┘  │
│  ┌─────────────────────────────────┐  │
│  │   APScheduler (automated jobs)  │  │
│  │  Daily maintenance · safety     │  │
│  │  Weekly SLA report              │  │
│  └─────────────────────────────────┘  │
│  ┌─────────────────────────────────┐  │
│  │  Email Connector                │  │
│  │  SMTP  ·  Microsoft Graph API   │  │
│  └─────────────────────────────────┘  │
└──────────────────────────────────────┘
        ↓
  Next.js 16 Dashboard (port 3000)
  Overview · Maintenance · Safety · Delivery · Chat · Settings
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI + Uvicorn |
| Frontend | Next.js 16, Tailwind CSS, Recharts |
| RAG | LangChain, FAISS, MiniLM-L6-v2 |
| LLM | Ollama (default) · Claude API · OpenAI (configurable) |
| Automation | APScheduler (cron jobs) |
| Email | SMTP or Microsoft Graph API (Outlook) |
| Data | AI4I 2020 Predictive Maintenance (UCI) + Chicago Taxi (public API) |

---

## Project Structure

```
enterprise-rag/
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── rag_pipeline.py          # RAG chain (multi-LLM)
│   ├── config.py                # Environment settings
│   ├── scheduler.py             # Automated alert jobs
│   ├── connectors/
│   │   └── email_connector.py   # SMTP + Graph API
│   ├── routers/
│   │   ├── maintenance.py
│   │   ├── safety.py
│   │   ├── delivery.py
│   │   ├── query.py
│   │   └── settings_router.py
│   └── services/
│       ├── maintenance_service.py
│       ├── safety_service.py
│       └── delivery_service.py
├── frontend/                    # Next.js 16 dashboard
│   ├── app/
│   │   ├── page.tsx             # Overview
│   │   ├── maintenance/
│   │   ├── safety/
│   │   ├── delivery/
│   │   ├── chat/
│   │   └── settings/
│   └── components/
│       └── Sidebar.tsx
├── data/
│   └── download_real_data.py    # Dataset download + transform
├── prepare_data.py              # CSV → text documents
├── ingest.py                    # Build FAISS index
├── .env.example
└── requirements.txt             # Legacy (see backend/requirements.txt)
```

---

## Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- [Ollama](https://ollama.com) with a model pulled (e.g. `ollama pull mistral`)

### 1. Clone

```bash
git clone https://github.com/AniketDeshpande-23/enterprise-rag.git
cd enterprise-rag
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — set LLM_PROVIDER, email credentials, alert recipients
```

### 3. Download real datasets

```bash
pip install requests pandas numpy
python data/download_real_data.py
```

### 4. Build vector index

```bash
pip install -r backend/requirements.txt
python prepare_data.py
python ingest.py
```

### 5. Start backend

```bash
uvicorn backend.main:app --port 8001 --reload
```

### 6. Start frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` — API docs at `http://localhost:8001/docs`.

---

## Email Connectors

Set `EMAIL_PROVIDER` in `.env`:

| Value | Description |
|---|---|
| `smtp` | Any SMTP provider (Gmail, Outlook, etc.) via app password |
| `graph_api` | Microsoft Graph API — requires Azure app registration |

Test the connection from the **Connectors** settings page in the dashboard.

---

## Automated Schedules

| Job | Time | Trigger |
|---|---|---|
| Maintenance risk scan | Daily 07:00 | Emails alert if HIGH-risk assets found |
| Safety compliance scan | Daily 07:15 | Emails alert for CRITICAL drivers |
| Customer SLA report | Monday 08:00 | Emails weekly SLA summary |

All jobs can also be triggered manually from each dashboard page.

---

## LLM Configuration

Set `LLM_PROVIDER` in `.env`:

```
LLM_PROVIDER=ollama        # Local — default, free
LLM_PROVIDER=claude        # Anthropic API (CLAUDE_API_KEY required)
LLM_PROVIDER=openai        # OpenAI API (OPENAI_API_KEY required)
```

---

## Datasets

| Dataset | Source | Rows | Use |
|---|---|---|---|
| AI4I 2020 Predictive Maintenance | UCI ML Repository | 10,000 | UC1 Maintenance, UC2 Safety |
| Chicago Taxi Trips | City of Chicago Open Data | 80,000 | UC3 Delivery SLA |

Both downloaded automatically by `data/download_real_data.py`. No authentication required.
