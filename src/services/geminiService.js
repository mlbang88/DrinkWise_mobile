// src/services/geminiService.js
import { httpsCallable } from 'firebase/functions';

export class GeminiService {
    constructor(functions = null) {
        this.functions = functions;
        // Toutes les requêtes API sont maintenant sécurisées côté serveur
        this.analyzeImageSecure = functions ? httpsCallable(functions, 'analyzeImageSecure') : null;
        
        // Vérification de configuration au démarrage
        if (!this.analyzeImageSecure) {
            console.warn('⚠️ GeminiService: Firebase Functions non configuré. Le système IA ne fonctionnera pas.');
        } else {
            console.log('✅ GeminiService: Configuré avec Firebase Functions sécurisé');
        }
    }

    async analyzeImage(imageFile) {
        try {
            if (!this.analyzeImageSecure) {
                console.warn('🔑 Firebase Functions non configuré. Veuillez configurer le service Firebase.');
                alert('Service d\'analyse non configuré !\n\nLe service Firebase Functions est requis pour l\'analyse d\'images.');
                throw new Error('Firebase Functions non configuré');
            }

            // Convertir l'image en base64
            const base64Image = await this.convertToBase64(imageFile);
            
            console.log('🔍 Envoi de l\'image à Firebase Functions pour analyse...');
            
            // Appel sécurisé via Firebase Functions
            const result = await this.analyzeImageSecure({
                imageBase64: base64Image,
                mimeType: imageFile.type
            });

            if (result?.data?.success && result?.data?.drinkInfo) {
                console.log('🍹 Analyse réussie:', result.data.drinkInfo);
                return result.data.drinkInfo;
            } else {
                console.warn('⚠️ Réponse invalide du service:', result?.data);
                throw new Error('Réponse invalide du service d\'analyse');
            }
            
        } catch (error) {
            console.error('❌ Erreur analyse Gemini via Functions:', error);
            
            // Messages d'erreur plus spécifiques
            if (error.code === 'functions/unauthenticated') {
                throw new Error('Authentification requise pour l\'analyse d\'images');
            } else if (error.code === 'functions/permission-denied') {
                throw new Error('Permissions insuffisantes pour l\'analyse d\'images');
            } else if (error.code === 'functions/unavailable') {
                throw new Error('Service d\'analyse temporairement indisponible');
            }
            
            // Fallback gracieux
            return { type: 'Autre', brand: null };
        }
    }

    async convertToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                // Supprimer le préfixe data:image/...;base64,
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Méthode pour mapper les réponses Gemini vers nos types de boissons
    mapToAppDrinkType(drinkInfo) {
        // Si c'est l'ancien format (string), on le convertit
        if (typeof drinkInfo === 'string') {
            const mapping = {
                'Bière': 'Bière',
                'Mojito': 'Cocktail',
                'Whisky': 'Spiritueux',
                'Whiskey': 'Spiritueux',
                'Vin rouge': 'Vin',
                'Vin blanc': 'Vin',
                'Vin': 'Vin',
                'Vodka': 'Spiritueux',
                'Cocktail': 'Cocktail',
                'Rhum': 'Spiritueux',
                'Gin': 'Spiritueux',
                'Tequila': 'Spiritueux',
                'Champagne': 'Vin',
                'Prosecco': 'Vin',
                'Sangria': 'Cocktail',
                'Margarita': 'Cocktail',
                'Gin Tonic': 'Cocktail',
                'Cosmopolitan': 'Cocktail',
                'Bloody Mary': 'Cocktail'
            };
            return { type: mapping[drinkInfo] || 'Autre', brand: null };
        }
        
        // Nouveau format avec type et marque
        if (drinkInfo && typeof drinkInfo === 'object') {
            return {
                type: drinkInfo.type || 'Autre',
                brand: drinkInfo.brand || null
            };
        }
        
        return { type: 'Autre', brand: null };
    }
}

export default GeminiService;
