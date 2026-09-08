from fastapi import APIRouter, HTTPException

from app.models.schemas import OpenAIRequest, OpenAIResponse
from app.services import openai_service

router = APIRouter(prefix="/openai", tags=["openai"])


@router.post("/generate", response_model=OpenAIResponse)
async def generate(req: OpenAIRequest) -> OpenAIResponse:
    try:
        text = await openai_service.generate(req.prompt, req.system_prompt)
        return OpenAIResponse(text=text)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
