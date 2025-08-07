// Test commentaire - coller dans la console du navigateur
// Sur localhost:5174 après s'être connecté

async function createTestComment() {
    console.log('🧪 CRÉATION D\'UN COMMENTAIRE DE TEST');
    
    // Récupérer les informations utilisateur depuis l'app
    const user = window.user; // Depuis le contexte global de l'app
    const appId = 'drinkwise-mobile-app';
    
    if (!user) {
        console.error('❌ Utilisateur non connecté');
        return;
    }
    
    console.log('👤 Utilisateur:', user.uid);
    
    // Récupérer la fonction Firebase
    const functions = firebase.functions();
    const handleFeedInteraction = functions.httpsCallable('handleFeedInteraction');
    
    // ID d'un item de test (remplacer par un vrai ID de soirée)
    const testItemId = 'vgf3V1ZIjpXrCzkbpzmI'; 
    const testOwnerId = 'x6BFSJJCIbNQ2D6FCIR3W8Hg2vH3'; // ML
    
    try {
        const result = await handleFeedInteraction({
            itemId: testItemId,
            itemType: 'party',
            ownerId: testOwnerId,
            interactionType: 'comment',
            content: 'Test commentaire ' + new Date().toLocaleTimeString(),
            appId: appId
        });
        
        console.log('✅ Commentaire créé:', result.data);
        
        // Recharger les interactions pour voir le nouveau commentaire
        const getFeedInteractions = functions.httpsCallable('getFeedInteractions');
        const interactions = await getFeedInteractions({ 
            itemId: testItemId,
            appId: appId 
        });
        
        console.log('📊 Interactions après création:', interactions.data);
        
    } catch (error) {
        console.error('❌ Erreur création commentaire:', error);
    }
}

// Pour l'exécuter dans la console : createTestComment()
console.log('📋 Script de test chargé. Exécutez: createTestComment()');
