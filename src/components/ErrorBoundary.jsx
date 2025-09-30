import React from 'react';
import { logger } from '../utils/logger.js';

/**
 * 🛡️ Error Boundary pour capturer les erreurs React
 * Affiche une interface de fallback élégante en cas d'erreur
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Met à jour le state pour afficher l'UI de fallback
    return { 
      hasError: true,
      errorId: `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error, errorInfo) {
    // Capturer les détails de l'erreur
    this.setState({
      error,
      errorInfo
    });

    // Logger l'erreur
    logger.error('REACT_BOUNDARY', 'Erreur React capturée', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId
    });

    // Notifier le gestionnaire d'erreurs global
    if (window.DrinkWiseErrorHandler) {
      window.DrinkWiseErrorHandler.handleReactError(error, errorInfo);
    }
  }

  handleRetry = () => {
    // Réinitialiser l'état pour retenter le rendu
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });

    logger.info('REACT_BOUNDARY', 'Tentative de récupération après erreur');
  };

  handleReload = () => {
    // Recharger complètement la page
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Interface de fallback personnalisée
      return (
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(16px)',
            borderRadius: '20px',
            padding: '40px',
            maxWidth: '500px',
            textAlign: 'center',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Icône d'erreur */}
            <div style={{
              fontSize: '64px',
              marginBottom: '24px'
            }}>
              🚨
            </div>

            {/* Titre */}
            <h1 style={{
              fontSize: '2rem',
              marginBottom: '16px',
              fontWeight: '600'
            }}>
              Oups ! Quelque chose s'est mal passé
            </h1>

            {/* Description */}
            <p style={{
              fontSize: '1.1rem',
              marginBottom: '32px',
              opacity: 0.9,
              lineHeight: '1.6'
            }}>
              Une erreur inattendue s'est produite. L'équipe technique a été automatiquement notifiée.
            </p>

            {/* Détails de l'erreur (mode développement uniquement) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '16px',
                borderRadius: '12px',
                marginBottom: '24px',
                textAlign: 'left'
              }}>
                <summary style={{
                  cursor: 'pointer',
                  fontWeight: '600',
                  marginBottom: '12px'
                }}>
                  Détails techniques (dev)
                </summary>
                <div style={{
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  background: 'rgba(0, 0, 0, 0.2)',
                  padding: '12px',
                  borderRadius: '8px',
                  wordBreak: 'break-word'
                }}>
                  <strong>Erreur:</strong> {this.state.error.message}<br/>
                  <strong>ID:</strong> {this.state.errorId}<br/>
                  <strong>Stack:</strong>
                  <pre style={{ margin: '8px 0', whiteSpace: 'pre-wrap' }}>
                    {this.state.error.stack}
                  </pre>
                </div>
              </details>
            )}

            {/* Boutons d'action */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={this.handleRetry}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '16px 24px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 10px 20px rgba(16, 185, 129, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                🔄 Réessayer
              </button>

              <button
                onClick={this.handleReload}
                style={{
                  background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '16px 24px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 10px 20px rgba(124, 58, 237, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                🔄 Recharger la page
              </button>
            </div>

            {/* Informations additionnelles */}
            <div style={{
              marginTop: '32px',
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              fontSize: '14px',
              opacity: 0.8
            }}>
              <p style={{ margin: '0 0 8px 0' }}>
                <strong>💡 Conseils :</strong>
              </p>
              <ul style={{ 
                textAlign: 'left', 
                margin: 0, 
                paddingLeft: '20px',
                lineHeight: '1.5'
              }}>
                <li>Vérifiez votre connexion internet</li>
                <li>Actualisez la page (F5)</li>
                <li>Videz le cache de votre navigateur</li>
                <li>Contactez le support si le problème persiste</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    // Rendu normal si pas d'erreur
    return this.props.children;
  }
}

export default ErrorBoundary;