---
title: Restricción del agente: solo proyecto actual
date: 2026-01-24
---

## Objetivo

Evitar cualquier inspección o acceso a recursos **fuera** del workspace del proyecto, para reducir riesgos (privacidad/seguridad) y mantener el trabajo estrictamente acotado al repositorio.

## Regla activa en Cursor

- Archivo: `.cursor/rules/scope-only-current-project.mdc`
- Tipo: `alwaysApply: true`

## Alcance (qué se considera “fuera”)

- Cualquier archivo o carpeta fuera de:
  - `c:\Users\agusv\Desarrollo\migro-hiring`
- Cualquier contenedor o entorno ajeno al proyecto actual (Docker u otros).

## Comportamiento esperado

- **Permitido**
  - Leer/editar archivos del repositorio (`src/`, `backend_implementation/`, `docs/`, etc.).
  - Crear documentación y cambios dentro del repo.

- **Prohibido**
  - Leer/listar/editar archivos del sistema fuera del workspace (p.ej. `C:\Users\agusv\Desktop\...`, `C:\Users\agusv\.ssh\...`).
  - Inspeccionar contenedores ajenos al proyecto.

## Si falta información

Si para resolver una tarea se necesita información que está fuera del repo, el flujo correcto es:

1. Pegar el contenido relevante en el chat, o
2. Copiar el archivo dentro del repositorio (idealmente en `docs/`), o
3. Proveer una ruta **dentro** del workspace.
