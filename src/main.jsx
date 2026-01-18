import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css'; // Ne pas oublier d'importer le CSS
import { ensureImageAccessibility, observeImageChanges } from './utils/imageAccessibility.js';
import { initSentry } from './utils/sentry.js';
import { initPerformanceTracking } from './utils/performance.js';

// 🔴 Initialiser Sentry en premier (avant React)
initSentry();

// 📊 Initialiser le tracking de performance
initPerformanceTracking();

// Enregistrement du Service Worker pour PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker enregistré:', registration.scope);
        
        // Vérifier les mises à jour toutes les 5 minutes
        setInterval(() => {
          registration.update().then(() => {
            console.log('🔄 Vérification mise à jour SW');
          });
        }, 5 * 60 * 1000); // 5 minutes
        
        // Écouter les mises à jour du Service Worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Nouvelle version disponible
                console.log('🆕 Nouvelle version disponible !');
                showUpdateNotification();
              }
            });
          }
        });
      })
      .catch((error) => {
        console.log('❌ Erreur Service Worker:', error);
      });
  });

  // Écouter les messages du Service Worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
      console.log('🆕 Mise à jour détectée, version:', event.data.version);
      showUpdateNotification();
    }
  });
}

// Fonction pour notifier l'utilisateur d'une mise à jour
function showUpdateNotification() {
  // Créer une notification discrète
  const updateBanner = document.createElement('div');
  updateBanner.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(45deg, #667eea, #764ba2);
      color: white;
      padding: 12px;
      text-align: center;
      z-index: 10000;
      font-family: Arial, sans-serif;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    ">
      🆕 Nouvelle version disponible ! 
      <button onclick="window.location.reload()" style="
        background: rgba(255,255,255,0.2);
        border: 1px solid rgba(255,255,255,0.3);
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        margin-left: 10px;
        cursor: pointer;
        font-weight: bold;
      ">
        Mettre à jour
      </button>
      <button onclick="this.parentElement.parentElement.remove()" style="
        background: transparent;
        border: none;
        color: white;
        margin-left: 10px;
        cursor: pointer;
        font-size: 18px;
      ">
        ×
      </button>
    </div>
  `;
  document.body.appendChild(updateBanner);
  
  // Auto-masquer après 10 secondes
  setTimeout(() => {
    if (updateBanner.parentElement) {
      updateBanner.remove();
    }
  }, 10000);
}

// Initialiser l'accessibilité des images
ensureImageAccessibility();
observeImageChanges();

// StrictMode désactivé pour éviter les doubles montages/chargements
// En dev, StrictMode exécute tout 2 fois pour détecter les effets de bord
// Cela causait des chargements en double du feed et des interactions
ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)