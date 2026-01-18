import * as Sentry from "@sentry/react";

export const initSentry = () => {
  // Ne pas initialiser Sentry en développement
  if (import.meta.env.DEV) {
    console.log('Sentry disabled in development mode');
    return;
  }

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN || "",
    
    // Performance Monitoring
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
    // Réduire en production pour économiser les ressources
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,

    // Capture Replay for 10% of all sessions,
    // plus 100% of sessions with an error
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Environment
    environment: import.meta.env.MODE,

    // Release tracking (à connecter avec votre CI/CD)
    release: `drinkwise@${import.meta.env.VITE_APP_VERSION || 'development'}`,

    // Filtrer les erreurs non importantes
    beforeSend(event, hint) {
      // Ignorer les erreurs de réseau temporaires
      const error = hint.originalException;
      if (error && error.message) {
        if (error.message.includes('Network request failed')) {
          return null;
        }
        if (error.message.includes('Failed to fetch')) {
          return null;
        }
      }

      // Enrichir le contexte
      if (event.request) {
        event.request.headers = {
          ...event.request.headers,
          'User-Agent': navigator.userAgent
        };
      }

      return event;
    },

    // Ignorer certaines URLs
    ignoreErrors: [
      // Erreurs du navigateur
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      
      // Erreurs de scripts tiers
      'Non-Error promise rejection captured',
      
      // Erreurs iOS Safari
      'SecurityError',
    ],

    // Breadcrumbs pour le contexte
    maxBreadcrumbs: 50,
    
    // Ne pas envoyer les données sensibles
    sendDefaultPii: false,
  });

  // Tags globaux utiles
  Sentry.setTag('app.name', 'DrinkWise');
  Sentry.setTag('app.platform', 'web');
};

// Helper pour capturer les erreurs manuellement
export const captureException = (error, context = {}) => {
  console.error('Error captured:', error, context);
  
  if (import.meta.env.DEV) {
    return;
  }

  Sentry.captureException(error, {
    contexts: { custom: context }
  });
};

// Helper pour capturer des messages
export const captureMessage = (message, level = 'info', context = {}) => {
  console.log(`[${level}]`, message, context);
  
  if (import.meta.env.DEV) {
    return;
  }

  Sentry.captureMessage(message, {
    level,
    contexts: { custom: context }
  });
};

// Helper pour définir le contexte utilisateur
export const setSentryUser = (user) => {
  if (import.meta.env.DEV) {
    return;
  }

  if (user) {
    Sentry.setUser({
      id: user.uid,
      username: user.displayName || user.email,
      email: user.email
    });
  } else {
    Sentry.setUser(null);
  }
};

// Helper pour créer un breadcrumb personnalisé
export const addBreadcrumb = (category, message, data = {}) => {
  if (import.meta.env.DEV) {
    return;
  }

  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level: 'info'
  });
};
