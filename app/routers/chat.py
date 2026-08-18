from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services import chat_service

router = APIRouter(tags=["chat"])


class ChatMessage(BaseModel):
    role: str
    text: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1)
    preferences: dict = Field(default_factory=dict)


class ChatResponse(BaseModel):
    reply: str


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest) -> ChatResponse:
    try:
        reply = await chat_service.chat(
            [m.model_dump() for m in req.messages],
            req.preferences,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return ChatResponse(reply=reply.strip())
