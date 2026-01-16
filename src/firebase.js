// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from "firebase/functions";
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyD_Gi_m1IRhl8SfgfIU6x0erT5pxeaUM5o",
  authDomain: "drinkwise-31d3a.firebaseapp.com",
  projectId: "drinkwise-31d3a",
  storageBucket: "drinkwise-31d3a.firebasestorage.app",
  messagingSenderId: "210028837880",
  appId: "AIzaSyD_Gi_m1IRhl8SfgfIU6x0erT5pxeaUM5o",
  measurementId: "G-RHZNKFRZVF"
};

// Initialiser Firebase avec gestion d'erreurs
let app, auth, db, functions, storage, appId;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  functions = getFunctions(app);
  storage = getStorage(app);
  appId = firebaseConfig.projectId;
  
  console.log('✅ Firebase initialisé avec succès');
} catch (error) {
  console.error('❌ Erreur initialisation Firebase:', error?.message || String(error));
  throw error;
}

export { app, auth, db, functions, storage, appId };