FROM python:3.12-slim

WORKDIR /app

# System deps for faiss-cpu and torch
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy project source
COPY backend/ /app/backend/
COPY prepare_data.py ingest.py /app/
COPY .env.example /app/.env.example

# Data and vector store are mounted as volumes at runtime
# See docker-compose.yml

EXPOSE 8001

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8001"]
