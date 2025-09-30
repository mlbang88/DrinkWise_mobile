/**
 * Utilitaire pour s'assurer que les images ont des attributs alt appropriés
 */

/**
 * Ajoute automatiquement des attributs alt manquants aux images
 */
export const ensureImageAccessibility = () => {
  // Attendre que le DOM soit chargé
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addMissingAltAttributes);
  } else {
    addMissingAltAttributes();
  }
};

/**
 * Ajoute des attributs alt aux images qui n'en ont pas
 */
const addMissingAltAttributes = () => {
  const images = document.querySelectorAll('img:not([alt])');
  
  images.forEach((img, index) => {
    // Générer un alt basé sur le src ou un fallback générique
    let altText = 'Image';
    
    if (img.src) {
      if (img.src.includes('icon') || img.src.includes('logo')) {
        altText = 'DrinkWise Logo';
      } else if (img.src.includes('background')) {
        altText = 'Image de fond décorative';
      } else if (img.src.includes('photo') || img.src.includes('picture')) {
        altText = 'Photo de soirée';
      } else if (img.src.includes('avatar') || img.src.includes('profile')) {
        altText = 'Photo de profil';
      } else if (img.src.startsWith('data:image')) {
        altText = 'Image générée automatiquement';
      } else {
        altText = `Image ${index + 1}`;
      }
    }
    
    img.setAttribute('alt', altText);
    console.log(`Alt automatique ajouté: "${altText}" pour image:`, img.src?.substring(0, 50) || 'source inconnue');
  });
};

/**
 * Observer pour les images ajoutées dynamiquement
 */
export const observeImageChanges = () => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Vérifier si c'est une image
            if (node.tagName === 'IMG' && !node.hasAttribute('alt')) {
              const altText = node.src?.includes('data:image') 
                ? 'Image générée automatiquement' 
                : 'Image ajoutée dynamiquement';
              node.setAttribute('alt', altText);
            }
            
            // Vérifier les images dans les enfants
            const childImages = node.querySelectorAll?.('img:not([alt])');
            childImages?.forEach((img) => {
              const altText = img.src?.includes('data:image') 
                ? 'Image générée automatiquement' 
                : 'Image ajoutée dynamiquement';
              img.setAttribute('alt', altText);
            });
          }
        });
      }
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  return observer;
};