from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    openai_light_model: str = "gpt-4o-mini"
    openai_vision_model: str = "gpt-4o-mini"

    claude_api_key: str = Field(
        default="",
        validation_alias=AliasChoices("CLAUDE_API_KEY", "ANTHROPIC_API_KEY"),
    )
    claude_model: str = "claude-3-5-sonnet-latest"

    google_maps_api_key: str = ""

    google_application_credentials: str = ""
    firebase_project_id: str = ""

    gcs_bucket_name: str = ""

    elevenlabs_api_key: str = Field(
        default="",
        validation_alias=AliasChoices("ELEVENLABS_KEY", "ELEVENLABS_API_KEY"),
    )
    elevenlabs_voice_id: str = Field(
        default="21m00Tcm4TlvDq8ikWAM",
        validation_alias=AliasChoices("ELEVENLABS_VOICE", "ELEVENLABS_VOICE_ID"),
    )

    cors_origins: str = "http://localhost:3000"

    app_env: str = "development"
    port: int = 8080

    def cors_origin_list(self) -> list[str]:
        if self.cors_origins.strip() == "*":
            return ["*"]
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()  # type: ignore[call-arg]
