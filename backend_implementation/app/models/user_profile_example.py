"""
Ejemplo de modelo UserProfile con campo timezone.

Este archivo muestra cómo debe estructurarse el modelo UserProfile
para soportar el sistema de zonas horarias.

NOTA: Este es un archivo de ejemplo. Debe integrarse en el modelo
real de UserProfile del proyecto.
"""

from sqlalchemy import Column, String, ForeignKey, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base


class UserProfile(Base):
    """
    Perfil de usuario con configuración de zona horaria.
    
    Este modelo almacena información adicional del usuario,
    incluyendo su preferencia de zona horaria.
    """
    __tablename__ = "user_profiles"
    
    # Clave primaria (relación 1:1 con users)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
        index=True
    )
    
    # Zona horaria del usuario (opcional)
    # Si es None, se usa la zona horaria del sistema (Europe/Madrid)
    timezone = Column(
        String(100),
        nullable=True,
        comment="Zona horaria IANA del usuario (ej: 'America/New_York')"
    )
    
    # Otros campos del perfil (ejemplo)
    # bio = Column(Text, nullable=True)
    # avatar_url = Column(String(500), nullable=True)
    # ...
    
    # Timestamps
    created_at = Column(
        TIMESTAMP,
        server_default=func.now(),
        nullable=False
    )
    updated_at = Column(
        TIMESTAMP,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
    
    # Relación con User (opcional, si existe)
    # user = relationship("User", back_populates="profile")
    
    def __repr__(self):
        return f"<UserProfile(user_id={self.user_id}, timezone={self.timezone})>"

