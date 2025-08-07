// Test relations d'amitié - coller dans la console du navigateur

async function checkFriendships() {
    console.log('👥 VÉRIFICATION DES RELATIONS D\'AMITIÉ');
    
    const db = firebase.firestore();
    const appId = 'drinkwise-mobile-app';
    
    // IDs des utilisateurs principaux
    const mlId = 'x6BFSJJCIbNQ2D6FCIR3W8Hg2vH3';
    const vinchId = 'T4mDJvOVKFPJEzBVr3VuWQPPA2x2';
    
    try {
        // Vérifier les amis de ML
        const mlDoc = await db.doc(`artifacts/${appId}/public_user_stats/${mlId}`).get();
        if (mlDoc.exists()) {
            const mlData = mlDoc.data();
            console.log(`👤 ML (${mlId}):`);
            console.log(`  - Username: ${mlData.username}`);
            console.log(`  - Amis: ${mlData.friends?.length || 0}`, mlData.friends);
        }
        
        // Vérifier les amis de Vinch
        const vinchDoc = await db.doc(`artifacts/${appId}/public_user_stats/${vinchId}`).get();
        if (vinchDoc.exists()) {
            const vinchData = vinchDoc.data();
            console.log(`👤 Vinch (${vinchId}):`);
            console.log(`  - Username: ${vinchData.username}`);
            console.log(`  - Amis: ${vinchData.friends?.length || 0}`, vinchData.friends);
        }
        
        // Vérifier si l'amitié est bidirectionnelle
        const mlFriends = mlDoc.data()?.friends || [];
        const vinchFriends = vinchDoc.data()?.friends || [];
        
        const mlHasVinch = mlFriends.includes(vinchId);
        const vinchHasML = vinchFriends.includes(mlId);
        
        console.log('🔗 Relations:');
        console.log(`  - ML a Vinch comme ami: ${mlHasVinch ? '✅' : '❌'}`);
        console.log(`  - Vinch a ML comme ami: ${vinchHasML ? '✅' : '❌'}`);
        console.log(`  - Amitié bidirectionnelle: ${mlHasVinch && vinchHasML ? '✅' : '❌'}`);
        
        // Vérifier les interactions existantes
        const interactionsRef = db.collection(`artifacts/${appId}/feed_interactions`);
        const allInteractions = await interactionsRef.get();
        
        console.log('\n📊 INTERACTIONS EXISTANTES:');
        const stats = { likes: 0, comments: 0, congratulations: 0 };
        
        allInteractions.docs.forEach(doc => {
            const data = doc.data();
            stats[data.type]++;
            
            if (data.type === 'comment') {
                console.log(`💬 "${data.content}" par ${data.userId} sur ${data.itemId}`);
            }
        });
        
        console.log('Total par type:', stats);
        
    } catch (error) {
        console.error('❌ Erreur vérification:', error);
    }
}

// Pour l'exécuter : checkFriendships()
console.log('📋 Script de vérification chargé. Exécutez: checkFriendships()');
