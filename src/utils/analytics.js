import { logEvent as firebaseLogEvent, setUserId, setUserProperties } from 'firebase/analytics';
import { logger } from './logger';

/**
 * Wrapper pour Firebase Analytics
 * Facilite le tracking des événements avec fallback en développement
 */

let analytics = null;

/**
 * Initialiser Analytics (appelé depuis firebase.js)
 */
export const initAnalytics = (analyticsInstance) => {
  analytics = analyticsInstance;
  logger.info('Analytics: Initialized');
};

/**
 * Logger un événement Analytics
 */
export const logEvent = (eventName, eventParams = {}) => {
  try {
    if (import.meta.env.DEV) {
      logger.debug('Analytics Event', { eventName, ...eventParams });
      return;
    }

    if (!analytics) {
      logger.warn('Analytics not initialized');
      return;
    }

    firebaseLogEvent(analytics, eventName, eventParams);
    logger.debug('Analytics Event logged', { eventName });
  } catch (error) {
    logger.error('Error logging Analytics event', error);
  }
};

/**
 * Définir l'ID utilisateur pour Analytics
 */
export const setAnalyticsUserId = (userId) => {
  try {
    if (!analytics) return;
    setUserId(analytics, userId);
    logger.info('Analytics: User ID set', { userId });
  } catch (error) {
    logger.error('Error setting Analytics user ID', error);
  }
};

/**
 * Définir les propriétés utilisateur
 */
export const setAnalyticsUserProperties = (properties) => {
  try {
    if (!analytics) return;
    setUserProperties(analytics, properties);
    logger.debug('Analytics: User properties set', properties);
  } catch (error) {
    logger.error('Error setting Analytics user properties', error);
  }
};

// ===== ÉVÉNEMENTS SPÉCIFIQUES AU FEED =====

/**
 * Événement: Vue du feed
 */
export const logFeedView = (itemsCount) => {
  logEvent('feed_view', {
    items_count: itemsCount,
    timestamp: Date.now()
  });
};

/**
 * Événement: Like/Réaction sur un post
 */
export const logFeedInteraction = (interactionType, itemType, itemId) => {
  logEvent('feed_interaction', {
    interaction_type: interactionType, // 'like', 'love', 'haha', etc.
    item_type: itemType, // 'party', 'achievement', etc.
    item_id: itemId
  });
};

/**
 * Événement: Commentaire ajouté
 */
export const logFeedComment = (itemType, itemId, commentLength) => {
  logEvent('feed_comment', {
    item_type: itemType,
    item_id: itemId,
    comment_length: commentLength
  });
};

/**
 * Événement: Partage de contenu
 */
export const logFeedShare = (itemType, itemId, shareMethod) => {
  logEvent('share', {
    content_type: itemType,
    item_id: itemId,
    method: shareMethod // 'native', 'copy', etc.
  });
};

/**
 * Événement: Scroll profondeur du feed
 */
export const logFeedScroll = (depth, maxDepth) => {
  logEvent('feed_scroll', {
    depth: depth, // Nombre d'items scrollés
    max_depth: maxDepth, // Nombre total d'items
    scroll_percentage: Math.round((depth / maxDepth) * 100)
  });
};

/**
 * Événement: Refresh manuel du feed
 */
export const logFeedRefresh = () => {
  logEvent('feed_refresh', {
    timestamp: Date.now()
  });
};

/**
 * Événement: Temps passé sur le feed
 */
export const logFeedTimeSpent = (timeInSeconds) => {
  logEvent('feed_time_spent', {
    duration_seconds: timeInSeconds
  });
};

/**
 * Événement: Erreur dans le feed
 */
export const logFeedError = (errorType, errorMessage) => {
  logEvent('feed_error', {
    error_type: errorType,
    error_message: errorMessage
  });
};

// ===== ÉVÉNEMENTS GÉNÉRAUX =====

/**
 * Événement: Navigation entre pages
 */
export const logScreenView = (screenName) => {
  logEvent('screen_view', {
    screen_name: screenName
  });
};

/**
 * Événement: Recherche
 */
export const logSearch = (searchTerm, resultCount) => {
  logEvent('search', {
    search_term: searchTerm,
    result_count: resultCount
  });
};

/**
 * Événement: Sélection de contenu
 */
export const logSelectContent = (contentType, itemId) => {
  logEvent('select_content', {
    content_type: contentType,
    item_id: itemId
  });
};

/**
 * Événement: Connexion utilisateur
 */
export const logLogin = (method) => {
  logEvent('login', {
    method: method // 'email', 'google', 'facebook', etc.
  });
};

/**
 * Événement: Inscription utilisateur
 */
export const logSignUp = (method) => {
  logEvent('sign_up', {
    method: method
  });
};
