from fastapi import APIRouter, HTTPException
from app.models.schemas import AgentActionRequest, AgentActionResponse
from app.services import claude_service

router = APIRouter(prefix="/agent", tags=["agent"])


@router.post("/action", response_model=AgentActionResponse)
async def agent_action(req: AgentActionRequest) -> AgentActionResponse:
    try:
        result = await claude_service.execute(req.url, req.action, req.profile)
        return AgentActionResponse(result=result)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
