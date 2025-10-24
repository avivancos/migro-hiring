# 🔐 Seguridad - Migro Hiring

## ⚠️ Guía de Claves Stripe

### Tipos de Claves

| Clave | Prefijo | Ubicación | ¿Exponer? |
|-------|---------|-----------|-----------|
| **Publishable Key (Test)** | `pk_test_` | ✅ Frontend | ✅ Seguro (público) |
| **Publishable Key (Live)** | `pk_live_` | ✅ Frontend | ✅ Seguro (público) |
| **Secret Key (Test)** | `sk_test_` | ❌ Backend SOLO | ❌ NUNCA exponer |
| **Secret Key (Live)** | `sk_live_` | ❌ Backend SOLO | ❌ NUNCA exponer |

### ✅ Configuración Correcta

#### Frontend (Este Proyecto)
```bash
# .env.local o .env.production
VITE_API_BASE_URL=https://api.migro.es/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51SCgH4Djtj7fY0Es...  # ✅ OK
VITE_APP_URL=https://contratacion.migro.es
```

#### Backend (FastAPI)
```bash
# .env en el servidor backend (NUNCA en frontend)
STRIPE_SECRET_KEY=sk_live_51SCgH4Djtj7fY0Es...  # ❌ SOLO Backend
STRIPE_WEBHOOK_SECRET=whsec_...  # ❌ SOLO Backend
DATABASE_URL=postgresql://...  # ❌ SOLO Backend
```

---

## 🚨 Qué NUNCA Hacer

### ❌ NUNCA en Frontend

```bash
# ❌ MAL - NUNCA hacer esto
VITE_STRIPE_SECRET_KEY=sk_live_xxxxx  # 🚨 PELIGRO
VITE_DATABASE_PASSWORD=xxxxx          # 🚨 PELIGRO
VITE_API_TOKEN=xxxxx                  # 🚨 PELIGRO
```

**¿Por qué?** 
- Las variables `VITE_*` se exponen en el código JavaScript del navegador
- Cualquiera puede abrir DevTools y ver estas claves
- Un atacante podría realizar cargos fraudulentos con tu `sk_live_*`

### ❌ NUNCA Commitear Claves

```bash
# ❌ MAL - NUNCA commitear estos archivos
git add .env
git add .env.local
git add .env.production
```

**Protección Actual:**
✅ `.gitignore` ya está configurado para ignorar estos archivos

---

## ✅ Flujo Correcto: Frontend ↔ Backend

### Pagos con Stripe

```
┌─────────────┐                 ┌─────────────┐                 ┌─────────────┐
│   Frontend  │                 │   Backend   │                 │   Stripe    │
│   (React)   │                 │  (FastAPI)  │                 │     API     │
└──────┬──────┘                 └──────┬──────┘                 └──────┬──────┘
       │                               │                               │
       │ 1. Solicitar Payment Intent   │                               │
       │──────────────────────────────>│                               │
       │                               │                               │
       │                               │ 2. Crear Payment Intent       │
       │                               │      (con sk_live_*)          │
       │                               │──────────────────────────────>│
       │                               │                               │
       │                               │ 3. client_secret              │
       │                               │<──────────────────────────────│
       │ 4. client_secret              │                               │
       │<──────────────────────────────│                               │
       │                               │                               │
       │ 5. Confirmar pago             │                               │
       │    (con client_secret +       │                               │
       │     pk_live_*)                │                               │
       │───────────────────────────────────────────────────────────────>│
       │                               │                               │
       │ 6. Resultado del pago         │                               │
       │<───────────────────────────────────────────────────────────────│
       │                               │                               │
       │ 7. Notificar éxito            │                               │
       │──────────────────────────────>│                               │
```

**Clave:**
- Frontend SOLO usa `pk_live_*` (público)
- Backend usa `sk_live_*` (secreto)
- El `client_secret` es temporal y específico para cada pago

---

## 🔍 Verificación de Seguridad

### Checklist Antes de Commitear

```bash
# 1. Verificar que no hay secret keys en código
git grep -i "sk_live_"
git grep -i "sk_test_"
git grep -i "SECRET_KEY"

# 2. Verificar que .env está ignorado
git status --ignored | grep ".env"

# 3. Verificar que .env.example NO tiene valores reales
cat .env.example
```

### Checklist Antes de Deploy

- [ ] ✅ Solo `pk_live_*` en variables de entorno del frontend
- [ ] ✅ `sk_live_*` está SOLO en el backend
- [ ] ✅ `.env.local` NO está en Git
- [ ] ✅ Variables de producción configuradas en Vercel/Netlify
- [ ] ✅ HTTPS habilitado
- [ ] ✅ CORS configurado correctamente
- [ ] ✅ Content Security Policy headers activos

---

## 🛡️ Mejores Prácticas

### 1. Separación de Entornos

```bash
# Development
.env.local              # Local development
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Production (Vercel/Netlify)
Environment Variables en el panel
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### 2. Rotación de Claves

Si accidentalmente expusiste una `sk_live_*`:

1. **Inmediatamente** ir a [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. **Revocar** la clave comprometida
3. **Generar** una nueva clave
4. **Actualizar** en el backend
5. **Verificar** que no haya transacciones fraudulentas

### 3. Monitoreo

- ✅ Activar alertas de Stripe para transacciones sospechosas
- ✅ Revisar logs de Stripe regularmente
- ✅ Configurar rate limiting en el backend
- ✅ Usar Stripe Radar para prevenir fraude

---

## 📚 Referencias

- [Stripe Security Best Practices](https://stripe.com/docs/security/guide)
- [Stripe API Keys](https://stripe.com/docs/keys)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [OWASP Secrets Management](https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_password)

---

## 🆘 Soporte

Si tienes dudas sobre seguridad:
- 📧 Email: hola@migro.es
- 📚 Docs: https://docs.migro.es/security

---

**Última actualización:** 24 de Octubre de 2025

