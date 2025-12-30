"""
Endpoints de API para gestión de zonas horarias.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.session import get_db
from app.schemas import timezone as schemas
from app.services.timezone_service import TimezoneService
from app.utils.timezone import get_available_timezones
from app.core.deps import get_current_user

router = APIRouter(prefix="/timezone", tags=["Timezone"])


@router.get(
    "/",
    response_model=schemas.TimezoneResponse,
    summary="Obtener zona horaria del usuario",
    description="Obtiene la zona horaria configurada del usuario actual. Si no tiene configuración personalizada, retorna None."
)
async def get_user_timezone(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtiene la zona horaria configurada del usuario actual.
    
    Returns:
        TimezoneResponse: Zona horaria del usuario y del sistema
    """
    service = TimezoneService(db)
    user_tz = await service.get_user_timezone_str(current_user.id)
    
    return schemas.TimezoneResponse(
        timezone=user_tz,
        system_timezone="Europe/Madrid"
    )


@router.put(
    "/",
    response_model=schemas.TimezoneResponse,
    summary="Actualizar zona horaria del usuario",
    description="Actualiza la zona horaria personalizada del usuario. La zona horaria debe ser un código IANA válido."
)
async def update_user_timezone(
    timezone_update: schemas.TimezoneUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Actualiza la zona horaria del usuario.
    
    Args:
        timezone_update: Datos con la nueva zona horaria
    
    Returns:
        TimezoneResponse: Zona horaria actualizada del usuario y del sistema
    
    Raises:
        HTTPException: Si la zona horaria no es válida
    """
    service = TimezoneService(db)
    
    try:
        await service.set_user_timezone(current_user.id, timezone_update.timezone)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    return schemas.TimezoneResponse(
        timezone=timezone_update.timezone,
        system_timezone="Europe/Madrid"
    )


@router.get(
    "/available",
    response_model=schemas.TimezoneListResponse,
    summary="Obtener zonas horarias disponibles",
    description="Obtiene la lista completa de zonas horarias disponibles para configurar."
)
async def get_available_timezones_list(
    current_user = Depends(get_current_user)
):
    """
    Obtiene la lista de zonas horarias disponibles.
    
    Returns:
        TimezoneListResponse: Lista de zonas horarias disponibles
    """
    timezones = get_available_timezones()
    
    timezone_options = [
        schemas.TimezoneOption(
            code=tz["code"],
            name=tz["name"],
            offset=tz["offset"]
        )
        for tz in timezones
    ]
    
    return schemas.TimezoneListResponse(timezones=timezone_options)


@router.delete(
    "/",
    response_model=schemas.TimezoneResponse,
    summary="Restablecer zona horaria del usuario",
    description="Elimina la configuración personalizada de zona horaria del usuario, restableciendo la zona horaria del sistema (Madrid)."
)
async def reset_user_timezone(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Restablece la zona horaria del usuario a la del sistema (elimina configuración personalizada).
    
    Returns:
        TimezoneResponse: Zona horaria restablecida (None para usuario, Europe/Madrid para sistema)
    """
    service = TimezoneService(db)
    await service.reset_user_timezone(current_user.id)
    
    return schemas.TimezoneResponse(
        timezone=None,
        system_timezone="Europe/Madrid"
    )

