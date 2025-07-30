// src/utils/usernameUtils.js
import { collection, query, where, getDocs } from 'firebase/firestore';

/**
 * Vérifie si un nom d'utilisateur est déjà pris
 * @param {Object} db - Instance Firestore
 * @param {string} appId - ID de l'application
 * @param {string} username - Nom d'utilisateur à vérifier
 * @param {string} excludeUserId - ID utilisateur à exclure de la vérification (pour les mises à jour)
 * @returns {Promise<boolean>} - true si le username est disponible
 */
export const isUsernameAvailable = async (db, appId, username, excludeUserId = null) => {
    try {
        // Utiliser public_user_stats qui est accessible en lecture pour tous les utilisateurs authentifiés
        const publicStatsRef = collection(db, `artifacts/${appId}/public_user_stats`);
        const snapshot = await getDocs(publicStatsRef);
        
        // Parcourir tous les documents pour chercher le username
        for (const doc of snapshot.docs) {
            const data = doc.data();
            // Vérifier si le username correspond (insensible à la casse)
            if (data.username && data.username.toLowerCase() === username.toLowerCase()) {
                // Si c'est l'utilisateur actuel, c'est OK
                if (excludeUserId && doc.id === excludeUserId) {
                    continue;
                }
                // Sinon le username est déjà pris
                return false;
            }
        }
        
        return true; // Username disponible
    } catch (error) {
        console.error("❌ Erreur vérification username:", error);
        // En cas d'erreur, considérer comme non disponible par sécurité
        return false;
    }
};

/**
 * Génère un nom d'utilisateur unique en ajoutant des numéros si nécessaire
 * @param {Object} db - Instance Firestore
 * @param {string} appId - ID de l'application
 * @param {string} baseUsername - Nom d'utilisateur de base
 * @param {string} excludeUserId - ID utilisateur à exclure de la vérification
 * @returns {Promise<string>} - Nom d'utilisateur unique
 */
export const generateUniqueUsername = async (db, appId, baseUsername, excludeUserId = null) => {
    // Nettoyer le username de base
    let cleanUsername = baseUsername
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, '') // Garder lettres, chiffres, underscore et tiret
        .substring(0, 18); // Limiter à 18 caractères pour laisser place aux numéros
    
    // Si le username est vide après nettoyage, utiliser un défaut
    if (!cleanUsername || cleanUsername.length < 2) {
        cleanUsername = 'user';
    }
    
    // Vérifier si le username de base est disponible
    if (await isUsernameAvailable(db, appId, cleanUsername, excludeUserId)) {
        return cleanUsername;
    }
    
    // Sinon, essayer avec des numéros
    let counter = 1;
    let uniqueUsername = `${cleanUsername}${counter}`;
    
    while (!(await isUsernameAvailable(db, appId, uniqueUsername, excludeUserId))) {
        counter++;
        uniqueUsername = `${cleanUsername}${counter}`;
        
        // Éviter une boucle infinie
        if (counter > 999) {
            uniqueUsername = `user${Date.now().toString().slice(-6)}`;
            break;
        }
    }
    
    return uniqueUsername;
};

/**
 * Valide un nom d'utilisateur selon les règles définies
 * @param {string} username - Nom d'utilisateur à valider
 * @returns {Object} - { isValid: boolean, error: string }
 */
export const validateUsername = (username) => {
    if (!username || username.trim() === '') {
        return { isValid: false, error: "Le nom d'utilisateur ne peut pas être vide." };
    }
    
    const cleanUsername = username.trim();
    
    if (cleanUsername.length < 2) {
        return { isValid: false, error: "Le nom d'utilisateur doit contenir au moins 2 caractères." };
    }
    
    if (cleanUsername.length > 20) {
        return { isValid: false, error: "Le nom d'utilisateur ne peut pas dépasser 20 caractères." };
    }
    
    // Vérifier les caractères autorisés (lettres, chiffres, underscore, tiret)
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    if (!validPattern.test(cleanUsername)) {
        return { isValid: false, error: "Le nom d'utilisateur ne peut contenir que des lettres, chiffres, _ et -." };
    }
    
    // Interdire certains mots réservés
    const reservedWords = ['admin', 'system', 'root', 'user', 'null', 'undefined', 'api'];
    if (reservedWords.includes(cleanUsername.toLowerCase())) {
        return { isValid: false, error: "Ce nom d'utilisateur est réservé." };
    }
    
    return { isValid: true, error: null };
};
