"""
Schemas Pydantic para gestión de zonas horarias.
"""

from typing import Optional
from pydantic import BaseModel, Field, validator


class TimezoneUpdate(BaseModel):
    """Schema para actualizar la zona horaria del usuario."""
    
    timezone: str = Field(
        ...,
        description="Código de zona horaria IANA (ej: 'America/New_York')",
        example="America/New_York"
    )
    
    @validator('timezone')
    def validate_timezone(cls, v):
        """Valida que la zona horaria sea válida."""
        from app.utils.timezone import validate_timezone
        
        if not validate_timezone(v):
            raise ValueError(f"Zona horaria inválida: {v}")
        
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "timezone": "America/New_York"
            }
        }


class TimezoneResponse(BaseModel):
    """Schema de respuesta con la zona horaria del usuario y del sistema."""
    
    timezone: Optional[str] = Field(
        None,
        description="Zona horaria configurada del usuario (None si usa la del sistema)",
        example="America/New_York"
    )
    system_timezone: str = Field(
        ...,
        description="Zona horaria del sistema (siempre Europe/Madrid)",
        example="Europe/Madrid"
    )
    
    class Config:
        schema_extra = {
            "example": {
                "timezone": "America/New_York",
                "system_timezone": "Europe/Madrid"
            }
        }


class TimezoneOption(BaseModel):
    """Schema para una opción de zona horaria."""
    
    code: str = Field(
        ...,
        description="Código IANA de la zona horaria",
        example="America/New_York"
    )
    name: str = Field(
        ...,
        description="Nombre legible de la zona horaria",
        example="Nueva York (EE.UU.)"
    )
    offset: str = Field(
        ...,
        description="Offset UTC de la zona horaria",
        example="-05:00"
    )
    
    class Config:
        schema_extra = {
            "example": {
                "code": "America/New_York",
                "name": "Nueva York (EE.UU.)",
                "offset": "-05:00"
            }
        }


class TimezoneListResponse(BaseModel):
    """Schema de respuesta para la lista de zonas horarias disponibles."""
    
    timezones: list[TimezoneOption] = Field(
        ...,
        description="Lista de zonas horarias disponibles"
    )
    
    class Config:
        schema_extra = {
            "example": {
                "timezones": [
                    {
                        "code": "Europe/Madrid",
                        "name": "Madrid (España)",
                        "offset": "+01:00"
                    },
                    {
                        "code": "America/New_York",
                        "name": "Nueva York (EE.UU.)",
                        "offset": "-05:00"
                    }
                ]
            }
        }

