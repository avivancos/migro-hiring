// Hook para manejar títulos dinámicos de página con SEO
// Actualiza el título del documento y meta tags según la ruta actual

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getPageTitle } from '@/config/pageTitles';

export interface SEOOptions {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: string;
}

/**
 * Actualiza o crea un meta tag en el head del documento
 */
function updateMetaTag(name: string, content: string, attribute: string = 'name') {
  let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
  
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  
  element.setAttribute('content', content);
}

/**
 * Hook que actualiza automáticamente el título de la página y meta tags
 * basado en la ruta actual para mejorar el SEO
 * 
 * @example
 * ```tsx
 * function MyPage() {
 *   usePageTitle(); // Actualiza el título automáticamente
 *   return <div>Mi página</div>;
 * }
 * ```
 * 
 * @example
 * ```tsx
 * function MyPage() {
 *   usePageTitle('Título Personalizado | Migro.es'); // Usa un título específico
 *   return <div>Mi página</div>;
 * }
 * ```
 * 
 * @example
 * ```tsx
 * function MyPage() {
 *   usePageTitle('Título | Migro.es', {
 *     description: 'Descripción personalizada de la página',
 *     ogTitle: 'Título para Open Graph',
 *     ogDescription: 'Descripción para Open Graph',
 *   });
 *   return <div>Mi página</div>;
 * }
 * ```
 */
export function usePageTitle(customTitle?: string, seoOptions?: SEOOptions) {
  const location = useLocation();
  
  useEffect(() => {
    const title = customTitle || getPageTitle(location.pathname);
    
    // Solo actualizar si el título cambió
    if (document.title !== title) {
      document.title = title;
    }
    
    // Actualizar meta description solo si se proporciona o si es necesario
    const defaultDescription = 'Migro.es - Contratación y pago de servicios legales de Migro. Residencia legal en España.';
    const description = seoOptions?.description || defaultDescription;
    
    // Solo actualizar meta tags si realmente cambiaron (optimización)
    const currentDesc = document.querySelector('meta[name="description"]')?.getAttribute('content');
    if (currentDesc !== description) {
      updateMetaTag('description', description);
    }
    
    // Actualizar Open Graph tags
    const ogTitle = seoOptions?.ogTitle || title;
    const ogDescription = seoOptions?.ogDescription || description;
    const ogUrl = seoOptions?.ogUrl || window.location.href;
    const ogType = seoOptions?.ogType || 'website';
    const ogImage = seoOptions?.ogImage || `${window.location.origin}/assets/migro-logo.png`;
    
    // Actualizar OG tags solo si son necesarios (evitar actualizaciones innecesarias)
    updateMetaTag('og:title', ogTitle, 'property');
    updateMetaTag('og:description', ogDescription, 'property');
    updateMetaTag('og:url', ogUrl, 'property');
    updateMetaTag('og:type', ogType, 'property');
    updateMetaTag('og:image', ogImage, 'property');
    
    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', ogTitle);
    updateMetaTag('twitter:description', ogDescription);
    updateMetaTag('twitter:image', ogImage);
    
    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    const currentCanonical = canonical.getAttribute('href');
    if (currentCanonical !== ogUrl) {
      canonical.setAttribute('href', ogUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, customTitle]);
}

