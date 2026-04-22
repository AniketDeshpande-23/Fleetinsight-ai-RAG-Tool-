from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_community.llms import Ollama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import JsonOutputParser

VECTOR_PATH = "vector_store/"

def load_qa_chain():
    # Load embedding model
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    # Load FAISS index
    vectorstore = FAISS.load_local(
        VECTOR_PATH,
        embeddings,
        allow_dangerous_deserialization=True
    )

    retriever = vectorstore.as_retriever(search_kwargs={"k": 4})

    # Local Ollama model
    llm = Ollama(
        model="mistral",
        temperature=0.1  # Lower temp = more consistent JSON
    )

    # Use JsonOutputParser for robust extraction
    parser = JsonOutputParser()

    # 🔥 Structured JSON Prompt
    prompt = ChatPromptTemplate.from_template("""
You are FleetInsight AI, a logistics intelligence assistant.

Use ONLY the provided context to answer the question.

You MUST respond in VALID JSON format only.
Do NOT include markdown.
Do NOT include explanations outside JSON.

Return output in this structure:

{{
  "type": "table" | "chart" | "summary",
  "title": "Short descriptive title",
  "summary": "Brief explanation",
  "data": [
    {{
      "column1": "value",
      "column2": "value"
    }}
  ]
}}

Rules:
- If multiple records are returned → type = "table"
- If numeric trend or time-based values → type = "chart"
- If explanation only → type = "summary" and keep data empty list []
- Always include all 4 fields.
- If no structured data available → return type = "summary"

Context:
{context}

Question:
{question}
""")


    # Convert retrieved docs → text
    def format_docs(docs):
        return "\n\n".join(doc.page_content for doc in docs)

    # RAG pipeline
    rag_chain = (
        {
            "context": retriever | format_docs,
            "question": RunnablePassthrough()
        }
        | prompt
        | llm
        | parser
    )

    return rag_chain

