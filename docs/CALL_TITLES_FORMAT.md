# 📞 Formato de Títulos de Llamadas

## 📋 Cambio Implementado

**Fecha**: 20 de Diciembre, 2025

Se actualizó la página de llamadas (`CRMCallHandler.tsx`) para mostrar títulos más descriptivos en el formato:

**"Llamada a [nombre cliente] a las [hora] horas"**

---

## ✅ Cambios Realizados

### 1. Función Helper `getCallTitle()`

Se creó una función que formatea el título de cada llamada:

```typescript
const getCallTitle = (call: Call): string => {
  const callDate = new Date(call.started_at || call.created_at);
  const hour = callDate.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
  
  // Obtener nombre del contacto
  const contactName = call.contact_name || 
    (call.entity_id && callEntityNames[call.entity_id]) ||
    call.phone || 
    call.phone_number || 
    'Cliente';
  
  return `Llamada a ${contactName} a las ${hour} horas`;
};
```

**Prioridad para obtener el nombre:**
1. `call.contact_name` (si viene del endpoint)
2. `callEntityNames[call.entity_id]` (si se cargó previamente)
3. `call.phone` o `call.phone_number` (fallback)
4. `'Cliente'` (último fallback)

### 2. Carga de Nombres de Contactos/Leads

Se agregó la función `loadCallEntityNames()` que:

1. **Primero usa `contact_name`** si está disponible en la respuesta del endpoint
2. **Carga automáticamente** los nombres de contactos/leads que no tienen `contact_name`
3. **Maneja errores** usando el teléfono como fallback

```typescript
const loadCallEntityNames = async (calls: Call[]) => {
  const names: Record<string, string> = {};
  
  // Primero, usar contact_name si está disponible
  calls.forEach(call => {
    if (call.contact_name && call.entity_id) {
      names[call.entity_id] = call.contact_name;
      if (call.contact_id && call.contact_id !== call.entity_id) {
        names[call.contact_id] = call.contact_name;
      }
    }
  });

  // Cargar nombres de entidades que no tienen contact_name
  // ... código de carga ...
  
  setCallEntityNames(names);
};
```

### 3. Actualización del Título en la UI

Se reemplazó el título que mostraba solo el teléfono:

**Antes:**
```typescript
<div className="font-medium text-gray-900">
  {call.phone || call.phone_number || 'N/A'}
</div>
```

**Después:**
```typescript
<div className="font-medium text-gray-900">
  {getCallTitle(call)}
</div>
```

---

## 📝 Ejemplos de Títulos

### Con nombre de contacto:
```
Llamada a Juan Pérez a las 14:30 horas
```

### Con teléfono (fallback):
```
Llamada a +34600123456 a las 09:15 horas
```

### Sin información (último fallback):
```
Llamada a Cliente a las 16:45 horas
```

---

## 🔍 Flujo de Carga

1. **Se cargan las llamadas** con `loadRecentCalls()`
2. **Se ordenan** por fecha (más recientes primero)
3. **Se cargan los nombres** de contactos/leads con `loadCallEntityNames()`
4. **Se muestran los títulos** formateados con `getCallTitle()`

---

## 📚 Archivos Modificados

1. **`src/pages/CRMCallHandler.tsx`**
   - Agregado estado `callEntityNames` para almacenar nombres
   - Agregada función `loadCallEntityNames()` para cargar nombres
   - Agregada función `getCallTitle()` para formatear títulos
   - Actualizado el título en la lista de llamadas

---

## ✅ Resultado

Ahora en la página de llamadas:

- ✅ **Títulos descriptivos**: "Llamada a [nombre] a las [hora] horas"
- ✅ **Nombres cargados automáticamente**: Si no vienen del endpoint, se cargan
- ✅ **Fallbacks inteligentes**: Teléfono o "Cliente" si no hay nombre
- ✅ **Formato de hora**: Hora en formato español (HH:MM)

---

**Última Actualización**: 20 de Diciembre, 2025  
**Estado**: ✅ **COMPLETADO**














