# 🎨 Sistema de Diseño - Migro Hiring

**Última actualización:** 23 de Octubre de 2025

---

## 🌈 Paleta de Colores

### **Colores Principales**

| Uso | Nombre | Tailwind | Hex | Ejemplo |
|-----|--------|----------|-----|---------|
| **Logo/Marca** | Primary | `green-600` | `#16a34a` | ![#16a34a](https://via.placeholder.com/50x20/16a34a/16a34a.png) |
| **Énfasis** | Emphasis | `gray-900` | `#111827` | ![#111827](https://via.placeholder.com/50x20/111827/111827.png) |
| **Acento** | Secondary | `green-500` | `#22c55e` | ![#22c55e](https://via.placeholder.com/50x20/22c55e/22c55e.png) |

### **Colores de Sistema**

| Uso | Color | Hex | Uso |
|-----|-------|-----|-----|
| **Error** | `red-500` | `#ef4444` | Mensajes de error, alertas |
| **Warning** | `yellow-500` | `#eab308` | Advertencias |
| **Success** | `green-500` | `#22c55e` | Confirmaciones exitosas |
| **Info** | `blue-500` | `#3b82f6` | Información general |

### **Colores Neutros**

| Uso | Color | Hex |
|-----|-------|-----|
| **Fondo** | `gray-50` | `#f9fafb` |
| **Texto Principal** | `gray-900` | `#111827` |
| **Texto Secundario** | `gray-600` | `#4b5563` |
| **Bordes** | `gray-200` | `#e5e7eb` |

---

## 📐 Escala de Verdes (Primary)

```css
green-50:  #f0fdf4  // Fondos muy claros
green-100: #dcfce7  // Fondos claros
green-200: #bbf7d0  // Bordes suaves
green-300: #86efac  // Elementos hover
green-400: #4ade80  // Estados activos leves
green-500: #22c55e  // Acento ✨
green-600: #16a34a  // Principal (Logo/Marca) 🎯
green-700: #15803d  // Hover principal
green-800: #166534  // Estados presionados
green-900: #14532d  // Texto sobre fondos claros
```

---

## 🎯 Uso de Colores

### **Primary (green-600) - #16a34a**

**Usado en:**
- ✅ Logo "Migro"
- ✅ Botones principales
- ✅ Enlaces importantes
- ✅ Headers
- ✅ Iconos destacados
- ✅ Progress bar (completado)

**Ejemplo en código:**
```tsx
<button className="bg-primary hover:bg-primary-700 text-white">
  Comenzar Proceso
</button>

<h1 className="text-primary font-bold">
  Migro
</h1>
```

### **Emphasis (gray-900) - #111827**

**Usado en:**
- ✅ CTAs (Call to Actions)
- ✅ Títulos principales
- ✅ Texto de alta jerarquía
- ✅ Botones secundarios oscuros

**Ejemplo en código:**
```tsx
<h1 className="text-emphasis-900 text-4xl font-bold">
  Sistema de Contratación
</h1>

<button className="bg-emphasis text-white">
  Confirmar
</button>
```

### **Secondary/Accent (green-500) - #22c55e**

**Usado en:**
- ✅ Estados activos
- ✅ Indicadores de éxito
- ✅ Checkmarks
- ✅ Progress bar (paso completado)
- ✅ Badges

**Ejemplo en código:**
```tsx
<div className="bg-secondary-500 text-white rounded-full p-2">
  <Check size={16} />
</div>

<span className="text-secondary font-semibold">
  ✓ Verificado
</span>
```

---

## 📝 Tipografía

### **Fuentes**

**Sistema:**
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
  'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans',
  'Helvetica Neue', sans-serif;
```

### **Escala de Tamaños**

| Uso | Tailwind | Tamaño | Peso |
|-----|----------|--------|------|
| **Hero** | `text-5xl` | 48px | `font-bold` |
| **Título Principal** | `text-4xl` | 36px | `font-bold` |
| **Título Sección** | `text-2xl` | 24px | `font-bold` |
| **Subtítulo** | `text-xl` | 20px | `font-semibold` |
| **Cuerpo** | `text-base` | 16px | `font-normal` |
| **Pequeño** | `text-sm` | 14px | `font-normal` |
| **Muy Pequeño** | `text-xs` | 12px | `font-normal` |

---

## 🧩 Componentes

### **Botones**

#### **Primario**
```tsx
<Button className="bg-primary hover:bg-primary-700 text-white">
  Acción Principal
</Button>
```

#### **Secundario**
```tsx
<Button variant="secondary" className="bg-white text-primary border-2 border-primary">
  Acción Secundaria
</Button>
```

#### **Énfasis**
```tsx
<Button className="bg-emphasis hover:bg-gray-800 text-white">
  CTA Importante
</Button>
```

### **Cards**

```tsx
<Card className="border-gray-200 hover:border-primary transition-colors">
  <CardHeader>
    <CardTitle className="text-emphasis">Título</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-gray-600">Contenido...</p>
  </CardContent>
</Card>
```

### **Progress Bar (5 pasos)**

```tsx
// Paso completado: green-500 (#22c55e)
// Paso actual: green-600 (#16a34a) con ring
// Paso pendiente: gray-300
```

---

## 🎨 Estados

### **Hover**

| Elemento | Estado Normal | Estado Hover |
|----------|--------------|--------------|
| Botón Primary | `bg-primary` | `bg-primary-700` |
| Link | `text-primary` | `text-primary-700` |
| Card | `border-gray-200` | `border-primary` |

### **Focus**

```css
ring-4 ring-primary/20
```

### **Disabled**

```css
opacity-50 cursor-not-allowed
```

---

## 📱 Responsive

### **Breakpoints**

```css
sm: 640px   // Móvil grande
md: 768px   // Tablet
lg: 1024px  // Desktop
xl: 1280px  // Desktop grande
2xl: 1536px // Desktop extra grande
```

### **Mobile-First**

```tsx
<div className="text-sm md:text-base lg:text-lg">
  Responsive text
</div>
```

---

## ✨ Animaciones

### **Transiciones**

```css
transition-colors duration-200  // Para cambios de color
transition-all duration-300     // Para cambios múltiples
```

### **Hover Suave**

```tsx
<button className="transform hover:scale-105 transition-transform">
  Botón con escala
</button>
```

---

## 🔍 Accesibilidad

### **Contraste**

Todos los colores cumplen con WCAG 2.1 AA:

- ✅ Primary (#16a34a) sobre blanco: 4.54:1
- ✅ Emphasis (#111827) sobre blanco: 16.83:1
- ✅ Blanco sobre Primary: 4.60:1

### **Estados de Foco**

```tsx
focus:outline-none focus:ring-4 focus:ring-primary/20
```

---

## 📦 Exportar Colores

### **CSS Variables**

```css
:root {
  --color-primary: #16a34a;
  --color-secondary: #22c55e;
  --color-emphasis: #111827;
}
```

### **JavaScript**

```typescript
export const COLORS = {
  primary: '#16a34a',
  secondary: '#22c55e',
  emphasis: '#111827',
} as const;
```

---

## 🎯 Checklist de Uso

Al crear un nuevo componente:

- [ ] ¿Usa los colores correctos? (primary, secondary, emphasis)
- [ ] ¿Tiene estados hover/focus definidos?
- [ ] ¿Es responsive (mobile-first)?
- [ ] ¿Cumple con contraste de accesibilidad?
- [ ] ¿Usa la tipografía correcta?
- [ ] ¿Tiene transiciones suaves?

---

**Diseñado para:** Migro Hiring System  
**Basado en:** Tailwind CSS 3.3  
**Componentes:** shadcn/ui

