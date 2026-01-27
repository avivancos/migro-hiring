## Guia: no cache en frontend (diagnostico auth)

### Objetivo
Evitar datos antiguos (tokens/roles) en el navegador durante pruebas de permisos.

### Pasos obligatorios (Chrome/Edge)
1. Abrir DevTools → pestaña **Network** → activar **Disable cache**.
2. En DevTools → **Application**:
   - **Clear storage** → marcar todo → **Clear site data**.
   - **Service Workers** → **Unregister** si existe.
3. Hard reload:
   - Windows: `Ctrl + Shift + R`
   - macOS: `Cmd + Shift + R`
4. Cerrar sesión e iniciar sesión nuevamente.

### Notas
- El frontend usa `localStorage` (SQLite en `localDatabase.ts`), por lo que **limpiar site data es obligatorio**.
- Si se persisten roles, verificar que `/users/me` devuelve el rol correcto antes de entrar a rutas admin.
