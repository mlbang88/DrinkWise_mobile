import React from 'react';
import { Shield, Zap, User } from 'lucide-react';

const SocialLoginBenefits = ({ onClose }) => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: '#1e293b',
                borderRadius: '16px',
                padding: '32px',
                maxWidth: '400px',
                width: '100%',
                border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
                <h3 style={{
                    color: 'white',
                    fontSize: '24px',
                    fontWeight: '600',
                    margin: '0 0 24px 0',
                    textAlign: 'center'
                }}>
                    Pourquoi utiliser la connexion sociale ?
                </h3>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    marginBottom: '32px'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <Zap size={20} style={{ color: '#f59e0b' }} />
                        <span style={{ color: 'white', fontSize: '16px' }}>
                            Connexion instantanée en un clic
                        </span>
                    </div>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <Shield size={20} style={{ color: '#10b981' }} />
                        <span style={{ color: 'white', fontSize: '16px' }}>
                            Sécurité renforcée avec OAuth 2.0
                        </span>
                    </div>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <User size={20} style={{ color: '#8b5cf6' }} />
                        <span style={{ color: 'white', fontSize: '16px' }}>
                            Profil automatiquement rempli
                        </span>
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    gap: '12px'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1,
                            padding: '12px 24px',
                            backgroundColor: 'transparent',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '16px',
                            cursor: 'pointer'
                        }}
                    >
                        Fermer
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1,
                            padding: '12px 24px',
                            backgroundColor: '#8b45ff',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        Compris !
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SocialLoginBenefits;