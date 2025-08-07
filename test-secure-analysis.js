// Test de l'analyse d'images sécurisée
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyD_Gi_m1IRhl8SfgfIU6x0erT5pxeaUM5o",
  authDomain: "drinkwise-31d3a.firebaseapp.com",
  projectId: "drinkwise-31d3a",
  storageBucket: "drinkwise-31d3a.firebasestorage.app",
  messagingSenderId: "210028837880",
  appId: "1:210028837880:web:0177bf8f388354b4a0f40d"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions = getFunctions(app);

async function testSecureImageAnalysis() {
    try {
        console.log('🔐 Test de l\'analyse d\'images sécurisée...');
        
        // 1. Authentification anonyme pour tester
        console.log('🔑 Authentification...');
        await signInAnonymously(auth);
        console.log('✅ Authentifié avec succès');
        
        // 2. Créer une image de test simple en base64
        // Image 1x1 pixel rouge en format PNG
        const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
        
        // 3. Appeler la fonction sécurisée
        console.log('🤖 Appel de la fonction analyzeImageSecure...');
        const analyzeImageSecure = httpsCallable(functions, 'analyzeImageSecure');
        
        const result = await analyzeImageSecure({
            imageBase64: testImageBase64,
            mimeType: 'image/png'
        });
        
        console.log('✅ Résultat de l\'analyse:', result.data);
        
        if (result.data.success) {
            console.log('🎉 SUCCÈS ! L\'analyse sécurisée fonctionne !');
            console.log('📊 Boisson détectée:', result.data.drinkInfo);
        } else {
            console.log('⚠️ Échec de l\'analyse:', result.data);
        }
        
    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
        
        if (error.code === 'functions/unauthenticated') {
            console.log('🔑 Erreur d\'authentification - vérifiez les permissions');
        } else if (error.code === 'functions/not-found') {
            console.log('🔍 Fonction non trouvée - vérifiez le déploiement');
        } else if (error.code === 'functions/internal') {
            console.log('⚙️ Erreur interne - vérifiez la clé API Gemini');
        }
    }
}

// Exporter la fonction de test
window.testSecureImageAnalysis = testSecureImageAnalysis;

console.log('🔧 Script de test chargé ! Tapez testSecureImageAnalysis() dans la console pour tester.');
