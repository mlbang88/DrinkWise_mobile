// 🚀 Service Worker moderne pour DrinkWise PWA
const CACHE_NAME = 'drinkwise-v1.1.0';
const OFFLINE_URL = '/offline.html';
const UPDATE_CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes

// Configuration des ressources à mettre en cache
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/resources/icon.png'
];

// Patterns d'URL pour les stratégies de cache
const CACHE_PATTERNS = {
  API: /^https:\/\/.*firestore\.googleapis\.com/,
  FIREBASE_AUTH: /^https:\/\/.*firebaseapp\.com/,
  IMAGES: /\.(jpg|jpeg|png|gif|webp|svg)$/i,
  ASSETS: /\.(css|js|woff2|woff)$/i,
  STATIC: /^\/(?:assets|resources)\//
};

// 🔧 Installation
self.addEventListener('install', (event) => {
  console.log(`🔧 SW: Installation ${CACHE_NAME}`);
  
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        console.log('📦 Cache ouvert:', CACHE_NAME);
        
        await cache.addAll(PRECACHE_ASSETS);
        console.log('✅ Précache terminé');
        
        // Forcer activation immédiate
        await self.skipWaiting();
        console.log('⚡ Skip waiting activé');
        
      } catch (error) {
        console.error('❌ Erreur installation SW:', error);
        // Ne pas bloquer l'installation sur erreur de cache
      }
    })()
  );
});

// 🚀 Activation
self.addEventListener('activate', (event) => {
  console.log(`🚀 SW: Activation ${CACHE_NAME}`);
  
  event.waitUntil(
    (async () => {
      try {
        // Nettoyage des anciens caches
        const cacheNames = await caches.keys();
        const deletePromises = cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME && cacheName.startsWith('drinkwise-'))
          .map(cacheName => {
            console.log('🗑️ Suppression cache:', cacheName);
            return caches.delete(cacheName);
          });
        
        await Promise.all(deletePromises);
        
        // Prendre contrôle immédiat
        await self.clients.claim();
        console.log('✅ SW activé et contrôle pris');
        
        // Démarrer vérification des mises à jour
        startUpdateCheck();
        
      } catch (error) {
        console.error('❌ Erreur activation SW:', error);
      }
    })()
  );
});

// 🌐 Interception des requêtes
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') return;
  
  // Ignorer les requêtes Chrome extensions
  if (url.protocol === 'chrome-extension:') return;
  
  event.respondWith(handleRequest(request));
});

// 📨 Messages entre SW et app
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'GET_VERSION':
      event.ports[0]?.postMessage({ version: CACHE_NAME });
      break;
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0]?.postMessage({ success: true });
      });
      break;
    default:
      if (type) {
        console.log('📨 Message SW non géré:', type);
      }
      // Ignorer les messages sans type (souvent des messages internes)
  }
});

// 🔄 Gestion des requêtes selon la stratégie
async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // API Firebase - Network First
    if (CACHE_PATTERNS.API.test(url.href) || CACHE_PATTERNS.FIREBASE_AUTH.test(url.href)) {
      return await networkFirst(request);
    }
    
    // Assets statiques - Cache First
    if (CACHE_PATTERNS.STATIC.test(url.pathname) || CACHE_PATTERNS.ASSETS.test(url.pathname)) {
      return await cacheFirst(request);
    }
    
    // Images - Stale While Revalidate
    if (CACHE_PATTERNS.IMAGES.test(url.pathname)) {
      return await staleWhileRevalidate(request);
    }
    
    // Pages HTML - Network First avec fallback offline
    if (request.destination === 'document') {
      return await networkFirstWithOffline(request);
    }
    
    // Défaut - Network First
    return await networkFirst(request);
    
  } catch (error) {
    console.error('❌ Erreur handling request:', request.url, error);
    return new Response('Service Unavailable', { status: 503 });
  }
}

// Stratégie Network First
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Mettre en cache les réponses valides
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

// Stratégie Cache First
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    return new Response('Asset not available', { status: 404 });
  }
}

// Stratégie Stale While Revalidate
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Mise à jour en arrière-plan
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => null);
  
  // Retourner immédiatement la version cache ou attendre le réseau
  return cachedResponse || fetchPromise;
}

// Network First avec page offline
async function networkFirstWithOffline(request) {
  try {
    return await fetch(request);
  } catch (error) {
    // Fallback vers la page d'accueil si offline
    const fallbackResponse = await caches.match('/');
    return fallbackResponse || new Response('Offline', { 
      status: 503,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// 🔄 Vérification des mises à jour
function startUpdateCheck() {
  // Vérification immédiate
  checkForUpdate();
  
  // Puis vérifications périodiques
  setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL);
}

async function checkForUpdate() {
  try {
    const response = await fetch('/version.json', { 
      cache: 'no-cache',
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    if (!response.ok) return;
    
    const data = await response.json();
    const currentVersion = CACHE_NAME.split('-v')[1];
    
    if (data.version !== currentVersion) {
      console.log(`🆕 Nouvelle version: ${data.version} (actuelle: ${currentVersion})`);
      
      // Notifier tous les clients
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'UPDATE_AVAILABLE',
          version: data.version,
          currentVersion
        });
      });
    }
  } catch (error) {
    console.log('⚠️ Erreur vérification mise à jour:', error.message);
  }
}

// 🧹 Nettoyage complet du cache
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  const deletePromises = cacheNames.map(name => caches.delete(name));
  await Promise.all(deletePromises);
  console.log('🧹 Tous les caches supprimés');
}