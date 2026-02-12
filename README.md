🚚 FleetInsight AI
Retrieval-Augmented Logistics Intelligence Assistant (RAG + Smart Dashboard)










FleetInsight AI is an end-to-end Retrieval-Augmented Generation (RAG) system that enables natural language querying over structured logistics operations data.

It combines semantic search (FAISS + MiniLM embeddings) with a local LLM (Ollama – Mistral) and dynamically renders responses as structured tables, charts, or executive summaries.

🎯 Why This Project

Enterprise logistics data is typically stored in structured tables requiring SQL expertise to analyze.

FleetInsight AI allows users to:

Ask operational questions in natural language

Automatically retrieve relevant context

Generate structured insights

Visualize results dynamically

No SQL required.

🧠 System Architecture
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

⚙️ How It Works
1️⃣ Data Preparation

prepare_data.py

Converts structured CSV/Excel files into text documents

Limits rows for efficient embedding

Prepares data for semantic indexing

2️⃣ Vector Indexing

ingest.py

Generates embeddings using:

sentence-transformers/all-MiniLM-L6-v2

Stores vectors in FAISS

Enables fast similarity search

3️⃣ Retrieval-Augmented Generation

rag_pipeline.py

Loads FAISS vector store

Retrieves top-k relevant chunks

Injects context into prompt

Queries local LLM via Ollama

Returns structured JSON output

Example structured response:

{
  "type": "table",
  "title": "Accidents by Location",
  "summary": "Accident count grouped by city.",
  "data": [
    {"City": "Chicago", "Incident Count": 4}
  ]
}

4️⃣ Smart UI Rendering

app.py

The UI automatically decides how to display output:

Response Type	UI Behavior
table	Renders DataFrame with KPI metrics
chart	Renders Line or Bar chart
summary	Displays structured insight

Includes fallback logic to prevent raw JSON exposure.

✨ Key Features

✔ Retrieval-Augmented Generation (RAG)
✔ Local LLM (No API cost)
✔ FAISS vector search
✔ Structured JSON output
✔ Dynamic visualization rendering
✔ Graceful error handling
✔ Enterprise-style dashboard

📊 Example Queries

Which driver has the highest number of safety incidents?

Show monthly fuel purchase trends.

Compare accident counts by city.

Which truck required the most maintenance?

List inactive customers.

🚀 Installation
1️⃣ Clone Repository
git clone https://github.com/YOUR_USERNAME/fleetinsight-ai.git
cd fleetinsight-ai

2️⃣ Create Virtual Environment
python -m venv venv
venv\Scripts\activate

3️⃣ Install Dependencies
pip install -r requirements.txt

4️⃣ Install Ollama & Pull Model

Download Ollama:
https://ollama.com

ollama pull mistral

5️⃣ Prepare Dataset

Place dataset files inside:

data/


Then run:

python prepare_data.py
python ingest.py

6️⃣ Launch Application
streamlit run app.py


Open:

http://localhost:8501

📁 Project Structure
fleetinsight-ai/
│
├── app.py
├── rag_pipeline.py
├── ingest.py
├── prepare_data.py
├── requirements.txt
├── README.md
├── .gitignore
└── data/ (not included)

📌 Design Decisions

MiniLM-L6-v2 chosen for lightweight, efficient embeddings

FAISS selected for high-performance vector similarity search

Ollama (Mistral) used for cost-efficient local LLM inference

Structured JSON output ensures UI reliability

Fallback handling prevents raw response exposure

🔮 Future Enhancements

Hybrid SQL + RAG querying

Multi-turn conversation memory

KPI summary dashboard

Dockerized deployment

Cloud deployment option

🛠 Tech Stack

Python

LangChain

FAISS

sentence-transformers

Ollama

Streamlit

Pandas