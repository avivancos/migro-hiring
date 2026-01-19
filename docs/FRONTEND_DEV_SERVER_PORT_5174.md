# Dev server en Docker puerto 5174

## Objetivo
Levantar el frontend en otro puerto para validar cambios locales.

## Comando usado
```
docker run --rm -p 5174:5174 -v ${PWD}:/app -w /app node:20-alpine sh -c "npm install --legacy-peer-deps && npm run dev -- --host 0.0.0.0 --port 5174"
```

## URL
- http://localhost:5174/crm/opportunities
