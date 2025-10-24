# 🌍 Migro Hiring - Sistema de Contratación

Sistema web profesional para la contratación autónoma de servicios legales de Migro, con verificación de identidad KYC y procesamiento de pagos integrados.

## 📋 Descripción

Plataforma completa que permite a los clientes completar el proceso de contratación de servicios de residencia legal en España de manera autónoma, incluyendo:

- ✅ Generación de códigos de contratación únicos
- ✅ Visualización y aceptación de contratos digitales
- ✅ Verificación de identidad (KYC) con Stripe Identity
- ✅ Procesamiento de pagos seguros con Stripe
- ✅ Sistema de calificación de clientes (A, B, C)
- ✅ Panel de administración para operadores de Migro

## 🎯 Características Principales

### Para Clientes
- **Sin necesidad de login**: El código de contratación es suficiente
- **Proceso guiado en 5 pasos**: Flujo intuitivo y sin fricción
- **Contrato PDF dinámico**: Generado con datos reales del cliente
- **Verificación de identidad**: KYC profesional con Stripe Identity
- **Pagos flexibles**: Sistema de 2 pagos (50% + 50%)
- **Mobile-friendly**: Diseño responsive para todos los dispositivos

### Para Administradores
- **Panel de gestión**: Crear códigos de contratación fácilmente
- **Sistema de calificación**: Asignar grados A, B o C según estudio
- **Pricing dinámico**: 400€ (A/B) o 600€ (C) automático
- **Gestión de datos**: Formulario completo de información del cliente

## 🏗️ Stack Tecnológico

### Frontend
- **React 18** + TypeScript
- **Vite** - Build tool ultra-rápido
- **Tailwind CSS** + **shadcn/ui** - UI moderna y consistente
- **React Router v6** - Enrutamiento
- **Zustand** - State management
- **React Hook Form** + **Zod** - Validación de formularios
- **Framer Motion** - Animaciones fluidas
- **jsPDF** - Generación de contratos PDF
- **Stripe.js** - Integraciones de pago y KYC

### Backend (Esperado)
- **FastAPI** (Python)
- **PostgreSQL** - Base de datos
- **SQLAlchemy** - ORM
- **Stripe API** - Pagos y verificación
- **Alembic** - Migraciones

### DevOps
- **Docker** + **Docker Compose**
- **Nginx** - Servidor web de producción
- **Multi-stage builds** - Optimización de imágenes

## 🚀 Instalación y Uso

### Prerequisitos
- Node.js 20+
- Docker y Docker Compose (opcional pero recomendado)
- Cuenta de Stripe (publishable key)

### 1. Clonar el repositorio
```bash
git clone https://github.com/avivancos/migro-hiring.git
cd migro-hiring
```

### 2. Configurar variables de entorno
```bash
# Copiar el archivo de ejemplo
cp .env.example .env.local

# Editar .env.local con tus claves
# VITE_API_BASE_URL=https://api.migro.es/api
# VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### 3. Opción A: Desarrollo con Docker (Recomendado)
```bash
# Iniciar entorno de desarrollo
docker-compose up dev

# La aplicación estará disponible en:
# http://localhost:5173
```

### 4. Opción B: Desarrollo local
```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

### 5. Build de producción
```bash
# Con Docker
docker-compose up prod

# Sin Docker
npm run build
npm run preview
```

## 📁 Estructura del Proyecto

```
migro-hiring/
├── src/
│   ├── components/          # Componentes React
│   │   ├── Layout/          # Header, Footer, ProgressBar
│   │   ├── ui/              # Componentes shadcn/ui
│   │   ├── ConfirmData.tsx
│   │   ├── ContractViewer.tsx
│   │   ├── KYCVerification.tsx
│   │   ├── PaymentForm.tsx
│   │   └── ServiceDetails.tsx
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useHiringData.ts
│   │   └── usePayment.ts
│   ├── pages/               # Páginas/Rutas
│   │   ├── Home.tsx
│   │   ├── HiringFlow.tsx
│   │   ├── AdminLogin.tsx
│   │   └── AdminDashboard.tsx
│   ├── services/            # API clients
│   │   ├── api.ts
│   │   ├── hiringService.ts
│   │   └── adminService.ts
│   ├── types/               # TypeScript types
│   │   ├── hiring.ts
│   │   └── admin.ts
│   ├── utils/               # Utilidades
│   │   ├── contractPdfGenerator.ts
│   │   ├── formatters.ts
│   │   └── validators.ts
│   └── App.tsx              # Componente raíz
├── docker/                  # Configuración Docker
│   ├── nginx.conf
│   └── README.md
├── public/
│   └── assets/              # Recursos estáticos
├── Dockerfile
├── docker-compose.yml
├── package.json
└── vite.config.ts
```

## 🎨 Sistema de Calificación

| Grado | Evaluación | Precio Total | 1er Pago | 2do Pago |
|-------|-----------|--------------|----------|----------|
| **A** | Alta probabilidad de éxito | 400€ | 200€ | 200€ |
| **B** | Probabilidad media | 400€ | 200€ | 200€ |
| **C** | Caso complejo | 600€ | 300€ | 300€ |

### Garantía de Devolución
- **Condiciones**: 2 rechazos administrativos en < 12 meses (no imputables al cliente)
- **Monto**: Total pagado - 35€ (gastos de gestión)

## 🔄 Flujo de Usuario

### Paso 1: Revisión de Detalles
- Cliente recibe código único
- Visualiza información del servicio
- Ve su calificación asignada

### Paso 2: Confirmación de Datos y Contrato
- Revisa datos personales
- Lee contrato PDF embebido
- Acepta términos y condiciones

### Paso 3: Verificación de Identidad (KYC)
- Stripe Identity verification
- Subida de documento de identidad
- Selfie de verificación
- Auto-detección de redirección

### Paso 4: Primer Pago
- 50% del total (200€ o 300€)
- Stripe Payment Intent
- Tarjeta de crédito/débito

### Paso 5: Confirmación y Descarga
- Contrato firmado disponible
- Email de confirmación
- Seguimiento del proceso

## 🔐 Seguridad

- ✅ **HTTPS** obligatorio en producción
- ✅ **CORS** configurado correctamente
- ✅ **Stripe** cumple con PCI-DSS
- ✅ **GDPR** compliant
- ✅ **Content Security Policy** headers
- ✅ **XSS Protection** activada
- ✅ **Rate limiting** (Nginx)

## 📄 Endpoints de API

### Públicos (Sin autenticación)
```
GET  /api/hiring/{code}                      # Obtener detalles
POST /api/hiring/{code}/confirm-data         # Confirmar datos
POST /api/hiring/{code}/contract/accept      # Aceptar contrato
POST /api/hiring/{code}/kyc/start            # Iniciar KYC
POST /api/hiring/{code}/kyc/complete         # Completar KYC
POST /api/hiring/{code}/payment              # Procesar pago
GET  /api/hiring/{code}/contract/download    # Descargar contrato
```

### Administración (Requieren autenticación)
```
POST /api/admin/hiring/create                # Crear código
GET  /api/admin/hiring/list                  # Listar códigos
```

## 🌐 Deployment

### Vercel (Recomendado)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deploy
vercel --prod
```

### Netlify
```bash
# Instalar Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy

# Production deploy
netlify deploy --prod
```

### Docker en servidor propio
```bash
# Build imagen de producción
docker build -t migro-hiring:latest .

# Run en producción
docker run -d -p 80:80 migro-hiring:latest
```

## 🧪 Testing

```bash
# Unit tests (cuando se implementen)
npm run test

# E2E tests
npm run test:e2e

# Linting
npm run lint
```

## 📝 Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | URL base del backend | `https://api.migro.es/api` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe public key | `pk_live_...` |
| `VITE_APP_URL` | URL del frontend | `https://contratacion.migro.es` |
| `VITE_DEBUG_MODE` | Modo debug | `false` |
| `VITE_API_TIMEOUT` | Timeout de API (ms) | `30000` |

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'feat: add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📜 Licencia

© 2025 Migro Servicios y Remesas SL. Todos los derechos reservados.

## 📞 Soporte

- **Email**: hola@migro.es
- **Web**: https://migro.es
- **Documentación**: https://docs.migro.es

## 🎉 Agradecimientos

- Stripe por las APIs de pago y KYC
- shadcn/ui por los componentes React
- La comunidad de React y TypeScript

---

**Desarrollado con ❤️ por el equipo de Migro**
