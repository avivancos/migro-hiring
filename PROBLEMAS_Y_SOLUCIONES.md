# 🔧 Problemas Identificados y Soluciones

## ❌ **Problema 1: Error 500 Stripe Checkout**

### **Error:**
```
POST /hiring/LIVE1/checkout → 500 (Internal Server Error)
Response: "Error al crear sesión de checkout con Stripe: No API key provided"
```

### **Causa:**
Falta configurar `STRIPE_SECRET_KEY` en el backend.

### **Solución:**
```bash
# En el backend, agregar variable de entorno:
STRIPE_SECRET_KEY=sk_live_51...  # Tu clave secreta de Stripe
```

### **Obtener la clave:**
1. Ir a [Stripe Dashboard](https://dashboard.stripe.com/)
2. **Developers** → **API Keys**
3. Copiar **Secret key** (empieza con `sk_live_`)
4. Agregar al backend como variable de entorno

---

## ❌ **Problema 2: Marca de agua "BORRADOR" no aparece**

### **Error:**
La marca de agua "BORRADOR" no se muestra en el PDF generado.

### **Causa:**
`jsPDF` no soporta `GState` y `angle` de la forma implementada.

### **Solución Implementada:**
```typescript
// Marca de agua simple y compatible
const addWatermark = () => {
  const totalPages = doc.getNumberOfPages();
  
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Configurar marca de agua simple
    doc.setTextColor(220, 220, 220); // Gris muy claro
    doc.setFontSize(80);
    doc.setFont('helvetica', 'bold');
    
    // Dibujar "BORRADOR" en diagonal simple
    doc.text('BORRADOR', pageWidth * 0.3, pageHeight * 0.4);
    doc.text('BORRADOR', pageWidth * 0.6, pageHeight * 0.7);
    
    // Restaurar configuración normal
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
  }
};
```

---

## ✅ **Estado Actual**

### **Frontend:**
- ✅ Stripe Checkout implementado
- ✅ Marca de agua "BORRADOR" corregida
- ✅ Bucle infinito corregido
- ✅ Deploy funcionando

### **Backend:**
- ✅ Endpoint `/checkout` implementado
- ⚠️ Falta `STRIPE_SECRET_KEY` para códigos LIVE
- ✅ Códigos TEST funcionan con simulación

---

## 🧪 **Testing**

### **Códigos TEST (✅ Funcionan):**
```bash
curl -X POST "https://api.migro.es/api/hiring/TEST1/checkout"
# Response: { "checkout_url": "...", "test_mode": true }
```

### **Códigos LIVE (⚠️ Requieren STRIPE_SECRET_KEY):**
```bash
curl -X POST "https://api.migro.es/api/hiring/LIVE1/checkout"
# Response: 500 - "No API key provided"
```

---

## 🎯 **Próximos Pasos**

### **1. Configurar Stripe (5 minutos):**
- Agregar `STRIPE_SECRET_KEY` al backend
- Probar con código LIVE1

### **2. Verificar marca de agua:**
- Generar PDF con código TEST1
- Verificar que aparece "BORRADOR" en gris claro

---

## 📋 **Checklist de Solución**

### **Backend:**
- [ ] Configurar `STRIPE_SECRET_KEY=sk_live_51...`
- [ ] Reiniciar servicio backend
- [ ] Probar endpoint `/hiring/LIVE1/checkout`

### **Frontend:**
- [x] ✅ Marca de agua "BORRADOR" corregida
- [x] ✅ Bucle infinito corregido
- [x] ✅ Deploy actualizado

---

**Prioridad:** 🔥 **ALTA** - Configurar Stripe para activar códigos LIVE  
**Tiempo estimado:** 5 minutos  
**Estado:** ⚠️ **Backend necesita configuración Stripe**
