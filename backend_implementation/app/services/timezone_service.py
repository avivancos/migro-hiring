"""
Servicio para gestión de zonas horarias con acceso a base de datos.

Este servicio proporciona métodos para obtener y gestionar la zona horaria
del usuario desde la base de datos.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from uuid import UUID

from app.utils.timezone import (
    SYSTEM_TIMEZONE,
    now_madrid,
    to_madrid,
    to_user_timezone,
    from_user_timezone_to_madrid,
    format_datetime_for_user,
    validate_timezone
)


class TimezoneService:
    """Servicio para gestión de zonas horarias."""
    
    def __init__(self, db: Session):
        """
        Inicializa el servicio de timezone.
        
        Args:
            db: Sesión de base de datos SQLAlchemy
        """
        self.db = db
    
    async def get_user_timezone_str(self, user_id: UUID) -> Optional[str]:
        """
        Obtiene la zona horaria configurada del usuario.
        
        Args:
            user_id: ID del usuario (UUID)
        
        Returns:
            str: Zona horaria del usuario o None si no está configurada
        """
        # Importar aquí para evitar dependencias circulares
        from app.models.user import UserProfile
        
        profile = self.db.query(UserProfile).filter(
            UserProfile.user_id == user_id
        ).first()
        
        if profile and profile.timezone:
            return profile.timezone
        
        return None
    
    async def get_user_timezone(self, user_id: UUID) -> str:
        """
        Obtiene la zona horaria del usuario o retorna la del sistema por defecto.
        
        Args:
            user_id: ID del usuario (UUID)
        
        Returns:
            str: Zona horaria del usuario o "Europe/Madrid" por defecto
        """
        user_tz = await self.get_user_timezone_str(user_id)
        return user_tz or "Europe/Madrid"
    
    async def set_user_timezone(self, user_id: UUID, timezone: str) -> bool:
        """
        Establece la zona horaria del usuario.
        
        Args:
            user_id: ID del usuario (UUID)
            timezone: Código de zona horaria (ej: "America/New_York")
        
        Returns:
            bool: True si se actualizó correctamente, False si la zona horaria no es válida
        
        Raises:
            ValueError: Si la zona horaria no es válida
        """
        if not validate_timezone(timezone):
            raise ValueError(f"Zona horaria inválida: {timezone}")
        
        # Importar aquí para evitar dependencias circulares
        from app.models.user import UserProfile
        
        profile = self.db.query(UserProfile).filter(
            UserProfile.user_id == user_id
        ).first()
        
        if not profile:
            # Crear perfil si no existe
            profile = UserProfile(user_id=user_id, timezone=timezone)
            self.db.add(profile)
        else:
            profile.timezone = timezone
        
        self.db.commit()
        self.db.refresh(profile)
        
        return True
    
    async def reset_user_timezone(self, user_id: UUID) -> bool:
        """
        Restablece la zona horaria del usuario a la del sistema (elimina configuración personalizada).
        
        Args:
            user_id: ID del usuario (UUID)
        
        Returns:
            bool: True si se restableció correctamente
        """
        # Importar aquí para evitar dependencias circulares
        from app.models.user import UserProfile
        
        profile = self.db.query(UserProfile).filter(
            UserProfile.user_id == user_id
        ).first()
        
        if profile:
            profile.timezone = None
            self.db.commit()
            self.db.refresh(profile)
        
        return True
    
    async def convert_to_user_timezone(
        self,
        dt: datetime,
        user_id: UUID
    ) -> datetime:
        """
        Convierte un datetime a la zona horaria del usuario.
        
        Args:
            dt: datetime a convertir (debe ser timezone-aware)
            user_id: ID del usuario (UUID)
        
        Returns:
            datetime: datetime en zona horaria del usuario
        """
        user_tz = await self.get_user_timezone(user_id)
        return to_user_timezone(dt, user_tz)
    
    async def convert_from_user_timezone_to_madrid(
        self,
        dt: datetime,
        user_id: UUID
    ) -> datetime:
        """
        Convierte un datetime desde la zona horaria del usuario a Madrid.
        
        Args:
            dt: datetime en zona horaria del usuario (puede ser naive o timezone-aware)
            user_id: ID del usuario (UUID)
        
        Returns:
            datetime: datetime en zona horaria de Madrid
        """
        user_tz = await self.get_user_timezone(user_id)
        return from_user_timezone_to_madrid(dt, user_tz)
    
    async def format_datetime_for_user(
        self,
        dt: datetime,
        user_id: UUID,
        format_str: str = "%Y-%m-%d %H:%M:%S %Z"
    ) -> str:
        """
        Formatea un datetime para mostrar al usuario en su zona horaria.
        
        Args:
            dt: datetime a formatear (debe ser timezone-aware)
            user_id: ID del usuario (UUID)
            format_str: Formato de salida (por defecto: "%Y-%m-%d %H:%M:%S %Z")
        
        Returns:
            str: datetime formateado en zona horaria del usuario
        """
        user_tz = await self.get_user_timezone(user_id)
        return format_datetime_for_user(dt, user_tz, format_str)

