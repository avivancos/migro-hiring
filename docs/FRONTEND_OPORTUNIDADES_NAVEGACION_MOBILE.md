# Oportunidades en Navegación Móvil - CRM Header

**Fecha:** 6 de enero de 2026  
**Estado:** ✅ Implementado

## Resumen

El módulo de "Oportunidades" ya está incluido en la navegación móvil del CRM Header y debería aparecer correctamente en el menú hamburguesa móvil.

## Implementación

### Ubicación del código

**Archivo:** `src/components/CRM/CRMHeader.tsx`

### Array de navegación

El array `navItems` (línea 129-137) incluye "Oportunidades":

```typescript
const navItems = [
  { path: '/crm', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/crm/contacts', label: 'Contactos', icon: Users },
  { path: '/crm/opportunities', label: 'Oportunidades', icon: TrendingUp },
  { path: '/crm/tasks', label: 'Tareas', icon: CheckSquare },
  { path: '/crm/calendar', label: 'Calendario', icon: Calendar },
  { path: '/crm/expedientes', label: 'Expedientes', icon: FileText },
  { path: '/crm/settings', label: 'Configuración', icon: Settings },
];
```

### Menú Desktop

El menú desktop itera sobre `navItems` (líneas 395-412) y muestra todos los módulos, incluyendo "Oportunidades".

### Menú Móvil

El menú móvil también itera sobre `navItems` (líneas 465-483) y muestra todos los módulos:

```typescript
{navItems.map((item) => {
  const Icon = item.icon;
  const active = isActive(item.path);
  return (
    <Link
      key={item.path}
      to={item.path}
      onClick={() => setMobileMenuOpen(false)}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
        active
          ? 'bg-primary/10 text-primary'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <Icon size={20} />
      {item.label}
    </Link>
  );
})}
```

## Características

- ✅ Icono: `TrendingUp` de lucide-react
- ✅ Ruta: `/crm/opportunities`
- ✅ Label: "Oportunidades"
- ✅ Aparece en menú desktop (pantallas md y superiores)
- ✅ Aparece en menú móvil (menú hamburguesa)
- ✅ Indicador de página activa funcional
- ✅ Cierra el menú móvil al hacer clic

## Orden de navegación

1. Dashboard
2. Contactos
3. **Oportunidades** ← Tercera posición
4. Tareas
5. Calendario
6. Expedientes
7. Configuración

## Solución de problemas

Si no ves "Oportunidades" en el menú móvil:

1. **Limpiar caché del navegador:**
   - Chrome/Edge: Ctrl + Shift + Delete
   - Firefox: Ctrl + Shift + Delete
   - Safari: Cmd + Option + E

2. **Refrescar página:**
   - Ctrl + F5 (Windows)
   - Cmd + Shift + R (Mac)

3. **Verificar que estés en una ruta del CRM:**
   - El menú solo aparece en rutas que NO sean la home (`/`)
   - Verifica que estés en `/crm/*`

4. **Verificar build:**
   - Si estás en desarrollo, asegúrate de que el servidor de desarrollo esté corriendo
   - Si estás en producción, asegúrate de que el build esté actualizado

## Notas técnicas

- El componente usa el mismo array `navItems` para ambos menús (desktop y móvil)
- Cualquier cambio en `navItems` afectará automáticamente a ambos menús
- El icono `TrendingUp` debe estar importado de `lucide-react` (línea 25)
- El estado `mobileMenuOpen` controla la visibilidad del menú móvil

## Referencias

- **Componente:** `src/components/CRM/CRMHeader.tsx`
- **Líneas relevantes:** 129-137 (navItems), 395-412 (desktop), 465-483 (móvil)
- **Documentación relacionada:** `docs/BACKEND_OPPORTUNITIES_UNASSIGN_ENDPOINT.md`
