from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..rag_pipeline import load_qa_chain

router = APIRouter(prefix="/api/query", tags=["query"])

_chain = None


def get_chain():
    global _chain
    if _chain is None:
        _chain = load_qa_chain()
    return _chain


class QueryRequest(BaseModel):
    question: str


@router.post("")
async def query(req: QueryRequest):
    try:
        result = get_chain().invoke(req.question)
        return {"ok": True, "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
