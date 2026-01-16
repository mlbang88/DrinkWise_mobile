// Service de mise en cache pour optimiser les performances
class CacheService {
    constructor() {
        this.cache = new Map();
        this.timestamps = new Map();
        this.defaultTtl = 5 * 60 * 1000; // 5 minutes par défaut
    }

    // Générer une clé de cache basée sur la collection et les paramètres
    generateKey(collection, params = {}) {
        const sortedParams = Object.keys(params)
            .sort()
            .reduce((result, key) => {
                result[key] = params[key];
                return result;
            }, {});
        
        return `${collection}_${JSON.stringify(sortedParams)}`;
    }

    // Récupérer des données du cache
    get(key) {
        const data = this.cache.get(key);
        const timestamp = this.timestamps.get(key);
        
        if (!data || !timestamp) {
            return null;
        }

        // Vérifier si les données sont expirées
        const now = Date.now();
        if (now - timestamp > this.defaultTtl) {
            this.delete(key);
            return null;
        }

        return data;
    }

    // Stocker des données dans le cache
    set(key, data, ttl = this.defaultTtl) {
        this.cache.set(key, data);
        this.timestamps.set(key, Date.now());
        
        // Auto-nettoyage après expiration
        setTimeout(() => {
            this.delete(key);
        }, ttl);
    }

    // Supprimer une entrée du cache
    delete(key) {
        this.cache.delete(key);
        this.timestamps.delete(key);
    }

    // Vider tout le cache
    clear() {
        this.cache.clear();
        this.timestamps.clear();
    }

    // Obtenir la taille actuelle du cache
    size() {
        return this.cache.size;
    }

    // Nettoyer les entrées expirées
    cleanup() {
        const now = Date.now();
        const expiredKeys = [];

        this.timestamps.forEach((timestamp, key) => {
            if (now - timestamp > this.defaultTtl) {
                expiredKeys.push(key);
            }
        });

        expiredKeys.forEach(key => this.delete(key));
        
        return expiredKeys.length;
    }

    // Invalider le cache pour un pattern spécifique
    invalidatePattern(pattern) {
        const keys = Array.from(this.cache.keys());
        const matchingKeys = keys.filter(key => key.includes(pattern));
        
        matchingKeys.forEach(key => this.delete(key));
        
        return matchingKeys.length;
    }
}

// Instance globale du service de cache
export const cacheService = new CacheService();

// Helper pour créer des fonctions de fetch avec cache
export const createCachedFetch = (fetchFunction, cacheKey, ttl) => {
    return async (...args) => {
        const key = `${cacheKey}_${JSON.stringify(args)}`;
        
        // Essayer de récupérer du cache d'abord
        const cached = cacheService.get(key);
        if (cached) {
            return cached;
        }

        // Si pas en cache, faire l'appel
        try {
            const result = await fetchFunction(...args);
            cacheService.set(key, result, ttl);
            return result;
        } catch (error) {
            console.error(`Erreur lors du fetch pour ${cacheKey}:`, error?.message || String(error));
            throw error;
        }
    };
};

// Nettoyer périodiquement le cache
setInterval(() => {
    const cleaned = cacheService.cleanup();
    if (cleaned > 0) {
        console.log(`🧹 Cache nettoyé: ${cleaned} entrées expirées supprimées`);
    }
}, 60000); // Nettoyer toutes les minutes