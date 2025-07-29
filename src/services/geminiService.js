// src/services/geminiService.js
export class GeminiService {
    constructor() {
        this.apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
        
        // Vérification de configuration au démarrage
        if (!this.apiKey || this.apiKey === 'your_actual_api_key_here') {
            console.warn('⚠️ GeminiService: Clé API non configurée. Le système IA ne fonctionnera pas.');
        } else {
            console.log('✅ GeminiService: Configuré avec succès');
        }
    }

    async analyzeImage(imageFile) {
        try {
            if (!this.apiKey || this.apiKey === 'your_actual_api_key_here') {
                console.warn('🔑 Clé API Gemini non configurée. Veuillez ajouter votre clé dans le fichier .env');
                alert('Clé API Gemini manquante !\n\nVeuillez :\n1. Obtenir une clé sur https://makersuite.google.com/app/apikey\n2. L\'ajouter dans le fichier .env\n3. Redémarrer l\'application');
                throw new Error('Clé API Gemini non configurée');
            }

            // Convertir l'image en base64
            const base64Image = await this.convertToBase64(imageFile);
            
            const payload = {
                contents: [{
                    parts: [
                        {
                            text: `Analyse cette image et identifie la boisson visible. 
                            Réponds au format JSON avec les clés "type" et "brand" (marque).
                            
                            Pour le type, utilise l'un de ces termes : "Bière", "Vin", "Spiritueux", "Cocktail", "Autre"
                            Pour la marque, identifie la marque visible sur l'étiquette/bouteille (ex: "Heineken", "Corona", "Absolut", "Jack Daniel's", etc.)
                            Si aucune marque n'est visible ou identifiable, mets "brand": null
                            
                            Exemple de réponse:
                            {"type": "Bière", "brand": "Heineken"}
                            {"type": "Spiritueux", "brand": "Jack Daniel's"}
                            {"type": "Vin", "brand": null}
                            
                            Si aucune boisson n'est visible, réponds: {"type": "Autre", "brand": null}`
                        },
                        {
                            inline_data: {
                                mime_type: imageFile.type,
                                data: base64Image
                            }
                        }
                    ]
                }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 50
                }
            };

            const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                if (response.status === 400) {
                    console.error('🔑 Erreur 400: Clé API invalide ou requête malformée');
                    throw new Error('Clé API Gemini invalide. Vérifiez votre clé dans le fichier .env');
                } else if (response.status === 403) {
                    console.error('🚫 Erreur 403: Accès interdit - vérifiez vos permissions API');
                    throw new Error('Accès interdit à l\'API Gemini');
                } else if (response.status === 429) {
                    console.error('⏰ Erreur 429: Limite de taux dépassée');
                    throw new Error('Trop de requêtes - attendez un moment');
                }
                throw new Error(`Erreur API: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
                const responseText = data.candidates[0].content.parts[0].text.trim();
                console.log('🍹 Réponse brute de Gemini:', responseText);
                
                try {
                    // Nettoyer la réponse en supprimant les balises markdown
                    let cleanedResponse = responseText;
                    
                    // Supprimer les blocs de code markdown (```json...``` ou ```...```)
                    cleanedResponse = cleanedResponse.replace(/```json\s*\n?/g, '');
                    cleanedResponse = cleanedResponse.replace(/```\s*\n?/g, '');
                    cleanedResponse = cleanedResponse.replace(/\n/g, '');
                    cleanedResponse = cleanedResponse.trim();
                    
                    console.log('🧹 Réponse nettoyée:', cleanedResponse);
                    
                    // Essayer de parser le JSON
                    const drinkInfo = JSON.parse(cleanedResponse);
                    console.log('🍹 Boisson détectée par Gemini:', drinkInfo);
                    return drinkInfo;
                } catch (parseError) {
                    console.warn('⚠️ Réponse non JSON, fallback vers format legacy');
                    // Fallback vers l'ancien format si la réponse n'est pas en JSON
                    return { type: responseText, brand: null };
                }
            }
            
            throw new Error('Réponse invalide de Gemini');
        } catch (error) {
            console.error('Erreur analyse Gemini:', error);
            return { type: 'Autre', brand: null }; // Fallback
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
