/**
 * i18n - Système de traduction FR/EN pour DrinkWise
 * Permet de basculer entre français et anglais
 */

const translations = {
  fr: {
    // Navigation
    nav: {
      feed: 'Fil',
      stats: 'Stats',
      map: 'Carte',
      friends: 'Amis',
      profile: 'Profil'
    },
    
    // Feed
    feed: {
      title: 'Fil d\'actualité',
      empty: 'Aucune activité',
      emptyMessage: 'Ajoutez des amis ou créez votre première soirée pour voir des activités ici',
      emptyAction: 'Créer une soirée',
      refreshing: 'Actualisation...',
      pullToRefresh: 'Tirez pour actualiser',
      releaseToRefresh: 'Relâchez pour actualiser',
      loading: 'Chargement...',
      endOfFeed: '✨ Vous êtes à jour !',
      loadingMore: 'Chargement...',
      filters: {
        all: 'Tous',
        friends: 'Amis',
        own: 'Moi'
      }
    },
    
    // Posts
    post: {
      like: 'J\'aime',
      comment: 'Commenter',
      share: 'Partager',
      likes: 'J\'aiment',
      comments: 'Commentaires',
      addComment: 'Ajouter un commentaire...',
      send: 'Envoyer',
      delete: 'Supprimer',
      edit: 'Modifier',
      drinks: 'verres',
      girlsTalkedTo: 'filles parlées',
      xpGained: 'XP gagnés',
      withFriends: 'avec',
      inGroup: 'en groupe',
      viewMore: 'Voir plus',
      viewLess: 'Voir moins',
      viewMoreComments: 'Voir {count} autres commentaires',
      hideComments: 'Masquer les commentaires'
    },
    
    // Reactions
    reactions: {
      like: 'J\'aime',
      love: 'Amour',
      haha: 'Drôle',
      wow: 'Wow',
      sad: 'Triste',
      angry: 'Énervé'
    },
    
    // Errors
    error: {
      generic: 'Une erreur s\'est produite',
      network: 'Erreur de connexion',
      networkMessage: 'Vérifiez votre connexion internet et réessayez',
      loadFailed: 'Impossible de charger le contenu',
      retry: 'Réessayer',
      offline: 'Mode hors ligne - Certaines fonctionnalités sont limitées',
      online: 'Connexion rétablie',
      tooManyRequests: 'Trop de requêtes. Veuillez patienter',
      unauthorized: 'Vous devez être connecté',
      notFound: 'Contenu introuvable',
      serverError: 'Erreur serveur. Réessayez plus tard'
    },
    
    // Success messages
    success: {
      reactionAdded: 'Réaction ajoutée!',
      commentAdded: 'Commentaire ajouté!',
      postShared: 'Post partagé!',
      postDeleted: 'Post supprimé',
      postUpdated: 'Post mis à jour',
      friendAdded: 'Ami ajouté!',
      friendRemoved: 'Ami retiré'
    },
    
    // Profile
    profile: {
      level: 'Niveau',
      xp: 'XP',
      friends: 'Amis',
      parties: 'Soirées',
      badges: 'Badges',
      challenges: 'Défis',
      settings: 'Paramètres',
      logout: 'Déconnexion',
      edit: 'Modifier le profil'
    },
    
    // Stats
    stats: {
      title: 'Statistiques',
      overview: 'Vue d\'ensemble',
      thisWeek: 'Cette semaine',
      thisMonth: 'Ce mois',
      allTime: 'Tout',
      totalDrinks: 'Total de verres',
      totalParties: 'Total de soirées',
      averagePerNight: 'Moyenne par soirée',
      favoriteVenue: 'Lieu favori'
    },
    
    // Common
    common: {
      yes: 'Oui',
      no: 'Non',
      cancel: 'Annuler',
      confirm: 'Confirmer',
      save: 'Enregistrer',
      delete: 'Supprimer',
      edit: 'Modifier',
      close: 'Fermer',
      back: 'Retour',
      next: 'Suivant',
      skip: 'Passer',
      done: 'Terminé',
      search: 'Rechercher',
      filter: 'Filtrer',
      sort: 'Trier',
      loading: 'Chargement...',
      error: 'Erreur',
      success: 'Succès'
    }
  },
  
  en: {
    // Navigation
    nav: {
      feed: 'Feed',
      stats: 'Stats',
      map: 'Map',
      friends: 'Friends',
      profile: 'Profile'
    },
    
    // Feed
    feed: {
      title: 'News Feed',
      empty: 'No activity',
      emptyMessage: 'Add friends or create your first party to see activities here',
      emptyAction: 'Create a party',
      refreshing: 'Refreshing...',
      pullToRefresh: 'Pull to refresh',
      releaseToRefresh: 'Release to refresh',
      loading: 'Loading...',
      endOfFeed: '✨ You\'re all caught up!',
      loadingMore: 'Loading...',
      filters: {
        all: 'All',
        friends: 'Friends',
        own: 'Mine'
      }
    },
    
    // Posts
    post: {
      like: 'Like',
      comment: 'Comment',
      share: 'Share',
      likes: 'Likes',
      comments: 'Comments',
      addComment: 'Add a comment...',
      send: 'Send',
      delete: 'Delete',
      edit: 'Edit',
      drinks: 'drinks',
      girlsTalkedTo: 'girls talked to',
      xpGained: 'XP gained',
      withFriends: 'with',
      inGroup: 'in group',
      viewMore: 'View more',
      viewLess: 'View less',
      viewMoreComments: 'View {count} more comments',
      hideComments: 'Hide comments'
    },
    
    // Reactions
    reactions: {
      like: 'Like',
      love: 'Love',
      haha: 'Haha',
      wow: 'Wow',
      sad: 'Sad',
      angry: 'Angry'
    },
    
    // Errors
    error: {
      generic: 'An error occurred',
      network: 'Connection error',
      networkMessage: 'Check your internet connection and try again',
      loadFailed: 'Unable to load content',
      retry: 'Retry',
      offline: 'Offline mode - Some features are limited',
      online: 'Connection restored',
      tooManyRequests: 'Too many requests. Please wait',
      unauthorized: 'You must be logged in',
      notFound: 'Content not found',
      serverError: 'Server error. Try again later'
    },
    
    // Success messages
    success: {
      reactionAdded: 'Reaction added!',
      commentAdded: 'Comment added!',
      postShared: 'Post shared!',
      postDeleted: 'Post deleted',
      postUpdated: 'Post updated',
      friendAdded: 'Friend added!',
      friendRemoved: 'Friend removed'
    },
    
    // Profile
    profile: {
      level: 'Level',
      xp: 'XP',
      friends: 'Friends',
      parties: 'Parties',
      badges: 'Badges',
      challenges: 'Challenges',
      settings: 'Settings',
      logout: 'Logout',
      edit: 'Edit profile'
    },
    
    // Stats
    stats: {
      title: 'Statistics',
      overview: 'Overview',
      thisWeek: 'This week',
      thisMonth: 'This month',
      allTime: 'All time',
      totalDrinks: 'Total drinks',
      totalParties: 'Total parties',
      averagePerNight: 'Average per night',
      favoriteVenue: 'Favorite venue'
    },
    
    // Common
    common: {
      yes: 'Yes',
      no: 'No',
      cancel: 'Cancel',
      confirm: 'Confirm',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      skip: 'Skip',
      done: 'Done',
      search: 'Search',
      filter: 'Filter',
      sort: 'Sort',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success'
    }
  }
};

// Langue par défaut
let currentLanguage = 'fr';

// Détecter la langue du navigateur
const detectLanguage = () => {
  const browserLang = navigator.language || navigator.userLanguage;
  return browserLang.startsWith('en') ? 'en' : 'fr';
};

// Initialiser avec la langue du navigateur
currentLanguage = detectLanguage();

/**
 * Obtenir une traduction
 * @param {string} key - Clé de traduction (ex: 'feed.title')
 * @param {object} params - Paramètres pour interpolation
 * @returns {string} Traduction
 */
export const t = (key, params = {}) => {
  const keys = key.split('.');
  let value = translations[currentLanguage];
  
  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k];
    } else {
      return key; // Retourner la clé si traduction non trouvée
    }
  }
  
  // Interpolation de paramètres
  if (typeof value === 'string' && Object.keys(params).length > 0) {
    return value.replace(/\{(\w+)\}/g, (match, param) => {
      return params[param] !== undefined ? params[param] : match;
    });
  }
  
  return value || key;
};

/**
 * Changer la langue
 * @param {string} lang - 'fr' ou 'en'
 */
export const setLanguage = (lang) => {
  if (translations[lang]) {
    currentLanguage = lang;
    localStorage.setItem('drinkwise_language', lang);
    // Émettre un événement pour forcer le re-render
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }));
  }
};

/**
 * Obtenir la langue actuelle
 * @returns {string} 'fr' ou 'en'
 */
export const getLanguage = () => currentLanguage;

/**
 * Hook React pour les traductions
 */
export const useTranslation = () => {
  const [lang, setLang] = React.useState(currentLanguage);
  
  React.useEffect(() => {
    const handleLanguageChange = (e) => setLang(e.detail);
    window.addEventListener('languageChanged', handleLanguageChange);
    return () => window.removeEventListener('languageChanged', handleLanguageChange);
  }, []);
  
  return { t, setLanguage, language: lang };
};

// Charger la langue sauvegardée
const savedLanguage = localStorage.getItem('drinkwise_language');
if (savedLanguage && translations[savedLanguage]) {
  currentLanguage = savedLanguage;
}

export default { t, setLanguage, getLanguage, useTranslation };
