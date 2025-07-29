// src/components/ConfigHelper.jsx
import React from 'react';

const ConfigHelper = ({ show, onClose }) => {
    if (!show) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '20px',
                padding: '30px',
                maxWidth: '500px',
                width: '100%',
                color: 'white',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
            }}>
                <div style={{
                    textAlign: 'center',
                    marginBottom: '25px'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '10px' }}>🤖</div>
                    <h2 style={{ margin: 0, fontSize: '24px' }}>Configuration IA requise</h2>
                </div>

                <div style={{
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '15px',
                    padding: '20px',
                    marginBottom: '20px'
                }}>
                    <h3 style={{ margin: '0 0 15px 0', fontSize: '18px' }}>📋 Étapes à suivre :</h3>
                    <ol style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.6' }}>
                        <li>Allez sur <strong>makersuite.google.com/app/apikey</strong></li>
                        <li>Créez un compte Google (gratuit)</li>
                        <li>Cliquez sur "Create API Key"</li>
                        <li>Copiez votre clé API</li>
                        <li>Ouvrez le fichier <strong>.env</strong> à la racine du projet</li>
                        <li>Remplacez <code>your_actual_api_key_here</code> par votre clé</li>
                        <li>Sauvegardez et redémarrez l'app</li>
                    </ol>
                </div>

                <div style={{
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '15px',
                    padding: '15px',
                    marginBottom: '25px',
                    fontSize: '14px'
                }}>
                    <strong>💡 Note :</strong> L'API Gemini est gratuite avec quotas généreux pour le développement.
                </div>

                <button
                    onClick={onClose}
                    style={{
                        width: '100%',
                        padding: '15px',
                        background: 'rgba(255,255,255,0.2)',
                        border: 'none',
                        borderRadius: '10px',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
                    onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
                >
                    J'ai compris
                </button>
            </div>
        </div>
    );
};

export default ConfigHelper;
