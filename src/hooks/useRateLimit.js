import { useRef, useCallback } from 'react';
import { logger } from '../utils/logger';

/**
 * Hook pour limiter le taux d'appels d'une fonction
 * @param {number} maxCalls - Nombre maximum d'appels autorisés
 * @param {number} windowMs - Fenêtre de temps en millisecondes
 * @returns {function} - Fonction wrapper qui applique le rate limiting
 */
export const useRateLimit = (maxCalls = 1, windowMs = 1000) => {
  const callTimestamps = useRef([]);

  const checkRateLimit = useCallback((action) => {
    const now = Date.now();
    
    // Nettoyer les timestamps hors de la fenêtre de temps
    callTimestamps.current = callTimestamps.current.filter(
      timestamp => now - timestamp < windowMs
    );

    // Vérifier si on dépasse la limite
    if (callTimestamps.current.length >= maxCalls) {
      const oldestCall = callTimestamps.current[0];
      const timeUntilNextCall = windowMs - (now - oldestCall);
      
      logger.warn('Rate limit exceeded', {
        action,
        maxCalls,
        windowMs,
        timeUntilNextCall,
        currentCalls: callTimestamps.current.length
      });

      return {
        allowed: false,
        remainingTime: timeUntilNextCall,
        remainingCalls: 0
      };
    }

    // Enregistrer cet appel
    callTimestamps.current.push(now);

    return {
      allowed: true,
      remainingTime: 0,
      remainingCalls: maxCalls - callTimestamps.current.length
    };
  }, [maxCalls, windowMs]);

  const rateLimitedFunction = useCallback((fn, action = 'unknown') => {
    return (...args) => {
      const result = checkRateLimit(action);

      if (!result.allowed) {
        logger.debug('Action blocked by rate limit', {
          action,
          remainingTime: result.remainingTime
        });
        return Promise.reject(new Error(
          `Trop de requêtes. Veuillez patienter ${Math.ceil(result.remainingTime / 1000)}s`
        ));
      }

      logger.debug('Action allowed by rate limit', {
        action,
        remainingCalls: result.remainingCalls
      });

      return fn(...args);
    };
  }, [checkRateLimit]);

  return rateLimitedFunction;
};

/**
 * Hook spécialisé pour limiter les interactions sur le feed
 * @returns {object} - Fonctions rate-limited pour les interactions
 */
export const useFeedRateLimit = () => {
  // Limite stricte: 1 interaction par seconde
  const rateLimitInteraction = useRateLimit(1, 1000);
  
  // Limite pour les commentaires: 3 par minute
  const rateLimitComment = useRateLimit(3, 60000);

  return {
    /**
     * Wrapper pour les likes/réactions
     * @param {function} fn - Fonction à rate-limiter
     */
    limitInteraction: useCallback((fn) => {
      return rateLimitInteraction(fn, 'feed-interaction');
    }, [rateLimitInteraction]),

    /**
     * Wrapper pour les commentaires
     * @param {function} fn - Fonction à rate-limiter
     */
    limitComment: useCallback((fn) => {
      return rateLimitComment(fn, 'feed-comment');
    }, [rateLimitComment])
  };
};
