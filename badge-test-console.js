// Script de test pour forcer le déblocage du badge "first_party"
// À exécuter dans la console du navigateur

const testFirstPartyBadge = async () => {
    console.log("🧪 Test du badge 'first_party'");
    
    // Simuler des données d'une première soirée
    const testPartyData = {
        drinks: [{ type: 'Bière', brand: 'Heineken', quantity: 3 }],
        girlsTalkedTo: 2,
        fights: 0,
        recal: 0,
        vomi: 0,
        location: 'Test Location',
        category: 'Bar',
        date: '2025-08-22'
    };
    
    // Simuler un profil utilisateur SANS badges (pour déclencher first_party)
    const testUserProfile = {
        username: 'TestUser',
        xp: 0,
        level: 1,
        totalParties: 0,
        unlockedBadges: [] // IMPORTANT: liste vide pour déclencher first_party
    };
    
    console.log("📊 Données de test:", { testPartyData, testUserProfile });
    
    // Vous pouvez maintenant créer une vraie soirée et voir si le badge se débloque
    return { testPartyData, testUserProfile };
};

// Affichage des badges disponibles
const showAvailableBadges = () => {
    console.log("🏆 Badges disponibles:");
    console.log("1. first_party - Première soirée (should trigger immediately)");
    console.log("2. drinks_1 - 50 verres total");
    console.log("3. drinks_2 - 250 verres total");
    console.log("4. drinks_3 - 1000 verres total");
    console.log("5. vomi_1 - Premier vomi");
    console.log("6. fights_1 - 5 bagarres");
    console.log("7. iron_stomach - >10 verres sans vomir");
    console.log("8. legendary_night - >15 verres en une soirée");
    console.log("Pour tester, créez une nouvelle soirée!");
};

// Pour voir les badges actuellement débloqués
const checkCurrentBadges = () => {
    // Cette fonction doit être appelée avec le contexte Firebase
    console.log("🔍 Pour voir vos badges actuels:");
    console.log("1. Allez sur la page Badges");
    console.log("2. Ou vérifiez userProfile.unlockedBadges dans la console");
};

console.log("🧪 Fonctions de test disponibles:");
console.log("- testFirstPartyBadge()");
console.log("- showAvailableBadges()");
console.log("- checkCurrentBadges()");

window.testFirstPartyBadge = testFirstPartyBadge;
window.showAvailableBadges = showAvailableBadges;
window.checkCurrentBadges = checkCurrentBadges;
