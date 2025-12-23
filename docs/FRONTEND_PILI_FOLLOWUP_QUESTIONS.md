# Frontend: Manejo de Respuestas y Preguntas de Seguimiento de Pili

**Fecha:** 2025-01-28  
**Versión:** 1.0.0  
**Estado:** ✅ IMPLEMENTADO

---

## 📋 Resumen

Se ha implementado el manejo de respuestas truncadas y preguntas de seguimiento en el frontend para el agente Pili. El sistema ahora:

1. **Detecta respuestas truncadas** cuando exceden el límite de longitud
2. **Extrae preguntas de seguimiento** al final de cada respuesta
3. **Muestra visualmente** estas características en la UI
4. **Permite continuar la conversación** haciendo click en las preguntas de seguimiento

---

## 🎯 Características Implementadas

### 1. Parsing de Respuestas

**Función:** `parsePiliResponse()` en `src/hooks/usePiliChat.ts`

```typescript
export function parsePiliResponse(response: string): ParsedPiliResponse {
  const result: ParsedPiliResponse = {
    content: response,
    isTruncated: false,
  };

  // Detectar si está truncada
  if (response.includes('[Respuesta truncada por longitud')) {
    result.isTruncated = true;
  }

  // Extraer pregunta de seguimiento
  const followUpMatch = response.match(
    /\*\*¿Te gustaría que profundice en algún aspecto\?\*\*\s*(.+?)(?:\n|$)/i
  );
  
  if (followUpMatch) {
    result.followUpQuestion = followUpMatch[1].trim();
    // Remover pregunta de seguimiento del contenido principal
    result.content = response.replace(
      /\n\n\*\*¿Te gustaría que profundice en algún aspecto\?\*\*.*$/i,
      ''
    ).trim();
  }

  return result;
}
```

**Características:**
- ✅ Detecta respuestas truncadas buscando el texto `[Respuesta truncada por longitud`
- ✅ Extrae preguntas de seguimiento usando regex
- ✅ Separa el contenido principal de la pregunta de seguimiento
- ✅ Retorna estructura tipada con TypeScript

---

### 2. Tipos Actualizados

**Archivo:** `src/types/pili.ts`

```typescript
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  followUpQuestion?: string;  // Nueva
  isTruncated?: boolean;      // Nueva
}

export interface PiliMessage {
  id: string;
  content: string;
  sender: 'user' | 'pili';
  timestamp: string;
  isLoading?: boolean;
  followUpQuestion?: string;  // Nueva
  isTruncated?: boolean;      // Nueva
}

export interface ParsedPiliResponse {
  content: string;
  followUpQuestion?: string;
  isTruncated: boolean;
}
```

---

### 3. Hook Actualizado

**Archivo:** `src/hooks/usePiliChat.ts`

**Cambios:**
- ✅ Importa y usa `parsePiliResponse()` para procesar respuestas
- ✅ Almacena `followUpQuestion` e `isTruncated` en los mensajes
- ✅ Expone función `sendFollowUp()` para enviar preguntas de seguimiento

**Ejemplo de uso:**
```typescript
const { messages, sendFollowUp } = usePiliChat();

// Los mensajes ahora incluyen:
// - message.followUpQuestion?: string
// - message.isTruncated?: boolean

// Enviar pregunta de seguimiento:
sendFollowUp("¿Necesitas más información sobre algún procedimiento específico?");
```

---

### 4. Componente PiliChat

**Archivo:** `src/components/CRM/PiliChat.tsx`

**Características visuales:**

#### Nota de Truncado
```tsx
{message.isTruncated && (
  <div className="mt-2 p-2 bg-amber-50 border-l-3 border-amber-400 rounded text-xs text-amber-800 flex items-start gap-2">
    <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
    <span>Respuesta truncada. Puedes pedir que continúe.</span>
  </div>
)}
```

#### Pregunta de Seguimiento
```tsx
{message.followUpQuestion && (
  <div className="mt-3 p-3 bg-blue-50 border-l-3 border-blue-400 rounded">
    <div className="flex items-center gap-2 mb-2">
      <Lightbulb className="w-3 h-3 text-blue-600" />
      <span className="text-xs font-semibold text-blue-700">
        ¿Te gustaría que profundice?
      </span>
    </div>
    <button
      onClick={() => sendFollowUp(message.followUpQuestion!)}
      disabled={isLoading}
      className="w-full text-left text-sm text-blue-700 hover:text-blue-900 hover:underline disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {message.followUpQuestion}
    </button>
  </div>
)}
```

**Estilos:**
- 🟡 Fondo amarillo claro para respuestas truncadas
- 🔵 Fondo azul claro para preguntas de seguimiento
- ✅ Botón clickeable para enviar la pregunta automáticamente
- ✅ Estados disabled durante carga

---

### 5. Componente AdminPili

**Archivo:** `src/pages/admin/AdminPili.tsx`

**Cambios:**
- ✅ Importa `parsePiliResponse` desde el hook
- ✅ Parsea respuestas antes de almacenarlas
- ✅ Muestra preguntas de seguimiento y estado truncado
- ✅ Permite enviar preguntas de seguimiento directamente

**Función `sendMessage` actualizada:**
```typescript
const sendMessage = async (messageText?: string) => {
  const queryText = messageText || input.trim();
  // ... validaciones ...
  
  const response = await piliService.chat({...});
  const parsed = parsePiliResponse(response.response);
  
  const assistantMessage: Message = {
    role: 'assistant',
    content: parsed.content,
    timestamp: new Date().toISOString(),
    followUpQuestion: parsed.followUpQuestion,
    isTruncated: parsed.isTruncated,
  };
  // ...
};
```

---

## 🎨 Diseño Visual

### Colores y Estilos

**Respuestas Truncadas:**
- Fondo: `bg-amber-50`
- Borde: `border-amber-400`
- Texto: `text-amber-800`
- Icono: `AlertTriangle` (amarillo)

**Preguntas de Seguimiento:**
- Fondo: `bg-blue-50`
- Borde: `border-blue-400`
- Texto: `text-blue-700`
- Icono: `Lightbulb` (azul)
- Botón: Hover con underline

### Componentes UI Utilizados

- `AlertTriangle` de `lucide-react` para truncado
- `Lightbulb` de `lucide-react` para seguimiento
- Estilos Tailwind CSS para colores y espaciado

---

## 🔄 Flujo de Usuario

```
1. Usuario envía pregunta
   ↓
2. Frontend muestra loading
   ↓
3. Backend responde (máx 4000 caracteres)
   ↓
4. Frontend parsea respuesta:
   - Extrae contenido principal
   - Detecta pregunta de seguimiento
   - Detecta si está truncada
   ↓
5. Muestra respuesta formateada
   ↓
6. Si hay pregunta de seguimiento:
   - Muestra botón clickeable
   - Usuario hace click
   - Se envía automáticamente
   ↓
7. Si está truncada:
   - Muestra nota visual
   - Usuario puede pedir continuar
```

---

## 📊 Estructura de Datos

### Mensaje Parseado

```typescript
interface ParsedPiliResponse {
  content: string;              // Contenido sin pregunta de seguimiento
  followUpQuestion?: string;    // Pregunta extraída (opcional)
  isTruncated: boolean;         // Si la respuesta fue truncada
}
```

### Mensaje en el Chat

```typescript
interface Message {
  role: 'user' | 'assistant';
  content: string;              // Contenido principal
  timestamp?: string;
  followUpQuestion?: string;   // Pregunta de seguimiento (opcional)
  isTruncated?: boolean;       // Estado de truncado (opcional)
}
```

---

## ✅ Checklist de Implementación

- [x] Actualizar tipos TypeScript
- [x] Crear función `parsePiliResponse()`
- [x] Actualizar hook `usePiliChat`
- [x] Actualizar componente `PiliChat`
- [x] Actualizar componente `AdminPili`
- [x] Agregar estilos visuales
- [x] Manejar clicks en preguntas de seguimiento
- [x] Mostrar notas de truncado
- [x] Documentar implementación

---

## 🧪 Testing

### Casos de Prueba

**Test 1: Respuesta con pregunta de seguimiento**
```typescript
const response = "Contenido...\n\n**¿Te gustaría que profundice en algún aspecto?** ¿Necesitas más información?";
const parsed = parsePiliResponse(response);
// parsed.followUp debería ser "¿Necesitas más información?"
// parsed.content no debería incluir la pregunta
```

**Test 2: Respuesta truncada**
```typescript
const response = "Contenido largo...\n\n[Respuesta truncada por longitud. Puedo continuar en la siguiente respuesta si lo necesitas.]";
const parsed = parsePiliResponse(response);
// parsed.isTruncated debería ser true
```

**Test 3: Respuesta normal sin pregunta**
```typescript
const response = "Respuesta simple sin pregunta de seguimiento.";
const parsed = parsePiliResponse(response);
// parsed.followUp debería ser undefined
// parsed.isTruncated debería ser false
```

---

## 📝 Notas Importantes

1. **Parsing Regex:** El regex busca el patrón exacto `**¿Te gustaría que profundice en algún aspecto?**` seguido de la pregunta.

2. **Separación de contenido:** La pregunta de seguimiento se remueve del contenido principal para evitar duplicación.

3. **Estado truncado:** Se detecta buscando el texto `[Respuesta truncada por longitud` en la respuesta.

4. **Conversación continua:** Las preguntas de seguimiento mantienen el mismo `conversation_id` para contexto.

5. **Accesibilidad:** Los botones de seguimiento tienen estados disabled apropiados y feedback visual.

---

## 🔗 Archivos Modificados

1. `src/types/pili.ts` - Tipos actualizados
2. `src/hooks/usePiliChat.ts` - Función de parsing y hook actualizado
3. `src/components/CRM/PiliChat.tsx` - UI para seguimiento y truncado
4. `src/pages/admin/AdminPili.tsx` - UI para seguimiento y truncado

---

## 🚀 Próximos Pasos (Opcional)

- [ ] Agregar soporte para múltiples preguntas de seguimiento
- [ ] Implementar botón "Continuar respuesta" para respuestas truncadas
- [ ] Agregar animaciones de transición
- [ ] Soporte para markdown en respuestas
- [ ] Historial de preguntas de seguimiento usadas

---

**Última actualización:** 2025-01-28  
**Autor:** Sistema de implementación automática

