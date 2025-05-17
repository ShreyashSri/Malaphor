from pydantic_settings import BaseSettings
from functools import lru_cache
import os
from typing import List, Optional

class Settings(BaseSettings):
    # Environment
    APP_ENV: str = "development"
    DEBUG: bool = True
    
    # API Settings
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_WORKERS: int = 1
    
    # Security
    SECRET_KEY: str = "your-secret-key-here"  # TODO: Change in production
    ALLOWED_ORIGINS: List[str] = ["*"]
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # AWS Settings
    AWS_REGION: str = "us-west-2"
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    
    # Model Settings
    MODEL_PATH: str = "models/cloud_security_model.pt"
    MODEL_THRESHOLD: float = 0.7
    
    # Feature Flags
    USE_MOCK_DATA: bool = True
    ENABLE_BACKGROUND_TASKS: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = True

class DevSettings(Settings):
    class Config:
        env_file = ".env.development"

class ProdSettings(Settings):
    DEBUG: bool = False
    USE_MOCK_DATA: bool = False
    API_WORKERS: int = 4
    
    class Config:
        env_file = ".env.production"

class TestSettings(Settings):
    class Config:
        env_file = ".env.test"

@lru_cache()
def get_settings() -> Settings:
    """Get settings based on environment."""
    env = os.getenv("APP_ENV", "development")
    settings_map = {
        "development": DevSettings,
        "production": ProdSettings,
        "test": TestSettings
    }
    settings_class = settings_map.get(env, DevSettings)
    return settings_class() 