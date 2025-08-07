import React from 'react';

const MobileTestPage = () => {
    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            padding: 'clamp(16px, 5vw, 24px)',
            fontFamily: 'Arial, sans-serif',
            color: 'white'
        }}>
            <h1 style={{
                fontSize: 'clamp(20px, 6vw, 28px)',
                marginBottom: '24px',
                textAlign: 'center'
            }}>
                Test Mobile Responsive
            </h1>

            {/* Test de texte long */}
            <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: 'clamp(12px, 4vw, 16px)',
                marginBottom: '16px',
                overflow: 'hidden'
            }}>
                <h3 style={{
                    fontSize: 'clamp(16px, 4vw, 18px)',
                    marginBottom: '8px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    Nom d'utilisateur très très très long qui pourrait déborder
                </h3>
                <p style={{
                    fontSize: 'clamp(13px, 3.5vw, 14px)',
                    lineHeight: '1.4',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                    hyphens: 'auto',
                    margin: 0
                }}>
                    Ceci est un texte très long qui devrait se découper automatiquement et ne jamais déborder du conteneur même sur les plus petits écrans mobiles. Il contient des mots très longs comme antidisestablishmentarianism.
                </p>
            </div>

            {/* Test de commentaire */}
            <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
                display: 'flex',
                gap: '10px',
                width: '100%',
                maxWidth: '100%',
                overflow: 'hidden'
            }}>
                <div style={{
                    width: '24px',
                    height: '24px',
                    backgroundColor: '#8b45ff',
                    borderRadius: '50%',
                    flexShrink: 0
                }} />
                <div style={{ 
                    flex: 1, 
                    minWidth: 0,
                    overflow: 'hidden'
                }}>
                    <div style={{ 
                        color: '#60a5fa', 
                        fontSize: 'clamp(11px, 3vw, 12px)',
                        fontWeight: '600', 
                        marginBottom: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}>
                        UtilisateurAvecUnNomTrèsTrèsLong
                    </div>
                    <div style={{ 
                        color: 'white', 
                        fontSize: 'clamp(13px, 3.5vw, 14px)',
                        lineHeight: '1.4',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        wordBreak: 'break-word',
                        hyphens: 'auto'
                    }}>
                        Commentaire avec un texte très long qui contient des mots complexes et devrait se découper automatiquement sans jamais déborder!
                    </div>
                </div>
            </div>

            {/* Test de zone de saisie */}
            <div style={{ 
                display: 'flex', 
                gap: '8px', 
                marginBottom: '16px',
                width: '100%',
                maxWidth: '100%',
                overflow: 'hidden'
            }}>
                <input
                    type="text"
                    placeholder="Tapez quelque chose de très long ici..."
                    style={{
                        flex: 1,
                        minWidth: 0,
                        maxWidth: '100%',
                        padding: 'clamp(6px, 2vw, 8px) clamp(8px, 3vw, 12px)',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: 'clamp(12px, 3.5vw, 14px)',
                        outline: 'none',
                        boxSizing: 'border-box'
                    }}
                />
                <button
                    style={{
                        padding: 'clamp(6px, 2vw, 8px) clamp(12px, 4vw, 16px)',
                        backgroundColor: '#3b82f6',
                        border: 'none',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: 'clamp(11px, 3vw, 12px)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        minWidth: 'clamp(40px, 12vw, 60px)'
                    }}
                >
                    Envoyer
                </button>
            </div>

            {/* Test de boutons d'action */}
            <div style={{ 
                display: 'flex', 
                gap: 'clamp(8px, 4vw, 16px)',
                marginBottom: '16px',
                flexWrap: 'wrap',
                width: '100%',
                maxWidth: '100%',
                overflow: 'hidden'
            }}>
                <button style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    fontSize: 'clamp(12px, 3.5vw, 14px)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: 'clamp(4px, 2vw, 8px)',
                    minHeight: '44px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}>
                    ❤️ J'aime (123)
                </button>
                
                <button style={{
                    background: 'none',
                    border: 'none',
                    color: '#60a5fa',
                    fontSize: 'clamp(12px, 3.5vw, 14px)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: 'clamp(4px, 2vw, 8px)',
                    minHeight: '44px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}>
                    💬 Commenter (456)
                </button>
            </div>

            {/* Test de grille stats */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                gap: 'clamp(8px, 3vw, 12px)',
                width: '100%',
                marginBottom: '16px'
            }}>
                <div style={{ 
                    color: '#9ca3af', 
                    fontSize: 'clamp(12px, 3.5vw, 14px)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    padding: '8px',
                    borderRadius: '6px'
                }}>
                    🍺 15 boissons
                </div>
                <div style={{ 
                    color: '#9ca3af', 
                    fontSize: 'clamp(12px, 3.5vw, 14px)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    padding: '8px',
                    borderRadius: '6px'
                }}>
                    👥 3 personnes
                </div>
                <div style={{ 
                    color: '#9ca3af', 
                    fontSize: 'clamp(12px, 3.5vw, 14px)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    padding: '8px',
                    borderRadius: '6px'
                }}>
                    🤮 0 vomissements
                </div>
            </div>

            <div style={{
                padding: 'clamp(12px, 4vw, 16px)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '8px',
                textAlign: 'center'
            }}>
                <p style={{
                    margin: 0,
                    fontSize: 'clamp(13px, 3.5vw, 14px)',
                    color: '#22c55e'
                }}>
                    ✅ Tous les textes sont maintenant responsifs et ne dépassent jamais du conteneur !
                </p>
            </div>
        </div>
    );
};

export default MobileTestPage;
