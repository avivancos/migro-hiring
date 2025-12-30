"""
Módulo de utilidades para gestión de zonas horarias.

Este módulo proporciona funciones para trabajar con zonas horarias,
siendo Europe/Madrid la zona horaria base del sistema.
"""

from datetime import datetime
from typing import Optional
import pytz


# Zona horaria del sistema (base)
SYSTEM_TIMEZONE = pytz.timezone("Europe/Madrid")


def now_madrid() -> datetime:
    """
    Obtiene la fecha/hora actual en la zona horaria de Madrid.
    
    Returns:
        datetime: Fecha/hora actual en Europe/Madrid
    """
    return datetime.now(SYSTEM_TIMEZONE)


def to_madrid(dt: datetime) -> datetime:
    """
    Convierte un datetime a la zona horaria de Madrid.
    
    Args:
        dt: datetime a convertir (puede ser naive o timezone-aware)
    
    Returns:
        datetime: datetime en zona horaria de Madrid
    """
    if dt.tzinfo is None:
        # Si es naive, asumimos que está en UTC
        dt = pytz.UTC.localize(dt)
    
    return dt.astimezone(SYSTEM_TIMEZONE)


def to_user_timezone(dt: datetime, user_tz: str) -> datetime:
    """
    Convierte un datetime a la zona horaria del usuario.
    
    Args:
        dt: datetime a convertir (debe ser timezone-aware)
        user_tz: Zona horaria del usuario (ej: "America/New_York")
    
    Returns:
        datetime: datetime en zona horaria del usuario
    """
    if dt.tzinfo is None:
        # Si es naive, asumimos que está en UTC
        dt = pytz.UTC.localize(dt)
    
    user_timezone = pytz.timezone(user_tz)
    return dt.astimezone(user_timezone)


def from_user_timezone_to_madrid(dt: datetime, user_tz: str) -> datetime:
    """
    Convierte un datetime desde la zona horaria del usuario a Madrid.
    
    Args:
        dt: datetime en zona horaria del usuario (puede ser naive o timezone-aware)
        user_tz: Zona horaria del usuario (ej: "America/New_York")
    
    Returns:
        datetime: datetime en zona horaria de Madrid
    """
    user_timezone = pytz.timezone(user_tz)
    
    if dt.tzinfo is None:
        # Si es naive, asumimos que está en la zona horaria del usuario
        dt = user_timezone.localize(dt)
    
    return dt.astimezone(SYSTEM_TIMEZONE)


def format_datetime_for_user(
    dt: datetime,
    user_tz: str,
    format_str: str = "%Y-%m-%d %H:%M:%S %Z"
) -> str:
    """
    Formatea un datetime para mostrar al usuario en su zona horaria.
    
    Args:
        dt: datetime a formatear (debe ser timezone-aware)
        user_tz: Zona horaria del usuario
        format_str: Formato de salida (por defecto: "%Y-%m-%d %H:%M:%S %Z")
    
    Returns:
        str: datetime formateado en zona horaria del usuario
    """
    if dt.tzinfo is None:
        # Si es naive, asumimos que está en UTC
        dt = pytz.UTC.localize(dt)
    
    user_dt = to_user_timezone(dt, user_tz)
    return user_dt.strftime(format_str)


def get_available_timezones() -> list[dict[str, str]]:
    """
    Obtiene la lista de zonas horarias disponibles.
    
    Returns:
        list: Lista de diccionarios con información de zonas horarias
    """
    # Zonas horarias comunes organizadas por región
    common_timezones = [
        # Europa
        {"code": "Europe/Madrid", "name": "Madrid (España)", "offset": "+01:00"},
        {"code": "Europe/London", "name": "Londres (Reino Unido)", "offset": "+00:00"},
        {"code": "Europe/Paris", "name": "París (Francia)", "offset": "+01:00"},
        {"code": "Europe/Berlin", "name": "Berlín (Alemania)", "offset": "+01:00"},
        {"code": "Europe/Rome", "name": "Roma (Italia)", "offset": "+01:00"},
        {"code": "Europe/Amsterdam", "name": "Ámsterdam (Países Bajos)", "offset": "+01:00"},
        {"code": "Europe/Lisbon", "name": "Lisboa (Portugal)", "offset": "+00:00"},
        
        # América del Norte
        {"code": "America/New_York", "name": "Nueva York (EE.UU.)", "offset": "-05:00"},
        {"code": "America/Chicago", "name": "Chicago (EE.UU.)", "offset": "-06:00"},
        {"code": "America/Denver", "name": "Denver (EE.UU.)", "offset": "-07:00"},
        {"code": "America/Los_Angeles", "name": "Los Ángeles (EE.UU.)", "offset": "-08:00"},
        {"code": "America/Mexico_City", "name": "Ciudad de México (México)", "offset": "-06:00"},
        {"code": "America/Toronto", "name": "Toronto (Canadá)", "offset": "-05:00"},
        
        # América del Sur
        {"code": "America/Bogota", "name": "Bogotá (Colombia)", "offset": "-05:00"},
        {"code": "America/Lima", "name": "Lima (Perú)", "offset": "-05:00"},
        {"code": "America/Santiago", "name": "Santiago (Chile)", "offset": "-03:00"},
        {"code": "America/Buenos_Aires", "name": "Buenos Aires (Argentina)", "offset": "-03:00"},
        {"code": "America/Sao_Paulo", "name": "São Paulo (Brasil)", "offset": "-03:00"},
        
        # Asia
        {"code": "Asia/Tokyo", "name": "Tokio (Japón)", "offset": "+09:00"},
        {"code": "Asia/Shanghai", "name": "Shanghái (China)", "offset": "+08:00"},
        {"code": "Asia/Dubai", "name": "Dubái (Emiratos Árabes)", "offset": "+04:00"},
        {"code": "Asia/Hong_Kong", "name": "Hong Kong", "offset": "+08:00"},
        {"code": "Asia/Singapore", "name": "Singapur", "offset": "+08:00"},
        
        # Oceanía
        {"code": "Australia/Sydney", "name": "Sídney (Australia)", "offset": "+10:00"},
        {"code": "Australia/Melbourne", "name": "Melbourne (Australia)", "offset": "+10:00"},
    ]
    
    # Calcular offset real para cada zona horaria
    now = datetime.now()
    result = []
    
    for tz_info in common_timezones:
        tz = pytz.timezone(tz_info["code"])
        tz_now = now.astimezone(tz)
        offset = tz_now.strftime("%z")
        offset_formatted = f"{offset[:3]}:{offset[3:]}" if len(offset) == 5 else offset
        
        result.append({
            "code": tz_info["code"],
            "name": tz_info["name"],
            "offset": offset_formatted
        })
    
    return result


def validate_timezone(timezone: str) -> bool:
    """
    Valida que una zona horaria sea válida.
    
    Args:
        timezone: Código de zona horaria (ej: "America/New_York")
    
    Returns:
        bool: True si la zona horaria es válida, False en caso contrario
    """
    try:
        pytz.timezone(timezone)
        return True
    except pytz.exceptions.UnknownTimeZoneError:
        return False

