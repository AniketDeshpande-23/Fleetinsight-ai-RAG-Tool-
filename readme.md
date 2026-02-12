🚚 FleetInsight AI
Intelligent Logistics Analytics Assistant (RAG + Smart Dashboard)

FleetInsight AI is a Retrieval-Augmented Generation (RAG) based analytics system that enables natural language querying over structured logistics operations data.

It combines semantic retrieval, a local LLM, and dynamic UI rendering to transform raw operational datasets into actionable business insights.

🎯 Project Overview

This project demonstrates how enterprises can build AI-powered analytics assistants over internal operational databases such as:

Drivers

Trips

Trucks

Fuel Purchases

Safety Incidents

Delivery Events

Instead of manually writing SQL queries, users can ask natural language questions and receive:

📋 Structured tables

📊 Intelligent charts

🧠 Operational summaries

The system automatically decides the best visualization format based on the query.

🧠 Core Capabilities
🔎 Retrieval-Augmented Generation (RAG)

Semantic search using FAISS

Document embeddings via MiniLM-L6-v2

Context-aware answers using a local LLM (Ollama – Mistral)

📊 Intelligent UI Rendering

The assistant dynamically selects output format:

Query Type	Output
Multiple records	Data table
Numeric trends	Line/Bar chart
Explanatory queries	Structured summary
🏢 Enterprise Simulation

Built using a realistic logistics operations dataset to simulate enterprise-grade analytics use cases.

🏗 Architecture
User Query
   ↓
Semantic Retriever (FAISS + MiniLM Embeddings)
   ↓
Context Injection
   ↓
Local LLM (Ollama - Mistral)
   ↓
Structured JSON Output
   ↓
Dynamic Streamlit Renderer (Table / Chart / Summary)

📂 Project Structure
fleetinsight-ai/
│
├── app.py                # Streamlit UI + Smart Rendering
├── rag_pipeline.py       # RAG logic + Structured Output
├── ingest.py             # FAISS index builder
├── prepare_data.py       # Converts structured tables to text docs
├── data/                 # Logistics datasets
├── vector_store/         # Generated FAISS index
└── requirements.txt

⚙️ Setup Instructions
1️⃣ Clone the repository
git clone https://github.com/yourusername/fleetinsight-ai.git
cd fleetinsight-ai

2️⃣ Create a virtual environment
python -m venv venv
venv\Scripts\activate

3️⃣ Install dependencies
pip install -r requirements.txt

4️⃣ Install Ollama and pull model

Download Ollama:
https://ollama.com

ollama pull mistral

5️⃣ Prepare dataset
python prepare_data.py

6️⃣ Build vector index
python ingest.py

7️⃣ Run application
streamlit run app.py

💬 Example Queries

Which driver has the highest number of safety incidents?

What are the most frequent delivery routes?

Which truck required the most maintenance?

Show monthly fuel purchase trends.

Which facilities handle the highest trip volume?

🛠 Tech Stack

Python

LangChain

FAISS

sentence-transformers (MiniLM)

Ollama (Mistral LLM)

Streamlit

Pandas

🚀 Why This Project Matters

FleetInsight AI demonstrates:

Practical implementation of Retrieval-Augmented Generation

Structured LLM output for reliable UI integration

Enterprise-style analytics over operational datasets

Cost-efficient local LLM deployment (no API costs)

It reflects real-world AI system design for logistics and supply chain intelligence.

📈 Future Improvements

KPI metric dashboard

Downloadable reports

Hybrid SQL + RAG querying

Multi-turn conversational memory