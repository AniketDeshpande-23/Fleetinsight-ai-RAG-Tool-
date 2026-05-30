from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import JsonOutputParser
from .config import settings

PROMPT_TEMPLATE = """
You are an industrial operations intelligence assistant.

Use ONLY the provided context to answer the question.
Respond in VALID JSON only. No markdown. No text outside JSON.

Return this structure:
{{
  "type": "table" | "chart" | "summary",
  "title": "Short descriptive title",
  "summary": "Brief explanation",
  "data": [
    {{"column1": "value", "column2": "value"}}
  ]
}}

Rules:
- Multiple records → type = "table"
- Numeric trend or time-based → type = "chart"
- Explanation only → type = "summary", data = []
- Always include all 4 fields

Context:
{context}

Question:
{question}
"""


def _build_llm():
    provider = settings.LLM_PROVIDER

    if provider == "claude":
        from langchain_anthropic import ChatAnthropic
        return ChatAnthropic(
            model=settings.CLAUDE_MODEL,
            api_key=settings.CLAUDE_API_KEY,
            temperature=0.1,
        )

    if provider == "openai":
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            model=settings.OPENAI_MODEL,
            api_key=settings.OPENAI_API_KEY,
            temperature=0.1,
        )

    # Default: Ollama
    from langchain_community.llms import Ollama
    return Ollama(
        model=settings.OLLAMA_MODEL,
        base_url=settings.OLLAMA_BASE_URL,
        temperature=0.1,
    )


def load_qa_chain():
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    vectorstore = FAISS.load_local(
        settings.VECTOR_PATH,
        embeddings,
        allow_dangerous_deserialization=True,
    )

    retriever = vectorstore.as_retriever(search_kwargs={"k": 6})
    llm = _build_llm()
    parser = JsonOutputParser()
    prompt = ChatPromptTemplate.from_template(PROMPT_TEMPLATE)

    def format_docs(docs):
        return "\n\n".join(doc.page_content for doc in docs)

    return (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | llm
        | parser
    )
