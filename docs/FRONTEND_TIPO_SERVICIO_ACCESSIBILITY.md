# ♿ Guía de Accesibilidad - Componentes Tipo Servicio

**Fecha**: 2025-01-28  
**Módulo**: Frontend - Oportunidades CRM  
**Versión**: 1.0.0  
**Estándar**: WCAG 2.1 Level AA

---

## 📋 Índice

1. [Principios de Accesibilidad](#principios-de-accesibilidad)
2. [ARIA Implementation](#aria-implementation)
3. [Keyboard Navigation](#keyboard-navigation)
4. [Screen Reader Support](#screen-reader-support)
5. [Visual Accessibility](#visual-accessibility)
6. [Testing de Accesibilidad](#testing-de-accesibilidad)
7. [Checklist WCAG](#checklist-wcag)

---

## 🎯 Principios de Accesibilidad

### POUR (Perceivable, Operable, Understandable, Robust)

1. **Perceivable**: La información debe ser presentable a los usuarios de manera que puedan percibirla
2. **Operable**: Los componentes de interfaz deben ser operables
3. **Understandable**: La información y el funcionamiento de la interfaz deben ser comprensibles
4. **Robust**: El contenido debe ser lo suficientemente robusto para ser interpretado por una amplia variedad de agentes de usuario

---

## 🏷️ ARIA Implementation

### TipoServicioSelector

#### Roles y Estados

```typescript
// Combobox principal
<button
  role="combobox"
  aria-expanded={isOpen}
  aria-haspopup="listbox"
  aria-controls="tipo-servicio-listbox"
  aria-label="Seleccionar tipo de servicio"
  aria-describedby="tipo-servicio-description"
>
  {selectedService?.name || placeholder}
</button>

// Descripción
<span id="tipo-servicio-description" className="sr-only">
  Selecciona un tipo de servicio de la lista desplegable. 
  Usa las flechas para navegar y Enter para seleccionar.
</span>

// Listbox
<div
  role="listbox"
  id="tipo-servicio-listbox"
  aria-label="Lista de tipos de servicio"
>
  {categories.map(category => (
    <div key={category} role="group" aria-label={category}>
      {services.map(service => (
        <div
          key={service.code}
          role="option"
          aria-selected={selectedService?.code === service.code}
          aria-disabled={!isServiceValid(service)}
          id={`option-${service.code}`}
        >
          {service.name}
        </div>
      ))}
    </div>
  ))}
</div>

// Mensajes de estado
{error && (
  <div role="alert" id="tipo-servicio-error" aria-live="assertive">
    {error}
  </div>
)}

{isLoading && (
  <div role="status" aria-live="polite" aria-label="Cargando servicios">
    Cargando...
  </div>
)}
```

#### Atributos ARIA Clave

- `role="combobox"`: Identifica el selector como combobox
- `aria-expanded`: Indica si el dropdown está abierto
- `aria-haspopup="listbox"`: Indica que tiene un popup de tipo listbox
- `aria-controls`: Relaciona el botón con el listbox
- `aria-label`: Etiqueta descriptiva
- `aria-describedby`: Referencia a descripción adicional
- `role="listbox"`: Contenedor de opciones
- `role="option"`: Cada opción individual
- `aria-selected`: Indica opción seleccionada
- `aria-disabled`: Indica opción deshabilitada
- `role="alert"`: Mensajes de error críticos
- `role="status"`: Mensajes informativos
- `aria-live`: Región live para anuncios

### FirstCallSummary

#### Roles y Estados

```typescript
<textarea
  id="first-call-summary"
  aria-label="Resumen de la primera llamada"
  aria-describedby="summary-description summary-counter summary-error"
  aria-invalid={hasError}
  aria-required={required}
  aria-disabled={disabled}
  rows={minRows}
/>

// Descripción
<span id="summary-description" className="sr-only">
  Escribe un resumen de la primera llamada realizada al cliente.
  Mínimo {minLength} caracteres, máximo {maxLength} caracteres.
</span>

// Contador
<span
  id="summary-counter"
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  {characterCount} / {maxLength} caracteres
</span>

// Error
{hasError && (
  <div
    id="summary-error"
    role="alert"
    aria-live="assertive"
  >
    {errorMessage}
  </div>
)}

// Indicador de guardado
{isSaving && (
  <div role="status" aria-live="polite" aria-label="Guardando resumen">
    Guardando...
  </div>
)}

{lastSaved && (
  <div role="status" aria-live="polite" aria-label="Resumen guardado">
    Guardado {formatTime(lastSaved)}
  </div>
)}
```

---

## ⌨️ Keyboard Navigation

### TipoServicioSelector

#### Navegación por Teclado

```typescript
const handleKeyDown = (e: React.KeyboardEvent) => {
  switch (e.key) {
    case 'Enter':
    case ' ':
      e.preventDefault();
      if (isOpen) {
        // Seleccionar opción actual
        selectOption(focusedIndex);
      } else {
        // Abrir dropdown
        setIsOpen(true);
      }
      break;
      
    case 'Escape':
      e.preventDefault();
      setIsOpen(false);
      break;
      
    case 'ArrowDown':
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        // Mover al siguiente
        setFocusedIndex(prev => 
          Math.min(prev + 1, filteredServices.length - 1)
        );
      }
      break;
      
    case 'ArrowUp':
      e.preventDefault();
      if (isOpen) {
        // Mover al anterior
        setFocusedIndex(prev => Math.max(prev - 1, 0));
      }
      break;
      
    case 'Home':
      e.preventDefault();
      if (isOpen) {
        setFocusedIndex(0);
      }
      break;
      
    case 'End':
      e.preventDefault();
      if (isOpen) {
        setFocusedIndex(filteredServices.length - 1);
      }
      break;
      
    case 'Tab':
      // Cerrar al salir
      if (isOpen) {
        setIsOpen(false);
      }
      break;
  }
};
```

#### Focus Management

```typescript
// Auto-focus en búsqueda cuando se abre
useEffect(() => {
  if (isOpen && searchInputRef.current) {
    searchInputRef.current.focus();
  }
}, [isOpen]);

// Scroll a opción enfocada
useEffect(() => {
  if (focusedIndex >= 0 && optionRefs.current[focusedIndex]) {
    optionRefs.current[focusedIndex].scrollIntoView({
      block: 'nearest',
      behavior: 'smooth'
    });
  }
}, [focusedIndex]);

// Restaurar focus al cerrar
const handleClose = () => {
  setIsOpen(false);
  // Restaurar focus al botón
  buttonRef.current?.focus();
};
```

### FirstCallSummary

#### Navegación por Teclado

```typescript
const handleKeyDown = (e: React.KeyboardEvent) => {
  // Ctrl/Cmd + Enter para guardar
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    handleSave();
  }
  
  // Escape para cancelar (si hay cambios no guardados)
  if (e.key === 'Escape' && hasUnsavedChanges) {
    // Mostrar confirmación
    if (confirm('¿Descartar cambios?')) {
      setValue(initialValue);
    }
  }
};
```

---

## 🔊 Screen Reader Support

### Anuncios Dinámicos

```typescript
// Anunciar selección
const announceSelection = (service: TipoServicio) => {
  const announcement = `Seleccionado: ${service.name}`;
  setAnnouncement(announcement);
  
  // Limpiar después de 2 segundos
  setTimeout(() => setAnnouncement(''), 2000);
};

// Región live para anuncios
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  {announcement}
</div>
```

### Etiquetas Descriptivas

```typescript
// Para opciones con validación
<div
  role="option"
  aria-label={`${service.name}. ${service.description || ''} ${
    !isServiceValid(service) 
      ? 'No disponible para tu nacionalidad' 
      : ''
  }`}
>
  {service.name}
</div>

// Para estados de guardado
<div
  role="status"
  aria-live="polite"
  aria-label={`Resumen guardado hace ${formatTimeAgo(lastSaved)}`}
>
  Guardado {formatTime(lastSaved)}
</div>
```

### Texto Oculto para Screen Readers

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

---

## 👁️ Visual Accessibility

### Contraste de Colores

#### WCAG AA Requirements

- **Texto normal**: Ratio mínimo 4.5:1
- **Texto grande**: Ratio mínimo 3:1
- **Componentes UI**: Ratio mínimo 3:1

#### Implementación

```css
/* Colores con contraste adecuado */
.tipo-servicio-primary {
  color: #10b981; /* Verde con contraste 4.5:1 sobre blanco */
}

.tipo-servicio-error {
  color: #dc2626; /* Rojo con contraste 4.5:1 sobre blanco */
}

.tipo-servicio-text {
  color: #1f2937; /* Gris oscuro con contraste 12:1 sobre blanco */
}
```

### Estados Visibles sin Color

```typescript
// Error no solo con color rojo
{error && (
  <div className="error-message">
    <Icon name="alert-circle" aria-hidden="true" />
    <span>{error}</span>
  </div>
)}

// Selección no solo con color
<div
  role="option"
  className={cn(
    "option",
    isSelected && "option-selected", // Borde + fondo + icono
    isFocused && "option-focused" // Outline
  )}
>
  {isSelected && <Icon name="check" aria-hidden="true" />}
  {service.name}
</div>
```

### Focus Visible

```css
/* Focus visible en todos los elementos interactivos */
*:focus-visible {
  outline: 2px solid #10b981;
  outline-offset: 2px;
}

/* Focus para navegación por teclado */
.keyboard-navigation *:focus {
  outline: 2px solid #10b981;
  outline-offset: 2px;
}

/* Sin outline para mouse */
.mouse-navigation *:focus:not(:focus-visible) {
  outline: none;
}
```

### Tamaños de Touch Targets

```css
/* Mínimo 44x44px para iOS */
.touch-target {
  min-width: 44px;
  min-height: 44px;
  padding: 12px; /* Espaciado generoso */
}

/* Mínimo 48x48px para Android */
@media (min-width: 768px) {
  .touch-target {
    min-width: 48px;
    min-height: 48px;
  }
}
```

---

## 🧪 Testing de Accesibilidad

### Con jest-axe

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('should not have accessibility violations', async () => {
  const { container } = render(<TipoServicioSelector onChange={() => {}} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Con @axe-core/react

```typescript
import { axe } from '@axe-core/react';

it('should pass axe tests', async () => {
  const { container } = render(<TipoServicioSelector onChange={() => {}} />);
  const results = await axe(container);
  expect(results.violations).toHaveLength(0);
});
```

### Test Manual con Screen Readers

#### NVDA (Windows)

1. Instalar NVDA
2. Abrir aplicación
3. Navegar con teclado
4. Verificar anuncios
5. Verificar navegación

#### JAWS (Windows)

1. Instalar JAWS
2. Abrir aplicación
3. Navegar con teclado
4. Verificar anuncios
5. Verificar navegación

#### VoiceOver (macOS/iOS)

1. Activar VoiceOver (Cmd + F5)
2. Navegar con teclado
3. Verificar anuncios
4. Verificar navegación

### Test de Navegación por Teclado

```typescript
it('can navigate with keyboard only', async () => {
  render(<TipoServicioSelector onChange={() => {}} />);
  
  // Tab para enfocar
  await userEvent.tab();
  expect(screen.getByRole('combobox')).toHaveFocus();
  
  // Enter para abrir
  await userEvent.keyboard('{Enter}');
  expect(screen.getByRole('listbox')).toBeInTheDocument();
  
  // Flechas para navegar
  await userEvent.keyboard('{ArrowDown}');
  await userEvent.keyboard('{ArrowDown}');
  
  // Enter para seleccionar
  await userEvent.keyboard('{Enter}');
  expect(mockOnChange).toHaveBeenCalled();
});
```

---

## ✅ Checklist WCAG 2.1 Level AA

### Perceivable

- [x] **1.1.1 Non-text Content**: Iconos tienen `aria-label` o `aria-hidden="true"`
- [x] **1.3.1 Info and Relationships**: Estructura semántica correcta
- [x] **1.3.2 Meaningful Sequence**: Orden lógico de elementos
- [x] **1.4.3 Contrast (Minimum)**: Contraste 4.5:1 para texto normal
- [x] **1.4.4 Resize Text**: Texto escalable hasta 200%
- [x] **1.4.5 Images of Text**: No usar imágenes de texto

### Operable

- [x] **2.1.1 Keyboard**: Todas las funciones accesibles por teclado
- [x] **2.1.2 No Keyboard Trap**: No hay trampas de teclado
- [x] **2.4.3 Focus Order**: Orden lógico de focus
- [x] **2.4.4 Link Purpose**: Propósito claro de enlaces
- [x] **2.4.7 Focus Visible**: Focus visible
- [x] **2.5.1 Pointer Gestures**: No requiere gestos complejos
- [x] **2.5.2 Pointer Cancellation**: Cancelación de acciones
- [x] **2.5.3 Label in Name**: Etiquetas coinciden con nombre accesible
- [x] **2.5.4 Motion Actuation**: No requiere movimiento del dispositivo

### Understandable

- [x] **3.2.1 On Focus**: No cambia contexto al recibir focus
- [x] **3.2.2 On Input**: No cambia contexto al recibir input
- [x] **3.3.1 Error Identification**: Errores identificados claramente
- [x] **3.3.2 Labels or Instructions**: Labels e instrucciones claras
- [x] **3.3.3 Error Suggestion**: Sugerencias de corrección
- [x] **3.3.4 Error Prevention**: Prevención de errores

### Robust

- [x] **4.1.1 Parsing**: HTML válido
- [x] **4.1.2 Name, Role, Value**: Roles y propiedades ARIA correctas
- [x] **4.1.3 Status Messages**: Mensajes de estado anunciados

---

## 📚 Recursos Adicionales

### Herramientas

- **axe DevTools**: Extensión de navegador
- **WAVE**: Evaluador de accesibilidad web
- **Lighthouse**: Auditoría de accesibilidad
- **NVDA**: Screen reader gratuito
- **VoiceOver**: Screen reader de Apple

### Documentación

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)

---

**Última actualización**: 2025-01-28
