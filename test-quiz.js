// Test de déclenchement de quiz - À coller dans la console du navigateur

console.log("🧪 TEST DE DÉCLENCHEMENT DE QUIZ");

// Nettoyer d'abord le localStorage
localStorage.removeItem('drinkwise_quiz_active');
localStorage.removeItem('drinkwise_quiz_data');
localStorage.removeItem('drinkwise_quiz_id');
localStorage.removeItem('drinkwise_quiz_trigger');

console.log("🧹 localStorage nettoyé");

// Créer des données de test
const testPartyData = {
    timestamp: new Date(),
    friends: ["Test Friend"],
    drinks: [
        { name: "Bière", quantity: 2, time: "20:00" },
        { name: "Vin", quantity: 1, time: "21:00" }
    ],
    location: "Test Location",
    mood: "good"
};

// Stocker le quiz de test
localStorage.setItem('drinkwise_quiz_data', JSON.stringify(testPartyData));
localStorage.setItem('drinkwise_quiz_id', 'test-quiz-' + Date.now());
localStorage.setItem('drinkwise_quiz_active', 'true');
localStorage.setItem('drinkwise_quiz_from_party', 'false');
localStorage.setItem('drinkwise_quiz_trigger', Date.now().toString());

console.log("💾 Quiz de test stocké");
console.log("📊 Données:", testPartyData);

// Vérifier le stockage
console.log("🔍 Vérification localStorage:");
console.log("Quiz actif:", localStorage.getItem('drinkwise_quiz_active'));
console.log("Quiz data:", localStorage.getItem('drinkwise_quiz_data'));
console.log("Quiz ID:", localStorage.getItem('drinkwise_quiz_id'));
console.log("Quiz trigger:", localStorage.getItem('drinkwise_quiz_trigger'));

console.log("✅ Test terminé - Le quiz devrait apparaître maintenant !");
