from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import health, openai, maps, firebase, transform, voice, agent, chat, share

app = FastAPI(title="Ditto Accessibility API", version="0.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list(),
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(transform.router)   # /transform  /save-profile  /get-profile
app.include_router(chat.router)        # /chat
app.include_router(voice.router)       # /voice/tts
app.include_router(share.router)       # /share  /share/{id}
app.include_router(agent.router)       # /agent/action
app.include_router(openai.router)
app.include_router(maps.router)
app.include_router(firebase.router)
