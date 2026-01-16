import React from 'react';

/**
 * Composant de fallback pour afficher un état d'erreur avec possibilité de réessayer
 * @param {string} message - Message d'erreur à afficher
 * @param {function} onRetry - Fonction appelée lors du clic sur "Réessayer"
 * @param {string} icon - Emoji à afficher (par défaut ⚠️)
 */
const ErrorFallback = ({ message = 'Une erreur est survenue', onRetry, icon = '⚠️' }) => {
    return (
        <div
            role="alert"
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 20px',
                textAlign: 'center',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '2px dashed rgba(239, 68, 68, 0.3)',
                borderRadius: '16px',
                minHeight: '200px'
            }}
        >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                {icon}
            </div>
            <p style={{ 
                color: 'white', 
                fontSize: '16px', 
                fontWeight: '600',
                marginBottom: '8px' 
            }}>
                {message}
            </p>
            {onRetry && (
                <>
                    <p style={{ 
                        color: '#9ca3af', 
                        fontSize: '14px',
                        marginBottom: '20px' 
                    }}>
                        Vérifiez votre connexion et réessayez
                    </p>
                    <button
                        onClick={onRetry}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#ef4444',
                            border: 'none',
                            borderRadius: '12px',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
                    >
                        🔄 Réessayer
                    </button>
                </>
            )}
        </div>
    );
};

/**
 * Composant d'état vide (pas de données)
 * @param {string} message - Message à afficher
 * @param {string} icon - Emoji à afficher
 * @param {function} action - Action optionnelle avec texte et callback
 */
export const EmptyState = ({ 
    message = 'Aucune donnée disponible', 
    icon = '📭',
    action = null
}) => {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 20px',
                textAlign: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '2px dashed rgba(255, 255, 255, 0.2)',
                borderRadius: '16px',
                minHeight: '200px'
            }}
        >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                {icon}
            </div>
            <p style={{ 
                color: 'white', 
                fontSize: '16px', 
                fontWeight: '600',
                marginBottom: '8px' 
            }}>
                {message}
            </p>
            {action && (
                <button
                    onClick={action.onClick}
                    style={{
                        marginTop: '16px',
                        padding: '12px 24px',
                        backgroundColor: '#667eea',
                        border: 'none',
                        borderRadius: '12px',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#5568d3'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#667eea'}
                >
                    {action.label}
                </button>
            )}
        </div>
    );
};

/**
 * Composant de chargement avec spinner
 * @param {string} message - Message optionnel à afficher
 */
export const LoadingFallback = ({ message = 'Chargement...' }) => {
    return (
        <div
            role="status"
            aria-live="polite"
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 20px',
                minHeight: '200px'
            }}
        >
            <div
                style={{
                    width: '48px',
                    height: '48px',
                    border: '4px solid rgba(102, 126, 234, 0.2)',
                    borderTop: '4px solid #667eea',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginBottom: '16px'
                }}
            />
            <p style={{ 
                color: '#9ca3af', 
                fontSize: '14px' 
            }}>
                {message}
            </p>
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default ErrorFallback;
