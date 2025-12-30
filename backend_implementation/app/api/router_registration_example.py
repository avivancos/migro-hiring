"""
Ejemplo de registro del router de timezone en la aplicación principal.

Este archivo muestra cómo registrar el router de timezone en la
aplicación FastAPI principal.

NOTA: Este es un archivo de ejemplo. Debe integrarse en el archivo
real donde se registran los routers (típicamente app/main.py o app/api/api.py).
"""

from fastapi import FastAPI
from app.api.endpoints import timezone as timezone_endpoints

# Ejemplo de cómo registrar el router en app/main.py o app/api/api.py

app = FastAPI()

# ... otros routers ...

# Registrar router de timezone
app.include_router(
    timezone_endpoints.router,
    prefix="/api/v1",
    tags=["Timezone"]
)

# Alternativa: Si ya tienes un router principal que agrupa otros routers
# from fastapi import APIRouter
# 
# api_router = APIRouter()
# api_router.include_router(
#     timezone_endpoints.router,
#     prefix="/timezone",
#     tags=["Timezone"]
# )
# 
# app.include_router(api_router, prefix="/api/v1")

