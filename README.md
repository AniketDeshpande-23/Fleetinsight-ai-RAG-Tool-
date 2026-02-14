#  FleetInsight AI  
### Retrieval-Augmented Logistics Intelligence Assistant (RAG + Smart Dashboard)

FleetInsight AI is an end-to-end **Retrieval-Augmented Generation (RAG)** system that enables natural language querying over structured logistics operations data.

It combines semantic search (**FAISS + MiniLM embeddings**) with a local LLM (**Ollama – Mistral**) and dynamically renders responses as structured tables, charts, or executive summaries.

---

##  Why This Project

Enterprise logistics data is typically stored in structured tables requiring SQL expertise to analyze.

FleetInsight AI allows users to:

- Ask operational questions in natural language  
- Automatically retrieve relevant context  
- Generate structured insights  
- Visualize results dynamically  
- Eliminate manual SQL querying  

---

##  System Architecture

```text
User Query
   ↓
FAISS Semantic Retriever
   ↓
Top-K Relevant Context
   ↓
Local LLM (Ollama - Mistral)
   ↓
Structured JSON Output
   ↓
Dynamic Streamlit Rendering
   → Table
   → Chart
   → Summary
```

---

##  How It Works

### 1️ Data Preparation

**File:** `prepare_data.py`

- Converts structured CSV/Excel files into text documents  
- Limits rows for efficient embedding  
- Prepares data for semantic indexing  

---

### 2️ Vector Indexing

**File:** `ingest.py`

- Generates embeddings using:
  - `sentence-transformers/all-MiniLM-L6-v2`
- Stores vectors in FAISS  
- Enables fast semantic similarity search  

---

### 3️ Retrieval-Augmented Generation

**File:** `rag_pipeline.py`

- Loads FAISS vector store  
- Retrieves top-k relevant chunks  
- Injects context into prompt  
- Queries local LLM via Ollama  
- Returns structured JSON output  

Example structured response:

```json
{
  "type": "table",
  "title": "Accidents by Location",
  "summary": "Accident count grouped by city.",
  "data": [
    {"City": "Chicago", "Incident Count": 4}
  ]
}
```

---

### 4️ Smart UI Rendering

**File:** `app.py`

The UI automatically determines the best visualization format:

| Response Type | UI Behavior |
|---------------|------------|
| `table` | Renders interactive DataFrame |
| `chart` | Renders Line or Bar chart |
| `summary` | Displays structured insight |

Includes fallback handling to prevent raw JSON exposure.

---

##  Key Features

- Retrieval-Augmented Generation (RAG)
- Local LLM (No API cost)
- FAISS vector similarity search
- Structured JSON output
- Dynamic visualization rendering
- Enterprise-style dashboard
- Clean modular architecture

---

##  Example Queries

- Which driver has the highest number of safety incidents?
- Show monthly fuel purchase trends.
- Compare accident counts by city.
- Which truck required the most maintenance?
- List inactive customers.

---

##  Installation

### 1️ Clone Repository

```bash
git clone https://github.com/AniketDeshpande-23/Fleetinsight-ai-RAG-Tool-.git
cd fleetinsight-ai
```

### 2️ Create Virtual Environment

```bash
python -m venv venv
venv\Scripts\activate
```

### 3️ Install Dependencies

```bash
pip install -r requirements.txt
```

### 4️ Install Ollama & Pull Model

Download Ollama from: https://ollama.com

```bash
ollama pull mistral
```

### 5️ Prepare Dataset

Place dataset files inside:

```
data/
```

Then run:

```bash
python prepare_data.py
python ingest.py
```

### 6️ Launch Application

```bash
streamlit run app.py
```

Open:

```
http://localhost:8501
```

---

##  Tech Stack

| Component | Technology |
|-----------|------------|
| LLM | Ollama (Mistral) |
| Embeddings | MiniLM-L6-v2 |
| Vector Database | FAISS |
| Framework | LangChain |
| UI | Streamlit |
| Data Handling | Pandas |

---

##  Project Structure

```text
fleetinsight-ai/
│
├── app.py
├── rag_pipeline.py
├── ingest.py
├── prepare_data.py
├── requirements.txt
├── README.md
├── .gitignore
└── data/ (not included in repo)
```

---

##  Design Decisions

- MiniLM-L6-v2 selected for lightweight embeddings  
- FAISS chosen for high-performance semantic search  
- Ollama used for cost-efficient local inference  
- Structured JSON output ensures UI reliability  
- Smart fallback handling improves user experience  

---

##  Future Enhancements

- Hybrid SQL + RAG querying  
- Multi-turn conversational memory  
- KPI summary dashboard  
- Dockerized deployment  
- Cloud deployment option  

---
