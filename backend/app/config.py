from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    mongodb_uri: str = ""
    database_name: str = "routemind"
    jwt_secret: str = "change-this-secret-before-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 720
    frontend_origin: str = "http://localhost:5173"
    seed_demo_data: bool = True

    model_config = SettingsConfigDict(env_file=("backend/.env", ".env"), env_file_encoding="utf-8")


settings = Settings()
