import React from 'react';
import ModernBackground from '../components/ModernBackground';
import GlassButton from '../components/GlassButton';
import { DrinkWiseImages } from '../assets/DrinkWiseImages';

/**
 * Page de test pour vérifier tous les composants visuels améliorés
 * Accessible uniquement en développement
 */
const VisualTestPage = () => {
    return (
        <ModernBackground>
            <div style={{ padding: '20px', minHeight: '100vh' }}>
                {/* Header de test */}
                <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    padding: '24px',
                    marginBottom: '32px',
                    textAlign: 'center'
                }}>
                    <h1 style={{
                        color: 'white',
                        fontSize: '32px',
                        fontWeight: '600',
                        margin: 0
                    }}>
                        Tests Visuels DrinkWise
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: '8px' }}>
                        Vérification des améliorations visuelles
                    </p>
                </div>

                {/* Test du logo */}
                <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    padding: '20px',
                    marginBottom: '20px',
                    textAlign: 'center'
                }}>
                    <h2 style={{ color: 'white', marginBottom: '16px' }}>Logo DrinkWise</h2>
                    <img 
                        src="/resources/icon.png"
                        alt="DrinkWise Logo"
                        style={{
                            width: '80px',
                            height: '80px',
                            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))'
                        }}
                    />
                </div>

                {/* Test des boutons glassmorphiques */}
                <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    padding: '20px',
                    marginBottom: '20px'
                }}>
                    <h2 style={{ color: 'white', marginBottom: '16px' }}>Boutons Glassmorphiques</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <GlassButton variant="default" size="small">
                            Bouton Default Small
                        </GlassButton>
                        <GlassButton variant="primary" size="medium">
                            Bouton Primary Medium
                        </GlassButton>
                        <GlassButton variant="secondary" size="large">
                            Bouton Secondary Large
                        </GlassButton>
                        <GlassButton disabled>
                            Bouton Disabled
                        </GlassButton>
                    </div>
                </div>

                {/* Test des backgrounds */}
                <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    padding: '20px',
                    marginBottom: '20px'
                }}>
                    <h2 style={{ color: 'white', marginBottom: '16px' }}>Background avec watermark</h2>
                    <p style={{ color: 'rgba(255,255,255,0.8)' }}>
                        Le logo DrinkWise devrait être visible en arrière-plan avec une opacité de 5%.
                        Le dégradé moderne devrait s'afficher correctement sur toutes les tailles d'écran.
                    </p>
                </div>

                {/* Test responsive */}
                <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    padding: '20px'
                }}>
                    <h2 style={{ color: 'white', marginBottom: '16px' }}>Test Responsive</h2>
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '12px'
                    }}>
                        <div style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            padding: '16px',
                            borderRadius: '12px',
                            textAlign: 'center'
                        }}>
                            <h3 style={{ color: 'white', margin: '0 0 8px 0', fontSize: '16px' }}>Mobile</h3>
                            <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, fontSize: '14px' }}>
                                Optimisé pour téléphones
                            </p>
                        </div>
                        <div style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            padding: '16px',
                            borderRadius: '12px',
                            textAlign: 'center'
                        }}>
                            <h3 style={{ color: 'white', margin: '0 0 8px 0', fontSize: '16px' }}>Tablet</h3>
                            <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, fontSize: '14px' }}>
                                Responsive design
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </ModernBackground>
    );
};

export default VisualTestPage;