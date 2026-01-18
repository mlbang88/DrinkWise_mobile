/**
 * Performance utilities pour optimiser l'app
 * Inclut: lazy loading, debouncing, memoization, web vitals tracking
 */

import { logger } from './logger';

/**
 * Debounce - Limite le nombre d'appels d'une fonction
 * Utile pour: search, resize, scroll events
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle - Limite la fréquence d'exécution
 * Utile pour: scroll handlers, animations
 */
export const throttle = (func, limit = 300) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Lazy load image - Charge l'image seulement quand visible
 */
export const lazyLoadImage = (imgElement, options = {}) => {
  const defaultOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.01
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.dataset.src;
          
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            obs.unobserve(img);
          }
        }
      });
    }, { ...defaultOptions, ...options });

    observer.observe(imgElement);
    return observer;
  } else {
    // Fallback pour navigateurs sans IntersectionObserver
    const src = imgElement.dataset.src;
    if (src) imgElement.src = src;
  }
};

/**
 * Preload critical resources
 */
export const preloadImage = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};

/**
 * Cache simple en mémoire
 */
class SimpleCache {
  constructor(maxSize = 50) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key) {
    return this.cache.get(key);
  }

  set(key, value) {
    // Si le cache est plein, supprimer l'élément le plus ancien
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  has(key) {
    return this.cache.has(key);
  }

  clear() {
    this.cache.clear();
  }
}

export const imageCache = new SimpleCache(100);
export const dataCache = new SimpleCache(50);

/**
 * Memoize function - Cache les résultats d'une fonction
 */
export const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

/**
 * Measure performance - Mesure le temps d'exécution
 */
export const measurePerformance = (name, fn) => {
  return async (...args) => {
    const startTime = performance.now();
    try {
      const result = await fn(...args);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      logger.debug(`Performance: ${name}`, { duration: `${duration.toFixed(2)}ms` });
      
      // Log dans Analytics si > 1 seconde (slow operation)
      if (duration > 1000) {
        logger.warn(`Slow operation: ${name}`, { duration: `${duration.toFixed(2)}ms` });
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      logger.error(`Performance error: ${name}`, { 
        duration: `${duration.toFixed(2)}ms`,
        error: error.message 
      });
      throw error;
    }
  };
};

/**
 * Web Vitals - Track Core Web Vitals
 */
export const trackWebVitals = () => {
  if ('PerformanceObserver' in window) {
    // Largest Contentful Paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        const lcp = lastEntry.renderTime || lastEntry.loadTime;
        
        logger.info('LCP', { value: `${lcp.toFixed(2)}ms` });
        
        if (lcp > 2500) {
          logger.warn('LCP is slow', { value: `${lcp.toFixed(2)}ms` });
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      // Ignore si non supporté
    }

    // First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          const fid = entry.processingStart - entry.startTime;
          logger.info('FID', { value: `${fid.toFixed(2)}ms` });
          
          if (fid > 100) {
            logger.warn('FID is slow', { value: `${fid.toFixed(2)}ms` });
          }
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      // Ignore si non supporté
    }

    // Cumulative Layout Shift (CLS)
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        logger.info('CLS', { value: clsValue.toFixed(4) });
        
        if (clsValue > 0.1) {
          logger.warn('CLS is high', { value: clsValue.toFixed(4) });
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      // Ignore si non supporté
    }
  }
};

/**
 * Optimize images - Retourne l'URL optimisée selon la taille d'écran
 */
export const getOptimizedImageUrl = (url, size = 'medium') => {
  if (!url) return null;
  
  // Si Firebase Storage, ajouter les paramètres de transformation
  if (url.includes('firebasestorage.googleapis.com')) {
    const sizes = {
      small: 400,
      medium: 800,
      large: 1200
    };
    
    const width = sizes[size] || 800;
    // Note: Firebase ne supporte pas nativement le resize
    // Il faudrait utiliser Cloud Functions ou un service externe
    return url;
  }
  
  return url;
};

/**
 * Bundle size - Log la taille des bundles
 */
export const logBundleSize = () => {
  if (performance.getEntriesByType) {
    const resources = performance.getEntriesByType('resource');
    const scripts = resources.filter(r => r.initiatorType === 'script');
    
    const totalSize = scripts.reduce((sum, script) => {
      return sum + (script.transferSize || 0);
    }, 0);
    
    logger.info('Bundle size', { 
      totalKB: (totalSize / 1024).toFixed(2),
      scripts: scripts.length 
    });
  }
};

/**
 * Memory usage (Chrome only)
 */
export const logMemoryUsage = () => {
  if (performance.memory) {
    const { usedJSHeapSize, jsHeapSizeLimit } = performance.memory;
    const usedMB = (usedJSHeapSize / 1024 / 1024).toFixed(2);
    const limitMB = (jsHeapSizeLimit / 1024 / 1024).toFixed(2);
    const percent = ((usedJSHeapSize / jsHeapSizeLimit) * 100).toFixed(1);
    
    logger.info('Memory usage', { 
      used: `${usedMB}MB`,
      limit: `${limitMB}MB`,
      percent: `${percent}%`
    });
    
    if (percent > 90) {
      logger.warn('High memory usage', { percent: `${percent}%` });
    }
  }
};

/**
 * Initialize performance tracking
 */
export const initPerformanceTracking = () => {
  // Track Web Vitals
  trackWebVitals();
  
  // Log bundle size après chargement
  if (document.readyState === 'complete') {
    logBundleSize();
  } else {
    window.addEventListener('load', logBundleSize);
  }
  
  // Log memory usage toutes les 30 secondes (dev only)
  if (import.meta.env.DEV) {
    setInterval(logMemoryUsage, 30000);
  }
  
  logger.info('Performance tracking initialized');
};

export default {
  debounce,
  throttle,
  lazyLoadImage,
  preloadImage,
  imageCache,
  dataCache,
  memoize,
  measurePerformance,
  trackWebVitals,
  getOptimizedImageUrl,
  initPerformanceTracking
};
