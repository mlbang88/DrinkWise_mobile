/**
 * 🛡️ Gestionnaire d'erreurs global pour DrinkWise
 * Capture, traite et reporte toutes les erreurs de l'application
 */

import { logger } from './logger.js';

class ErrorHandler {
  constructor() {
    this.isInitialized = false;
    this.errorQueue = [];
    this.maxQueueSize = 50;
    this.reportingEndpoint = null; // Pour futur service de monitoring
  }

  init() {
    if (this.isInitialized) return;

    // Erreurs JavaScript non catchées
    window.addEventListener('error', this.handleError.bind(this));
    
    // Promesses rejetées non gérées
    window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
    
    // Erreurs React (via Error Boundary)
    this.setupReactErrorBoundary();
    
    this.isInitialized = true;
    logger.info('ERROR_HANDLER', 'Gestionnaire d\'erreurs initialisé');
  }

  handleError(event) {
    const errorInfo = {
      type: 'javascript_error',
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.processError(errorInfo);
  }

  handlePromiseRejection(event) {
    const errorInfo = {
      type: 'unhandled_promise_rejection',
      message: event.reason?.message || String(event.reason),
      stack: event.reason?.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.processError(errorInfo);
    
    // Empêcher l'affichage dans la console (optionnel)
    event.preventDefault();
  }

  handleReactError(error, errorInfo) {
    const errorData = {
      type: 'react_error',
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.processError(errorData);
  }

  processError(errorInfo) {
    // Log de l'erreur
    logger.error('GLOBAL_ERROR', 'Erreur capturée', errorInfo);

    // Ajouter à la queue
    this.addToQueue(errorInfo);

    // Afficher une notification utilisateur si approprié
    this.showUserNotification(errorInfo);

    // Reporter l'erreur (si service configuré)
    this.reportError(errorInfo);
  }

  addToQueue(errorInfo) {
    this.errorQueue.push(errorInfo);
    
    // Maintenir la taille de la queue
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }

    // Sauvegarder localement
    this.saveErrorsLocally();
  }

  showUserNotification(errorInfo) {
    // Ne pas spammer l'utilisateur avec des erreurs techniques
    if (!this.shouldNotifyUser(errorInfo)) return;

    // Créer une notification discrète
    this.createErrorNotification(errorInfo);
  }

  shouldNotifyUser(errorInfo) {
    const criticalErrors = [
      'network',
      'authentication',
      'data_loss',
      'payment'
    ];

    // Ne notifier que pour les erreurs critiques ou récurrentes
    return criticalErrors.some(pattern => 
      errorInfo.message.toLowerCase().includes(pattern)
    );
  }

  createErrorNotification(errorInfo) {
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.innerHTML = `
      <div class="error-notification-content">
        <div class="error-icon">⚠️</div>
        <div class="error-text">
          <strong>Une erreur s'est produite</strong>
          <p>L'équipe technique a été notifiée. Veuillez réessayer.</p>
        </div>
        <button class="error-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

    // Style inline pour éviter les dépendances CSS
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      padding: 16px;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(239, 68, 68, 0.3);
      z-index: 10000;
      max-width: 300px;
      animation: slideIn 0.3s ease-out;
    `;

    // Ajouter au DOM
    document.body.appendChild(notification);

    // Auto-suppression après 8 secondes
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 8000);
  }

  saveErrorsLocally() {
    try {
      const recentErrors = this.errorQueue.slice(-10); // Garder seulement les 10 dernières
      localStorage.setItem('drinkwise_errors', JSON.stringify(recentErrors));
    } catch (error) {
      // localStorage plein ou non disponible
      logger.warn('ERROR_HANDLER', 'Impossible de sauvegarder les erreurs localement');
    }
  }

  async reportError(errorInfo) {
    if (!this.reportingEndpoint) return;

    try {
      await fetch(this.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...errorInfo,
          appVersion: '1.1.0',
          userId: this.getCurrentUserId(),
          sessionId: logger.sessionId
        })
      });
    } catch (reportingError) {
      logger.warn('ERROR_HANDLER', 'Échec du reporting d\'erreur:', reportingError);
    }
  }

  getCurrentUserId() {
    // Récupérer l'ID utilisateur depuis le contexte Firebase
    try {
      const user = JSON.parse(localStorage.getItem('firebase_user') || '{}');
      return user.uid || 'anonymous';
    } catch {
      return 'anonymous';
    }
  }

  setupReactErrorBoundary() {
    // Cette méthode sera utilisée par le composant ErrorBoundary
    window.DrinkWiseErrorHandler = this;
  }

  // Méthodes utilitaires pour les développeurs
  getErrorQueue() {
    return [...this.errorQueue];
  }

  clearErrorQueue() {
    this.errorQueue = [];
    localStorage.removeItem('drinkwise_errors');
    logger.info('ERROR_HANDLER', 'Queue d\'erreurs vidée');
  }

  getErrorStats() {
    const errors = this.errorQueue;
    const stats = {
      total: errors.length,
      byType: {},
      recent: errors.slice(-5)
    };

    errors.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
    });

    return stats;
  }

  // Configuration du service de reporting
  setReportingEndpoint(endpoint) {
    this.reportingEndpoint = endpoint;
    logger.info('ERROR_HANDLER', 'Endpoint de reporting configuré');
  }
}

// Instance singleton
export const errorHandler = new ErrorHandler();

// Initialisation automatique
if (typeof window !== 'undefined') {
  // Attendre que le DOM soit prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      errorHandler.init();
    });
  } else {
    errorHandler.init();
  }
}

// CSS pour les notifications d'erreur
const errorNotificationCSS = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .error-notification-content {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }
  
  .error-icon {
    font-size: 24px;
    flex-shrink: 0;
  }
  
  .error-text strong {
    display: block;
    margin-bottom: 4px;
    font-size: 14px;
  }
  
  .error-text p {
    margin: 0;
    font-size: 12px;
    opacity: 0.9;
  }
  
  .error-close {
    background: none;
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
    padding: 0;
    margin-left: auto;
    opacity: 0.7;
  }
  
  .error-close:hover {
    opacity: 1;
  }
`;

// Injecter le CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = errorNotificationCSS;
  document.head.appendChild(style);
}

export default errorHandler;