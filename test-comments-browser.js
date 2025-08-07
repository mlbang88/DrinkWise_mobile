// Script de test des commentaires simple
// À exécuter dans la console du navigateur sur localhost:5174

async function testCommentsVisibility() {
    console.log('🔍 TEST DE VISIBILITÉ DES COMMENTAIRES');
    console.log('====================================');
    
    // Récupérer les fonctions Firebase depuis l'app
    const functions = window.firebase?.functions;
    const appId = 'drinkwise-mobile-app';
    
    if (!functions) {
        console.error('❌ Firebase Functions non disponible');
        return;
    }
    
    // Fonction de test
    const getFeedInteractions = firebase.functions().httpsCallable('getFeedInteractions');
    
    // Tester avec un item spécifique
    const testItemId = 'vgf3V1ZIjpXrCzkbpzmI'; // Remplacer par un vrai ID
    
    try {
        console.log(`📥 Test récupération interactions pour: ${testItemId}`);
        
        const result = await getFeedInteractions({ 
            itemId: testItemId,
            appId: appId 
        });
        
        console.log('✅ Résultat:', result.data);
        
        if (result.data.success) {
            const interactions = result.data.interactions;
            console.log(`📊 Statistiques:
            - Likes: ${interactions.likes?.length || 0}
            - Commentaires: ${interactions.comments?.length || 0}
            - Félicitations: ${interactions.congratulations?.length || 0}`);
            
            if (interactions.comments?.length > 0) {
                console.log('💬 Commentaires trouvés:');
                interactions.comments.forEach((comment, i) => {
                    console.log(`${i + 1}. "${comment.content}" par ${comment.userId}`);
                });
            } else {
                console.log('❌ Aucun commentaire visible');
            }
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    }
}

// Pour l'exécuter : testCommentsVisibility()
console.log('📋 Script chargé. Exécutez: testCommentsVisibility()');
