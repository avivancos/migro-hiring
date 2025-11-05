# 🧪 Tests de Integración TDD - Formularios CRM

## 📋 Resumen

Suite completa de tests de integración TDD para todos los formularios del CRM, verificando que los componentes se ejecutan correctamente y manejan correctamente las interacciones del usuario.

---

## 🎯 Formularios Testeados

### ✅ **LeadForm** (`src/components/CRM/__tests__/LeadForm.test.tsx`)
- ✅ Renderizado de todos los campos
- ✅ Carga de pipelines y usuarios
- ✅ Validación de campos requeridos
- ✅ Envío de formulario con datos válidos
- ✅ Cancelación del formulario
- ✅ Estado de carga durante submit
- ✅ Edición de lead existente

### ✅ **ContactForm** (`src/components/CRM/__tests__/ContactForm.test.tsx`)
- ✅ Renderizado de todos los campos
- ✅ Carga de empresas
- ✅ Validación de nombre requerido
- ✅ Validación de formato de email
- ✅ Envío de formulario con datos válidos
- ✅ Cancelación del formulario
- ✅ Edición de contacto existente

### ✅ **CompanyForm** (`src/components/CRM/__tests__/CompanyForm.test.tsx`)
- ✅ Renderizado de todos los campos
- ✅ Validación de nombre requerido
- ✅ Validación de formato de URL en sitio web
- ✅ Envío de formulario con datos válidos
- ✅ Cancelación del formulario
- ✅ Edición de empresa existente

### ✅ **TaskForm** (`src/components/CRM/__tests__/TaskForm.test.tsx`)
- ✅ Renderizado de todos los campos
- ✅ Carga de usuarios
- ✅ Validación de campos requeridos
- ✅ Validación de fecha por defecto (mañana 10:00)
- ✅ Selección de diferentes tipos de tarea
- ✅ Envío de formulario con datos válidos
- ✅ Cancelación del formulario
- ✅ Edición de tarea existente
- ✅ Campo de resultado para tareas completadas

### ✅ **AdminLogin** (`src/pages/__tests__/AdminLogin.test.tsx`)
- ✅ Renderizado de campos email y contraseña
- ✅ Validación de campos vacíos
- ✅ Validación de formato de email
- ✅ Proceso de login exitoso
- ✅ Manejo de credenciales incorrectas
- ✅ Validación de permisos de admin
- ✅ Estado de carga durante login
- ✅ Limpieza de errores al escribir

---

## 🚀 Instalación y Ejecución

### **1. Instalar Dependencias**

```bash
npm install
```

Las dependencias de testing incluyen:
- `vitest` - Framework de testing
- `@testing-library/react` - Utilidades para testing de React
- `@testing-library/user-event` - Simulación de interacciones de usuario
- `@testing-library/jest-dom` - Matchers adicionales para DOM
- `jsdom` - Entorno DOM para tests
- `@vitest/ui` - UI para visualizar tests

### **2. Ejecutar Tests**

```bash
# Modo watch (desarrollo)
npm run test

# Ejecutar una vez
npm run test:run

# Con UI interactiva
npm run test:ui

# Con cobertura de código
npm run test:coverage
```

---

## 📊 Cobertura de Tests

### **Cobertura por Componente:**

| Componente | Tests | Casos Cubiertos |
|------------|-------|-----------------|
| **LeadForm** | 8 tests | Renderizado, validación, envío, edición |
| **ContactForm** | 7 tests | Renderizado, validación, envío, edición |
| **CompanyForm** | 6 tests | Renderizado, validación, envío, edición |
| **TaskForm** | 8 tests | Renderizado, validación, envío, edición |
| **AdminLogin** | 9 tests | Renderizado, validación, login, permisos |

**Total: 38 tests de integración**

---

## 🧪 Estructura de los Tests

### **Patrón TDD Utilizado:**

1. **Arrange** - Preparar el entorno y datos de prueba
2. **Act** - Ejecutar la acción a testear
3. **Assert** - Verificar el resultado esperado

### **Ejemplo de Test:**

```typescript
it('debe enviar el formulario con datos válidos', async () => {
  // Arrange
  const user = userEvent.setup();
  render(<LeadForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

  // Act
  await user.type(screen.getByLabelText(/nombre/i), 'Nuevo Lead');
  await user.click(screen.getByRole('button', { name: /crear lead/i }));

  // Assert
  await waitFor(() => {
    expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Nuevo Lead'
    }));
  });
});
```

---

## 🔧 Configuración

### **vitest.config.ts**

```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

### **src/test/setup.ts**

- Configuración global de Vitest
- Mock de localStorage
- Mock de window.CloudTalk
- Mock de fetch
- Limpieza después de cada test

### **src/test/mockData.ts**

- Datos mock para pipelines, usuarios, empresas, contactos, leads y tareas
- Servicios mock (crmService, adminService)

---

## 📝 Casos de Uso Testeados

### **1. Validación de Formularios**

Todos los formularios validan:
- ✅ Campos requeridos (HTML5 validation)
- ✅ Formato de email
- ✅ Formato de URL (para sitios web)
- ✅ Tipos de datos correctos

### **2. Interacciones de Usuario**

- ✅ Escribir en campos de texto
- ✅ Seleccionar opciones en dropdowns
- ✅ Enviar formularios
- ✅ Cancelar formularios
- ✅ Limpiar errores al escribir

### **3. Estados de Carga**

- ✅ Mostrar estado de carga durante submit
- ✅ Deshabilitar botones durante carga
- ✅ Restaurar estado después de carga

### **4. Carga de Datos**

- ✅ Cargar pipelines al montar LeadForm
- ✅ Cargar usuarios al montar formularios
- ✅ Cargar empresas al montar ContactForm
- ✅ Manejar errores de carga

### **5. Edición de Entidades**

- ✅ Prellenar formularios con datos existentes
- ✅ Mostrar título de edición
- ✅ Mantener datos existentes al editar

---

## 🐛 Manejo de Errores

Los tests verifican:
- ✅ Validación de campos vacíos
- ✅ Validación de formatos incorrectos
- ✅ Manejo de errores de API
- ✅ Mensajes de error apropiados
- ✅ Prevención de submit con datos inválidos

---

## 📈 Métricas de Calidad

### **Cobertura Esperada:**

- **Líneas de código:** > 80%
- **Funciones:** > 90%
- **Branches:** > 75%
- **Statements:** > 80%

### **Ejecutar Reporte de Cobertura:**

```bash
npm run test:coverage
```

El reporte se genera en `coverage/` con:
- Reporte HTML interactivo
- Reporte JSON para CI/CD
- Reporte de texto en consola

---

## 🔄 CI/CD Integration

### **GitHub Actions Example:**

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:run
      - run: npm run test:coverage
```

---

## 📚 Referencias

- **Vitest:** https://vitest.dev/
- **React Testing Library:** https://testing-library.com/react
- **User Event:** https://testing-library.com/docs/user-event/intro
- **Jest DOM:** https://github.com/testing-library/jest-dom

---

## ✅ Checklist de Tests

### **Para cada formulario:**

- [x] Renderizado de todos los campos
- [x] Validación de campos requeridos
- [x] Validación de formatos (email, URL, etc.)
- [x] Envío de formulario con datos válidos
- [x] Cancelación del formulario
- [x] Estado de carga durante submit
- [x] Edición de entidad existente
- [x] Carga de datos relacionados (pipelines, usuarios, etc.)
- [x] Manejo de errores

---

## 🎯 Próximos Tests Sugeridos

### **Tests de Integración Pendientes:**

1. **Tests E2E** con Playwright/Cypress
2. **Tests de componentes visuales** con Storybook
3. **Tests de accesibilidad** (a11y)
4. **Tests de rendimiento**
5. **Tests de rutas protegidas**

---

## 🚀 Ejecución Rápida

```bash
# Instalar dependencias
npm install

# Ejecutar todos los tests
npm run test:run

# Ver cobertura
npm run test:coverage

# Modo watch (desarrollo)
npm run test
```

---

**Todos los tests están listos para ejecutarse y validar el correcto funcionamiento de los formularios del CRM.** ✅

