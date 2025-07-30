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
  appId: "1:210028837880:web:0177bf8f388354b4a0f40d",
  measurementId: "G-RHZNKFRZVF"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);
const storage = getStorage(app);
const appId = firebaseConfig.projectId;

export { app, auth, db, functions, storage, appId };