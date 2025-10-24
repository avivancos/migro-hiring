# 🔧 Debugging: Fallback de Descarga de Contrato

## ❌ **Problema Identificado**

**El fallback no se está ejecutando correctamente:**
- ✅ Error 404 detectado
- ❌ Generación local no se activa
- ❌ Usuario no puede descargar el contrato

## 🔍 **Debugging Implementado**

### **1. Logging Detallado en handleDownload:**
```typescript
} catch (err: any) {
  console.warn('⚠️ No se pudo descargar desde el backend, generando localmente:', err);
  console.log('🔧 Iniciando generación local de contrato...');
  
  try {
    await generateLocalContract();
    console.log('✅ Contrato generado localmente exitosamente');
  } catch (localErr) {
    console.error('❌ Error generando contrato local:', localErr);
    setError('No se pudo generar el contrato. Por favor, contacta con soporte.');
  }
}
```

### **2. Logging Detallado en generateLocalContract:**
```typescript
const generateLocalContract = async () => {
  console.log('🔧 Iniciando generateLocalContract...');
  
  // Importar dinámicamente
  const { generateContractPDF } = await import('@/utils/contractPdfGenerator');
  console.log('✅ generateContractPDF importado correctamente');
  
  // Verificar datos del localStorage
  const hiringDetails = localStorage.getItem(`hiring_details_${hiringCode}`);
  const clientSignature = localStorage.getItem(`client_signature_${hiringCode}`);
  
  console.log('📋 Datos del localStorage:', {
    hiringDetails: hiringDetails ? 'Encontrado' : 'No encontrado',
    clientSignature: clientSignature ? 'Encontrado' : 'No encontrado'
  });
  
  // ... resto del código con logging
};
```

---

## 🧪 **Testing del Fallback**

### **Pasos para Probar:**
1. ✅ Completar proceso con código LIVE1
2. ✅ Llegar al paso 5 (ContractSuccess)
3. ✅ Hacer clic en "Descargar Contrato PDF"
4. ✅ Verificar logs en consola del navegador

### **Logs Esperados:**
```
⚠️ No se pudo descargar desde el backend, generando localmente: [Error 404]
🔧 Iniciando generación local de contrato...
🔧 Iniciando generateLocalContract...
✅ generateContractPDF importado correctamente
📋 Datos del localStorage: {hiringDetails: "Encontrado", clientSignature: "Encontrado"}
📄 Detalles parseados: {user_name: "...", amount: 40000, ...}
🔄 Generando PDF localmente...
✅ PDF generado, tamaño: XXXXX bytes
⬇️ Iniciando descarga...
✅ Descarga completada
✅ Contrato generado localmente exitosamente
```

---

## 🔧 **Posibles Problemas y Soluciones**

### **Problema 1: Datos no encontrados en localStorage**
**Síntomas:** `hiringDetails: "No encontrado"`
**Solución:** Verificar que `HiringFlow.tsx` guarde los detalles correctamente

### **Problema 2: Error en importación dinámica**
**Síntomas:** Error al importar `generateContractPDF`
**Solución:** Verificar que el archivo existe y la exportación es correcta

### **Problema 3: Error en generación de PDF**
**Síntomas:** Error en `generateContractPDF`
**Solución:** Verificar que los datos sean válidos y la función funcione

### **Problema 4: Error en descarga**
**Síntomas:** PDF generado pero no se descarga
**Solución:** Verificar que el blob sea válido y la descarga funcione

---

## 📋 **Checklist de Debugging**

### **✅ Implementado:**
- ✅ Logging en `handleDownload`
- ✅ Logging en `generateLocalContract`
- ✅ Verificación de datos del localStorage
- ✅ Verificación de importación dinámica
- ✅ Verificación de generación de PDF
- ✅ Verificación de descarga

### **⏳ Pendiente de Verificar:**
- ⏳ **Datos en localStorage:** ¿Se guardan correctamente?
- ⏳ **Importación dinámica:** ¿Funciona en producción?
- ⏳ **Generación de PDF:** ¿Los datos son válidos?
- ⏳ **Descarga:** ¿El blob se crea correctamente?

---

## 🎯 **Próximos Pasos**

### **1. Probar en Producción:**
- ✅ Hacer clic en "Descargar Contrato PDF"
- ✅ Revisar logs en consola del navegador
- ✅ Identificar dónde falla el proceso

### **2. Corregir Problema Identificado:**
- 🔧 **Si faltan datos:** Corregir guardado en localStorage
- 🔧 **Si falla importación:** Corregir importación dinámica
- 🔧 **Si falla generación:** Corregir función de PDF
- 🔧 **Si falla descarga:** Corregir proceso de descarga

### **3. Verificar Marca de Agua:**
- ✅ **Marca de agua "BORRADOR":** Debe ser visible en diagonal
- ✅ **Tamaño:** 60pt, color gris claro
- ✅ **Posición:** Desde esquina superior izquierda a inferior derecha

---

**Estado:** 🔍 **Debugging implementado**  
**Siguiente:** 🧪 **Probar en producción y revisar logs**

