from pydantic import BaseModel, Field
from typing import Any, Literal


class OpenAIRequest(BaseModel):
    prompt: str
    system_prompt: str | None = None


class OpenAIResponse(BaseModel):
    text: str


class MapsGeocodeRequest(BaseModel):
    address: str


class MapsNearbyRequest(BaseModel):
    location: str   # "lat,lng"
    keyword: str
    radius_meters: int = 1000


class MapsResult(BaseModel):
    name: str
    address: str
    lat: float
    lng: float
    rating: float | None = None
    extra: dict[str, Any] = {}


# ── Transform ──────────────────────────────────────────────────────────────────

DisabilityType = Literal[
    "blind", "dyslexia", "deaf", "elderly", "adhd", "low_vision", "tremor", "none"
]


class TransformProfile(BaseModel):
    disability: DisabilityType = "none"
    age: int = 30
    country: str = "US"
    name: str = ""
    simplify_language: bool = False
    complexity: int = 3  # 1–5


class TransformRequest(BaseModel):
    url: str
    profile: TransformProfile = TransformProfile()
    uid: str | None = None  # when set, logs this transform to the user's history


class TransformResponse(BaseModel):
    transformed_html: str
    original_url: str
    profile: TransformProfile
    compliance_note: str | None = None
    content_level: str = "safe"        # safe | mild | hardcore
    before_score: dict[str, Any] = {}  # accessibility score of original page
    after_score: dict[str, Any] = {}   # accessibility score of rebuilt page
    original_html: str = ""            # cleaned source content, for compare view


# ── Profile persistence ───────────────────────────────────────────────────────

class SaveProfileRequest(BaseModel):
    uid: str
    profile: dict[str, Any]


class HistoryItem(BaseModel):
    url: str
    disability: DisabilityType = "none"
    content_level: str = "safe"
    created_at: float
    before_score_total: float | None = None
    after_score_total: float | None = None


# ── Batch transform ───────────────────────────────────────────────────────────

class BatchTransformRequest(BaseModel):
    urls: list[str]
    profile: TransformProfile = TransformProfile()
    uid: str | None = None


class BatchTransformResult(BaseModel):
    url: str
    success: bool
    error: str | None = None
    transformed_html: str = ""
    content_level: str = "safe"
    before_score: dict[str, Any] = {}
    after_score: dict[str, Any] = {}


class BatchTransformResponse(BaseModel):
    results: list[BatchTransformResult]


# ── School pilot scaffold ─────────────────────────────────────────────────────

class PilotReadingListRequest(BaseModel):
    name: str
    urls: list[str]
    profile_categories: list[str] = Field(default_factory=list)
    reviewer: str = ""


class PilotReadingItem(BaseModel):
    url: str
    status: Literal["ready", "blocked"]
    error: str | None = None
    approved_domain: str | None = None
    profile_categories: list[str] = Field(default_factory=list)
    before_score_total: float | None = None
    after_score_total: float | None = None


class PilotReadingListResponse(BaseModel):
    pilot_id: str
    name: str
    reviewer: str = ""
    total_urls: int
    ready_count: int
    blocked_count: int
    school_mode: bool
    items: list[PilotReadingItem]


class PilotReadinessSummary(BaseModel):
    pilot_id: str
    name: str
    reviewer: str = ""
    total_urls: int
    ready_count: int
    blocked_count: int
    readiness_rate: float
    ready_domains: list[str] = Field(default_factory=list)
    blocked_domains: list[str] = Field(default_factory=list)
    duplicate_url_count: int = 0
    recommended_next_step: str


# ── Agent action (Claude) ─────────────────────────────────────────────────────

class AgentActionRequest(BaseModel):
    url: str
    action: str
    profile: TransformProfile = TransformProfile()


class AgentActionResponse(BaseModel):
    result: dict[str, Any]


# ── Text-to-speech (ElevenLabs) ───────────────────────────────────────────────

class TTSRequest(BaseModel):
    text: str
    voice_id: str | None = None  # falls back to settings.elevenlabs_voice_id
