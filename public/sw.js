// Service Worker optimisé pour mises à jour PWA
const CACHE_NAME = 'drinkwise-v1.0.0';
const STATIC_CACHE = 'drinkwise-static-v1.0.0';

// URLs à mettre en cache
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/index.css',
  '/src/App.css'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installation...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Cache ouvert, ajout des ressources...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Service Worker installé avec succès');
        // Force l'activation immédiate
        return self.skipWaiting();
      })
  );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activation...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Supprimer les anciens caches
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
            console.log('🗑️ Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker activé');
      // Prend le contrôle immédiatement
      return self.clients.claim();
    })
  );
});

// Stratégie de cache Network First pour les mises à jour rapides
self.addEventListener('fetch', (event) => {
  // Filtrer seulement les requêtes GET pour éviter l'erreur de cache
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la requête réseau réussit, mettre en cache et retourner
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseClone);
            });
        }
        return response;
      })
      .catch(() => {
        // En cas d'échec réseau, utiliser le cache
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            // Si pas en cache, retourner page offline
            if (event.request.destination === 'document') {
              return caches.match('/');
            }
          });
      })
  );
});

// Écouter les messages pour forcer la mise à jour
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('🔄 Force la mise à jour du Service Worker');
    self.skipWaiting();
  }
});

// Notification de nouvelle version disponible
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHECK_UPDATE') {
    // Vérifier s'il y a une nouvelle version
    checkForUpdate();
  }
});

function checkForUpdate() {
  // Logique de vérification de mise à jour
  fetch('/version.json')
    .then(response => response.json())
    .then(data => {
      // Comparer avec la version actuelle
      const currentVersion = CACHE_NAME.split('-v')[1];
      if (data.version !== currentVersion) {
        // Notifier l'app principale qu'une mise à jour est disponible
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'UPDATE_AVAILABLE',
              version: data.version
            });
          });
        });
      }
    })
    .catch(err => console.log('Erreur vérification version:', err));
}
