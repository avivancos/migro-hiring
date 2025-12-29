# Configuración de .gitignore

**Fecha:** 2025-01-15  
**Estado:** ✅ Configurado

## Resumen

Se ha configurado un `.gitignore` completo y organizado para gestionar mejor el repositorio, evitando que archivos innecesarios (logs, builds, caches, etc.) sean versionados.

---

## Estructura del .gitignore

El archivo está organizado en las siguientes secciones:

### 1. Test Tokens y Credenciales
- `.test-tokens.json` - Archivos con credenciales de test

### 2. Logs y Archivos de Debug
- `*.log` - Todos los archivos de log
- `debug/*.log` - Logs en carpeta debug
- `debug/*.png` - Screenshots de debug
- Logs específicos de npm/yarn/pnpm

### 3. Build Outputs y Artefactos de Compilación
- `dist/` - Output principal de Vite
- `dist-ssr/` - Output SSR
- `build/` - Carpeta de build alternativa
- `out/` - Output genérico
- `.next/`, `.nuxt/` - Frameworks específicos
- `.vite/` - Cache de Vite
- `*.tsbuildinfo` - Info de build de TypeScript
- `*.map` - Source maps
- Archivos minificados (`*.min.js`, `*.min.css`)
- Chunks y bundles (`*.chunk.js`, `*.bundle.js`)

### 4. Dependencias
- `node_modules/` - Dependencias de Node.js
- `jspm_packages/` - Paquetes JSPM
- `.pnp.*` - Plug'n'Play de Yarn

### 5. Cache y Temporales
- `.cache/`, `.parcel-cache/`
- `.eslintcache`, `.stylelintcache`
- `.npm/`, `.yarn/cache`
- `*.tmp`, `*.temp`
- Carpetas temporales (`tmp/`, `.tmp/`)

### 6. Archivos de Entorno
- `.env*` - Variables de entorno (todos los variantes)
- `*.env` - Archivos de entorno con cualquier nombre

### 7. Python (Scripts Auxiliares)
- `__pycache__/` - Cache de Python
- `*.pyc`, `*.pyo` - Bytecode de Python
- `venv/`, `.venv/` - Entornos virtuales
- `.pytest_cache/` - Cache de pytest
- `coverage/`, `htmlcov/` - Coverage reports

### 8. Testing y Coverage
- `coverage/` - Reportes de coverage
- `.nyc_output/` - Output de NYC (coverage tool)
- `.vitest/`, `.vi/` - Cache de Vitest

### 9. IDEs y Editores
- `.vscode/`, `.idea/` - Configuraciones de IDE
- `*.swp`, `*.swo` - Archivos de Vim
- `*.sublime-*` - Archivos de Sublime Text
- `.DS_Store` - Archivos de macOS

### 10. Sistema Operativo
- **Windows:** `Thumbs.db`, `Desktop.ini`, `$RECYCLE.BIN/`
- **macOS:** `.DS_Store`, `.Spotlight-V100`, `.Trashes`
- **Linux:** `.directory`, `.Trash-*`, `.nfs*`

### 11. Docker
- `docker-compose.override.yml` - Overrides locales
- `docker-volume/` - Volúmenes locales

### 12. Archivos Específicos del Proyecto
- `ersagusvDesarrollomigro-hiring` - Archivo accidental
- `*.docx.backup`, `*.pdf.backup` - Backups de documentos

---

## Archivos que SÍ se Versionan

Los siguientes archivos **NO** están en .gitignore y se versionan:

- ✅ Código fuente (`src/`)
- ✅ Scripts de utilidad (`scripts/`)
- ✅ Archivos de configuración (`package.json`, `tsconfig.json`, etc.)
- ✅ Dockerfiles y configuraciones de Docker
- ✅ Documentación (`docs/`, `*.md`)
- ✅ Archivos de test en `src/` (`.test.ts`, `.test.tsx`)
- ✅ Scripts de debug (`debug-*.js`) - Pueden ser útiles para debugging

---

## Comandos Útiles

### Ver qué archivos serían ignorados
```bash
git status --ignored
```

### Verificar si un archivo específico está siendo ignorado
```bash
git check-ignore -v path/to/file
```

### Limpiar archivos ignorados del working directory (si ya estaban trackeados)
```bash
# Primero verificar qué se eliminaría
git clean -n -d -X

# Luego ejecutar la limpieza
git clean -f -d -X
```

### Eliminar archivos trackeados que ahora deberían estar ignorados
```bash
# Para dist/ (si estaba trackeado antes)
git rm -r --cached dist/
git commit -m "Remove dist/ from git tracking"

# Para node_modules/ (si estaba trackeado antes)
git rm -r --cached node_modules/
git commit -m "Remove node_modules/ from git tracking"
```

---

## Notas Importantes

1. **No commitees builds:** Los archivos en `dist/` se generan automáticamente con `npm run build`. No deben versionarse.

2. **Logs locales:** Los logs en `debug/` son temporales y se generan durante el desarrollo/debugging.

3. **Variables de entorno:** Nunca commitees archivos `.env` con credenciales reales. Usa `.env.example` como template.

4. **Source maps:** Los archivos `.map` también están ignorados ya que se generan en cada build.

5. **Cache:** Toda la cache (Vite, TypeScript, ESLint, etc.) se regenera automáticamente.

---

## Mantenimiento

Si en el futuro necesitas agregar nuevos patrones al `.gitignore`:

1. Identifica la categoría apropiada
2. Agrega el patrón con un comentario si es necesario
3. Mantén la organización por secciones
4. Documenta cambios significativos aquí

---

## Referencias

- [Git Ignore Documentation](https://git-scm.com/docs/gitignore)
- [GitHub Gitignore Templates](https://github.com/github/gitignore)
- Configuración específica del proyecto en `.gitignore`






