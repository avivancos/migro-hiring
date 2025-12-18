# Ajuste de Expiración de Tokens - Buffer Reducido

## 📋 Problema Identificado

Las sesiones se estaban expirando "antes de tiempo" debido a que el sistema estaba refrescando los tokens demasiado pronto (con un buffer de 5 minutos).

## 🔍 Análisis

### Comportamiento Anterior

- El sistema verificaba si el token expiraría en **menos de 5 minutos**
- Si era así, lo refrescaba proactivamente
- Esto causaba refreshes demasiado frecuentes si los tokens tienen duración corta

### Impacto

- Si un token dura 15 minutos, se refrescaría a los 10 minutos
- Si un token dura 30 minutos, se refrescaría a los 25 minutos
- Esto puede parecer que las sesiones se "expiran antes de tiempo" porque se están refrescando muy frecuentemente

## ✅ Solución Implementada

### Cambios Realizados

1. **Buffer reducido de 5 a 2 minutos**
   - Ahora solo refresca cuando quedan menos de 2 minutos
   - Reduce la frecuencia de refreshes innecesarios

2. **Mejor logging**
   - Muestra cuántos minutos quedan antes de refrescar
   - Facilita el debugging de problemas de expiración

### Código Actualizado

```typescript
// En src/services/api.ts
} else if (isTokenExpiringSoon(token, 2)) {
  // Token expirará en menos de 2 minutos, refrescar proactivamente
  // Reducido de 5 a 2 minutos para evitar refreshes demasiado frecuentes
  const timeRemaining = getTokenTimeRemaining(token);
  if (timeRemaining !== null) {
    const minutesRemaining = Math.floor(timeRemaining / 60);
    console.log(`🔄 Token expirará en ${minutesRemaining} minutos, refrescando proactivamente...`);
  }
  const newToken = await refreshTokenProactively();
  if (newToken) {
    token = newToken;
  }
}
```

## 🎯 Beneficios

1. **Menos refreshes innecesarios**: Solo refresca cuando realmente es necesario (últimos 2 minutos)
2. **Mejor experiencia de usuario**: Las sesiones duran más sin interrupciones
3. **Mejor logging**: Facilita identificar problemas de expiración

## 🔧 Configuración

El buffer está configurado en:
- **Archivo**: `src/services/api.ts`
- **Función**: `isTokenExpiringSoon(token, 2)`
- **Parámetro**: `2` (minutos)

### Para Ajustar el Buffer

Si necesitas cambiar el tiempo del buffer, modifica el segundo parámetro:

```typescript
// Buffer de 1 minuto (más agresivo)
isTokenExpiringSoon(token, 1)

// Buffer de 3 minutos (menos agresivo)
isTokenExpiringSoon(token, 3)
```

## 📊 Comportamiento Esperado

### Con tokens de 15 minutos
- Antes: Refrescaba a los 10 minutos (cada 10 minutos)
- Ahora: Refrescaba a los 13 minutos (cada 13 minutos)

### Con tokens de 30 minutos
- Antes: Refrescaba a los 25 minutos (cada 25 minutos)
- Ahora: Refrescaba a los 28 minutos (cada 28 minutos)

### Con tokens de 60 minutos
- Antes: Refrescaba a los 55 minutos (cada 55 minutos)
- Ahora: Refrescaba a los 58 minutos (cada 58 minutos)

## 🔍 Verificación

Para verificar que funciona correctamente:

1. Abre la consola del navegador (F12)
2. Busca mensajes que empiecen con `🔄 Token expirará en...`
3. Verifica que el refresh solo ocurre cuando quedan menos de 2 minutos

## 📝 Notas

- El refresh proactivo sigue siendo necesario para evitar que el token expire durante una petición activa
- Un buffer de 2 minutos es suficiente para refrescar antes de que expire, pero no tan agresivo como 5 minutos
- Si el backend tiene problemas con el refresh token, se mostrarán errores en la consola


