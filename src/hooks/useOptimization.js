import { useState, useEffect, useRef } from 'react';

// Hook personnalisé pour la mise en cache des données
export const useCache = (key, fetchFunction, dependencies = [], ttl = 5 * 60 * 1000) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cacheRef = useRef(new Map());
  const timestampRef = useRef(new Map());

  useEffect(() => {
    const fetchData = async () => {
      const cacheKey = `${key}_${JSON.stringify(dependencies)}`;
      const cachedData = cacheRef.current.get(cacheKey);
      const timestamp = timestampRef.current.get(cacheKey);
      const now = Date.now();

      // Vérifier si les données en cache sont encore valides
      if (cachedData && timestamp && (now - timestamp) < ttl) {
        setData(cachedData);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await fetchFunction();
        
        // Mettre en cache les nouvelles données
        cacheRef.current.set(cacheKey, result);
        timestampRef.current.set(cacheKey, now);
        
        setData(result);
      } catch (err) {
        setError(err);
        console.error(`Erreur lors du fetch pour ${key}:`, err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, dependencies);

  // Fonction pour invalider le cache
  const invalidateCache = (specificKey = null) => {
    if (specificKey) {
      cacheRef.current.delete(specificKey);
      timestampRef.current.delete(specificKey);
    } else {
      cacheRef.current.clear();
      timestampRef.current.clear();
    }
  };

  return { data, loading, error, invalidateCache };
};

// Hook pour debouncer les appels d'API
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hook pour optimiser les re-renders des listes
export const useMemoizedList = (list, compareFn = JSON.stringify) => {
  const [memoizedList, setMemoizedList] = useState(list);
  const lastComparison = useRef();

  useEffect(() => {
    const currentComparison = compareFn(list);
    if (lastComparison.current !== currentComparison) {
      setMemoizedList(list);
      lastComparison.current = currentComparison;
    }
  }, [list, compareFn]);

  return memoizedList;
};

// Hook pour gérer l'intersection observer (lazy loading)
export const useIntersectionObserver = (ref, options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold: 0.1, rootMargin: '50px', ...options }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [ref, options]);

  return isIntersecting;
};